import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

import { buscarProductores } from '../matcher.js';
import { analizarImagen } from '../vision.js';

const ruta = process.argv[2];

if (!ruta) {
  console.error('Uso: node scripts/probar-gemini.js <ruta-de-la-imagen>');
  console.error('Ejemplo: node scripts/probar-gemini.js fotos/cafe.jpg');
  process.exit(1);
}

if (!fs.existsSync(ruta)) {
  console.error(`No existe la imagen: ${ruta}`);
  process.exit(1);
}

const extension = path.extname(ruta).toLowerCase();
const mimeType =
  extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg';

try {
  const buffer = fs.readFileSync(ruta);
  const kb = Math.round(buffer.length / 1024);
  console.log(`Imagen: ${ruta} (${kb} KB)`);

  const inicio = Date.now();
  const { modo, deteccion } = await analizarImagen({ buffer, mimeType }, { forzarGemini: true });
  const ms = Date.now() - inicio;
  const match = buscarProductores(deteccion, null);

  console.log(`\nModo: ${modo === 'gemini' ? 'gemini' : `${modo} (Gemini falló)`} · ${ms} ms`);
  console.log('\nDetección:');
  console.log(JSON.stringify(deteccion, null, 2));
  console.log(`\nMatch (${match.match_type}):`);
  console.log(JSON.stringify(match.resultados, null, 2));
} catch (error) {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
}
