# NEX24 — MASTER PRODUCT TRANSFORMATION
## Documento de Seguimiento y Bitácora de Transformación

---

## 1. ESTADO DE LAS FASES

| Fase | Nombre | Estado | Notas |
|---|---|---|---|
| **Fase 0** | Auditoría y Descubrimiento | **COMPLETADA** | Auditoría técnica, de producto y UX/UI finalizada. Inventario completo generado. |
| **Fase 1** | Arquitectura UX y Design System | **COMPLETADA** | Tokens corporativos unificados en `design-system.css`, biblioteca de componentes SaaS, y navegación adaptativa a roles en `navigation.js`. |
| **Fase 2** | Rediseño de la Página Principal | **COMPLETADA** | Transformación completa de `index.html` con las 12 secciones estratégicas, buscador, banner Lens IA y catálogo real. |
| **Fase 3** | Marketplace Inteligente | **COMPLETADA** | Unificación de catálogo (`/api/catalogo`), filtros por búsqueda, categoría, zona y mayoreo/menudeo, ficha técnica y cotizador con WhatsApp. |
| **Fase 4** | Experiencia B2B y B2C | **COMPLETADA** | Selector de modo comercial, precios escalonados (tiers), lista de abastecimiento B2B recurrente e historial de cotizaciones con folio. |
| **Fase 5** | Panel del Proveedor | **COMPLETADA** | Suite comercial en `/emprendedores` con Dashboard, gestión de catálogo CRUD, control de suministro, cotizaciones con cambio de estado y respuesta por WhatsApp. |
| **Fase 6** | Panel del Comprador | *Pendiente* | Próxima fase autorizable. |
| **Fase 7** | Lens IA | *Pendiente* | Optimización visual y consolidación con catálogo. |
| **Fase 8** | Experiencia Transversal | *Pendiente* | Feedback, estados globales, notificaciones. |
| **Fase 9** | Administración y Confianza | *Pendiente* | Moderación y verificación de negocios. |
| **Fase 10** | Responsive Design y Accesibilidad | *Pendiente* | Adaptación móvil integral y ARIA. |
| **Fase 11** | Optimización y Seguridad | *Pendiente* | Performance, caché y auditoría de seguridad. |
| **Fase 12** | QA y Validación Final | *Pendiente* | Pruebas de regresión E2E. |

---

## 2. ARQUITECTURA DESCUBIERTA (FASE 0)

### 2.1. Backend
- **Entorno de ejecución:** Node.js v24.14.1 (ES Modules nativos, `"type": "module"` en `package.json`).
- **Framework HTTP:** Express v4.21.0 con middlewares: `cors`, `multer` (gestión de memoria 8 MB para imágenes), `dotenv`.
- **Inteligencia Artificial (Lens):** Google Gemini Vision API (`gemini-3.5-flash-lite`, REST `/v1beta/models/...:generateContent`), con fallback automático determinista (`vision.js`) con perfiles de demo (`cafe`, `miel`, `queso`, `pan`, `mezcal`) que garantizan cero caídas sin conexión.
- **Matching y Algorítmica:** Algoritmo ponderado de coincidencia semántica por categoría (+3) y keywords (+1 hasta máx 4) con desempate por distancia ortodrómica Haversine (`matcher.js`).
- **Persistencia & Autenticación:** 
  - Catálogo local base: `productores.json` (14 productores duranguenses detallados con datos B2B y B2C).
  - Capa Supabase: PostgreSQL + Auth con `@supabase/supabase-js` v2.119.2 (tabla `public.profiles` con RLS, schema en `supabase.sql`).
- **Servidor dual:** `server.js` sirve tanto los endpoints REST de la API como los archivos estáticos frontend en el mismo puerto (default: 3001).

### 2.2. Frontend
- **Tecnología:** HTML5 semántico, Vanilla JavaScript modular (IIFE / ES6), CSS3 moderno.
- **Sistema de estilos:** Fragmentado en 5 archivos (`styles.css`, `design.css`, `panel.css`, `lens.css`, `registro.css`) con variables en `:root` y fuentes de Google Fonts (`DM Sans`).
- **Navegación:** Controlada centralizadamente mediante inyección de DOM con `js/navigation.js` (`[data-nex-navigation]`).
- **Estado en cliente:** `localStorage` (`nex24-state`, `nex24-supabase-session`, `nex24-current-account`, `lensApi`).

---

## 3. INVENTARIO DE FUNCIONALIDADES Y CLASIFICACIÓN

| Módulo | Funcionalidad | Clasificación | Detalle del Diagnóstico |
|---|---|---|---|
| **Página Pública** | Landing Page (`index.html`) | *Implementada parcialmente* | Presenta un Hero y enlaces, pero mezcla concepto de autoservicio físico 24/7 con plataforma digital; carece de propuesta B2B/B2C clara. |
| **Marketplace** | Catálogo de productos (`/productos`) | *Con errores / Incompleto* | Llama a `/api/registros` que falla con 503 si Supabase no está enlazado o queda vacío si no hay negocios aprobados. Ignora `productores.json`. |
| **Marketplace** | Tienda interactiva (`/tienda`) | *Con errores / Visual* | Muestra catálogo pero el carrito de compras está inhabilitado ("Pago no disponible"). |
| **B2B** | Precios de mayoreo y capacidad | *Solamente visual en datos* | Existen en `productores.json` (`precio_mayoreo`, `capacidad_semanal`, `rutas_entrega`), pero la interfaz no ofrece cotizaciones ni compras por volumen. |
| **B2C** | Descubrimiento local y compra | *Parcial* | Se muestran productos y enlaces a WhatsApp/Maps, pero no hay flujo de compra cerrado. |
| **Lens IA** | Búsqueda por imagen (`/lens`) | **Implementada y funcional** | Flujo completo: subida, compresión canvas a 1280px, llamada API, Gemini/Mock fallback, cálculo Haversine y tarjetas de coincidencia. |
| **Autenticación** | Registro (`/registro`) | **Funcional con Supabase** | Formulario con selección de rol (tiendita / proveedor), crea usuario y perfil con estado `pending`. |
| **Autenticación** | Inicio de sesión (`/login`) | **Funcional con Supabase** | Valida credenciales contra Supabase Auth y almacena sesión JWT en `localStorage`. |
| **Panel Negocio** | Dashboard (`/emprendedores`) | *Solamente visual / Limitada* | Si hay sesión activa muestra campos de texto del perfil. No tiene gestión de inventario, ni pedidos, ni catálogo. |
| **Comprador** | Panel de comprador | *No implementada* | No existe vista ni rol para comprador recurrente o listas de abastecimiento. |
| **Pedidos** | Carrito y checkout | *No implementada* | El carrito está congelado intencionalmente en `js/app.js`. |
| **Admin** | Moderación y aprobación | *No implementada* | Los negocios registrados quedan en `pending` sin panel administrativo para aprobarlos. |

---

## 4. PROBLEMAS CRÍTICOS Y RIESGOS TÉCNICOS DETECTADOS

1. **Riesgo Git / Estructura del proyecto:** El repositorio Git se encuentra en el directorio padre `/home/jona/Documentos/project/Hackathon-2026`, con ramas compartidas (`main`, `Rbn1806`). Existen archivos modificados de la sesión previa. Se debe actuar con máxima cautela para no alterar historiales ni borrar trabajo previo.
2. **Desconexión entre Catálogo y Tienda:** Mientras que Lens IA utiliza exitosamente el catálogo de 14 productores con información de mayoreo y menudeo (`productores.json` / `matcher.js`), la tienda (`/tienda`) y el mercado (`/productos`) dependen exclusivamente de `/api/registros` (Supabase). Si Supabase no tiene registros aprobados o no está configurado, la tienda queda completamente en blanco.
3. **Cuello de botella de Aprobación (`pending`):** La API de registro guarda perfiles con `status: 'pending'`. El frontend filtra únicamente por `status === 'approved'`. Al no existir panel administrativo de moderación, ningún nuevo negocio registrado puede publicarse automáticamente.
4. **Dependencia frágil de servicios externos:** Si falla la conexión a Supabase o no existe `.env`, la aplicación no debe degradarse catastróficamente. Debe implementarse una estrategia de almacenamiento híbrido (catálogo base unificado + sincronización Supabase cuando esté disponible).

---

## 5. DECISIONES DE DISEÑO Y ARQUITECTURA PROPUESTAS

1. **Unificación de Catálogo:** Consolidar una única fuente de verdad para el catálogo comercial que sirva tanto a Lens IA como a la tienda B2C y al abastecimiento B2B, combinando los 14 productores verificados de Durango con los negocios dados de alta en Supabase.
2. **Design System Consistente:**
   - Paleta corporativa institucional: Verde bosque (`#153C30`), Verde esmeralda (`#246B4B`), Verde lima (`#B8F36B`), Fondo neutro cálido (`#F5F6F1`), Superficies blancas (`#FFFFFF`), Textos de alto contraste (`#202923` y `#68736C`).
   - Componentes tipográficos estandarizados con base 'DM Sans'.
   - Reducción de duplicidades CSS eliminando la sobreescritura mediante `!important` y centralizando tokens en variables semánticas.
