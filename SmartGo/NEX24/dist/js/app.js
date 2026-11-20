/**
 * NEX24 — Lógica de Marketplace Inteligente, Abastecimiento B2B/B2C y Dashboard
 */

// Iconos temáticos por categoría
const CATEGORY_ICONS = {
  cafe: '☕', queso: '🧀', miel: '🍯', mezcal: '🥃', panaderia: '🥖', pan: '🥖',
  salsas: '🌶️', cuero: '👜', cosmetica: '🧴', dulces: '🍬', botana: '🥨',
  bebidas: '🥤', carnes: '🥩', artesania: '🧶', tortillas: '🫓'
};

const money = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : '—';
};

// Estado global de productos y carrito
let allProducts = [];
let allProducers = [];
let cart = JSON.parse(localStorage.getItem('nex24-cart') || '[]');

function saveCart() {
  localStorage.setItem('nex24-cart', JSON.stringify(cart));
}

// Carga del catálogo unificado (Productores locales + Supabase si existe)
async function fetchUnifiedCatalog() {
  if (allProducts.length && allProducers.length) {
    return { products: allProducts, producers: allProducers };
  }

  try {
    const res = await fetch('/api/catalogo');
    const data = await res.json();
    const producersList = Array.isArray(data.productores) ? data.productores : [];

    allProducers = producersList;
    allProducts = [];

    producersList.forEach((p) => {
      const items = Array.isArray(p.productos) ? p.productos : [];
      items.forEach((prodName, idx) => {
        allProducts.push({
          id: `${p.id}_${idx}`,
          nombre: prodName,
          productorId: p.id,
          productorNombre: p.nombre,
          categoria: (p.categoria || 'general').toLowerCase(),
          precio_menudeo: Number(p.precio_menudeo) || 85,
          precio_mayoreo: Number(p.precio_mayoreo) || 68,
          unidad: p.unidad || 'unidad',
          capacidad: p.capacidad_semanal || 'Bajo pedido',
          zona: p.zona_durango || 'Durango',
          whatsapp: p.whatsapp || '',
          rutas: Array.isArray(p.rutas_entrega) ? p.rutas_entrega : ['Centro'],
          verificado: p.verificado !== false,
          destacado: Boolean(p.destacado),
          descripcion: p.descripcion || 'Producto elaborado por productores de Durango.',
          lat: p.lat,
          lng: p.lng
        });
      });
    });

    return { products: allProducts, producers: allProducers };
  } catch (err) {
    console.warn('[catalogo] Falló /api/catalogo, intentando /api/productores:', err);
    try {
      const res = await fetch('/api/productores');
      const producersList = await res.json();
      allProducers = producersList;
      allProducts = [];
      producersList.forEach((p) => {
        (p.productos || []).forEach((prodName, idx) => {
          allProducts.push({
            id: `${p.id}_${idx}`,
            nombre: prodName,
            productorId: p.id,
            productorNombre: p.nombre,
            categoria: (p.categoria || 'general').toLowerCase(),
            precio_menudeo: Number(p.precio_menudeo) || 85,
            precio_mayoreo: Number(p.precio_mayoreo) || 68,
            unidad: p.unidad || 'unidad',
            capacidad: p.capacidad_semanal || 'Bajo pedido',
            zona: p.zona_durango || 'Durango',
            whatsapp: p.whatsapp || '',
            rutas: p.rutas_entrega || ['Centro'],
            verificado: p.verificado !== false,
            destacado: Boolean(p.destacado),
            descripcion: p.descripcion || '',
            lat: p.lat,
            lng: p.lng
          });
        });
      });
      return { products: allProducts, producers: allProducers };
    } catch (_e) {
      return { products: [], producers: [] };
    }
  }
}

// -----------------------------------------------------------------------------
// MARKETPLACE INTELIGENTE (/tienda)
// -----------------------------------------------------------------------------
let marketFilters = {
  search: '',
  category: '',
  mode: 'todos', // 'todos' | 'b2c' | 'b2b'
  zone: '',
  sort: 'destacados'
};

async function renderStore() {
  const grid = document.querySelector('#storeItems');
  if (!grid) return;

  grid.innerHTML = Array.from({ length: 6 }).map(() => `
    <article class="nex-market-card nex-skeleton-card" style="pointer-events:none;opacity:0.85;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <div class="nex-skeleton" style="height:14px;width:75px;"></div>
        <div class="nex-skeleton" style="height:14px;width:60px;"></div>
      </div>
      <div class="nex-skeleton" style="height:22px;width:80%;margin-bottom:8px;"></div>
      <div class="nex-skeleton" style="height:14px;width:50%;margin-bottom:16px;"></div>
      <div class="nex-skeleton" style="height:48px;width:100%;margin-bottom:14px;"></div>
      <div class="nex-skeleton" style="height:36px;width:100%;"></div>
    </article>
  `).join('');

  const { products } = await fetchUnifiedCatalog();
  if (!products.length) {
    grid.innerHTML = `
      <div class="nex-empty-state" style="grid-column:1/-1;padding:48px 20px;">
        <span class="nex-empty-icon" style="display:block;margin-bottom:10px;">⚠️</span>
        <div class="nex-empty-title">No fue posible cargar el catálogo comercial</div>
        <p class="nex-empty-desc">Revisa tu conexión a Internet o intenta nuevamente.</p>
        <button type="button" class="nex-btn nex-btn-primary nex-btn-sm" onclick="renderStore()">Reintentar Carga</button>
      </div>
    `;
    return;
  }

  // Leer parámetros iniciales de la URL (ej. /tienda?q=cafe&categoria=cafe)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('q')) marketFilters.search = urlParams.get('q');
  if (urlParams.get('categoria')) marketFilters.category = urlParams.get('categoria').toLowerCase();
  if (urlParams.get('tipo') === 'mayoreo') marketFilters.mode = 'b2b';

  // Sincronizar inputs
  const searchInput = document.querySelector('#marketSearchInput');
  if (searchInput && marketFilters.search) searchInput.value = marketFilters.search;

  const zoneSelect = document.querySelector('#marketZoneSelect');
  if (zoneSelect && marketFilters.zone) zoneSelect.value = marketFilters.zone;

  setupMarketControls();
  setupB2BControls();
  applyMarketFiltersAndRender();
  renderCart();
}

function setupB2BControls() {
  const btnB2C = document.querySelector('#btnModeB2C');
  const btnB2B = document.querySelector('#btnModeB2B');

  if (btnB2C && btnB2B && !btnB2C.dataset.initialized) {
    btnB2C.dataset.initialized = 'true';
    btnB2B.dataset.initialized = 'true';

    btnB2C.addEventListener('click', () => {
      btnB2C.classList.add('active');
      btnB2C.setAttribute('aria-checked', 'true');
      btnB2B.classList.remove('b2b-active');
      btnB2B.setAttribute('aria-checked', 'false');
      marketFilters.mode = 'b2c';
      document.querySelectorAll('[data-filter-mode]').forEach((b) => {
        b.classList.toggle('active', b.dataset.filterMode === 'b2c');
      });
      applyMarketFiltersAndRender();
    });

    btnB2B.addEventListener('click', () => {
      btnB2B.classList.add('b2b-active');
      btnB2B.setAttribute('aria-checked', 'true');
      btnB2C.classList.remove('active');
      btnB2C.setAttribute('aria-checked', 'false');
      marketFilters.mode = 'b2b';
      document.querySelectorAll('[data-filter-mode]').forEach((b) => {
        b.classList.toggle('active', b.dataset.filterMode === 'b2b');
      });
      applyMarketFiltersAndRender();
    });
  }

  // Modales de Lista de Abastecimiento e Historial
  document.querySelector('#openSupplyListBtn')?.addEventListener('click', () => {
    renderSupplyListModal();
    const modal = document.querySelector('#supplyListModal');
    if (modal) modal.hidden = false;
  });

  document.querySelector('#closeSupplyModal')?.addEventListener('click', () => {
    const modal = document.querySelector('#supplyListModal');
    if (modal) modal.hidden = true;
  });

  document.querySelector('#openQuotesHistoryBtn')?.addEventListener('click', () => {
    renderQuotesHistoryModal();
    const modal = document.querySelector('#quotesHistoryModal');
    if (modal) modal.hidden = false;
  });

  document.querySelector('#closeHistoryModal')?.addEventListener('click', () => {
    const modal = document.querySelector('#quotesHistoryModal');
    if (modal) modal.hidden = true;
  });

  document.querySelector('#clearSupplyListBtn')?.addEventListener('click', () => {
    localStorage.removeItem('nex24-b2b-supply-list');
    renderSupplyListModal();
  });

  document.querySelector('#addAllSupplyToCartBtn')?.addEventListener('click', () => {
    addAllSupplyToCart();
  });
}

