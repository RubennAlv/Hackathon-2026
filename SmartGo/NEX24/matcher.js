import fs from 'node:fs';

export const productores = JSON.parse(
  fs.readFileSync(new URL('./productores.json', import.meta.url), 'utf-8')
);

export const CATEGORIAS = [...new Set(productores.map((p) => p.categoria))];

// Plaza de Armas, Durango capital: ubicación por defecto si el usuario no comparte la suya
export const UBICACION_DEFAULT = { lat: 24.0277, lng: -104.6532 };

const norm = (s = '') =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

export function distanciaKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function terminosDeVision(vision) {
  const crudos = [
    vision.producto,
    vision.marca,
    ...(Array.isArray(vision.keywords) ? vision.keywords : []),
  ].filter(Boolean);
  const terminos = new Set();
  for (const c of crudos) {
    const n = norm(c);
    if (!n) continue;
    terminos.add(n);
    n.split(/\s+/).filter((w) => w.length > 2).forEach((w) => terminos.add(w));
  }
  return [...terminos];
}

function puntuar(p, vision, terminos) {
  let score = 0;
  const razones = [];

  if (vision.categoria && norm(vision.categoria) === norm(p.categoria)) {
    score += 3;
    razones.push(`misma categoría (${p.categoria})`);
  }

  const kws = p.keywords_ia.map(norm);
  const coincidencias = terminos.filter((t) =>
    kws.some((k) => k === t || (t.length > 3 && (k.includes(t) || t.includes(k))))
  );
  if (coincidencias.length) {
    score += Math.min(coincidencias.length, 4);
    razones.push(`coincide con: ${coincidencias.slice(0, 3).join(', ')}`);
  }

  return { score, razon: razones.join(' · ') };
}

function formatear(p, score, razon, origen) {
  const d = distanciaKm(origen, { lat: p.lat, lng: p.lng });
  return {
    id: p.id,
    nombre: p.nombre,
    categoria: p.categoria,
    productos: p.productos,
    descripcion: p.descripcion,
    precio_menudeo: p.precio_menudeo,
    precio_mayoreo: p.precio_mayoreo,
    unidad: p.unidad,
    zona_durango: p.zona_durango,
    lat: p.lat,
    lng: p.lng,
    whatsapp: p.whatsapp,
    verificado: p.verificado,
    distancia_km: Math.round(d * 10) / 10,
    score,
    razon,
  };
}

/**
 * Cruza la detección de visión con el catálogo.
 * match_type: "exacto" (hay coincidencia fuerte), "categoria" (solo categoría/débil)
 * o "fallback" (nada coincide: sugerimos destacados cercanos para que la demo nunca falle).
 */
export function buscarProductores(vision, ubicacion, limite = 3) {
  const origen =
    ubicacion && Number.isFinite(ubicacion.lat) && Number.isFinite(ubicacion.lng)
      ? ubicacion
      : UBICACION_DEFAULT;

  const terminos = terminosDeVision(vision || {});
  const puntuados = productores
    .map((p) => ({ p, ...puntuar(p, vision || {}, terminos) }))
    .filter((x) => x.score > 0)
    .map((x) => ({ ...x, d: distanciaKm(origen, { lat: x.p.lat, lng: x.p.lng }) }))
    .sort((a, b) => b.score - a.score || a.d - b.d);

  if (puntuados.length) {
    const top = puntuados[0].score;
    // Con un match de categoría (>= 3) descartamos coincidencias débiles de otras categorías
    const relevantes = top >= 3 ? puntuados.filter((x) => x.score >= 3) : puntuados;
    return {
      match_type: top >= 4 ? 'exacto' : 'categoria',
      resultados: relevantes
        .slice(0, limite)
        .map((x) => formatear(x.p, x.score, x.razon, origen)),
    };
  }

  // Fallback: destacados primero, luego los más cercanos
  const fallback = productores
    .map((p) => ({ p, d: distanciaKm(origen, { lat: p.lat, lng: p.lng }) }))
    .sort((a, b) => Number(b.p.destacado) - Number(a.p.destacado) || a.d - b.d)
    .slice(0, Math.min(limite, 2))
    .map((x) => formatear(x.p, 0, 'sugerencia local destacada', origen));

  return { match_type: 'fallback', resultados: fallback };
}