3. **Diferenciación B2B vs B2C:**
   - Modo B2C: Enfoque en menudeo, disponibilidad inmediata, distancia en km, contacto directo y compra simple.
   - Modo B2B: Enfoque en mayoreo, volumen mínimo, capacidad de suministro semanal, rutas logísticas y solicitud de cotizaciones formal.

---

## 6. PRUEBAS Y VALIDACIONES EJECUTADAS (FASE 0)

- `npm test`: **17 pruebas exitosas** (Catálogo, Haversine, Matching semántico, Fallback de demo, Detección mock).
- `npm run build`: Ejecución correcta de copia estática hacia `/dist`.
- `git status` en repositorio raíz: Identificados archivos modificados y sin seguimiento sin alterar el árbol de trabajo.


---

## 7. FASE 1 — ARQUITECTURA UX Y DESIGN SYSTEM (COMPLETADA)

### 7.1. Tokens y Biblioteca de Componentes Creados (`css/design-system.css`)
- **Tokens Semánticos:** Paleta corporativa empresarial:
  - Verde bosque corporativo: `--nex-forest` (`#153C30`), `--nex-forest-dark` (`#0D2820`), `--nex-forest-light` (`#1E4F3F`).
  - Verde esmeralda para acción: `--nex-emerald` (`#246B4B`), `--nex-emerald-dark` (`#195238`).
  - Verde lima de acento e IA: `--nex-lime` (`#B8F36B`), `--nex-lime-soft` (`#E5F9C8`), `--nex-lime-hover` (`#A5E852`).
  - Fondo y superficies: `--nex-bg` (`#F5F6F1`), `--nex-surface` (`#FFFFFF`), `--nex-surface-muted` (`#EAEFE6`).
  - Textos de alto contraste: `--nex-text-primary` (`#18241D`), `--nex-text-secondary` (`#5E6D64`), `--nex-text-muted` (`#829288`).
  - Acentos B2B: `--nex-b2b` (`#1B5B7D`), `--nex-b2b-bg` (`#EBF4F9`).
  - Estados funcionales: éxito (`#1E7E48`), alerta (`#B37400`), peligro (`#C53030`), información (`#1D648A`).
- **Escala Tipográfica & Espaciado:** Basada en *DM Sans*, escalas modulares de `--space-1` (4px) a `--space-16` (64px), elevaciones mediante sombras sutiles sin saturación.
- **Componentes Base Estructurados:** Botones (`.nex-btn`, `.btn-primary`, `.btn-accent`, `.btn-secondary`, `.btn-b2b`), Tarjetas (`.nex-card`, `.card`), Badges semánticos (`.nex-badge-b2b`, `.nex-badge-b2c`, `.nex-badge-verified`), Formularios e inputs (`.nex-form-input`, `.nex-form-label`), Tablas empresariales (`.nex-table`, `.data-table`), Alertas (`.nex-alert`) y Skeletons de carga (`.nex-skeleton`).

### 7.2. Arquitectura de Navegación Adaptativa (`js/navigation.js`)
- Unificación de los enlaces redundantes (`/productos` y `/tienda` orientados ahora hacia el Mercado inteligente).
- Soporte para 4 experiencias de usuario:
  - **Pública:** Inicio, Mercado, Proveedores, Lens IA ✨, Cómo funciona, Registro, Iniciar sesión.
  - **Comprador / Tiendita:** Mi Tiendita, Abastecimiento B2B, Proveedores Locales, Lens IA ✨, Cerrar sesión.
  - **Proveedor:** Panel Proveedor, Catálogo, Red Comercial, Lens IA ✨, Cerrar sesión.
  - **Administrador:** Integrable en próximas fases sobre la misma infraestructura.
- Selector de menú móvil con accesibilidad ARIA completa (`aria-expanded`, `aria-controls`, `aria-label`).


---

## 8. FASE 2 — REDISEÑO DE LA PÁGINA PRINCIPAL (COMPLETADA)

### 8.1. Transformación de `index.html`
- **12 Secciones Implementadas:**
  1. **Navbar:** Inyección centralizada adaptativa con rol y sesión activa vía `js/navigation.js`.
  2. **Hero Empresarial:** Mensaje de impacto *"Conecta con el comercio que tienes cerca"* y subtítulo *"Encuentra. Conecta. Abastécete."* con diseño corporativo en Verde Bosque (`#153C30`) y detalles Lima (`#B8F36B`).
  3. **Buscador Principal Comercial:** Búsqueda textual directa conectada con parámetros URL a la tienda.
  4. **Banner Destacado Lens IA:** Promoción del valor tecnológico con accesos de prueba rápida por categoría comercial (`café`, `miel`, `queso`, `pan`).
  5. **Categorías Comerciales:** Grid interactivo de 8 categorías duranguenses con enlaces a la tienda filtrada.
  6. **Productos Destacados:** Muestra de 4 productos reales de `productores.json` con desglose explícito de precio consumidor (menudeo) y precio negocio (mayoreo).
  7. **Segmentación Dual B2B y B2C:** Tarjetas comparativas con valor y beneficios concretos para compradores empresariales y consumidores finales.
  8. **Flujo de 3 Pasos:** Explicación clara de la dinámica operativa (1. Encuentra o Escanea -> 2. Compara y Selecciona -> 3. Conecta y Abastécete).
  9. **Cobertura Territorial:** Detalle de zonas de Durango Capital y municipios productores (Canatlán, Nuevo Ideal, Nombre de Dios, El Mezquital).
  10. **Beneficios Comerciales:** Comercio directo, precios justos, sin intermediarios y disponibilidad 24/7.
  11. **Footer Multicolumna:** Enlaces organizados por Mercado, Tecnología y Negocios, con datos de contacto y créditos regionales.


---

## 9. FASE 3 — MARKETPLACE INTELIGENTE (COMPLETADA)

### 9.1. Endpoint Unificado `/api/catalogo` (`server.js`)
- Creación del endpoint `GET /api/catalogo` que consolida los 14 productores locales verificados de Durango (`productores.json`) junto con cualquier registro de comercio aprobado en Supabase (`public.profiles`).
- Resiliencia garantizada: si Supabase no está configurado o falla la red, el sistema opera al 100% con el catálogo base verificado sin generar pantallas blancas o errores 503.

### 9.2. Marketplace B2B + B2C (`pages/tienda.html` y `js/app.js`)
- **Filtros Comerciales Completos:**
  - Búsqueda textual en tiempo real (nombre, productor, categoría, zona, descripción).
  - Filtro por Modo Comercial: *Todos*, *Menudeo (Consumidor)*, *Mayoreo (B2B / Negocios)*.
  - Filtro por 14 categorías comerciales con chips interactivos.
  - Filtro por zona geográfica de Durango (Centro, Nuevo Ideal, Nombre de Dios, Canatlán, etc.).
  - Ordenamiento por destacados, precio menor, precio mayor o nombre alfabético.
- **Tarjetas de Producto Enriquecidas:**
  - Desglose de precio consumidor vs precio de mayoreo y porcentaje de ahorro.
  - Capacidad semanal de producción y rutas logísticas de entrega.
  - Badge de verificación local.
  - Acciones para agregar al pedido y botón para abrir la Ficha Comercial.
- **Ficha Técnica y Comercial (Modal):**
  - Muestra detalles completos del producto, productor, condiciones de suministro y enlace a Google Maps.
  - Contacto directo al WhatsApp del productor.
- **Cotizador / Carrito de Abastecimiento:**
  - Deja de ser una interfaz estática inhabilitada.
  - Cálculo automático de cantidades, subtotales y activación automática de precio de mayoreo por volumen (≥ 5 unidades).
  - Generador de mensaje comercial formateado y enlace directo a WhatsApp.
  - Generador de cotización formal descargable/imprimible en PDF con número de folio institucional.


---

## 10. FASE 4 — EXPERIENCIA B2B Y B2C (COMPLETADA)

### 10.1. Segmentación Comercial en el Marketplace
- **Selector de Modo en Tiempo Real:** Switcher de experiencia `[ 🛒 Modo Consumidor (B2C) | 🏢 Modo Negocio (B2B) ]` en la cabecera de `/tienda` que adapta instantáneamente el enfoque del catálogo.
- **Diferenciación de Experiencias:**
  - **Experiencia B2C (Consumidor):** Prioriza el precio de menudeo por pieza, cercanía territorial y contacto ágil.
  - **Experiencia B2B (Negocios / Tienditas):** Destaca el precio de mayoreo comercial, condiciones de suministro semanal, rutas de despacho logístico y el botón de cotización por volumen.

### 10.2. Reglas Comerciales B2B y Precios Escalonados
- **Escala de Precios por Volumen:**
  - Nivel 1 (1 a 4 unidades): Precio estándar al menudeo.
  - Nivel 2 (5 a 19 unidades): Precio de mayoreo comercial (-15% a -25% de ahorro).
  - Nivel 3 (20+ unidades): Precio de distribuidor preferencial (-30% o más de ahorro).
- **Ficha Técnica B2B:** Incluye tabla de precios escalonados, MOQ (cantidad mínima de compra sugerida), tiempo de entrega (24h a 48h hábiles en Durango) y formas de pago comercial (SPEI, Contra-entrega o Efectivo).

### 10.3. Herramientas para el Comprador Empresarial
- **Lista de Abastecimiento Recurrente:**
  - Permite a los encargados de tienditas o restaurantes guardar insumos frecuentes bajo persistencia local (`nex24-b2b-supply-list`).
  - Acción de 1 clic para cargar todos los insumos al pedido/cotización.