function setupMarketControls() {
  const searchInput = document.querySelector('#marketSearchInput');
  if (searchInput && !searchInput.dataset.initialized) {
    searchInput.dataset.initialized = 'true';
    let timeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        marketFilters.search = searchInput.value.trim();
        applyMarketFiltersAndRender();
      }, 200);
    });
  }

  // Modo comercial (Todos / B2C / B2B)
  document.querySelectorAll('[data-filter-mode]').forEach((btn) => {
    if (!btn.dataset.initialized) {
      btn.dataset.initialized = 'true';
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-mode]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        marketFilters.mode = btn.dataset.filterMode;
        applyMarketFiltersAndRender();
      });
    }
  });

  // Categorías
  document.querySelectorAll('#categoryChips [data-category]').forEach((btn) => {
    if (!btn.dataset.initialized) {
      btn.dataset.initialized = 'true';
      btn.addEventListener('click', () => {
        document.querySelectorAll('#categoryChips [data-category]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        marketFilters.category = btn.dataset.category.toLowerCase();
        applyMarketFiltersAndRender();
      });
    }
  });

  // Zona
  const zoneSelect = document.querySelector('#marketZoneSelect');
  if (zoneSelect && !zoneSelect.dataset.initialized) {
    zoneSelect.dataset.initialized = 'true';
    zoneSelect.addEventListener('change', () => {
      marketFilters.zone = zoneSelect.value;
      applyMarketFiltersAndRender();
    });
  }

  // Orden
  const sortSelect = document.querySelector('#marketSortSelect');
  if (sortSelect && !sortSelect.dataset.initialized) {
    sortSelect.dataset.initialized = 'true';
    sortSelect.addEventListener('change', () => {
      marketFilters.sort = sortSelect.value;
      applyMarketFiltersAndRender();
    });
  }
}

function applyMarketFiltersAndRender() {
  const grid = document.querySelector('#storeItems');
  const summary = document.querySelector('#stockSummary');
  if (!grid) return;

  const q = marketFilters.search.toLowerCase();
  const cat = marketFilters.category;
  const mode = marketFilters.mode;
  const zone = marketFilters.zone;

  let filtered = allProducts.filter((item) => {
    // Búsqueda textual
    if (q) {
      const match = [
        item.nombre,
        item.productorNombre,
        item.categoria,
        item.zona,
        item.descripcion
      ].some((val) => String(val || '').toLowerCase().includes(q));
      if (!match) return false;
    }

    // Categoría
    if (cat && item.categoria !== cat) return false;

    // Zona
    if (zone && item.zona !== zone) return false;

    return true;
  });

  // Ordenamiento
  filtered.sort((a, b) => {
    if (marketFilters.sort === 'precio-asc') return a.precio_menudeo - b.precio_menudeo;
    if (marketFilters.sort === 'precio-desc') return b.precio_menudeo - a.precio_menudeo;
    if (marketFilters.sort === 'nombre') return a.nombre.localeCompare(b.nombre);
    // destacados
    return Number(b.destacado) - Number(a.destacado);
  });

  if (summary) {
    summary.textContent = `${filtered.length} producto${filtered.length === 1 ? '' : 's'} disponible${filtered.length === 1 ? '' : 's'} en Durango`;
  }

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="nex-empty-state" style="grid-column:1/-1;">
        <span class="nex-empty-icon">🔎</span>
        <h3 class="nex-empty-title">Sin coincidencias para los filtros actuales</h3>
        <p class="nex-empty-desc">Prueba limpiando la búsqueda o seleccionando otra categoría.</p>
        <button type="button" class="nex-btn nex-btn-secondary" onclick="resetMarketFilters()">Restablecer filtros</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((item) => {
    const icon = CATEGORY_ICONS[item.categoria] || '🛒';
    const savings = Math.max(0, item.precio_menudeo - item.precio_mayoreo);
    const savingsPct = Math.round((savings / item.precio_menudeo) * 100);

    return `
      <article class="nex-market-card">
        <div class="nex-market-card-header">
          <div class="nex-market-icon" aria-hidden="true">${icon}</div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
              <span class="nex-badge nex-badge-b2c">Menudeo</span>
              <span class="nex-badge nex-badge-b2b">Mayoreo (-${savingsPct}%)</span>
              ${item.verificado ? '<span class="nex-badge nex-badge-verified">✓ Verificado</span>' : ''}
            </div>
            <h3 class="nex-market-card-title">${item.nombre}</h3>
            <span class="nex-market-producer">🌱 ${item.productorNombre} · 📍 ${item.zona}</span>
          </div>
        </div>

        <p class="nex-market-card-desc">${item.descripcion}</p>

        <div class="nex-market-specs">
          <div>Capacidad semanal: <span>${item.capacidad}</span></div>
          <div>Entrega: <span>${item.rutas[0] || 'Centro'}</span></div>
        </div>

        <div class="nex-market-pricing-box">
          <div>
            <span class="price-unit">Consumidor (${item.unidad})</span>
            <b>${money(item.precio_menudeo)}</b>
          </div>
          <div class="b2b-price">
            <span class="price-unit">Mayoreo comercial</span>
            <b>${money(item.precio_mayoreo)}</b>
          </div>
        </div>

        <div class="nex-market-card-actions">
          <button type="button" class="nex-btn nex-btn-primary nex-btn-sm" onclick="addToCart('${item.id}')">
            ${mode === 'b2b' ? '+ Cotizar mayoreo' : '+ Al pedido'}
          </button>
          <button type="button" class="nex-btn nex-btn-secondary nex-btn-sm" onclick="addToSupplyList('${item.id}')" title="Guardar en lista recurrente">
            📋 Abasto
          </button>
          <button type="button" class="nex-btn nex-btn-outline nex-btn-sm" onclick="openProductDetail('${item.id}')" title="Ver ficha técnica">
            Ficha ↗
          </button>
        </div>
      </article>
    `;
  }).join('');
}

window.resetMarketFilters = function() {
  marketFilters = { search: '', category: '', mode: 'todos', zone: '', sort: 'destacados' };
  const searchInput = document.querySelector('#marketSearchInput');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('#categoryChips [data-category]').forEach((b) => b.classList.toggle('active', !b.dataset.category));
  document.querySelectorAll('[data-filter-mode]').forEach((b) => b.classList.toggle('active', b.dataset.filterMode === 'todos'));
  applyMarketFiltersAndRender();
};

// -----------------------------------------------------------------------------
// GESTIÓN B2B: LISTA DE ABASTECIMIENTO RECURRENTE E HISTORIAL DE COTIZACIONES
// -----------------------------------------------------------------------------
function getSupplyList() {
  return JSON.parse(localStorage.getItem('nex24-b2b-supply-list') || '[]');
}

function saveSupplyList(list) {
  localStorage.setItem('nex24-b2b-supply-list', JSON.stringify(list));
}

window.addToSupplyList = function(productId) {
  const item = allProducts.find((p) => p.id === productId);
  if (!item) return;

  const list = getSupplyList();
  if (!list.some((i) => i.id === productId)) {
    list.push({
      id: item.id,
      nombre: item.nombre,
      productorNombre: item.productorNombre,
      precio_mayoreo: item.precio_mayoreo,
      unidad: item.unidad,
      zona: item.zona
    });
    saveSupplyList(list);
  }

  const msg = document.querySelector('#purchaseMessage');
  if (msg) {
    msg.textContent = `"${item.nombre}" se guardó en tu Lista de Abastecimiento recurrente.`;
    msg.hidden = false;
    setTimeout(() => { msg.hidden = true; }, 3500);
  }
  window.nexToast?.success(`"${item.nombre}" se guardó en tu lista de abasto.`, 'Lista de Abastecimiento');
};

window.removeFromSupplyList = function(productId) {
  let list = getSupplyList();
  list = list.filter((i) => i.id !== productId);
  saveSupplyList(list);
  renderSupplyListModal();
  window.nexToast?.info('Insumo eliminado de la lista.', 'Lista de Abastecimiento');
};

function renderSupplyListModal() {
  const container = document.querySelector('#supplyListContent');
  if (!container) return;
  const list = getSupplyList();

  if (!list.length) {
    container.innerHTML = `
      <div class="nex-empty-state" style="padding:28px 14px;border:none;">
        <span style="font-size:2rem;display:block;margin-bottom:6px;">📋</span>
        <strong>Aún no tienes insumos en tu lista</strong>
        <p style="font-size:12px;color:var(--nex-text-secondary);margin:6px 0 0;">
          Haz clic en "+ Lista de abasto" en cualquier producto para guardarlo aquí y cotizarlo periódicamente.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map((item) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--nex-bg);border:1px solid var(--nex-border);border-radius:var(--radius-md);">
      <div>
        <strong style="display:block;font-size:14px;">${item.nombre}</strong>
        <small style="color:var(--nex-emerald);">${item.productorNombre} · 📍 ${item.zona}</small>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-weight:700;color:var(--nex-b2b);">${money(item.precio_mayoreo)} <small style="font-size:10px;">mayoreo</small></span>
        <button type="button" class="nex-btn nex-btn-ghost nex-btn-sm" onclick="removeFromSupplyList('${item.id}')" title="Eliminar de lista" style="color:var(--nex-danger);">✕</button>
      </div>
    </div>
  `).join('');
}

function addAllSupplyToCart() {
  const list = getSupplyList();
  if (!list.length) return;

  list.forEach((item) => {
    const full = allProducts.find((p) => p.id === item.id);
    if (full) addToCart(full.id);
  });

  const modal = document.querySelector('#supplyListModal');
  if (modal) modal.hidden = true;

  const msg = document.querySelector('#purchaseMessage');
  if (msg) {
    msg.textContent = `${list.length} productos de tu lista fueron agregados a tu cotización.`;
    msg.hidden = false;
    setTimeout(() => { msg.hidden = true; }, 3500);
  }
  window.nexToast?.success(`${list.length} productos agregados a tu cotización.`, 'Abastecimiento B2B');
}

function getQuotesHistory() {
  return JSON.parse(localStorage.getItem('nex24-quotes-history') || '[]');
}

function saveQuoteRecord(record) {
  const history = getQuotesHistory();
  // Evitar duplicados por folio
  if (!history.some((q) => q.folio === record.folio)) {
    history.unshift(record);
    localStorage.setItem('nex24-quotes-history', JSON.stringify(history.slice(0, 20)));
  }
}

