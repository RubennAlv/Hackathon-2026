import 'dotenv/config';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

import { buscarProductores, productores } from './matcher.js';
import { analizarImagen } from './vision.js';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const PUERTO = Number(process.env.PORT) || 3001;
const MAX_BYTES = 8 * 1024 * 1024;
const MIME_OK = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
const supabasePublic = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

function supabaseConfigurado() {
  return Boolean(supabaseAdmin && supabasePublic);
}

const app = express();
app.disable('x-powered-by');
app.use(cors());

// =============================================================================
// SEGURIDAD Y POLÍTICAS DE CACHÉ (FASE 11)
// =============================================================================
app.use((req, res, next) => {
  // Protección contra sniffing de tipos MIME
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Protección contra Clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Control estricto de Referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restricción de permisos del navegador (cámara y geolocalización permitidas para Lens IA)
  res.setHeader('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()');

  // Content Security Policy adaptada para scripts locales, Google Fonts y WhatsApp
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https:; frame-ancestors 'self';"
  );

  // Política de caché por tipo de recurso
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
  } else if (req.path.startsWith('/css/') || req.path.startsWith('/js/')) {
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  } else if (req.path.endsWith('.html') || req.path === '/' || !path.extname(req.path)) {
    res.setHeader('Cache-Control', 'no-cache');
  }

  next();
});

// Protección contra descarga de archivos sensibles
app.use((req, res, next) => {
  const sensitivePatterns = [
    /\.env/i,
    /supabase\.sql/i,
    /package(-lock)?\.json/i,
    /\.git/i,
    /lo\.txt/i,
    /scripts\//i,
    /node_modules/i
  ];

  if (sensitivePatterns.some((pattern) => pattern.test(req.path))) {
    return res.status(403).json({ ok: false, error: 'Acceso denegado a recursos protegidos' });
  }
  next();
});

app.use(express.json({ limit: '12mb' }));

const subirImagen = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
}).single('image');

const modoConfigurado = () =>
  String(process.env.MOCK).toLowerCase() === 'true' || !process.env.GEMINI_API_KEY ? 'mock' : 'gemini';

function fallo(res, status, mensaje) {
  return res.status(status).json({ ok: false, error: mensaje });
}

function normalizarMime(mime) {
  if (!mime) return '';
  return mime === 'image/jpg' ? 'image/jpeg' : mime.toLowerCase();
}

function leerImagenJson(body) {
  const valor = body?.imageBase64;
  if (!valor || typeof valor !== 'string') return null;

  // Acepta tanto base64 puro como data URL: "data:image/png;base64,...."
  const dataUrl = valor.match(/^data:([^;]+);base64,(.*)$/s);
  if (dataUrl) {
    return { mimeType: normalizarMime(dataUrl[1]), buffer: Buffer.from(dataUrl[2], 'base64') };
  }

  return {
    mimeType: normalizarMime(body.mimeType || 'image/jpeg'),
    buffer: Buffer.from(valor, 'base64'),
  };
}

function leerUbicacion(...fuentes) {
  for (const fuente of fuentes) {
    const lat = Number(fuente?.lat);
    const lng = Number(fuente?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, modo: modoConfigurado() });
});

app.get('/api/productores', (_req, res) => {
  res.json(productores);
});

app.get('/api/catalogo', async (_req, res) => {
  try {
    let adicionales = [];
    if (supabaseConfigurado()) {
      const { data } = await supabaseAdmin.from('profiles').select('*').eq('status', 'approved');
      if (data && data.length) {
        adicionales = data.map((p, idx) => ({
          id: p.id || `sp_${idx}`,
          nombre: p.business_name,
          categoria: (p.category || 'alimentos').toLowerCase(),
          productos: (p.products || '').split(/[;,]+/).map(s => s.trim()).filter(Boolean),
          descripcion: `Negocio local registrado: ${p.responsible_name}`,
          precio_menudeo: null,
          precio_mayoreo: null,
          unidad: 'unidad',
          capacidad_semanal: p.capacity || 'Bajo pedido',
          zona_durango: p.zone || 'Durango',
          whatsapp: p.phone,
          verificado: true,
          destacado: false,
          es_supabase: true,
        }));
      }
    }
    const lista = [...productores, ...adicionales];
    res.json({ ok: true, total: lista.length, productores: lista });
  } catch (_error) {
    res.json({ ok: true, total: productores.length, productores });
  }
});

