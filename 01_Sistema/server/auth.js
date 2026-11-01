import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
const hashToken = token => createHash('sha256').update(token).digest('hex');
const cookieName = 'labtrack_session';
export const publicUser = user => ({ id:user.id, username:user.username, name:user.name });

export async function passwordRecord(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password,salt,64);
  return {salt, hash:hash.toString('hex')};
}

export async function verifyPassword(password, user) {
  // Perform the same expensive derivation when the username does not exist.
  const hash = await derive(password,user?.salt || '00000000000000000000000000000000',64);
  const expected = user ? Buffer.from(user.password_hash,'hex') : Buffer.alloc(64);
  return timingSafeEqual(hash,expected) && Boolean(user);
}

export function createSession(db,userId,response,secure=false) {
  const token = randomBytes(32).toString('hex'), csrf = randomBytes(32).toString('hex');
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(hashToken(token),userId,csrf,Date.now()+8*60*60*1000);
  response.setHeader('Set-Cookie',`${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure?'; Secure':''}`);
  return csrf;
}

export function getSession(db,request) {
  const token = (request.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const row = db.prepare(`SELECT s.token_hash,s.csrf_token,s.expires_at,u.id,u.name,u.username
    FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).get(hashToken(token),Date.now());
  return row || null;
}

export function destroySession(db,session,response) {
  if(session) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(session.token_hash);
  response.setHeader('Set-Cookie',`${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

export function validCsrf(request,session) {
  const value=request.headers['x-csrf-token'];
  return typeof value==='string' && /^[a-f0-9]{64}$/.test(value) && timingSafeEqual(Buffer.from(value),Buffer.from(session.csrf_token));
}