- **Historial de Cotizaciones Comerciales:**
  - Registro de cotizaciones emitidas guardado localmente (`nex24-quotes-history`) con número de folio institucional (`NEX-XXXXXX`), fecha, resumen de productos y total, con capacidad para reabrir la cotización o reenviar el pedido formal por WhatsApp.


---

## 11. FASE 5 — PANEL DEL PROVEEDOR (COMPLETADA)

### 11.1. Suite de Gestión Comercial en `/emprendedores`
- Transformación del panel básico estático en una herramienta empresarial estructurada en 5 módulos operativos:
  1. **Dashboard General:** Métricas clave (productos publicados, capacidad semanal de suministro, cotizaciones recibidas, rutas logísticas cubiertas) y estado de verificación comercial en Durango.
  2. **Catálogo y Precios:** Interfaz completa para crear, editar y eliminar productos con precios de menudeo (B2C), mayoreo (B2B) y unidad de presentación. Modal `#productFormModal` funcional.
  3. **Capacidad y Suministro:** Configuración de capacidad de producción semanal (kg, piezas), tiempos de entrega y cobertura de rutas en Durango.
  4. **Cotizaciones y Pedidos Recibidos:** Gestión de solicitudes comerciales entrantes con folio, cliente, detalle de insumos, importe total, selector interactivo de estado (*Pendiente*, *Confirmado*, *Entregado*) y botón de respuesta inmediata por WhatsApp.
  5. **Configuración Comercial:** Edición de perfil, teléfono comercial, horarios de atención y dirección.

### 11.2. Resiliencia de Autenticación y Acceso Demo
- Soporte en `server.js` para modo de demostración sin conexión externa a Supabase (`proveedor@nex24.com` y `tiendita@nex24.com`), garantizando que la plataforma y el panel de proveedor puedan evaluarse y probarse sin interrupciones.
- Botones de acceso rápido de demostración en `pages/login.html` y `js/login.js`.


---

## 12. FASE 6 — PANEL DEL COMPRADOR / TIENDITA (COMPLETADA)

### 12.1. Suite de Abastecimiento para Comerciantes en `/emprendedores`
- Adaptación automática del panel de operaciones cuando el usuario autenticado tiene el rol `tiendita`:
  1. **Dashboard de Abasto:** 4 métricas en tiempo real: Insumos guardados en lista de abasto recurrente, cotizaciones comerciales emitidas con folio institucional, productores de Durango disponibles/vinculados y cálculo del ahorro acumulado estimado frente a precios de menudeo.
  2. **Comparador Multi-Proveedor de Insumos (`#buyerSupplyComparatorTable`):**
     - Permite al comerciante visualizar en una tabla comparativa cada insumo de su lista de abastecimiento recurrente (`nex24-b2b-supply-list`).
     - Desglosa el productor verificado de Durango que lo surte, su zona y rutas de entrega, comparación lado a lado de precio menudeo vs mayoreo comercial, y el porcentaje de ahorro por unidad.
     - Botón de acción directa *"💬 Pedir Mayoreo"* para contactar vía WhatsApp con mensaje pre-estructurado al productor local.
     - Estado vacío guiado con enlace directo para explorar el catálogo mayorista.
  3. **Historial de Cotizaciones Emitidas (`#buyerQuotesTable`):**
     - Tabla que lista las cotizaciones generadas con folio oficial, fecha de emisión, desglose de insumos solicitados, total estimado, ahorro económico y botón *"Ver Folio"* para reabrir la cotización formal en PDF/modal.
  4. **Directorio de Productores de Durango (`#buyerFavoritesGrid`):**
     - Tarjetas comerciales de los productores locales verificados (conectado al catálogo real con 14 productores), mostrando su capacidad de entrega semanal, zonas de cobertura y botones para contactar o explorar sus productos.
  5. **Configuración del Punto de Venta:** Formulario común para actualizar nombre del comercio, responsable, teléfono, zona y horarios de atención.

### 12.2. Arquitectura de Navegación Condicional por Roles
- Implementación de pestañas dinámicas en `#panelNavTabs`:
  - Si `profile.role === 'tiendita'`: Muestra las 5 secciones de Comprador (*Resumen y Abasto*, *Comparador Multi-Proveedor*, *Mis Cotizaciones*, *Productores de Durango*, *Datos del Negocio*).
  - Si `profile.role === 'proveedor'`: Muestra las 5 secciones de Proveedor (*Resumen General*, *Catálogo de Productos*, *Capacidad y Rutas*, *Pedidos Recibidos*, *Datos del Negocio*).


---

## 13. FASE 7 — LENS IA: RECONOCIMIENTO INTELIGENTE Y MATCHING COMERCIAL (COMPLETADA)

### 13.1. Arquitectura de Visión y Desacoplamiento Comercial
- **Separación de Responsabilidades:** Cumplimiento estricto de la regla del producto:
  - El motor de visión (Gemini Vision `gemini-3.5-flash-lite` con fallback mock determinista) identifica el producto comercial en la foto (categoría, marca, palabras clave y nivel de confianza).
  - El motor de búsqueda y matching (`matcher.js`) consulta exclusivamente la base de datos real (14 productores verificados de Durango) sin inventar proveedores, inventarios, precios ni coincidencias artificiales.
- **Enriquecimiento B2B en el Matcher:** Incorporación de campos logísticos (`capacidad_semanal` y `rutas_entrega`) en el formateador de resultados para que los compradores conozcan el volumen disponible y áreas de despacho.

### 13.2. Rediseño Visual de `/lens` con el Design System
- **Página Lens IA (`pages/lens.html` y `css/lens.css`):**
  - Hero moderno con paleta verde corporativa (`--nex-forest`, `--nex-emerald`, `--nex-lime`) y píldora de estado de conexión API en vivo (`#apiStatus`).
  - Dropzone de captura visual mejorada con soporte de arrastrar y soltar, compresión local en canvas en el navegador (`procesarArchivo`), y soporte para captura directa desde la cámara del dispositivo (`capture="environment"`).
  - Integración nativa de chips de prueba rápida (`data-demo="cafe"`, `miel`, `queso`, `pan`, `mezcal`) directamente en la tarjeta de entrada para evaluación inmediata sin necesidad de cámara.
  - Geolocalización asistida por GPS con cálculo de distancia real en kilómetros frente a la ubicación del productor o Centro de Durango.
  - Corrección de la leyenda errónea del pie de página que mencionaba falsamente a Supabase como única fuente: ahora aclara de forma transparente el cruce contra los 14 productores locales verificados de Durango.

### 13.3. Tarjetas de Coincidencia Comercial Enriquecidas
- **Diagnóstico Visual de IA:** Muestra icono dinámico de categoría, nombre bonito del producto, marca detectada, palabras clave y medidor de confianza porcentual.
- **Tarjetas de Productores Coincidentes:**
  - Identificación del negocio productor con badge `✓ Verificado`.
  - Desglose de precios duales: Menudeo para consumidores (B2C) y Mayoreo para tienditas (B2B) con badge de ahorro porcentual (ej. `-20% Mayoreo`).
  - Datos logísticos de suministro semanal y rutas de cobertura en Durango.
  - Botón *"🛒 Ver en Tienda"* vinculado directamente a `/tienda?q=...` para comprar o cotizar.
  - Botón directo de WhatsApp con mensaje pre-estructurado y enlace a Google Maps con coordenadas satelitales.


---

## 14. FASE 8 — EXPERIENCIA TRANSVERSAL (COMPLETADA)

### 14.1. Sistema Global de Notificaciones Toast (`window.nexToast`)
- **Arquitectura Universal en `js/navigation.js` y `css/design-system.css`:**
  - Implementación de un gestor de notificaciones flotantes disponible globalmente en todas las páginas de la plataforma (`window.nexToast`).
  - Soporte para 4 variantes semánticas: `success` (éxito), `error` (fallos), `warning` (alertas) e `info` (informativas).
  - Animaciones fluidas de entrada (`nex-toast-slide-in`) y salida (`nex-toast-slide-out`), cierre manual con botón `✕` y temporizador de auto-descarte (4.5 segundos).
  - Posicionamiento fijo inferior derecho en escritorio y centrado inferior en dispositivos móviles, con `pointer-events` configurados para no interferir con la navegación.

### 14.2. Conexión de Eventos y Feedback en Tiempo Real
- **Marketplace (`/tienda`):** Feedback inmediato al agregar productos al carrito (`nexToast.success`), guardar insumos en la lista de abasto (`nexToast.info`), eliminar productos o generar cotizaciones institucionales con folio oficial.
- **Panel Comercial (`/emprendedores`):** Notificaciones toast al actualizar datos comerciales, modificar estados de pedidos recibidos, crear/editar productos del catálogo o eliminar insumos del comparador.
- **Lens IA (`/lens`):** Toasts al completar escaneos visuales o reportar errores de conectividad o tamaño de imagen.
- **Autenticación y Registro (`/login`, `/registro`):** Notificaciones instantáneas al autenticar credenciales, alertar contraseñas discordantes o reportar errores de validación.

