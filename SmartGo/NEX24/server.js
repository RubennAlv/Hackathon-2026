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
const UPLOAD_DIR = path.join(RAIZ, 'public', 'uploads');
const UPLOAD_URL = '/public/uploads/';
const EXTENSIONES_IMAGEN = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
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

// Las fotos de productos publicados se sirven como estáticos desde /public/uploads.
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (error) {
  console.error('[uploads] No se pudo preparar la carpeta de imágenes:', error.message);
}

const subirImagen = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
}).single('image');

const modoConfigurado = () =>
  String(process.env.MOCK).toLowerCase() === 'true' || !process.env.GEMINI_API_KEY ? 'mock' : 'gemini';

function fallo(res, status, mensaje) {
  return res.status(status).json({ ok: false, error: mensaje });
}

// --- Geolocalización de locales registrados -----------------------------------
const COORDS_CENTRO = { lat: 24.0277, lng: -104.6532 };
const GEO_TOKEN = /(?:\|\s*)?@geo=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i;
const GEO_TOKEN_GLOBAL = /(?:\|\s*)?@geo=-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?/gi;

function coordsValidas(lat, lng) {
  const a = Number(lat);
  const b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && a >= 22 && a <= 27 && b >= -108 && b <= -102;
}

function coordsPorDefecto(clave) {
  let hash = 0;
  for (const caracter of String(clave || "")) hash = (hash * 31 + caracter.charCodeAt(0)) | 0;
  const positivo = Math.abs(hash);
  return {
    lat: COORDS_CENTRO.lat + (((positivo % 100) - 50) / 5000),
    lng: COORDS_CENTRO.lng + (((Math.floor(positivo / 100) % 100) - 50) / 5000),
  };
}

function extraerGeo(texto) {
  const coincidencia = String(texto || "").match(GEO_TOKEN);
  if (!coincidencia) return null;
  const lat = Number(coincidencia[1]);
  const lng = Number(coincidencia[2]);
  return coordsValidas(lat, lng) ? { lat, lng } : null;
}

function limpiarProductos(texto) {
  return String(texto || "")
    .replace(GEO_TOKEN_GLOBAL, "")
    .replace(/\|\s*$/, "")
    .trim();
}

function productosDe(texto) {
  return limpiarProductos(texto).split(/[;,]+/).map((s) => s.trim()).filter(Boolean);
}

