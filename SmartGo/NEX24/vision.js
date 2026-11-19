import { CATEGORIAS } from './matcher.js';

const MIME_OK = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 25000;

// Detecciones fijas para la demo (plan B: sin internet o sin API key)
const DETECCIONES_DEMO = {
  cafe: {
    producto: 'Café instantáneo',
    categoria: 'cafe',
    marca: 'Nescafé',
    keywords: ['cafe', 'instantaneo', 'nescafe'],
    confianza: 0.92,
  },
  miel: {
    producto: 'Miel de abeja',
    categoria: 'miel',
    marca: 'La Sierra',
    keywords: ['miel', 'abeja', 'natural'],
    confianza: 0.9,
  },
  queso: {
    producto: 'Queso menonita',
    categoria: 'queso',
    marca: 'Nuevo Ideal',
    keywords: ['queso', 'menonita', 'lacteo'],
    confianza: 0.88,
  },
  pan: {
    producto: 'Pan artesanal',
    categoria: 'panaderia',
    marca: '',
    keywords: ['pan', 'artesanal', 'masa'],
    confianza: 0.85,
  },
  mezcal: {
    producto: 'Mezcal artesanal',
    categoria: 'mezcal',
    marca: 'Durango',
    keywords: ['mezcal', 'botella', 'destilado'],
    confianza: 0.87,
  },
};

export const DEMOS = Object.keys(DETECCIONES_DEMO);

const esMock = () => String(process.env.MOCK).toLowerCase() === 'true' || !process.env.GEMINI_API_KEY;

function mock(demo) {
  const clave = String(demo || 'cafe').toLowerCase();
  const base = DETECCIONES_DEMO[clave] || DETECCIONES_DEMO.cafe;
  return JSON.parse(JSON.stringify(base));
}

function limpiarDeteccion(deteccion) {
  if (!deteccion || typeof deteccion !== 'object') {
    throw new Error('Gemini devolvió una detección vacía');
  }

  const categoria = String(deteccion.categoria || '').trim().toLowerCase();
  const confianza = Number(deteccion.confianza);

  return {
    producto: String(deteccion.producto || '').trim() || 'Producto sin identificar',
    categoria,
    marca: String(deteccion.marca || '').trim(),
    keywords: Array.isArray(deteccion.keywords)
      ? deteccion.keywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean).slice(0, 6)
      : [],
    confianza: Number.isFinite(confianza) ? Math.min(1, Math.max(0, confianza)) : 0,
  };
}

function validarImagen({ buffer, mimeType } = {}) {
  if (!buffer || !buffer.length) throw new Error('La imagen está vacía');
  if (!MIME_OK.has(mimeType)) {
    throw new Error('Formato no soportado. Usa jpg, png o webp');
  }
}

async function llamarGemini({ buffer, mimeType }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Falta GEMINI_API_KEY en .env');

  const modelo = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;

  const prompt = `Identifica el producto comercial de la foto. Elige la "categoria" ÚNICAMENTE de esta lista: ${CATEGORIAS.join(', ')}; si no encaja ninguna, elige la más cercana. Devuelve marca si es visible, 3-6 keywords en español sin acentos y tu confianza de 0 a 1.`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: buffer.toString('base64') } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          producto: { type: 'STRING' },
          categoria: { type: 'STRING', enum: CATEGORIAS },
          marca: { type: 'STRING' },
          keywords: { type: 'ARRAY', items: { type: 'STRING' } },
          confianza: { type: 'NUMBER' },
        },
        required: ['producto', 'categoria', 'keywords', 'confianza'],
      },
    },
  };

  let ultimoError;

  for (let intento = 0; intento < 2; intento++) {
    const control = new AbortController();
    const timer = setTimeout(() => control.abort(), TIMEOUT_MS);

    try {
      const respuesta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: control.signal,
      });

      // Reintentar una vez si Gemini nos limita (429)
      if (respuesta.status === 429 && intento === 0) {
        ultimoError = new Error('Gemini respondió 429 (límite de peticiones)');
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }

      if (!respuesta.ok) {
        const texto = await respuesta.text().catch(() => '');
        throw new Error(`Gemini ${respuesta.status}: ${texto.slice(0, 200)}`);
      }

      const data = await respuesta.json();
      const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!texto) throw new Error('Gemini no devolvió texto');

      return limpiarDeteccion(JSON.parse(texto));
    } catch (error) {
      ultimoError =
        error.name === 'AbortError'
          ? new Error(`Gemini tardó más de ${Math.round(TIMEOUT_MS / 1000)} s`)
          : error;
      break;
    } finally {
      clearTimeout(timer);
    }
  }

  throw ultimoError;
}

/**
 * Analiza una imagen y devuelve { modo, deteccion }.
 * modo: "gemini" | "mock" | "fallback".
 * - mock: MOCK=true, se pidió ?demo= o no hay API key.
 * - fallback: había API key pero Gemini falló; se usa detección demo.
 */
export async function analizarImagen(imagen, { demo = null, forzarGemini = false } = {}) {
  validarImagen(imagen);

  if (forzarGemini && !process.env.GEMINI_API_KEY) {
    throw new Error('Falta GEMINI_API_KEY en .env');
  }

  if (demo) return { modo: 'mock', deteccion: mock(demo) };

  if (!forzarGemini && esMock()) {
    return { modo: 'mock', deteccion: mock(null) };
  }

  try {
    const deteccion = await llamarGemini(imagen);
    return { modo: 'gemini', deteccion };
  } catch (error) {
    console.warn(`[vision] Gemini falló (${process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'}): ${error.message}. Uso detección demo.`);
    return { modo: 'fallback', deteccion: mock(demo) };
  }
}