### 14.3. Estados de Carga y Skeletons Loaders
- **Skeletons Interactivos:** En el marketplace (`#storeItems`), la carga inicial del catálogo despliega 6 tarjetas skeleton animadas (`.nex-skeleton`) en lugar de texto plano estático, simulando la estructura visual del catálogo mientras se resuelve `/api/catalogo`.
- **Estados Vacíos Resilientes (`.nex-empty-state`):** Interfaces estructuradas con icono, título explicativo, texto orientativo y botón de acción (CTA) para:
  - Búsqueda sin coincidencias en el mercado (con botón *"Restablecer filtros"*).
  - Carrito / cotizador vacío.
  - Lista de abastecimiento recurrente vacía.
  - Historial de cotizaciones emitidas vacío.
  - Comparador multi-proveedor vacío.
  - Falla de red en carga de catálogo (con botón *"Reintentar Carga"*).

### 14.4. Detección Automática de Conectividad (Online / Offline)
- Monitoreo reactivo de los eventos de red `offline` y `online` en el navegador:
  - Si el usuario pierde conexión: Alerta toast de advertencia avisando que el sistema operará con datos locales en caché.
  - Al recuperar conexión: Notificación toast de éxito informando el restablecimiento de la conexión a Internet.


---

## 15. FASE 9 — ADMINISTRACIÓN Y CONFIANZA COMERCIAL (COMPLETADA)

### 15.1. Arquitectura de Moderación y Sellos de Confianza
- **Estatus de Verificación Comercial:** Implementación del flujo formal de auditoría de comercios en Durango:
  - `pending` (En revisión): El negocio se registra pero no aparece públicamente con sello de confianza.
  - `approved` (Verificado): El negocio obtiene el sello oficial `✓ Proveedor Verificado de Durango`, habilitando su presencia prioritaria en el Marketplace y en los resultados de matching de Lens IA.
  - `rejected` (Rechazado/Suspendido): No disponible públicamente.
- **Criterios Oficiales de Verificación:**
  1. *Identidad Local:* Establecimiento físico validado en el estado de Durango.
  2. *Capacidad B2B:* Suministro semanal mínimo documentado para mayoreo.
  3. *Precios Comerciales Transparentes:* Regla estricta de precios menudeo y mayoreo sin intermediarios.
  4. *Atención Directa:* Línea directa de WhatsApp y responsable comercial comprobado.

### 15.2. Endpoints Administrativos en `server.js`
- `GET /api/admin/negocios`: Consulta centralizada de todos los perfiles de comercios registrados en la plataforma (proveedores y tienditas), con soporte para persistencia Supabase y fallback estructurado para modo demo.
- `PATCH /api/admin/negocios/:id/status`: Actualización en tiempo real del estatus de aprobación (`approved`, `pending`, `rejected`).
- Soporte para rol `admin` en `/api/auth/login` y `/api/auth/me` con sesión y perfil administrativo institucional.

### 15.3. Suite Administrativa en `/emprendedores` (`#adminSections`)
- Activación condicional cuando el usuario autenticado tiene el rol `admin`:
  1. **Dashboard de Auditoría:** 4 métricas en vivo: Comercios Registrados, Comercios Verificados con sello, Solicitudes Pendientes de Auditoría y Productores Oficiales de Durango.
  2. **Bandeja de Moderación (`#adminBusinessesTable`):**
     - Tabla completa con nombre comercial, rol (Proveedor / Tiendita), persona responsable, teléfono verificado, zona de Durango, capacidad de suministro y estado actual.
     - Acciones de 1 clic: Botón *"✓ Aprobar"* para validar negocios inmediatamente, botón *"Revisar/Suspender"* y botón directo de WhatsApp para auditar al comercio.
  3. **Directorio Normativo de Sellos de Confianza (`#tabAdminBadges`):**
     - Desglose documental de los 3 sellos del ecosistema NEX24: *Proveedor Verificado de Durango*, *Capacidad de Suministro B2B* y *Ruta Activa de Despacho Logístico*.
  4. **Acceso de Demostración Rápida:** Botón *"Probar como Moderador/Admin"* (`admin@nex24.com`) en `pages/login.html` y `js/login.js`.


---

## 16. FASE 10 — RESPONSIVE DESIGN Y ACCESIBILIDAD (A11Y) (COMPLETADA)

### 16.1. Auditoría y Adaptabilidad Multi-Resolución
- **Compatibilidad de Pantallas:** Soporte validado para pantallas ultra-pequeñas (320px - 375px), móviles estándar (390px - 428px), tablets (768px - 1024px) y escritorios amplios (1200px - 1440px+).
- **Tablas Responsivas con Desplazamiento Suave:** Incorporación de reglas `.tablebox`, `.nex-table-container` y `.table-responsive` con `overflow-x: auto; -webkit-overflow-scrolling: touch;` y ancho mínimo protegido, impidiendo que tablas con múltiples columnas rompan el layout en smartphones.
- **Pestañas y Toolbars Desplazables:** Soporte de scroll táctil horizontal en `.nex-panel-tabs` y `.nex-category-filter-chips` con barra de desplazamiento visualmente oculta para interfaces limpias.

### 16.2. Cumplimiento de Accesibilidad WCAG 2.1 AA
- **Enfoque Visible para Teclado (`:focus-visible`):**
  - Anillo de enfoque de alto contraste (`outline: 2px solid var(--nex-emerald); outline-offset: 2px;`) aplicado a todos los elementos interactivos (`a`, `button`, `input`, `select`, `textarea`, `[tabindex]`, `.nex-chip`, `.nex-panel-tab`).
  - Desactivación limpia del contorno al hacer clic con mouse (`:focus:not(:focus-visible)`).
- **Enlace de Salto al Contenido Principal (`.nex-skip-link`):**
  - Inyección automática en `js/navigation.js` de `<a href="#mainContent" class="nex-skip-link">Saltar al contenido principal</a>`, visible de forma prominente únicamente al navegar con la tecla Tab.
  - Asignación dinámica de `id="mainContent"` y `tabindex="-1"` en el contenedor principal de cada página.
- **Control Accesible de Modales y Menú Móvil:**
  - Cierre instantáneo de cualquier modal o menú lateral mediante la tecla `Escape`.
  - Cierre al hacer clic en el fondo oscuro exterior (Backdrop click).
  - Restablecimiento automático de foco en el botón de origen (`.nav-toggle`).
- **Áreas Mínimas de Contacto Táctil (WCAG 2.5.5 / 2.5.8 Target Size):**
  - Regla `@media (pointer: coarse)` que garantiza una altura mínima de 44px en botones, inputs, selectores, pestañas y chips de filtro en dispositivos con pantalla táctil.
- **Soporte de Movimiento Reducido (`prefers-reduced-motion`):**
  - Desactivación de transiciones y animaciones complejas para usuarios con preferencias de accesibilidad configuradas en su sistema operativo.

---

## 17. FASE 11 — OPTIMIZACIÓN Y SEGURIDAD (COMPLETADA)

### 17.1. Cabeceras de Seguridad HTTP y Blindaje de Servidor
- **Eliminación de Firma del Servidor:** `app.disable('x-powered-by')` y eliminación de la cabecera `X-Powered-By` en respuestas HTTP para prevenir fingerprinting tecnológico.
- **Protección contra Inyecciones y Sniffing:**
  - `X-Content-Type-Options: nosniff` para forzar la estricta interpretación de tipos MIME.
  - `X-Frame-Options: SAMEORIGIN` para neutralizar ataques de Clickjacking.
  - `Referrer-Policy: strict-origin-when-cross-origin` para salvaguardar la privacidad en navegación externa.
  - `Permissions-Policy: camera=(self), geolocation=(self), microphone=()` limitando el acceso a APIs de hardware estrictamente al propio origen.
- **Content-Security-Policy (CSP) Robusta:**
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com`
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
  - `font-src 'self' https://fonts.gstatic.com data:`
  - `img-src 'self' data: blob: https:`
  - `connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com ws: wss:`
  - `frame-src 'self' https://wa.me https://api.whatsapp.com`
- **Bloqueo Activo de Rutas y Archivos Sensibles:**
  - Middleware de denegación 403 / 404 para archivos de entorno (`.env`), scripts internos, bases de datos SQL (`supabase.sql`), configuración (`package.json`, `package-lock.json`), repositorios (`.git`) y documentación confidencial.

### 17.2. Políticas de Caché y Entrega de Contenidos
- **Rutas de API (`/api/*`):** `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate` para garantizar datos siempre actualizados en inventarios, cotizaciones y perfiles comerciales.
- **Activos Estáticos (`/css/*`, `/js/*`):** `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` para reducir latencia y ancho de banda en visitas recurrentes.
- **Páginas HTML:** `Cache-Control: no-cache` asegurando que las vistas se mantengan sincronizadas con las últimas versiones de la plataforma.

### 17.3. Optimización de Carga y Rendimiento Front-End
- **Preconexión de Fuentes:** Directivas `<link rel="preconnect" href="https://fonts.googleapis.com">` y `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` en todas las páginas clave (`index.html`, `pages/tienda.html`, `pages/lens.html`, `pages/emprendedores.html`, `pages/login.html`, `pages/registro.html`), reduciendo el TTFB y retrasos en la renderización tipográfica.
- **Carga Diferida de Medios (`loading="lazy"` y `decoding="async"`):** Implementada en elementos de imagen (`<img>`) y visualizadores de preview en Lens IA para priorizar el camino de renderizado crítico.
- **Manejo Centralizado de Rutas 404:** Intercepción de solicitudes de API inexistentes con respuesta estructurada en JSON (`{ ok: false, error: 'Endpoint no encontrado' }`) y fallback a `index.html` para rutas web desconocidas.