async function geocodificar(direccion, zona) {
  // Photon (datos OSM, sin key) es el proveedor principal: Nominatim suele
  // bloquear peticiones desde IPs compartidas/servidores.
  // Se prueban variantes porque agregar la "Zona" a veces arruina la búsqueda.
  const variantes = [
    [direccion, "Durango", "México"],
    [direccion, zona, "Durango", "México"],
    [zona, "Durango", "México"],
  ];
  const yaIntentadas = new Set();

  for (const partes of variantes) {
    const q = partes.filter(Boolean).join(", ");
    if (!q || yaIntentadas.has(q)) continue;
    yaIntentadas.add(q);
    try {
      const urlPhoton = new URL("https://photon.komoot.io/api/");
      urlPhoton.searchParams.set("q", q);
      urlPhoton.searchParams.set("limit", "1");
      const respuestaPhoton = await fetch(urlPhoton, {
        headers: { "User-Agent": "NEX24-Hackathon/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(6000),
      });
      if (respuestaPhoton.ok) {
        const datos = await respuestaPhoton.json();
        const coordsPhoton = datos?.features?.[0]?.geometry?.coordinates;
        if (coordsValidas(coordsPhoton?.[1], coordsPhoton?.[0])) {
          return { lat: Number(coordsPhoton[1]), lng: Number(coordsPhoton[0]) };
        }
      }
    } catch (_e) {}
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", [direccion, zona, "Durango", "México"].filter(Boolean).join(", "));
  try {
    const respuesta = await fetch(url, {
      headers: {
        "User-Agent": "NEX24-Hackathon/1.0 (origen-dgo@example.com)",
        "Accept-Language": "es",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!respuesta.ok) return null;
    const datos = await respuesta.json();
    const punto = Array.isArray(datos) && datos[0];
    if (!punto) return null;
    return coordsValidas(punto.lat, punto.lon) ? { lat: Number(punto.lat), lng: Number(punto.lon) } : null;
  } catch (_e) {
    return null;
  }
}

function perfilesAProductores(filas = []) {
  return filas.map((p, indice) => {
    const geo = extraerGeo(p.products) ||
      (coordsValidas(p.lat, p.lng) ? { lat: Number(p.lat), lng: Number(p.lng) } : null) ||
      coordsPorDefecto(p.email || p.business_name);
    return {
      id: p.id || `sp_${indice}`,
      nombre: p.business_name || "Negocio local",
      categoria: String(p.category || "abarrotes").toLowerCase(),
      productos: productosDe(p.products),
      descripcion: `Negocio local registrado: ${p.responsible_name || "NEX24"}`,
      precio_menudeo: null,
      precio_mayoreo: null,
      unidad: "unidad",
      capacidad_semanal: p.capacity || "Bajo pedido",
      zona_durango: p.zone || "Durango",
      lat: geo.lat,
      lng: geo.lng,
      whatsapp: p.phone,
      verificado: true,
      destacado: false,
      es_supabase: true,
    };
  }).filter(Boolean);
}

function sanitizarPerfil(p) {
  return { ...p, products: limpiarProductos(p.products) };
}

let _supabaseGeoDisponible = null;
async function supabaseGeoDisponible() {
  if (_supabaseGeoDisponible !== null) return _supabaseGeoDisponible;
  if (!supabaseAdmin) return false;
  const { error } = await supabaseAdmin.from('profiles').select('lat,lng').limit(1);
  _supabaseGeoDisponible = !error;
  return _supabaseGeoDisponible;
}

// Locales registrados antes de este feature no traen geo: se geocodifica su
// dirección una sola vez y se guarda el marcador para no repetir la llamada.
const geoIntentados = new Set();
async function backfillGeoPerfiles(filas = []) {
  if (!supabaseAdmin) return filas;
  const pendientes = filas.filter((p) =>
    !extraerGeo(p.products) && !coordsValidas(p.lat, p.lng) && p.id && !geoIntentados.has(p.id)
  );
  if (!pendientes.length) return filas;

  const resueltos = await Promise.all(pendientes.map(async (p) => {
    geoIntentados.add(p.id);
    const coords = await geocodificar(p.address, p.zone);
    if (!coords) return p;
    const marker = `@geo=${coords.lat},${coords.lng}`;
    const products = [limpiarProductos(p.products), marker].filter(Boolean).join(' | ');
    const { error } = await supabaseAdmin.from('profiles').update({ products }).eq('id', p.id);
    if (error) return p;
    if (await supabaseGeoDisponible()) {
      await supabaseAdmin.from('profiles').update({ lat: coords.lat, lng: coords.lng }).eq('id', p.id);
    }
    return { ...p, products, lat: coords.lat, lng: coords.lng };
  }));

  const porId = new Map(resueltos.map((p) => [p.id, p]));
  return filas.map((p) => porId.get(p.id) || p);
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

// --- Imágenes de productos publicados por proveedores -------------------------
function guardarImagenProducto(imagen) {
  if (!imagen?.buffer?.length || !MIME_OK.has(imagen.mimeType)) return null;
  const extension = EXTENSIONES_IMAGEN[imagen.mimeType] || 'jpg';
  const nombre = `producto-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, nombre), imagen.buffer);
  return `${UPLOAD_URL}${nombre}`;
}

function eliminarImagenProducto(url) {
  if (typeof url !== 'string' || !url.startsWith(UPLOAD_URL)) return;
  const nombre = path.basename(url);
  if (!/^producto-[\w-]+\.(jpg|png|webp)$/.test(nombre)) return;
  try {
    fs.unlinkSync(path.join(UPLOAD_DIR, nombre));
  } catch (_e) {}
}

function urlImagenSegura(valor) {
  if (typeof valor !== 'string' || !valor.startsWith(UPLOAD_URL)) return '';
  const nombre = path.basename(valor);
  return /^producto-[\w-]+\.(jpg|png|webp)$/.test(nombre) ? `${UPLOAD_URL}${nombre}` : '';
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
  res.json({ ok: true, modo: modoConfigurado(), db: supabaseConfigurado() ? 'supabase' : 'local' });
});

app.get('/api/productores', async (_req, res) => {
  let lista = [...productores, ...productoresLocalesAprobados()];
  if (supabaseConfigurado()) {
    try {
      const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('status', 'approved');
      if (!error && Array.isArray(data) && data.length) {
        lista = [...lista, ...perfilesAProductores(await backfillGeoPerfiles(data))];
      }
    } catch (_e) {}
  }
  res.json(inyectarProductosPublicados(lista));
});

app.get('/api/catalogo', async (_req, res) => {
  try {
    let adicionales = [];
    if (supabaseConfigurado()) {
      const { data } = await supabaseAdmin.from('profiles').select('*').eq('status', 'approved');
      if (data && data.length) adicionales = perfilesAProductores(await backfillGeoPerfiles(data));
    }
    const lista = inyectarProductosPublicados([...productores, ...productoresLocalesAprobados(), ...adicionales]);
    res.json({ ok: true, total: lista.length, productores: lista });
  } catch (_error) {
    const lista = inyectarProductosPublicados([...productores, ...productoresLocalesAprobados()]);
    res.json({ ok: true, total: lista.length, productores: lista });
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

// --- Productos publicados desde el panel de proveedores -----------------------
function todosLosProductosPublicados() {
  const db = loadLocalDb();
  return Array.isArray(db.products) ? db.products : [];
}

function guardarProductosPublicados(productos) {
  const db = loadLocalDb();
  db.products = productos;
  saveLocalDb(db);
}

function productosDeProveedor(proveedorId) {
  return todosLosProductosPublicados()
    .filter((p) => String(p.proveedorId) === String(proveedorId));
}

function normalizarNombre(texto) {
  return String(texto || '').trim().toLowerCase();
}

// Los proveedores aprobados en la base local también deben aparecer en el mercado.
function productoresLocalesAprobados() {
  const db = loadLocalDb();
  const aprobados = (db.users || []).filter(
    (u) => u.role === 'proveedor' && u.status === 'approved'
  );
  return perfilesAProductores(aprobados);
}

// Inyecta los productos publicados en cada productor del catálogo para que el
// frontend los muestre con su foto, precio y descripción propios.
function inyectarProductosPublicados(lista) {
  const publicados = todosLosProductosPublicados();
  if (!publicados.length) return lista;

  return lista.map((productor) => {
    const propios = publicados.filter(
      (p) => String(p.proveedorId) === String(productor.id) && p.estado !== 'pausado'
    );
    if (!propios.length) return productor;

    const nombres = new Set(propios.map((p) => normalizarNombre(p.nombre)));
    const base = Array.isArray(productor.productos) ? productor.productos : [];
    const restantes = base.filter((entrada) => {
      const nombre = typeof entrada === 'object' && entrada !== null ? entrada.nombre : entrada;
      return !nombres.has(normalizarNombre(nombre));
    });

    return { ...productor, productos: [...propios, ...restantes] };
  });
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

// Resuelve el perfil autenticado para los endpoints del panel (local o Supabase).
async function perfilDeSesion(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;

  if (activeSessions.has(token)) return activeSessions.get(token);

  const matchRole = token.match(/^(?:nex|demo)-token-(admin|proveedor|tiendita)/);
  if (matchRole) {
    const db = loadLocalDb();
    const user = db.users.find((u) => u.role === matchRole[1]);
    if (user) {
      const { password: _, ...profile } = user;
      return profile;
    }
  }

  if (supabaseConfigurado()) {
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (!authError && authData?.user) {
        const { data: profile, error } = await supabaseAdmin.from('profiles').select('*').eq('id', authData.user.id).single();
        if (!error && profile) return profile;
      }
    } catch (_e) {}
  }

  return null;
}

app.get('/api/registros', async (_req, res) => {
  const db = loadLocalDb();
  let registros = db.users.map(({ password: _, ...u }) => u);
  if (supabaseConfigurado()) {
    try {
      const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length) {
        registros = data.map(sanitizarPerfil);
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
  const zona = texto(cuerpo.zona);
  const productos = texto(cuerpo.productos);
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

  // GPS del navegador → geocodificación de la dirección → fallback determinista
  let coords = coordsValidas(cuerpo.lat, cuerpo.lng)
    ? { lat: Number(cuerpo.lat), lng: Number(cuerpo.lng) }
    : null;
  if (!coords) coords = await geocodificar(direccion, zona);
  if (!coords) coords = coordsPorDefecto(email || nombre);

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
    zone: zona || 'Centro',
    category: texto(cuerpo.categoria) || (tipo === 'tiendita' ? 'Abarrotes' : 'General'),
    products: productos || '',
    lat: coords.lat,
    lng: coords.lng,
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
        const filaSupabase = {
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
          // El geo viaja dentro de products para funcionar sin migración SQL.
          // Al servirlo se limpia en /api/registros, /api/admin/negocios y /api/catalogo.
          products: [productos, `@geo=${coords.lat},${coords.lng}`].filter(Boolean).join(' | '),
          capacity: profile.capacity,
          status: 'approved',
        };
        if (await supabaseGeoDisponible()) {
          filaSupabase.lat = coords.lat;
          filaSupabase.lng = coords.lng;
        }
        await supabaseAdmin.from('profiles').insert(filaSupabase);
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
        negocios = data.map(sanitizarPerfil);
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
  const profile = await perfilDeSesion(req);
  if (!profile) return fallo(res, 401, 'Sesión inválida o expirada');
  return res.json({ ok: true, profile });
});

// --- API del catálogo del proveedor -------------------------------------------
function datosProducto(cuerpo) {
  const texto = (valor) => typeof valor === 'string' ? valor.trim() : '';
  const nombre = texto(cuerpo.nombre);
  const categoria = texto(cuerpo.categoria) || 'general';
  const unidad = texto(cuerpo.unidad) || 'unidad';
  const descripcion = texto(cuerpo.descripcion);
  const precio_menudeo = Number(cuerpo.precio_menudeo);
  const precio_mayoreo = Number(cuerpo.precio_mayoreo);

  if (!nombre) return { error: 'El nombre del producto es obligatorio.' };
  if (!Number.isFinite(precio_menudeo) || precio_menudeo <= 0 ||
      !Number.isFinite(precio_mayoreo) || precio_mayoreo <= 0) {
    return { error: 'Los precios deben ser mayores a cero.' };
  }
  if (precio_mayoreo > precio_menudeo) {
    return { error: 'El precio de mayoreo no puede ser mayor al precio de menudeo.' };
  }

  return { datos: { nombre, categoria, unidad, descripcion, precio_menudeo, precio_mayoreo } };
}

function productoPertenece(producto, proveedorId) {
  return producto && String(producto.proveedorId) === String(proveedorId);
}

app.get('/api/proveedor/productos', async (req, res) => {
  const perfil = await perfilDeSesion(req);
  if (!perfil || perfil.role !== 'proveedor') {
    return fallo(res, 401, 'Sesión de proveedor requerida');
  }
  res.json({ ok: true, productos: productosDeProveedor(perfil.id) });
});

app.post('/api/proveedor/productos', (req, res) => {
  subirImagen(req, res, async (errorMulter) => {
    if (errorMulter) {
      const mensaje = errorMulter.code === 'LIMIT_FILE_SIZE'
        ? 'La imagen supera el límite de 8 MB'
        : `No se pudo leer la imagen: ${errorMulter.message}`;
      return fallo(res, 400, mensaje);
    }

    try {
      const perfil = await perfilDeSesion(req);
      if (!perfil || perfil.role !== 'proveedor') {
        return fallo(res, 401, 'Sesión de proveedor requerida');
      }

      const resultado = datosProducto(req.body || {});
      if (resultado.error) return fallo(res, 400, resultado.error);

      const imagen = req.file
        ? { buffer: req.file.buffer, mimeType: normalizarMime(req.file.mimetype) }
        : leerImagenJson(req.body);
      if (imagen && !MIME_OK.has(imagen.mimeType)) {
        return fallo(res, 400, 'Formato no soportado. Usa jpg, png o webp');
      }
      if (imagen?.buffer?.length > MAX_BYTES) {
        return fallo(res, 400, 'La imagen supera el límite de 8 MB');
      }

      const ahora = new Date().toISOString();
      const producto = {
        id: `prd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        proveedorId: perfil.id,
        ...resultado.datos,
        imagen: imagen ? (guardarImagenProducto(imagen) || '') : '',
        estado: 'activo',
        created_at: ahora,
        updated_at: ahora,
      };

      guardarProductosPublicados([producto, ...todosLosProductosPublicados()]);
      return res.status(201).json({ ok: true, producto });
    } catch (error) {
      console.error('[productos] Error al publicar:', error);
      return fallo(res, 500, 'No se pudo publicar el producto');
    }
  });
});

