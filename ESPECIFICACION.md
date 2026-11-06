# Especificación de Telas JY

Lo que el dueño pidió, pantalla por pantalla. Marcado como [HECHO] si ya está en la app y
[PENDIENTE] si todavía no.

## Personas y permisos

Solo dos cuentas: dueño y vendedora. Sin registro público.

- Ambos: crear pedidos, registrar pagos, marcar cortes como hechos, cambiar el estado del pedido
  (menos cancelar), descargar el PDF de un pedido, ver pedidos, cortes y saldos. [HECHO]
- Ambos: completar o corregir los datos de envío (nombre, celular, ciudad y trópico) de un pedido
  de envío que no esté cancelado. Es lo único del pedido, además del estado, que la vendedora
  puede cambiar; lo aplica la base de datos. [HECHO]
- Solo dueño: agregar diseños, verificar y anular pagos, cancelar pedidos, cambiar recargos
  (70 Bs de doble forro, 20 Bs de trópico), ver el historial completo, registrar retiros de
  efectivo, descargar PDF de reportes, administrar la cuenta y el horario de la vendedora,
  ver el historial de accesos. [HECHO]
- Vendedora en el historial: solo el día de hoy, sin retiros. [HECHO, a nivel de pantalla]
- Cada pedido y cada pago guarda quién lo registró y cuándo. [HECHO]

## Cuenta y horario de la vendedora

- El dueño crea la cuenta de la vendedora desde la app (correo y contraseña, con botón
  "Generar") mediante la función de Netlify. La contraseña no se vuelve a mostrar. Puede
  activar o desactivar su acceso. [HECHO]
- Horario por día (lunes a domingo, hora de Bolivia, desde y hasta). Se aplica en la base de
  datos: fuera de horario no puede leer ni escribir datos. Al entrar fuera de horario ve la
  pantalla "Fuera de horario". Dentro del horario se le avisa 10 minutos antes de la salida
  y su sesión se cierra sola. [HECHO]
- Historial de accesos con ingresos e intentos fuera de horario (en rojo). [HECHO]
- Cambiar contraseña para ambos usuarios. [HECHO]

## Nuevo pedido

- Cliente: solo el celular es obligatorio; no hay campo de nombre. Si el celular ya tiene
  pedidos, aviso discreto "Cliente con 3 pedidos anteriores" (o "con 1 pedido anterior"), sin
  autocompletar nada. El celular se normaliza al guardar: sin espacios, guiones, paréntesis ni
  "+", y sin el 591 inicial si el número tiene 11 dígitos (+591 7123 4567 queda 71234567). Se
  hace en la pantalla y en `crear_pedido`. Los datos viejos no se tocan. [HECHO]
- Varios cortes por pedido, de distintos diseños (y varios del mismo). Cada corte: diseño de una
  lista, medida en cm, costo por metro. [HECHO]
- Doble forro opcional por corte: +70 Bs y color obligatorio. [HECHO]
- Subtotal de cada corte redondeado hacia arriba a Bs enteros (10,2 → 11; 0,6 → 1). [HECHO]
- Entrega: retiro en tienda o envío. Envío (a cualquier destino): nombre completo, celular y
  ciudad, los tres OPCIONALES al crear el pedido ("Puedes completarlos después"); si es para
  trópico se suman 20 Bs. Nada más (sin departamento, transporte ni guía). [HECHO]
- No se pide fecha de entrega. La base de datos la exige, así que se guarda la fecha de hoy sin mostrarla. [HECHO]
- Medida (cm) y costo por metro aceptan coma o punto (80,5 u 80.5), con máximo 2 decimales;
  si hay más, mensaje rojo "Usa máximo 2 decimales". Lo que se calcula en pantalla y lo que se
  envía es el mismo número normalizado con punto. [HECHO]
- Adelanto opcional (entre Entrega y el total): método Efectivo, QR o Mixto, monto en Bs enteros,
  botón "Paga todo" (en Mixto pone el total en Efectivo). En el cuadro del total se ve el
  adelanto y el saldo pendiente en vivo; con saldo 0 y total mayor que 0 dice "Pedido pagado
  por completo". Validación: entero, sin negativos, sin superar el total; 0 o vacío no crea
  pago. El pago se guarda junto con el pedido en `crear_pedido` (campos `pago_efectivo` y
  `pago_qr`), todo en una sola operación: si algo falla no se crea ni el pedido ni el pago.
  El pago nace sin verificar y la base pone la fecha y el autor. [HECHO]
