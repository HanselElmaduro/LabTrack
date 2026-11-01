# Guion del video del incremento funcional

Versión 2 de LabTrack. Cada integrante presenta una parte. Pedro abre, Lesli cierra y Hansel participa en el medio. Realizar cada operación mientras se explica; los resultados deben verse en pantalla.

## Preparación

Instalar Node.js 24, ejecutar `npm start` y abrir `http://localhost:3000`. Preparar el acceso de demostración admin / 1234 antes de grabar; en una instalación existente ejecutar npm run demo:admin con el servidor detenido. Ensayar el recorrido. El inventario inicial contiene doce equipos ficticios. Usar un código nuevo, como `DEMO-001`, y la fecha real del día. No grabar la contraseña al escribirla ni mostrar la base de datos con hashes o sesiones.

## Pedro Julio López Mancebo

“Buenas. Presentamos LabTrack, una aplicación de gestión de equipos de laboratorio. Mostraremos el CRUD, los préstamos y devoluciones y el panel de resumen. La aplicación utiliza una interfaz web, una API Node.js y una base de datos SQLite.”

Mostrar un acceso incorrecto y después iniciar sesión con la cuenta creada previamente.

“El servidor valida las credenciales. Al ingresar correctamente, accedemos al resumen del laboratorio.”

## Ángel Eramerlis Ciprian

Ir a Equipos y seleccionar Nuevo equipo.

“Comenzaremos creando un equipo con nombre, categoría, código, ubicación y estado Disponible. También podemos registrar su marca y notas.”

Guardar el equipo `DEMO-001`.

“El equipo queda registrado en la base de datos. Al intentar utilizar el mismo código otra vez, el servidor rechaza el duplicado.”

Mostrar el mensaje y cancelar el formulario duplicado.

## Gabriel Robles

“Podemos consultar el inventario y buscar por nombre, código o marca. También tenemos filtros por categoría y estado.”

Buscar `DEMO-001`, mostrar un filtro y luego una búsqueda sin resultados. Limpiar los filtros. Abrir la ficha del equipo con el botón Ver.

“La ficha permite consultar sus datos, notas y últimos préstamos. La lista tiene paginación para facilitar la consulta.”

Cerrar la ficha.

## Hansel Hernández

“Ahora vamos a editar la ubicación del equipo. El formulario carga la información existente; hacemos el cambio y guardamos.”

Cambiar la ubicación de `DEMO-001`, guardar y recargar la página. Buscar de nuevo el equipo si hace falta.

“La modificación permanece después de recargar porque se guardó en SQLite mediante la API. Si otra sesión cambia el mismo registro, el sistema impide sobrescribir una versión desactualizada.”

No simular un conflicto si no se preparó realmente la segunda sesión.

## Keinel José Feliz Vasquez

“Vamos a registrar un préstamo para este equipo disponible. Indicamos un solicitante ficticio, la fecha de hoy y, si lo deseamos, una devolución prevista.”

Prestar `DEMO-001` y abrir Préstamos.

“El equipo aparece en los préstamos en curso. Mientras está prestado, no puede volver a prestarse ni eliminarse. Ahora confirmamos su devolución.”

Devolver el equipo y abrir la pestaña Devueltos.

“El equipo vuelve a Disponible y el préstamo se conserva en el historial.”

## Eduardo Sanchez

Volver a Equipos y buscar `DEMO-001`.

“Completaremos el CRUD eliminando el equipo de prueba. Primero cancelamos la confirmación y comprobamos que permanece.”

Cancelar una eliminación. Después repetir y confirmar. Recargar y buscar el código.

“Después de confirmar, el equipo ya no aparece. La eliminación se mantiene al recargar, y el historial del préstamo se conserva aunque se haya eliminado el equipo.”

## Lesli Esthefani De La Cruz

Abrir Resumen y después Actividad.

“El panel muestra el total de equipos, los disponibles, los prestados y los que están en mantenimiento. Sus cifras se actualizan con las operaciones. En Actividad podemos consultar los registros, cambios y devoluciones realizados.”

Mostrar la exportación CSV desde Equipos. Si se desea, abrir una ficha de otro equipo para descargar el respaldo JSON. No afirmar que el JSON se puede restaurar desde la aplicación: no hay importador.

“Demostramos las cuatro operaciones del CRUD, el acceso validado por el servidor y el control de préstamos. Los datos permanecen en SQLite al cerrar el navegador o reiniciar el servidor. Este es el incremento que presentaremos funcionando en clase. Gracias.”

## Antes de finalizar

Comprobar que se ve cada resultado y que se escuchan los siete integrantes. Relacionar la demostración con las historias de Jira. Guardar el video en OneDrive y verificar sus permisos. El video no sustituye la demostración en vivo.