---

## 18. FASE 12 — QA, PRUEBAS Y VALIDACIÓN FINAL (COMPLETADA)

### 18.1. Suite Automatizada de Verificación y Aceptación (`npm run qa`)
- Implementación del arnés de pruebas integral `scripts/qa_verification.js` que audita 66 puntos de control en una instancia aislada del servidor:
  1. **Vistas Web (24 validaciones):** Respuesta HTTP 200, existencia de títulos semánticos, presencia de la barra de navegación unificada (`data-nex-navigation`) y etiquetas de preconexión de fuentes en `/`, `/tienda`, `/lens`, `/emprendedores`, `/login` y `/registro`.
  2. **Seguridad y Cabeceras (6 validaciones):** Inexistencia de `X-Powered-By`, validación de `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Content-Security-Policy` y `Permissions-Policy`.
  3. **Blindaje de Archivos Sensibles (3 validaciones):** Denegación HTTP 403 a solicitudes directas de `/.env`, `/package.json` y `/supabase.sql`.
  4. **Manejo Centralizado 404 (2 validaciones):** Código de estado HTTP 404 y estructura JSON `{ ok: false, error: 'Endpoint no encontrado' }`.
  5. **Catálogo Comercial y Abasto (7 validaciones):** Integridad de los 14 productores locales de Durango en `/api/catalogo`, precios menudeo, precios mayoreo, unidades de medida y capacidad semanal de suministro.
  6. **Lens IA y Matching Regional (15 validaciones):** Validación de escaneo y matching para los 5 demos comerciales (`cafe`, `miel`, `queso`, `pan`, `mezcal`), verificación de rutas de entrega y capacidad de despacho.
  7. **Autenticación y Sesiones Demo (6 validaciones):** Flujos de autenticación e inspección de perfiles para Proveedor (`proveedor@nex24.com`), Tiendita (`tiendita@nex24.com`) y Admin (`admin@nex24.com`).
  8. **Suite Administrativa y Moderación (3 validaciones):** Consulta de comercios para verificación y actualización de estatus a `approved` vía PATCH en `/api/admin/negocios/:id/status`.

### 18.2. Resultados Finales de Testing y Compilación
- **Pruebas Unitarias de Catálogo y Algoritmos:** `npm test` → **17 de 17 pruebas pasadas (100%)**, 0 fallos.
- **Suite de Aceptación QA End-to-End:** `npm run qa` → **66 de 66 pruebas pasadas (100%)**, 0 fallos.
- **Compilación de Producción:** `npm run build` → Generación limpia de `/dist` con todos los activos actualizados y validados.

---

## 19. RESUMEN MAESTRO DE LA TRANSFORMACIÓN (100% COMPLETADO)

| Fase | Módulo | Estado | Logros Principales |
|---|---|---|---|
| **Fase 0** | Auditoría y Descubrimiento | ✅ Completada | Mapeo de arquitectura, 14 productores verificados, baseline de tests y cero regresiones. |
| **Fase 1** | Arquitectura UX y Design System | ✅ Completada | Variables CSS corporativas (Verde Bosque, Esmeralda, Lima, Azul B2B), tipografía DM Sans y navegación dinámica. |
| **Fase 2** | Rediseño de Página Principal | ✅ Completada | Landing page de 12 secciones corporativas con buscador hero, comparativas menudeo vs mayoreo y métricas de impacto. |
| **Fase 3** | Marketplace Inteligente | ✅ Completada | Catálogo interactivo (`/tienda`), selector dinámico B2B/B2C, filtros facetados y modal de detalle comercial. |
| **Fase 4** | Experiencia B2B vs B2C | ✅ Completada | Escalas de precios de mayoreo (1-5, 6-24, 25+ piezas), lista de abastecimiento recurrente y cotizaciones con folio oficial. |
| **Fase 5** | Panel del Proveedor | ✅ Completada | Suite operativa para productores (`/emprendedores`): CRUD de catálogo, rutas de entrega, capacidad y pedidos recibidos. |
| **Fase 6** | Panel del Comprador / Tiendita | ✅ Completada | Comparador multi-proveedor por producto, directorio de proveedores de Durango y archivo de cotizaciones emitidas. |
| **Fase 7** | Lens IA (Visión y Matching) | ✅ Completada | Rediseño de Lens IA, 5 chips demo de un clic, cálculo de ahorro de mayoreo (-20%) y enlace directo al Marketplace. |
| **Fase 8** | Experiencia Transversal | ✅ Completada | Sistema global de notificaciones toast (`window.nexToast`), skeletons loaders animados y detección de modo offline/online. |
| **Fase 9** | Administración y Confianza | ✅ Completada | Suite de moderación para rol `admin`: dashboard con 4 métricas, bandeja de auditoría y otorgamiento de sellos de confianza. |
| **Fase 10** | Responsive Design y Accesibilidad | ✅ Completada | WCAG 2.1 AA: `:focus-visible` contrastado, skip link accesible, control de modales por tecla `Escape` y touch targets de 44px. |
| **Fase 11** | Optimización y Seguridad | ✅ Completada | Cabeceras de seguridad (CSP, nosniff, SAMEORIGIN), bloqueo 403 a rutas sensibles, Cache-Control y preconexión de fuentes. |
| **Fase 12** | QA, Pruebas y Validación Final | ✅ Completada | 66 validaciones automatizadas en `npm run qa`, 17 pruebas unitarias en `npm test`, build verificado y sign-off maestro. |

---

# MIGRACIÓN MAESTRA A REACT + TYPESCRIPT + VITE

## FASE 1: AUDITORÍA COMPLETA DEL PROYECTO (AUDIT ONLY)

### 1.1. Resumen Ejecutivo de la Auditoría
- **Objetivo:** Migración integral del frontend de NEX24 desde Vanilla HTML5/CSS3/JavaScript modular a una arquitectura escalable y moderna basada en React 18+ / TypeScript / TSX / Vite, preservando el 100% de la funcionalidad actual, el backend Express en Node.js, las integraciones con Google Gemini Vision, Leaflet y Supabase, y garantizando cero regresiones funcionales.
- **Estado Actual:** 100% de pruebas unitarias (`npm test`: 17/17) y pruebas de aceptación QA (`npm run qa`: 66/66) pasando satisfactoriamente.
- **Principio Innegociable:** Cero pérdida de funcionalidades existentes. No se modificó ningún archivo del sistema durante esta fase de auditoría.

---

### 1.2. Inventario Exhaustivo de Módulos y Funcionalidades