- Solo el dueño agrega diseños a la lista; la vendedora solo elige. [HECHO]

## Datos de envío después de crear el pedido (ambos)

- En el detalle de un pedido de envío hay una sección "Datos de envío" con un formulario
  (nombre completo, celular, ciudad y casilla de trópico) y el botón "Guardar datos de envío".
  Al guardar se recargan los datos, así el total y el saldo se actualizan. Un pedido cancelado
  no se puede editar. [HECHO]
- Si falta el nombre, el celular o la ciudad: aviso ámbar "Datos de envío pendientes" arriba del
  formulario y etiqueta ámbar con el mismo texto en la fila del pedido en la lista de Pedidos. [HECHO]
- El costo de envío NO lo manda la pantalla: al cambiar el trópico lo recalcula la base de datos
  con el valor actual de Ajustes. Cambiar el costo sin cambiar el trópico se rechaza. Si el nuevo
  total quedara menor que lo ya pagado (pagos no anulados), se rechaza con un mensaje claro. [HECHO]

## Pedidos sin nombre

- Donde antes salía el nombre del cliente (lista de Pedidos, detalle, Cortes, Historial, Saldos y
  PDF) se muestra el celular como título cuando no hay nombre. Los pedidos viejos conservan el suyo.
- Saldos agrupa por celular (normalizado). El PDF del pedido omite la fila "Nombre" si no hay, y el
  mensaje de WhatsApp empieza "Hola, este es el resumen de tu pedido…" sin nombre.
- El buscador de Pedidos ignora espacios y guiones al comparar celulares. [HECHO]

## Estados y saldo

- Estados: En proceso (automático), Listo, Entregado, Cancelado (solo dueño). [HECHO]
- Avance de cortes como "Cortes X de Y". Al terminar todos, aviso "¿Marcar como listo?". [HECHO]
- Saldo pendiente siempre muy visible en rojo ("Debe X Bs"), también en pedidos entregados. [HECHO]

## Editar pedidos
- Solo el dueño ve "Editar pedido" (en el detalle, junto a Cortes). No se puede editar un pedido cancelado. [HECHO]
- Se editan los cortes (diseño, medida, costo por metro, doble forro y color; agregar y quitar) y la entrega (retiro o envío, datos de envío y trópico). No se editan los datos del cliente. [HECHO]
- El total nuevo nunca puede quedar menor que lo ya pagado: se bloquea y avisa que primero hay que anular un pago. Lo valida la base de datos (función editar_pedido). [HECHO]
- Los cortes que siguen conservan su estado "hecho" y el recargo de doble forro con el que se crearon. [HECHO]

## Comprobante verificado en el banco
- El dueño verifica cada pago manualmente en su banco y marca "Verificado en el banco" (pagos con QR) o "Verificado" (efectivo). Sin foto ni número de operación. [HECHO]
- En la lista de pedidos, el dueño ve "QR sin verificar en el banco" mientras falte alguna verificación. [HECHO]

## Eliminar pedidos
- Solo el dueño ve el botón "Eliminar pedido" (al final del detalle) y la base de datos también lo exige.
- Pide confirmación y borra el pedido con sus cortes. No se puede deshacer. [HECHO]
- Se puede eliminar cualquier pedido, también con adelanto o pagos: sus cortes y pagos se borran con él (la confirmación avisa cuántos pagos tiene). Esto cambia el efectivo y el historial. [HECHO]

## Pagos

- Parciales o "completar pago". Método: efectivo, QR o mixto. Montos en Bs enteros. [HECHO]
- Sin número de operación y sin fotos de comprobantes. [HECHO]
- Casilla "verificado" (solo dueño). Anular pago con motivo obligatorio (solo dueño); queda
  tachado y no suma. [HECHO]
- Nunca más que el saldo. [HECHO]

## Cortes

- Pantalla por diseño con cortes pendientes, cantidad y metros. Cada corte se marca como hecho
  y se tacha. No se agrupan cortes iguales. Sincronizada con el detalle del pedido. [HECHO]

## Historial (dueño; la vendedora solo hoy)

- Vistas: Pagos, Ventas, Entregas, Retiros (solo dueño). Por día, con subtotal diario. [HECHO]
- Filtros: Hoy, Ayer, 7 días, Este mes, Todo, rango Desde/Hasta. En Pagos: efectivo / QR / todos
  (los mixtos se separan). [HECHO]
