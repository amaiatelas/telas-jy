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

- Elegante y premium, fácil de leer. Color fucsia (#5A0E3D de base, acento #B01C75),
  latón #D8B76E, fondo porcelana. Tipografías Bodoni Moda (títulos y cifras de dinero) y
  Figtree (texto). Detalle de marca: regla de medir en latón en el borde de las cabeceras.
  Muestras de tela (liso, floral, rayas, lunares) junto a cada diseño. Modo oscuro automático.
  Barra inferior en celular y menú lateral en laptop. Botones de al menos 44 px. [HECHO]

## Futuro (todavía no)

- Descontar stock de cada diseño en metros, con conversión de yardas a metros.