function renderQuotesHistoryModal() {
  const container = document.querySelector('#quotesHistoryContent');
  if (!container) return;
  const history = getQuotesHistory();

  if (!history.length) {
    container.innerHTML = `
      <div class="nex-empty-state" style="padding:28px 14px;border:none;">
        <span style="font-size:2rem;display:block;margin-bottom:6px;">📜</span>
        <strong>Sin cotizaciones previas</strong>
        <p style="font-size:12px;color:var(--nex-text-secondary);margin:6px 0 0;">
          Tus cotizaciones emitidas formalmente se guardarán aquí con folio oficial para dar seguimiento.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = history.map((q) => `
    <div style="border:1px solid var(--nex-border);border-radius:var(--radius-md);padding:14px;background:var(--nex-surface-highlight);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span class="nex-badge nex-badge-b2b">${q.folio}</span>
        <span style="font-size:11px;color:var(--nex-text-muted);">${q.date}</span>
      </div>
      <div style="font-size:13px;margin-bottom:8px;">
        <strong>${q.itemsCount} producto${q.itemsCount === 1 ? '' : 's'}:</strong> ${q.summary}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--nex-border);padding-top:8px;">
        <strong style="color:var(--nex-forest);font-size:14px;">Total: ${money(q.total)} MXN</strong>
        <button type="button" class="nex-btn nex-btn-sm nex-btn-outline" onclick="reopenQuoteByFolio('${q.folio}')">Ver detalle ↗</button>
      </div>
    </div>
  `).join('');
}

window.reopenQuoteByFolio = function(folio) {
  const history = getQuotesHistory();
  const q = history.find((x) => x.folio === folio);
  if (!q) return;

  const modalHistory = document.querySelector('#quotesHistoryModal');
  if (modalHistory) modalHistory.hidden = true;

  openQuoteSummaryModal(q.total, q.savings || 0, q.folio);
};

// -----------------------------------------------------------------------------
// DETALLE MODAL DEL PRODUCTO
// -----------------------------------------------------------------------------
window.openProductDetail = function(productId) {
  const item = allProducts.find((p) => p.id === productId);
  if (!item) return;

  const modal = document.querySelector('#productDetailModal');
  const container = document.querySelector('#modalProductContent');
  if (!modal || !container) return;

  const icon = CATEGORY_ICONS[item.categoria] || '🛒';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.zona + ', Durango, Mexico')}`;
  const whatsappUrl = item.whatsapp
    ? `https://wa.me/${item.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hola ' + item.productorNombre + ', te contacto desde NEX24 por tu producto ' + item.nombre)}`
    : '';

  const precioDistribuidor = Math.round(item.precio_mayoreo * 0.88);

  container.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:16px;">
      <div style="font-size:3rem;background:var(--nex-bg);padding:14px;border-radius:var(--radius-lg);">${icon}</div>
      <div>
        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <span class="nex-badge nex-badge-verified">✓ Productor Verificado</span>
          <span class="nex-badge nex-badge-lime">${item.categoria}</span>
        </div>
        <h2 style="margin:0 0 4px 0;font-size:1.5rem;">${item.nombre}</h2>
        <span style="font-weight:700;color:var(--nex-emerald);">${item.productorNombre}</span>
      </div>
    </div>

    <p style="color:var(--nex-text-secondary);line-height:1.6;margin-bottom:16px;">${item.descripcion}</p>

    <!-- Tabla de Precios Escalonados B2B / B2C -->
    <div>
      <span style="font-size:11px;font-weight:800;color:var(--nex-text-secondary);text-transform:uppercase;">Escala de Precios Comerciales</span>
      <table class="nex-tier-table">
        <thead>
          <tr>
            <th>Volumen de Compra</th>
            <th>Tipo de Cliente</th>
            <th>Precio Unitario</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1 a 4 ${item.unidad}</td>
            <td>Consumidor (Menudeo)</td>
            <td><strong>${money(item.precio_menudeo)}</strong></td>
          </tr>
          <tr class="active-tier">
            <td>5 a 19 ${item.unidad}</td>
            <td>Negocio / Mayoreo B2B</td>
            <td><strong>${money(item.precio_mayoreo)}</strong> <small style="color:var(--nex-emerald);">(Ahorro comercial)</small></td>
          </tr>
          <tr>
            <td>20+ ${item.unidad}</td>
            <td>Distribuidor / Gran Lote</td>
            <td><strong style="color:var(--nex-b2b);">${money(precioDistribuidor)}</strong> <small style="color:var(--nex-b2b);">(Precio preferencial)</small></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Condiciones Comerciales B2B -->
    <div class="nex-b2b-terms-box">
      <strong>Condiciones Comerciales y Logística</strong>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;">
        <div>• <strong>Capacidad:</strong> ${item.capacidad}</div>
        <div>• <strong>Tiempo de entrega:</strong> 24 a 48 hrs hábiles</div>
        <div>• <strong>Rutas:</strong> ${item.rutas.join(', ')}</div>
        <div>• <strong>Pago:</strong> SPEI, Contra-entrega o Efectivo</div>
      </div>
      <div style="margin-top:6px;">• <strong>Ubicación del productor:</strong> ${item.zona}, Durango (<a href="${mapsUrl}" target="_blank" rel="noopener" style="color:var(--nex-b2b);font-weight:700;">Ver mapa ↗</a>)</div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;">
      <button type="button" class="nex-btn nex-btn-primary" onclick="addToCart('${item.id}'); closeProductModalAction();" style="flex:1;">
        + Agregar a mi pedido
      </button>
      <button type="button" class="nex-btn nex-btn-secondary" onclick="addToSupplyList('${item.id}');" title="Guardar para compras periódicas">
        📋 Lista de abasto
      </button>
      ${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" rel="noopener" class="nex-btn nex-btn-accent" style="background:#1F9D55;color:#fff;border-color:#1F9D55;">💬 WhatsApp</a>` : ''}
    </div>
  `;

  modal.hidden = false;
};

window.closeProductModalAction = function() {
  const modal = document.querySelector('#productDetailModal');
  if (modal) modal.hidden = true;
};

document.querySelector('#closeProductModal')?.addEventListener('click', closeProductModalAction);
document.querySelector('#closeQuoteModal')?.addEventListener('click', () => {
  const modal = document.querySelector('#quoteSummaryModal');
  if (modal) modal.hidden = true;
});

// Accesibilidad Universal: Cerrar modales con Escape y clic en fondo (Backdrop)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.nex-modal-overlay:not([hidden])').forEach((m) => {
      m.hidden = true;
    });
  }
});

document.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('nex-modal-overlay')) {
    e.target.hidden = true;
  }
});

// -----------------------------------------------------------------------------
// CARRITO Y COTIZADOR INTERACTIVO
// -----------------------------------------------------------------------------
window.addToCart = function(productId) {
  const item = allProducts.find((p) => p.id === productId);
  if (!item) return;

  const existing = cart.find((c) => c.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: item.id,
      nombre: item.nombre,
      productorNombre: item.productorNombre,
      precio_menudeo: item.precio_menudeo,
      precio_mayoreo: item.precio_mayoreo,
      unidad: item.unidad,
      whatsapp: item.whatsapp,
      qty: 1
    });
  }

  saveCart();
  renderCart();

  const msg = document.querySelector('#purchaseMessage');
  if (msg) {
    msg.textContent = `"${item.nombre}" se agregó a tu pedido.`;
    msg.hidden = false;
    setTimeout(() => { msg.hidden = true; }, 3000);
  }
  window.nexToast?.success(`"${item.nombre}" agregado al pedido.`, 'Pedido Actualizado');
};

window.updateCartQty = function(productId, delta) {
  const existing = cart.find((c) => c.id === productId);
  if (!existing) return;

  existing.qty += delta;
  if (existing.qty <= 0) {
    cart = cart.filter((c) => c.id !== productId);
  }

  saveCart();
  renderCart();
};

function renderCart() {
  const container = document.querySelector('#cartItems');
  const countBadge = document.querySelector('#cartCount');
  const subtotalEl = document.querySelector('#cartSubtotal');
  const wholesaleRow = document.querySelector('#cartWholesaleRow');
  const savingsEl = document.querySelector('#cartSavings');
  const totalEl = document.querySelector('#cartTotal');
  const waBtn = document.querySelector('#quoteWhatsAppButton');
  const quoteBtn = document.querySelector('#viewQuoteSummaryBtn');

  if (!container) return;

  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
  if (countBadge) countBadge.textContent = `${totalItems} item${totalItems === 1 ? '' : 's'}`;

  if (!cart.length) {
    container.innerHTML = `
      <div class="nex-empty-state" style="padding:24px 12px;border:none;background:transparent;">
        <span style="font-size:2rem;display:block;margin-bottom:6px;">🛒</span>
        <strong style="display:block;font-size:13px;color:var(--nex-text-primary);">Tu lista está vacía</strong>
        <small style="color:var(--nex-text-muted);">Agrega productos del catálogo para comprar o solicitar cotización.</small>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = '$0.00';
    if (wholesaleRow) wholesaleRow.style.display = 'none';
    if (totalEl) totalEl.textContent = '$0.00';
    if (waBtn) waBtn.disabled = true;
    if (quoteBtn) quoteBtn.disabled = true;
    return;
  }

  let totalNormal = 0;
  let totalWithDiscounts = 0;

  container.innerHTML = cart.map((c) => {
    // Si compra >= 5 unidades de un producto, aplica automáticamente precio de mayoreo
    const appliesWholesale = c.qty >= 5;
    const unitPrice = appliesWholesale ? c.precio_mayoreo : c.precio_menudeo;
    const lineTotal = unitPrice * c.qty;

    totalNormal += c.precio_menudeo * c.qty;
    totalWithDiscounts += lineTotal;

    return `
      <div class="nex-cart-item">
        <div>
          <div class="nex-cart-item-title">${c.nombre}</div>
          <div class="nex-cart-item-meta">
            ${money(unitPrice)} / ${c.unidad} ${appliesWholesale ? '<span class="nex-badge nex-badge-b2b" style="font-size:9px;padding:2px 5px;">Mayoreo</span>' : ''}
          </div>
          <small style="color:var(--nex-text-muted);font-size:10px;">${c.productorNombre}</small>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
          <div class="nex-cart-item-qty">
            <button type="button" class="nex-qty-btn" onclick="updateCartQty('${c.id}', -1)">-</button>
            <span style="min-width:18px;text-align:center;font-weight:700;">${c.qty}</span>
            <button type="button" class="nex-qty-btn" onclick="updateCartQty('${c.id}', 1)">+</button>
          </div>
          <strong style="font-size:12px;color:var(--nex-forest);">${money(lineTotal)}</strong>
        </div>
      </div>
    `;
  }).join('');

  const savings = Math.max(0, totalNormal - totalWithDiscounts);

  if (subtotalEl) subtotalEl.textContent = money(totalNormal);
  if (wholesaleRow) {
    if (savings > 0) {
      wholesaleRow.style.display = 'flex';
      if (savingsEl) savingsEl.textContent = `-${money(savings)}`;
    } else {
      wholesaleRow.style.display = 'none';
    }
  }
  if (totalEl) totalEl.textContent = money(totalWithDiscounts);

  if (waBtn) {
    waBtn.disabled = false;
    waBtn.onclick = () => sendCartToWhatsApp(totalWithDiscounts);
  }
  if (quoteBtn) {
    quoteBtn.disabled = false;
    quoteBtn.onclick = () => openQuoteSummaryModal(totalWithDiscounts, savings);
  }
}