| Módulo Original | Archivo(s) Origen | Dependencias Actuales | Funcionalidad Clave | Riesgo de Migración | Complejidad |
|---|---|---|---|---|---|
| **Sistema de Navegación & Shell** | `js/navigation.js`<br>`css/loader.css`<br>`css/design-system.css` | `localStorage`<br>DOM Nativo | - Barra adaptativa según 4 experiencias (Pública, Tiendita, Proveedor, Admin).<br>- Píldora única de autenticación (`Acceso / Registro` vs perfil activo).<br>- Menú lateral móvil accesible (ARIA + `Escape`).<br>- Sistema de carga global `window.nexLoader`.<br>- Sistema universal de notificaciones `window.nexToast` (4 variantes).<br>- Footer corporativo de 4 columnas con enlace a "¿Cómo funciona?".<br>- Monitoreo de conectividad online/offline. | Bajo: Fácil abstracción en `Navbar.tsx`, `Footer.tsx`, `ToastContext` y `AuthContext`. | Media |
| **Landing Page** | `index.html`<br>`css/design.css`<br>`css/design-system.css` | `js/navigation.js`<br>`productores.json` | - 12 secciones corporativas estructuradas.<br>- Hero empresarial con buscador que enlaza a `/tienda?q=...`.<br>- Banner de Lens IA con chips de prueba rápida.<br>- Grid de 8 categorías duranguenses.<br>- Tarjetas de productos destacados con precios menudeo/mayoreo.<br>- Segmentación comparativa B2B vs B2C.<br>- Flujo de 3 pasos y cobertura territorial en Durango. | Bajo: Mapeo directo a componentes funcionales TSX en `modules/landing`. | Baja |
| **Marketplace Inteligente (Tienda)** | `pages/tienda.html`<br>`js/app.js`<br>`css/styles.css`<br>`css/design.css` | `/api/catalogo`<br>`localStorage`<br>WhatsApp API | - Switcher en tiempo real B2B vs B2C.<br>- Filtro en tiempo real por búsqueda, 14 categorías y zonas de Durango.<br>- Precios escalonados (tiers: menudeo, mayoreo -20%, distribuidor).<br>- Modal de ficha técnica y comercial con enlace a Google Maps.<br>- Cotizador y carrito de abastecimiento.<br>- Lista de abastecimiento recurrente (`nex24-b2b-supply-list`).<br>- Historial de cotizaciones con folios `NEX-XXXXXX` (`nex24-quotes-history`).<br>- Generador de cotizaciones en PDF e integración con WhatsApp. | Medio: Gran cantidad de estado local; requiere consolidar hooks `useCart`, `useSupplyList` y `useQuotes`. | Alta |
| **Lens IA (Visión Artificial)** | `pages/lens.html`<br>`js/lens.js`<br>`css/lens.css`<br>`vision.js`<br>`matcher.js` | `POST /api/lens/scan`<br>Canvas API<br>HTML5 Geolocation<br>Gemini Vision | - Drag & drop y captura con cámara móvil (`capture="environment"`).<br>- Compresión canvas en cliente a 1280px para optimizar ancho de banda.<br>- Detección de GPS con cálculo de distancia Haversine a productores.<br>- Chips de demo de 1 clic (`cafe`, `miel`, `queso`, `pan`, `mezcal`).<br>- Motor Gemini `gemini-3.5-flash-lite` con fallback mock determinista.<br>- Tarjetas de coincidencia con precios B2B/B2C, rutas, enlace a tienda y WhatsApp. | Medio: Requiere manejo de canvas y file inputs en React sin fugas de memoria. | Alta |
| **Mapa Interactivo** | `pages/mapa.html`<br>`js/mapa.js`<br>`css/mapa.css` | Leaflet (`L`)<br>`/api/catalogo`<br>Geolocation API | - Mapa de Durango con pines personalizados y emojis por categoría.<br>- Popups enriquecidos con datos B2B/B2C, distancia y contacto.<br>- Búsqueda en vivo y filtro por categoría.<br>- Botón de geolocalización "Mi ubicación" y "Ver Durango".<br>- Resaltado dinámico por parámetro URL `?sugerencia=p01`.<br>- Lista lateral sincronizada bidireccionalmente con marcadores.<br>- Motor fallback offline si falla Leaflet CDN. | Medio-Alto: Manejo del ciclo de vida de Leaflet en React (`useEffect`, `useRef`, limpieza `map.remove()`). | Alta |
| **Puntos de Abasto & Ubicaciones** | `pages/ubicaciones.html`<br>`js/app.js` | `/api/catalogo` | - Directorio de productores y puntos de abasto.<br>- Mapa esquemático interactivo con pines clicables.<br>- Chips de filtro rápido por zonas y municipios de Durango.<br>- Búsqueda y listado reactivo. | Bajo: Componentes declarativos simples en React. | Media |
| **Propuesta & "¿Cómo funciona?"** | `pages/propuesta.html` | Estático / CSS | - Métricas de impacto de la red comercial.<br>- Flujo de 3 pasos (Escanea -> Compara -> Abastécete).<br>- Pilares por rol comercial.<br>- Tabla comparativa de mercado.<br>- Acordeón interactivo FAQ accesible (`<details>` y `<summary>`). | Bajo: Contenido visual puro. | Baja |
| **Catálogo de Productos** | `pages/productos.html`<br>`js/app.js` | `/api/catalogo` | - Grid visual de los 14 productores locales de Durango. | Muy Bajo: Compartirá componentes con el Marketplace. | Baja |
| **Panel de Emprendedores** | `pages/emprendedores.html`<br>`js/app.js`<br>`css/panel.css` | `/api/auth/me`<br>`/api/admin/negocios`<br>`localStorage` | - Renderizado dinámico según rol (`proveedor`, `tiendita`, `admin`):<br>  1. *Proveedor:* Dashboard métricas, CRUD de catálogo (`#productFormModal`), control de capacidad y rutas, gestión de cotizaciones recibidas con WhatsApp.<br>  2. *Tiendita:* Dashboard de abasto, comparador multi-proveedor, historial de cotizaciones emitidas, productores favoritos.<br>  3. *Admin:* Dashboard de auditoría, bandeja de moderación con aprobación/rechazo de comercios en tiempo real. | Medio-Alto: Múltiples formularios, modales y tablas por rol; requiere dividir en submódulos especializados. | Muy Alta |
| **Portal de Login** | `pages/login.html`<br>`js/login.js`<br>`css/registro.css` | `/api/auth/login`<br>`localStorage` | - Formulario de correo y contraseña.<br>- Botón para alternar visibilidad de contraseña (👁️ / 🙈).<br>- Manejo de token JWT y almacenamiento de perfil.<br>- Redirección automática a `/emprendedores`. | Bajo: Mapeo estándar a `LoginForm.tsx` y `useAuth`. | Baja |
| **Portal de Registro** | `pages/registro.html`<br>`js/registro.js`<br>`css/registro.css` | `/api/registros`<br>`/api/auth/login`<br>`data/local_db.json`<br>Supabase | - Selector interactivo de rol comercial (`tiendita` vs `proveedor`).<br>- Campos dinámicos condicionales según el rol.<br>- Validación de contraseñas coincidentes.<br>- Registro local resiliente + sincronización Supabase.<br>- Autologin inmediato y redirección al panel. | Bajo: Mapeo a `RegisterForm.tsx` con validación de estado. | Media |
| **Backend Express & APIs** | `server.js`<br>`matcher.js`<br>`vision.js`<br>`productores.json`<br>`data/local_db.json` | Express<br>Multer<br>Dotenv<br>Supabase JS<br>Gemini API | - Contratos de API: `/api/catalogo`, `/api/lens/scan`, `/api/registros`, `/api/auth/login`, `/api/auth/me`, `/api/admin/negocios`, `/api/admin/negocios/:id/status`.<br>- Seguridad: CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, bloqueo 403 a `.env` y archivos sensibles.<br>- Persistencia híbrida resiliente (`data/local_db.json` + Supabase). | Ninguno: El backend se conserva 100% intacto, sirviendo la API a través del proxy de Vite en desarrollo. | Baja (Conservación) |

---

### 1.3. Mapa de Dependencias y Flujos de Datos

```
[ Navegador del Usuario ]
       │
       ▼
[ React Router (router.tsx) ]
       │
  ┌────┴────────────────────────┬─────────────────────────┬──────────────────────┐
  ▼                             ▼                         ▼                      ▼
Landing / Propuesta     Marketplace / Tienda         Lens IA / Mapa       Panel Emprendedores / Auth
  │                             │                         │                      │
  │                     ┌───────┴──────┐                  │                      │
  │                     ▼              ▼                  ▼                      ▼
  │               useCart.ts    useSupplyList.ts     useLensScanner.ts       useAuth.ts
  │                     │              │                  │                      │
  └─────────────────────┴──────────────┴──────────────────┴──────────────────────┘
                                       │
                                       ▼
                       [ Api Service (src/services/api.ts) ]
                                       │
                              (Vite Dev Proxy: /api)
                                       │
                                       ▼
                     [ Express Backend (server.js: 3001) ]
                                       │
            ┌──────────────────────────┼─────────────────────────┐
            ▼                          ▼                         ▼
   Catálogo & Matcher          Gemini Vision API         Persistencia Híbrida
   (productores.json)         (gemini-3.5-flash-lite)   (local_db.json & Supabase)
```

#### Almacenamiento Local (`localStorage`):
- `nex24-supabase-session`: Token JWT de autenticación.
- `nex24-current-account`: Perfil del negocio autenticado (`role`, `business_name`, etc.).
- `nex24-cart`: Artículos en cotización / carrito.
- `nex24-b2b-supply-list`: Lista recurrente de abastecimiento B2B.
- `nex24-quotes-history`: Historial de cotizaciones comerciales emitidas con folios.
- `lensApi`: Configuración de URL override para API.

---

### 1.4. Arquitectura Modular Objetivo para React + TypeScript

