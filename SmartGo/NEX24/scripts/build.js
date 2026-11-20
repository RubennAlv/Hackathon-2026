import fs from 'node:fs';
import path from 'node:path';

const raiz = process.cwd();
const salida = path.join(raiz, 'dist');
const requeridos = ['index.html', 'server.js', 'pages', 'css', 'js', 'package.json'];

for (const nombre of requeridos) {
  if (!fs.existsSync(path.join(raiz, nombre))) {
    throw new Error(`Falta el recurso requerido: ${nombre}`);
  }
}

fs.rmSync(salida, { recursive: true, force: true });
fs.mkdirSync(salida, { recursive: true });

for (const nombre of ['index.html', 'pages', 'css', 'js', 'data', 'public']) {
  if (fs.existsSync(path.join(raiz, nombre))) {
    fs.cpSync(path.join(raiz, nombre), path.join(salida, nombre), { recursive: true });
  }
}

const archivosPrincipales = fs.readdirSync(raiz)
  .filter((nombre) => nombre.endsWith('.html') || nombre.endsWith('.json'))
  .map((nombre) => path.join(raiz, nombre));

for (const archivo of archivosPrincipales) {
  fs.copyFileSync(archivo, path.join(salida, path.basename(archivo)));
}

console.log(`Build listo: ${salida}`);