function sendCartToWhatsApp(total) {
  if (!cart.length) return;

  const firstSupplier = cart[0].whatsapp ? cart[0].whatsapp.replace(/\D/g, '') : '5216180000001';
  let lines = ['*SOLICITUD DE PEDIDO / COTIZACIÓN — NEX24 DURANGO*', ''];
  cart.forEach((c) => {
    const appliesWholesale = c.qty >= 5;
    const price = appliesWholesale ? c.precio_mayoreo : c.precio_menudeo;
    lines.push(`• ${c.qty}x ${c.nombre} (${money(price)} c/u) = ${money(price * c.qty)}`);
  });
  lines.push('');
  lines.push(`*Total estimado:* ${money(total)} MXN`);
  lines.push('Favor de confirmar disponibilidad, punto de entrega y método de pago.');

  const text = encodeURIComponent(lines.join('\n'));
  window.open(`https://wa.me/${firstSupplier}?text=${text}`, '_blank');
}

function openQuoteSummaryModal(total, savings, existingFolio = null) {
  const modal = document.querySelector('#quoteSummaryModal');
  const container = document.querySelector('#modalQuoteContent');
  if (!modal || !container) return;

  const dateStr = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const folio = existingFolio || `NEX-${Math.floor(100000 + Math.random() * 900000)}`;

  if (cart.length > 0) {
    saveQuoteRecord({
      folio,
      date: dateStr,
      total,
      savings,
      itemsCount: cart.length,
      summary: cart.map((c) => `${c.qty}x ${c.nombre}`).slice(0, 3).join(', ')
    });
    if (!existingFolio) {
      window.nexToast?.success(`Cotización oficial ${folio} generada.`, 'Folio Institucional');
    }
  }

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid var(--nex-forest);padding-bottom:12px;margin-bottom:16px;">
      <div>
        <h2 style="margin:0;font-size:1.4rem;">Cotización Comercial Formal</h2>
        <span style="font-size:12px;color:var(--nex-text-muted);">Folio ${folio} · ${dateStr}</span>
      </div>
      <div style="font-size:1.6rem;font-weight:900;color:var(--nex-forest);">NEX<span style="color:var(--nex-lime);">24</span></div>
    </div>

    <div style="margin-bottom:16px;font-size:13px;line-height:1.5;">
      <strong>Plataforma de Comercio Inteligente Durango</strong><br>
      <span style="color:var(--nex-text-secondary);">Red de Abastecimiento Directo con Productores Locales</span>
    </div>

    <table class="nex-table" style="margin-bottom:18px;">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Productor</th>
          <th style="text-align:center;">Cant.</th>
          <th style="text-align:right;">P. Unit</th>
          <th style="text-align:right;">Importe</th>
        </tr>
      </thead>
      <tbody>
        ${cart.map((c) => {
          const appliesWholesale = c.qty >= 5;
          const price = appliesWholesale ? c.precio_mayoreo : c.precio_menudeo;
          return `
            <tr>
              <td><strong>${c.nombre}</strong></td>
              <td><small>${c.productorNombre}</small></td>
              <td style="text-align:center;">${c.qty}</td>
              <td style="text-align:right;">${money(price)}</td>
              <td style="text-align:right;">${money(price * c.qty)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;margin-bottom:20px;">
      <div style="min-width:220px;display:grid;gap:6px;font-size:13px;">
        ${savings > 0 ? `<div style="display:flex;justify-content:space-between;color:var(--nex-b2b);"><span>Descuento mayoreo:</span><strong>-${money(savings)}</strong></div>` : ''}
        <div style="display:flex;justify-content:space-between;font-size:1.2rem;font-weight:800;color:var(--nex-forest);border-top:1px solid var(--nex-border);padding-top:6px;">
          <span>Total estimado:</span>
          <span>${money(total)} MXN</span>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button type="button" class="nex-btn nex-btn-secondary" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
      <button type="button" class="nex-btn nex-btn-primary" onclick="sendCartToWhatsApp(${total})">💬 Enviar a Proveedor</button>
    </div>
  `;

  modal.hidden = false;
}

// -----------------------------------------------------------------------------
// PÁGINA DE PRODUCTOS (/productos)
// -----------------------------------------------------------------------------
async function renderLanding() {
  const grid = document.querySelector('#productGrid');
  if (!grid) return;

  grid.innerHTML = '<p style="padding:20px;grid-column:1/-1;text-align:center;">Cargando catálogo regional…</p>';
  const { products } = await fetchUnifiedCatalog();

  if (!products.length) {
    grid.innerHTML = '<p style="padding:20px;grid-column:1/-1;">No hay productos disponibles por ahora.</p>';
    return;
  }

  grid.innerHTML = products.map((item) => {
    const icon = CATEGORY_ICONS[item.categoria] || '🌱';
    return `
      <article class="product-card" style="display:flex;flex-direction:column;justify-content:space-between;text-align:left;">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-size:2rem;">${icon}</span>
            <span class="nex-badge nex-badge-lime" style="font-size:10px;">${item.categoria}</span>
          </div>
          <h3 style="margin:4px 0 2px;font-size:15px;">${item.nombre}</h3>
          <p style="font-size:12px;color:var(--nex-text-secondary);margin:0 0 8px;">${item.descripcion}</p>
          <strong style="color:var(--nex-emerald);font-size:12px;">🌱 ${item.productorNombre}</strong>
          <small style="display:block;color:var(--nex-text-muted);font-size:11px;">📍 ${item.zona}</small>
        </div>
        <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--nex-border);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="font-size:10px;color:var(--nex-text-muted);display:block;">Menudeo / Mayoreo</span>
            <b style="color:var(--nex-forest);">${money(item.precio_menudeo)}</b> / <b style="color:var(--nex-b2b);">${money(item.precio_mayoreo)}</b>
          </div>
          <a class="nex-btn nex-btn-sm nex-btn-accent" href="/tienda">Comprar →</a>
        </div>
      </article>
    `;
  }).join('');
}

// -----------------------------------------------------------------------------
// UBICACIONES (/ubicaciones)
// -----------------------------------------------------------------------------
async function renderLocations(query = '') {
  const list = document.querySelector('#locationList');
  if (!list) return;

  const normalized = query.trim().toLowerCase();
  const { producers } = await fetchUnifiedCatalog();

  const filtered = producers.filter((p) => {
    const hayMatch = [p.nombre, p.zona_durango, p.descripcion, p.categoria]
      .join(' ')
      .toLowerCase()
      .includes(normalized);
    return hayMatch;
  });

  list.innerHTML = filtered.length
    ? filtered.map((r) => {
        const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((r.zona_durango || 'Durango') + ', Durango, Mexico')}`;
        const whatsapp = r.whatsapp ? r.whatsapp.replace(/\D/g, '') : '';
        const icon = CATEGORY_ICONS[r.categoria] || '📍';

        return `
          <article class="location-card" style="background:#fff;border-radius:12px;border:1px solid var(--nex-border);padding:18px;">
            <div class="location-card-top" style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span class="location-icon" style="font-size:1.4rem;">${icon}</span>
              <span class="nex-badge nex-badge-verified">● Verificado</span>
            </div>
            <h3 style="margin:0 0 4px;font-size:16px;">${r.nombre}</h3>
            <p class="location-area" style="font-size:12px;color:var(--nex-emerald);font-weight:700;margin:0 0 6px;">📍 ${r.zona_durango || 'Durango'}</p>
            <p style="font-size:12px;color:var(--nex-text-secondary);margin:0 0 10px;">${r.descripcion || 'Productor local verificado.'}</p>
            <div class="location-meta" style="display:flex;justify-content:space-between;align-items:center;font-size:12px;border-top:1px solid var(--nex-border);padding-top:10px;">
              <span class="nex-badge nex-badge-b2b" style="font-size:10px;">${r.capacidad_semanal || 'Suministro semanal'}</span>
              <div style="display:flex;gap:8px;">
                ${whatsapp ? `<a href="https://wa.me/${whatsapp}" target="_blank" rel="noopener" style="color:#1F9D55;font-weight:700;">WhatsApp ↗</a>` : ''}
                <a href="${maps}" target="_blank" rel="noopener" style="color:var(--nex-emerald);font-weight:700;">Cómo llegar ↗</a>
              </div>
            </div>
          </article>
        `;
      }).join('')
    : '<div class="empty-location"><strong>No hay ubicaciones coincidentes.</strong></div>';
}

function setupLocations() {
  const input = document.querySelector('#locationSearch');
  if (!input) return;
  document.querySelector('#locationSearchButton')?.addEventListener('click', () => renderLocations(input.value));
  input.addEventListener('input', () => renderLocations(input.value));
  document.querySelectorAll('.map-pin').forEach((pin) => {
    pin.addEventListener('click', () => {
      input.value = pin.dataset.location;
      renderLocations(input.value);
      document.querySelector('.location-list')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// -----------------------------------------------------------------------------
// SIMULACIÓN 3D (/simulacion)
// -----------------------------------------------------------------------------
function setupSimulation() {
  const model = document.querySelector('#storeModel');
  if (!model) return;
  const toggle = document.querySelector('#toggleRotation');
  const output = document.querySelector('#rotationValue');
  let rotation = 0;
  let spinning = true;
  let dragging = false;
  let startX = 0;
  let startRotation = 0;

  const update = () => {
    model.style.setProperty('--rotation', `${rotation}deg`);
    if (output) output.value = `Vista 3D · ${Math.round((rotation % 360 + 360) % 360)}°`;
  };

  const frame = () => {
    if (spinning && !dragging) {
      rotation = (rotation + 0.18) % 360;
      update();
    }
    requestAnimationFrame(frame);
  };

  if (toggle) {
    toggle.addEventListener('click', () => {
      spinning = !spinning;
      toggle.textContent = spinning ? 'Pausar giro' : 'Reanudar giro';
    });
  }

  model.addEventListener('pointerdown', (event) => {
    dragging = true;
    startX = event.clientX;
    startRotation = rotation;
    model.setPointerCapture(event.pointerId);
  });
  model.addEventListener('pointermove', (event) => {
    if (dragging) {
      rotation = startRotation + (event.clientX - startX) * 0.65;
      update();
    }
  });
  model.addEventListener('pointerup', () => { dragging = false; });
  model.addEventListener('pointercancel', () => { dragging = false; });
  model.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      rotation += event.key === 'ArrowRight' ? 12 : -12;
      update();
    }
  });

  update();
  frame();
}

// -----------------------------------------------------------------------------
// PROTECCIÓN Y PANEL DEL NEGOCIO (/emprendedores) — FASE 5
// -----------------------------------------------------------------------------
async function protectBusinessDashboard() {
  const app = document.querySelector('#businessApp');
  if (!app) return;

  const session = JSON.parse(localStorage.getItem('nex24-supabase-session') || 'null');
  if (!session?.access_token) {
    window.location.replace('/login');
    return;
  }

  try {
    const response = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    if (!response.ok) {
      localStorage.removeItem('nex24-supabase-session');
      localStorage.removeItem('nex24-current-account');
      window.location.replace('/login');
      return;
    }

    const { profile } = await response.json();
    localStorage.setItem('nex24-current-account', JSON.stringify(profile));

    await setupProviderPanel(profile);
    app.hidden = false;
  } catch (_error) {
    localStorage.removeItem('nex24-supabase-session');
    localStorage.removeItem('nex24-current-account');
    window.location.replace('/login');
  }
}

async function setupProviderPanel(profile) {
  const isAdmin = profile.role === 'admin';
  const isStore = profile.role === 'tiendita';

  // 1. Títulos y Cabecera
  const titleEl = document.querySelector('#businessTitle');
  const subEl = document.querySelector('#businessSubtitle');
  const statusEl = document.querySelector('#profileStatus');
  const bannerEl = document.querySelector('#accountBanner');

  if (titleEl) titleEl.textContent = `${isAdmin ? 'Moderación' : isStore ? 'Tiendita' : 'Proveedor'} ${profile.business_name}`;
  if (subEl) subEl.textContent = isAdmin
    ? 'Auditoría, verificación de comercios y otorgamiento de sellos de confianza en Durango.'
    : isStore
    ? 'Información, abastecimiento y operación de tu punto de venta en Durango.'
    : 'Gestión de catálogo, capacidad de suministro, pedidos y cotizaciones B2B.';
  if (statusEl) {
    const isApproved = profile.status === 'approved';
    statusEl.textContent = isApproved ? '✓ Verificado' : 'En revisión';
    statusEl.className = `nex-badge ${isApproved ? 'nex-badge-verified' : 'nex-badge-warning'}`;
  }
  if (bannerEl) {
    bannerEl.innerHTML = `
      <strong>${profile.responsible_name}</strong><span> · ${profile.email}</span>
      <button id="logoutAccount" type="button" class="nex-btn nex-btn-ghost nex-btn-sm" style="margin-left:12px;color:var(--nex-danger);">
        Cerrar sesión
      </button>
    `;
    document.querySelector('#logoutAccount')?.addEventListener('click', () => {
      localStorage.removeItem('nex24-supabase-session');
      localStorage.removeItem('nex24-current-account');
      window.location.replace('/login');
    });
  }

  // 2. Visibilidad según rol
  const providerSec = document.querySelector('#providerSections');
  const buyerSec = document.querySelector('#buyerSections');
  const adminSec = document.querySelector('#adminSections');

  if (providerSec) providerSec.hidden = isAdmin || isStore;
  if (buyerSec) buyerSec.hidden = isAdmin || !isStore;
  if (adminSec) adminSec.hidden = !isAdmin;

  // 3. Navegación de Pestañas Dinámica
  const navTabsContainer = document.querySelector('#panelNavTabs');
  if (navTabsContainer) {
    if (isAdmin) {
      navTabsContainer.innerHTML = `
        <button type="button" class="nex-panel-tab active" data-tab="tabAdminOverview" role="tab" aria-selected="true">
          📊 Resumen y Auditoría
        </button>
        <button type="button" class="nex-panel-tab" data-tab="tabAdminModeration" role="tab" aria-selected="false">
          🛡️ Bandeja de Moderación
        </button>
        <button type="button" class="nex-panel-tab" data-tab="tabAdminBadges" role="tab" aria-selected="false">
          🏅 Sellos de Confianza
        </button>
        <button type="button" class="nex-panel-tab" data-tab="tabSettings" role="tab" aria-selected="false">
          ⚙️ Datos del Negocio
        </button>
      `;
    } else if (isStore) {
      navTabsContainer.innerHTML = `
        <button type="button" class="nex-panel-tab active" data-tab="tabBuyerDashboard" role="tab" aria-selected="true">
          📊 Resumen y Abasto
        </button>
        <button type="button" class="nex-panel-tab" data-tab="tabBuyerSupply" role="tab" aria-selected="false">
          ⚖️ Comparador Multi-Proveedor
        </button>
        <button type="button" class="nex-panel-tab" data-tab="tabBuyerOrders" role="tab" aria-selected="false">
          📜 Mis Cotizaciones
        </button>
        <button type="button" class="nex-panel-tab" data-tab="tabBuyerFavorites" role="tab" aria-selected="false">
          🏢 Productores de Durango
        </button>
        <button type="button" class="nex-panel-tab" data-tab="tabSettings" role="tab" aria-selected="false">
          ⚙️ Datos del Negocio
        </button>
      `;
    } else {
      navTabsContainer.innerHTML = `
        <button type="button" class="nex-panel-tab active" data-tab="tabDashboard" role="tab" aria-selected="true">
          📊 Resumen General
        </button>
        <button type="button" class="nex-panel-tab" data-tab="tabCatalog" role="tab" aria-selected="false">
          📦 Catálogo de Productos
        </button>
        <button type="button" class="nex-panel-tab" data-tab="tabInventory" role="tab" aria-selected="false">
          🚚 Capacidad y Rutas
        </button>
        <button type="button" class="nex-panel-tab" data-tab="tabOrders" role="tab" aria-selected="false">
          📋 Pedidos Recibidos
        </button>
        <button type="button" class="nex-panel-tab" data-tab="tabSettings" role="tab" aria-selected="false">
          ⚙️ Datos del Negocio
        </button>
      `;
    }
  }

  // Activar listeners en pestañas
  const tabs = document.querySelectorAll('.nex-panel-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.nex-panel-tab-content').forEach((c) => c.classList.remove('active'));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const targetId = tab.dataset.tab;
      const targetEl = document.querySelector(`#${targetId}`);
      if (targetEl) targetEl.classList.add('active');
    });
  });

  // 4. Inicializar suite según rol
  if (isAdmin) {
    await setupAdminSuite(profile);
  } else if (isStore) {
    await setupBuyerSuite(profile);
  } else {
    setupProviderSuite(profile);
  }

  // 5. Formulario de Configuración (común a ambos)
  const sName = document.querySelector('#settingsName');
  const sResp = document.querySelector('#settingsResponsible');
  const sPhone = document.querySelector('#settingsPhone');
  const sZone = document.querySelector('#settingsZone');
  const sAddr = document.querySelector('#settingsAddress');
  const sSched = document.querySelector('#settingsSchedule');
  const sumZone = document.querySelector('#summaryZone');

  if (sName) sName.value = profile.business_name || '';
  if (sResp) sResp.value = profile.responsible_name || '';
  if (sPhone) sPhone.value = profile.phone || '';
  if (sZone) { sZone.value = profile.zone || 'Centro'; if (sumZone) sumZone.textContent = sZone.value; }
  if (sAddr) sAddr.value = profile.address || '';
  if (sSched) sSched.value = profile.schedule || 'Lunes a Sábado 8:00 AM - 6:00 PM';

  document.querySelector('#settingsForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    profile.business_name = sName.value.trim();
    profile.responsible_name = sResp.value.trim();
    profile.phone = sPhone.value.trim();
    profile.zone = sZone.value.trim();
    profile.address = sAddr.value.trim();
    profile.schedule = sSched.value.trim();
    localStorage.setItem('nex24-current-account', JSON.stringify(profile));
    if (titleEl) titleEl.textContent = `${isStore ? 'Tiendita' : 'Proveedor'} ${profile.business_name}`;
    if (sumZone) sumZone.textContent = profile.zone;
    showPanelAlert('Información comercial del negocio actualizada correctamente.');
  });
}

