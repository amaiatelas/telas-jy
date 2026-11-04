# Pruebas de Telas JY

Hay dos tandas: los casos 1 a 12 (adelanto y decimales) y los casos 13 a 24 (pedidos sin datos y
datos de envío).

Antes de empezar:

1. Pega el archivo `supabase/01_esquema.sql` COMPLETO en el SQL Editor de Supabase y toca Run.
2. Corre `supabase/05_comprobar_envio.sql`. Debe dar `true, true, true, true, true, false, true`.
   (`supabase/03_comprobar.sql` sigue sirviendo y debe dar `true, false, true`.)
3. Abre la app: local en http://localhost:8765 o publicada en https://telasjy.netlify.app
   (la publicada solo tendrá lo nuevo después de subir los cambios a GitHub).
4. Entra como dueño. Si no hay diseños, agrega uno en Más, Ajustes.

Todo lo que crees queda en la base de datos real. Ya no hay campo de nombre, así que usa
**celulares de prueba que empiecen con 7000000** (70000001, 70000002, 70000003…). Así se pueden
limpiar después con `supabase/04_limpiar_pruebas.sql`. Los casos 1 a 12 se hicieron con clientes
"PRUEBA ...", que ese archivo también reconoce.

Para marcar un caso como pasado, cambia ☐ por ☑. Los casos 1 a 24 ya pasaron.

| # | Qué hago | Qué debo ver | ¿Pasó? |
|---|---|---|---|
| 1 | Nuevo pedido con 1 corte de 200 cm a 86 Bs por metro (total 172 Bs). En Adelanto elijo Efectivo y escribo 100. | En el cuadro oscuro: Adelanto 100 Bs. Saldo pendiente 72 Bs, en rojo claro y en negrita. | ☑ |
| 2 | Guardo el pedido del caso 1 y miro el detalle. | Un pago "Efectivo" de 100 Bs. Pagado 100 Bs y "Debe 72 Bs". La casilla "Verificado" está sin marcar. | ☑ |
| 3 | Voy a Historial, vista Pagos, filtro Hoy. | El pago de 100 Bs aparece bajo "Hoy" con la etiqueta "Sin verificar". | ☑ |
| 4 | Nuevo pedido igual (total 172). En Adelanto elijo Mixto: Efectivo 50 y QR 50. Guardo. | En el detalle hay un solo pago "Mixto, ef. 50 Bs y QR 50 Bs". Saldo pendiente 72 Bs. | ☑ |
| 5 | Nuevo pedido (total 172). Con Efectivo elegido toco el botón "Paga todo". | El monto se llena con 172. Desaparece la línea "Saldo pendiente" y aparece "Pedido pagado por completo". | ☑ |
| 6 | En el mismo pedido cambio a Mixto y toco "Paga todo". | Efectivo queda en 172 y QR en 0. | ☑ |
| 7 | Nuevo pedido (total 172) con adelanto 173. Primero miro el cuadro y luego toco "Guardar pedido". | En el cuadro, el saldo dice "Supera el total". Al guardar sale en rojo "El adelanto no puede superar el total (172 Bs)" y no se crea ningún pedido nuevo en la lista. | ☑ |
| 8 | Nuevo pedido con el adelanto vacío (o escribo 0). Guardo. | El pedido se guarda sin pagos: dice "Sin pagos registrados" y "Debe 172 Bs". | ☑ |
| 9 | Escribo el adelanto 50.5, luego 50,5 y luego -5. En cada uno toco "Guardar pedido". | Con 50.5 y 50,5: mensaje rojo "El adelanto debe ser un número entero de Bs, sin decimales". Con -5: "El adelanto no puede ser negativo". No se guarda nada. | ☑ |
| 10 | Corte con medida 80,5 cm y costo 45. | El subtotal dice 37 Bs (con "36,23 redondeado"). Al guardar, el detalle muestra "80.5 cm". | ☑ |
| 11 | En la medida escribo 80.123. | Debajo del campo sale en rojo "Usa máximo 2 decimales". Al tocar "Guardar pedido" sale "Corte 1, medida: Usa máximo 2 decimales" y no se guarda. | ☑ |
| 12 | En el costo por metro escribo 12,555. | Igual: debajo del campo de costo, en rojo, "Usa máximo 2 decimales". Al guardar sale "Corte 1, costo por metro: Usa máximo 2 decimales" y no se guarda. | ☑ |

## Pedidos sin datos y datos de envío (casos 13 a 24)

