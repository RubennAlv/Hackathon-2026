"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { products } from "@/lib/data";

type CartItem = { id: string; quantity: number };
const stateKey = "nex24-state";
const money = (value: number) => `$${value.toFixed(2)}`;

export default function StorePage() {
  const [inventory, setInventory] = useState(Object.fromEntries(products.map((p) => [p.id, p.stock])));
  const [sales, setSales] = useState(0);
  const [orders, setOrders] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(stateKey);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    setInventory(parsed.inventory ?? inventory);
    setSales(parsed.sales ?? 0);
    setOrders(parsed.orders ?? 0);
  }, []);

  const add = (id: string) => {
    const product = products.find((item) => item.id === id)!;
    const quantity = product.bulk
      ? Number((document.querySelector(`#weight-${id}`) as HTMLInputElement)?.value)
      : 1;
    if (!quantity || quantity <= 0 || quantity > inventory[id]) {
      setMessage(`Ingresa una cantidad válida. Disponible: ${inventory[id]} ${product.unit}.`);
      return;
    }
    setCart((current) => {
      const found = current.find((item) => item.id === id);
      return found
        ? current.map((item) => item.id === id ? { ...item, quantity: item.quantity + quantity } : item)
        : [...current, { id, quantity }];
    });
    setMessage("");
  };

  const total = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.id)!;
    return sum + product.price * item.quantity;
  }, 0);

  const pay = () => {
    const nextInventory = { ...inventory };
    cart.forEach((item) => { nextInventory[item.id] -= item.quantity; });
    setInventory(nextInventory); setCart([]);
    setSales((current) => current + total);
    setOrders((current) => current + 1);
    localStorage.setItem(stateKey, JSON.stringify({ inventory: nextInventory, sales: sales + total, orders: orders + 1 }));
    setMessage(`Pago aprobado por ${money(total)}. Inventario actualizado.`);
  };

  return (
    <>
      <Header />
      <main className="wrap">
        <small>Autoservicio</small><h1>Compra local, a tu medida.</h1>
        <p>Selecciona productos locales y define la cantidad que necesitas.</p>
        {message && <div className="notice success">{message}</div>}
        <div className="shop-layout">
          <section className="catalog">
            {products.map((product) => (
              <article className="store-card" key={product.id}>
                <div className="product-icon">{product.emoji}</div>
                <span className="tag">{product.bulk ? "A granel" : "Empaquetado"}</span>
                <h2>{product.name}</h2><p>{product.category}</p>
                <strong>{money(product.price)} / {product.unit}</strong>
                {product.bulk && <label>Peso neto (kg)<input id={`weight-${product.id}`} type="number" min="0.05" max={inventory[product.id]} step="0.05" defaultValue="0.50" /></label>}
                <button onClick={() => add(product.id)}>Agregar al carrito</button>
              </article>
            ))}
          </section>
          <aside className="cart">
            <h2>Tu compra <span>{cart.length}</span></h2>
            {cart.length === 0 ? <p className="empty-cart">Tu carrito está vacío.</p> : cart.map((item) => {
              const product = products.find((p) => p.id === item.id)!;
              return <div className="cart-line" key={item.id}><span>{product.emoji} {product.name}<small>{item.quantity.toFixed(product.bulk ? 2 : 0)} {product.unit}</small></span><b>{money(product.price * item.quantity)}</b><button aria-label="Quitar" onClick={() => setCart(cart.filter((line) => line.id !== item.id))}>×</button></div>;
            })}
            <div className="total-row"><span>Total</span><b>{money(total)}</b></div>
            <button className="pay-button" disabled={!cart.length} onClick={pay}>Simular pago</button>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
