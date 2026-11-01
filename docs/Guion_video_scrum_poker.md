# Guion del video de Scrum Poker

Versión 2 de LabTrack. Cada integrante presenta una historia y facilita su ronda. Todos los integrantes que realizarán el trabajo votan de manera independiente. No preparar resultados ni inventar acuerdos. Mostrar Jira en pantalla y las tarjetas físicas o digitales.

## Pedro y apertura

“Buenas. Somos el equipo de LabTrack. Hoy estimaremos siete historias de un sistema de gestión de laboratorio con interfaz web, API Node.js y SQLite.”

Cada integrante dice su nombre y matrícula.

“Usaremos uno, dos, tres, cinco, ocho y trece puntos para representar esfuerzo y complejidad, no horas. Cada persona elige su carta sin mostrarla. Revelamos todos a la vez y discutimos las diferencias antes de acordar un valor.”

## Pedro y HU 05 acceso

Mostrar KAN-44.

“Como encargado quiero iniciar sesión con mi cuenta para acceder al inventario. La primera vez se crea la cuenta. Las credenciales correctas permiten el acceso y las incorrectas muestran un error. La sesión debe mantenerse al recargar hasta cerrarla o vencer. Consideraremos el formulario, la validación en servidor, el hash de contraseña, las sesiones y las pruebas.”

Realizar la ronda descrita abajo.

## Ángel y HU 01 registrar equipos

Mostrar KAN-8.

“Como encargado quiero registrar un equipo para mantener actualizado el inventario. Se guardan nombre, categoría, código, estado y ubicación. Debe aparecer en la lista y conservarse en SQLite. Se rechazan campos vacíos y códigos duplicados, aunque cambien las mayúsculas. Consideraremos formulario, API, validaciones, almacenamiento y pruebas.”

Realizar la ronda.

## Gabriel y HU 02 listar y buscar

Mostrar KAN-17.

“Como encargado quiero consultar y buscar equipos para encontrarlos rápidamente. Debemos ver sus datos y el préstamo actual, buscar por nombre o código y filtrar por estado. Si no hay coincidencias se muestra un mensaje. La interfaz también permite filtrar por categoría y consultar páginas. Consideraremos consulta, presentación, filtros y pruebas.”

Realizar la ronda.

## Hansel y HU 03 editar equipos

Mostrar KAN-26.

“Como encargado quiero modificar un equipo para corregir su información. El formulario carga sus datos, guarda cambios válidos y rechaza duplicados o campos obligatorios vacíos. Si el equipo está prestado, conserva solicitante, fecha y estado. La API controla versiones para evitar sobrescrituras desde otra sesión. Consideraremos actualización, validación y pruebas.”

Realizar la ronda.

## Eduardo y HU 04 eliminar equipos

Mostrar KAN-35.

“Como encargado quiero eliminar equipos dados de baja para mantener limpio el inventario. El sistema pide confirmación. Si cancelamos, conserva el registro; si aceptamos, la eliminación permanece al recargar. Los equipos prestados no pueden eliminarse. Consideraremos el diálogo, el bloqueo del servidor, la operación en SQLite y sus pruebas.”

Realizar la ronda.

## Keinel y HU 06 préstamos y devoluciones

Mostrar KAN-53.

“Como encargado quiero registrar quién recibe un equipo y cuándo. Solo se prestan equipos disponibles, con solicitante y fecha válida. No se aceptan fechas futuras ni un segundo préstamo activo. La devolución vuelve a dejar disponible el equipo y conserva el préstamo en el historial. Consideraremos las transacciones, los estados, los formularios y las pruebas.”

Realizar la ronda.

## Lesli y HU 07 panel de resumen

Mostrar KAN-62.

“Como encargado quiero consultar las cantidades por estado para conocer la situación del laboratorio. El panel muestra total, disponibles, prestados y mantenimiento. Los contadores cambian después de cada operación. En un inventario vacío muestran cero y los filtros de la tabla no alteran los totales. Consideraremos los cálculos, la presentación y las pruebas.”

Realizar la ronda.

## Ronda después de cada historia

La persona que presenta pregunta si hay dudas y las resuelve con el grupo. Después dice:

“Cada uno elija su estimación sin mostrarla. Tres, dos, uno: mostramos.”

Revelar votos simultáneamente. Si hay diferencias:

“Quienes eligieron el valor menor y el mayor, expliquen sus razones.”

Conversar y volver a votar si corresponde. Cada integrante debe explicar al menos una estimación durante la grabación. Finalmente:

“Acordamos [resultado real] puntos para esta historia.”

Guardar ese resultado en Jira y en Registro_Scrum_Poker.csv. Los valores orientativos anteriores no sustituyen las votaciones de esta versión.

## Planificación y cierre compartido

Pedro muestra el total real de puntos. Cada uno de los siete comenta su disponibilidad. Revisar las tareas técnicas y funcionales, dependencias y pruebas; seleccionar solo lo que puedan completar y acordar el objetivo. Confirmar inicio, final, Daily y Sprint Review con las fechas reales de la tarea. No leer como definitivas las fechas propuestas del documento.

Lesli cierra:

“Acordamos incluir [historias seleccionadas] con el objetivo de [objetivo]. El sprint comienza el [fecha] y termina el [fecha]. Las Daily están programadas para [fechas y hora], antes del Sprint Review del [fecha y hora]. Las estimaciones y la planificación quedaron registradas en Jira. Gracias.”