app.post('/api/lens/scan', (req, res) => {
  subirImagen(req, res, async (errorMulter) => {
    if (errorMulter) {
      const mensaje =
        errorMulter.code === 'LIMIT_FILE_SIZE'
          ? 'La imagen supera el límite de 8 MB'
          : `No se pudo leer la imagen: ${errorMulter.message}`;
      return fallo(res, 400, mensaje);
    }

    try {
      const inicio = Date.now();

      const imagen = req.file
        ? { buffer: req.file.buffer, mimeType: normalizarMime(req.file.mimetype) }
        : leerImagenJson(req.body);

      if (!imagen || !imagen.buffer?.length) {
        return fallo(res, 400, 'Falta la imagen (campo "image" o "imageBase64")');
      }

      if (!MIME_OK.has(imagen.mimeType)) {
        return fallo(res, 400, 'Formato no soportado. Usa jpg, png o webp');
      }

      if (imagen.buffer.length > MAX_BYTES) {
        return fallo(res, 400, 'La imagen supera el límite de 8 MB');
      }

      const demo = typeof req.query.demo === 'string' ? req.query.demo : null;
      const ubicacion = leerUbicacion(req.body, req.query);

      const { modo, deteccion } = await analizarImagen(imagen, { demo });
      const match = buscarProductores(deteccion, ubicacion);

      res.json({
        ok: true,
        modo,
        deteccion,
        match_type: match.match_type,
        ubicacion_usuario: ubicacion ? 'gps' : 'default',
        resultados: match.resultados,
        latencia_ms: Date.now() - inicio,
      });
    } catch (error) {
      console.error('[scan] Error inesperado:', error);
      fallo(res, 500, 'No se pudo procesar la imagen');
    }
  });
});

// =============================================================================
// BASE DE DATOS LOCAL Y PERSISTENCIA RESILIENTE
// =============================================================================
const DATA_DIR = path.join(RAIZ, 'data');
const DB_PATH = path.join(DATA_DIR, 'local_db.json');

function loadLocalDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('[db] Error leyendo local_db.json:', e.message);
  }
  return { users: [] };
}

function saveLocalDb(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[db] Error guardando local_db.json:', e.message);
  }
}

// Inicializar base de datos local con cuentas limpias si no existe
if (!fs.existsSync(DB_PATH)) {
  saveLocalDb({
    users: [
      {
        id: 'admin_01',
        email: 'admin@nex24.com',
        password: 'demo',
        role: 'admin',
        business_name: 'Supervisión y Verificación Durango',
        responsible_name: 'Coordinador Comercial NEX24',
        phone: '6181234500',
        address: 'Palacio de Gobierno / Centro, Durango',
        schedule: 'Lunes a Viernes 8:00 AM - 5:00 PM',
        zone: 'Centro',
        category: 'Administración',
        products: 'Sellos de Verificación Oficial',
        capacity: 'Auditoría regional',
        status: 'approved',
        created_at: new Date().toISOString()
      },
      {
        id: 'biz_01',
        email: 'proveedor@nex24.com',
        password: 'demo',
        role: 'proveedor',
        business_name: 'Café Sierra Madre Tostadores',
        responsible_name: 'Martín Soto',
        phone: '5216180000001',
        address: 'Av. 20 de Noviembre #805, Zona Centro, Durango',
        schedule: 'Lunes a Sábado 8:00 AM - 6:00 PM',
        zone: 'Centro',
        category: 'cafe',
        products: 'Café tostado en grano 500g, Café molido 250g',
        capacity: '120 kg/semana',
        status: 'approved',
        created_at: new Date().toISOString()
      },
      {
        id: 'biz_02',
        email: 'tiendita@nex24.com',
        password: 'demo',
        role: 'tiendita',
        business_name: 'Abarrotes y Tiendita El Centro',
        responsible_name: 'Guadalupe Hernández',
        phone: '5216180000002',
        address: 'Calle 5 de Febrero #402, Zona Centro, Durango',
        schedule: '24 Horas',
        zone: 'Centro',
        category: 'Abarrotes',
        products: 'Insumos y abasto regional',
        capacity: 'Consumo semanal frecuente',
        status: 'approved',
        created_at: new Date().toISOString()
      }
    ]
  });
}

const activeSessions = new Map();

app.get('/api/registros', async (_req, res) => {
  const db = loadLocalDb();
  let registros = db.users.map(({ password: _, ...u }) => u);
  if (supabaseConfigurado()) {
    try {
      const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length) {
        registros = data;
      }
    } catch (_e) {}
  }
  res.json({ ok: true, registros });
});

