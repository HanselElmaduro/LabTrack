import { randomBytes, scryptSync } from 'node:crypto';
import { transaction, logActivity } from './database.js';

// Local classroom credentials requested for the demonstration. Existing accounts
// are only changed by the explicit `npm run demo:admin` command, never on startup.
export const DEMO_USERNAME = 'admin';
export const DEMO_PASSWORD = '1234';

export function ensureDemoAdmin(db, { reset = false } = {}) {
  return transaction(db, () => {
    if (!reset && db.prepare('SELECT 1 FROM users LIMIT 1').get()) return false;
    const existing = db.prepare('SELECT * FROM users WHERE username=? COLLATE NOCASE').get(DEMO_USERNAME);
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(DEMO_PASSWORD, salt, 64).toString('hex');
    let id;
    if (existing) {
      id = existing.id;
      db.prepare('UPDATE users SET salt=?,password_hash=? WHERE id=?').run(salt, hash, id);
      db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
    } else {
      const result = db.prepare('INSERT INTO users(username,name,salt,password_hash) VALUES(?,?,?,?)').run(DEMO_USERNAME, 'Administrador', salt, hash);
      id = Number(result.lastInsertRowid);
    }
    logActivity(db, id, 'cuenta', existing ? 'Acceso de demostración restablecido' : 'Acceso de demostración preparado', 'Cuenta administradora para la demostración local.');
    return true;
  });
}
