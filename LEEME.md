# Telas JY: cómo publicarlo

Contenido del paquete:

- `public/` : la app (lo que ven el dueño y la vendedora).
- `netlify/functions/cuenta.js` : función segura para crear la cuenta de la vendedora.
- `netlify.toml` : configuración de Netlify (no se toca).
- `supabase/01_esquema.sql` : crea toda la base de datos, los permisos y el horario.
- `supabase/02_dueno.sql` : convierte tu cuenta en la cuenta del dueño.

## Pasos (resumen)

1. Supabase: crear proyecto, desactivar registro público, ejecutar `01_esquema.sql`.
2. Supabase: crear tu usuario (Authentication > Users > Add user, con "Auto Confirm User"),
   poner tu correo en `02_dueno.sql` y ejecutarlo.
3. Copiar la URL del proyecto y la clave pública y pegarlas en `public/config.js`.
4. Subir la carpeta a un repositorio de GitHub.
5. Netlify: importar el repositorio, agregar 3 variables de entorno
   (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) y volver a publicar.
6. Abrir la página, entrar como dueño, agregar diseños (Más > Ajustes) y crear la cuenta
   de la vendedora (Más > Accesos).

## Reglas de seguridad

- La clave secreta (service_role o secret) va SOLO en las variables de Netlify.
  Nunca en `config.js`, nunca en GitHub, nunca en un mensaje.
- Si alguna vez se expone esa clave, se regenera en Supabase (Project Settings > API Keys)
  y se actualiza en Netlify.