En todos, un "pedido de 172 Bs" es 1 corte de 200 cm a 86 Bs por metro. El trópico suma 20 Bs
(el valor de Ajustes).

| # | Qué hago | Qué debo ver | ¿Pasó? |
|---|---|---|---|
| 13 | Nuevo pedido: celular 70000001, un pedido de 172 Bs, Entrega "Envío" sin llenar nada. Guardo. | En la pantalla de Nuevo pedido no existe el campo Nombre y, con Envío elegido, dice "Estos datos son opcionales. Puedes completarlos después". El pedido se guarda. En la lista de Pedidos el título es 70000001 y debajo sale la etiqueta ámbar "Datos de envío pendientes". En el detalle hay un aviso ámbar "Datos de envío pendientes" y un formulario vacío. | ☑ |
| 14 | En el pedido del caso 13 escribo nombre completo, celular y ciudad y toco "Guardar datos de envío". | Sale "Datos de envío guardados". El aviso ámbar desaparece del detalle y la etiqueta desaparece de la fila en la lista de Pedidos. El formulario muestra los datos guardados. | ☑ |
| 15 | Nuevo pedido de 172 Bs, celular 70000002, Envío sin trópico, adelanto 100 en efectivo. Guardo. En el detalle marco "¿Es para trópico?" y toco "Guardar datos de envío". Después lo desmarco y vuelvo a guardar. | Al inicio: total 172, Debe 72 Bs. Con trópico: aparece "Envío trópico 20 Bs", total 192 Bs, Pagado 100 Bs, Debe 92 Bs. Sin trópico otra vez: total 172 y Debe 72 Bs. | ☑ |
| 16 | Nuevo pedido de 172 Bs, celular 70000003, Envío con trópico marcado (total 192), botón "Paga todo". Guardo. En el detalle desmarco el trópico y guardo. | Se rechaza con el mensaje "No se puede cambiar el envío: el nuevo total (172 Bs) sería menor que lo ya pagado (192 Bs). Primero anula un pago." Después de recargar, la casilla de trópico sigue marcada y el total sigue en 192. Si el dueño anula ese pago y repite el cambio, ahora sí se guarda. | ☑ |
| 17 | Entro como vendedora (dentro de su horario), abro un pedido de envío con datos pendientes, los completo y guardo. | Sale "Datos de envío guardados" y desaparece el aviso. La vendedora sigue sin ver "Cancelado" en el estado ni botones de Anular pago. (Requiere haber creado la cuenta de la vendedora en la página publicada.) | ☑ |
| 18 | Nuevo pedido: en Celular escribo +591 7000 0001 (ya existe un pedido del caso 13). Guardo. | Mientras escribo aparece el aviso discreto "Cliente con 1 pedido anterior" (con 2 o más dice "pedidos anteriores"). Al guardar, el celular queda como 70000001, sin espacios ni 591, y no se autocompleta ningún nombre. | ☑ |
| 19 | Miro los pedidos sin nombre en la lista de Pedidos, el detalle, la pantalla Cortes y el Historial (Pagos, Ventas, Entregas). | En todos los lugares el título del cliente es su celular, no queda vacío. Los pedidos viejos con nombre siguen mostrando su nombre. | ☑ |
| 20 | Más, Saldos pendientes, con dos pedidos con saldo del mismo celular (por ejemplo los de los casos 13 y 18). | Aparece una sola fila para ese celular, con la suma de los saldos y "pedidos 13, 18" (con sus números reales). | ☑ |
| 21 | En un pedido sin nombre toco "Enviar por WhatsApp" y "Descargar PDF". | El mensaje de WhatsApp empieza "Hola, este es el resumen de tu pedido…" (sin nombre). El PDF no tiene la fila "Nombre" y sí el celular. Si los datos de envío están vacíos, el PDF dice "Datos de envío: Pendientes". | ☑ |
| 22 | En el buscador de Pedidos escribo "7000 0001", "7000-0001" y "+591 70000001". | Los tres encuentran el pedido del celular 70000001. | ☑ |
| 23 | Nuevo pedido con Retiro en tienda, solo celular y un corte. | Se guarda. En el detalle no aparece la sección "Datos de envío" ni el aviso de pendientes. | ☑ |
| 24 | El dueño cancela un pedido de envío. Lo abro. | La sección "Datos de envío" muestra los campos desactivados y la nota "Pedido cancelado: no se pueden cambiar los datos de envío". No hay etiqueta de pendientes en la lista. | ☑ |