- Entregas con saldo en rojo. [HECHO]
- [PENDIENTE] Buscador por cliente dentro del historial.
- [PENDIENTE] Filtro "solo pagos sin verificar".
- [PENDIENTE] Filtro "entregados con saldo".
- [PENDIENTE] Metros vendidos por diseño en el periodo.
- [PENDIENTE] Comparación con el periodo anterior (hoy vs. ayer, esta semana vs. la pasada).
- [PENDIENTE] Historial de pedidos por cliente (por celular).

## Retiros de efectivo (solo dueño)

- Sin cierre de caja. Se muestra el último retiro y el efectivo cobrado desde entonces, un campo
  de monto (con "Usar todo") y confirmación antes de guardar. Se guarda solo monto y fecha. [HECHO]

## PDF y WhatsApp

- PDF (nunca Excel): pedido, historial del periodo, saldos pendientes, cortes pendientes. [HECHO]
- Compartir resumen del pedido por WhatsApp. [HECHO]

## Diseño

- Estilo "Obsidiana": fondo oscuro por defecto (claro automático según el dispositivo), acento
  champagne #D6B97A, cobre para lo malo, tipografía Manrope. Barra inferior en celular y barra de
  íconos lateral en pantallas anchas (cambia en la Fase 0). Botones de al menos 44 px. [HECHO]
- Las muestras de color de los diseños se quitan en la Fase 0.

## PLAN POR FASES (pedido del dueño, 6 nov 2026)

Se trabaja una fase a la vez; el dueño escribe "sigue con la Fase N" para pasar a la siguiente.

Reglas para todas las fases:
- Mantener colores, tipografías y estilo actuales (diseño Obsidiana). No cambiar lo que ya existe:
  cálculos de dinero y redondeo hacia arriba, permisos del dueño y la vendedora, horario, adelanto,
  pedidos sin nombre y datos de envío opcionales.
- Los permisos se aplican en la base de datos (RLS y triggers), no solo en la pantalla.
- Orden: primero Supabase, después GitHub. El SQL se entrega como el archivo completo
  `supabase/01_esquema.sql` (repetible) más un archivo de comprobación nuevo.
- Pruebas del dueño: celulares 7000000X y nombres que empiecen con "PRUEBA". Al final de cada fase se
  actualiza `supabase/04_limpiar_pruebas.sql` (tablas nuevas, borrados desactivados y con revisión previa)
  y se agregan los casos de la fase a `PRUEBAS.md`.
- Cada pantalla nueva o cambiada se verifica en 1024x768, 1180x820, 1280x800 y 1366x1024 (horizontal),
  tablet vertical, celular y laptop: sin scroll horizontal, botones de al menos 44 px y, con el teclado
  abierto, el campo activo y el botón principal visibles.
- Sin librerías nuevas. `node --check`. Pedir confirmación antes de cambiar la base real o hacer git push.

### Fase 0: estructura, filtros y orden [PENDIENTE, Fase 0]
Se hace en la copia `telas-jy-estructura-d` (puerto 8775); no se toca la original hasta que el dueño diga OK.

Regla de "Atrasado" (una sola definición, constante DIAS_ATRASO = 7 en app.js): un pedido En proceso o Listo
que lleva MÁS de 7 días desde que se registró (fecha de creación en hora de Bolivia, America/La_Paz). Los
entregados y cancelados nunca son atrasados. Se usa en la tarjeta "Atrasados", la etiqueta "Atrasado" de cada
fila, el filtro "Atrasados" y el grupo "Atrasados" del Panel de entregas. La fecha de entrega (fecha_entrega)
ya no se muestra ni se usa en pantalla: Nuevo pedido NO pide fecha y la base guarda la de hoy.
1. [PENDIENTE, Fase 0] Menú: desde 900 px, barra superior fija con logo y botones con ícono y texto
   (Pedidos, Nuevo, Cortes, Historial, Más). Menos de 900 px: barra inferior como hoy.
2. [PENDIENTE, Fase 0] Pedidos: cuatro tarjetas arriba (Por cobrar en rojo, Cortes pendientes, Atrasados,
   Entregados de los últimos 7 días); buscador por celular o número y selector de orden; filtros como
   botones con cantidad (Todos, En proceso, Listos, Entregados, Con saldo, Atrasados (más de 7 días), Cortes
   pendientes, Panel de entregas con tres grupos: Atrasados; Con saldo pendiente; Entregados últimos 7 días); tabla a
   ancho completo con Pedido, Cliente, Registrado (fecha y "hace N días"; en los entregados, "Entregado" y su fecha), Cortes (segmentos y "X de Y"), Estado, Total y Saldo
   ("Debe X Bs" en rojo o "Pagado"). Menos de 900 px se ocultan Registrado, Cortes y Estado (el estado pasa
   bajo el cliente).
