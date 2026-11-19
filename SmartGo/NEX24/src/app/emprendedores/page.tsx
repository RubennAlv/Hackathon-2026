"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { products } from "@/lib/data";

const stateKey = "nex24-state";
const money = (value: number) => `$${value.toFixed(2)}`;

export default function EntrepreneursPage() {
  const [inventory, setInventory] = useState(Object.fromEntries(products.map((p) => [p.id, p.stock])));
  const [sales, setSales] = useState(0); const [orders, setOrders] = useState(0);
  useEffect(() => {
    const saved = localStorage.getItem(stateKey); if (!saved) return;
    const parsed = JSON.parse(saved); setInventory(parsed.inventory ?? inventory); setSales(parsed.sales ?? 0); setOrders(parsed.orders ?? 0);
  }, []);
  const low = products.filter((p) => inventory[p.id] <= 5).length;

  return (
    <>
      <Header panel />
      <main className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <div><span>ABASTO DGO</span><b>Panel de negocio</b></div>
          <nav aria-label="Panel">
            <Link className="active" href="/emprendedores"><b>▦</b>Resumen</Link>
            <Link href="/registro"><b>＋</b>Registrar productor</Link>
            <Link href="/solicitudes"><b>↗</b>Solicitudes</Link>
            <Link href="/alianzas"><b>⌁</b>Alianzas</Link>
            <Link href="/"><b>⌂</b>Ir al inicio</Link>
          </nav>
        </aside>
        <section className="dashboard-content">
          <div className="dashboard-heading">
            <div>
              <span>Resumen general</span>
              <h1>Buen día, emprendedor.</h1>
            </div>
            <Link href="/registro">Añadir productor</Link>
          </div>
          <section className="dashboard-metrics">
            <article>
              <span>Productos registrados</span>
              <strong>{String(products.length).padStart(2, "0")}</strong>
              <small>Catálogo de demostración</small>
            </article>
            <article>
              <span>Ventas acumuladas</span>
              <strong>{money(sales)}</strong>
              <small>Ventas registradas localmente</small>
            </article>
            <article>
              <span>Alertas de inventario</span>
              <strong>{String(low).padStart(2, "0")}</strong>
              <small>{low ? "Productos requieren atención" : "Inventario sin alertas"}</small>
            </article>
          </section>
          <section className="dashboard-grid">
            <article className="dashboard-card inventory-card">
              <div className="dashboard-card-heading">
                <div>
                  <span>Inventario</span>
                  <h2>Existencias actuales</h2>
                </div>
                <span>{orders ? `${orders} compra${orders === 1 ? "" : "s"} registrada${orders === 1 ? "" : "s"}` : "Sin ventas aún"}</span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Tipo</th>
                      <th>Existencia</th>
                      <th>Unidad</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const stock = inventory[p.id];
                      const warning = stock <= 5;
                      return (
                        <tr key={p.id}>
                          <td>{p.emoji} {p.name}</td>
                          <td>{p.bulk ? "A granel" : "Empaquetado"}</td>
                          <td>{stock.toFixed(p.bulk ? 2 : 0)}</td>
                          <td>{p.unit}</td>
                          <td><span className={`status-pill ${warning ? "warning" : "available"}`}>{warning ? "Stock bajo" : "Disponible"}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>
            <aside className="dashboard-card quick-card">
              <span>Acciones rápidas</span>
              <h2>Gestiona tu operación</h2>
              <Link href="/registro">Registrar nuevo productor</Link>
              <Link href="/solicitudes">Consultar solicitudes</Link>
              <Link href="/alianzas">Ver alianzas</Link>
              <Link href="/tienda">Abrir tienda Lens Local</Link>
            </aside>
          </section>
        </section>
      </main>
      <Footer />
    </>
  );
}
