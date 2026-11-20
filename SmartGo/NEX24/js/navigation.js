/**
 * NEX24 — Sistema de Navegación Unificada
 * Arquitectura de 4 Experiencias: Pública, Comprador, Proveedor y Administrador
 */

// Carga automática del sistema de iconos Lucide si no está presente
if (typeof document !== 'undefined' && !window.createLucideIcon) {
  const iconScript = document.createElement('script');
  iconScript.src = '/js/icons.js';
  iconScript.async = false;
  document.head.appendChild(iconScript);
}

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
      { href: '/lens', label: 'Lens IA', key: 'lens' },
      { href: '/mapa', label: 'Mapa IA', key: 'mapa' }
    ];
  }

  // B. Experiencia Comprador / Tiendita
  if (profile && profile.role === 'tiendita') {
    return [
      { href: '/emprendedores', label: 'Mi Tiendita', key: 'emprendedores' },
      { href: '/tienda', label: 'Abasto Mayoreo', key: 'tienda' },
      { href: '/lens', label: 'Lens IA', key: 'lens' },
      { href: '/mapa', label: 'Mapa IA', key: 'mapa' }
    ];
  }

  // C. Experiencia Administrador / Verificación
  if (profile && profile.role === 'admin') {
    return [
      { href: '/emprendedores', label: 'Panel Auditoría', key: 'emprendedores' },
      { href: '/tienda', label: 'Catálogo General', key: 'tienda' },
      { href: '/lens', label: 'Lens IA', key: 'lens' },
      { href: '/mapa', label: 'Mapa IA', key: 'mapa' }
    ];
  }

  // D. Experiencia Pública (predeterminada) — Enfocada, limpia y sin redundancias
  return [
    { href: '/', label: 'Inicio', key: 'inicio' },
    { href: '/tienda', label: 'Mercado B2B / B2C', key: 'tienda' },
    { href: '/lens', label: 'Lens IA', key: 'lens' },
    { href: '/mapa', label: 'Mapa de Productores', key: 'mapa' }
  ];
}

