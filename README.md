# LabTrack

**Inventario de laboratorio con CRUD, préstamos, historial y panel de resumen.** Proyecto de Programación III del ITLA para practicar Scrum Poker y Sprint Planning.

La versión 2 tiene una interfaz renovada, servidor Node.js, API HTTP, autenticación de servidor y base de datos SQLite. Los datos permanecen al cerrar el navegador o reiniciar el servidor.

## Iniciar en tu computadora

Requisito: **Node.js 24 o posterior**. No se necesita instalar SQL Server ni dependencias npm.

```bash
git clone https://github.com/HanselElmaduro/LabTrack.git
cd LabTrack
npm start
```

Si ya habías clonado el repositorio, ejecuta `git pull --ff-only` en su carpeta antes de iniciarlo.

Abre **http://localhost:3000** e inicia sesión con las credenciales de demostración local:

- **Usuario:** `admin`
- **Contraseña:** `1234`

En una instalación nueva, esta cuenta se prepara automáticamente. Si ya utilizabas LabTrack, detén el servidor con `Ctrl+C` y ejecuta:

```bash
git pull --ff-only
npm run demo:admin
npm start
```

El comando prepara o restablece únicamente el acceso de `admin`; conserva equipos, préstamos y las demás cuentas. Invalida las sesiones anteriores de ese administrador. La contraseña se almacena como hash scrypt. La sesión vence a las ocho horas o cuando la cierras. Estas credenciales están destinadas a la demostración local.

En Windows también puedes abrir **Iniciar_LabTrack.bat**. Mantén la terminal abierta durante el uso y la presentación. Pulsa `Ctrl+C` para detener el servidor. Una vez instalado Node y descargado el proyecto, la demostración local no necesita Internet.

**La versión actual se ejecuta con el servidor.** Abrir el HTML con Live Server no ejecuta la API ni la base de datos. `01_Sistema/LabTrack.html` contiene instrucciones para abrirla. El prototipo anterior se conserva en `01_Sistema/legacy/` solo como referencia.

## Funcionalidades

- **Resumen:** cifras globales, distribución por estado, equipos recientes, préstamos y actividad.
- **Equipos:** CRUD, código único, filtros por estado y categoría, búsqueda por nombre/código/marca, paginación y ficha detallada.
- **Préstamos:** solicitante, fecha, referencia opcional, devolución prevista, bloqueo de préstamos incompatibles y devolución confirmada.
- **Historial:** conserva los préstamos devueltos incluso si el equipo se elimina después.
- **Actividad:** registra altas, cambios, bajas, préstamos y devoluciones con fecha y usuario.
- **Exportación:** inventario CSV y respaldo JSON de equipos y préstamos. No hay importador automático.

El inventario inicial incluye doce equipos ficticios para prácticas; se pueden editar o eliminar y no reaparecen al reiniciar. Los datos no se guardan en localStorage. La sesión utiliza cookie HttpOnly; las contraseñas se almacenan como hash scrypt.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `01_Sistema/public/` | Interfaz HTML, CSS y JavaScript |
| `01_Sistema/server/` | API, autenticación, validaciones y SQLite |
| `01_Sistema/data/` | Datos locales de ejecución, excluidos de Git |
| `02_Planificacion/` | Plan Word/PDF, respaldo del backlog y registro de Poker |
| `03_Evidencias/` | Enlaces y alcance de la verificación |
| `tests/` | Pruebas de integración de la versión actual |
| `04_Pruebas/` | Pruebas históricas del primer prototipo |
| `docs/` | Arquitectura y guion actualizado para los siete integrantes |

## Comprobar el sistema

```bash
npm test
```

Ejecuta 15 pruebas de integración con HTTP real y SQLite temporal: autenticación, CRUD, validaciones, conflictos de edición, préstamos, exportaciones, seguridad de rutas y persistencia tras reiniciar. Las pruebas no utilizan ni eliminan el inventario de la aplicación.

La interfaz de acceso se revisó visualmente. La validación manual de las pantallas internas y del recorrido completo en navegador sigue pendiente; los detalles están en `03_Evidencias/Verificacion_del_sistema.txt`. El grupo debe ensayar el guion antes de grabar.

Para desarrollo con reinicio automático, usa `npm run dev`.

## Jira y trabajo en equipo

[Actividades de LabTrack en Jira](https://hanselh151.atlassian.net/issues?jql=project%20%3D%20KAN%20AND%20labels%20%3D%20labtrack).

El backlog conserva **4 épicas, 7 historias y 56 subtareas**. Ya está cargado: no vuelvas a importar `Backlog_Jira.csv`. Las fechas y puntos finales del sprint requieren los acuerdos reales del equipo. La versión con servidor debe estimarse considerando ese alcance actualizado.

Trabaja en una rama por cambio y usa la clave de Jira en los commits; consulta [CONTRIBUTING.md](CONTRIBUTING.md). Los colaboradores necesitan acceso al repositorio privado. Cada computadora tiene su propia base; para compartir inventario se requiere conectarse al mismo servidor. Este repositorio no incluye un servidor publicado.

## Documentación y entrega

- [Arquitectura y API](docs/Arquitectura.md).
- [Guion del video del incremento para los siete integrantes](docs/Guion_video_incremento.md).
- Plan de sprint en Word y PDF en `02_Planificacion/`; conserva fechas propuestas y puntos pendientes.

La entrega académica requiere los dos videos en OneDrive, acceso a Jira, demostración en vivo y entrega individual de los siete integrantes. GitHub es el espacio de trabajo y se enlaza desde la carpeta de OneDrive. No modificar los entregables después del cierre.

