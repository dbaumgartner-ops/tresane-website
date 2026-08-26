// Cleanup over content/blog/*.md. Safe to re-run: every rule is idempotent.
//
// The posts came out of an AI drafting conversation, so each one carries notes
// ABOUT writing the post mixed in with the post: "Trimming:", "Graphic Phrase:",
// character counts, a shortened duplicate of the title. Those notes are also
// where nearly every em dash lived, so removing them serves the brand rule too.
//
// THE RULE THAT DOES THE REAL WORK is not the pattern list, it is this:
// everything before the first REAL paragraph is scaffolding. A list of labels
// will always miss the next label nobody predicted ("Trimming:" got through a
// list that had "trim" in it, because \b does not match mid-word).
import fs from 'node:fs'
import path from 'node:path'

const SRC = 'content/blog'

// Legitimate headings. These may appear before prose and must survive.
const SECTION = /^(opening reflection|naming the pattern|expanded perspective|what steady leaders tend to notice|closing reflection|the story|what this reveals about leadership|where misalignment begins|patterns that repeat over time|reflection as a leadership pattern|return to the story|introduction)/i

// Production notes, anywhere in the file.
const JUNK = [
  /^\(?\d+\s*characters?\b/i,
  /^trim/i,                                   // Trim, Trimmed, Trimming:
  /^graphic\b/i,                              // Graphic:, Graphic Phrase:
  /^(image|alt text|caption|photo)\b\s*:/i,
  /^(meta description|slug|url|focus keyphrase|primary keyword|secondary keywords?|location modifier|seo title|title|theme|keyword|category|tags?|word count|reading time|cta)\s*:/i,
  /^blog\s*[,:-]?\s*(mon|tue|wed|thur|thu|fri|sat|sun)/i,
  /^(newsletter|blog|social|linkedin)\s*(\(revised\))?\s*:?$/i,
  /^(revised|option \d|version \d)\b/i,
  /^(wordpress|yoast|rankmath)\b/i,
  /^(here is|below is|perfect\.|paste the|copy the|note:|instructions?:)/i,
]

const isJunk = t => JUNK.some(rx => rx.test(t))
const isProse = t => t.length > 100 && !isJunk(t)

let changed = 0, trimmedTop = []

for (const file of fs.readdirSync(SRC).filter(f => f.endsWith('.md'))) {
  const p = path.join(SRC, file)
  const raw = fs.readFileSync(p, 'utf8')
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!m) continue

  let fm = m[1]
  const title = (fm.match(/^title:\s*"(.*)"$/m) || [, ''])[1]
  let body = m[2].split(/\r?\n/).map(s => s.trim()).filter(Boolean)

  // 0. An explicit "FULL BLOG" / "FULL SEO BLOG" marker means the drafting
  //    conversation is above it and the post is below. Cut there first, because
  //    a stray meta description sitting above the marker is long enough to look
  //    like a real paragraph and would otherwise survive rule 1.
  const marker = body.map((t, i) => /^full[ ]+(seo[ ]+)?blog/i.test(t) ? i : -1)
    .filter(i => i >= 0).pop()
  if (marker >= 0) body = body.slice(marker + 1)

  // 1. Drop everything before the first real paragraph or genuine heading.
  //    This is what catches labels nobody thought to list.
  const start = body.findIndex(t => isProse(t) || SECTION.test(t))
  if (start > 0) { trimmedTop.push(`${file.slice(0, 34)}: dropped ${start}`); body = body.slice(start) }

  // 1c. A bare keyword left on its own line ("executive coaching").
  body = body.filter(t =>
    !(t.length < 42 && !/[.!?:]$/.test(t) && t === t.toLowerCase() && !SECTION.test(t)))

  // 1b. A lone meta description survives rule 1 because it is long enough to
  //     look like prose. What gives it away is that it is ONE sentence, and a
  //     real opening paragraph almost never is.
  const sentences = t => t.split(/[.!?](?=s|$)/).filter(x => x && x.trim().length > 12).length
  if (body.length > 1 && sentences(body[0]) === 1 && body[0].length < 210 && sentences(body[1]) > 1) {
    body = body.slice(1)
  }

  // 1d. "Opening Reflection" / "Introduction" at the very top is a label on the
  //     opening paragraph, not a section of the post. David: start in the story.
  //     Only the FIRST one goes; the mid-post headings are real structure.
  if (body.length && /^(opening reflection|introduction)$/i.test(body[0])) body = body.slice(1)

  // 2. Junk can also appear mid-document, between sections.
  body = body.filter(t => !isJunk(t))

  // 3. A shortened echo of the title is a drafting artefact, not a heading.
  const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
  body = body.filter(t =>
    !(t.length < 70 && !SECTION.test(t) && norm(title).startsWith(norm(t)) && norm(t).length > 12))

  // 4. A domain label prefixing a line is a heading artefact.
  body = body.map(l => l.replace(/^(Align (?:Self|Relationships|Teams))\s*[—–-]\s*/, ''))

  // 5. No em or en dashes, in the body or the front matter.
  const fixDashes = s => s
    .replace(/\s*[—–]\s*$/g, '')
    .replace(/^\s*[—–]\s*/g, '')
    .replace(/(\w)\s*[—–]\s*(\w)/g, '$1, $2')
    .replace(/\s*[—–]\s*/g, ', ')
  body = body.map(fixDashes)
  fm = fm.split('\n').map(l => /^(title|excerpt):/.test(l) ? fixDashes(l) : l).join('\n')

  // 6. An excerpt built from a production note is not an excerpt.
  const ex = fm.match(/^excerpt:\s*"([^"]*)"/m)
  if (ex && (isJunk(ex[1]) || /\bcharacters?\b|\btrim\b/i.test(ex[1]) || ex[1].length < 60)) {
    const first = body.find(isProse)
    if (first) fm = fm.replace(/^excerpt:\s*".*"$/m,
      'excerpt: "' + first.replace(/"/g, "'").slice(0, 220) + '"')
  }

  const out = '---\n' + fm + '\n---\n' + body.join('\n\n') + '\n'
  if (out !== raw) { fs.writeFileSync(p, out); changed++ }
}

console.log(changed + ' of 24 files changed')
if (trimmedTop.length) {
  console.log('\nscaffolding removed from the top of:')
  trimmedTop.forEach(t => console.log('  ' + t))
}
const left = fs.readdirSync(SRC).reduce((n, f) =>
  n + ((fs.readFileSync(path.join(SRC, f), 'utf8').match(/[–—]/g) || []).length), 0)
console.log('\nem/en dashes remaining: ' + left)
