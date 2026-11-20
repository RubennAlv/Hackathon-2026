/* Mapa Lens IA: mismo catálogo que usa la detección, pero geolocalizado */
(() => {
  "use strict";

  const DEFAULT = { lat: 24.0277, lng: -104.6532 }; // Plaza de Armas, Durango
  const override = localStorage.getItem("lensApi");
  const baseFallback = `${location.protocol}//${location.hostname || "localhost"}:3001`;
  let API_BASE = override ?? (location.protocol === "file:" ? baseFallback : "");

  const ICONOS = {
    cafe: "☕", queso: "🧀", miel: "🍯", mezcal: "🥃", panaderia: "🥖",
    salsas: "🌶️", cuero: "👜", cosmetica: "🧴", dulces: "🍬", botana: "🥨",
    bebidas: "🥤", carnes: "🥩", artesania: "🧶", tortillas: "🫓",
  };

  const ETIQUETAS = {
    cafe: "Café", queso: "Queso", miel: "Miel", mezcal: "Mezcal",
    panaderia: "Panadería", salsas: "Salsas", cuero: "Cuero",
    cosmetica: "Cosmética", dulces: "Dulces", botana: "Botana",
    bebidas: "Bebidas", carnes: "Carnes", artesania: "Artesanía",
    tortillas: "Tortillas",
  };

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
      html: `<span>${ICONOS[p.categoria] || "📍"}</span>`,
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
      <small>${esc(etiqueta(p.categoria))} · ${esc(p.zona_durango)} · ⌖ ${km(distanciaKm(origen, p))}</small>
      <h3>${esc(p.nombre)} ${p.verificado ? '<span class="verif">✓</span>' : ""}</h3>
      <p>${esc(p.descripcion)}</p>
      <div class="popup-tags">${productos}</div>
      <div class="popup-precios">
        <div><small>Menudeo</small><b>${dinero(p.precio_menudeo)}</b></div>
        <div><small>Mayoreo</small><b>${dinero(p.precio_mayoreo)}</b></div>
      </div>
      ${whatsapp ? `<a class="popup-wa" href="https://wa.me/${whatsapp}?text=${mensaje}" target="_blank" rel="noopener">WhatsApp ↗</a>` : ""}
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
          <span class="mapa-item-icon">${ICONOS[p.categoria] || "📍"}</span>
          <div><h3>${esc(p.nombre)} ${p.verificado ? '<span class="verif">✓</span>' : ""}</h3>
          <small>${esc(etiqueta(p.categoria))} · ${esc(p.zona_durango)} · ⌖ ${km(d)}</small></div>
        </div>
        <div class="mapa-item-foot">
          <span><b>${dinero(p.precio_menudeo)}</b> / ${esc(p.unidad)}</span>
          ${whatsapp ? `<a href="https://wa.me/${whatsapp}" target="_blank" rel="noopener" onclick="event.stopPropagation()">WhatsApp ↗</a>` : ""}
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
        <span>${ICONOS[c] || "📍"}</span> ${esc(etiqueta(c))}
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
      const respuesta = await fetch(`${API_BASE}/api/productores`, { cache: "no-store" });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      const datos = await respuesta.json();
      const arreglo = Array.isArray(datos) ? datos : datos?.productores;
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

    desdeLensTexto.innerHTML = `📍 Sugerido por Lens IA: <b>${esc(p.nombre)}</b> · ${esc(p.zona_durango)} · ⌖ ${km(distanciaKm(origen, p))}`;
    desdeLens.hidden = false;

    mapa.flyTo([p.lat, p.lng], 15, { duration: 1 });
    setTimeout(() => {
      marcadores.get(p.id)?.openPopup();
      resaltarLista(p.id);
    }, 1050);
  }

  function initMapa() {
    mapa = L.map(canvas).setView([DEFAULT.lat, DEFAULT.lng], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa);
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
    botonUbicacion.textContent = "⌖ Buscando…";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        origen = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (marcaUsuario) mapa.removeLayer(marcaUsuario);
        marcaUsuario = L.circleMarker([origen.lat, origen.lng], {
          radius: 9, color: "#14251f", weight: 3, fillColor: "#c6f36b", fillOpacity: 1,
        }).bindPopup("Tú estás aquí").addTo(mapa);
        botonUbicacion.dataset.listos = "true";
        botonUbicacion.textContent = "⌖ Ubicación lista";
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
      if (!botonUbicacion.dataset.listos) botonUbicacion.textContent = "⌖ Mi ubicación";
    }, 11000);
  });

  $("#resetMap").addEventListener("click", () => {
    origen = { ...DEFAULT };
    if (marcaUsuario) {
      mapa.removeLayer(marcaUsuario);
      marcaUsuario = null;
    }
    delete botonUbicacion.dataset.listos;
    botonUbicacion.textContent = "⌖ Mi ubicación";
    mapa.setView([DEFAULT.lat, DEFAULT.lng], 12);
    actualizar();
  });

  if (typeof L === "undefined") {
    errorBox.textContent = "No se pudo cargar Leaflet. Revisa tu conexión a internet.";
    errorBox.hidden = false;
    return;
  }

  initMapa();
  (async () => {
    await comprobarApi();
    await cargar();
  })();
})();
