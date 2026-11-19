"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { producers as seedProducers, type Producer } from "@/lib/data";
import { COMMERCIAL_REQUESTS_KEY, type CommercialRequest, type RequestType } from "@/lib/commercial";

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [location, setLocation] = useState("Todas");
  const [maxPrice, setMaxPrice] = useState(300);
  const [minCapacity, setMinCapacity] = useState(0);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);
  const [matchProduct, setMatchProduct] = useState("Café");
  const [matchQuantity, setMatchQuantity] = useState(20);
  const [matchBudget, setMatchBudget] = useState(300);
  const [matchZone, setMatchZone] = useState("Centro");
  const [matchSubmitted, setMatchSubmitted] = useState(false);
  const [selectedProducerId, setSelectedProducerId] = useState("");
  const [requestType, setRequestType] = useState<RequestType>("Cotización");
  const [businessName, setBusinessName] = useState("");
  const [requestProduct, setRequestProduct] = useState("");
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestNotes, setRequestNotes] = useState("");
  const [requestSaved, setRequestSaved] = useState(false);
  const [registeredProducers, setRegisteredProducers] = useState<Producer[]>([]);

  useEffect(() => {
    fetch("/api/productores")
      .then((response) => response.json())
      .then((data) => {
        const registered = (data.productores || []).map((producer: Record<string, unknown>) => ({
          id: String(producer.id),
          name: String(producer.name),
          category: String(producer.category),
          location: String(producer.location),
          zone: String(producer.zone),
          description: String(producer.description),
          products: producer.products as string[],
          wholesalePrice: Number(producer.wholesalePrice),
          unit: "kg",
          capacity: Number(producer.capacity),
          minimumOrder: Number(producer.minimumOrder),
          available: true,
          deliveryDays: String(producer.deliveryDays),
          deliveryTime: String(producer.deliveryTime),
          rating: Number(producer.rating) || 0,
          accent: "#65943a",
        })) as Producer[];
        setRegisteredProducers(registered);
      })
      .catch(() => setRegisteredProducers([]));
  }, []);

  const producerCatalog = useMemo(() => [...seedProducers, ...registeredProducers], [registeredProducers]);

  const filtered = useMemo(
    () =>
      producerCatalog.filter((producer) => {
        const text = `${producer.name} ${producer.products.join(" ")} ${producer.category}`.toLowerCase();
        return (
          (!query || text.includes(query.toLowerCase())) &&
          (category === "Todas" || producer.category === category) &&
          (location === "Todas" || producer.location === location) &&
          producer.wholesalePrice <= maxPrice &&
          producer.capacity >= minCapacity &&
          (!availableOnly || producer.available)
        );
      }),
    [producerCatalog, query, category, location, maxPrice, minCapacity, availableOnly]
  );

  const categories = ["Todas", ...new Set(producerCatalog.map((item) => item.category))];
  const locations = ["Todas", ...new Set(producerCatalog.map((item) => item.location))];
  const compared = producerCatalog.filter((producer) => compare.includes(producer.id));

  const toggleCompare = (id: string) => {
    setCompare((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 3 ? [...current, id] : current
    );
  };

  const matches = matchSubmitted ? producerCatalog
    .filter((producer) => {
      const productCompatible = producer.category.toLowerCase() === matchProduct.toLowerCase()
        || producer.products.some((product) => product.toLowerCase().includes(matchProduct.toLowerCase()));
      const zoneCompatible = matchZone === "Durango completo"
        || producer.location.toLowerCase() === matchZone.toLowerCase().replace("zona ", "")
        || producer.zone.toLowerCase().includes(matchZone.toLowerCase());
      return productCompatible
        && producer.available
        && producer.capacity >= matchQuantity
        && producer.minimumOrder <= matchQuantity
        && producer.wholesalePrice <= matchBudget
        && zoneCompatible;
    })
    .map((producer) => {
      let score = 45;
      if (producer.category.toLowerCase() === matchProduct.toLowerCase()) score += 25;
      else if (producer.products.some((product) => product.toLowerCase().includes(matchProduct.toLowerCase()))) score += 20;
      if (producer.capacity >= matchQuantity * 2) score += 10;
      if (producer.wholesalePrice <= matchBudget) score += 10;
      if (matchZone === "Durango completo" || producer.zone.toLowerCase().includes(matchZone.toLowerCase())) score += 10;
      return { producer, score: Math.min(score, 99) };
    })
    .sort((a, b) => b.score - a.score) : [];

  const openRequest = (producerId: string, type: RequestType = "Cotización") => {
    const producer = producerCatalog.find((item) => item.id === producerId);
    setSelectedProducerId(producerId);
    setRequestType(type);
    setRequestProduct(producer?.products[0] || "");
    setRequestQuantity(producer?.minimumOrder || 1);
    setRequestNotes("");
    setRequestSaved(false);
  };

  const saveRequest = (event: React.FormEvent) => {
    event.preventDefault();
    const producer = producerCatalog.find((item) => item.id === selectedProducerId);
    if (!producer || !businessName.trim()) return;
    let requests: CommercialRequest[] = [];
    try {
      requests = JSON.parse(localStorage.getItem(COMMERCIAL_REQUESTS_KEY) || "[]") as CommercialRequest[];
    } catch {
      requests = [];
    }
    const request: CommercialRequest = {
      id: `${Date.now()}-${producer.id}`,
      producerId: producer.id,
      producerName: producer.name,
      businessName: businessName.trim(),
      product: requestProduct,
      quantity: requestQuantity,
      unit: producer.unit === "kg" ? "kg" : "pieza",
      type: requestType,
      status: "Pendiente",
      notes: requestNotes.trim(),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(COMMERCIAL_REQUESTS_KEY, JSON.stringify([request, ...requests]));
    setRequestSaved(true);
  };

  return (
    <>
      <Header />
      <main>
        <section className="landing-hero" id="inicio">
          <div className="landing-copy">
            <span className="landing-kicker">PLATAFORMA DE ABASTECIMIENTO LOCAL</span>
            <h1>Lo que tu negocio necesita,<br /><em>crece cerca de ti.</em></h1>
            <p>Abasto DGO conecta productores de Durango con cafeterías, restaurantes, tiendas y comercios que buscan abastecimiento confiable.</p>
            <div className="landing-actions">
              <Link className="landing-primary" href="/registro">Crear mi cuenta <span>→</span></Link>
              <a className="landing-secondary" href="#como-funciona">Conocer cómo funciona</a>
            </div>
            <div className="landing-proof"><span><strong>Local</strong>Proveedores de Durango</span><span><strong>B2B</strong>Compras al mayoreo</span><span><strong>Directo</strong>Sin intermediarios</span></div>
          </div>
          <aside className="role-panel">
            <div className="role-panel-heading"><span>Únete a Abasto DGO</span><b>Selecciona tu perfil</b></div>
            <Link className="role-option provider-role" href="/registro?tipo=productor"><div className="role-icon">P</div><div><span>Proveedor</span><h2>Soy productor</h2><p>Publica tus productos, precios y capacidad de abastecimiento.</p></div><b>→</b></Link>
            <Link className="role-option merchant-role" href="/registro?tipo=comerciante"><div className="role-icon">N</div><div><span>Negocio</span><h2>Comerciante o tiendita</h2><p>Encuentra proveedores y solicita cotizaciones al mayoreo.</p></div><b>→</b></Link>
          </aside>
        </section>

        <section className="how-section" id="como-funciona">
          <div className="how-heading"><span>Así funciona</span><h2>Abasto local, proceso simple.</h2></div>
          <div className="how-grid">
            <article><b>01</b><h3>Define tu necesidad</h3><p>Indica producto, cantidad semanal, presupuesto y zona de entrega.</p></article>
            <article><b>02</b><h3>Encuentra proveedores</h3><p>Compara precio mayoreo, capacidad, pedido mínimo y disponibilidad.</p></article>
            <article><b>03</b><h3>Construye alianzas</h3><p>Solicita cotizaciones y da seguimiento hasta confirmar el abastecimiento.</p></article>
          </div>
        </section>

        <section className="platform-hero" id="inicio-catalogo">
          <div className="platform-copy">
            <div className="platform-status"><span>RED COMERCIAL LOCAL</span></div>
            <h1>Abastece mejor.<br /><em>Crece con Durango.</em></h1>
            <p>Conecta tu negocio con productores locales capaces de responder a tus necesidades de compra y entrega.</p>
            <div className="hero-actions"><Link className="primary-action" href="/catalogo">Buscar proveedores <span>→</span></Link><Link className="secondary-action" href="/registro">Crear mi cuenta</Link></div>
          </div>
          <aside className="platform-preview">
            <div className="preview-top"><span>Abasto DGO</span><b>Negocios locales</b></div>
            <div className="preview-metrics"><Link href="/match"><b>Realizar match</b>Por necesidad</Link><Link href="/catalogo"><b>Ver catálogo</b>Por productor</Link><Link href="/solicitudes"><b>Mis solicitudes</b>Consultar estado</Link></div>
          </aside>
        </section>

        <section className="experience-switch" aria-label="Experiencias de la plataforma">
          <Link className="experience-card citizen" href="/tienda">
            <span>Lens Local</span>
            <b>Compra para tu hogar</b>
            <small>Ver tienda →</small>
          </Link>
          <Link className="experience-card business" href="/catalogo">
            <span>Abasto DGO</span>
            <b>Compra para tu negocio</b>
            <small>Buscar productores →</small>
          </Link>
        </section>

        <section className="match-section" id="match">
          <div className="match-heading">
            <div><span className="section-kicker">Match B2B</span><h2>Cuéntanos qué necesita tu negocio.</h2></div>
            <p>Buscaremos proveedores que puedan cubrir cantidad, precio, ubicación y disponibilidad.</p>
          </div>
          <div className="match-layout">
            <form className="match-form" onSubmit={(event) => { event.preventDefault(); setMatchSubmitted(true); }}>
              <label><span>Producto que necesitas</span><select value={matchProduct} onChange={(event) => setMatchProduct(event.target.value)}><option>Café</option><option>Frutos secos</option><option>Granos</option><option>Hortalizas</option><option>Procesados</option><option>Dulces</option></select></label>
              <label><span>Cantidad semanal</span><div className="number-suffix"><input type="number" min="1" value={matchQuantity} onChange={(event) => setMatchQuantity(Number(event.target.value))} /><b>kg</b></div></label>
              <label><span>Presupuesto máximo</span><div className="number-suffix"><b>$</b><input type="number" min="1" value={matchBudget} onChange={(event) => setMatchBudget(Number(event.target.value))} /><em>por kg</em></div></label>
              <label><span>Zona de entrega</span><select value={matchZone} onChange={(event) => setMatchZone(event.target.value)}><option>Centro</option><option>Durango</option><option>Sur de Durango</option><option>Norte de Durango</option><option>Durango completo</option></select></label>
              <button type="submit">Encontrar coincidencias <span>→</span></button>
            </form>

            <div className="match-results">
              {!matchSubmitted ? (
                <div className="match-placeholder"><div>◎</div><strong>Tu búsqueda aparecerá aquí</strong><p>Completa las necesidades de tu negocio para recibir proveedores compatibles.</p></div>
              ) : matches.length ? (
                <>
                  <div className="match-results-head"><div><span>Resultados compatibles</span><strong>{matches.length} coincidencia{matches.length > 1 ? "s" : ""}</strong></div><small>Ordenado por compatibilidad</small></div>
                  {matches.map(({ producer, score }) => (
                    <article className="match-result" key={producer.id}>
                      <div className="match-result-score"><strong>{score}%</strong><span>compatible</span></div>
                      <div className="match-result-info"><span>{producer.category}</span><h3>{producer.name}</h3><p>{producer.location} · Entrega {producer.deliveryTime}</p></div>
                      <div className="match-result-price"><small>Mayoreo</small><strong>${producer.wholesalePrice}/kg</strong><span>{producer.capacity} kg disponibles</span></div>
                      <button onClick={() => openRequest(producer.id)}>Solicitar cotización</button>
                    </article>
                  ))}
                </>
              ) : (
                <div className="match-placeholder no-match"><div>!</div><strong>No encontramos una coincidencia compatible</strong><p>Prueba aumentar el presupuesto o cambiar la zona de entrega.</p></div>
              )}
            </div>
          </div>
        </section>

        <section className="catalog-section" id="catalogo">
          <div className="catalog-heading">
            <div>
              <span className="section-kicker">Red de productores</span>
              <h2>Encuentra a tu próximo proveedor.</h2>
            </div>
            <div className="catalog-count">
              <strong>{filtered.length}</strong>
              <span>proveedores disponibles</span>
            </div>
          </div>

          <div className="catalog-tools">
            <label className="search-field">
              <span>Buscar</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre, producto o categoría"
              />
            </label>
            <label>
              <span>Categoría</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Ubicación</span>
              <select value={location} onChange={(event) => setLocation(event.target.value)}>
                {locations.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Precio máximo</span>
              <select value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))}>
                <option value={300}>Hasta $300/kg</option>
                <option value={100}>Hasta $100/kg</option>
                <option value={200}>Hasta $200/kg</option>
              </select>
            </label>
            <label>
              <span>Capacidad mínima</span>
              <select value={minCapacity} onChange={(event) => setMinCapacity(Number(event.target.value))}>
                <option value={0}>Sin mínimo</option>
                <option value={50}>50 kg / semana</option>
                <option value={100}>100 kg / semana</option>
                <option value={200}>200 kg / semana</option>
              </select>
            </label>
            <label className="availability-filter">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(event) => setAvailableOnly(event.target.checked)}
              />
              <span>Solo disponibles</span>
            </label>
          </div>

          {filtered.length ? (
            <div className="producer-grid">
              {filtered.map((producer) => (
                <article className="producer-card" key={producer.id}>
                  <div
                    className="producer-cover"
                    style={{ "--producer-accent": producer.accent } as CSSProperties}
                  >
                    <span className={`availability ${producer.available ? "is-open" : "is-limited"}`}>
                      {producer.available ? "Disponible" : "Agenda limitada"}
                    </span>
                    <div className="producer-monogram">
                      {producer.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}
                    </div>
                  </div>
                  <div className="producer-body">
                    <div className="producer-title">
                      <div>
                        <span>{producer.category}</span>
                        <h3>{producer.name}</h3>
                      </div>
                      <b>★ {producer.rating}</b>
                    </div>
                    <p className="producer-description">{producer.description}</p>
                    <div className="product-tags">
                      {producer.products.map((product) => (
                        <span key={product}>{product}</span>
                      ))}
                    </div>
                    <div className="commercial-grid">
                      <div>
                        <small>Mayoreo</small>
                        <strong>
                          ${producer.wholesalePrice}
                          <span>/ {producer.unit}</span>
                        </strong>
                      </div>
                      <div>
                        <small>Capacidad</small>
                        <strong>
                          {producer.capacity}
                          <span> kg/sem</span>
                        </strong>
                      </div>
                      <div>
                        <small>Pedido mínimo</small>
                        <strong>
                          {producer.minimumOrder}
                          <span> kg</span>
                        </strong>
                      </div>
                    </div>
                    <div className="delivery-row">
                      <span>⌖ {producer.location}</span>
                      <span>Entrega: {producer.deliveryTime}</span>
                    </div>
                    <div className="producer-actions">
                      <button className="compare-button" onClick={() => toggleCompare(producer.id)}>
                        {compare.includes(producer.id) ? "Quitar de comparación" : "Comparar"}
                      </button>
                      <button className="contact-button" onClick={() => openRequest(producer.id)}>Solicitar cotización</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-catalog">
              <strong>No encontramos coincidencias.</strong>
              <p>Reduce los filtros o prueba con otro producto.</p>
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("Todas");
                  setLocation("Todas");
                  setMaxPrice(300);
                  setMinCapacity(0);
                  setAvailableOnly(false);
                }}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </section>

        {compared.length > 0 && (
          <section className="comparison-panel" aria-label="Comparación de proveedores">
            <div className="comparison-heading">
              <div>
                <span>Comparación comercial</span>
                <h2>
                  {compared.length} proveedor{compared.length > 1 ? "es" : ""} seleccionado
                  {compared.length > 1 ? "s" : ""}
                </h2>
              </div>
              <button onClick={() => setCompare([])}>Cerrar</button>
            </div>
            <div className="comparison-grid">
              {compared.map((producer) => (
                <article key={producer.id}>
                  <h3>{producer.name}</h3>
                  <span>${producer.wholesalePrice}/kg mayoreo</span>
                  <span>{producer.capacity} kg/semana</span>
                  <span>Mínimo {producer.minimumOrder} kg</span>
                  <span>{producer.deliveryTime}</span>
                </article>
              ))}
            </div>
          </section>
        )}

        {selectedProducerId && (
          <div className="request-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedProducerId(""); }}>
            <section className="request-modal" role="dialog" aria-modal="true" aria-labelledby="request-title">
              <div className="request-modal-heading"><div><span>Solicitud comercial</span><h2 id="request-title">{producerCatalog.find((item) => item.id === selectedProducerId)?.name}</h2></div><button aria-label="Cerrar" onClick={() => setSelectedProducerId("")}>×</button></div>
              {requestSaved ? (
                <div className="request-confirmation"><h3>Solicitud registrada</h3><p>Consulta su estado en Solicitudes enviadas.</p><div><Link href="/solicitudes">Ver solicitudes</Link><button onClick={() => setSelectedProducerId("")}>Cerrar</button></div></div>
              ) : (
                <form onSubmit={saveRequest}>
                  <label><span>Tipo de solicitud</span><select value={requestType} onChange={(event) => setRequestType(event.target.value as RequestType)}><option>Cotización</option><option>Caja de muestra</option><option>Abastecimiento</option></select></label>
                  <label><span>Nombre del negocio</span><input required value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Ej. Cafetería Centro" /></label>
                  <label><span>Producto</span><select value={requestProduct} onChange={(event) => setRequestProduct(event.target.value)}>{producerCatalog.find((item) => item.id === selectedProducerId)?.products.map((product) => <option key={product}>{product}</option>)}</select></label>
                  <label><span>Cantidad requerida</span><input required type="number" min="1" value={requestQuantity} onChange={(event) => setRequestQuantity(Number(event.target.value))} /></label>
                  <label className="request-notes"><span>Notas</span><textarea value={requestNotes} onChange={(event) => setRequestNotes(event.target.value)} placeholder="Frecuencia, horario o condiciones de entrega" /></label>
                  <button type="submit">Enviar solicitud</button>
                </form>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
