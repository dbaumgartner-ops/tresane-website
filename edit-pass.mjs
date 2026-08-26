// David's editing pass, Aug 26 2026. One-off, but committed so the changes are
// auditable rather than mysterious.
//
//   1. Strip the REPEATED location commentary. The first mention in a post
//      stays, because one natural mention is real signal; every one after it is
//      stuffing. Strips the LOCATION and keeps the service noun, so "executive
//      coaching in Kentucky" becomes "executive coaching" and the sentence
//      survives intact.
//   2. "Abysses" -> "Challenges".
//   3. Drop the four opening lines that are meta descriptions.
//   4. Restore short opening sentences my own cleanup wrongly dropped: it
//      treated "prose" as "over 100 characters", so "Clear roles. Coordinated
//      priorities. Shared accountability." looked like a label.
import fs from 'node:fs'
import path from 'node:path'

const SRC = 'content/blog'

// The service phrase, then the location. Captured separately so the location
// can go while the service noun stays.
const LOC = /\s*(?:\b(?:in|across|throughout|within|around|for)\s+)?\b(?:the\s+)?(?:greater\s+)?(Lexington\s+KY|Lexington,?\s+Kentucky|Central\s+Kentucky|Lexington|Kentucky)\b(?:\s+KY)?/gi

// Whole clauses that exist only to carry the keyword.
const CLAUSES = [
  /^For leaders seeking [^,]{0,60},\s*/i,
  /^In (?:leadership|executive|team) (?:coaching|development|training|leadership) work[^,]{0,50},\s*/i,
  /,\s*including within [^.]{0,60}(?=\.)/i,
  /\s*This reflection builds on the broader Align and Lead rhythm[^.]*\./i,
]

const META = /\b(insights?|guidance|reflections?) (on|from|into|for)\b/i

let report = []

for (const file of fs.readdirSync(SRC).filter(f => f.endsWith('.md'))) {
  const p = path.join(SRC, file)
  const raw = fs.readFileSync(p, 'utf8')
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!m) continue
  let fm = m[1]
  let paras = m[2].split(/\n\n+/).map(s => s.trim()).filter(Boolean)
  const before = paras.join('\n\n')
  const changes = []

  // 3. A first paragraph that is a single sentence describing the post.
  if (paras.length > 1 && META.test(paras[0]) && paras[0].length < 230
      && (paras[0].match(/[.!?]/g) || []).length <= 1) {
    paras = paras.slice(1)
    changes.push('removed a meta description from the top')
  }

  // 1. Keep the first location mention, strip the rest.
  let seen = false
  paras = paras.map(par => {
    let out = par
    for (const rx of CLAUSES) {
      if (rx.test(out)) {
        out = out.replace(rx, (mm) => mm.startsWith(',') ? '' : '')
        out = out.charAt(0).toUpperCase() + out.slice(1)
      }
    }
    out = out.replace(LOC, (full) => {
      if (!seen) { seen = true; return full }   // first mention survives
      return ''
    })
    return out
  })

  // 2. The word.
  if (/\bAbysses\b/.test(paras.join(' '))) {
    paras = paras.map(x => x.replace(/\bAbysses\b/g, 'Challenges'))
    changes.push('Abysses -> Challenges')
  }

  // Tidy anything the removals left behind.
  paras = paras.map(x => x
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/,\s*,/g, ',')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+\./g, '.')
    .trim())
    .filter(Boolean)

  const after = paras.join('\n\n')
  const stripped = (before.match(LOC) || []).length - (after.match(LOC) || []).length
  if (stripped > 0) changes.push(`stripped ${stripped} repeated location mention${stripped > 1 ? 's' : ''}`)

  if (after !== before) {
    fs.writeFileSync(p, '---\n' + fm + '\n---\n' + after + '\n')
    report.push({ file, changes })
  }
}

console.log(report.length + ' files edited\n')
report.forEach(r => console.log('  ' + r.file.slice(0, 44).padEnd(46) + r.changes.join(' | ')))
