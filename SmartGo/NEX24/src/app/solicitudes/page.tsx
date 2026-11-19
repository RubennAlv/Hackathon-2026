"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { COMMERCIAL_REQUESTS_KEY, type CommercialRequest, type RequestStatus } from "@/lib/commercial";
import { ALLIANCES_KEY, type CommercialAlliance } from "@/lib/alliances";

const statuses: RequestStatus[] = ["Pendiente", "En revisión", "Aceptada", "Rechazada", "Finalizada"];

export default function RequestsPage() {
  const [requests, setRequests] = useState<CommercialRequest[]>([]);

  useEffect(() => {
    try {
      setRequests(JSON.parse(localStorage.getItem(COMMERCIAL_REQUESTS_KEY) || "[]"));
    } catch {
      setRequests([]);
    }
  }, []);

  const updateStatus = (id: string, status: RequestStatus) => {
    const updated = requests.map((request) => request.id === id ? { ...request, status } : request);
    setRequests(updated);
    localStorage.setItem(COMMERCIAL_REQUESTS_KEY, JSON.stringify(updated));

    if (status === "Aceptada") {
      const request = updated.find((item) => item.id === id);
      if (!request) return;
      let alliances: CommercialAlliance[] = [];
      try {
        alliances = JSON.parse(localStorage.getItem(ALLIANCES_KEY) || "[]") as CommercialAlliance[];
      } catch {
        alliances = [];
      }
      if (!alliances.some((alliance) => alliance.requestId === request.id)) {
        alliances.push({
          id: `alianza-${request.id}`,
          requestId: request.id,
          businessName: request.businessName,
          producerId: request.producerId,
          producerName: request.producerName,
          products: [request.product],
          quantity: request.quantity,
          unit: request.unit,
          conditions: request.notes || "Entrega acordada entre ambas partes",
          status: "Activa",
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem(ALLIANCES_KEY, JSON.stringify(alliances));
      }
    }
  };

  const removeRequest = (id: string) => {
    const updated = requests.filter((request) => request.id !== id);
    setRequests(updated);
    localStorage.setItem(COMMERCIAL_REQUESTS_KEY, JSON.stringify(updated));
  };

  return (
    <>
      <Header />
      <main className="requests-page">
        <div className="requests-heading">
          <div>
            <span className="section-kicker">Comercial</span>
            <h1>Solicitudes enviadas</h1>
          </div>
          <div className="requests-heading-actions">
            <a href="/alianzas">Ver alianzas</a>
            <a href="/#catalogo">Buscar proveedores</a>
          </div>
        </div>
        {requests.length === 0 ? (
          <section className="requests-empty">
            <h2>No hay solicitudes registradas</h2>
            <p>Envía una cotización o solicita una caja de muestra desde el catálogo.</p>
            <a href="/#catalogo">Abrir catálogo</a>
          </section>
        ) : (
          <section className="requests-list">
            {requests.map((request) => (
              <article className="request-row" key={request.id}>
                <div className="request-main">
                  <span>{request.type}</span>
                  <h2>{request.producerName}</h2>
                  <p>
                    {request.businessName} · {request.product} · {request.quantity} {request.unit}
                  </p>
                  {request.notes && <small>{request.notes}</small>}
                </div>
                <div className="request-actions">
                  <label>
                    <span>Estado</span>
                    <select
                      value={request.status}
                      onChange={(event) => updateStatus(request.id, event.target.value as RequestStatus)}
                    >
                      {statuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <button onClick={() => removeRequest(request.id)}>Eliminar</button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
