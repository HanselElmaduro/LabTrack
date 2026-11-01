# LabTrack

Sistema de inventario de equipos de laboratorio para la práctica de **Scrum Poker y Sprint Planning de Programación III, ITLA**.

## Ejecutar el sistema

```bash
git clone https://github.com/HanselElmaduro/LabTrack.git
cd LabTrack
```

1. Descarga o clona este repositorio.
2. Abre `01_Sistema/LabTrack.html` en tu navegador.
3. Usa las credenciales de demostración: usuario **admin**, contraseña **1234**.

No requiere instalar paquetes, servidor ni base de datos. También puedes abrir el HTML con Live Server desde VS Code.

## Funciones

- Registrar, consultar, buscar, editar y eliminar equipos.
- Validar campos obligatorios y códigos únicos sin distinguir mayúsculas.
- Filtrar equipos por estado.
- Registrar préstamos con solicitante y fecha; registrar devoluciones.
- Bloquear la eliminación de equipos prestados.
- Consultar cantidades totales y por estado.
- Descargar un respaldo JSON del inventario.

## Alcance del prototipo

Los datos se guardan en **localStorage del navegador**. La sesión de demostración utiliza sessionStorage. No hay backend, sincronización entre integrantes ni autenticación de producción. Las credenciales están incluidas en el código por ser una demostración local. El respaldo JSON tiene exportación; todavía no hay una función para importarlo.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `01_Sistema/` | Aplicación HTML autocontenida |
| `02_Planificacion/` | Plan en Word y PDF, backlog, registro de Poker y referencias de Jira |
| `03_Evidencias/` | Registro de enlaces y alcance de la verificación |
| `04_Pruebas/` | Pruebas de lógica con Node.js y DOM simulado |
| `CONTRIBUTING.md` | Pasos para trabajar en ramas y revisar cambios |

## Planificación en Jira

[Abrir las actividades de LabTrack](https://hanselh151.atlassian.net/issues?jql=project%20%3D%20KAN%20AND%20labels%20%3D%20labtrack).

El backlog tiene cuatro épicas, siete historias y 56 subtareas. **Ya está cargado: no vuelvas a importar `Backlog_Jira.csv`.**

El sprint `LabTrack · Sprint 1` está preparado. Las fechas, el alcance definitivo y los puntos acordados por el equipo deben completarse con los resultados reales. Las estimaciones orientativas de los documentos no sustituyen una votación de Scrum Poker.

## Pruebas

Con Node.js 18 o posterior instalado:

```bash
npm test
```

No hace falta ejecutar `npm install`: no hay dependencias. El comando ejecuta 27 comprobaciones del JavaScript con DOM y almacenamiento simulados y actualiza `03_Evidencias/Verificacion_del_sistema.txt`.

Estas comprobaciones no verifican la apariencia, las restricciones nativas de formularios ni la descarga real en el navegador. Antes de grabar, el equipo debe recorrer manualmente el CRUD, los préstamos y las devoluciones en su navegador.

## Trabajo en equipo

Trabaja en una rama por cambio, usa la clave de Jira en los commits y abre un pull request para revisión. Consulta [CONTRIBUTING.md](CONTRIBUTING.md).

Git sincroniza el código y los documentos; cada navegador conserva su propio inventario de prueba. Los colaboradores deben ser invitados al repositorio con sus cuentas reales.

## Entrega académica pendiente

- Confirmar roles, fechas, capacidad y alcance del sprint.
- Grabar Scrum Poker y registrar los puntos reales en Jira y en el registro de votación.
- Grabar la demostración funcional y presentar el sistema en vivo en clase.
- Reunir videos, documentos y enlaces en la carpeta compartida de OneDrive requerida por la consigna.
- Comprobar el acceso de los evaluadores y la entrega individual de los siete integrantes.
- Mantener la entrega sin modificaciones después de su fecha de cierre.

Este repositorio sirve como espacio de trabajo. La entrega de la asignación se realiza mediante el enlace de OneDrive.
