// Stamps the shared header and footer into the hand-written pages.
// Idempotent: run it as often as you like. Run it after ANY edit to
// site-chrome.mjs, then run build-blog.mjs for the generated pages.
import fs from 'node:fs'
import { nav, navMinimal, footer, footerMinimal, chromeScript } from './site-chrome.mjs'

const PAGES = [
  { file: 'index.html',        home: true,  chrome: 'full' },
  { file: 'what-we-do.html',   home: false, chrome: 'full' },
  { file: 'lets-chat-15.html', home: false, chrome: 'minimal' },
  { file: 'lets-chat-30.html', home: false, chrome: 'minimal' },
]

const A = t => '<!--@' + t + '-->'
const Z = t => '<!--/@' + t + '-->'

// Replace whatever sits between the markers. On the first run there are no
// markers, so `seed` says where they go: either over an existing block, or
// inserted at a fixed point for a page that never had one.
function put(src, tag, html, seed) {
  const open = A(tag), close = Z(tag)
  const i = src.indexOf(open), j = src.indexOf(close)
  if (i >= 0 && j > i) return src.slice(0, i) + open + '\n' + html + '\n' + src.slice(j)
  return seed(src, open + '\n' + html + '\n' + close)
}

// A block that already exists, matched on its own tag rather than by regex
// across the whole file, so a stray <nav> in the body cannot be swallowed.
const overBlock = (tagName, attrStart) => (src, block) => {
  const i = src.indexOf(attrStart)
  if (i < 0) return null
  const j = src.indexOf('</' + tagName + '>', i)
  if (j < 0) return null
  return src.slice(0, i) + block.trimStart() + src.slice(j + tagName.length + 3)
}

const before = needle => (src, block) => {
  const i = src.lastIndexOf(needle)
  return i < 0 ? null : src.slice(0, i) + block + '\n' + src.slice(i)
}

const or = (...fns) => (src, block) => {
  for (const f of fns) { const r = f(src, block); if (r !== null) return r }
  throw new Error('nowhere to put the block')
}

let report = []
for (const p of PAGES) {
  const raw = fs.readFileSync(p.file, 'utf8')
  let s = raw
  const full = p.chrome === 'full'

  // An older hand-written copy of the nav script would now be a duplicate.
  s = s.replace(/\n *<script>\s*\n\s*\/\/ Mobile nav toggle[\s\S]*?<\/script>/, '')

  s = put(s, 'nav', full ? nav({ home: p.home }) : navMinimal(),
    or(overBlock('nav', '  <nav class="nav">'),
       overBlock('a', '    <a href="/" class="chat-logo"'),
       before('    <picture>')))

  s = put(s, 'footer', (full ? footer({ home: p.home }) : footerMinimal()) +
                       (full ? '\n' + chromeScript() : ''),
    or(overBlock('footer', '  <footer class="footer'),
       overBlock('footer', '    <footer class="footer'),
       before('</body>')))

  if (s !== raw) { fs.writeFileSync(p.file, s); report.push(p.file) }
}

console.log(report.length ? 'stamped: ' + report.join(', ') : 'no change')
