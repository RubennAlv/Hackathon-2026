/**
 * NEX24 — Sistema de Navegación Unificada
 * Arquitectura de 4 Experiencias: Pública, Comprador, Proveedor y Administrador
 */

function getAuthProfile() {
  try {
    const raw = localStorage.getItem('nex24-current-account');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getNavigationItems(profile) {
  // A. Experiencia Proveedor
  if (profile && profile.role === 'proveedor') {
    return [
      { href: '/emprendedores', label: 'Panel Proveedor', key: 'emprendedores' },
      { href: '/tienda', label: 'Catálogo', key: 'tienda' },
      { href: '/ubicaciones', label: 'Red Comercial', key: 'ubicaciones' },
      { href: '/lens', label: 'Lens IA ✨', key: 'lens' }
    ];
  }

  // B. Experiencia Comprador / Tiendita
  if (profile && profile.role === 'tiendita') {
    return [
      { href: '/emprendedores', label: 'Mi Tiendita', key: 'emprendedores' },
      { href: '/tienda', label: 'Abastecimiento B2B', key: 'tienda' },
      { href: '/ubicaciones', label: 'Proveedores Locales', key: 'ubicaciones' },
      { href: '/lens', label: 'Lens IA ✨', key: 'lens' }
    ];
  }

  // C. Experiencia Administrador / Verificación
  if (profile && profile.role === 'admin') {
    return [
      { href: '/emprendedores', label: 'Panel Verificación', key: 'emprendedores' },
      { href: '/tienda', label: 'Catálogo', key: 'tienda' },
      { href: '/ubicaciones', label: 'Red Durango', key: 'ubicaciones' },
      { href: '/lens', label: 'Lens IA ✨', key: 'lens' }
    ];
  }

  // D. Experiencia Pública (predeterminada)
  return [
    { href: '/', label: 'Inicio', key: 'inicio' },
    { href: '/tienda', label: 'Mercado', key: 'tienda' },
    { href: '/mapa', label: 'Mapa IA 🗺️', key: 'mapa' },
    { href: '/ubicaciones', label: 'Proveedores', key: 'ubicaciones' },
    { href: '/lens', label: 'Lens IA ✨', key: 'lens' },
    { href: '/propuesta', label: 'Cómo funciona', key: 'propuesta' },
    { href: '/registro', label: 'Registro', key: 'registro' },
    { href: '/login', label: 'Iniciar sesión', key: 'login' }
  ];
}

function currentKey(pathname) {
  if (pathname === '/' || pathname === '/index.html') return 'inicio';
  const clean = pathname.replace(/^\//, '').split(/[\/?#]/)[0];
  return clean || 'inicio';
}

function initNavigation() {
  const host = document.querySelector('[data-nex-navigation]');
  if (!host) return;

  const profile = getAuthProfile();
  const navItems = getNavigationItems(profile);
  const active = currentKey(window.location.pathname);

  let ctaHtml = '';
  if (profile) {
    const roleTag = profile.role === 'admin' ? 'Verificador' : profile.role === 'proveedor' ? 'Proveedor' : 'Tiendita';
    const shortName = (profile.business_name || 'Mi cuenta').split(' ')[0];
    ctaHtml = `
      <div style="display:flex;align-items:center;gap:10px;">
        <a class="nav-cta" href="/emprendedores" title="${profile.business_name}">
          <span>●</span> ${shortName} (${roleTag})
        </a>
        <button id="navLogoutBtn" type="button" class="btn ghost nex-btn-sm" style="font-size:11px;padding:6px 10px;color:var(--nex-text-secondary);border:1px solid var(--nex-border);border-radius:var(--radius-sm);" aria-label="Cerrar sesión">
          Salir
        </button>
      </div>
    `;
  } else {
    ctaHtml = `<a class="nav-cta" href="/tienda">Explorar Mercado <span aria-hidden="true">→</span></a>`;
  }

  // Asegurar anclaje accesible para saltar al contenido principal
  const mainEl = document.querySelector('main');
  if (mainEl && !mainEl.id) {
    mainEl.id = 'mainContent';
    mainEl.setAttribute('tabindex', '-1');
  }

  host.innerHTML = `
    <a href="#mainContent" class="nex-skip-link">Saltar al contenido principal</a>
    <a class="logo" href="/" aria-label="NEX24, inicio">NEX<span>24</span></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-navigation" aria-label="Abrir menú de navegación">
      <span></span><span></span><span></span>
    </button>
    <nav id="main-navigation" class="main-navigation" aria-label="Navegación principal">
      ${navItems.map((item) => {
        const isCurrent = item.key === active;
        return `<a href="${item.href}"${isCurrent ? ' class="active" aria-current="page"' : ''}>${item.label}</a>`;
      }).join('')}
    </nav>
    ${ctaHtml}
  `;

  // Toggle para navegación móvil
  const toggle = host.querySelector('.nav-toggle');
  const nav = host.querySelector('.main-navigation');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Abrir menú de navegación' : 'Cerrar menú de navegación');
      host.classList.toggle('menu-open', !open);
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menú de navegación');
        host.classList.remove('menu-open');
      });
    });

    // Cerrar menú móvil con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && host.classList.contains('menu-open')) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menú de navegación');
        host.classList.remove('menu-open');
        toggle.focus();
      }
    });
  }

  // Logout si está presente
  const logoutBtn = host.querySelector('#navLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('nex24-supabase-session');
      localStorage.removeItem('nex24-current-account');
      window.location.href = '/login';
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavigation);
} else {
  initNavigation();
}