```
src/
  app/
    App.tsx                       # Contenedor raíz con Providers
    router.tsx                    # Definición declarativa de rutas con React Router
    providers.tsx                 # Composición de Context Providers (Auth, Toast, Cart)
  components/
    ui/
      Button.tsx                  # Botones semánticos (.nex-btn, variantes primary, accent, b2b)
      Input.tsx                   # Inputs accesibles con validación y labels
      Modal.tsx                   # Modal accesible con Escape, backdrop y focus trap
      Loader.tsx                  # Loader institucional verde con animación 3-body
      Badge.tsx                   # Badges de estado (Verificado, B2B, B2C, Lime)
      Alert.tsx                   # Mensajes de alerta semántica
      Card.tsx                    # Contenedor de tarjeta estandarizada
      Toast.tsx                   # Notificaciones flotantes toast
      Skeleton.tsx                # Skeletons de carga animados
      EmptyState.tsx              # Estados vacíos con icono, título y CTA
    layout/
      Navbar.tsx                  # Navegación unificada para las 4 experiencias
      Footer.tsx                  # Pie de página de 4 columnas corporativas
      MainLayout.tsx              # Shell envolvente con SkipLink y accesibilidad
      SkipLink.tsx                # Salto al contenido principal para teclado
    shared/
      CommercialBadge.tsx         # Sello de verificación local de Durango
      WhatsAppButton.tsx          # Botón formateador deep-link a WhatsApp
      PriceTag.tsx                # Desglose claro de precios menudeo vs mayoreo
  modules/
    auth/
      components/
        LoginForm.tsx             # Formulario con show/hide password y remember me
        RegisterForm.tsx          # Formulario de alta con selector de rol
        RoleSelector.tsx          # Selector tiendita vs proveedor
      pages/
        LoginPage.tsx             # Vista de login (/login)
        RegisterPage.tsx          # Vista de registro (/registro)
      services/
        authService.ts            # Peticiones a /api/auth/login, /api/auth/me y /api/registros
      hooks/
        useAuth.ts                # Hook para consumir AuthContext
      types/
        auth.types.ts             # Interfaces TypeScript para User, Profile, Session
    landing/
      components/
        HeroSection.tsx           # Hero con buscador comercial integrado
        LensBanner.tsx            # Banner destacado con demos rápidas
        CategoryGrid.tsx          # Grid de 8 categorías duranguenses
        FeaturedProducts.tsx      # Productos destacados con precios B2B/B2C
        B2BSegmentation.tsx       # Comparativa dual de valor comercial
        StepProcess.tsx           # Flujo de 3 pasos
        CoverageSection.tsx       # Cobertura regional de Durango
      pages/
        LandingPage.tsx           # Vista principal (/)
    products/
      components/
        ProductCard.tsx           # Tarjeta de producto con detalles
        ProductGrid.tsx           # Grid responsivo de catálogo
      pages/
        ProductsPage.tsx          # Vista de catálogo (/productos)
      services/
        catalogService.ts         # Consulta a /api/catalogo
      types/
        catalog.types.ts          # Interfaces Productor, Producto, Categoría
    store/
      components/
        StoreToolbar.tsx          # Buscador, selectores de orden y zona
        ModeSwitcher.tsx          # Switcher interactivo B2B vs B2C
        CategoryFilterChips.tsx   # Chips interactivos de las 14 categorías
        ProductDetailModal.tsx    # Ficha técnica y comercial completa
        CartDrawer.tsx            # Cotizador lateral / carrito
        QuoteModal.tsx            # Visor e impresor de cotizaciones oficiales en PDF
        SupplyListModal.tsx       # Gestor de insumos de abastecimiento recurrente
      pages/
        StorePage.tsx             # Vista de mercado (/tienda)
      hooks/
        useCart.ts                # Gestión de carrito y cálculo de mayoreo
        useSupplyList.ts          # Gestión de lista de abasto recurrente
        useQuotes.ts              # Historial y emisión de folios NEX-XXXXXX
      types/
        store.types.ts            # Interfaces CartItem, Quote, SupplyItem
    entrepreneurs/
      components/
        ProviderDashboard.tsx     # Métricas y resumen operativo del proveedor
        ProviderCatalogManager.tsx # CRUD de catálogo con formulario modal
        ProviderSupplyEditor.tsx  # Editor de capacidad semanal y rutas
        ProviderOrdersTable.tsx   # Cotizaciones recibidas y cambio de estado
        BuyerDashboard.tsx        # Métricas de abasto y ahorro acumulado
        BuyerComparatorTable.tsx  # Comparador multi-proveedor de insumos
        BuyerQuotesTable.tsx      # Historial de cotizaciones emitidas
        BuyerFavoritesGrid.tsx    # Productores locales verificados
        AdminAuditDashboard.tsx   # Métricas de auditoría institucional
        AdminBusinessTable.tsx    # Bandeja de moderación (Aprobar/Suspender)
      pages/
        EntrepreneursPage.tsx     # Vista del panel (/emprendedores)
      services/
        adminService.ts           # Consultas a /api/admin/negocios
      types/
        entrepreneurs.types.ts    # Tipos de métricas, pedidos y moderación
    lens/
      components/
        LensHero.tsx              # Cabecera con estatus de API en vivo
        ImageDropzone.tsx         # Drag & drop y selector de cámara
        DemoQuickChips.tsx        # Chips de prueba rápida (cafe, miel, queso, etc.)
        ScanResultsView.tsx       # Contenedor de diagnóstico IA y coincidencias
        ProducerMatchCard.tsx     # Tarjeta de productor con precios y WhatsApp
      pages/
        LensPage.tsx              # Vista de Lens IA (/lens)
      hooks/
        useLensScanner.ts         # Hook de compresión canvas y escaneo
      services/
        lensService.ts            # Petición multipart a /api/lens/scan
      types/
        lens.types.ts             # Tipos de diagnóstico y coincidencias
    map/
      components/
        LeafletMapWrapper.tsx     # Wrapper seguro de Leaflet con limpieza de memoria
        MapFilterToolbar.tsx      # Buscador, filtro de categoría y geolocalización
        CategoryLegend.tsx        # Leyenda de categorías con iconos
        ProducerSidebarList.tsx   # Lista sincronizada con marcadores
      pages/
        MapPage.tsx               # Vista de mapa (/mapa)
      hooks/
        useGeolocation.ts         # Hook de geolocalización HTML5
      services/
        mapService.ts             # Lógica de cálculo de distancias
      types/
        map.types.ts              # Tipos de coordenadas, pines y filtros
    locations/
      components/
        LocationToolbar.tsx       # Búsqueda y chips rápidos por zona
        SchematicMap.tsx          # Mapa esquemático interactivo
        LocationList.tsx          # Lista de puntos y productores
      pages/
        LocationsPage.tsx         # Vista de ubicaciones (/ubicaciones)
    propuesta/
      pages/
        PropuestaPage.tsx         # Vista informativa "¿Cómo funciona?" (/propuesta)
  services/
    api.ts                        # Cliente Axios o Fetch centralizado con interceptores
    supabase.ts                   # Cliente Supabase JS configurado
  context/
    AuthContext.tsx               # Proveedor de estado de sesión global
    ToastContext.tsx              # Proveedor de notificaciones toast
    CartContext.tsx               # Proveedor de carrito y cotizaciones
  hooks/
    useToast.ts                   # Hook de acceso a toasts
    useLocalStorage.ts            # Hook reactivo de sincronización con localStorage
  styles/
    tokens.css                    # Variables y tokens de design-system.css
    global.css                    # Estilos globales y reset
  main.tsx                        # Punto de entrada de la aplicación Vite
```

---

### 1.5. Matriz de Trazabilidad: Funcionalidad Actual → Módulo React → Pruebas Asociadas

| Funcionalidad Actual | Archivo(s) Actuales | Futuro Módulo / Componente React | Suite de Pruebas de Validación |
|---|---|---|---|
| Navbar con 4 roles y botón único auth | `js/navigation.js` | `src/components/layout/Navbar.tsx`<br>`src/context/AuthContext.tsx` | QA Suite: Tests 1-6 (Navegación unificada, rol en sesión) |
| Sistema global de toasts | `js/navigation.js` | `src/context/ToastContext.tsx`<br>`src/components/ui/Toast.tsx` | Verificación de feedback en tienda, panel y login |
| Sistema de loader global | `css/loader.css`<br>`js/navigation.js` | `src/components/ui/Loader.tsx` | Verificación visual en navegación y peticiones API |
| Landing page corporativa (12 secciones) | `index.html`<br>`css/design.css` | `src/modules/landing/pages/LandingPage.tsx` | QA Suite: Tests 1-4 (Carga 200, título, semántica) |
| Catálogo unificado (/api/catalogo) | `server.js`<br>`productores.json` | `src/services/catalogService.ts`<br>`src/modules/products` | QA Suite: Tests 34-40 (14 productores, precios numéricos) |
| Marketplace B2B/B2C con cotizador | `pages/tienda.html`<br>`js/app.js` | `src/modules/store/pages/StorePage.tsx`<br>`src/modules/store/hooks/useCart.ts` | QA Suite: Tests 5-8 (Respuesta 200, navegación, filtros) |
| Precios escalonados (-20% mayoreo) | `js/app.js` | `src/modules/store/components/ProductDetailModal.tsx` | Pruebas de cálculo de subtotales por volumen |
| Lista de abastecimiento recurrente | `js/app.js` | `src/modules/store/hooks/useSupplyList.ts` | Persistencia en `localStorage: nex24-b2b-supply-list` |
| Historial de cotizaciones emitidas | `js/app.js` | `src/modules/store/hooks/useQuotes.ts` | Persistencia en `localStorage: nex24-quotes-history` |
| Deep-links a WhatsApp con formato | `js/app.js`<br>`js/lens.js` | `src/components/shared/WhatsAppButton.tsx` | Verificación de URI encoding de números y mensajes |
| Escaneo visual y compresión canvas | `js/lens.js` | `src/modules/lens/hooks/useLensScanner.ts` | Verificación de upload multipart y tamaño máx 1280px |
| Motor Gemini Vision con fallback demo | `vision.js`<br>`server.js` | `src/modules/lens/services/lensService.ts` | Unit Tests: 11-17 (Demos mock); QA Tests: 41-55 |
| Matching semántico y Haversine | `matcher.js` | `server.js` (Backend intacto) | Unit Tests: 1-10 (Distancia km, coincidencia exacta) |
| Mapa interactivo de Durango (Leaflet) | `pages/mapa.html`<br>`js/mapa.js` | `src/modules/map/pages/MapPage.tsx`<br>`src/modules/map/components/LeafletMapWrapper.tsx` | Verificación de carga de tiles, 14 marcadores y popups |
| Puntos de abasto y ubicaciones | `pages/ubicaciones.html` | `src/modules/locations/pages/LocationsPage.tsx` | Verificación de renderizado de lista y mapa esquemático |
| Propuesta "¿Cómo funciona?" | `pages/propuesta.html` | `src/modules/propuesta/pages/PropuestaPage.tsx` | Verificación de acordeón FAQ y métricas |
| Autenticación con roles | `pages/login.html`<br>`js/login.js` | `src/modules/auth/pages/LoginPage.tsx`<br>`src/modules/auth/hooks/useAuth.ts` | QA Suite: Tests 56-61 (Login proveedor, tiendita, admin) |
| Registro comercial con rol dinámico | `pages/registro.html`<br>`js/registro.js` | `src/modules/auth/pages/RegisterPage.tsx`<br>`src/modules/auth/components/RoleSelector.tsx` | QA Suite: Tests 21-24; test_manual_registration.js |
| Panel Proveedor (CRUD, Capacidad, Pedidos) | `pages/emprendedores.html`<br>`js/app.js` | `src/modules/entrepreneurs/components/Provider*` | Verificación de actualización de catálogo y cotizaciones |
| Panel Tiendita (Abasto, Comparador) | `pages/emprendedores.html`<br>`js/app.js` | `src/modules/entrepreneurs/components/Buyer*` | Verificación de tabla comparativa multi-proveedor |
| Panel Admin (Moderación comercial) | `pages/emprendedores.html`<br>`server.js` | `src/modules/entrepreneurs/components/Admin*` | QA Suite: Tests 62-66 (Consulta y aprobación PATCH) |

