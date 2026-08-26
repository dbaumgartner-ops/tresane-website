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
export const EMAIL  = 'information@tresane.com'
export const CITY   = 'Lexington, KY'
export const REGION = 'Serving Central Kentucky and the Commonwealth'
export const LEGAL  =
  '&copy; 2026 Tresane, LLC. All rights reserved. Tresane<sup>&reg;</sup>, ' +
  'Tresane Model<sup>&reg;</sup>, and Bringing Workplaces Together<sup>&reg;</sup> ' +
  'are registered trademarks of Tresane, LLC.'

// ── Navigation ──────────────────────────────────────────────────────────────
// {R} is the site root: '' on the home page so an in-page anchor still smooth
// scrolls, '/' everywhere else so the same link travels home first.
const NAV = [
  ['{R}#how-we-work', 'How We Work'],
  ['{R}#weq',         'WeQ'],
  ['/what-we-do',     'What We Do'],
  ['/blog',           'Blog'],
  ['{R}#book',        'Our Book'],
  ['{R}#about',       'About'],
]
const CTA = ['{R}#contact', 'Get Started']

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
    '          <p class="footer-tagline">Bringing Workplaces Together<sup>&reg;</sup></p>\n' +
    '        </div>\n' +
    col('Work', [['{R}#how-we-work', 'How We Work'], ['{R}#weq', 'WeQ'],
                 ['{R}#cycle', 'Learning Cycle'], ['{R}#book', 'Our Book']]) + '\n' +
    col('Tresane', [['/what-we-do', 'What We Do'], ['/blog', 'Blog'],
                    ['{R}#stories', 'What People Say'], ['{R}#about', 'About']]) + '\n' +
    '        <div class="footer-contact">\n          <h3>Connect</h3>\n' + CONTACT + '\n        </div>\n' +
    '      </div>\n' + BOTTOM + '\n    </div>\n  </footer>'
}

// No link columns: same reason the chat pages have no nav.
export function footerMinimal() {
  return '    <footer class="footer chat-footer">\n      <div class="container">\n' +
    '        <div class="chat-footer-grid">\n' +
    '          <div class="footer-brand">\n            ' + LOGO('/') + '\n' +
    '            <p class="footer-tagline">Bringing Workplaces Together<sup>&reg;</sup></p>\n' +
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
