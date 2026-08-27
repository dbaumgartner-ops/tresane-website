// The header and footer, in ONE place, for every page on the site.
//
// WHY THIS FILE EXISTS. The nav and footer were hand-copied into each page, and
// by August they had drifted five different ways: the home page had no Blog
// link, the blog had no What We Do link, three pages said "Central Kentucky"
// while one said "Lexington, KY", /lets-chat-30 had no footer at all, and only
// the home page carried the mobile menu button, so /what-we-do and all 24 blog
// posts had NO navigation whatsoever on a phone.
//
// None of that produced an error. Copies do not drift loudly.
//
// So: edit here, run `node build-site.mjs && node build-blog.mjs`, and every
// page changes together. The HTML is OUTPUT between the @nav / @footer markers.
// Editing a page inside those markers will be silently overwritten.

// ── The facts that must be identical everywhere ─────────────────────────────
// Google weighs a consistent name/location string across a site and against the
// Business Profile. One spelling, one place, or it is not consistent.
//
// They live in chrome.json, NOT here, because weqleader.tresane.com is a second
// public host rendering the SAME header string and footer in React. Two hosts
// hand-writing the same seven links is exactly the drift this file was built to
// end, one level up. chrome.json is the source; tresane-360 keeps a synced copy
// pinned by a test.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const CHROME = JSON.parse(fs.readFileSync(path.join(HERE, 'chrome.json'), 'utf8'))

export const EMAIL   = CHROME.identity.email
export const CITY    = CHROME.identity.city
export const REGION  = CHROME.identity.region
export const TAGLINE = CHROME.identity.tagline
export const LEGAL   = CHROME.identity.legal

// ── Navigation ──────────────────────────────────────────────────────────────
// {R} is the site root: '' on the home page so an in-page anchor still smooth
// scrolls, '/' everywhere else so the same link travels home first. On weqleader
// it resolves to the absolute tresane.com URL, which is what makes the header
// string the way back for someone who arrived from there.
const NAV = CHROME.nav
const CTA = CHROME.cta

const LOGO = (p) =>
  '<img src="' + p + 'assets/logo-simple.png" alt="Tresane" width="220" height="133" />'

export function nav({ home = false } = {}) {
  const R = home ? '' : '/'
  const at = s => s.replace('{R}', R)
  const items = NAV.map(([h, t]) => '        <li><a href="' + at(h) + '">' + t + '</a></li>')
    .concat('        <li><a href="' + at(CTA[0]) + '" class="nav-cta">' + CTA[1] + '</a></li>')
    .join('\n')
  return '  <nav class="nav">\n    <div class="nav-inner">\n' +
    '      <a href="/" class="nav-logo">\n        ' + LOGO('/') + '\n      </a>\n' +
    '      <ul class="nav-links" id="nav-links">\n' + items + '\n      </ul>\n' +
    '      <button class="nav-toggle" aria-label="Menu" aria-expanded="false" ' +
    'aria-controls="nav-links">&#9776;</button>\n' +
    '    </div>\n  </nav>'
}

// The lets-chat pages are single-decision landing pages. A nav on them competes
// with the one thing the page is for, so they get the logo as the only way out.
export function navMinimal() {
  return '    <a href="/" class="chat-logo" aria-label="Tresane home">\n      ' +
    LOGO('/') + '\n    </a>'
}

// ── Footer ──────────────────────────────────────────────────────────────────
const CONTACT =
  '          <p><a href="mailto:' + EMAIL + '">' + EMAIL + '</a></p>\n' +
  '          <p>' + CITY + '</p>\n' +
  '          <p class="footer-region">' + REGION + '</p>'

const BOTTOM =
  '      <div class="footer-bottom">\n        <p>' + LEGAL + '</p>\n      </div>'

export function footer({ home = false } = {}) {
  const R = home ? '' : '/'
  const col = (title, links) =>
    '        <div class="footer-links">\n          <h3>' + title + '</h3>\n          <ul>\n' +
    links.map(([h, t]) => '            <li><a href="' + h.replace('{R}', R) + '">' + t + '</a></li>').join('\n') +
    '\n          </ul>\n        </div>'

  return '  <footer class="footer">\n    <div class="container">\n' +
    '      <div class="footer-grid">\n' +
    '        <div class="footer-brand">\n          ' + LOGO('/') + '\n' +
    '          <p class="footer-tagline">' + TAGLINE + '</p>\n' +
    '        </div>\n' +
    CHROME.footerColumns.map(c => col(c.title, c.links)).join('\n') + '\n' +
    '        <div class="footer-contact">\n          <h3>Connect</h3>\n' + CONTACT + '\n        </div>\n' +
    '      </div>\n' + BOTTOM + '\n    </div>\n  </footer>'
}

// THE MINIMAL FOOTER. Same navy, same formatting, same trademark line as the
// full one; it drops only the Work and Tresane link columns. Used where a wall
// of links would compete with the page: the booking pages (one decision) and
// the blog posts (a reading experience, whose way onward is the header string).
//
// It is the SAME block, not a lesser one. The identity facts and the trademark
// sentence appear on every public page without exception, because a page that
// quietly omits them is the drift we are trying to stop.
export function footerMinimal() {
  return '    <footer class="footer footer-minimal">\n      <div class="container">\n' +
    '        <div class="footer-minimal-grid">\n' +
    '          <div class="footer-brand">\n            ' + LOGO('/') + '\n' +
    '            <p class="footer-tagline">' + TAGLINE + '</p>\n' +
    '          </div>\n' +
    '          <div class="footer-contact">\n' + CONTACT.replace(/^ {10}/gm, '            ') + '\n' +
    '          </div>\n        </div>\n' +
    BOTTOM.replace(/^ {6}/gm, '        ') + '\n      </div>\n    </footer>'
}

// ── The script the full nav needs ───────────────────────────────────────────
// Ships WITH the footer, so a page can never get the menu button without the
// code that opens it. That was the /what-we-do bug.
export function chromeScript() {
  return '  <script>\n' +
    '    (function () {\n' +
    '      var t = document.querySelector(".nav-toggle");\n' +
    '      var l = document.getElementById("nav-links");\n' +
    '      if (t && l) t.addEventListener("click", function () {\n' +
    '        var open = l.classList.toggle("nav-open");\n' +
    '        t.setAttribute("aria-expanded", open ? "true" : "false");\n' +
    '      });\n' +
    '      document.querySelectorAll(\'a[href^="#"]\').forEach(function (a) {\n' +
    '        a.addEventListener("click", function (e) {\n' +
    '          var el = document.querySelector(this.getAttribute("href"));\n' +
    '          if (el) { e.preventDefault(); el.scrollIntoView({ behavior: "smooth" }); }\n' +
    '        });\n' +
    '      });\n' +
    '    })();\n' +
    '  </script>'
}
