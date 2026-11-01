import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const CATEGORIES = ['Cómputo', 'Electrónica', 'Medición', 'Herramientas', 'Redes', 'Audiovisual'];
export const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Santo_Domingo' }).format(new Date());

export function openDatabase(path, { seed = true } = {}) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path, { timeout: 5000 });
  db.exec(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL, salt TEXT NOT NULL, password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      csrf_token TEXT NOT NULL, expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL, category TEXT NOT NULL, location TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Disponible','Prestado','Mantenimiento')),
      brand TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER REFERENCES equipment(id) ON DELETE SET NULL,
      equipment_code TEXT NOT NULL, equipment_name TEXT NOT NULL,
      borrower TEXT NOT NULL, reference TEXT NOT NULL DEFAULT '', loan_date TEXT NOT NULL,
      due_date TEXT NOT NULL DEFAULT '', returned_at TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS one_active_loan ON loans(equipment_id) WHERE returned_at IS NULL;
    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, title TEXT NOT NULL,
      detail TEXT NOT NULL, user_id INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  // A marker prevents deleted example records from reappearing after a restart.
  if (seed && !db.prepare("SELECT 1 FROM metadata WHERE key='demo_seeded'").get()) {
    transaction(db, () => {
      if (!db.prepare('SELECT 1 FROM equipment LIMIT 1').get()) {
        const insert = db.prepare('INSERT INTO equipment(code,name,category,location,status,brand,notes) VALUES(?,?,?,?,?,?,?)');
        for (const record of [
          ['EQ-001','Osciloscopio digital','Medición','Laboratorio 01','Disponible','Rigol DS1054Z'],
          ['EQ-002','Laptop de desarrollo','Cómputo','Laboratorio 02','Disponible','Dell Latitude'],
          ['EQ-003','Multímetro digital','Medición','Laboratorio 01','Mantenimiento','Fluke 117'],
          ['EQ-004','Kit Arduino Uno','Electrónica','Laboratorio 03','Disponible','Arduino'],
          ['EQ-005','Switch de 24 puertos','Redes','Laboratorio de redes','Disponible','Cisco'],
          ['EQ-006','Proyector multimedia','Audiovisual','Almacén principal','Disponible','Epson'],
          ['EQ-007','Fuente de alimentación','Electrónica','Laboratorio 01','Disponible','GW Instek'],
          ['EQ-008','Estación de soldadura','Herramientas','Laboratorio 03','Mantenimiento','Hakko'],
          ['EQ-009','Monitor de 24 pulgadas','Cómputo','Laboratorio 02','Disponible','LG'],
          ['EQ-010','Router de prácticas','Redes','Laboratorio de redes','Disponible','MikroTik'],
          ['EQ-011','Generador de funciones','Medición','Laboratorio 01','Mantenimiento','Siglent'],
          ['EQ-012','Kit de herramientas','Herramientas','Almacén principal','Disponible','Truper'],
        ]) insert.run(...record, 'Registro ficticio para prácticas académicas.');
      }
      db.prepare("INSERT INTO metadata(key,value) VALUES('demo_seeded','1')").run();
    });
  }
  return db;
}

export function transaction(db, action) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = action(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function logActivity(db, userId, kind, title, detail) {
  db.prepare('INSERT INTO activity(user_id,kind,title,detail) VALUES(?,?,?,?)').run(userId,kind,title,detail);
}
