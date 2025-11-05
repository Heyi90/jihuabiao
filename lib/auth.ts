import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const TOKEN_NAME = 'auth_token';
const DEFAULT_SECRET = 'dev-secret-change-me';

function base64url(input: Buffer) {
  return input.toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}

export type JwtPayload = { u: string; exp: number };

export function signToken(payload: JwtPayload) {
  const secret = process.env.AUTH_SECRET || DEFAULT_SECRET;
  const header = base64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = base64url(Buffer.from(JSON.stringify(payload)));
  const data = `${header}.${body}`;
  const sig = base64url(createHmac('sha256', secret).update(data).digest());
  return `${data}.${sig}`;
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const secret = process.env.AUTH_SECRET || DEFAULT_SECRET;
    const [header, body, sig] = token.split('.');
    if (!header || !body || !sig) return null;
    const data = `${header}.${body}`;
    const expected = base64url(createHmac('sha256', secret).update(data).digest());
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64').toString('utf8')) as JwtPayload;
    if (typeof payload.exp === 'number' && Date.now() > payload.exp) return null;
    if (typeof payload.u !== 'string') return null;
    return payload;
  } catch { return null; }
}

export function getAuthUsernameFromCookies() {
  const token = cookies().get(TOKEN_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.u ?? null;
}

export function setAuthCookie(username: string, days: number | null) {
  const exp = days ? Date.now() + days*24*60*60*1000 : Date.now() + 24*60*60*1000; // default 1d
  const token = signToken({ u: username, exp });
  cookies().set({
    name: TOKEN_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    ...(days ? { expires: new Date(exp) } : {}),
    secure: process.env.NODE_ENV === 'production',
  });
}

// password hashing (scrypt)
export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 32);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string) {
  const [saltHex, keyHex] = stored.split(':');
  if (!saltHex || !keyHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const key = Buffer.from(keyHex, 'hex');
  const comp = scryptSync(password, salt, 32);
  try {
    return timingSafeEqual(key, comp);
  } catch { return false; }
}

export function sanitizeUsername(u: string) {
  if (!/^[A-Za-z0-9_\-]{3,32}$/.test(u)) return null;
  return u;
}

export function clearAuthCookie() {
  try { cookies().delete('auth_token'); } catch {}
}