app.post('/api/registros', async (req, res) => {
  const cuerpo = req.body || {};
  const tipo = ['tiendita', 'proveedor'].includes(cuerpo.tipo) ? cuerpo.tipo : null;
  const texto = (valor) => typeof valor === 'string' ? valor.trim() : '';
  const nombre = texto(cuerpo.nombre);
  const responsable = texto(cuerpo.responsable);
  const email = texto(cuerpo.email).toLowerCase();
  const telefono = texto(cuerpo.telefono);
  const direccion = texto(cuerpo.direccion);
  const password = texto(cuerpo.password);

  if (!tipo || !nombre || !responsable || !email || !telefono || !direccion || password.length < 6) {
    return fallo(res, 400, 'Completa los datos obligatorios y usa una contraseña de al menos 6 caracteres');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fallo(res, 400, 'Ingresa un correo electrónico válido');
  }

  const db = loadLocalDb();
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return fallo(res, 409, 'Ya existe una cuenta con ese correo');
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const profile = {
    id: userId,
    role: tipo,
    business_name: nombre,
    responsible_name: responsable,
    email,
    phone: telefono,
    address: direccion,
    schedule: texto(cuerpo.horario) || (tipo === 'tiendita' ? '8:00 AM - 10:00 PM' : '8:00 AM - 6:00 PM'),
    zone: texto(cuerpo.zona) || 'Centro',
    category: texto(cuerpo.categoria) || (tipo === 'tiendita' ? 'Abarrotes' : 'General'),
    products: texto(cuerpo.productos) || '',
    capacity: texto(cuerpo.capacidad) || '',
    status: 'approved',
    created_at: new Date().toISOString(),
    password: password
  };

  db.users.unshift(profile);
  saveLocalDb(db);

  // Sincronizar en segundo plano con Supabase si está disponible
  if (supabaseConfigurado()) {
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: tipo, business_name: nombre },
      });
      if (!authError && authData?.user) {
        profile.id = authData.user.id;
        await supabaseAdmin.from('profiles').insert({
          id: authData.user.id,
          role: tipo,
          business_name: nombre,
          responsible_name: responsable,
          email,
          phone: telefono,
          address: direccion,
          schedule: profile.schedule,
          zone: profile.zone,
          category: profile.category,
          products: profile.products,
          capacity: profile.capacity,
          status: 'approved',
        });
      }
    } catch (_e) {}
  }

  const { password: _, ...safeProfile } = profile;
  res.status(201).json({ ok: true, registro: safeProfile });
});

app.get('/api/admin/negocios', async (_req, res) => {
  const db = loadLocalDb();
  let negocios = db.users.map(({ password: _, ...u }) => u);
  if (supabaseConfigurado()) {
    try {
      const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length) {
        negocios = data;
      }
    } catch (_e) {}
  }
  return res.json({ ok: true, negocios });
});

app.patch('/api/admin/negocios/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!['approved', 'pending', 'rejected'].includes(status)) {
    return fallo(res, 400, 'Estado inválido. Debe ser approved, pending o rejected.');
  }

  const db = loadLocalDb();
  const found = db.users.find((b) => b.id === id);
  if (found) {
    found.status = status;
    saveLocalDb(db);
    const { password: _, ...safe } = found;
    return res.json({ ok: true, negocio: safe });
  }

  if (supabaseConfigurado()) {
    try {
      const { data, error } = await supabaseAdmin.from('profiles').update({ status }).eq('id', id).select('*').single();
      if (!error && data) {
        return res.json({ ok: true, negocio: data });
      }
    } catch (_e) {}
  }

  return fallo(res, 404, 'Negocio no encontrado');
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) return fallo(res, 400, 'Ingresa correo y contraseña');

  const db = loadLocalDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email);

  if (user) {
    const esSemilla = ['admin@nex24.com', 'proveedor@nex24.com', 'tiendita@nex24.com'].includes(email);
    const passwordValida = esSemilla
      ? (password === 'demo' || password === '123456' || password === user.password)
      : (password === user.password);

    if (!passwordValida) {
      return fallo(res, 401, 'Correo o contraseña incorrectos');
    }

    const { password: _, ...profile } = user;
    const token = `nex-token-${profile.role}-${Date.now()}`;
    activeSessions.set(token, profile);

    const session = {
      access_token: token,
      user: { id: profile.id, email }
    };
    return res.json({ ok: true, session, profile });
  }

  if (supabaseConfigurado()) {
    try {
      const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });
      if (!error && data?.session) {
        const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', data.user.id).single();
        return res.json({ ok: true, session: data.session, profile: profile || data.user });
      }
    } catch (_e) {}
  }

  return fallo(res, 401, 'Correo o contraseña incorrectos');
});

