# HANDOFF: Módulo Lens Local (Origen DGO)

> Para la IA que continúe este proyecto. No tienes contexto previo: lee TODO esto antes de escribir código.
> El usuario habla español informal (mexicano). Responde en español, claro y corto. **Trabaja paso a paso**: haz un paso, muéstralo, y pregunta antes de seguir. No construyas todo de golpe.

## 1. Qué es el proyecto

**Origen DGO** es una app web/móvil para un hackatón (equipo de 2 personas). Conecta productores locales de Durango, México con ciudadanos y comercios.

- **Problema:** hay mucha oferta de productores locales (alimentos, campo, artesanía) pero nadie sabe qué se produce cerca.
- **Módulo B2C "Lens Local":** el ciudadano toma foto a un producto comercial (ej. un café de marca) y la app le dice qué productor de Durango hace el equivalente, su precio y ubicación.
- **Módulo B2B "Abasto DGO":** restaurantes/tiendas filtran productores por capacidad semanal, precio de mayoreo y rutas de entrega.
- Ambos módulos usan la **misma base de productores**.

## 2. Rol del usuario (a quién ayudas)

El usuario es **Persona B: Backend + IA (Lens B2C) + Datos**. Tu trabajo es SOLO el backend de Lens:
API de visión con Gemini, catálogo de productores, lógica de matching y distancia. **No hagas el frontend**: lo hace Persona A (React/Next o Vite + Tailwind, mapa Leaflet, 4 pestañas: Explorar, Escáner IA, Match B2B, Registro Productor). Persona A consumirá tu API por HTTP, así que el contrato JSON (sección 5) es sagrado. En esta carpeta ya hay una plantilla estática NEX24 (`index.html`, `pages/`, `css/`, `js/app.js`) que Persona A puede usar o reemplazar; no es parte del backend.

## 3. Decisiones ya tomadas

