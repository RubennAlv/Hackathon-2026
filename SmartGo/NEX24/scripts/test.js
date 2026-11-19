import assert from 'node:assert/strict';

import {
  CATEGORIAS,
  UBICACION_DEFAULT,
  buscarProductores,
  distanciaKm,
  productores,
} from '../matcher.js';
import { DEMOS, analizarImagen } from '../vision.js';

process.env.MOCK = 'true';

let total = 0;
let fallos = 0;

function prueba(nombre, fn) {
  try {
    fn();
    total++;
    console.log(`  ✓ ${nombre}`);
  } catch (error) {
    fallos++;
    console.error(`  ✗ ${nombre}`);
    console.error(`    ${error.message}`);
  }
}

console.log('\nCatálogo y utilidades');
prueba('hay 14 productores', () => {
  assert.equal(productores.length, 14);
});
prueba('hay 14 categorías únicas', () => {
  assert.equal(CATEGORIAS.length, 14);
  assert.ok(CATEGORIAS.includes('cafe'));
});
prueba('distanciaKm de un punto a sí mismo es 0', () => {
  assert.equal(distanciaKm(UBICACION_DEFAULT, UBICACION_DEFAULT), 0);
});
prueba('distanciaKm entre dos puntos es positiva', () => {
  const d = distanciaKm(UBICACION_DEFAULT, { lat: 24.8725, lng: -105.0731 });
  assert.ok(d > 0);
});

console.log('\nMatching con el catálogo');

const casos = [
  {
    nombre: 'café Nescafé → match exacto',
    vision: {
      producto: 'Café instantáneo',
      categoria: 'cafe',
      marca: 'Nescafé',
      keywords: ['cafe', 'instantaneo', 'nescafe'],
      confianza: 0.92,
    },
    esperado: 'exacto',
  },
  {
    nombre: 'miel → match exacto',
    vision: {
      producto: 'Miel de abeja',
      categoria: 'miel',
      marca: 'La Sierra',
      keywords: ['miel', 'abeja', 'natural'],
      confianza: 0.9,
    },
    esperado: 'exacto',
  },
  {
    nombre: 'galletas ambiguas → no queda vacío',
    vision: {
      producto: 'Galletas de animalitos',
      categoria: 'dulces',
      marca: 'Gamesa',
      keywords: ['galletas', 'dulce'],
      confianza: 0.5,
    },
    esperado: null,
  },
  {
    nombre: 'algo sin relación → fallback con 2 sugerencias',
    vision: {
      producto: 'Llanta para auto',
      categoria: 'automotriz',
      marca: 'Michelin',
      keywords: ['llanta', 'auto', 'vehiculo'],
      confianza: 0.8,
    },
    esperado: 'fallback',
  },
];

for (const caso of casos) {
  prueba(caso.nombre, () => {
    const match = buscarProductores(caso.vision, null);
    assert.ok(match.resultados.length > 0, 'los resultados no deben quedar vacíos');
    assert.ok(match.resultados.length <= 3);
    assert.ok(['exacto', 'categoria', 'fallback'].includes(match.match_type));
    if (caso.esperado) assert.equal(match.match_type, caso.esperado);
    for (const r of match.resultados) {
      assert.equal(typeof r.distancia_km, 'number');
      assert.ok(Number.isFinite(r.distancia_km));
    }
  });
}

prueba('el fallback devuelve máximo 2 sugerencias', () => {
  const match = buscarProductores(
    { producto: 'Llanta', categoria: 'automotriz', keywords: ['llanta'] },
    null,
    5
  );
  assert.equal(match.match_type, 'fallback');
  assert.equal(match.resultados.length, 2);
});

prueba('respeta el límite de resultados', () => {
  const match = buscarProductores(
    { producto: 'Café', categoria: 'cafe', keywords: ['cafe'] },
    null,
    1
  );
  assert.ok(match.resultados.length <= 1);
});

console.log('\nModo mock de visión');

await (async () => {
  for (const demo of DEMOS) {
    const { deteccion } = await analizarImagen(
      { buffer: Buffer.from('imagen-falsa'), mimeType: 'image/jpeg' },
      { demo }
    );
    prueba(`demo=${demo} usa una categoría del catálogo`, () => {
      assert.ok(CATEGORIAS.includes(deteccion.categoria), `categoría inválida: ${deteccion.categoria}`);
    });
  }
})();

await (async () => {
  const { modo, deteccion } = await analizarImagen(
    { buffer: Buffer.from('imagen-falsa'), mimeType: 'image/jpeg' },
    { demo: 'miel' }
  );
  prueba('demo=miel devuelve modo mock y categoría miel', () => {
    assert.equal(modo, 'mock');
    assert.equal(deteccion.categoria, 'miel');
  });
})();

await (async () => {
  const { modo, deteccion } = await analizarImagen(
    { buffer: Buffer.from('imagen-falsa'), mimeType: 'image/png' }
  );
  prueba('sin demo usa café por defecto', () => {
    assert.equal(modo, 'mock');
    assert.equal(deteccion.categoria, 'cafe');
  });
})();

console.log(`\n${total} pruebas OK, ${fallos} fallos`);
if (fallos > 0) process.exit(1);
