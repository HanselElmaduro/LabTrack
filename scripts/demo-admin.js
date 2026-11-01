import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { openDatabase } from '../01_Sistema/server/database.js';
import { ensureDemoAdmin } from '../01_Sistema/server/demo-admin.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const database = openDatabase(process.env.LABTRACK_DB_PATH || resolve(root, '01_Sistema/data/labtrack.sqlite'));
try {
  ensureDemoAdmin(database, { reset: true });
  console.log('Acceso de demostración preparado: usuario admin, contraseña 1234.');
  console.log('Equipos, préstamos y demás cuentas conservados. Vuelve a iniciar LabTrack.');
} finally {
  database.close();
}