function currentKey(pathname) {
  if (pathname === '/' || pathname === '/index.html') return 'inicio';
  const clean = pathname.replace(/^\//, '').split(/[\/?#]/)[0];
  return clean || 'inicio';
}

function initNavigation() {
  let favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }
  favicon.type = 'image/png';
  favicon.href = '/public/Logo.png';

  const host = document.querySelector('[data-nex-navigation]');
  if (!host) return;

  const profile = getAuthProfile();
  const navItems = getNavigationItems(profile);
  const active = currentKey(window.location.pathname);

  let ctaHtml = '';
  if (profile) {
    const roleTag = profile.role === 'admin' ? 'Verificador' : profile.role === 'proveedor' ? 'Proveedor' : 'Tiendita';
    const shortName = (profile.business_name || 'Mi negocio').split(' ')[0];
    const publishButton = profile.role === 'proveedor'
      ? '<a class="nex-nav-publish-btn" href="/emprendedores?tab=tabCatalog&publicar=1" aria-label="Publicar un nuevo producto">+ Publicar producto</a>'
      : '';
    ctaHtml = `
      <div class="nex-nav-auth-wrapper">
        ${publishButton}
        <a class="nav-cta nex-nav-user-pill" href="/emprendedores" title="${profile.business_name}">
          <span class="user-status-dot">●</span>
          <span class="user-name">${shortName}</span>
          <span class="role-badge">(${roleTag})</span>
        </a>
        <button id="navLogoutBtn" type="button" class="nav-logout-btn" aria-label="Cerrar sesión">Salir</button>
      </div>
    `;
  } else {
    // Un solo botón elegante en el navbar para iniciar sesión o registrarse
    ctaHtml = `
      <div class="nex-nav-auth-wrapper">
        <a class="nex-nav-auth-btn" href="/login" id="navAuthBtn" aria-label="Iniciar sesión o registrarse">
          <span class="nex-nav-auth-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </span>
          <span class="nex-nav-auth-text">Acceso / Registro</span>
        </a>
      </div>
    `;
  }

  // Asegurar anclaje accesible para saltar al contenido principal
  const mainEl = document.querySelector('main');
  if (mainEl && !mainEl.id) {
    mainEl.id = 'mainContent';
    mainEl.setAttribute('tabindex', '-1');
  }

  host.innerHTML = `
    <a href="#mainContent" class="nex-skip-link">Saltar al contenido principal</a>
    <div style="display:flex;align-items:center;gap:10px;">
      <a class="logo nex-logo" href="/" aria-label="NEX24, inicio"><img src="/public/Logo.png" alt="NEX24" /></a>
      <span class="nex-badge nex-badge-verified" style="font-size:10px;padding:2px 8px;letter-spacing:0.5px;">DURANGO</span>
    </div>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-navigation" aria-label="Abrir menú de navegación">
      <span></span><span></span><span></span>
    </button>
    <nav id="main-navigation" class="main-navigation" aria-label="Navegación principal">
      ${navItems.map((item) => {
        const isCurrent = item.key === active;
        return `<a href="${item.href}"${isCurrent ? ' class="active" aria-current="page"' : ''}>${item.label}</a>`;
      }).join('')}
      <div class="nex-nav-mobile-auth">
        ${!profile ? `<a href="/login" class="nex-nav-auth-btn" style="width:100%;justify-content:center;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user" style="margin-right:6px;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Acceso / Registro</a>` : ''}
      </div>
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

/**
 * Footer Corporativo Estandarizado — Garantiza que "Cómo funciona" viva en el pie de página
 */
function initFooter() {
  // Buscar si ya existe un footer en la página o crear uno
  let footer = document.querySelector('footer.nex-footer, footer[data-nex-footer], footer');
  if (!footer) {
    footer = document.createElement('footer');
    document.body.appendChild(footer);
  }
  footer.className = 'nex-footer';
  footer.setAttribute('data-nex-footer', 'true');
  footer.innerHTML = `
    <div class="nex-container">
      <div class="nex-footer-main">
        <div class="nex-footer-col">
          <a class="logo nex-logo nex-logo-footer" href="/" aria-label="NEX24, inicio"><img src="/public/Logo.png" alt="NEX24"></a>
          <p style="font-size:13px;max-width:320px;line-height:1.6;color:#B4C4BC;margin-bottom:14px;">
            Plataforma comercial inteligente B2B + B2C que conecta directamente a productores locales de Durango, tienditas de barrio y consumidores. Comercio transparente 24/7 sin intermediarios.
          </p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <span class="nex-badge nex-badge-verified">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check" style="margin-right:4px;"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
              14 Productores Verificados
            </span>
            <span class="nex-badge nex-badge-lime">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles" style="margin-right:4px;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              Lens IA Integrado
            </span>
          </div>
        </div>

        <div class="nex-footer-col">
          <h4>Mercado & Mayoreo</h4>
          <ul class="nex-footer-links">
            <li><a href="/tienda">Catálogo comercial B2B / B2C</a></li>
            <li><a href="/tienda?tipo=mayoreo">Abastecimiento al mayoreo (-20%)</a></li>
            <li><a href="/tienda?categoria=cafe">Café artesanal de altura</a></li>
            <li><a href="/tienda?categoria=queso">Quesos menonitas Nuevo Ideal</a></li>
            <li><a href="/tienda?categoria=miel">Miel pura del Mezquital</a></li>
            <li><a href="/tienda?categoria=mezcal">Mezcal tradicional de Durango</a></li>
          </ul>
        </div>

        <div class="nex-footer-col">
          <h4>Tecnología Comercial</h4>
          <ul class="nex-footer-links">
            <li><a href="/lens">Lens IA (Escáner visual inteligente)</a></li>
            <li><a href="/mapa">Mapa interactivo de productores</a></li>
          </ul>
        </div>

        <div class="nex-footer-col">
          <h4>Ecosistema & Soporte</h4>
          <ul class="nex-footer-links">
            <li>
              <a href="/propuesta" style="color:var(--nex-lime);font-weight:700;display:inline-flex;align-items:center;gap:6px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lightbulb"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                Cómo funciona la red NEX24
              </a>
            </li>
            <li><a href="/login">Portal de Acceso Comercial</a></li>
            <li><a href="/registro">Registrar mi negocio o tiendita</a></li>
            <li><a href="/emprendedores">Panel de gestión de pedidos</a></li>
            <li>
              <a href="https://wa.me/5216180000001?text=Hola%20NEX24%20solicito%20asistencia%20comercial" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                Soporte local por WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="nex-footer-bottom">
        <div>© 2026 NEX24. Todos los derechos reservados · Durango, Dgo., México.</div>
        <div>Impulsando el comercio local con inteligencia artificial, mayoreo directo y transparencia.</div>
      </div>
    </div>
  `;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initFooter();
  });
} else {
  initNavigation();
  initFooter();
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
  overlay.innerHTML = `<div class="nex-loader-content"><div class="nex-three-body" aria-hidden="true"><div class="nex-three-body__dot"></div><div class="nex-three-body__dot"></div><div class="nex-three-body__dot"></div></div><img class="nex-loader-logo" src="/public/Logo.png" alt="NEX24" /></div>`;
  document.body.appendChild(overlay);

  let hideTimer = null;
  window.nexLoader = {
    show(label) {
      clearTimeout(hideTimer);
      const brand = overlay.querySelector('.nex-loader-brand');
      if (brand) {
        brand.style.display = 'none';
      }
      overlay.setAttribute('aria-label', label || 'Cargando NEX24');
      overlay.classList.add('active');
      document.documentElement.classList.add('nex-loading');
    },
    hide() {
      clearTimeout(hideTimer);
      overlay.classList.remove('active');
      document.documentElement.classList.remove('nex-loading');
      hideTimer = setTimeout(() => {
        if (overlay.classList.contains('active')) return;
        overlay.setAttribute('aria-hidden', 'true');
      }, 300);
    }
  };
})();

document.addEventListener('readystatechange', () => {
  if (document.readyState !== 'complete') {
    window.nexLoader.show();
  } else {
    window.nexLoader.hide();
  }
});