- Visión: **Gemini Vision API** (REST, modelo configurable por `GEMINI_MODEL`, default `gemini-3.5-flash-lite`; `gemini-2.5-flash` quedó deprecado en 2026, confirma el modelo vigente en https://ai.google.dev/gemini-api/docs/models).
- Backend: **Node 22+ + Express** (ESM, `"type": "module"`), servidor independiente que cualquier frontend pueda consumir. En esta máquina hay Node v24.14.1.
- **Plan B obligatorio:** modo mock (`MOCK=true` o sin API key o si Gemini falla) para que la demo nunca falle por Wi-Fi.
- **Fallback del matching:** si la foto es ambigua o nada coincide, devolver 2 productores destacados/cercanos (la demo nunca debe quedar vacía).
- La API key de Gemini vive SOLO en el servidor (`.env`), nunca en el frontend.
- Gemini: el tier gratis usa los datos para mejorar productos de Google; el de paga no. Límites son por proyecto, no por key. Costo estimado ≈ $0.001 por escaneo con Flash.

## 4. Estado actual (lo que YA existe en esta carpeta)

| Archivo | Estado |
|---|---|
| `productores.json` | Hecho. 14 productores ficticios de Durango (cafe, queso, miel, mezcal, panaderia, salsas, cuero, cosmetica, dulces, botana, bebidas, carnes, artesania, tortillas). Campos: `id, nombre, categoria, productos[], descripcion, keywords_ia[], precio_menudeo, precio_mayoreo, unidad, capacidad_semanal, zona_durango, lat, lng, whatsapp, rutas_entrega[], verificado, destacado` |
| `matcher.js` | Hecho y probado (`npm test`). Exporta `productores`, `CATEGORIAS`, `UBICACION_DEFAULT`, `distanciaKm(a,b)` (haversine) y `buscarProductores(vision, ubicacion, limite=3)` que devuelve `{ match_type: "exacto"\|"categoria"\|"fallback", resultados[] }`. Espera `vision = { producto, categoria, marca, keywords[], confianza }`. Puntúa +3 por misma categoría y +1 por keyword coincidente (máx 4), desempata por distancia. Importa `./productores.json`. |
| `package.json` | Hecho (express, cors, multer, dotenv). `npm install` ya corrido; `start`/`dev` → `server.js` y `test` → `scripts/test.js`. |
| `env.example` | Hecho. Copiar a `.env` y poner `GEMINI_API_KEY`. |
| `.gitignore` | Hecho (`node_modules/`, `.env`, `*.log`). |
| `index.html`, `pages/`, `css/`, `js/app.js` | Plantilla frontend **NEX24** (tienda y panel de emprendedores). `pages/lens.html` + `js/lens.js` ya consumen la API. No la modifiques salvo que se pida. |
| `README.txt` | Instructivo de la plantilla NEX24 (no es el README del backend). |
| `vision.js` | Hecho y probado en mock. Gemini REST con timeout configurable (`GEMINI_TIMEOUT_MS`, default 25 s), reintento único en 429, schema JSON, demos `cafe/miel/queso/pan/mezcal` y degradación a `mock`/`fallback`. |
| `server.js` | Hecho y probado. Express + cors + multer memoryStorage (8 MB); `POST /api/lens/scan` (multipart o JSON), `GET /health`, `GET /api/productores`. |
| `scripts/test.js` y `scripts/probar-gemini.js` | Hechos. `npm test` pasa 17 pruebas y `probar-gemini.js` prueba una foto real. |
| `README.md` | Hecho. Guía para Persona A (levantar, contrato y ejemplo de `fetch`). |

Todo el backend vive en la raíz: no existen las carpetas `src/` ni `data/`. Falta solo probar con una API key real de Gemini.

## 5. Contrato JSON con el frontend

**Request:** `POST /api/lens/scan` (multipart/form-data)
- `image` (archivo jpg/png/webp, máx 8 MB), `lat` y `lng` (opcionales, ubicación del usuario)
- Query opcional `?demo=cafe` para forzar una detección en modo mock.
- También aceptar JSON `{ imageBase64, mimeType, lat, lng }`.

**Response 200 (siempre `ok: true`, incluso en fallback):**
```json
{
  "ok": true,
  "modo": "gemini | mock | fallback",
  "deteccion": {
    "producto": "Café instantáneo",
    "categoria": "cafe",
    "marca": "Nescafé",
    "keywords": ["cafe", "instantaneo"],
    "confianza": 0.92
  },
  "match_type": "exacto | categoria | fallback",
  "ubicacion_usuario": "gps | default",
  "resultados": [
    {
      "id": "p01", "nombre": "Café Sierra Madre Tostadores", "categoria": "cafe",
      "productos": ["Café tostado en grano 500g"], "descripcion": "...",
      "precio_menudeo": 135, "precio_mayoreo": 108, "unidad": "bolsa 500g",
      "zona_durango": "Centro", "lat": 24.0262, "lng": -104.6561,
      "whatsapp": "5216180000001", "verificado": true,
      "distancia_km": 0.4, "score": 7, "razon": "misma categoría (cafe) · coincide con: cafe"
    }
  ],
  "latencia_ms": 2100
}
```
Otros endpoints: `GET /health` → `{ ok: true, modo }`, `GET /api/productores` → catálogo completo (lo usa Persona A para el mapa y el módulo B2B).
Errores (archivo faltante o inválido): `400 { ok:false, error:"..." }`. Habilitar CORS.

## 6. Qué sigue

El backend ya funciona completo en modo mock (`npm test` y el servidor están probados). Lo único pendiente del camino crítico es probarlo con una key real:

1. Copiar `env.example` a `.env` y pegar `GEMINI_API_KEY` (se saca en https://aistudio.google.com).
2. `node scripts/probar-gemini.js ruta/a/foto.jpg` con una foto real (café, miel, etc.). Confirmar el modelo vigente en https://ai.google.dev/gemini-api/docs/models.
3. Si responde bien, `npm start` y probar `POST /api/lens/scan` desde el frontend.

**Después (si sobra tiempo):** comprimir imagen a ~1024 px en el cliente, caché por hash de imagen, límite de escaneos por IP, mover el catálogo a una base de datos, escaneo por código de barras como alternativa sin IA.

## 7. Reglas

- Español, tono casual, respuestas cortas. Un paso a la vez; pregunta antes de avanzar.
- No inventes datos reales de productores: el catálogo es ficticio para el hackatón.
- No expongas la API key ni la subas a git (ya hay `.gitignore` con `.env`).
- Si algo falla (429, timeout, JSON inválido de Gemini), degrada a mock/fallback; nunca devuelvas pantalla en blanco.
- Prueba todo lo que escribas antes de decir que funciona.
