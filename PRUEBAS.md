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

## Fase 0: estructura, filtros y orden (casos 25 a 45)

Esta fase no cambia la base de datos: solo la pantalla. Se prueba con pedidos de prueba (celulares
7000000X, nombres "PRUEBA ..."). Probar en: laptop, tablet horizontal (1024 a 1366 px), tablet vertical y celular.

**Regla de "Atrasado":** un pedido En proceso o Listo que lleva MÁS de 7 días desde que se registró
(fecha de creación, hora de Bolivia). Los entregados y cancelados nunca son atrasados. El 7 es la constante
`DIAS_ATRASO` al inicio de `public/app.js`. Ya no se muestra ni se usa la fecha de entrega.

| # | Qué hago | Qué debo ver | ¿Pasó? |
|---|---|---|---|
| 25 | Abro la app en laptop o tablet horizontal. | Barra fija arriba con el logo, los botones Pedidos, Nuevo, Cortes, Historial y Más (ícono y texto), y a la derecha "Dueño" y "Cerrar sesión". No hay columna lateral. En celular o tablet vertical la barra está abajo, como antes. | ☐ |
| 26 | Miro Pedidos. | Cuatro tarjetas: Por cobrar (rojo si hay deuda), Cortes pendientes, Atrasados y Entregados de los últimos 7 días. Debajo el buscador y el selector de orden, luego los filtros con su cantidad y la tabla a ancho completo. | ☐ |
| 27 | Toco cada filtro: En proceso, Listos, Entregados, Con saldo, Atrasados, Cortes pendientes. | Cada uno muestra solo lo que dice y el número del botón coincide con las filas. Todos muestra todos los pedidos. No existe el filtro "Pagados". | ☐ |
| 28 | Toco "Panel de entregas". | Tres grupos: Atrasados (más de 7 días); Con saldo pendiente; Entregados de los últimos 7 días. Un pedido puede salir en más de un grupo. | ☐ |
| 29 | Con filtro Todos y orden "Por estado": miro el orden. | Grupos con título y cantidad: En proceso, Listos, Entregados, Cancelados. En proceso y Listos: los MÁS ANTIGUOS arriba (por fecha de registro). Entregados: la entrega más reciente arriba. Cancelados: el más reciente arriba (por fecha de registro, porque no se guarda la fecha de cancelación). Entregados y Cancelados vienen plegados (título, botón Mostrar y, si alguno debe, etiqueta roja "N con saldo"). | ☐ |
| 30 | Toco "Mostrar" en Entregados y luego "Ocultar". | Se despliegan los pedidos entregados (el entregado más recientemente arriba) y se vuelven a plegar. | ☐ |
| 31 | Escribo en el buscador el celular de un pedido entregado o cancelado. | Esos grupos se despliegan solos y solo muestra los pedidos que coinciden. Al borrar el texto vuelven a plegarse. | ☐ |
| 32 | Abro un pedido En proceso y cambio el Estado a Listo. | Sale el aviso "Pedido N pasó a Listos", el pedido se mueve al grupo Listos y el panel sigue abierto. Si lo paso a Entregado, el aviso dice "pasó a Entregados" y desaparece de la vista porque ese grupo está plegado. | ☐ |
| 33 | El selector de orden tiene tres opciones. Elijo "Más antiguos primero" y luego "Más nuevos primero". | Opciones: "Por estado (recomendado)", "Más antiguos primero" y "Más nuevos primero". Las dos últimas son listas planas, sin títulos de grupo, con los activos (En proceso y Listo) primero y luego entregados y cancelados. Más antiguos: el registrado hace más días arriba. Más nuevos: el registrado hoy arriba. | ☐ |
| 34 | Toco una fila de la tabla. | El detalle se desliza desde la derecha (máximo 560 px; en celular ocupa toda la pantalla). Tiene el botón Cerrar. Se cierra con Cerrar, con Esc y tocando fuera del panel. | ☐ |
| 35 | Con el panel abierto, bajo un poco y marco un corte como hecho. | El panel NO se cierra, conserva el desplazamiento y no vuelve a animarse. | ☐ |
| 36 | En celular miro la tabla de Pedidos. | Solo se ven Pedido, Cliente (con su estado debajo), Total y Saldo. Sin barra horizontal. | ☐ |
| 37 | Entro a Nuevo pedido en laptop y en tablet horizontal. | Una sola columna ancha (máximo 880 px). Abajo, una barra fija con Total, Adelanto, Saldo pendiente (rojo) y el botón Guardar pedido. NO hay campo de fecha de entrega. | ☐ |
| 38 | En celular, en Nuevo pedido toco el campo del adelanto (con el teclado abierto). | La barra de abajo del menú se esconde; el campo donde escribo y el botón "Guardar pedido" siguen a la vista. | ☐ |
| 39 | Miro Cortes, Más y Ajustes. | Cortes: lista por diseño con el nombre como título, cantidad y metros, y los cortes con su casilla. Más: pestañas arriba (Saldos, Ajustes, Accesos y Cuenta; la vendedora ve solo Saldos y Cuenta). Los diseños se ven solo como texto, sin cuadros de color. | ☐ |
| 40 | En Ajustes creo el diseño "PRUEBA diseño". | Solo pide el nombre y se agrega a la lista (sin muestra ni color). | ☐ |
| 41 | En laptop miro la columna de la tabla que antes se llamaba "Entrega". | Ahora se llama "Registrado": muestra "Registrado 29 oct" y debajo "hace 8 días" ("hoy" o "hace 1 día" si es reciente). En los entregados dice "Entregado" y la fecha de entrega. En menos de 900 px esa columna está oculta. | ☐ |

