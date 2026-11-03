# Especificación de Telas JY

Lo que el dueño pidió, pantalla por pantalla. Marcado como [HECHO] si ya está en la app y
[PENDIENTE] si todavía no.

## Personas y permisos

Solo dos cuentas: dueño y vendedora. Sin registro público.

- Ambos: crear pedidos, registrar pagos, marcar cortes como hechos, cambiar el estado del pedido
  (menos cancelar), descargar el PDF de un pedido, ver pedidos, cortes y saldos. [HECHO]
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

- Celular y nombre del cliente; si el celular ya existe se completa el nombre. [HECHO]
- Varios cortes por pedido, de distintos diseños (y varios del mismo). Cada corte: diseño de una
  lista, medida en cm, costo por metro. [HECHO]
- Doble forro opcional por corte: +70 Bs y color obligatorio. [HECHO]
- Subtotal de cada corte redondeado hacia arriba a Bs enteros (10,2 → 11; 0,6 → 1). [HECHO]
- Entrega: retiro en tienda o envío. Envío (a cualquier destino): nombre completo, celular y
  ciudad; si es para trópico se suman 20 Bs. Nada más (sin departamento, transporte ni guía). [HECHO]
- Fecha de entrega (por defecto, 2 días después). [HECHO]
- Solo el dueño agrega diseños a la lista; la vendedora solo elige. [HECHO]

## Estados y saldo

- Estados: En proceso (automático), Listo, Entregado, Cancelado (solo dueño). [HECHO]
- Avance de cortes como "Cortes X de Y". Al terminar todos, aviso "¿Marcar como listo?". [HECHO]
- Saldo pendiente siempre muy visible en rojo ("Debe X Bs"), también en pedidos entregados. [HECHO]
- "Atrasado" si pasó la fecha de entrega y no está entregado ni cancelado. [HECHO]

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
