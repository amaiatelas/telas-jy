# Telas JY

App web instalable (PWA) para registrar pedidos de telas: cortes por diseño en cm, pagos
(efectivo, QR o mixto), envíos, historial y retiros de efectivo. La usan dos personas:
el dueño y la vendedora. Todo en español de Bolivia.

La lista completa de reglas y pantallas está en `ESPECIFICACION.md`. Léela antes de cambiar
cualquier comportamiento.

## Cómo está armado

- `public/`: la app. HTML, CSS y JavaScript simples, sin framework ni paso de compilación.
  - `index.html`: estructura y estilos (tema fucsia, modo oscuro automático).
  - `app.js`: toda la lógica y las pantallas.
  - `config.js`: URL y clave PÚBLICA de Supabase (la completa quien instala).
- `netlify/functions/cuenta.js`: función de Netlify que crea y administra la cuenta de la
  vendedora. Es el único lugar que usa la llave secreta de Supabase.
- `supabase/01_esquema.sql`: tablas, reglas, permisos (RLS) y horario. Se puede ejecutar varias veces.
- `supabase/02_dueno.sql`: asigna el rol de dueño a la primera cuenta.
- Datos: Supabase (Postgres + Auth). Publicación: Netlify, conectado a un repositorio de GitHub.

## Reglas que NO se pueden romper

- La llave secreta de Supabase (service_role o secret) vive solo en las variables de entorno
  de Netlify. Nunca la escribas en archivos, en commits, en la terminal ni en el chat.
  Si el usuario la pega por error, avísale que debe regenerarla.
- Los permisos se aplican en la base de datos (RLS y triggers), no solo ocultando botones.
  Cualquier cambio de permisos se hace en `supabase/01_esquema.sql`.
- Montos siempre en Bs enteros. El subtotal de cada corte se redondea SIEMPRE hacia arriba,
  calculado en centavos (columna `subtotal` de `pedido_items`). Las medidas en cm no se redondean.
- Estados de pedido: en_proceso, listo, entregado, cancelado. No existe "cortado".
- Un pago nunca supera el saldo. Los pagos anulados no se borran: quedan tachados con motivo.
- No hay cierre de caja. Los retiros de efectivo guardan solo monto y fecha.
- La hora de referencia es la de Bolivia (America/La_Paz).

## Cómo trabajar con el usuario

- El usuario NO es programador y quiere aprender: explica cada paso en español sencillo y
  qué hace cada comando antes de ejecutarlo.
- Trabaja en pasos pequeños y comprueba cada uno. Antes de cambiar la base de datos real,
  de publicar o de borrar algo, pide confirmación.
- Después de cambiar `public/app.js` o `netlify/functions/cuenta.js`, revisa la sintaxis con
  `node --check` sobre el archivo.
- Si cambias la base de datos, actualiza `supabase/01_esquema.sql` para que siga siendo
  repetible y dile al usuario exactamente qué pegar en el SQL Editor de Supabase.
- Al final de CADA respuesta deja un resumen de máximo 5 líneas, en español sencillo, con:
  qué hiciste, qué archivos cambiaste (o que no cambiaste ninguno), qué le toca hacer al
  usuario ahora y qué sigue después.
- Antes de darle al usuario una consulta de comprobación, verifica contra el archivo real
  (`supabase/01_esquema.sql`) que los valores esperados sean correctos.
- Para probar en local basta un servidor estático sobre `public/`. La función de cuentas
  solo funciona publicada en Netlify (o con `netlify dev` si el usuario lo instala).