app.get('/api/auth/me', async (req, res) => {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return fallo(res, 401, 'Sesión requerida');

  if (activeSessions.has(token)) {
    return res.json({ ok: true, profile: activeSessions.get(token) });
  }

  const matchRole = token.match(/^(?:nex|demo)-token-(admin|proveedor|tiendita)/);
  if (matchRole) {
    const role = matchRole[1];
    const db = loadLocalDb();
    const user = db.users.find((u) => u.role === role);
    if (user) {
      const { password: _, ...profile } = user;
      return res.json({ ok: true, profile });
    }
  }

  if (supabaseConfigurado()) {
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (!authError && authData?.user) {
        const { data: profile, error } = await supabaseAdmin.from('profiles').select('*').eq('id', authData.user.id).single();
        if (!error && profile) return res.json({ ok: true, profile });
      }
    } catch (_e) {}
  }

  return fallo(res, 401, 'Sesión inválida o expirada');
});

// La interfaz NEX24 se sirve desde el mismo servidor que la API.
// Solo se exponen las carpetas públicas: nunca RAIZ completa (ahí viven .env y la key).
app.get(['/', '/index.html'], (_req, res) => res.sendFile(path.join(RAIZ, 'index.html')));
app.get('/propuesta', (_req, res) => res.sendFile(path.join(RAIZ, 'pages/propuesta.html')));
app.get('/productos', (_req, res) => res.sendFile(path.join(RAIZ, 'pages/productos.html')));
app.get('/lens', (_req, res) => res.sendFile(path.join(RAIZ, 'pages/lens.html')));
app.get('/mapa', (_req, res) => res.sendFile(path.join(RAIZ, 'pages/mapa.html')));
app.get('/tienda', (_req, res) => res.sendFile(path.join(RAIZ, 'pages/tienda.html')));
app.get('/emprendedores', (_req, res) => res.sendFile(path.join(RAIZ, 'pages/emprendedores.html')));
app.get('/registro', (_req, res) => res.sendFile(path.join(RAIZ, 'pages/registro.html')));
app.get('/login', (_req, res) => res.sendFile(path.join(RAIZ, 'pages/login.html')));

// Redirección de URLs antiguas de Puntos de Abasto a Mapa IA
app.get(['/ubicaciones', '/pages/ubicaciones.html'], (_req, res) => res.redirect(302, '/mapa'));
app.use('/public', express.static(path.join(RAIZ, 'public')));
app.use('/pages', express.static(path.join(RAIZ, 'pages')));
app.use('/css', express.static(path.join(RAIZ, 'css')));
app.use('/js', express.static(path.join(RAIZ, 'js')));
app.get('/productores.json', (_req, res) => res.sendFile(path.join(RAIZ, 'productores.json')));

// Manejo explícito de 404 para endpoints de API y fallback a index para rutas web no mapeadas
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return fallo(res, 404, 'Endpoint no encontrado');
  }
  return res.status(404).sendFile(path.join(RAIZ, 'index.html'));
});

app.use((error, _req, res, _next) => {
  if (error?.type === 'entity.too.large') {
    return fallo(res, 400, 'El cuerpo de la petición es demasiado grande (máx 8 MB de imagen)');
  }
  if (error?.type === 'entity.parse.failed') {
    return fallo(res, 400, 'JSON inválido');
  }
  console.error('[server] Error:', error);
  return fallo(res, 500, 'Error interno del servidor');
});

function ipEnLan() {
  const tarjetas = Object.values(os.networkInterfaces()).flat();
  const ipv4 = tarjetas.find(
    (t) => t && !t.internal && (t.family === 'IPv4' || t.family === 4) && !t.address.startsWith('169.254.')
  );
  return ipv4?.address || null;
}

let puertoActivo = PUERTO;
let servidor;

function iniciarServidor(puerto) {
  servidor = app.listen(puerto, () => {
    puertoActivo = puerto;
    const ip = ipEnLan();
    console.log(`NEX24 + Lens Local en http://localhost:${puerto} (modo ${modoConfigurado()})`);
    console.log(`  PC:       http://localhost:${puerto}/lens`);
    if (ip) console.log(`  Celular:  http://${ip}:${puerto}/lens   (misma Wi-Fi)`);
    console.log(`  API:      http://localhost:${puerto}/api/lens/scan`);
  });

  servidor.once('error', (error) => {
    if (error.code === 'EADDRINUSE' && puerto < PUERTO + 10) {
      const siguiente = puerto + 1;
      console.warn(`Puerto ${puerto} ocupado; intentando ${siguiente}…`);
      iniciarServidor(siguiente);
      return;
    }
    throw error;
  });
}

iniciarServidor(PUERTO);

export { app, servidor };
export default app;