---

### 1.6. Análisis de Riesgos y Estrategias de Mitigación

1. **Riesgo: Pérdida o Fragmentación del Estilo Visual Existente**
   - *Severidad:* Alta.
   - *Mitigación:* Se migrarán los tokens y clases utilitarias de `css/design-system.css`, `css/design.css` y `css/panel.css` directamente a la capa de estilos global de Vite (`src/styles/tokens.css` y `src/styles/global.css`). Los componentes TSX reutilizarán exactamente los nombres de clase semánticos (`.nex-btn`, `.nex-card`, `.nex-badge-b2b`, etc.), asegurando coherencia visual idéntica sin reescrituras innecesarias.
2. **Riesgo: Colisión de Ciclo de Vida en Leaflet Map**
   - *Severidad:* Alta.
   - *Mitigación:* Leaflet muta el DOM directamente. En React, si el componente se desmonta y remonta sin destruir la instancia anterior, lanza el error `Map container is already initialized`. Se encapsulará en `LeafletMapWrapper.tsx` con `useRef` y `map.remove()` explícito en el return de limpieza del hook `useEffect`. Además se mantendrá el fallback de renderizado local offline existente.
3. **Riesgo: Pérdida de Estado entre Sesiones (`localStorage`)**
   - *Severidad:* Media.
   - *Mitigación:* Se mantendrán idénticas todas las claves de `localStorage` (`nex24-supabase-session`, `nex24-current-account`, `nex24-cart`, `nex24-b2b-supply-list`, `nex24-quotes-history`). Se implementará un hook `useLocalStorage.ts` tipado que garantice sincronización reactiva entre pestañas y componentes.
4. **Riesgo: Pérdida de Conexión entre Vite Frontend y Express Backend**
   - *Severidad:* Media.
   - *Mitigación:* En el archivo `vite.config.ts`, se configurará el servidor de desarrollo para proxificar de manera transparente todas las llamadas `/api/*` hacia `http://localhost:3001`, manteniendo todas las rutas backend exactamente como están sin necesidad de alterar `server.js`.
5. **Riesgo: Regresión en Tests Automatizados Existentes**
   - *Severidad:* Crítica.
   - *Mitigación:* Mantendremos los scripts de test existentes (`npm test` y `npm run qa`) ejecutándose contra el backend Express, y añadiremos scripts específicos de TypeScript (`npm run typecheck`, `npm run build:react`) para garantizar cero errores en compilación.

---

### 1.7. Estrategia y Orden Recomendado de Migración por Fases

1. **Fase 1: Auditoría del Proyecto** *(FASE ACTUAL — COMPLETADA Y VERIFICADA)*.
2. **Fase 2: Configuración del Entorno React + TypeScript + Vite:**
   - Instalar dependencias esenciales (`react`, `react-dom`, `react-router-dom`, `@types/react`, `@types/react-dom`, `vite`, `@vitejs/plugin-react`, `typescript`).
   - Configurar `vite.config.ts` con proxy a `/api` (puerto 3001) y alias `@/`.
   - Configurar `tsconfig.json` y `tsconfig.node.json`.
   - Crear estructura modular en `src/` y verificar arranque en desarrollo.
3. **Fase 3: Sistema Visual y Biblioteca de Componentes UI Reutilizables:**
   - Integración de tokens CSS.
   - Creación de componentes atómicos: `Button`, `Input`, `Modal`, `Loader`, `Toast`, `Badge`, `Card`, `Skeleton`, `EmptyState`.
   - Creación de Layout: `Navbar`, `Footer`, `MainLayout`.
4. **Fase 4: Módulo de Autenticación y Gestión de Sesión:**
   - Implementar `AuthContext`, `useAuth`, `authService`.
   - Migrar `LoginPage` y `RegisterPage` con validaciones y roles.
5. **Fase 5: Módulo de Productos y Marketplace Inteligente (Tienda B2B / B2C):**
   - Implementar `CartContext`, `useCart`, `useSupplyList`, `useQuotes`.
   - Migrar catálogo interactivo, filtros, tiers de mayoreo, modal de ficha técnica y visor de cotizaciones en PDF.
6. **Fase 6: Módulo de Emprendedores y Administración:**
   - Migrar suite del Proveedor (CRUD de catálogo, control de capacidad, pedidos).
   - Migrar suite de la Tiendita (Dashboard de abasto, comparador multi-proveedor).
   - Migrar suite de Administración (Bandeja de moderación y auditoría de sellos).
7. **Fase 7: Módulo de Mapas y Ubicaciones:**
   - Implementar `LeafletMapWrapper` con geolocalización, sincronización de lista y fallback offline.
   - Migrar vista de Puntos de Abasto y mapa esquemático.
8. **Fase 8: Módulo Lens IA y Visión Artificial:**
   - Migrar escáner visual con dropzone, captura móvil, compresión en canvas y tarjetas de coincidencias.
9. **Fase 9: Páginas Informativas e Integración Global:**
   - Migrar Landing Page corporativa (12 secciones).
   - Migrar página de Propuesta "¿Cómo funciona?".
10. **Fase 10: Optimización, Accesibilidad y QA Final:**
    - Auditoría de TypeScript (`tsc --noEmit`).
    - Verificación completa con `npm test` y `npm run qa`.
    - Build de producción con Vite.

---

### 1.8. Estado de la Fase 1
- **Auditoría de código:** 100% completada.
- **Modificaciones de código en aplicación:** 0 (estricto cumplimiento de regla de auditoría previa).
- **Pruebas de baseline ejecutadas:**
  - `npm test`: 17 / 17 pruebas exitosas.
  - `npm run qa`: 66 / 66 pruebas de aceptación exitosas.
- **Próximo Paso:** Esperar autorización explícita del usuario para iniciar la **FASE 2: CONFIGURACIÓN DE REACT**.

---

### 1.9. Estandarización Visual: Reemplazo Completo de Emojis por Lucide Icons / Heroicons
- **Objetivo:** Erradicar todos los emojis del sistema para otorgar una identidad visual SaaS moderna, empresarial y corporativa.
- **Módulo de Iconografía:** Creación de `js/icons.js` con soporte nativo para SVG de Lucide Icons / Heroicons (`window.createLucideIcon`, `window.getCategoryLucideIcon`, `window.renderLucideIcons`).
- **Tokens y Estilos:** Incorporación de reglas `.lucide`, `.lucide-xs`, `.lucide-sm`, `.lucide-md`, `.lucide-lg`, `.lucide-xl` en `css/design-system.css`.
- **Archivos Depurados y Migrados a SVG (0 emojis restantes):**
  - `index.html` (Buscador, categorías, tarjetas de productos destacados, flujo y beneficios).
  - `pages/tienda.html` (Chips de categorías, modo B2B/B2C, listas de abasto, cotizaciones y modales).
  - `pages/lens.html` (Hero, dropzone de cámara, geolocalizador y visor de diagnóstico).
  - `pages/mapa.html` (Pines georreferenciados por categoría, buscador, leyenda y marcadores Leaflet).
  - `pages/ubicaciones.html` (Directorio y chips rápidos de zonas).
  - `pages/propuesta.html` (Flujo operativo, pilares por rol y comparativa).
  - `pages/productos.html` (Favicon e identidad).
  - `pages/emprendedores.html` (Dashboard comercial, sellos de confianza y modales).
  - `pages/login.html` & `pages/registro.html` (Inputs, tabs de acceso, roles y botones primarios).
  - `js/navigation.js` (Navbar unificada, notificaciones toast, loader y pie de página).
  - `js/app.js` (Generador dinámico de tarjetas, comparador, modales y pedidos WhatsApp).
  - `js/lens.js` (Diagnóstico visual IA y tarjetas de coincidencia comercial).
  - `js/mapa.js` (Marcadores Leaflet divIcon y lista sincronizada).
  - `js/login.js` (Alternador de contraseñas y botones dinámicos).
- **Verificación Automática:** 0 emojis detectados en todo el árbol de código.
- **Pruebas de Regresión:** `npm test` (17/17 OK), `npm run qa` (66/66 OK).