/* Carga global verde compartida por todas las páginas */
(function initPageLoader() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/css/loader.css';
  document.head.appendChild(link);

  const overlay = document.createElement('div');
  overlay.id = 'nexPageLoader';
  overlay.className = 'nex-page-loader';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-label', 'Cargando');
  overlay.innerHTML = `<div class="nex-loader-content"><div class="nex-three-body" aria-hidden="true"><div class="nex-three-body__dot"></div><div class="nex-three-body__dot"></div><div class="nex-three-body__dot"></div></div><div class="nex-loader-brand">NEX<span>24</span></div></div>`;
  document.body.appendChild(overlay);

  let hideTimer = null;
  window.nexLoader = {
    show(label) {
      clearTimeout(hideTimer);
      const brand = overlay.querySelector('.nex-loader-brand');
      if (brand) brand.innerHTML = label ? `${label}` : 'NEX<span>24</span>';
      overlay.classList.add('is-visible');
      overlay.setAttribute('aria-hidden', 'false');
    },
    hide(delay = 180) {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        overlay.classList.remove('is-visible');
        overlay.setAttribute('aria-hidden', 'true');
      }, delay);
    }
  };

  window.nexLoader.show();
  window.addEventListener('load', () => window.nexLoader.hide(220));
  window.addEventListener('pageshow', () => window.nexLoader.hide(120));

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.href === window.location.href) return;

    window.nexLoader.show();
  });
})();

// =============================================================================
// SISTEMA GLOBAL DE NOTIFICACIONES TOAST (FASE 8)
// =============================================================================
function getOrCreateToastContainer() {
  let container = document.querySelector('#nexToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'nexToastContainer';
    container.className = 'nex-toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Notificaciones del sistema');
    document.body.appendChild(container);
  }
  return container;
}

const TOAST_ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
};

window.nexToast = {
  show(message, type = 'info', options = {}) {
    if (!message) return;
    const container = getOrCreateToastContainer();

    const toast = document.createElement('div');
    toast.className = `nex-toast nex-toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    const title = options.title || (type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : type === 'warning' ? 'Atención' : 'Información');
    const duration = typeof options.duration === 'number' ? options.duration : 4500;

    const safeMsg = String(message)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const safeTitle = String(title)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    toast.innerHTML = `
      <div class="nex-toast-icon" aria-hidden="true">${TOAST_ICONS[type] || 'ℹ'}</div>
      <div class="nex-toast-body">
        <div class="nex-toast-title">${safeTitle}</div>
        <p class="nex-toast-msg">${safeMsg}</p>
      </div>
      <button type="button" class="nex-toast-close" aria-label="Cerrar notificación">✕</button>
    `;

    const closeBtn = toast.querySelector('.nex-toast-close');
    let timer = null;

    const dismiss = () => {
      if (timer) clearTimeout(timer);
      toast.classList.add('nex-toast-hide');
      setTimeout(() => {
        toast.remove();
      }, 240);
    };

    closeBtn?.addEventListener('click', dismiss);

    if (duration > 0) {
      timer = setTimeout(dismiss, duration);
    }

    container.appendChild(toast);
    return { dismiss };
  },

  success(msg, title = 'Operación Exitosa', options = {}) {
    return this.show(msg, 'success', { title, ...options });
  },

  error(msg, title = 'Error', options = {}) {
    return this.show(msg, 'error', { title, ...options });
  },

  warning(msg, title = 'Atención', options = {}) {
    return this.show(msg, 'warning', { title, ...options });
  },

  info(msg, title = 'NEX24', options = {}) {
    return this.show(msg, 'info', { title, ...options });
  }
};

// Detección automática de conectividad
window.addEventListener('offline', () => {
  window.nexToast?.warning('Se perdió la conexión a Internet. El sistema funciona con datos locales en caché.', 'Sin Conexión');
});

window.addEventListener('online', () => {
  window.nexToast?.success('Conexión a Internet restablecida.', 'En Línea');
});

