// One-off cleanup over content/blog/*.md.
//
// Two jobs that turned out to be the same job: the em-dashes David flagged were
// almost all inside PRODUCTION SCAFFOLDING the extractor let through ("BLOG —
// Thursday, May 21", "(134 characters — trimming)"), not inside prose. Removing
// the scaffolding removes most of the dashes.
//
// Safe to re-run: every rule is idempotent.
import fs from 'node:fs'
import path from 'node:path'

const SRC = 'content/blog'

// Lines that are production notes, never content.
const JUNK = [
  /^\(?\d+\s*characters?\b/i,              // "(134 characters — trimming)"
  /^blog\s*[—-]\s*(mon|tue|wed|thur|thu|fri|sat|sun)/i,
  /^(newsletter|blog|social|linkedin)\s*(\(revised\))?$/i,
  /^(graphic|image|alt text|caption)\s*:/i,
  /^(trim|trimmed|revised|option \d)\b/i,
  /^(wordpress|yoast|rankmath)\b/i,
  /^\(.*\b(trim|character|word count|version)\b.*\)$/i,
]

let changed = 0, dashesLeft = []

for (const file of fs.readdirSync(SRC).filter(f => f.endsWith('.md'))) {
  const p = path.join(SRC, file)
  const raw = fs.readFileSync(p, 'utf8')
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!m) continue

  let fm = m[1]
  let body = m[2].split(/\r?\n/)

  // 1. Drop scaffolding lines.
  body = body.filter(line => {
    const t = line.trim()
    if (!t) return true
    return !JUNK.some(rx => rx.test(t))
  })

  // 2. A domain label prefixing a line is a heading artefact, not prose.
  body = body.map(line =>
    line.replace(/^(Align (?:Self|Relationships|Teams))\s*[—–-]\s*/, ''))

  // 3. Remaining em/en dashes become punctuation that reads as written rather
  //    than generated. A dash between clauses becomes a comma; a dash used as a
  //    colon (label — value) becomes a colon.
  const fixDashes = s => s
    .replace(/\s*[—–]\s*$/g, '')                 // trailing
    .replace(/^\s*[—–]\s*/g, '')                 // leading
    .replace(/(\w)\s*[—–]\s*(\w)/g, '$1, $2')    // between words
    .replace(/\s*[—–]\s*/g, ', ')                // anything left
  body = body.map(fixDashes)
  fm = fm.split('\n').map(l =>
    /^(title|excerpt):/.test(l) ? fixDashes(l) : l).join('\n')

  // 4. An excerpt built from a production note is not an excerpt. Rebuild it
  //    from the first real paragraph.
  const ex = fm.match(/^excerpt:\s*"([^"]*)"/m)
  if (ex && /\bcharacters?\b|\btrim\b|^\(/i.test(ex[1])) {
    const firstProse = body.find(l => l.trim().length > 110)
    if (firstProse) {
      fm = fm.replace(/^excerpt:\s*".*"$/m,
        'excerpt: "' + firstProse.trim().replace(/"/g, "'").slice(0, 220) + '"')
    }
  }

  const out = '---\n' + fm + '\n---\n' + body.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
  if (out !== raw) { fs.writeFileSync(p, out); changed++ }

  const left = (out.match(/[–—]/g) || []).length
  if (left) dashesLeft.push(file + ': ' + left)
}

console.log(changed + ' of 24 files changed')
console.log(dashesLeft.length ? 'dashes remaining:\n  ' + dashesLeft.join('\n  ') : 'no em or en dashes remain')
