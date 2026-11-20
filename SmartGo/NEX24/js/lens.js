/* Lens IA: cliente de la API local (server.js) */
(() => {
  "use strict";

  const PUERTO_API = "3001";
  const host = location.hostname || "localhost";
  const protocolo = location.protocol === "https:" ? "https:" : "http:";
  const baseFallback = `${protocolo}//${host}:${PUERTO_API}`;
  const override = localStorage.getItem("lensApi");

  // Por defecto API y UI están en el mismo origen (Express sirve ambas).
  // Si abres el HTML con Live Server o file://, comprobarApi() cae al puerto 3001.
  let API_BASE = override ?? (location.protocol === "file:" ? baseFallback : "");

  const ICONOS = {
    cafe: "☕", queso: "🧀", miel: "🍯", mezcal: "🥃", panaderia: "🥖", pan: "🥖",
    salsas: "🌶️", cuero: "👜", cosmetica: "🧴", dulces: "🍬", botana: "🥨",
    bebidas: "🥤", carnes: "🥩", artesania: "🧶", tortillas: "🫓",
  };

  const $ = (selector, root = document) => root.querySelector(selector);

  const fileInput = $("#lensFile");
  if (!fileInput) return;

  const dropzone = $("#dropzone");
  const previewWrap = $("#previewWrap");
  const preview = $("#preview");
  const photoInfo = $("#photoInfo");
  const changePhoto = $("#changePhoto");
  const useLocation = $("#useLocation");
  const locationStatus = $("#locationStatus");
  const scanButton = $("#scanButton");
  const scanHint = $("#scanHint");
  const results = $("#results");
  const resultsEmpty = $("#resultsEmpty");
  const errorBox = $("#lensError");
  const modeBadge = $("#modeBadge");
  const apiStatus = $("#apiStatus");

  const PLACEHOLDER_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  let seleccion = null;
  let ubicacion = null;
  let demoActivo = null;
  let escaneando = false;
  let previewUrl = null;

  const bytes = (n) =>
    n >= 1024 * 1024 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

  const esc = (valor) =>
    String(valor ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));

  const dinero = (n) => (Number.isFinite(Number(n)) ? `$${Number(n).toLocaleString("es-MX")}` : "—");

  const km = (n) => {
    const d = Number(n) || 0;
    return d < 1 ? `${Math.max(10, Math.round((d * 1000) / 10) * 10)} m` : `${d.toFixed(1)} km`;
  };

  function setHint(texto) {
    scanHint.textContent = texto;
  }

  function actualizarBoton() {
    scanButton.disabled = escaneando || (!seleccion && !demoActivo);
    if (demoActivo) {
      scanButton.textContent = `Probar demo ${ICONOS[demoActivo] || ""} (sin IA)`;
    } else {
      scanButton.textContent = "Analizar con IA →";
    }
  }

  function comprimirImagen(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("El archivo debe ser una imagen."));
        return;
      }

      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);

        const MAX = 1280;
        const escala = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
        const ancho = Math.max(1, Math.round(img.naturalWidth * escala));
        const alto = Math.max(1, Math.round(img.naturalHeight * escala));

        const canvas = document.createElement("canvas");
        canvas.width = ancho;
        canvas.height = alto;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, ancho, alto);
        ctx.drawImage(img, 0, 0, ancho, alto);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("No se pudo comprimir la imagen."));
              return;
            }
            const final = blob.size < file.size ? blob : file;
            resolve({ blob: final, ancho, alto, original: file.size, peso: final.size });
          },
          "image/jpeg",
          0.82
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo leer la imagen."));
      };

      img.src = url;
    });
  }

  async function procesarArchivo(file) {
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setHint("La foto es muy grande. Usa una de menos de 25 MB.");
      return;
    }

    setHint("Preparando imagen…");
    scanButton.disabled = true;

    try {
      const info = await comprimirImagen(file);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(info.blob);
      preview.src = previewUrl;

      const extension = info.blob.type === "image/png" ? "png" : info.blob.type === "image/webp" ? "webp" : "jpg";
      seleccion = { ...info, nombre: `foto.${extension}` };

      previewWrap.hidden = false;
      dropzone.hidden = true;
      photoInfo.textContent = `${info.ancho}×${info.alto} · ${bytes(info.original)} → ${bytes(info.peso)}`;

      demoActivo = null;
      document.querySelectorAll("[data-demo]").forEach((b) => b.classList.remove("active"));

      actualizarBoton();
      setHint("Foto lista. Pulsa “Analizar con IA”.");
    } catch (error) {
      setHint(error.message);
      actualizarBoton();
    }
  }

  function blobDemo() {
    const binario = atob(PLACEHOLDER_PNG);
    const arreglo = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) arreglo[i] = binario.charCodeAt(i);
    return new Blob([arreglo], { type: "image/png" });
  }

  function mostrarError(mensaje) {
    results.hidden = true;
    resultsEmpty.hidden = true;
    modeBadge.hidden = true;
    errorBox.hidden = false;
    errorBox.textContent = mensaje;
    window.nexToast?.error(mensaje, 'Lens IA');
  }

  function pintarResultados(data, ms) {
    const deteccion = data.deteccion || {};
    const resultados = Array.isArray(data.resultados) ? data.resultados : [];
    const modo = data.modo || "mock";
    const icono = ICONOS[deteccion.categoria] || "🛒";
    const confianza = Number(deteccion.confianza) || 0;
    const producto = deteccion.producto || "Producto sin identificar";
    const productoBonito = producto.charAt(0).toUpperCase() + producto.slice(1);

    modeBadge.hidden = false;
    modeBadge.className = `pill ${modo}`;
    modeBadge.textContent =
      modo === "gemini" ? "IA Gemini" : modo === "fallback" ? "Respaldo local" : "Demo";

    const keywords = (deteccion.keywords || []).map((k) => `<span>${esc(k)}</span>`).join("");
    const marca = deteccion.marca ? `<p>Marca: ${esc(deteccion.marca)}</p>` : "";
    const matchTexto =
      { exacto: "Match exacto", categoria: "Coincidencia por categoría", fallback: "Sugerencias cercanas" }[data.match_type] ||
      data.match_type;
    const donde = data.ubicacion_usuario === "gps" ? "cerca de ti" : "cerca del Centro";

    const tarjetas = resultados
      .map((p) => {
        const productos = (p.productos || []).map((x) => `<span>${esc(x)}</span>`).join("");
        const verificado = p.verificado ? '<span class="verified">✓ Verificado</span>' : "";
        const whatsapp = String(p.whatsapp || "").replace(/\D/g, "");
        const mensaje = encodeURIComponent(
          `Hola ${p.nombre}, te contacto desde NEX24 Lens. Me interesa ${(p.productos && p.productos[0]) || "tu producto"}.`
        );

        const menudeo = Number(p.precio_menudeo) || 0;
        const mayoreo = Number(p.precio_mayoreo) || 0;
        const ahorro = Math.max(0, menudeo - mayoreo);
        const ahorroPct = menudeo > 0 ? Math.round((ahorro / menudeo) * 100) : 0;
        const badgeAhorro = ahorro > 0 ? `<span class="nex-badge nex-badge-lime" style="font-weight:700;font-size:10px;margin-left:6px;">-${ahorroPct}% Mayoreo</span>` : "";

        const capacidad = p.capacidad_semanal ? `📦 Suministro: <strong>${esc(p.capacidad_semanal)}/sem</strong>` : "";
        const rutas = (Array.isArray(p.rutas_entrega) && p.rutas_entrega.length) ? `🚚 Rutas: <strong>${esc(p.rutas_entrega.join(", "))}</strong>` : "";
        const logistics = (capacidad || rutas) ? `
          <div class="logistics-info">
            ${capacidad ? `<span>${capacidad}</span>` : ""}
            ${rutas ? `<span>${rutas}</span>` : ""}
          </div>
        ` : "";

        const tiendaUrl = `/tienda?q=${encodeURIComponent(p.nombre)}`;

        return `<article class="producer">
          <div class="producer-head">
            <div>
              <h3>${esc(p.nombre)}</h3>
              <small style="color:var(--nex-text-secondary);text-transform:capitalize;">${esc(p.categoria || "Agroalimentario")}</small>
            </div>
            ${verificado}
          </div>
          <p>${esc(p.descripcion)}</p>
          <div class="producer-products">${productos}</div>
          <div class="prices">
            <div>
              <small>Menudeo (B2C)</small>
              <b>${dinero(p.precio_menudeo)}</b>
              <span> / ${esc(p.unidad)}</span>
            </div>
            <div class="b2b-price">
              <small>Mayoreo (B2B)</small>
              <b>${dinero(p.precio_mayoreo)}</b>
              <span> / ${esc(p.unidad)}</span>
              ${badgeAhorro}
            </div>
          </div>
          ${logistics}
          <div class="producer-footer">
            <span class="distance">📍 ${esc(p.zona_durango)} (${km(p.distancia_km)})</span>
            <a class="btn-catalog" href="${tiendaUrl}">🛒 Ver en Tienda</a>
            ${whatsapp ? `<a class="wa" href="https://wa.me/${whatsapp}?text=${mensaje}" target="_blank" rel="noopener">💬 WhatsApp</a>` : ""}
            <a class="map" href="/mapa?productor=${encodeURIComponent(p.id)}">Ver en mapa ↗</a>
            <a class="map map-ext" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.lat},${p.lng}`)}" target="_blank" rel="noopener">GMaps</a>
          </div>
          ${p.razon ? `<small class="reason">🔍 ${esc(p.razon)}</small>` : ""}
        </article>`;
      })
      .join("");

    const notaFallback =
      data.match_type === "fallback"
        ? '<p class="fallback-note">No encontramos un equivalente exacto; te mostramos productores destacados cerca de la zona.</p>'
        : "";

    results.innerHTML = `
      <div class="detection">
        <div class="detection-icon" aria-hidden="true">${icono}</div>
        <div class="detection-copy">
          <small>Detectamos</small>
          <h3>${esc(productoBonito)}</h3>
          ${marca}
          <div class="keywords">${keywords}</div>
        </div>
        ${confianza > 0 ? `<div class="confidence"><b>${Math.round(confianza * 100)}%</b><small>confianza</small></div>` : ""}
      </div>
      <div class="match-line">
        <span class="match-pill ${esc(data.match_type)}">${esc(matchTexto)}</span>
        <span>${resultados.length} productor${resultados.length === 1 ? "" : "es"} · ${donde}${ms ? ` · ${(ms / 1000).toFixed(1)} s` : ""}</span>
        <a class="map-all" href="mapa.html">🗺️ Ver todos en el mapa</a>
      </div>
      ${notaFallback}
      <div class="producer-list">${tarjetas || '<p class="fallback-note">No hay productores para mostrar.</p>'}</div>
    `;

    results.hidden = false;
    resultsEmpty.hidden = true;
    errorBox.hidden = true;

    window.nexToast?.success(`Identificado: ${productoBonito} (${resultados.length} opciones en Durango)`, 'Lens IA');

    if (window.innerWidth <= 900) {
      results.closest(".results-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function escanear() {
    if (escaneando) return;
    if (!seleccion && !demoActivo) {
      setHint("Sube una foto para comenzar.");
      return;
    }

    const blob = seleccion?.blob || blobDemo();
    const nombre = seleccion?.nombre || `demo-${demoActivo}.png`;
    const formulario = new FormData();
    formulario.append("image", blob, nombre);
    if (ubicacion) {
      formulario.append("lat", ubicacion.lat);
      formulario.append("lng", ubicacion.lng);
    }

    const url = `${API_BASE}/api/lens/scan${demoActivo ? `?demo=${encodeURIComponent(demoActivo)}` : ""}`;

    escaneando = true;
    actualizarBoton();
    scanButton.setAttribute("aria-busy", "true");
    errorBox.hidden = true;
    resultsEmpty.hidden = true;

    const inicio = performance.now();
    const etiqueta = demoActivo ? "demo" : "con IA";
    setHint(`Analizando ${etiqueta}…`);
    const reloj = setInterval(() => {
      const segundos = Math.round((performance.now() - inicio) / 1000);
      setHint(`Analizando ${etiqueta}… ${segundos} s`);
    }, 1000);

    const control = new AbortController();
    const limite = setTimeout(() => control.abort(), 45000);

    try {
      const respuesta = await fetch(url, { method: "POST", body: formulario, signal: control.signal });
      const data = await respuesta.json().catch(() => null);
      if (!respuesta.ok || !data?.ok) {
        throw new Error(data?.error || `La API respondió ${respuesta.status}.`);
      }

      const ms = Math.round(performance.now() - inicio);
      pintarResultados(data, ms);
      setHint(
        `Listo en ${(ms / 1000).toFixed(1)} s · ${
          data.modo === "gemini" ? "IA real" : data.modo === "fallback" ? "respaldo local" : "demo"
        }.`
      );
    } catch (error) {
      const mensaje =
        error.name === "AbortError"
          ? "La API tardó más de 45 s. Intenta con una foto más ligera."
          : error instanceof TypeError
            ? `No pude conectar con la API en ${API_BASE}. ¿Está corriendo “npm start”?`
            : error.message;
      mostrarError(mensaje);
      setHint("No se pudo completar el análisis.");
    } finally {
      clearInterval(reloj);
      clearTimeout(limite);
      escaneando = false;
      scanButton.removeAttribute("aria-busy");
      actualizarBoton();
    }
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
        // Probamos la siguiente base (mismo origen -> puerto 3001).
      }
    }

    apiStatus.classList.add("bad");
    apiStatus.innerHTML = '<span class="dot"></span> API apagada · corre npm start';
  }

  fileInput.addEventListener("change", () => {
    const archivo = fileInput.files?.[0];
    fileInput.value = "";
    if (archivo) procesarArchivo(archivo);
  });

  changePhoto.addEventListener("click", () => fileInput.click());

  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("drag");
  });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag"));
  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("drag");
    const archivo = event.dataTransfer?.files?.[0];
    if (archivo) procesarArchivo(archivo);
  });

  document.querySelectorAll("[data-demo]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const demo = chip.dataset.demo;
      const activar = demoActivo !== demo;

      document.querySelectorAll("[data-demo]").forEach((b) => b.classList.remove("active"));
      demoActivo = activar ? demo : null;
      if (activar) chip.classList.add("active");

      actualizarBoton();
      setHint(
        activar
          ? "Modo demo: respuesta simulada, no se llama a Gemini."
          : seleccion
            ? "Foto lista. Pulsa “Analizar con IA”."
            : "Sube una foto para comenzar."
      );
    });
  });

  useLocation.addEventListener("click", () => {
    if (!navigator.geolocation) {
      locationStatus.textContent = "Este navegador no permite geolocalización.";
      return;
    }

    useLocation.disabled = true;
    locationStatus.textContent = "Obteniendo ubicación…";

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        ubicacion = { lat: posicion.coords.latitude, lng: posicion.coords.longitude };
        locationStatus.textContent = `Ubicación lista (±${Math.round(posicion.coords.accuracy)} m).`;
        useLocation.disabled = false;
        useLocation.textContent = "⌖ Ubicación lista";
      },
      (error) => {
        ubicacion = null;
        locationStatus.textContent =
          error.code === 1
            ? "Permiso denegado. Usaremos el Centro de Durango."
            : "No se pudo obtener la ubicación. Usaremos el Centro.";
        useLocation.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });

  scanButton.addEventListener("click", escanear);

  actualizarBoton();
  comprobarApi();
})();
