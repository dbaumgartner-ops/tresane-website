// Recompute review flags from what the files ACTUALLY say now.
//
// The original flags were written at extraction and then the editing pass fixed
// most of what they described. A flag that outlives its cause is worse than no
// flag: it sends the next reader hunting for something that is not there.
import fs from 'node:fs'
import path from 'node:path'

const SRC = 'content/blog'
const LOC = /\b(Lexington|Central Kentucky|Kentucky)\b/gi
const summary = {}

for (const file of fs.readdirSync(SRC).filter(f => f.endsWith('.md'))) {
  const p = path.join(SRC, file)
  const raw = fs.readFileSync(p, 'utf8')
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!m) continue
  const body = m[2]
  const title = (m[1].match(/^title:\s*"(.*)"$/m) || [, ''])[1]
  const words = body.split(/\s+/).length

  const flags = []
  const locs = (body.match(LOC) || []).length
  if (locs > 2) flags.push(`location phrase still appears ${locs}x`)
  if (LOC.test(title)) flags.push('location keyword in the title (changing it changes the URL)')
  LOC.lastIndex = 0
  if (/^[a-z]/m.test(body.replace(/^---[\s\S]*?---/, ''))) flags.push('a paragraph begins lowercase')
  if (/^(These|Those|That|This) \w+ (remain|are|is|was|were)\b/.test(body.trim()))
    flags.push('opens mid-thought, the sentence before it may have been lost')
  if (words < 500) flags.push(`short (${words} words), fine if it tells a story`)

  flags.forEach(f => { const k = f.replace(/\d+/g, 'N'); summary[k] = (summary[k] || 0) + 1 })

  const fm = m[1].replace(/^review:[\s\S]*?(?=^\w+:|$)/m, '').trimEnd()
  const out = '---\n' + fm + '\n' +
    (flags.length ? 'review:\n' + flags.map(f => '  - ' + f).join('\n') : 'review: []') +
    '\n---\n' + body
  fs.writeFileSync(p, out)
}

const flagged = fs.readdirSync(SRC).filter(f =>
  /^review:\n/m.test(fs.readFileSync(path.join(SRC, f), 'utf8'))).length
console.log(flagged + ' of 24 posts still need a look\n')
Object.entries(summary).forEach(([k, v]) => console.log('  ' + String(v).padStart(2) + '  ' + k))