app.put('/api/proveedor/productos/:id', (req, res) => {
  subirImagen(req, res, async (errorMulter) => {
    if (errorMulter) {
      return fallo(res, 400, errorMulter.code === 'LIMIT_FILE_SIZE'
        ? 'La imagen supera el límite de 8 MB'
        : `No se pudo leer la imagen: ${errorMulter.message}`);
    }

    try {
      const perfil = await perfilDeSesion(req);
      if (!perfil || perfil.role !== 'proveedor') {
        return fallo(res, 401, 'Sesión de proveedor requerida');
      }

      const resultados = todosLosProductosPublicados();
      const indice = resultados.findIndex((p) => p.id === req.params.id && productoPertenece(p, perfil.id));
      if (indice === -1) return fallo(res, 404, 'Producto no encontrado');

      const validacion = datosProducto(req.body || {});
      if (validacion.error) return fallo(res, 400, validacion.error);

      const imagen = req.file
        ? { buffer: req.file.buffer, mimeType: normalizarMime(req.file.mimetype) }
        : leerImagenJson(req.body);
      if (imagen && !MIME_OK.has(imagen.mimeType)) {
        return fallo(res, 400, 'Formato no soportado. Usa jpg, png o webp');
      }
      if (imagen?.buffer?.length > MAX_BYTES) {
        return fallo(res, 400, 'La imagen supera el límite de 8 MB');
      }

      const anterior = resultados[indice];
      const imagenNueva = imagen ? guardarImagenProducto(imagen) : null;
      if (imagenNueva) eliminarImagenProducto(anterior.imagen);

      resultados[indice] = {
        ...anterior,
        ...validacion.datos,
        imagen: imagenNueva || urlImagenSegura(req.body?.imagenActual),
        updated_at: new Date().toISOString(),
      };

      guardarProductosPublicados(resultados);
      return res.json({ ok: true, producto: resultados[indice] });
    } catch (error) {
      console.error('[productos] Error al actualizar:', error);
      return fallo(res, 500, 'No se pudo actualizar el producto');
    }
  });
});