3. [PENDIENTE, Fase 0] Detalle del pedido en panel lateral derecho (máx. 560 px, pantalla completa en
   celular), con botón Cerrar, cierre al tocar fuera o con Esc. Contenido: el detalle actual. Al cambiar
   algo dentro el panel sigue abierto y conserva el scroll; la animación solo al abrir; respeta
   prefers-reduced-motion.
4. [PENDIENTE, Fase 0] Orden con filtro "Todos" y orden "Por estado" (predeterminado): grupos con título y
   cantidad: En proceso, Listos, Entregados, Cancelados. En En proceso y Listos, los MÁS ANTIGUOS arriba (por
   fecha de creación). En Entregados, la fecha de entrega real (fecha_entregado), la más reciente arriba. En
   Cancelados, la más reciente arriba por fecha de registro (no se guarda la fecha de cancelación). Si un
   pedido cambia de estado, se mueve solo y aparece un aviso corto con el grupo al que pasó ("Pedido N pasó a
   Listos"). Entregados y Cancelados plegados por defecto (título con cantidad, botón Mostrar/Ocultar y
   etiqueta roja "N con saldo" si aplica); con texto en el buscador se despliegan solos. El filtro
   "Entregados" muestra todos. Selector de orden: "Por estado (recomendado)", "Más antiguos primero" y "Más
   nuevos primero" (estas dos, listas planas sin grupos, con los activos primero y luego entregados y
   cancelados). Con cualquier filtro distinto de Todos, lista plana con el mismo criterio de orden.
5. [PENDIENTE, Fase 0] Nuevo pedido: una sola columna ancha (máx. 880 px) con barra fija abajo con Total,
   Adelanto, Saldo pendiente (rojo) y botón Guardar pedido.
6. [PENDIENTE, Fase 0] Cortes: lista agrupada por diseño, con el nombre como encabezado (cantidad de cortes
   y metros) y los cortes debajo con su casilla.
7. [PENDIENTE, Fase 0] Más: pestañas arriba (Saldos, Ajustes, Accesos). Historial y demás pantallas
   centradas con ancho máximo cómodo.
8. [PENDIENTE, Fase 0] Diseños sin color: solo texto en lista; quitar muestras de color en todas partes
   (cortes, selector, detalle, lista de Cortes). En Ajustes, crear un diseño pide solo el nombre. No se
   borran las columnas patron y color de la base.

### Fase 1: nota y recordar saldo [PENDIENTE, Fase 1]
- [PENDIENTE, Fase 1] Nota por pedido: opcional, máx. 300 caracteres. Se escribe en Nuevo pedido; dueño y
  vendedora la editan en el detalle. Se ve en el detalle, como línea gris bajo el cliente en la tabla y en
  el PDF del pedido. Columna nueva en pedidos; el trigger debe permitir que ambos roles la cambien.
- [PENDIENTE, Fase 1] Recordar saldo por WhatsApp: un solo botón "Recordar saldo" dentro del bloque rojo de
  saldo (solo con saldo y no cancelado). Abre una ventana con el mensaje escrito y "Abrir WhatsApp" que abre
  wa.me al celular del cliente del pedido (no al de envío; con 8 dígitos se antepone 591). Texto por
  defecto: "Hola, te recuerdo que tu pedido {pedido} de Telas JY tiene un saldo pendiente de {saldo}.
  Puedes pagarlo en efectivo o por QR cuando quieras. ¡Gracias!". El dueño lo edita en Ajustes (usa
  {pedido} y {saldo}); se guarda en la tabla ajustes. Al tocar "Abrir WhatsApp" se guarda fecha y hora del
  último recordatorio en el pedido (ambos roles) y se muestra en el bloque ("Último recordatorio: 5 nov").
  NO hay botón de "avisar que está listo".

### Fase 2: editar cortes [PENDIENTE, Fase 2]
- [PENDIENTE, Fase 2] En pedidos no Entregados ni Cancelados: cada corte tiene "Editar" y "Quitar" y el
  pedido "Agregar corte"; editar y agregar abren una ventana con diseño, medida, costo por metro, doble
  forro y color. (Reemplaza/convive con la pantalla "Editar pedido" actual del dueño; definir al hacerla.)
