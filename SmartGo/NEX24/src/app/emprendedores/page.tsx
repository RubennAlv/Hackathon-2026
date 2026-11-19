"use client";

import { useEffect, useState } from "react";
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
      <main className="wrap">
        <small>Panel administrativo</small>
        <h1>Control de tu negocio.</h1>
        <p>Consulta inventario y ventas actualizadas desde el autoservicio.</p>
        <section className="stats">
          <article>
            <span>Productos registrados</span>
            <strong>{String(products.length).padStart(2, "0")}</strong>
          </article>
          <article>
            <span>Ventas acumuladas</span>
            <strong>{money(sales)}</strong>
          </article>
          <article>
            <span>Alertas de inventario</span>
            <strong>{String(low).padStart(2, "0")}</strong>
          </article>
        </section>
        <section className="tablebox">
          <div className="section-heading">
            <h2>Inventario</h2>
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
        </section>
      </main>
      <Footer />
    </>
  );
}
