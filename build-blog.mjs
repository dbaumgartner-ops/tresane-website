// Generates /blog and every post page from content/blog/*.md
//
// The markdown is the SOURCE. The HTML is OUTPUT and must never be hand-edited:
// the next run would silently overwrite the change, with no error and nothing to
// show what was lost. Edit the .md, then run `node build-blog.mjs`.
import fs from 'node:fs'
import path from 'node:path'

const SRC = 'content/blog'
const OUT = 'blog'
const FONTS = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap'

const SECTION = /^(opening reflection|naming the pattern|expanded perspective.*|what steady leaders tend to notice|closing reflection|the story|what this reveals about leadership|where misalignment begins|patterns that repeat over time|reflection as a leadership pattern|return to the story|introduction)$/i

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const shortSlug = t => t.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '').split('-').filter(Boolean).slice(0, 7).join('-')

const fmtDate = iso => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
    .toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })
}

const DOMAIN_KEY = { 'Align Self': 'self', 'Align Relationships': 'relationships', 'Align Teams': 'teams' }

function parse(file) {
  const raw = fs.readFileSync(path.join(SRC, file), 'utf8')
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!m) throw new Error('no front matter in ' + file)
  const fm = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (kv && kv[2] && !kv[2].startsWith('[')) fm[kv[1]] = kv[2].replace(/^"|"$/g, '')
  }
  const paras = m[2].split(/\r?\n/).map(s => s.trim()).filter(Boolean)
  return { ...fm, slug: shortSlug(fm.title), paras }
}

function head(title, desc, canonical) {
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '  <meta charset="UTF-8" />\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n' +
    '  <title>' + esc(title) + '</title>\n' +
    '  <meta name="description" content="' + esc(desc) + '" />\n' +
    '  <link rel="canonical" href="https://www.tresane.com' + canonical + '" />\n' +
    '  <link rel="preconnect" href="https://fonts.googleapis.com" />\n' +
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n' +
    '  <link rel="preload" as="style" onload="this.rel=\'stylesheet\';this.onload=null" href="' + FONTS + '" />\n' +
    '  <noscript><link rel="stylesheet" href="' + FONTS + '" /></noscript>\n' +
    '  <link rel="icon" href="/favicon.ico?v=2" sizes="any" type="image/x-icon" />\n' +
    '  <meta name="theme-color" content="#0A6AA2" />\n' +
    '  <link rel="stylesheet" href="/styles.css" />\n' +
    '</head>\n<body>\n' +
    '  <nav class="nav">\n    <div class="nav-inner">\n' +
    '      <a href="/" class="nav-logo">\n' +
    '        <img src="/assets/logo-simple.png" alt="Tresane" width="220" height="133" />\n' +
    '      </a>\n' +
    '      <ul class="nav-links">\n' +
    '        <li><a href="/#how-we-work">How We Work</a></li>\n' +
    '        <li><a href="/#weq">WeQ</a></li>\n' +
    '        <li><a href="/blog">Blog</a></li>\n' +
    '        <li><a href="/#about">About</a></li>\n' +
    '        <li><a href="/#contact" class="nav-cta">Get Started</a></li>\n' +
    '      </ul>\n' +
    '    </div>\n  </nav>\n'
}

const FOOT = '\n  <footer class="footer">\n    <div class="container">\n' +
  '      <div class="chat-footer-grid">\n' +
  '        <div class="footer-brand">\n' +
  '          <img src="/assets/logo-simple.png" alt="Tresane" width="220" height="133" />\n' +
  '          <p class="footer-tagline">Bringing Workplaces Together<sup>&reg;</sup></p>\n' +
  '        </div>\n' +
  '        <div class="footer-contact">\n' +
  '          <p><a href="mailto:information@tresane.com">information@tresane.com</a></p>\n' +
  '          <p>Central Kentucky</p>\n' +
  '        </div>\n' +
  '      </div>\n' +
  '      <div class="footer-bottom">\n' +
  '        <p>&copy; 2026 Tresane, LLC. All rights reserved. Tresane<sup>&reg;</sup>, Tresane Model<sup>&reg;</sup>, and Bringing Workplaces Together<sup>&reg;</sup> are registered trademarks of Tresane, LLC.</p>\n' +
  '      </div>\n    </div>\n  </footer>\n</body>\n</html>\n'

const posts = fs.readdirSync(SRC).filter(f => f.endsWith('.md')).map(parse)
  .sort((a, b) => b.date.localeCompare(a.date))   // newest first, always

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