- [PENDIENTE, Fase 2] Un corte hecho no se edita ni se quita ("desmárcalo primero").
- [PENDIENTE, Fase 2] Vendedora: cambia diseño, medida y doble forro y agrega cortes (escribe el costo por
  metro del corte nuevo). Solo el dueño cambia el costo por metro de un corte existente o quita un corte.
  Lo aplica la base de datos.
- [PENDIENTE, Fase 2] El nuevo total nunca queda menor que lo ya pagado (error claro). El servidor fija el
  recargo de doble forro con el valor actual de Ajustes cuando un corte pasa a tener doble forro y lo pone
  en 0 si lo pierde.
- [PENDIENTE, Fase 2] Historial de cambios en tabla nueva (quién, cuándo, qué, antes y después), registrado
  por triggers, visible solo para el dueño en el detalle del pedido.

### Fase 3: inventario de tela [PENDIENTE, Fase 3]
- [PENDIENTE, Fase 3] 1 yarda = 91,44 cm. Se guarda todo en cm y se muestran yardas (2 decimales) y metros.
- [PENDIENTE, Fase 3] Por diseño: "controla inventario" (por defecto no) y stock mínimo en yardas (opcional),
  editados por el dueño en Ajustes. Los que no controlan no descuentan ni muestran stock.
- [PENDIENTE, Fase 3] Tabla de movimientos (quién, cuándo, nota): entrada inicial o entrada (compra o
  reposición, en yardas), salida automática al marcar un corte hecho, devolución al desmarcarlo, ajuste por
  conteo físico o merma (solo dueño, motivo obligatorio). Se agrega `diseno_id` a los cortes (rellenado por
  nombre en los existentes; `crear_pedido` y las ediciones lo resuelven por nombre).
- [PENDIENTE, Fase 3] Tres números por diseño (yardas y metros): En bodega (suma de movimientos),
  Comprometido (cortes pendientes de pedidos activos, en vivo) y Disponible (bodega menos comprometido).
  Etiqueta "Poco stock" cuando el disponible llega al mínimo.
- [PENDIENTE, Fase 3] Pantalla Inventario como pestaña dentro de Más: el dueño ve todo, registra entradas y
  ajustes y ve el historial por diseño; la vendedora solo ve Disponible y la etiqueta (función en la base
  que devuelve solo eso según el rol).
- [PENDIENTE, Fase 3] En Nuevo pedido, junto al diseño, "Disponible: X yd". Si un corte supera lo
  disponible, ADVIERTE ("faltan X yd") sin bloquear.
- [PENDIENTE, Fase 3] PDF de inventario (solo dueño).

### Fase 4: punto de venta (venta de mostrador) [PENDIENTE, Fase 4]
- [PENDIENTE, Fase 4] Botón "Venta" en el menú (6 botones, también en la barra inferior del celular).
- [PENDIENTE, Fase 4] Pantalla en dos columnas. Izquierda: diseños en texto (nombre y "Disp. X yd"), medida
  con botones rápidos (20, 50, 100, 150, 200 cm) y campo, costo por metro (se rellena con el último usado
  para ese diseño, editable), doble forro con color, "Agregar a la venta". Derecha: "Venta actual" (cortes
  con ×, total grande con redondeo hacia arriba) y "Cobro completo": Efectivo, QR o Mixto (en Mixto deben
  sumar el total), en efectivo campo "Recibido" que muestra el cambio (informativo), botón grande
  "Cobrar y entregar" y "Limpiar". Arriba "Hoy: N ventas, X Bs" y abajo la lista de ventas de hoy. Tras
  cobrar, la pantalla se limpia. Recibo en PDF opcional.
- [PENDIENTE, Fase 4] Base de datos: una función atómica que crea el pedido de origen "mostrador" (celular
  opcional, retiro, fecha de entrega hoy), sus cortes ya hechos (descuentan inventario por el trigger de la
  Fase 3), el pago por el total calculado en el servidor (si efectivo + QR no suma el total, rechaza) y lo
  deja Entregado con la fecha de hoy. Comparte la numeración de pedidos. Su efectivo cuenta para los
  retiros.
- [PENDIENTE, Fase 4] En Pedidos, las ventas de mostrador quedan ocultas en "Todos" y demás filtros y tienen
  filtro propio "Mostrador". En Historial aparecen en Ventas, Pagos y Entregas con la etiqueta "Mostrador".
- [PENDIENTE, Fase 4] Cancelar un pedido (de mostrador o normal) con cortes hechos que controlan inventario:
  pregunta al dueño "¿La tela vuelve a bodega?"; si sí, registra la devolución.
