# Arquitectura de LabTrack 2

LabTrack utiliza frontend HTML, CSS y JavaScript; una API HTTP en Node.js; y SQLite como base de datos del servidor. No requiere paquetes de terceros para ejecutarse.

## Componentes

| Ruta | Responsabilidad |
| --- | --- |
| `01_Sistema/public/` | Acceso, resumen, inventario, préstamos y actividad |
| `01_Sistema/server/index.js` | Servidor HTTP, API y recursos públicos permitidos |
| `01_Sistema/server/database.js` | Esquema, datos ficticios iniciales y transacciones |
| `01_Sistema/server/auth.js` | Hash scrypt, cookies de sesión y validación CSRF |
| `01_Sistema/server/validation.js` | Reglas de equipos, fechas y control de versiones |
| `tests/api.test.js` | Pruebas con HTTP real y SQLite temporal |

## Datos

`users` guarda la cuenta y su hash de contraseña; `sessions` guarda hashes de tokens, vencimiento y token CSRF; `equipment` guarda los equipos; `loans` conserva préstamos y devoluciones; `activity` registra las operaciones; `metadata` evita volver a crear ejemplos después de eliminarlos.

Un equipo solo puede tener un préstamo activo. Prestar y devolver actualiza equipo, préstamo y actividad en una transacción. Un préstamo devuelto conserva el código y nombre del equipo aunque este sea eliminado posteriormente. Las versiones evitan sobrescribir cambios realizados por otra sesión.

## API

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/session` | Estado de acceso y configuración inicial |
| POST | `/api/setup` | Configuración alternativa; se deshabilita al existir un usuario |
| POST | `/api/login`, `/api/logout` | Acceso y cierre de sesión |
| GET | `/api/catalogos`, `/api/resumen` | Categorías, fecha y panel global |
| GET, POST | `/api/equipos` | Consulta paginada o alta |
| GET, PUT, DELETE | `/api/equipos/:id` | Ficha, actualización o eliminación |
| GET, POST | `/api/prestamos` | Historial o nuevo préstamo |
| POST | `/api/prestamos/:id/devolver` | Registra la devolución |
| GET | `/api/actividad` | Últimos 500 movimientos con filtros |
| GET | `/api/exportar` | Respaldo JSON de equipos y préstamos |
| GET | `/api/exportar?formato=csv` | Inventario CSV |

Las operaciones del inventario requieren una sesión. Las mutaciones autenticadas requieren un token CSRF. Se usan consultas preparadas, cookies HttpOnly con SameSite Strict y limitación de intentos de acceso. Las sesiones duran ocho horas y persisten en SQLite.

## Alcance operativo

La ejecución predeterminada es local en `127.0.0.1:3000`. Cada instalación tiene su propia base de datos. GitHub sincroniza código, no los equipos registrados. Para compartir datos, los navegadores deben conectarse al mismo servidor. No se ha publicado un servidor compartido ni se incluye recuperación de contraseña o importación del respaldo. En una instalación nueva se prepara la cuenta de demostración admin / 1234. Si ya existen cuentas, el inicio no las modifica; npm run demo:admin prepara o restablece esa cuenta explícitamente y conserva el inventario y las demás cuentas. No se ofrece gestión de múltiples cuentas desde la interfaz.

La base está en `01_Sistema/data/labtrack.sqlite` y no se publica en GitHub. Para copiarla como respaldo completo, detener el servidor antes de copiar toda la carpeta `data`. Las exportaciones JSON no incluyen usuarios ni sesiones. Si se configura un despliegue HTTPS en el futuro, debe habilitarse `LABTRACK_SECURE_COOKIE=1` y revisarse su configuración operativa.

## Relación con el sprint

Se conservan las siete historias. HU-05 ahora describe una sesión validada por servidor. Las tareas técnicas de persistencia se actualizan a API y SQLite. El equipo debe volver a estimar este alcance en Scrum Poker; no se reutilizan valores orientativos como si fueran votos reales.

