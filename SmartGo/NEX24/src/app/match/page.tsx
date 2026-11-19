"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { producers as seedProducers, type Producer } from "@/lib/data";

export default function MatchPage() {
  const [registered, setRegistered] = useState<Producer[]>([]);
  const [product, setProduct] = useState("Café");
  const [quantity, setQuantity] = useState(20);
  const [budget, setBudget] = useState(300);
  const [zone, setZone] = useState("Centro");
  const [submitted, setSubmitted] = useState(false);

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
  const matches = useMemo(() => submitted ? catalog.filter((producer) => {
    const productCompatible = producer.category.toLowerCase() === product.toLowerCase() || producer.products.some((item) => item.toLowerCase().includes(product.toLowerCase()));
    const zoneCompatible = zone === "Durango completo" || producer.location.toLowerCase() === zone.toLowerCase() || producer.zone.toLowerCase().includes(zone.toLowerCase());
    return productCompatible && producer.available && producer.capacity >= quantity && producer.minimumOrder <= quantity && producer.wholesalePrice <= budget && zoneCompatible;
  }).map((producer) => {
    let score = 45;
    if (producer.category.toLowerCase() === product.toLowerCase()) score += 25;
    if (producer.capacity >= quantity * 2) score += 10;
    if (producer.wholesalePrice <= budget) score += 10;
    if (zone === "Durango completo" || producer.zone.toLowerCase().includes(zone.toLowerCase())) score += 10;
    return { producer, score: Math.min(score, 99) };
  }).sort((a, b) => b.score - a.score) : [], [catalog, submitted, product, quantity, budget, zone]);

  return (
    <>
      <Header />
      <main>
        <section className="section-page-heading"><div><span className="section-kicker">Match B2B</span><h1>Encuentra proveedores compatibles</h1><p>Introduce las necesidades reales de tu negocio.</p></div><Link href="/catalogo">Ver catálogo completo</Link></section>
        <section className="match-section separated-match">
          <div className="match-layout">
            <form className="match-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
              <label><span>Producto</span><select value={product} onChange={(event) => setProduct(event.target.value)}><option>Café</option><option>Frutos secos</option><option>Granos</option><option>Hortalizas</option><option>Procesados</option><option>Dulces</option></select></label>
              <label><span>Cantidad semanal</span><div className="number-suffix"><input type="number" min="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}/><b>kg</b></div></label>
              <label><span>Presupuesto máximo</span><div className="number-suffix"><b>$</b><input type="number" min="1" value={budget} onChange={(event) => setBudget(Number(event.target.value))}/><em>por kg</em></div></label>
              <label><span>Zona de entrega</span><select value={zone} onChange={(event) => setZone(event.target.value)}><option>Centro</option><option>Durango</option><option>Sur de Durango</option><option>Norte de Durango</option><option>Durango completo</option></select></label>
              <button type="submit">Encontrar proveedores <span>→</span></button>
            </form>
            <div className="match-results">
              {!submitted ? <div className="match-placeholder"><div>◎</div><strong>Configura tu búsqueda</strong><p>Solo se mostrarán proveedores que puedan cubrir la cantidad solicitada.</p></div> : matches.length ? <>{matches.map(({ producer, score }) => <article className="match-result" key={producer.id}><div className="match-result-score"><strong>{score}%</strong><span>compatible</span></div><div className="match-result-info"><span>{producer.category}</span><h3>{producer.name}</h3><p>{producer.location} · {producer.deliveryTime}</p></div><div className="match-result-price"><small>Mayoreo</small><strong>${producer.wholesalePrice}/kg</strong><span>{producer.capacity} kg disponibles</span></div><Link href="/solicitudes">Solicitar</Link></article>)}</> : <div className="match-placeholder no-match"><div>!</div><strong>No hay coincidencias compatibles</strong><p>Aumenta el presupuesto o amplia la zona de entrega.</p></div>}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
