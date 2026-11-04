# Pruebas del adelanto y de los números decimales

Antes de empezar:

1. Pega la función `crear_pedido` (líneas 244 a 300 de `supabase/01_esquema.sql`) en el SQL Editor
   de Supabase y toca Run.
2. Corre `supabase/03_comprobar.sql`. Debe dar `true`, `false`, `true`.
3. Abre la app: local en http://localhost:8765 o publicada en https://telasjy.netlify.app
   (la publicada solo tendrá el adelanto después de subir los cambios a GitHub).
4. Entra como dueño. Si no hay diseños, agrega uno en Más, Ajustes.

Todo lo que crees queda en la base de datos real. Pon al cliente un nombre que empiece con
**PRUEBA** (por ejemplo "PRUEBA Adelanto") para poder limpiarlo después con
`supabase/04_limpiar_pruebas.sql`.

Para marcar un caso como pasado, cambia ☐ por ☑.

| # | Qué hago | Qué debo ver | ¿Pasó? |
|---|---|---|---|
| 1 | Nuevo pedido con 1 corte de 200 cm a 86 Bs por metro (total 172 Bs). En Adelanto elijo Efectivo y escribo 100. | En el cuadro oscuro: Adelanto 100 Bs. Saldo pendiente 72 Bs, en rojo claro y en negrita. | ☐ |
| 2 | Guardo el pedido del caso 1 y miro el detalle. | Un pago "Efectivo" de 100 Bs. Pagado 100 Bs y "Debe 72 Bs". La casilla "Verificado" está sin marcar. | ☐ |
| 3 | Voy a Historial, vista Pagos, filtro Hoy. | El pago de 100 Bs aparece bajo "Hoy" con la etiqueta "Sin verificar". | ☐ |
| 4 | Nuevo pedido igual (total 172). En Adelanto elijo Mixto: Efectivo 50 y QR 50. Guardo. | En el detalle hay un solo pago "Mixto, ef. 50 Bs y QR 50 Bs". Saldo pendiente 72 Bs. | ☐ |
| 5 | Nuevo pedido (total 172). Con Efectivo elegido toco el botón "Paga todo". | El monto se llena con 172. Desaparece la línea "Saldo pendiente" y aparece "Pedido pagado por completo". | ☐ |
| 6 | En el mismo pedido cambio a Mixto y toco "Paga todo". | Efectivo queda en 172 y QR en 0. | ☐ |
| 7 | Nuevo pedido (total 172) con adelanto 173. Primero miro el cuadro y luego toco "Guardar pedido". | En el cuadro, el saldo dice "Supera el total". Al guardar sale en rojo "El adelanto no puede superar el total (172 Bs)" y no se crea ningún pedido nuevo en la lista. | ☐ |
| 8 | Nuevo pedido con el adelanto vacío (o escribo 0). Guardo. | El pedido se guarda sin pagos: dice "Sin pagos registrados" y "Debe 172 Bs". | ☐ |
| 9 | Escribo el adelanto 50.5, luego 50,5 y luego -5. En cada uno toco "Guardar pedido". | Con 50.5 y 50,5: mensaje rojo "El adelanto debe ser un número entero de Bs, sin decimales". Con -5: "El adelanto no puede ser negativo". No se guarda nada. | ☐ |
| 10 | Corte con medida 80,5 cm y costo 45. | El subtotal dice 37 Bs (con "36,23 redondeado"). Al guardar, el detalle muestra "80.5 cm". | ☐ |
| 11 | En la medida escribo 80.123. | Debajo del campo sale en rojo "Usa máximo 2 decimales". Al tocar "Guardar pedido" sale "Corte 1, medida: Usa máximo 2 decimales" y no se guarda. | ☐ |
| 12 | En el costo por metro escribo 12,555. | Igual: debajo del campo de costo, en rojo, "Usa máximo 2 decimales". Al guardar sale "Corte 1, costo por metro: Usa máximo 2 decimales" y no se guarda. | ☐ |