// -- Post pages -------------------------------------------------------------
for (const p of posts) {
  const mins = Math.max(1, Math.round(Number(p.words) / 220))
  const body = p.paras
    .map(t => SECTION.test(t) ? '      <h2>' + esc(t) + '</h2>' : '      <p>' + esc(t) + '</p>')
    .join('\n')

  const html = head(p.title + ' · Tresane', p.excerpt, '/blog/' + p.slug) +
    '  <main>\n    <article class="post">\n' +
    '      <div class="post-head">\n' +
    '        <a class="post-back" href="/blog">&larr; All posts</a>\n' +
    '        <p class="post-meta">\n' +
    '          <span class="chip chip--' + DOMAIN_KEY[p.domain] + '">' + esc(p.domain) + '</span>\n' +
    '          <time datetime="' + p.date + '">' + fmtDate(p.date) + '</time>\n' +
    '          <span class="post-mins">' + mins + ' min read</span>\n' +
    '        </p>\n' +
    '        <h1>' + esc(p.title) + '</h1>\n' +
    '      </div>\n' + body + '\n' +
    '      <div class="post-end">\n' +
    '        <p>Something here you would like to talk through?</p>\n' +
    '        <a class="btn-primary" href="/lets-chat-30">Let&rsquo;s chat &rarr;</a>\n' +
    '      </div>\n    </article>\n  </main>' + FOOT

  fs.writeFileSync(path.join(OUT, p.slug + '.html'), html)
}

// -- Index ------------------------------------------------------------------
const cards = posts.map(p => {
  const mins = Math.max(1, Math.round(Number(p.words) / 220))
  const ex = p.excerpt.length > 175
    ? p.excerpt.slice(0, 175).replace(/\s+\S*$/, '') + '…'
    : p.excerpt
  return '        <a class="card" href="/blog/' + p.slug + '" data-domain="' + DOMAIN_KEY[p.domain] + '">\n' +
    '          <span class="chip chip--' + DOMAIN_KEY[p.domain] + '">' + esc(p.domain) + '</span>\n' +
    '          <h2>' + esc(p.title) + '</h2>\n' +
    '          <p class="card-ex">' + esc(ex) + '</p>\n' +
    '          <p class="card-meta"><time datetime="' + p.date + '">' + fmtDate(p.date) + '</time> &middot; ' + mins + ' min read</p>\n' +
    '        </a>'
}).join('\n')

const script = '\n  <script>\n' +
  '    // Progressive: with JS off every post is visible, which is also what a\n' +
  '    // crawler sees. The chips only ever HIDE, they never fetch.\n' +
  '    (function () {\n' +
  '      var btns = document.querySelectorAll(".filter");\n' +
  '      var cards = document.querySelectorAll(".card");\n' +
  '      var empty = document.getElementById("empty");\n' +
  '      btns.forEach(function (b) {\n' +
  '        b.addEventListener("click", function () {\n' +
  '          var f = b.dataset.filter, shown = 0;\n' +
  '          btns.forEach(function (x) { x.classList.toggle("is-on", x === b); });\n' +
  '          cards.forEach(function (c) {\n' +
  '            var on = f === "all" || c.dataset.domain === f;\n' +
  '            c.hidden = !on; if (on) { shown++; }\n' +
  '          });\n' +
  '          empty.hidden = shown > 0;\n' +
  '        });\n' +
  '      });\n' +
  '    })();\n' +
  '  </script>'

fs.writeFileSync(path.join(OUT, 'index.html'),
  head('Blog · Tresane',
    'Weekly reflections on leadership and team development, across Align Self, Align Relationships and Align Teams.',
    '/blog') +
  '  <main>\n' +
  '    <header class="blog-head">\n      <div class="container">\n' +
  '        <div class="section-label">Writing</div>\n' +
  '        <h1>Notes on leading</h1>\n' +
  '        <p class="section-intro">A weekly reflection, written across the three domains of the Tresane Model. Not advice and not a checklist. What leaders are actually navigating.</p>\n' +
  '      </div>\n    </header>\n\n' +
  '    <div class="container">\n' +
  '      <div class="blog-filters" role="group" aria-label="Filter posts by domain">\n' +
  '        <button class="filter is-on" data-filter="all">All</button>\n' +
  '        <button class="filter" data-filter="self">Align Self</button>\n' +
  '        <button class="filter" data-filter="relationships">Align Relationships</button>\n' +
  '        <button class="filter" data-filter="teams">Align Teams</button>\n' +
  '      </div>\n\n' +
  '      <div class="cards" id="cards">\n' + cards + '\n      </div>\n' +
  '      <p class="blog-empty" id="empty" hidden>Nothing in that domain yet.</p>\n' +
  '    </div>\n  </main>' + script + FOOT)

console.log(posts.length + ' post pages + index')
console.log('newest: ' + posts[0].date + '  /blog/' + posts[0].slug)
console.log('oldest: ' + posts[posts.length - 1].date + '  /blog/' + posts[posts.length - 1].slug)
