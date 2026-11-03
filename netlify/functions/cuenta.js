// Netlify Function: administra la cuenta de la vendedora.
// Solo el dueño puede usarla. La llave secreta de Supabase vive únicamente
// en las variables de entorno de Netlify, nunca en el navegador.

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const json = (statusCode, obj) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(obj),
});

// Llamada a Supabase con la llave secreta (funciona con la llave clásica "service_role" y con la nueva "secret")
async function admin(path, options = {}) {
  const headers = { apikey: SECRET_KEY, 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (SECRET_KEY.startsWith('eyJ')) headers.Authorization = 'Bearer ' + SECRET_KEY;
  const res = await fetch(SUPABASE_URL + path, { ...options, headers });
  let body = null;
  try { body = await res.json(); } catch (e) { body = null; }
  return { ok: res.ok, status: res.status, body };
}

function mensajeError(r) {
  const t = String((r.body && (r.body.msg || r.body.message || r.body.error_description || r.body.error)) || '');
  if (/already|registered|exists/i.test(t)) return 'Ese correo ya está registrado en otra cuenta';
  if (/password/i.test(t)) return 'La contraseña no es válida. Usa al menos 8 caracteres';
  return t || 'No se pudo completar la acción';
}

exports.handler = async (event) => {
  try {
    return await atender(event);
  } catch (e) {
    return json(500, { error: 'No se pudo conectar con Supabase. Inténtalo de nuevo' });
  }
};

async function atender(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método no permitido' });
  if (!SUPABASE_URL || !SECRET_KEY || !ANON_KEY) {
    return json(500, { error: 'Falta configurar las variables de entorno en Netlify (SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY)' });
  }

  // 1) Verificar quién llama
  const auth = event.headers.authorization || event.headers.Authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'Sesión no válida. Vuelve a iniciar sesión' });

  const u = await fetch(SUPABASE_URL + '/auth/v1/user', {
    headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + token },
  });
  if (!u.ok) return json(401, { error: 'Sesión no válida. Vuelve a iniciar sesión' });
  const user = await u.json();

  // 2) Debe ser el dueño
  const yo = await admin('/rest/v1/perfiles?id=eq.' + encodeURIComponent(user.id) + '&select=rol,activo');
  if (!yo.ok || !yo.body || !yo.body[0] || yo.body[0].rol !== 'dueno' || !yo.body[0].activo) {
    return json(403, { error: 'Solo el dueño puede administrar esta cuenta' });
  }

  let data;
  try { data = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Datos no válidos' }); }

  // 3) Cuenta actual de la vendedora (si existe)
  const v = await admin('/rest/v1/perfiles?rol=eq.vendedora&select=id,activo');
  if (!v.ok) return json(500, { error: 'No se pudo leer la cuenta de la vendedora' });
  const actual = (v.body && v.body[0]) || null;

  if (data.accion === 'estado') {
    if (!actual) return json(200, { creada: false, activo: true, email: '' });
    const a = await admin('/auth/v1/admin/users/' + actual.id);
    return json(200, { creada: true, activo: actual.activo, email: (a.body && a.body.email) || '' });
  }

  if (data.accion === 'guardar') {
    const email = String(data.email || '').trim().toLowerCase();
    const pass = String(data.password || '');
    const activo = data.activo !== false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: 'Escribe un correo válido' });
    if (!actual && pass.length < 8) return json(400, { error: 'La contraseña es obligatoria (mínimo 8 caracteres)' });
    if (pass && pass.length < 8) return json(400, { error: 'La contraseña necesita al menos 8 caracteres' });

    if (!actual) {
      const body = { email, password: pass, email_confirm: true };
      if (!activo) body.ban_duration = '876000h';
      const c = await admin('/auth/v1/admin/users', { method: 'POST', body: JSON.stringify(body) });
      if (!c.ok) return json(400, { error: mensajeError(c) });
      const p = await admin('/rest/v1/perfiles', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ id: c.body.id, rol: 'vendedora', nombre: 'Vendedora', activo }),
      });
      if (!p.ok) {
        await admin('/auth/v1/admin/users/' + c.body.id, { method: 'DELETE' });
        return json(500, { error: 'No se pudo crear el perfil de la vendedora' });
      }
      return json(200, { ok: true, creada: true });
    }

    const body = { email, email_confirm: true, ban_duration: activo ? 'none' : '876000h' };
    if (pass) body.password = pass;
    const up = await admin('/auth/v1/admin/users/' + actual.id, { method: 'PUT', body: JSON.stringify(body) });
    if (!up.ok) return json(400, { error: mensajeError(up) });
    const pp = await admin('/rest/v1/perfiles?id=eq.' + actual.id, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ activo }),
    });
    if (!pp.ok) return json(500, { error: 'No se pudo actualizar el perfil' });
    return json(200, { ok: true, creada: true });
  }

  return json(400, { error: 'Acción no válida' });
}
