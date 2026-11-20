/* Mapa Lens IA: mismo catálogo que usa la detección, pero geolocalizado */
(() => {
  "use strict";

  const DEFAULT = { lat: 24.0277, lng: -104.6532 }; // Plaza de Armas, Durango
  const override = localStorage.getItem("lensApi");
  const baseFallback = `${location.protocol}//${location.hostname || "localhost"}:3001`;
  let API_BASE = override ?? (location.protocol === "file:" ? baseFallback : "");

  const svgPinIcon = (name, size = 18) => {
    if (typeof window !== "undefined" && typeof window.createLucideIcon === "function") {
      return window.createLucideIcon(name, { size });
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${name}"><circle cx="12" cy="12" r="10"/></svg>`;
  };

  const svgDefaultPin = svgPinIcon("map-pin", 18);

  const resolvePinIcon = (key, size = 18) => {
    if (typeof window !== "undefined" && typeof window.getProductIcon === "function") {
      return window.getProductIcon(key, { size });
    }
    return svgPinIcon("map-pin", size);
  };

  const ICONOS = new Proxy({}, {
    get: (_, prop) => resolvePinIcon(String(prop), 18)
  });

  const ETIQUETAS = {
    cafe: "Café", queso: "Queso", miel: "Miel", mezcal: "Mezcal",
    panaderia: "Panadería", salsas: "Salsas", cuero: "Cuero",
    cosmetica: "Cosmética", dulces: "Dulces", botana: "Botana",
    bebidas: "Bebidas", carnes: "Carnes", artesania: "Artesanía",
    tortillas: "Tortillas",
  };

  const FALLBACK_PRODUCTORES = [
    ["p01","Café Sierra Madre Tostadores","cafe","Café tostado en grano","Café de altura tostado en lotes pequeños.",135,108,"bolsa 500g","Centro",24.0262,-104.6561,"5216180000001"],
    ["p02","Quesos Menonitas Nuevo Ideal","queso","Queso menonita","Quesos madurados de leche de rancho.",190,160,"kg","Nuevo Ideal",24.8725,-105.0731,"5216180000002"],
    ["p03","Miel Real del Mezquital","miel","Miel de abeja","Miel pura de flor silvestre.",150,120,"frasco 1kg","El Mezquital",23.4796,-104.3905,"5216180000003"],
    ["p04","Mezcal Artesanal Nombre de Dios","mezcal","Mezcal joven","Mezcal artesanal destilado en palenque.",520,430,"botella 750ml","Nombre de Dios",23.8439,-104.2417,"5216180000004"],
    ["p05","Panadería La Espiga Duranguense","panaderia","Pan de caja integral","Pan horneado a diario.",38,30,"pieza / paquete","Fracc. Guadalupe",24.0105,-104.6718,"5216180000005"],
    ["p06","Salsas y Chiles Don Chuy","salsas","Salsa de chile de árbol","Salsas artesanales regionales.",75,58,"frasco 350ml","Zona Industrial",24.0451,-104.6389,"5216180000006"],
    ["p07","Talabartería El Arriero","cuero","Cinturones de piel","Artículos de piel hechos a mano.",450,350,"pieza","Centro",24.0289,-104.6527,"5216180000007"],
    ["p08","Sábila Viva Cosmética Natural","cosmetica","Crema de sábila","Cuidado personal con ingredientes naturales.",110,85,"pieza","Fracc. Guadalupe",24.0139,-104.6642,"5216180000008"],
    ["p09","Dulces Típicos Doña Lupe","dulces","Dulce de leche","Dulces tradicionales regionales.",45,34,"bolsa 200g","Centro",24.0301,-104.6498,"5216180000009"],
    ["p10","Nueces Selectas de la Laguna","botana","Nuez pecanera","Nuez seleccionada y empacada.",210,170,"bolsa 500g","Zona Industrial",24.0502,-104.6301,"5216180000010"],
    ["p11","Sidra y Manzana de Canatlán","bebidas","Sidra de manzana","Bebidas elaboradas con manzana local.",65,50,"botella 1L","Canatlán",24.5249,-104.7766,"5216180000011"],
    ["p12","Cecina y Carne Seca El Norteño","carnes","Carne seca","Carnes secas curadas al sol.",380,310,"kg","Santiago Papasquiaro",25.0436,-105.4208,"5216180000012"],
    ["p13","Telar Durangueño Cobijas y Textiles","artesania","Cobijas de lana","Textiles tejidos en telar.",680,520,"pieza","Centro",24.0273,-104.6585,"5216180000013"],
    ["p14","Tortillas de Harina La Abuela","tortillas","Tortillas de harina","Tortillas hechas a mano.",42,33,"paquete 1kg","Fracc. Guadalupe",24.0182,-104.6805,"5216180000014"],
  ].map((p) => ({
    id:p[0], nombre:p[1], categoria:p[2], productos:[p[3]], descripcion:p[4],
    precio_menudeo:p[5], precio_mayoreo:p[6], unidad:p[7], zona_durango:p[8],
    lat:p[9], lng:p[10], whatsapp:p[11], keywords_ia:[p[2],p[3]], verificado:true,
  }));

  const $ = (selector, root = document) => root.querySelector(selector);
  const canvas = $("#map");
  if (!canvas) return;

  const apiStatus = $("#apiStatus");
  const mapCount = $("#mapCount");
  const filterInfo = $("#filterInfo");
  const filterSearch = $("#filterSearch");
  const filterCategoria = $("#filterCategoria");
  const leyenda = $("#leyenda");
  const lista = $("#mapaLista");
  const listaCount = $("#listaCount");
  const errorBox = $("#mapaError");
  const botonUbicacion = $("#useLocation");
  const desdeLens = $("#desdeLens");
  const desdeLensTexto = $("#desdeLensTexto");
  const botonQuitarSugerencia = $("#quitarSugerencia");

  let mapa;
  let capa;
  let marcaUsuario = null;
  let productores = [];
  let origen = { ...DEFAULT };
  let categoria = "";
  let busqueda = "";
  let marcaSugerencia = null;
  const marcadores = new Map();

  const etiqueta = (cat) => ETIQUETAS[cat] || (cat ? cat[0].toUpperCase() + cat.slice(1) : "Otro");

  const esc = (valor) =>
    String(valor ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));

  const norm = (valor) =>
    String(valor ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const dinero = (n) => (Number.isFinite(Number(n)) ? `$${Number(n).toLocaleString("es-MX")}` : "—");

  const km = (n) => {
    const d = Number(n) || 0;
    return d < 1 ? `${Math.max(10, Math.round((d * 1000) / 10) * 10)} m` : `${d.toFixed(1)} km`;
  };

  function distanciaKm(a, b) {
    const R = 6371;
    const rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function icono(p) {
    return L.divIcon({
      className: "pin-lens",
      html: `<span>${ICONOS[p.categoria] || svgDefaultPin}</span>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -17],
      title: p.nombre,
    });
  }

  function popupHtml(p) {
    const productos = (p.productos || []).slice(0, 3).map((x) => `<span>${esc(x)}</span>`).join("");
    const whatsapp = String(p.whatsapp || "").replace(/\D/g, "");
    const mensaje = encodeURIComponent(
      `Hola ${p.nombre}, te contacto desde NEX24 Mapa Lens. Me interesa ${(p.productos || [])[0] || "tu producto"}.`
    );
    return `<article class="popup-card">
      <small>${esc(etiqueta(p.categoria))} · ${esc(p.zona_durango)} · <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.1em;"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg> ${km(distanciaKm(origen, p))}</small>
      <h3>${esc(p.nombre)} ${p.verificado ? '<span class="verif"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg></span>' : ""}</h3>
      <p>${esc(p.descripcion)}</p>
      <div class="popup-tags">${productos}</div>
      <div class="popup-precios">
        <div><small>Menudeo</small><b>${dinero(p.precio_menudeo)}</b></div>
        <div><small>Mayoreo</small><b>${dinero(p.precio_mayoreo)}</b></div>
      </div>
      ${whatsapp ? `<a class="popup-wa" href="https://wa.me/${whatsapp}?text=${mensaje}" target="_blank" rel="noopener">${svgPinIcon("message-circle", 12)} WhatsApp</a>` : ""}
    </article>`;
  }

  function coincide(p) {
    if (categoria && p.categoria !== categoria) return false;
    if (!busqueda) return true;
    const texto = norm([
      p.nombre, p.descripcion, p.zona_durango,
      ...(p.productos || []), ...(p.keywords_ia || []),
    ].join(" "));
    return texto.includes(norm(busqueda));
  }

  function resaltarLista(id) {
    lista.querySelectorAll(".mapa-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.id === id);
    });
    lista.querySelector(`.mapa-item[data-id="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function verEnMapa(id) {
    const p = productores.find((x) => x.id === id);
    if (!p || !mapa) return;
    mapa.flyTo([p.lat, p.lng], 14, { duration: 0.8 });
    setTimeout(() => marcadores.get(id)?.openPopup(), 750);
    resaltarLista(id);
  }

  function pintarMarcadores() {
    capa.clearLayers();
    marcadores.clear();
    productores.filter(coincide).forEach((p) => {
      const marcador = L.marker([p.lat, p.lng], { icon: icono(p) }).bindPopup(popupHtml(p));
      marcador.on("click", () => resaltarLista(p.id));
      capa.addLayer(marcador);
      marcadores.set(p.id, marcador);
    });
  }

  function pintarLista() {
    const visibles = productores
      .filter(coincide)
      .sort((a, b) => distanciaKm(origen, a) - distanciaKm(origen, b));

    lista.innerHTML = visibles.map((p) => {
      const whatsapp = String(p.whatsapp || "").replace(/\D/g, "");
      const d = distanciaKm(origen, p);
      return `<article class="mapa-item" data-id="${esc(p.id)}" tabindex="0" role="button">
        <div class="mapa-item-head">
          <span class="mapa-item-icon">${ICONOS[p.categoria] || svgDefaultPin}</span>
          <div><h3>${esc(p.nombre)} ${p.verificado ? '<span class="verif"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg></span>' : ""}</h3>
          <small>${esc(etiqueta(p.categoria))} · ${esc(p.zona_durango)} · <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.1em;"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg> ${km(d)}</small></div>
        </div>
        <div class="mapa-item-foot">
          <span><b>${dinero(p.precio_menudeo)}</b> / ${esc(p.unidad)}</span>
          ${whatsapp ? `<a href="https://wa.me/${whatsapp}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${svgPinIcon("message-circle", 12)} WhatsApp</a>` : ""}
        </div>
      </article>`;
    }).join("") || '<p class="vacio">No hay productores con esos filtros.</p>';

    listaCount.textContent = `${visibles.length} de ${productores.length}`;
    mapCount.textContent = `${visibles.length} productor${visibles.length === 1 ? "" : "es"}`;
    const desde = $("#useLocation").dataset.listos ? "ti" : "Centro";
    filterInfo.textContent = productores.length
      ? `Mostrando ${visibles.length} de ${productores.length} · distancias desde ${desde}`
      : "Sin datos";
  }

  function actualizar() {
    pintarMarcadores();
    pintarLista();
  }

  function pintarLeyenda() {
    const cats = [...new Set(productores.map((p) => p.categoria))];
    leyenda.innerHTML = cats.map((c) =>
      `<button type="button" data-cat="${esc(c)}" class="${categoria === c ? "active" : ""}">
        <span>${ICONOS[c] || svgDefaultPin}</span> ${esc(etiqueta(c))}
      </button>`
    ).join("");
  }

  function ajustarVista() {
    const puntos = productores.filter(coincide).map((p) => [p.lat, p.lng]);
    if (!puntos.length || !mapa) return;
    mapa.fitBounds(L.latLngBounds(puntos), { padding: [45, 45], maxZoom: 13 });
  }

  async function comprobarApi() {
    apiStatus.className = "api-status";
    apiStatus.innerHTML = '<span class="dot"></span> Comprobando API…';

    const bases = API_BASE || override ? [API_BASE] : ["", baseFallback];
    for (const base of bases) {
      try {
        const respuesta = await fetch(`${base}/health`, { cache: "no-store" });
        const data = await respuesta.json();
        if (!respuesta.ok || !data.ok) throw new Error("sin respuesta");
        API_BASE = base;
        apiStatus.classList.add("ok");
        apiStatus.innerHTML = `<span class="dot"></span> API conectada · ${
          data.modo === "gemini" ? "IA Gemini" : "modo demo"
        }`;
        return;
      } catch {
        // Probamos la siguiente base.
      }
    }
    apiStatus.classList.add("bad");
    apiStatus.innerHTML = '<span class="dot"></span> API apagada · corre npm start';
  }

  async function cargar() {
    errorBox.hidden = true;
    try {
      let arreglo = null;
      try {
        const respuesta = await fetch(`${API_BASE}/api/productores`, { cache: "no-store" });
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
        const datos = await respuesta.json();
        arreglo = Array.isArray(datos) ? datos : datos?.productores;
      } catch {
        try {
          const url = API_BASE ? `${API_BASE}/productores.json` : "/productores.json";
          const respuesta = await fetch(url, { cache: "no-store" });
          if (respuesta.ok) {
            const datos = await respuesta.json();
            arreglo = Array.isArray(datos) ? datos : datos?.productores;
          }
        } catch {
          arreglo = null;
        }
      }
      if (!Array.isArray(arreglo) || !arreglo.length) arreglo = FALLBACK_PRODUCTORES;
      if (!Array.isArray(arreglo) || !arreglo.length) throw new Error("catálogo vacío");

      productores = arreglo;
      const cats = [...new Set(productores.map((p) => p.categoria))];
      filterCategoria.innerHTML = '<option value="">Todas</option>' +
        cats.map((c) => `<option value="${esc(c)}">${esc(etiqueta(c))}</option>`).join("");
      pintarLeyenda();
      actualizar();
      ajustarVista();

      const idSugerido = new URLSearchParams(location.search).get("productor");
      if (idSugerido) mostrarSugerencia(idSugerido);
    } catch (error) {
      errorBox.textContent = `No pude cargar el catálogo (${error.message}). ¿Está corriendo “npm start”?`;
      errorBox.hidden = false;
      mapCount.textContent = "API apagada";
      filterInfo.textContent = "Sin datos";
      lista.innerHTML = '<p class="vacio">No hay datos para mostrar.</p>';
    }
  }

  function limpiarSugerencia() {
    if (marcaSugerencia) {
      mapa.removeLayer(marcaSugerencia);
      marcaSugerencia = null;
    }
    desdeLens.hidden = true;
    try {
      const url = new URL(location.href);
      url.searchParams.delete("productor");
      history.replaceState(null, "", url);
    } catch {
      // file:// no siempre permite reescribir la URL; no es crítico.
    }
    mapa.setView([DEFAULT.lat, DEFAULT.lng], 12);
  }

  function mostrarSugerencia(id) {
    const p = productores.find((x) => String(x.id) === String(id));
    if (!p) return;

    categoria = "";
    busqueda = "";
    filterCategoria.value = "";
    filterSearch.value = "";
    pintarLeyenda();
    actualizar();

    if (marcaSugerencia) mapa.removeLayer(marcaSugerencia);
    marcaSugerencia = L.circleMarker([p.lat, p.lng], {
      radius: 18,
      color: "#5b842c",
      weight: 2,
      fillColor: "#c6f36b",
      fillOpacity: 0.18,
      className: "lens-sugerencia",
    }).addTo(mapa);

    desdeLensTexto.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin" style="margin-right:4px;vertical-align:-0.15em;"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>Sugerido por Lens IA: <b>${esc(p.nombre)}</b> · ${esc(p.zona_durango)} · <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-0.1em;"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg> ${km(distanciaKm(origen, p))}`;
    desdeLens.hidden = false;

    mapa.flyTo([p.lat, p.lng], 15, { duration: 1 });
    setTimeout(() => {
      marcadores.get(p.id)?.openPopup();
      resaltarLista(p.id);
    }, 1050);
  }

  function initMapa() {
    mapa = L.map(canvas).setView([DEFAULT.lat, DEFAULT.lng], 12);
    capa = L.layerGroup().addTo(mapa);
  }

  filterSearch.addEventListener("input", () => {
    busqueda = filterSearch.value;
    actualizar();
  });

  filterCategoria.addEventListener("change", () => {
    categoria = filterCategoria.value;
    pintarLeyenda();
    actualizar();
    ajustarVista();
  });

  leyenda.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-cat]");
    if (!boton) return;
    categoria = categoria === boton.dataset.cat ? "" : boton.dataset.cat;
    filterCategoria.value = categoria;
    pintarLeyenda();
    actualizar();
    ajustarVista();
  });

  lista.addEventListener("click", (evento) => {
    const item = evento.target.closest(".mapa-item");
    if (item) verEnMapa(item.dataset.id);
  });

  lista.addEventListener("keydown", (evento) => {
    if (evento.key !== "Enter" && evento.key !== " ") return;
    const item = evento.target.closest(".mapa-item");
    if (!item) return;
    evento.preventDefault();
    verEnMapa(item.dataset.id);
  });

  botonQuitarSugerencia.addEventListener("click", limpiarSugerencia);

  botonUbicacion.addEventListener("click", () => {
    if (!navigator.geolocation) {
      filterInfo.textContent = "Este navegador no permite geolocalización.";
      return;
    }
    botonUbicacion.disabled = true;
    botonUbicacion.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-crosshair" style="margin-right:4px;"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>Buscando…`;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        origen = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (marcaUsuario) mapa.removeLayer(marcaUsuario);
        marcaUsuario = L.circleMarker([origen.lat, origen.lng], {
          radius: 9, color: "#14251f", weight: 3, fillColor: "#c6f36b", fillOpacity: 1,
        }).bindPopup("Tú estás aquí").addTo(mapa);
        botonUbicacion.dataset.listos = "true";
        botonUbicacion.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" style="margin-right:4px;"><path d="M20 6 9 17l-5-5"/></svg>Ubicación lista`;
        mapa.setView([origen.lat, origen.lng], 13);
        actualizar();
      },
      () => {
        filterInfo.textContent = "No se pudo obtener la ubicación. Usamos el Centro.";
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
    setTimeout(() => {
      botonUbicacion.disabled = false;
      if (!botonUbicacion.dataset.listos) botonUbicacion.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-crosshair" style="margin-right:4px;"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>Mi ubicación`;
    }, 11000);
  });

  $("#resetMap").addEventListener("click", () => {
    origen = { ...DEFAULT };
    if (marcaUsuario) {
      mapa.removeLayer(marcaUsuario);
      marcaUsuario = null;
    }
    delete botonUbicacion.dataset.listos;
    botonUbicacion.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-crosshair" style="margin-right:4px;"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>Mi ubicación`;
    mapa.setView([DEFAULT.lat, DEFAULT.lng], 12);
    actualizar();
  });

  if (typeof L === "undefined") {
    canvas.classList.add("mapa-local");
    canvas.innerHTML = '<div class="local-map-grid"></div><span class="local-map-road local-road-one"></span><span class="local-map-road local-road-two"></span><div class="local-marker-layer"></div><span class="local-map-label">DURANGO, DGO.</span>';
    const markerLayer = canvas.querySelector(".local-marker-layer");
    const latBounds = [23.45, 25.08];
    const lngBounds = [-105.45, -104.22];
    const proyectar = (lat, lng) => ({
      x: 5 + ((lng - lngBounds[0]) / (lngBounds[1] - lngBounds[0])) * 90,
      y: 8 + ((latBounds[1] - lat) / (latBounds[1] - latBounds[0])) * 84,
    });
    let popup = null;
    window.L = {
      divIcon: (opciones) => opciones,
      map: () => ({
        setView() { return this; },
        flyTo() { return this; },
        fitBounds() { return this; },
        removeLayer(capaEl) { capaEl?.remove?.(); },
      }),
      layerGroup: () => ({
        _els: [],
        addTo(mapaLocal) { this._mapa = mapaLocal; return this; },
        clearLayers() {
          markerLayer.innerHTML = "";
          this._els = [];
          popup?.remove();
          popup = null;
        },
        addLayer(el) { this._els.push(el); el.addToEl?.(markerLayer); },
      }),
      latLngBounds: (puntos) => ({ puntos }),
      marker: (coords, opciones) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "pin-lens local-pin";
        el.innerHTML = opciones.icon?.html || `<span>${svgDefaultPin}</span>`;
        el.title = opciones.icon?.title || "Productor";
        let popupHtml = "";
        const p = proyectar(coords[0], coords[1]);
        el.style.left = `${p.x}%`;
        el.style.top = `${p.y}%`;
        el.addToEl = (parent) => parent.appendChild(el);
        el.addTo = (mapaLocal) => { el.addToEl(markerLayer); return el; };
        el.bindPopup = (html) => { popupHtml = html; return el; };
        el.on = (nombre, fn) => { if (nombre === "click") el.addEventListener("click", fn); return el; };
        el.openPopup = () => {
          popup?.remove();
          popup = document.createElement("div");
          popup.className = "local-popup";
          popup.innerHTML = popupHtml;
          const left = Math.min(Math.max(p.x, 17), 83);
          popup.style.left = `calc(${left}% - 140px)`;
          popup.style.top = `${Math.max(p.y - 34, 8)}%`;
          canvas.appendChild(popup);
        };
        el.bindPopup = (html) => { popupHtml = html; return el; };
        return el;
      },
      circleMarker: (coords, opciones) => {
        const el = document.createElement("span");
        el.className = `pin-lens local-pin usuario${opciones.className === "lens-sugerencia" ? " sugerencia" : ""}`;
        el.innerHTML = "<span></span>";
        const p = proyectar(coords[0], coords[1]);
        el.style.left = `${p.x}%`;
        el.style.top = `${p.y}%`;
        el.addTo = () => { markerLayer.appendChild(el); return el; };
        el.bindPopup = () => el;
        el.removeLayer = () => el.remove();
        return el;
      },
    };
  }

  initMapa();
  (async () => {
    await comprobarApi();
    await cargar();
  })();
})();
