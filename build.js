#!/usr/bin/env node
/*
 * superbinah.ai: zero-dependency static site build.
 *   node build.js   → writes the finished site to ./dist
 * Content lives in ./content (site.json + one JSON file per project).
 * Static files (styles, images, favicon) live in ./static and are copied as-is.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const site = read('content/site.json');
const projects = fs.readdirSync(path.join(ROOT, 'content/projects'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => read(path.join('content/projects', f)))
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const YEAR = new Date().getFullYear();

// ---------- building blocks ----------
const LOGO = { sapphire: '/img/logo-sapphire.svg', light: '/img/logo-light.svg', ink: '/img/logo-ink.svg' };
const logo = (variant, h) =>
  `<img src="${LOGO[variant]}" alt="superbinah" width="${Math.round((h * 279.1875) / 36)}" height="${h}" class="logo">`;

const SHAPE = {
  point: (c) => `<svg class="shape" width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="${c}"/></svg>`,
  line: (c) => `<svg class="shape" width="46" height="34" viewBox="0 0 30 22" aria-hidden="true"><rect width="30" height="22" rx="11" fill="${c}"/></svg>`,
  plane: (c) => `<svg class="shape" width="46" height="46" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="6" fill="${c}"/></svg>`,
};

// The point, line and plane blown up as a supergraphic (always in order, on one baseline).
const supergraphic = (cls, dot = '#E0562B', fg = '#FFFFFF') =>
  `<svg class="super ${cls}" viewBox="6 40 110 48" aria-hidden="true" focusable="false"><circle cx="14" cy="80" r="8" fill="${dot}"/><rect x="30" y="66" width="30" height="22" rx="11" fill="${fg}"/><rect x="68" y="40" width="48" height="48" rx="6" fill="${fg}"/></svg>`;

const coverArt = (p, big = false) => p.cover
  ? `<img src="${esc(p.cover)}" alt="${esc(p.name)}" loading="lazy">`
  : `<div class="cover-art${big ? ' cover-art-big' : ''}"><span>${esc(p.name)}</span>${supergraphic('super-card')}</div>`;

const projectCard = (p) => `
<a class="project-card" href="/projects/${esc(p.slug)}">
  <div class="project-cover">${coverArt(p)}</div>
  <div class="project-body">
    <p class="label">${esc(p.type)} · ${esc(p.year)}</p>
    <h3 class="h2">${esc(p.name)}</h3>
    <p>${esc(p.summary)}</p>
    <span class="more">View project →</span>
  </div>
</a>`;

const soonCard = () => `
<div class="soon">
  <svg class="shape" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#2445D8"/></svg>
  <p class="label label-grey">Next project</p>
  <p class="h3">In progress</p>
  <p class="muted">Every project starts as a point. More coming soon.</p>
</div>`;

// Two columns until there are 3+ projects. One "in progress" card fills an odd row.
const projectList = (list, maxCols) => {
  const cols = maxCols >= 3 && list.length >= 3 ? 3 : 2;
  const cards = list.map(projectCard);
  if (cards.length % cols !== 0) cards.push(soonCard());
  return `<div class="grid grid-${cols}">${cards.join('')}</div>`;
};

const cta = () => `
<section class="band band-ember">
  <div class="wrap cta">
    <h2 class="h1">${site.cta.title}</h2>
    <p class="intro intro-ink">${esc(site.cta.text)}</p>
    <div class="actions">
      <a class="btn btn-ink" href="/contact">Book a discovery call</a>
      <a class="text-link" href="mailto:${esc(site.email)}">${esc(site.email)}</a>
    </div>
  </div>
</section>`;

// ---------- page shell ----------
function layout({ title, description, urlPath = '/', body, active, script = '', noindex = false }) {
  const fullTitle = title ? `${title} · superbinah` : 'superbinah · Ideas, built. AI solution development';
  const desc = description || site.description;
  const url = site.url + urlPath;
  const nav = [['/#approach', 'Approach', 'approach'], ['/projects', 'Projects', 'projects'], ['/#why', 'Why Binah', 'why'], ['/contact', 'Contact', 'contact']];
  const links = nav.map(([h, l, k]) => `<a href="${h}"${active === k ? ' aria-current="page"' : ''}>${l}</a>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">${noindex ? '\n<meta name="robots" content="noindex, nofollow">' : ''}
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="superbinah">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site.url}/img/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#2445D8">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Heebo:wght@400;800&family=Manrope:wght@800&display=swap">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-row">
    <a href="/" class="brand" aria-label="superbinah home">${logo('sapphire', 28)}</a>
    <nav class="nav" aria-label="Main">${links}<a class="btn btn-white btn-sm" href="/contact">Book a call</a></nav>
    <details class="menu">
      <summary aria-label="Menu"><span></span><span></span><span></span></summary>
      <nav class="menu-panel" aria-label="Mobile">${links}<a class="btn btn-white" href="/contact">Book a discovery call</a></nav>
    </details>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap footer-row">
    ${logo('sapphire', 24)}
    <p>© ${YEAR} superbinah · AI solution development · <a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>
  </div>
</footer>
<script>document.querySelectorAll('.menu-panel a').forEach(function (a) { a.addEventListener('click', function () { a.closest('details').removeAttribute('open'); }); });</script>
${script}
</body>
</html>
`;
}

// ---------- pages ----------
function home() {
  const steps = site.approach.steps.map((s) => `
<article class="card card-white">
  <div class="shape-row">${SHAPE[s.shape](s.shape === 'point' ? '#2445D8' : '#121212')}</div>
  <p class="label label-grey">${esc(s.label)}</p>
  <h3 class="h2">${esc(s.title)}</h3>
  <p>${esc(s.text)}</p>
</article>`).join('');
  const services = site.services.map((s, i) => `
<article class="card card-panel">
  <p class="label label-mist">0${i + 1}</p>
  <h3 class="h3">${esc(s.title)}</h3>
  <p>${esc(s.text)}</p>
</article>`).join('');
  const body = `
<section class="hero band-sapphire">
  <div class="wrap hero-inner">
    <p class="label label-mist">${esc(site.eyebrow)}</p>
    <h1 class="display">${esc(site.tagline)}</h1>
    <p class="lead">${esc(site.description)}</p>
    <div class="actions">
      <a class="btn btn-white" href="/contact">Book a discovery call</a>
      <a class="btn btn-outline" href="/projects">See our projects</a>
    </div>
  </div>
  ${supergraphic('super-hero')}
</section>

<section id="approach" class="band band-stone">
  <div class="wrap">
    <div class="section-head">
      <p class="label">How we work</p>
      <h2 class="h1">${esc(site.approach.title)}</h2>
      <p class="intro">${esc(site.approach.intro)}</p>
    </div>
    <div class="grid grid-3">${steps}</div>
  </div>
</section>

<section id="services" class="band band-sapphire">
  <div class="wrap">
    <div class="section-head">
      <p class="label label-mist">Services</p>
      <h2 class="h1">What we build</h2>
    </div>
    <div class="grid grid-4">${services}</div>
  </div>
</section>

<section id="projects" class="band band-white">
  <div class="wrap">
    <div class="section-head head-row">
      <div class="stack-sm"><p class="label">Projects</p><h2 class="h1">Built by superbinah</h2></div>
      <a class="text-link text-sapphire" href="/projects">All projects →</a>
    </div>
    ${projectList(projects.slice(0, 4), 2)}
  </div>
</section>

<section id="why" class="band band-ink">
  <div class="wrap why">
    <p class="why-hebrew" lang="he" dir="rtl">בינה</p>
    <div class="stack">
      <p class="label label-mist">Why the name</p>
      <h2 class="h1">${esc(site.meaning.title)}</h2>
      <p>${site.meaning.html}</p>
    </div>
  </div>
</section>
${cta()}`;
  return layout({ urlPath: '/', body });
}

function projectsPage() {
  const body = `
<section class="page-head band-sapphire">
  <div class="wrap stack">
    <p class="label label-mist">Projects</p>
    <h1 class="h0">Ideas we’ve built.</h1>
    <p class="lead lead-mist">Every project started as a point. Here is where each one went.</p>
  </div>
  ${supergraphic('super-head')}
</section>
<section class="band band-white">
  <div class="wrap">${projectList(projects, 3)}</div>
</section>
${cta()}`;
  return layout({ title: 'Projects', description: 'Projects by superbinah, an AI solution-development studio: from first idea to working product.', urlPath: '/projects', body, active: 'projects' });
}

function projectPage(p) {
  const meta = [['Type', p.type], ['Stage', p.stage], ['Year', p.year], ['Link', p.link ? `<a href="${esc(p.link)}" rel="noopener">${esc(p.link.replace(/^https?:\/\//, ''))}</a>` : 'Coming soon']]
    .filter(([, v]) => v)
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${k === 'Link' ? v : esc(v)}</dd></div>`).join('');
  const story = [['The challenge', p.challenge], ['The product', p.product], ['Where it stands', p.status]]
    .filter(([, v]) => v)
    .map(([k, v]) => `<div class="story-row"><h2 class="h2">${k}</h2><p>${esc(v)}</p></div>`).join('');
  const gallery = (p.images || []).length
    ? `<div class="gallery">${p.images.map((src, i) => `<img src="${esc(src)}" alt="${esc(p.name)} screen ${i + 1}" loading="lazy">`).join('')}</div>` : '';
  const body = `
<section class="project-hero band-sapphire">
  <div class="wrap stack">
    <p class="crumbs"><a href="/projects">Projects</a> / ${esc(p.name)}</p>
    <h1 class="h0">${esc(p.name)}</h1>
    <p class="lead lead-mist">${esc(p.summary)}</p>
    ${p.prototype ? `<div class="actions"><a class="btn btn-white" href="/projects/${esc(p.slug)}/prototype">Open the prototype</a><span class="hint">Guest login required</span></div>` : ''}
    <dl class="meta">${meta}</dl>
  </div>
</section>
<section class="band band-white band-tight">
  <div class="wrap stack-lg">
    <div class="cover-large">${coverArt(p, true)}</div>
    <div class="story">${story}</div>
    ${gallery}
  </div>
</section>
${cta()}`;
  return layout({ title: p.name, description: p.summary, urlPath: `/projects/${p.slug}`, body, active: 'projects' });
}

function contactPage() {
  const linkedin = site.linkedin ? `<div><dt>LinkedIn</dt><dd><a href="${esc(site.linkedin)}" rel="noopener">${esc(site.linkedin.replace(/^https?:\/\/(www\.)?/, ''))}</a></dd></div>` : '';
  const body = `
<section class="band band-sapphire contact-band">
  <div class="wrap contact">
    <div class="stack">
      <p class="label label-mist">Contact</p>
      <h1 class="h0">${esc(site.contact.title)}</h1>
      <p class="lead lead-mist">${esc(site.contact.text)}</p>
      <dl class="meta meta-stack">
        <div><dt>Email</dt><dd><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></dd></div>
        ${linkedin}
      </dl>
    </div>
    <form class="form" id="contact-form" action="mailto:${esc(site.email)}" method="get" novalidate>
      <div class="field"><label for="f-name">Name</label><input id="f-name" name="fullname" autocomplete="name" placeholder="Your name" required></div>
      <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" placeholder="you@company.com" required></div>
      <div class="field"><label for="f-company">Company</label><input id="f-company" name="company" autocomplete="organization" placeholder="Company name"></div>
      <div class="field"><label for="f-idea">What do you want to build?</label><textarea id="f-idea" name="idea" placeholder="A sentence or two is enough." required></textarea></div>
      <button class="btn btn-sapphire btn-block" type="submit">Send</button>
      <p class="form-note">Send opens your email app with the message ready to go. You can also write to <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>.</p>
    </form>
  </div>
</section>`;
  const script = `<script>
(function () {
  var f = document.getElementById('contact-form');
  if (!f) return;
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!f.reportValidity()) return;
    var v = function (n) { return (f.elements[n].value || '').trim(); };
    var body = 'Name: ' + v('fullname') + '\\nEmail: ' + v('email') + '\\nCompany: ' + v('company') + '\\n\\n' + v('idea');
    window.location.href = 'mailto:${esc(site.email)}?subject=' + encodeURIComponent('New idea from ' + (v('fullname') || 'the website')) + '&body=' + encodeURIComponent(body);
  });
})();
</script>`;
  return layout({ title: 'Contact', description: 'Tell superbinah about your idea. We will help you find the point, then prove it with a working POC.', urlPath: '/contact', body, active: 'contact', script });
}

function notFound() {
  const body = `
<section class="page-head band-sapphire page-404">
  <div class="wrap stack">
    <p class="label label-mist">404</p>
    <h1 class="h0">This page is still just a point.</h1>
    <p class="lead lead-mist">It hasn’t been built yet. Let’s get you back somewhere real.</p>
    <div class="actions"><a class="btn btn-white" href="/">Back to the home page</a></div>
  </div>
  ${supergraphic('super-head')}
</section>`;
  return layout({ title: 'Page not found', urlPath: '/404', body });
}


// ---------- guest prototype (sign-in page is public; the prototype page is guarded by middleware.js) ----------
function signInPage(p) {
  const body = `
<section class="band band-sapphire contact-band">
  <div class="wrap contact">
    <div class="stack">
      <p class="crumbs"><a href="/projects/${esc(p.slug)}">${esc(p.name)}</a> / Guest access</p>
      <h1 class="h0">${esc(p.name)} prototype</h1>
      <p class="lead lead-mist">This prototype is shared with invited guests. Sign in with the guest username and password you received.</p>
      <p class="hint">No login yet? Ask at <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>.</p>
    </div>
    <form class="form" method="post" action="/projects/${esc(p.slug)}/sign-in">
      <p class="form-error" id="signin-error" role="alert" hidden></p>
      <div class="field"><label for="g-user">Username</label><input id="g-user" name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required></div>
      <div class="field"><label for="g-pass">Password</label><input id="g-pass" name="password" type="password" autocomplete="current-password" required></div>
      <button class="btn btn-sapphire btn-block" type="submit">Sign in</button>
      <p class="form-note">Guest access is view-only. You stay signed in on this device for 7 days.</p>
    </form>
  </div>
</section>`;
  const script = `<script>
(function () {
  var e = new URLSearchParams(location.search).get('error');
  var box = document.getElementById('signin-error');
  if (!e || !box) return;
  box.textContent = e === 'setup' ? 'Guest access isn’t switched on yet. Please try again later.' : 'That username or password didn’t match. Please try again.';
  box.hidden = false;
  document.getElementById('g-user').focus();
})();
</script>`;
  return layout({ title: `${p.name} prototype: guest access`, description: `Guest access to the ${p.name} prototype by superbinah.`, urlPath: `/projects/${p.slug}/sign-in`, body, active: 'projects', script, noindex: true });
}

function prototypePage(p) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.name)} prototype · superbinah</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#2445D8">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap">
<link rel="stylesheet" href="/styles.css">
</head>
<body class="proto-body">
<header class="proto-bar">
  <a href="/" class="brand" aria-label="superbinah home">${logo('sapphire', 22)}</a>
  <p class="proto-title">${esc(p.name)} <span>Guest prototype</span></p>
  <nav class="proto-actions" aria-label="Prototype">
    <a href="/projects/${esc(p.slug)}" class="proto-about">About the project</a>
    <a href="/projects/${esc(p.slug)}/sign-out">Sign out</a>
  </nav>
</header>
<iframe class="proto-frame" src="${esc(p.prototype)}" title="${esc(p.name)} prototype" allow="autoplay; clipboard-write; fullscreen" referrerpolicy="no-referrer"></iframe>
</body>
</html>
`;
}

// ---------- write ----------
function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
function copyDir(src, dest) {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) { fs.mkdirSync(d, { recursive: true }); copyDir(s, d); } else fs.copyFileSync(s, d);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
copyDir(path.join(ROOT, 'static'), OUT);
write('index.html', home());
write('projects/index.html', projectsPage());
for (const p of projects) {
  write(`projects/${p.slug}/index.html`, projectPage(p));
  if (p.prototype) {
    write(`projects/${p.slug}/sign-in/index.html`, signInPage(p));
    write(`projects/${p.slug}/prototype/index.html`, prototypePage(p));
  }
}
write('contact/index.html', contactPage());
write('404.html', notFound());
const urls = ['/', '/projects', ...projects.map((p) => `/projects/${p.slug}`), '/contact'];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site.url}${u === '/' ? '' : u}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /projects/*/prototype\nDisallow: /projects/*/sign-in\nSitemap: ${site.url}/sitemap.xml\n`);
console.log(`Built ${urls.length} pages + 404 for ${projects.length} project(s) → dist/`);
