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
prueba('hay al menos 30 productores', () => {
  assert.ok(productores.length >= 30, `solo ${productores.length} productores`);
});
prueba('hay al menos 19 categorías únicas', () => {
  assert.ok(CATEGORIAS.length >= 19, `solo ${CATEGORIAS.length} categorías`);
  for (const cat of ['cafe', 'bebidas', 'botana', 'dulces', 'lacteos', 'huevos', 'abarrotes', 'tortillas']) {
    assert.ok(CATEGORIAS.includes(cat), `falta la categoría ${cat}`);
  }
});
prueba('todos los productores tienen el esquema completo', () => {
  const campos = [
    'id', 'nombre', 'categoria', 'productos', 'descripcion', 'keywords_ia',
    'precio_menudeo', 'precio_mayoreo', 'unidad', 'capacidad_semanal',
    'zona_durango', 'lat', 'lng', 'whatsapp', 'rutas_entrega', 'verificado', 'destacado',
  ];
  for (const p of productores) {
    for (const campo of campos) assert.ok(campo in p, `${p.id} falta ${campo}`);
    assert.ok(Array.isArray(p.productos) && p.productos.length > 0, `${p.id} sin productos`);
    assert.ok(Array.isArray(p.keywords_ia) && p.keywords_ia.length > 0, `${p.id} sin keywords`);
    assert.ok(Number.isFinite(p.lat) && Number.isFinite(p.lng), `${p.id} sin coordenadas`);
  }
});
prueba('los ids son únicos', () => {
  const ids = productores.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
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
    nombre: 'agua purificada → match exacto en bebidas',
    vision: {
      producto: 'Agua purificada',
      categoria: 'bebidas',
      marca: 'El Manantial',
      keywords: ['agua', 'purificada'],
      confianza: 0.91,
    },
    esperado: 'exacto',
  },
  {
    nombre: 'refresco de cola → match exacto',
    vision: {
      producto: 'Refresco de cola',
      categoria: 'bebidas',
      marca: 'Coca Cola',
      keywords: ['refresco', 'coca cola'],
      confianza: 0.89,
    },
    esperado: 'exacto',
  },
  {
    nombre: 'leche entera → match exacto en lácteos',
    vision: {
      producto: 'Leche entera',
      categoria: 'lacteos',
      marca: 'Rancho El Río',
      keywords: ['leche', 'entera'],
      confianza: 0.9,
    },
    esperado: 'exacto',
  },
  {
    nombre: 'huevos frescos → match exacto',
    vision: {
      producto: 'Huevos frescos',
      categoria: 'huevos',
      marca: 'La Campana',
      keywords: ['huevo', 'huevos'],
      confianza: 0.9,
    },
    esperado: 'exacto',
  },
  {
    nombre: 'papitas → match exacto en botana',
    vision: {
      producto: 'Papitas con chile',
      categoria: 'botana',
      marca: 'Sabritas',
      keywords: ['papitas', 'sabritas'],
      confianza: 0.87,
    },
    esperado: 'exacto',
  },
  {
    nombre: 'galletas → match exacto',
    vision: {
      producto: 'Galletas',
      categoria: 'panaderia',
      marca: 'Gamesa',
      keywords: ['galletas'],
      confianza: 0.86,
    },
    esperado: 'exacto',
  },
  {
    nombre: 'chocolate → match exacto en dulces',
    vision: {
      producto: 'Chocolate de leche',
      categoria: 'dulces',
      marca: 'La Flor',
      keywords: ['chocolate', 'cacao'],
      confianza: 0.9,
    },
    esperado: 'exacto',
  },
  {
    nombre: 'tortilla de maíz → match exacto',
    vision: {
      producto: 'Tortillas de maíz',
      categoria: 'tortillas',
      marca: 'El Maíz de Oro',
      keywords: ['tortilla', 'maiz'],
      confianza: 0.88,
    },
    esperado: 'exacto',
  },
  {
    nombre: 'jugo de naranja → match exacto',
    vision: {
      producto: 'Jugo de naranja',
      categoria: 'bebidas',
      marca: 'Del Valle',
      keywords: ['jugo', 'naranja'],
      confianza: 0.88,
    },
    esperado: 'exacto',
  },
  {
    nombre: 'aceite → match exacto en abarrotes',
    vision: {
      producto: 'Aceite de girasol',
      categoria: 'abarrotes',
      marca: 'El Molino',
      keywords: ['aceite', 'girasol'],
      confianza: 0.85,
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
    assert.ok(match.resultados.length <= 5);
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

prueba('muchos productores de una categoría aparecen juntos', () => {
  const match = buscarProductores(
    { producto: 'Agua purificada', categoria: 'bebidas', keywords: ['agua'] },
    null,
    5
  );
  assert.ok(match.resultados.length >= 3, `solo ${match.resultados.length} resultados`);
  assert.ok(match.resultados.every((r) => r.categoria === 'bebidas'));
});

prueba('por defecto se muestran hasta 5 productores', () => {
  const match = buscarProductores(
    { producto: 'Agua purificada', categoria: 'bebidas', keywords: ['agua'] },
    null
  );
  assert.ok(match.resultados.length > 3, `solo ${match.resultados.length} resultados`);
});

prueba('detecciones demo cubren productos básicos', () => {
  for (const demo of ['agua', 'refresco', 'leche', 'huevo', 'papitas', 'galletas', 'chocolate', 'tortilla']) {
    assert.ok(DEMOS.includes(demo), `falta la demo ${demo}`);
  }
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
    prueba(`demo=${demo} encuentra productor`, () => {
      const match = buscarProductores(deteccion, null);
      assert.notEqual(match.match_type, 'fallback', `demo ${demo} cayó en fallback`);
      assert.ok(match.resultados.length > 0);
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
