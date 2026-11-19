# Lens Local API (backend)

API del módulo B2C **Lens Local** de Origen DGO: recibe una foto de un producto, la identifica con Gemini y devuelve los productores de Durango que ofrecen el equivalente, con precio y distancia.

Para Persona A (frontend): todo se consume por HTTP. El contrato de la sección [Escanear](#post-apilensscan) es el que debe respetarse.

## Requisitos

- Node 22 o superior (probado con v24.14.1)
- Opcional: API key de Gemini (https://aistudio.google.com)

## Levantar el servidor

```bash
npm install
cp env.example .env      # en Windows: copy env.example .env
npm start                # http://localhost:3001
```

Con un solo `npm start` se sirven **la interfaz y la API en el mismo puerto**:

| URL | Qué es |
|---|---|
| `http://localhost:3001/` | Tienda NEX24 |
| `http://localhost:3001/lens` | Lens IA (atajo a `/pages/lens.html`) |
| `http://localhost:3001/mapa` | Mapa Lens IA (atajo a `/pages/mapa.html`) |
| `http://localhost:3001/api/lens/scan` | Endpoint de visión |
| `http://localhost:3001/health` | Estado de la API |

El cliente (`js/lens.js`) usa rutas relativas cuando la página la sirve Express. Si abres el HTML con Live Server o directamente con `file://`, cae automáticamente a `http://localhost:3001`. También puedes forzar otra URL con `localStorage.setItem("lensApi", "http://...")`.

Sin API key (o con `MOCK=true`) el servidor funciona igual en **modo mock**: usa detecciones de demo y el matching real contra el catálogo. Ideal para desarrollar el frontend sin internet.

## Abrir desde el celular

1. Conecta el celular y la PC a la **misma Wi-Fi**.
2. Corre `npm start` en la PC. Al arrancar se imprime la IP, por ejemplo:
   ```
   Celular:  http://10.126.1.142:3001/lens   (misma Wi-Fi)
   ```
3. Abre esa URL en Chrome/Safari del celular.

Si no conecta, es el cortafuegos de Windows. Como administrador:

```powershell
New-NetFirewallRule -DisplayName "NEX24 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

Notas:

- La cámara (`capture="environment"`) funciona en HTTP normal.
- El botón "Usar mi ubicación" puede fallar: los navegadores piden HTTPS para geolocalización. La app sigue con el Centro de Durango. Para GPS real necesitas un túnel HTTPS (ngrok / Cloudflare Tunnel).
- En Wi-Fi de universidad u hotel a veces se aísla a los clientes y el celular no ve la PC. Solución: comparte hotspot desde el celular y conecta la PC a ese hotspot, o usa un túnel.

### Variables de entorno (`.env`)

| Variable | Default | Descripción |
|---|---|---|
| `GEMINI_API_KEY` | vacío | Key de Gemini. Sin ella todo corre en modo mock. |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Modelo de visión (2.5 ya está deprecado). |
| `PORT` | `3001` | Puerto del servidor. |
| `MOCK` | `false` | `true` fuerza el modo mock (no llama a Gemini). |
| `GEMINI_TIMEOUT_MS` | `25000` | Tiempo máximo de espera a Gemini. Súbelo si tu internet es lento. |

La key vive solo en el servidor. No la pongas en el frontend ni la subas a git (`.env` ya está en `.gitignore`).

## Endpoints

### `GET /health`

```json
{ "ok": true, "modo": "gemini" }
```

`modo` es `"mock"` si no hay key o si `MOCK=true`.

### `GET /api/productores`

Devuelve el arreglo completo de los 14 productores (para el mapa y el módulo B2B).

### `POST /api/lens/scan`

Acepta `multipart/form-data` o JSON.

**Multipart:**

| Campo | Tipo | Obligatorio |
|---|---|---|
| `image` | jpg / png / webp, máx 8 MB | sí |
| `lat`, `lng` | números (ubicación del usuario) | no |
| `?demo=cafe` | query, fuerza detección mock | no |

Demos disponibles: `cafe`, `miel`, `queso`, `pan`, `mezcal`.

**JSON:**

```json
{
  "imageBase64": "data:image/png;base64,....",
  "mimeType": "image/png",
  "lat": 24.03,
  "lng": -104.65
}
```

`imageBase64` puede ser base64 puro o data URL.

**Respuesta 200** (siempre `ok: true`, incluso si nada coincide):

```json
{
  "ok": true,
  "modo": "gemini | mock | fallback",
  "deteccion": {
    "producto": "Café instantáneo",
    "categoria": "cafe",
    "marca": "Nescafé",
    "keywords": ["cafe", "instantaneo", "nescafe"],
    "confianza": 0.92
  },
  "match_type": "exacto | categoria | fallback",
  "ubicacion_usuario": "gps | default",
  "resultados": [
    {
      "id": "p01",
      "nombre": "Café Sierra Madre Tostadores",
      "categoria": "cafe",
      "productos": ["Café tostado en grano 500g"],
      "descripcion": "...",
      "precio_menudeo": 135,
      "precio_mayoreo": 108,
      "unidad": "bolsa 500g",
      "zona_durango": "Centro",
      "lat": 24.0262,
      "lng": -104.6561,
      "whatsapp": "5216180000001",
      "verificado": true,
      "distancia_km": 0.4,
      "score": 7,
      "razon": "misma categoría (cafe) · coincide con: cafe"
    }
  ],
  "latencia_ms": 2100
}
```

- `modo: "fallback"` significa que había key pero Gemini falló; se respondió con detección demo para que la demo no se caiga.
- Si `match_type` es `"fallback"`, `resultados` trae 2 productores destacados/cercanos.
- Si el usuario no manda `lat`/`lng`, se usa la Plaza de Armas de Durango y `ubicacion_usuario` es `"default"`.

**Errores** (`400`):

```json
{ "ok": false, "error": "La imagen supera el límite de 8 MB" }
```

## Ejemplo desde el frontend (React)

`pages/lens.html` + `js/lens.js` ya son un ejemplo funcional en la app (vanilla JS): suben la foto, la comprimen a ~1280 px antes de enviarla y pintan los resultados. El mismo flujo desde React sería:

```js
async function escanearProducto(file, lat, lng) {
  const datos = new FormData();
  datos.append('image', file);          // File o Blob del <input type="file">
  if (lat != null) datos.append('lat', lat);
  if (lng != null) datos.append('lng', lng);

  const respuesta = await fetch('http://localhost:3001/api/lens/scan', {
    method: 'POST',
    body: datos,                        // no pongas Content-Type: lo pone fetch solo
  });

  return respuesta.json();
}

// Sin cámara ni internet: fuerza la demo
fetch('http://localhost:3001/api/lens/scan?demo=miel', {
  method: 'POST',
  body: (() => { const d = new FormData(); d.append('image', file); return d; })(),
});
```

## Pruebas

```bash
npm test
```

Ejercita el catálogo, la distancia, el matching (café, miel, caso ambiguo y caso sin relación) y el modo mock. Nunca debe devolver `resultados` vacíos.

Para probar Gemini con una foto real:

```bash
node scripts/probar-gemini.js fotos/cafe.jpg
```

## Estructura

```
server.js              Express + multer + endpoints + archivos estáticos de la interfaz
vision.js              Gemini, mock y degradación a fallback
matcher.js             Matching contra el catálogo + haversine
productores.json       Catálogo ficticio (14 productores)
pages/lens.html        Apartado Lens IA de la app (sube foto y muestra matches)
js/lens.js             Cliente de la API desde el navegador
scripts/test.js        Pruebas del matcher y del modo mock
scripts/probar-gemini.js  Prueba manual de visión con una foto
```

El catálogo es ficticio, solo para el hackatón. No hay base de datos ni autenticación.
