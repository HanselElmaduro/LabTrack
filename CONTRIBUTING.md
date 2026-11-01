# Trabajar en LabTrack

## Antes de cambiar archivos

1. Elige una tarea del backlog de Jira y acuerda quién la trabajará.
2. Actualiza tu copia de `main`.
3. Crea una rama con el identificador de la historia y una descripción corta.

```bash
git switch main
git pull --ff-only
git switch -c mejora/KAN-26-editar-equipo
```

## Verificar y subir cambios

1. Abre `01_Sistema/LabTrack.html` y prueba la funcionalidad modificada.
2. Ejecuta `npm test` si cambias la lógica del sistema.
3. Revisa los archivos antes de agregarlos. No subas contraseñas reales, archivos `.env`, datos personales de usuarios del laboratorio ni grabaciones.
4. Haz un commit que explique el cambio y súbelo a tu rama.

```bash
git status
git add 01_Sistema/LabTrack.html
git commit -m "KAN-26: describir el cambio realizado"
git push -u origin mejora/KAN-26-editar-equipo
```

Si también modificas documentación o pruebas, agrega sus rutas explícitamente antes del commit.

## Revisar e integrar

Abre un pull request hacia `main` con el problema que resuelve, la clave de Jira y lo que comprobaste. Otro integrante debe revisar el cambio antes de integrarlo. Después actualiza el estado real de la tarea en Jira.

Los valores de Scrum Poker y las evidencias deben reflejar lo ocurrido. No vuelvas a importar el CSV del backlog: las actividades ya existen en Jira. Acuerden quién actualiza los documentos Word y PDF para evitar versiones incompatibles.

## Datos del navegador

Cada integrante trabaja con su propio localStorage. Un `git pull` no descarga los equipos que otra persona haya registrado dentro de la aplicación. Utiliza datos ficticios durante las pruebas y las grabaciones.
