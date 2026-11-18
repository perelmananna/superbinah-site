/*
 * Guest access for project prototypes (Vercel Routing Middleware, runs before every matched request).
 *
 *   /projects/<slug>/prototype   → only with a valid guest session, otherwise sent to the sign-in page
 *   /projects/<slug>/sign-in     → GET shows the sign-in page, POST checks the guest login
 *   /projects/<slug>/sign-out    → ends the session
 *
 * The guest login lives in two Vercel environment variables: GUEST_USERNAME and GUEST_PASSWORD.
 * Sessions are signed with that login, so changing either one signs every guest out.
 * If the variables are missing, nobody gets in.
 */

export const config = {
  matcher: [
    '/projects/:slug/prototype',
    '/projects/:slug/prototype/:path*',
    '/projects/:slug/sign-in',
    '/projects/:slug/sign-out',
  ],
};

const COOKIE = 'sb_guest';
const SESSION_DAYS = 7;
const enc = new TextEncoder();

function credentials() {
  const user = (process.env.GUEST_USERNAME || '').trim();
  const pass = process.env.GUEST_PASSWORD || '';
  return user && pass ? { user, pass } : null;
}

function b64url(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

function safeEqual(a, b) {
  const x = enc.encode(String(a)), y = enc.encode(String(b));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

const secretFor = (c) => `superbinah-guest\u0000${c.user}\u0000${c.pass}`;

async function makeToken(c) {
  const payload = `guest.${Date.now() + SESSION_DAYS * 86400000}`;
  return `${payload}.${await hmac(secretFor(c), payload)}`;
}

async function validToken(token, c) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3 || parts[0] !== 'guest') return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return safeEqual(parts[2], await hmac(secretFor(c), `${parts[0]}.${parts[1]}`));
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

function redirect(location, cookie) {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' });
  if (cookie) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 303, headers });
}

const sessionCookie = (value, maxAge) =>
  `${COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

export default async function middleware(request) {
  const url = new URL(request.url);
  const m = url.pathname.match(/^\/projects\/([a-z0-9-]+)\/(prototype|sign-in|sign-out)(\/.*)?$/);
  if (!m) return;
  const [, slug, action] = m;
  const signIn = `/projects/${slug}/sign-in`;
  const prototype = `/projects/${slug}/prototype`;
  const c = credentials();

  if (action === 'sign-out') return redirect(`/projects/${slug}`, sessionCookie('', 0));

  if (action === 'sign-in') {
    if (request.method !== 'POST') return; // show the sign-in page
    if (!c) return redirect(`${signIn}?error=setup`);
    let user = '', pass = '';
    try {
      const form = await request.formData();
      user = String(form.get('username') || '').trim();
      pass = String(form.get('password') || '');
    } catch (e) { /* empty or malformed form */ }
    const ok = safeEqual(user.toLowerCase(), c.user.toLowerCase()) & safeEqual(pass, c.pass);
    if (!ok) {
      await new Promise((r) => setTimeout(r, 700)); // slow down guessing
      return redirect(`${signIn}?error=1`);
    }
    return redirect(prototype, sessionCookie(await makeToken(c), SESSION_DAYS * 86400));
  }

  // prototype
  if (c && (await validToken(readCookie(request, COOKIE), c))) return; // signed in: serve the page
  return redirect(signIn);
}