function setupProviderSuite(profile) {
  // Almacenamiento local de productos del proveedor
  const storageKey = `nex24-provider-products_${profile.id}`;
  let providerProducts = JSON.parse(localStorage.getItem(storageKey) || 'null');

  if (!providerProducts) {
    // Si no tiene productos aún, sembramos con base en su perfil o en el catálogo
    providerProducts = [
      {
        id: 'prod_1',
        nombre: 'Café tostado en grano 500g',
        categoria: 'cafe',
        precio_menudeo: 135,
        precio_mayoreo: 108,
        unidad: 'bolsa 500g',
        estado: 'activo',
        descripcion: 'Café de altura cultivado en la sierra y tostado artesanalmente.'
      },
      {
        id: 'prod_2',
        nombre: 'Café molido gourmet 250g',
        categoria: 'cafe',
        precio_menudeo: 80,
        precio_mayoreo: 64,
        unidad: 'bolsa 250g',
        estado: 'activo',
        descripcion: 'Molienda media para cafetera o prensa francesa.'
      }
    ];
    localStorage.setItem(storageKey, JSON.stringify(providerProducts));
  }

  // 4. Renderizar Catálogo del Proveedor
  function renderProviderCatalog() {
    const tableBody = document.querySelector('#providerCatalogTable');
    const metricCount = document.querySelector('#metricProductsCount');
    if (metricCount) metricCount.textContent = String(providerProducts.length);

    if (!tableBody) return;

    if (!providerProducts.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:24px;color:var(--nex-text-muted);">
            No tienes productos registrados todavía. Pulsa "+ Publicar Nuevo Producto" para comenzar.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = providerProducts.map((p, idx) => `
      <tr>
        <td><strong>${p.nombre}</strong></td>
        <td><span class="nex-badge nex-badge-lime">${p.categoria}</span></td>
        <td><b>${money(p.precio_menudeo)}</b></td>
        <td><b style="color:var(--nex-b2b);">${money(p.precio_mayoreo)}</b></td>
        <td>${p.unidad}</td>
        <td>
          <span class="nex-badge ${p.estado === 'activo' ? 'nex-badge-verified' : 'nex-badge-warning'}">
            ${p.estado === 'activo' ? 'Activo' : 'En pausa'}
          </span>
        </td>
        <td style="text-align:right;">
          <button type="button" class="nex-btn nex-btn-ghost nex-btn-sm" onclick="editProviderProduct('${p.id}')">Editar</button>
          <button type="button" class="nex-btn nex-btn-ghost nex-btn-sm" style="color:var(--nex-danger);" onclick="deleteProviderProduct('${p.id}')">Eliminar</button>
        </td>
      </tr>
    `).join('');
  }

  window.deleteProviderProduct = function(id) {
    if (!confirm('¿Estás seguro de eliminar este producto del catálogo?')) return;
    providerProducts = providerProducts.filter((p) => p.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(providerProducts));
    renderProviderCatalog();
    showPanelAlert('Producto eliminado del catálogo correctamente.');
  };

  window.editProviderProduct = function(id) {
    const item = providerProducts.find((p) => p.id === id);
    if (!item) return;

    document.querySelector('#prodEditId').value = item.id;
    document.querySelector('#prodEditName').value = item.nombre;
    document.querySelector('#prodEditCategory').value = item.categoria;
    document.querySelector('#prodEditUnit').value = item.unidad;
    document.querySelector('#prodEditPriceB2C').value = item.precio_menudeo;
    document.querySelector('#prodEditPriceB2B').value = item.precio_mayoreo;
    document.querySelector('#prodEditDesc').value = item.descripcion || '';
    document.querySelector('#modalFormTitle').textContent = 'Editar Producto';

    const modal = document.querySelector('#productFormModal');
    if (modal) modal.hidden = false;
  };

  renderProviderCatalog();

  // 5. Manejo del Modal de Producto
  const modalForm = document.querySelector('#productFormModal');
  document.querySelector('#btnOpenNewProductModal')?.addEventListener('click', () => {
    document.querySelector('#productEditForm')?.reset();
    document.querySelector('#prodEditId').value = '';
    document.querySelector('#modalFormTitle').textContent = 'Publicar Nuevo Producto';
    if (modalForm) modalForm.hidden = false;
  });

  document.querySelector('#closeProductFormModal')?.addEventListener('click', () => {
    if (modalForm) modalForm.hidden = true;
  });
  document.querySelector('#cancelProductFormBtn')?.addEventListener('click', () => {
    if (modalForm) modalForm.hidden = true;
  });

  document.querySelector('#productEditForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.querySelector('#prodEditId').value;
    const nombre = document.querySelector('#prodEditName').value.trim();
    const categoria = document.querySelector('#prodEditCategory').value;
    const unidad = document.querySelector('#prodEditUnit').value.trim();
    const precio_menudeo = Number(document.querySelector('#prodEditPriceB2C').value);
    const precio_mayoreo = Number(document.querySelector('#prodEditPriceB2B').value);
    const descripcion = document.querySelector('#prodEditDesc').value.trim();

    if (id) {
      // Edición
      const idx = providerProducts.findIndex((p) => p.id === id);
      if (idx !== -1) {
        providerProducts[idx] = { ...providerProducts[idx], nombre, categoria, unidad, precio_menudeo, precio_mayoreo, descripcion };
      }
      showPanelAlert(`Producto "${nombre}" actualizado con éxito.`);
    } else {
      // Nuevo
      const nuevo = {
        id: `prod_${Date.now()}`,
        nombre,
        categoria,
        unidad,
        precio_menudeo,
        precio_mayoreo,
        descripcion,
        estado: 'activo'
      };
      providerProducts.push(nuevo);
      showPanelAlert(`Producto "${nombre}" publicado exitosamente en NEX24.`);
    }

    localStorage.setItem(storageKey, JSON.stringify(providerProducts));
    renderProviderCatalog();
    if (modalForm) modalForm.hidden = true;
  });

  // 6. Configuración de Suministro y Capacidad
  const capacityInput = document.querySelector('#capacidadInput');
  const rutasInput = document.querySelector('#rutasInput');
  const metricCap = document.querySelector('#metricCapacity');
  const metricRoutes = document.querySelector('#metricRoutesCount');

  if (capacityInput) capacityInput.value = profile.capacity || '120 kg / semana';
  if (rutasInput) rutasInput.value = 'Centro, Zona Industrial, Fracc. Guadalupe';
  if (metricCap) metricCap.textContent = profile.capacity || '120 kg';

  document.querySelector('#capacityForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const cap = capacityInput.value.trim();
    const rutas = rutasInput.value.trim();
    if (metricCap) metricCap.textContent = cap;
    if (metricRoutes) metricRoutes.textContent = String(rutas.split(',').filter(Boolean).length || 1);
    showPanelAlert('Capacidad operativa y rutas actualizadas con éxito.');
  });

  // 7. Cotizaciones y Pedidos Recibidos
  const ordersKey = `nex24-provider-orders_${profile.id}`;
  let providerOrders = JSON.parse(localStorage.getItem(ordersKey) || 'null');

  if (!providerOrders) {
    providerOrders = [
      {
        folio: 'NEX-942817',
        cliente: 'Abarrotes El Centro',
        contacto: '5216180000001',
        productos: '10x Café tostado en grano 500g',
        total: 1080,
        estado: 'Pendiente',
        fecha: 'Hace 2 horas'
      },
      {
        folio: 'NEX-716492',
        cliente: 'Restaurante Los Canelos',
        contacto: '5216180000002',
        productos: '5x Café molido gourmet 250g',
        total: 320,
        estado: 'Confirmado',
        fecha: 'Ayer'
      }
    ];
    localStorage.setItem(ordersKey, JSON.stringify(providerOrders));
  }

  function renderProviderOrders() {
    const ordersTable = document.querySelector('#providerOrdersTable');
    const counter = document.querySelector('#ordersCounter');
    const metricQuotes = document.querySelector('#metricQuotesCount');
    const recentActivity = document.querySelector('#recentActivityList');

    if (counter) counter.textContent = `${providerOrders.length} solicitud${providerOrders.length === 1 ? '' : 'es'}`;
    if (metricQuotes) metricQuotes.textContent = String(providerOrders.length);

    if (recentActivity) {
      recentActivity.innerHTML = providerOrders.slice(0, 3).map((o) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--nex-bg);border-radius:var(--radius-sm);">
          <div>
            <strong>${o.cliente}</strong>
            <small style="display:block;color:var(--nex-text-muted);">${o.productos} · ${o.fecha}</small>
          </div>
          <span class="nex-badge ${o.estado === 'Confirmado' ? 'nex-badge-verified' : 'nex-badge-warning'}">${o.estado}</span>
        </div>
      `).join('');
    }

    if (!ordersTable) return;

    ordersTable.innerHTML = providerOrders.map((o, idx) => {
      const waUrl = `https://wa.me/${o.contacto}?text=${encodeURIComponent(`Hola ${o.cliente}, te contacto respecto a tu cotización ${o.folio} en NEX24.`)}`;
      return `
        <tr>
          <td><span class="nex-badge nex-badge-b2b">${o.folio}</span></td>
          <td><strong>${o.cliente}</strong></td>
          <td><small>${o.productos}</small></td>
          <td><b>${money(o.total)}</b></td>
          <td>
            <select class="nex-toolbar-select" style="padding:4px 8px;font-size:11px;" onchange="updateOrderStatus(${idx}, this.value)">
              <option value="Pendiente" ${o.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
              <option value="Confirmado" ${o.estado === 'Confirmado' ? 'selected' : ''}>Confirmado</option>
              <option value="Entregado" ${o.estado === 'Entregado' ? 'selected' : ''}>Entregado</option>
            </select>
          </td>
          <td style="text-align:right;">
            <a href="${waUrl}" target="_blank" rel="noopener" class="nex-btn nex-btn-accent nex-btn-sm" style="background:#1F9D55;color:#fff;border-color:#1F9D55;">
              💬 Responder
            </a>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.updateOrderStatus = function(idx, newStatus) {
    if (providerOrders[idx]) {
      providerOrders[idx].estado = newStatus;
      localStorage.setItem(ordersKey, JSON.stringify(providerOrders));
      renderProviderOrders();
      showPanelAlert(`Estado del pedido ${providerOrders[idx].folio} actualizado a "${newStatus}".`);
    }
  };

  renderProviderOrders();
}

async function setupBuyerSuite(profile) {
  // Asegurar catálogo de productores de Durango disponible
  await fetchUnifiedCatalog();

  const supplyList = getSupplyList();
  const quotes = getQuotesHistory();

  // 1. Métricas del Comprador
  const metricSupplyCount = document.querySelector('#metricBuyerSupplyCount');
  const metricQuotesCount = document.querySelector('#metricBuyerQuotesCount');
  const metricSuppliersCount = document.querySelector('#metricBuyerSuppliersCount');
  const metricSavings = document.querySelector('#metricBuyerSavings');

  if (metricSupplyCount) metricSupplyCount.textContent = supplyList.length;
  if (metricQuotesCount) metricQuotesCount.textContent = quotes.length;

  const supplierNames = new Set();
  supplyList.forEach((s) => { if (s.productorNombre) supplierNames.add(s.productorNombre); });
  if (metricSuppliersCount) {
    metricSuppliersCount.textContent = supplierNames.size || (allProducers.length ? `${allProducers.length} disp.` : '0');
  }

  let totalSavings = 0;
  supplyList.forEach((s) => {
    const full = allProducts.find((p) => p.id === s.id);
    if (full) {
      const diff = Math.max(0, (full.precio_menudeo || 0) - (full.precio_mayoreo || 0));
      totalSavings += diff * 10;
    }
  });
  quotes.forEach((q) => {
    if (q.savings) totalSavings += Number(q.savings) || 0;
  });
  if (metricSavings) metricSavings.textContent = money(totalSavings);

  // 2. Historial Reciente en Dashboard (Top 3)
  const recentBox = document.querySelector('#buyerRecentQuotesList');
  if (recentBox) {
    if (!quotes.length) {
      recentBox.innerHTML = `
        <div style="padding:16px 12px;background:var(--nex-bg);border-radius:var(--radius-sm);text-align:center;">
          <p style="color:var(--nex-text-secondary);font-size:13px;margin:0 0 10px;">
            Aún no tienes cotizaciones registradas.
          </p>
          <a href="/tienda?tipo=mayoreo" class="nex-btn nex-btn-sm nex-btn-primary">
            Explorar Insumos Mayoreo →
          </a>
        </div>
      `;
    } else {
      recentBox.innerHTML = quotes.slice(0, 3).map((q) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--nex-bg);border:1px solid var(--nex-border);border-radius:var(--radius-sm);">
          <div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="nex-badge nex-badge-b2b" style="font-size:10px;">${q.folio}</span>
              <small style="color:var(--nex-text-muted);">${q.date}</small>
            </div>
            <div style="font-size:12px;font-weight:600;margin-top:4px;">${q.summary || `${q.itemsCount} productos`}</div>
          </div>
          <div style="text-align:right;">
            <strong style="color:var(--nex-forest);display:block;">${money(q.total)}</strong>
            <button type="button" class="nex-btn nex-btn-ghost nex-btn-sm" style="padding:2px 6px;font-size:11px;" onclick="reopenQuoteByFolio('${q.folio}')">Ver folio</button>
          </div>
        </div>
      `).join('');
    }
  }

  // 3. Comparador Multi-Proveedor de Insumos
  const comparatorBox = document.querySelector('#buyerSupplyComparatorTable');
  if (comparatorBox) {
    if (!supplyList.length) {
      comparatorBox.innerHTML = `
        <div class="nex-empty-state" style="padding:48px 24px;border:none;">
          <span style="font-size:2.8rem;display:block;margin-bottom:10px;">📋</span>
          <h4 style="margin:0 0 8px;color:var(--nex-forest);">Tu lista de abastecimiento recurrente está vacía</h4>
          <p style="font-size:13px;color:var(--nex-text-secondary);max-width:540px;margin:0 auto 18px;line-height:1.6;">
            Añade productos desde el catálogo B2B para comparar productores de Durango, calcular ahorros directos por volumen y solicitar cotizaciones oficiales en un solo clic.
          </p>
          <a href="/tienda?tipo=mayoreo" class="nex-btn nex-btn-primary">
            + Agregar Insumos desde el Catálogo
          </a>
        </div>
      `;
    } else {
      comparatorBox.innerHTML = `
        <table class="nex-table">
          <thead>
            <tr>
              <th>Insumo / Producto</th>
              <th>Productor de Durango</th>
              <th>Zona y Rutas</th>
              <th>P. Menudeo</th>
              <th>P. Mayoreo (B2B)</th>
              <th>Ahorro Unitario</th>
              <th style="text-align:right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${supplyList.map((item) => {
              const full = allProducts.find((p) => p.id === item.id) || {};
              const menudeo = full.precio_menudeo || (item.precio_mayoreo ? item.precio_mayoreo * 1.25 : 85);
              const mayoreo = full.precio_mayoreo || item.precio_mayoreo || 68;
              const diff = Math.max(0, menudeo - mayoreo);
              const pct = menudeo > 0 ? Math.round((diff / menudeo) * 100) : 0;
              const prodName = full.productorNombre || item.productorNombre || 'Productor Local';
              const phone = full.whatsapp || '6181234567';
              const waText = encodeURIComponent(`Hola ${prodName}, te contacto desde la tiendita "${profile.business_name}" a través de NEX24. Deseo cotizar mayoreo del insumo: ${item.nombre}.`);
              const waUrl = `https://wa.me/${phone}?text=${waText}`;

              return `
                <tr>
                  <td>
                    <strong>${item.nombre}</strong>
                    <small style="display:block;color:var(--nex-text-secondary);font-size:11px;">${full.unidad || item.unidad || 'unidad'}</small>
                  </td>
                  <td>
                    <span style="font-weight:600;color:var(--nex-forest);">${prodName}</span>
                    <span class="nex-badge nex-badge-verified" style="display:inline-block;margin-left:4px;font-size:10px;">✓ Verificado</span>
                  </td>
                  <td>
                    <span style="font-size:12px;">📍 ${item.zona || full.zona || 'Durango'}</span>
                    <small style="display:block;color:var(--nex-text-muted);font-size:10px;">${(full.rutas || ['Centro']).join(', ')}</small>
                  </td>
                  <td><del style="color:var(--nex-text-muted);">${money(menudeo)}</del></td>
                  <td><strong style="color:var(--nex-b2b);font-size:14px;">${money(mayoreo)}</strong></td>
                  <td>
                    <span class="nex-badge nex-badge-lime" style="font-weight:700;">-${money(diff)} (${pct}%)</span>
                  </td>
                  <td style="text-align:right;white-space:nowrap;">
                    <a href="${waUrl}" target="_blank" rel="noopener" class="nex-btn nex-btn-accent nex-btn-sm" style="background:#1F9D55;color:#fff;border-color:#1F9D55;margin-right:6px;">
                      💬 Pedir Mayoreo
                    </a>
                    <button type="button" class="nex-btn nex-btn-ghost nex-btn-sm" onclick="removeSupplyItemAndRefresh('${item.id}', '${profile.id}')" style="color:var(--nex-danger);" title="Eliminar insumo">
                      ✕
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
  }

  // 4. Tabla de Cotizaciones Emitidas
  const quotesTable = document.querySelector('#buyerQuotesTable');
  if (quotesTable) {
    if (!quotes.length) {
      quotesTable.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:32px;color:var(--nex-text-secondary);font-size:13px;">
            Aún no has generado cotizaciones formales. Puedes crearlas con folio y PDF desde el carrito de compras en el <a href="/tienda?tipo=mayoreo" style="color:var(--nex-emerald);font-weight:600;text-decoration:underline;">Catálogo</a>.
          </td>
        </tr>
      `;
    } else {
      quotesTable.innerHTML = quotes.map((q) => `
        <tr>
          <td><span class="nex-badge nex-badge-b2b">${q.folio}</span></td>
          <td><span style="font-size:12px;">${q.date}</span></td>
          <td>
            <strong>${q.itemsCount || 1} insumo(s)</strong>
            <small style="display:block;color:var(--nex-text-secondary);font-size:11px;">${q.summary || 'Cotización formal B2B'}</small>
          </td>
          <td><strong style="color:var(--nex-forest);">${money(q.total)}</strong></td>
          <td><span class="nex-badge nex-badge-lime">${money(q.savings || 0)}</span></td>
          <td style="text-align:right;">
            <button type="button" class="nex-btn nex-btn-outline nex-btn-sm" onclick="reopenQuoteByFolio('${q.folio}')">
              Ver Folio ↗
            </button>
          </td>
        </tr>
      `).join('');
    }
  }

  // 5. Directorio de Productores Frecuentes de Durango
  const favGrid = document.querySelector('#buyerFavoritesGrid');
  if (favGrid) {
    const featuredProducers = (allProducers.length ? allProducers : []).slice(0, 6);
    favGrid.innerHTML = featuredProducers.map((p) => {
      const waText = encodeURIComponent(`Hola ${p.nombre}, te contacto desde la tiendita "${profile.business_name}" en Durango. Me interesa conocer tus condiciones comerciales de mayoreo.`);
      const waUrl = `https://wa.me/${p.whatsapp || '6181234567'}?text=${waText}`;
      const catalogUrl = `/tienda?q=${encodeURIComponent(p.nombre)}`;

      return `
        <div class="nex-card" style="display:flex;flex-direction:column;justify-content:space-between;border:1px solid var(--nex-border);border-radius:var(--radius-md);padding:18px;background:var(--nex-surface);">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
              <h4 style="margin:0;font-size:15px;color:var(--nex-forest);">${p.nombre}</h4>
              <span class="nex-badge nex-badge-verified" style="font-size:10px;">✓ Verificado</span>
            </div>
            <span class="nex-badge nex-badge-neutral" style="margin-bottom:10px;text-transform:capitalize;">${p.categoria || 'Agroalimentario'}</span>
            <p style="font-size:12px;color:var(--nex-text-secondary);line-height:1.5;margin:0 0 12px;">
              ${p.descripcion || 'Productor local verificado del estado de Durango con capacidad de suministro comercial.'}
            </p>
            <div style="font-size:12px;display:grid;gap:4px;color:var(--nex-text-primary);margin-bottom:14px;background:var(--nex-bg);padding:10px;border-radius:var(--radius-sm);">
              <div>📍 <strong>Zona:</strong> ${p.zona_durango || 'Durango'}</div>
              <div>📦 <strong>Capacidad:</strong> ${p.capacidad_semanal || 'Bajo pedido'}</div>
              <div>🚚 <strong>Rutas:</strong> ${(p.rutas_entrega || ['Centro']).join(', ')}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:auto;">
            <a href="${waUrl}" target="_blank" rel="noopener" class="nex-btn nex-btn-accent nex-btn-sm" style="flex:1;background:#1F9D55;color:#fff;border-color:#1F9D55;text-align:center;">
              💬 Contactar
            </a>
            <a href="${catalogUrl}" class="nex-btn nex-btn-outline nex-btn-sm" style="flex:1;text-align:center;">
              Ver Insumos
            </a>
          </div>
        </div>
      `;
    }).join('');
  }
}

