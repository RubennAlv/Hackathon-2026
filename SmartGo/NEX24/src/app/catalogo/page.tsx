"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { producers as seedProducers, type Producer } from "@/lib/data";

export default function CatalogPage() {
  const [registered, setRegistered] = useState<Producer[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [location, setLocation] = useState("Todas");
  const [maxPrice, setMaxPrice] = useState(300);
  const [capacity, setCapacity] = useState(0);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    fetch("/api/productores").then((response) => response.json()).then((data) => {
      setRegistered((data.productores || []).map((item: Record<string, unknown>) => ({
        id: String(item.id), name: String(item.name), category: String(item.category), location: String(item.location), zone: String(item.zone), description: String(item.description),
        products: item.products as string[], wholesalePrice: Number(item.wholesalePrice), unit: "kg", capacity: Number(item.capacity), minimumOrder: Number(item.minimumOrder), available: true,
        deliveryDays: String(item.deliveryDays), deliveryTime: String(item.deliveryTime), rating: Number(item.rating) || 0, accent: "#65943a",
      })));
    }).catch(() => setRegistered([]));
  }, []);

  const catalog = useMemo(() => [...seedProducers, ...registered], [registered]);
  const filtered = useMemo(() => catalog.filter((producer) => {
    const text = `${producer.name} ${producer.category} ${producer.products.join(" ")}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase()))
      && (category === "Todas" || producer.category === category)
      && (location === "Todas" || producer.location === location)
      && producer.wholesalePrice <= maxPrice
      && producer.capacity >= capacity
      && (!available || producer.available);
  }), [catalog, query, category, location, maxPrice, capacity, available]);

  const categories = ["Todas", ...new Set(catalog.map((item) => item.category))];
  const locations = ["Todas", ...new Set(catalog.map((item) => item.location))];

  return (
    <>
      <Header />
      <main>
        <section className="section-page-heading"><div><span className="section-kicker">Red de productores</span><h1>Catálogo de proveedores</h1><p>Encuentra productos locales por precio, capacidad y ubicación.</p></div><a href="/match">Realizar match B2B</a></section>
        <section className="catalog-section separated-catalog">
          <div className="catalog-tools">
            <label className="search-field"><span>Buscar</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, producto o categoría" /></label>
            <label><span>Categoría</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Ubicación</span><select value={location} onChange={(event) => setLocation(event.target.value)}>{locations.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Precio máximo</span><select value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))}><option value={300}>Hasta $300/kg</option><option value={100}>Hasta $100/kg</option><option value={200}>Hasta $200/kg</option></select></label>
            <label><span>Capacidad mínima</span><select value={capacity} onChange={(event) => setCapacity(Number(event.target.value))}><option value={0}>Sin mínimo</option><option value={50}>50 kg/semana</option><option value={100}>100 kg/semana</option><option value={200}>200 kg/semana</option></select></label>
            <label className="availability-filter"><input type="checkbox" checked={available} onChange={(event) => setAvailable(event.target.checked)} /><span>Disponibles</span></label>
          </div>
          <div className="catalog-heading"><div><span className="section-kicker">Resultados</span><h2>{filtered.length} proveedores</h2></div></div>
          {filtered.length ? <div className="producer-grid">{filtered.map((producer) => (
            <article className="producer-card" key={producer.id}>
              <div className="producer-cover" style={{ "--producer-accent": producer.accent } as CSSProperties}><span className={`availability ${producer.available ? "is-open" : "is-limited"}`}>{producer.available ? "Disponible" : "Agenda limitada"}</span><div className="producer-monogram">{producer.name.split(" ").map((word) => word[0]).join("").slice(0,2)}</div></div>
              <div className="producer-body"><div className="producer-title"><div><span>{producer.category}</span><h3>{producer.name}</h3></div><b>★ {producer.rating || "Nuevo"}</b></div><p className="producer-description">{producer.description}</p><div className="product-tags">{producer.products.map((product) => <span key={product}>{product}</span>)}</div>
              <div className="commercial-grid"><div><small>Mayoreo</small><strong>${producer.wholesalePrice}<span>/ kg</span></strong></div><div><small>Capacidad</small><strong>{producer.capacity}<span> kg/sem</span></strong></div><div><small>Pedido mínimo</small><strong>{producer.minimumOrder}<span> kg</span></strong></div></div><div className="delivery-row"><span>⌖ {producer.location}</span><span>{producer.deliveryTime}</span></div><div className="producer-actions"><a className="compare-button" href={`/solicitudes`}>Solicitar cotización</a></div></div>
            </article>
          ))}</div> : <div className="empty-catalog"><strong>No hay coincidencias.</strong><p>Ajusta los filtros para ampliar los resultados.</p></div>}
        </section>
      </main>
      <Footer />
    </>
  );
}
