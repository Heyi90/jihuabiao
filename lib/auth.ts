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

export async function getAuthUsernameFromCookies() {\n  const store = await cookies();\n  const token = store.get(TOKEN_NAME)?.value;\n  if (!token) return null;\n  const payload = verifyToken(token);\n  return payload?.u ?? null;\n}

export async function setAuthCookie(username: string, days: number | null) {\n  const exp = days ? Date.now() + days*24*60*60*1000 : Date.now() + 24*60*60*1000;\n  const token = signToken({ u: username, exp });\n  const store = await cookies();\n  store.set({\n    name: TOKEN_NAME,\n    value: token,\n    httpOnly: true,\n    sameSite: 'lax',\n    path: '/',\n    ...(days ? { expires: new Date(exp) } : {}),\n    secure: process.env.NODE_ENV === 'production',\n  });\n});
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

export async function clearAuthCookie() {\n  try { (await cookies()).delete(TOKEN_NAME); } catch {}\n} catch {}
}

