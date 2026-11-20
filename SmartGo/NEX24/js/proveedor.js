/**
 * NEX24 — Perfil público del proveedor (/proveedor?id=XXX)
 * Muestra la ficha del productor y todo su catálogo para comerciantes.
 */
(function () {
  'use strict';

  const host = document.querySelector('#supplierPage');
  if (!host) return;

  const id = new URLSearchParams(window.location.search).get('id') || '';

  const esc = (valor) => String(valor ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  const iniciales = (nombre) => {
    const palabras = String(nombre || '').trim().split(/\s+/)
      .filter((p) => p && !/^(de|del|la|el|los|las|y)$/i.test(p));
    if (!palabras.length) return 'NQ';
    if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
  };

  const color = (clave) => {
    let hash = 0;
    for (const c of String(clave || '')) hash = (hash * 31 + c.charCodeAt(0)) | 0;
    return Math.abs(hash) % 6;
  };

  const money = (valor) => {
    const n = Number(valor);
    return Number.isFinite(n) ? `$${n.toFixed(2)}` : '—';
  };

  const icon = (name, size = 14) => {
    if (typeof window.createLucideIcon === 'function') return window.createLucideIcon(name, { size });
    return '';
  };

  function state(mensaje, titulo) {
    host.innerHTML = `
      <section class="nex-supplier-empty">
        <span class="nex-sup-avatar nex-sup-avatar-lg c1" aria-hidden="true">NQ</span>
        <h1>${esc(titulo || 'Proveedor no encontrado')}</h1>
        <p>${esc(mensaje)}</p>
        <a class="nex-btn nex-btn-primary" href="/tienda">Volver al catálogo</a>
      </section>
    `;
  }

  async function init() {
    if (!id) {
      state('Abre este enlace desde la ficha de un producto o proveedor en NEX24.', 'Falta el proveedor');
      return;
    }

    let catalogo;
    try {
      catalogo = await fetchUnifiedCatalog();
    } catch (_error) {
      state('No pudimos cargar el catálogo en este momento. Intenta de nuevo.', 'Sin conexión');
      return;
    }

    const productores = Array.isArray(catalogo.producers) ? catalogo.producers : [];
    const prod = productores.find((p) => String(p.id) === String(id));
    if (!prod) {
      state('El proveedor que buscas ya no está disponible en el catálogo.', 'Proveedor no encontrado');
      return;
    }

    const nombre = prod.business_name || prod.nombre || 'Proveedor local';
    const avatarColor = color(prod.id || nombre);
    const inicialesTexto = iniciales(nombre);
    // Usamos los productos normalizados por app.js para que "+ Cotizar" funcione.
    const productos = (catalogo.products || []).filter((p) => String(p.productorId) === String(id));
    const zona = prod.zona_durango || prod.zone || 'Durango';
    const capacidad = prod.capacidad_semanal || prod.capacity || 'Bajo pedido';
    const rutas = Array.isArray(prod.rutas_entrega) ? prod.rutas_entrega : ['Centro'];
    const telefono = String(prod.whatsapp || prod.phone || '').replace(/\D/g, '');
    const waUrl = telefono
      ? `https://wa.me/${telefono}?text=${encodeURIComponent('Hola ' + nombre + ', te contacto desde NEX24 para conocer tu catálogo de abastos.')}`
      : '';
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zona + ', Durango, Mexico')}`;
    const categoria = prod.categoria || 'general';

    host.innerHTML = `
      <a href="/tienda" class="nex-supplier-back">${icon('arrow-left', 13)} Volver al catálogo</a>

      <section class="nex-profile-hero">
        <span class="nex-sup-avatar nex-profile-avatar c${avatarColor}" aria-hidden="true">${inicialesTexto}</span>
        <div class="nex-profile-hero-main">
          <div class="nex-profile-badges">
            ${prod.verificado !== false ? '<span class="nex-badge nex-badge-verified">Proveedor verificado</span>' : '<span class="nex-badge">Proveedor local</span>'}
            <span class="nex-badge nex-badge-lime">${esc(categoria)}</span>
            ${prod.es_supabase ? '<span class="nex-supplier-new">Nuevo local</span>' : ''}
          </div>
          <h1>${esc(nombre)}</h1>
          <p class="nex-profile-tagline">Proveedor local de Durango · Origen DGO</p>
          <p class="nex-profile-desc">${esc(prod.descripcion || prod.business_description || 'Productor local registrado en el catálogo NEX24.')}</p>
          <div class="nex-profile-actions">
            ${waUrl ? `<a class="nex-btn nex-btn-primary" href="${waUrl}" target="_blank" rel="noopener" style="background:#1F9D55;color:#fff;border-color:#1F9D55;">${icon('message-circle', 14)} Hablar con el proveedor</a>` : ''}
            <a class="nex-btn nex-btn-secondary" href="${mapsUrl}" target="_blank" rel="noopener">${icon('map-pin', 14)} Ver zona en mapa</a>
            <a class="nex-btn nex-btn-outline" href="/mapa">${icon('map', 14)} Mapa NEX24</a>
          </div>
        </div>
      </section>

      <section class="nex-profile-stats" aria-label="Datos del proveedor">
        <div>${icon('map-pin', 16)}<span><small>Zona de operación</small><strong>${esc(zona)}</strong></span></div>
        <div>${icon('package', 16)}<span><small>Capacidad semanal</small><strong>${esc(capacidad)}</strong></span></div>
        <div>${icon('truck', 16)}<span><small>Rutas de entrega</small><strong>${esc(rutas.join(', '))}</strong></span></div>
        <div>${icon('phone', 16)}<span><small>Contacto</small><strong>${esc(prod.whatsapp || prod.phone || 'NEX24')}</strong></span></div>
      </section>

      <section class="nex-profile-catalog">
        <div class="nex-profile-catalog-head">
          <div>
            <span class="nex-section-tag">CATÁLOGO DEL PROVEEDOR</span>
            <h2>Más productos de ${esc(nombre)}</h2>
          </div>
          <span class="nex-profile-count">${productos.length} ${productos.length === 1 ? 'producto' : 'productos'}</span>
        </div>

        ${productos.length ? `
          <div class="nex-profile-grid">
            ${productos.map((producto) => {
              const pid = producto.id;
              const precioM = money(producto.precio_mayoreo);
              const precioR = money(producto.precio_menudeo);
              const waProducto = telefono
                ? `https://wa.me/${telefono}?text=${encodeURIComponent('Hola ' + nombre + ', me interesa ' + producto.nombre + ' de tu catálogo en NEX24.')}`
                : '';
              const imagenHtml = producto.imagen
                ? `<div class="nex-product-image nex-profile-product-image"><span class="nex-product-image-fallback" aria-hidden="true">${icon('package', 22)}</span><img src="${esc(producto.imagen)}" alt="Fotografía de ${esc(producto.nombre)}" loading="lazy" onerror="this.style.display='none'"></div>`
                : `<div class="nex-product-image nex-profile-product-image nex-product-image-vacio" aria-hidden="true"><span class="nex-product-image-fallback">${icon('package', 22)}</span></div>`;
              return `
                <article class="nex-profile-product">
                  ${imagenHtml}
                  <div class="nex-profile-product-top">
                    <span class="nex-market-icon" aria-hidden="true">${icon('package', 22)}</span>
                    <span class="nex-badge nex-badge-lime">${esc(producto.categoria || categoria)}</span>
                  </div>
                  <h3>${esc(producto.nombre)}</h3>
                  <p>${esc(producto.descripcion || 'Producto local disponible para abastecimiento.')}</p>
                  <div class="nex-profile-prices">
                    <span><small>Menudeo</small><b>${precioR}</b></span>
                    <span><small>Mayoreo</small><b>${precioM}</b></span>
                  </div>
                  <div class="nex-profile-product-actions">
                    <button type="button" class="nex-btn nex-btn-primary nex-btn-sm" onclick="addToCart('${esc(pid)}')">+ Cotizar</button>
                    ${waProducto ? `<a class="nex-btn nex-btn-outline nex-btn-sm" href="${waProducto}" target="_blank" rel="noopener">${icon('message-circle', 13)} Pedir info</a>` : ''}
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        ` : '<p class="nex-profile-empty">Este proveedor aún no tiene productos publicados. Puedes contactarlo directamente para conocer su catálogo.</p>'}
      </section>
    `;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
