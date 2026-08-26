// Corrective pass after edit-pass.mjs. Two things it exposed:
//
// 1. Stripping the second half of a location PAIR left the conjunction behind:
//    "across Lexington and Central Kentucky" became "across Lexington and,".
//    A location pair has to be treated as one mention, not two.
// 2. Removing the meta description revealed the scaffolding that had been
//    sitting UNDER it: a "Secondary and Long Tail Keywords:" block, run-merged
//    keyword lists, and bare slug lines. They were previously invisible because
//    the cleanup stopped at the meta description above them.
import fs from 'node:fs'
import path from 'node:path'

const SRC = 'content/blog'

const isJunk = t => (
  /keywords?\s*:/i.test(t) ||                       // "Secondary and Long Tail Keywords:"
  /^[a-z0-9]+(-[a-z0-9]+){2,}-?$/.test(t) ||        // a bare slug
  (/^[a-z]/.test(t) && !/[.!?]$/.test(t)) ||        // lowercase start, no full stop
  /^(focus keyphrase|meta|slug|url|title|theme)\b/i.test(t)
)

let fixed = []
for (const file of fs.readdirSync(SRC).filter(f => f.endsWith('.md'))) {
  const p = path.join(SRC, file)
  const raw = fs.readFileSync(p, 'utf8')
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!m) continue
  const notes = []
  let paras = m[2].split(/\n\n+/).map(s => s.trim()).filter(Boolean)

  const kept = paras.filter(t => !isJunk(t))
  if (kept.length !== paras.length) notes.push(`removed ${paras.length - kept.length} scaffolding line(s)`)
  paras = kept

  paras = paras.map(t => {
    const was = t
    t = t.replace(/\s+(and|or)\s*,/g, ',')          // "Lexington and," -> "Lexington,"
         .replace(/\s+(and|or)\s*\./g, '.')         // "...and." -> "..."
         .replace(/\s+(and|or)\s+(?=[a-z]{0,3}\s*$)/g, ' ')
         .replace(/\s{2,}/g, ' ')
         .replace(/\s+([,.;:])/g, '$1')
    if (t !== was) notes.push('repaired an orphaned conjunction')
    return t
  })

  const out = '---\n' + m[1] + '\n---\n' + paras.join('\n\n') + '\n'
  if (out !== raw) { fs.writeFileSync(p, out); fixed.push([file, [...new Set(notes)].join(' | ')]) }
}
console.log(fixed.length + ' files repaired\n')
fixed.forEach(([f, n]) => console.log('  ' + f.slice(0, 40).padEnd(42) + n))