### Regla de los 7 días (casos 42 a 45)

Preparar los datos de prueba (la app no deja elegir la fecha de registro, por eso hace falta un paso en Supabase):

1. En Nuevo pedido crea 4 pedidos de 1 corte cualquiera con los celulares **70000006**, **70000007**,
   **70000008** y **70000009**. Marca el de **70000008** como **Entregado** (Estado del pedido).
2. En el SQL Editor abre `supabase/06_probar_atrasados.sql`. Corre el PASO 1 (solo un SELECT) y confirma que
   salen solo esos 4 pedidos. Después corre el PASO 2 (bloque BEGIN ... COMMIT) y por último el PASO 3.
   Debe dar: 70000006 → 6 días, atrasado false; 70000009 → 7 días, false; 70000007 → 8 días, true;
   70000008 → 20 días, false.
3. Recarga la app (Más, Cuenta, "Actualizar datos ahora").

| # | Qué hago | Qué debo ver | ¿Pasó? |
|---|---|---|---|
| 42 | Busco 70000006 (pedido de 6 días, En proceso). | Columna Registrado: "hace 6 días". Sin etiqueta "Atrasado". No aparece en el filtro Atrasados ni en la tarjeta. | ☐ |
| 43 | Busco 70000009 (pedido de exactamente 7 días). | "hace 7 días". Sin etiqueta "Atrasado": para serlo tiene que llevar MÁS de 7 días. | ☐ |
| 44 | Busco 70000007 (pedido de 8 días, En proceso). | "hace 8 días" en rojo y la etiqueta roja "Atrasado" (en celular, bajo el cliente). Cuenta en la tarjeta "Atrasados", sale en el filtro Atrasados y en el grupo "Atrasados" del Panel de entregas. Si lo paso a Listo sigue atrasado; si lo paso a Entregado deja de serlo. | ☐ |
| 45 | Busco 70000008 (entregado, registrado hace 20 días). Luego cancelo un pedido viejo de prueba. | Un pedido entregado o cancelado NUNCA lleva "Atrasado", por viejo que sea, ni cuenta en la tarjeta ni en el filtro. | ☐ |

### Tamaños probados (Fase 0, con datos simulados)

Para cada tamaño se recorrieron Pedidos, el panel de detalle, Nuevo pedido, Cortes, Historial, Más, Ajustes,
Accesos y Cuenta. Se midió con un navegador automático (Chromium) y datos simulados, no con la base real.
Los tamaños con teclado abierto se probaron simulando un celular con la pantalla recortada (390×420).

| Tamaño | Sin scroll horizontal | Botones de 44 px o más | Panel: abre, conserva scroll al marcar un corte, cierra con Esc y tocando fuera | Errores de la app |
|---|---|---|---|---|
| 1024×768 (tablet horizontal) | Sí, en las 9 pantallas | Sí | Sí | Ninguno |
| 1180×820 (tablet horizontal) | Sí | Sí | Sí | Ninguno |
| 1280×800 (laptop) | Sí | Sí | Sí | Ninguno |
| 1366×1024 (tablet horizontal grande) | Sí | Sí | Sí | Ninguno |
| 768×1024 (tablet vertical, barra abajo) | Sí | Sí | Sí | Ninguno |
| 390×844 (celular) | Sí | Sí | Sí (a pantalla completa) | Ninguno |
| 1440×900 (laptop grande) | Sí | Sí | Sí | Ninguno |
| 390×420 (celular con teclado abierto) | Sí | Sí | No aplica | Ninguno. El campo del adelanto y de la medida, y el botón "Guardar pedido", quedan visibles y la barra de abajo se esconde |

Pendiente: probar a mano en un celular y una tablet reales, sobre todo el teclado abierto.