app.patch('/api/proveedor/productos/:id/estado', async (req, res) => {
  try {
    const perfil = await perfilDeSesion(req);
    if (!perfil || perfil.role !== 'proveedor') {
      return fallo(res, 401, 'Sesión de proveedor requerida');
    }

    const estado = String(req.body?.estado || '');
    if (!['activo', 'pausado'].includes(estado)) {
      return fallo(res, 400, 'Estado inválido. Usa activo o pausado.');
    }

    const productos = todosLosProductosPublicados();
    const producto = productos.find((p) => p.id === req.params.id && productoPertenece(p, perfil.id));
    if (!producto) return fallo(res, 404, 'Producto no encontrado');

    producto.estado = estado;
    producto.updated_at = new Date().toISOString();
    guardarProductosPublicados(productos);
    return res.json({ ok: true, producto });
  } catch (error) {
    console.error('[productos] Error al cambiar estado:', error);
    return fallo(res, 500, 'No se pudo actualizar el producto');
  }
});

app.delete('/api/proveedor/productos/:id', async (req, res) => {
  try {
    const perfil = await perfilDeSesion(req);
    if (!perfil || perfil.role !== 'proveedor') {
      return fallo(res, 401, 'Sesión de proveedor requerida');
    }

    const productos = todosLosProductosPublicados();
    const producto = productos.find((p) => p.id === req.params.id && productoPertenece(p, perfil.id));
    if (!producto) return fallo(res, 404, 'Producto no encontrado');

    eliminarImagenProducto(producto.imagen);
    guardarProductosPublicados(productos.filter((p) => p.id !== producto.id));
    return res.json({ ok: true, producto });
  } catch (error) {
    console.error('[productos] Error al eliminar:', error);
    return fallo(res, 500, 'No se pudo eliminar el producto');
  }
});

// La interfaz NEX24 se sirve desde el mismo servidor que la API.
// Solo se exponen las carpetas públicas: nunca RAIZ completa (ahí viven .env y la key).
app.get(['/', '/index.html'], (_req, res) => res.sendFile(path.join(RAIZ, 'index.html')));
app.get('/propuesta', (_req, res) => res.sendFile(path.join(RAIZ, 'pages/propuesta.html')));
app.get('/productos', (_req, res) => res.sendFile(path.join(RAIZ, 'pages/productos.html')));
app.get('/lens', (_req, res) => res.sendFile(path.join(RAIZ, 'pages/lens.html')));
app.get('/mapa', (_req, res) => res.sendFile(path.join(RAIZ, 'pages/mapa.html')));
app.get('/tienda', (_req, res) => res.sendFile(path.join(RAIZ, 'pages/tienda.html')));
app.get('/proveedor', (_req, res) => res.sendFile(path.join(RAIZ, 'pages/proveedor.html')));
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