window.removeSupplyItemAndRefresh = function(productId, profileId) {
  removeFromSupplyList(productId);
  const account = JSON.parse(localStorage.getItem('nex24-current-account') || '{}');
  setupBuyerSuite(account);
  showPanelAlert('Insumo eliminado de tu lista de abastecimiento.');
};

async function setupAdminSuite(profile) {
  let adminBusinesses = [];

  window.loadAdminBusinesses = async function() {
    try {
      const res = await fetch('/api/admin/negocios');
      const data = await res.json();
      adminBusinesses = Array.isArray(data.negocios) ? data.negocios : [];
    } catch (_e) {
      adminBusinesses = [];
    }
    renderAdminView();
  };

  function renderAdminView() {
    const totalEl = document.querySelector('#metricAdminTotalCount');
    const appEl = document.querySelector('#metricAdminApprovedCount');
    const pendEl = document.querySelector('#metricAdminPendingCount');
    const tableBody = document.querySelector('#adminBusinessesTable');

    const total = adminBusinesses.length;
    const approved = adminBusinesses.filter((b) => b.status === 'approved').length;
    const pending = adminBusinesses.filter((b) => b.status === 'pending').length;

    if (totalEl) totalEl.textContent = total;
    if (appEl) appEl.textContent = approved;
    if (pendEl) pendEl.textContent = pending;

    if (!tableBody) return;

    if (!adminBusinesses.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:36px;color:var(--nex-text-secondary);">
            Sin registros de comercios en la plataforma.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = adminBusinesses.map((b) => {
      const isApproved = b.status === 'approved';
      const isPending = b.status === 'pending';
      const roleBadge = b.role === 'proveedor'
        ? '<span class="nex-badge nex-badge-b2b" style="font-size:10px;">Proveedor</span>'
        : '<span class="nex-badge nex-badge-neutral" style="font-size:10px;">Tiendita</span>';

      const statusBadge = isApproved
        ? '<span class="nex-badge nex-badge-verified" style="font-size:11px;">✓ Verificado</span>'
        : isPending
        ? '<span class="nex-badge nex-badge-warning" style="font-size:11px;">⏳ En Revisión</span>'
        : '<span class="nex-badge nex-badge-danger" style="font-size:11px;">✕ Rechazado</span>';

      const waClean = String(b.phone || '').replace(/\D/g, '');
      const waUrl = `https://wa.me/${waClean}?text=${encodeURIComponent(`Hola ${b.responsible_name}, te contacto desde el equipo de Verificación y Confianza Comercial de NEX24 Durango respecto a tu cuenta "${b.business_name}".`)}`;

      return `
        <tr>
          <td>
            <strong style="color:var(--nex-forest);display:block;font-size:13px;">${b.business_name}</strong>
            <small style="color:var(--nex-text-muted);">${b.email || '—'}</small>
          </td>
          <td>${roleBadge}</td>
          <td>
            <span style="font-size:12px;font-weight:600;">${b.responsible_name}</span>
            <small style="display:block;color:var(--nex-text-secondary);font-size:11px;">Tel: ${b.phone || '—'}</small>
          </td>
          <td><span style="font-size:12px;">📍 ${b.zone || 'Durango'}</span></td>
          <td>
            <span style="font-size:12px;">${b.capacity || b.category || 'Comercial'}</span>
            ${b.products ? `<small style="display:block;color:var(--nex-text-muted);font-size:10px;">${b.products.slice(0, 30)}...</small>` : ''}
          </td>
          <td>${statusBadge}</td>
          <td style="text-align:right;white-space:nowrap;">
            ${isApproved ? `
              <button type="button" class="nex-btn nex-btn-ghost nex-btn-sm" style="font-size:11px;color:var(--nex-warning);" onclick="updateBusinessStatus('${b.id}', 'pending')">
                Revisar
              </button>
            ` : `
              <button type="button" class="nex-btn nex-btn-primary nex-btn-sm" style="font-size:11px;padding:4px 10px;" onclick="updateBusinessStatus('${b.id}', 'approved')">
                ✓ Aprobar
              </button>
            `}
            <a href="${waUrl}" target="_blank" rel="noopener" class="nex-btn nex-btn-accent nex-btn-sm" style="background:#1F9D55;color:#fff;border-color:#1F9D55;font-size:11px;padding:4px 8px;margin-left:4px;">
              💬 WA
            </a>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.updateBusinessStatus = async function(id, newStatus) {
    try {
      const res = await fetch(`/api/admin/negocios/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el estado.');

      const target = adminBusinesses.find((b) => b.id === id);
      if (target) target.status = newStatus;

      renderAdminView();
      const statusLabel = newStatus === 'approved' ? 'Verificado (Aprobado)' : newStatus === 'pending' ? 'En Revisión' : 'Rechazado';
      showPanelAlert(`Comercio actualizado a estatus "${statusLabel}".`);
    } catch (err) {
      window.nexToast?.error(err.message, 'Error de Verificación');
    }
  };

  document.querySelector('#btnRefreshAdminList')?.addEventListener('click', () => {
    loadAdminBusinesses();
  });

  document.querySelector('#btnGoToModeration')?.addEventListener('click', () => {
    document.querySelector('[data-tab="tabAdminModeration"]')?.click();
  });

  await loadAdminBusinesses();
}

function showPanelAlert(text, type = 'success') {
  const box = document.querySelector('#panelAlertBox');
  if (box) {
    box.textContent = text;
    box.hidden = false;
    setTimeout(() => { box.hidden = true; }, 4000);
  }
  window.nexToast?.show(text, type);
}

// Inicialización controlada
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupLocations();
    setupSimulation();
    renderLanding();
    renderStore();
    protectBusinessDashboard();
  });
} else {
  setupLocations();
  setupSimulation();
  renderLanding();
  renderStore();
  protectBusinessDashboard();
}
