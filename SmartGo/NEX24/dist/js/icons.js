/**
 * NEX24 — Sistema Oficial de Iconos Lucide Icons / Heroicons y Fallback Inteligente
 * Iconografía empresarial de alto rendimiento con cobertura universal:
 * 1. Iconos vectoriales Lucide para controles, botones, tablas y navegación.
 * 2. Iconos vectoriales para categorías agroindustriales y comerciales reconocidas.
 * 3. Fallback inteligente a emojis temáticos para productos o insumos específicos
 *    cuando no exista un icono vectorial representativo.
 */
(function(window) {
  'use strict';

  // Catálogo Vectorial Oficial de Lucide Icons (SVG puros optimizados)
  const ICONS = {
    // Categorías y Productos Regionales
    'coffee': '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h12Z"/><path d="M6 2v2"/><path d="M17 10h2a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-2"/>',
    'cheese': '<path d="m3 13 18-5v11H3z"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="12" r="1.5"/><circle cx="12" cy="16" r="1.2"/>',
    'milk': '<path d="M8 2h8"/><path d="M9 2v3a4 4 0 0 1-.8 2.4L6.4 8.6A4 4 0 0 0 6 11v8a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-8a4 4 0 0 0-.4-2.4l-.8-1.2A4 4 0 0 1 15 5V2"/><path d="M6 13h12"/>',
    'droplet': '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    'flame': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    'wine': '<path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/>',
    'wheat': '<path d="M2 22 16 8"/><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z"/><path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/>',
    'croissant': '<path d="m4.6 13.1 5-5a2.1 2.1 0 0 1 3 0l5.4 5.4a2.1 2.1 0 0 1 0 3l-5 5a2.1 2.1 0 0 1-3 0l-5.4-5.4a2.1 2.1 0 0 1 0-3Z"/><path d="m8.5 8.5 7 7"/>',
    'briefcase': '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    'sparkles': '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
    'candy': '<path d="m9.5 7.5-2-2a4.95 4.95 0 1 0-7 7l2 2a4.95 4.95 0 0 0 7-7Z"/><path d="m14 16.5 2 2a4.95 4.95 0 0 0 7-7l-2-2a4.95 4.95 0 0 0-7 7Z"/><path d="m14 7.5 2.5-2.5"/><path d="m7.5 14-2.5 2.5"/><circle cx="12" cy="12" r="3"/>',
    'cookie': '<path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/>',
    'cup-soda': '<path d="m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8"/><path d="M5 8h14"/><path d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0"/><path d="m12 8 1-6h2"/>',
    'beef': '<circle cx="12.5" cy="8.5" r="2.5"/><path d="M12.5 2a6.5 6.5 0 0 0-6.22 4.6c-1.1 3.13-.78 3.9-3.18 6.08A3 3 0 0 0 5 18c4 0 8.4-1.8 11.4-4.3A6.5 6.5 0 0 0 12.5 2Z"/><path d="m18.5 6 2.19 4.5a6.48 6.48 0 0 1 .31 2 6.5 6.5 0 0 1-11 4.6"/>',
    'palette': '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    'circle-dot': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>',
    'apple': '<path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>',
    'sprout': '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',

    // Navegación, Sistema y Acciones
    'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    'camera': '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    'map': '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6z"/><path d="M9 3v15"/><path d="M15 6v15"/>',
    'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    'crosshair': '<circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/>',
    'check': '<path d="M20 6 9 17l-5-5"/>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    'shopping-cart': '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'log-in': '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/>',
    'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
    'mail': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    'eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
    'building': '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
    'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    'truck': '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    'package': '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    'clipboard-list': '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
    'history': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    'lightbulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
    'alert-circle': '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'rotate-ccw': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>',
    'bar-chart-3': '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    'trending-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',

    // Nuevos controles de UI / Botones / Tablas
    'plus': '<path d="M5 12h14"/><path d="M12 5v14"/>',
    'minus': '<path d="M5 12h14"/>',
    'trash-2': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    'trash': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    'external-link': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    'filter': '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    'sliders': '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="17" x2="23" y1="16" y2="16"/>',
    'printer': '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
    'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    'send': '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    'tag': '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    'dollar-sign': '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    'calendar': '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
    'help-circle': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-up': '<path d="m18 15-6-6-6 6"/>',
    'layers': '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    'compass': '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
    'award': '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    'globe': '<circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    'zap': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    'box': '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    'scale': '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    'settings': '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'
  };

  /**
   * Genera el elemento SVG de Lucide Icons
   * @param {string} name Nombre del icono
   * @param {object} options Opciones de personalización
   * @returns {string} Markup SVG
   */
  function createLucideIcon(name, options = {}) {
    const iconName = String(name || '').toLowerCase().trim();
    const paths = ICONS[iconName] || ICONS['sprout'];
    const size = options.size || (options.width ? null : 18);
    const width = options.width || size || 18;
    const height = options.height || size || 18;
    const className = ['lucide', `lucide-${iconName}`, options.className || ''].filter(Boolean).join(' ');
    const strokeWidth = options.strokeWidth || 2;
    const style = options.style ? ` style="${options.style}"` : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}" aria-hidden="true"${style}>${paths}</svg>`;
  }

  // Mapeo unificado de categorías duranguenses a nombres de iconos Lucide vectoriales
  const CATEGORY_LUCIDE_MAP = {
    cafe: 'coffee',
    queso: 'cheese',
    lacteos: 'milk',
    leche: 'milk',
    miel: 'droplet',
    mezcal: 'flame',
    panaderia: 'croissant',
    pan: 'croissant',
    salsas: 'flame',
    chile: 'flame',
    cuero: 'briefcase',
    talabarteria: 'briefcase',
    cosmetica: 'sparkles',
    dulces: 'candy',
    botana: 'cookie',
    botanas: 'cookie',
    bebidas: 'cup-soda',
    carnes: 'beef',
    carne: 'beef',
    cecina: 'beef',
    artesania: 'palette',
    textiles: 'palette',
    tortillas: 'circle-dot',
    manzana: 'apple',
    manzanas: 'apple',
    fruta: 'apple',
    frutas: 'apple',
    agro: 'sprout',
    agricola: 'sprout'
  };

  // Diccionario exhaustivo de fallbacks a emojis para insumos y productos específicos
  // que no cuenten con un icono vectorial directo en el catálogo Lucide
  const PRODUCT_EMOJIS = {
    // Alimentos y bebidas
    cafe: '☕',
    queso: '🧀',
    miel: '🍯',
    mezcal: '🥃',
    panaderia: '🥖',
    pan: '🥖',
    bolillo: '🥖',
    salsas: '🌶️',
    salsa: '🌶️',
    chile: '🌶️',
    chiles: '🌶️',
    cuero: '👜',
    talabarteria: '👜',
    cosmetica: '🧴',
    dulces: '🍬',
    dulce: '🍬',
    botana: '🥨',
    botanas: '🥨',
    bebidas: '🥤',
    carnes: '🥩',
    carne: '🥩',
    cecina: '🥩',
    chorizo: '🌭',
    artesania: '🧶',
    tortillas: '🫓',
    tortilla: '🫓',
    gorditas: '🫓',

    // Frutas, hortalizas y campo
    manzana: '🍎',
    manzanas: '🍎',
    pera: '🍐',
    fruta: '🍇',
    frutas: '🍇',
    verdura: '🥬',
    verduras: '🥬',
    hortalizas: '🥬',
    lechuga: '🥬',
    tomate: '🍅',
    aguacate: '🥑',
    nuez: '🥜',
    nueces: '🥜',
    huevo: '🥚',
    huevos: '🥚',
    pescado: '🐟',
    mariscos: '🦐',
    pollo: '🍗',
    jamon: '🥓',
    tocino: '🥓',
    vino: '🍷',
    cerveza: '🍺',
    sidra: '🍾',
    licor: '🍸',
    te: '🍵',
    chocolate: '🍫',
    cacao: '🍫',
    mermelada: '🍓',
    aceite: '🫒',
    oliva: '🫒',
    flores: '💐',
    plantas: '🪴',
    semillas: '🌱',
    ropa: '👕',
    calzado: '👞',
    madera: '🪵',
    ceramica: '🏺',
    alfareria: '🏺',
    joyeria: '💍',
    jabon: '🧼',
    tamales: '🫔',
    tacos: '🌮',
    frijol: '🫘',
    maiz: '🌽',
    champiñones: '🍄',
    hongos: '🍄',
    arroz: '🍚',
    harina: '🌾',
    avena: '🥣',
    granola: '🥣',
    cajeta: '🍮',
    ate: '🍬'
  };

  /**
   * Resuelve el icono adecuado para un producto o categoría:
   * 1. Verifica si existe un icono vectorial Lucide representativo.
   * 2. Si no existe para el producto requerido, recurre a un emoji temático elegante.
   * 
   * @param {string} productOrCategory Nombre del producto o identificador de categoría
   * @param {object} options Opciones de personalización ({ size, className, style, preferEmoji })
   * @returns {string} Markup HTML (SVG de Lucide o span con emoji enriquecido)
   */
  function getProductIcon(productOrCategory, options = {}) {
    const raw = String(productOrCategory || '').trim();
    const normalized = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const size = options.size || (options.width ? null : 22) || 22;

    // 1. Si no se fuerza emoji, buscar correspondencia en Lucide Icons
    if (!options.preferEmoji) {
      // Coincidencia directa por mapa de categorías
      const mappedLucide = CATEGORY_LUCIDE_MAP[normalized];
      if (mappedLucide && ICONS[mappedLucide]) {
        return createLucideIcon(mappedLucide, options);
      }

      // Coincidencia directa por nombre de icono Lucide
      if (ICONS[normalized]) {
        return createLucideIcon(normalized, options);
      }

      // Coincidencia por palabra clave dentro del nombre del producto
      const words = normalized.split(/[\s,._\-/]+/);
      for (const w of words) {
        if (CATEGORY_LUCIDE_MAP[w] && ICONS[CATEGORY_LUCIDE_MAP[w]]) {
          return createLucideIcon(CATEGORY_LUCIDE_MAP[w], options);
        }
        if (ICONS[w]) {
          return createLucideIcon(w, options);
        }
      }
    }

    // 2. Si no hay icono en Lucide para el producto requerido: Fallback inteligente a emoji
    let emoji = PRODUCT_EMOJIS[normalized];
    if (!emoji) {
      for (const [key, em] of Object.entries(PRODUCT_EMOJIS)) {
        if (normalized.includes(key)) {
          emoji = em;
          break;
        }
      }
    }

    // Si no coincide con ninguna palabra clave, usar emoji comercial por defecto
    if (!emoji) {
      emoji = '📦';
    }

    const className = ['product-fallback-emoji', options.className || ''].filter(Boolean).join(' ');
    const extraStyle = options.style ? `;${options.style}` : '';
    const styleAttr = `display:inline-flex;align-items:center;justify-content:center;font-size:${size}px;line-height:1;vertical-align:middle${extraStyle}`;
    const safeLabel = raw.replace(/"/g, '&quot;');

    return `<span class="${className}" style="${styleAttr}" role="img" aria-label="${safeLabel}">${emoji}</span>`;
  }

  function getCategoryLucideIcon(category, options = {}) {
    return getProductIcon(category, options);
  }

  function renderLucideIcons(root = document) {
    if (!root || !root.querySelectorAll) return;
    const elements = root.querySelectorAll('[data-lucide]');
    elements.forEach((el) => {
      const name = el.getAttribute('data-lucide');
      const size = el.getAttribute('data-size') || 18;
      const strokeWidth = el.getAttribute('data-stroke') || 2;
      const customClass = el.getAttribute('class') || '';
      el.outerHTML = createLucideIcon(name, {
        size,
        strokeWidth,
        className: customClass
      });
    });
  }

  // Exponer al objeto global window
  window.lucideIcons = ICONS;
  window.CATEGORY_LUCIDE_MAP = CATEGORY_LUCIDE_MAP;
  window.PRODUCT_EMOJIS = PRODUCT_EMOJIS;
  window.createLucideIcon = createLucideIcon;
  window.getProductIcon = getProductIcon;
  window.getCategoryLucideIcon = getCategoryLucideIcon;
  window.renderLucideIcons = renderLucideIcons;

  // Compatibilidad con la API estándar de Lucide
  window.lucide = {
    createIcons: renderLucideIcons
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => renderLucideIcons());
    } else {
      renderLucideIcons();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
