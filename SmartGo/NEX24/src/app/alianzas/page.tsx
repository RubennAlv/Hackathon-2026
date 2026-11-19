"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ALLIANCES_KEY, type AllianceStatus, type CommercialAlliance } from "@/lib/alliances";

const initialAlliance: CommercialAlliance = {
  id: "demo-alianza-sierra",
  requestId: "demo-cafeteria-centro",
  businessName: "Cafetería Centro",
  producerId: "sierra",
  producerName: "Tostaduría Sierra",
  products: ["Café en grano"],
  quantity: 20,
  unit: "kg",
  conditions: "Entrega semanal · Pago contra entrega",
  status: "Activa",
  createdAt: "2026-11-19T12:00:00.000Z",
};

const statuses: AllianceStatus[] = ["Activa", "En negociación", "Suspendida", "Finalizada"];

export default function AlliancesPage() {
  const [alliances, setAlliances] = useState<CommercialAlliance[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(ALLIANCES_KEY) || "[]") as CommercialAlliance[];
      setAlliances(stored.length ? stored : [initialAlliance]);
      if (!stored.length) localStorage.setItem(ALLIANCES_KEY, JSON.stringify([initialAlliance]));
    } catch {
      setAlliances([initialAlliance]);
    }
  }, []);

  const updateStatus = (id: string, status: AllianceStatus) => {
    const updated = alliances.map((alliance) => alliance.id === id ? { ...alliance, status } : alliance);
    setAlliances(updated);
    localStorage.setItem(ALLIANCES_KEY, JSON.stringify(updated));
  };

  return (
    <>
      <Header />
      <main className="alliances-page">
        <div className="alliances-heading"><div><span className="section-kicker">Comercial confirmado</span><h1>Alianzas comerciales</h1></div><a href="/solicitudes">Ver solicitudes</a></div>
        {alliances.length === 0 ? (
          <section className="alliances-empty"><h2>No existen alianzas confirmadas</h2><p>Una alianza aparece después de aceptar una solicitud comercial.</p></section>
        ) : (
          <section className="alliances-list">
            {alliances.map((alliance) => (
              <article className="alliance-card" key={alliance.id}>
                <div className="alliance-top"><span className={`alliance-status alliance-${alliance.status.toLowerCase().replace(" ", "-")}`}>{alliance.status}</span><label><span>Estado</span><select value={alliance.status} onChange={(event) => updateStatus(alliance.id, event.target.value as AllianceStatus)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label></div>
                <div className="alliance-participants"><div><small>Negocio</small><h2>{alliance.businessName}</h2></div><b>↔</b><div><small>Productor</small><h2>{alliance.producerName}</h2></div></div>
                <div className="alliance-details"><div><small>Productos acordados</small><strong>{alliance.products.join(", ")}</strong></div><div><small>Cantidad acordada</small><strong>{alliance.quantity} {alliance.unit}</strong></div><div><small>Condiciones</small><strong>{alliance.conditions}</strong></div></div>
              </article>
            ))}
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
