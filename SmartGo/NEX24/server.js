import 'dotenv/config';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

import { buscarProductores, productores } from './matcher.js';
import { analizarImagen } from './vision.js';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const PUERTO = Number(process.env.PORT) || 3001;
const MAX_BYTES = 8 * 1024 * 1024;
const MIME_OK = new Set(['image/jpeg', 'image/png', 'image/webp']);

const app = express();
app.use(cors());
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

// La interfaz NEX24 se sirve desde el mismo servidor que la API.
// Solo se exponen las carpetas públicas: nunca RAIZ completa (ahí viven .env y la key).
app.get('/', (_req, res) => res.sendFile(path.join(RAIZ, 'index.html')));
app.get('/lens', (_req, res) => res.redirect('/pages/lens.html'));
app.use('/pages', express.static(path.join(RAIZ, 'pages')));
app.use('/css', express.static(path.join(RAIZ, 'css')));
app.use('/js', express.static(path.join(RAIZ, 'js')));

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

const servidor = app.listen(PUERTO, () => {
  const ip = ipEnLan();
  console.log(`NEX24 + Lens Local en http://localhost:${PUERTO} (modo ${modoConfigurado()})`);
  console.log(`  PC:       http://localhost:${PUERTO}/lens`);
  if (ip) console.log(`  Celular:  http://${ip}:${PUERTO}/lens   (misma Wi-Fi)`);
  console.log(`  API:      http://localhost:${PUERTO}/api/lens/scan`);
});

export { app, servidor };
export default app;
