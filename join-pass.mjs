// A sentence split across two paragraphs by the Word extraction.
//
// "...reveal itself as something different:" / "a clash between personal
// standards and role expectations." is ONE sentence with a colon in it, and
// David wrote the second half as emphasis. Word had it as two paragraphs, so
// the extractor faithfully produced two, and the second one starts lowercase
// because it was never a paragraph.
//
// The rule: a paragraph ending in a colon, followed by one starting lowercase,
// is one sentence. Nothing else in the corpus legitimately starts lowercase.
import fs from 'node:fs'
import path from 'node:path'

const SRC = 'content/blog'
let joined = []

for (const file of fs.readdirSync(SRC).filter(f => f.endsWith('.md'))) {
  const p = path.join(SRC, file)
  const raw = fs.readFileSync(p, 'utf8')
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!m) continue
  const paras = m[2].split(/\n\n+/).map(s => s.trim()).filter(Boolean)
  const out = []
  for (const par of paras) {
    const prev = out[out.length - 1]
    if (prev && /:$/.test(prev) && /^[a-z]/.test(par)) {
      out[out.length - 1] = prev + ' ' + par
      joined.push([file, prev.slice(-42) + ' + ' + par.slice(0, 38)])
    } else out.push(par)
  }
  const text = '---\n' + m[1] + '\n---\n' + out.join('\n\n') + '\n'
  if (text !== raw) fs.writeFileSync(p, text)
}

console.log(joined.length + ' split sentences rejoined')
joined.forEach(([f, s]) => console.log('  ' + f.slice(0, 22).padEnd(24) + s))
