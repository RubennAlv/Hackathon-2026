"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const categories = ["Café", "Granos", "Frutos secos", "Hortalizas", "Procesados", "Dulces", "Otro"];

export default function ProducerRegistrationPage() {
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState<"productor" | "comerciante" | "">("");

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("tipo");
    if (value === "productor" || value === "comerciante") setRole(value);
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      description: form.get("description"),
      contactName: form.get("contactName"),
      phone: form.get("phone"),
      category: form.get("category"),
      products: String(form.get("products") || "").split(";").map((value) => value.trim()).filter(Boolean),
      retailPrice: Number(form.get("retailPrice")),
      wholesalePrice: Number(form.get("wholesalePrice")),
      capacity: Number(form.get("capacity")),
      minimumOrder: Number(form.get("minimumOrder")),
      deliveryDays: form.get("deliveryDays"),
      deliveryTime: form.get("deliveryTime"),
      location: form.get("location"),
      zone: form.get("zone"),
      photo: form.get("photo"),
    };

    try {
      const response = await fetch("/api/productores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo registrar el productor.");
      setStatus("success");
      setMessage(`${payload.name} fue registrado y ya está disponible para el catálogo.`);
      event.currentTarget.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo registrar el productor.");
    }
  };

  return (
    <>
      <Header />
      <main className="registration-page">
        <div className="registration-heading"><div><span className="section-kicker">Crear cuenta</span><h1>¿Cómo participas en Abasto DGO?</h1></div><a href="/#catalogo">Ver catálogo</a></div>
        <div className="registration-roles">
          <button type="button" className={role === "productor" ? "selected" : ""} onClick={() => setRole("productor")}><span>Proveedor</span><b>Soy productor</b><p>Publica productos y recibe solicitudes comerciales.</p></button>
          <Link className={role === "comerciante" ? "selected" : ""} href="/emprendedores"><span>Negocio</span><b>Comerciante o tiendita</b><p>Administra compras y encuentra proveedores locales.</p></Link>
        </div>
        {role === "productor" && (
          <>
            <div className="registration-heading"><div><span className="section-kicker">Alta de productor</span><h1>Incorporar productor</h1></div><a href="/#catalogo">Ver catálogo</a></div>
            <form className="registration-form" onSubmit={submit}>
              <fieldset><legend>Información general</legend><div className="form-grid">
                <label><span>Nombre del productor o empresa</span><input name="name" required maxLength={120} placeholder="Ej. Finca El Silencio" /></label>
                <label><span>Nombre de contacto</span><input name="contactName" required maxLength={80} placeholder="Nombre completo" /></label>
                <label className="full-field"><span>Descripción</span><textarea name="description" required maxLength={500} placeholder="Describe la producción, historia y propuesta comercial" /></label>
                <label><span>Teléfono o medio de contacto</span><input name="phone" required maxLength={30} placeholder="618 123 4567" /></label>
                <label><span>Categoría</span><select name="category" required>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
              </div></fieldset>

              <fieldset><legend>Productos y precios</legend><div className="form-grid">
                <label className="full-field"><span>Productos ofrecidos</span><input name="products" required placeholder="Café en grano; Café molido" /><small>Separa varios productos con punto y coma.</small></label>
                <label><span>Precio de menudeo</span><div className="money-field"><b>$</b><input name="retailPrice" type="number" min="1" step="0.01" required placeholder="240" /></div></label>
                <label><span>Precio de mayoreo</span><div className="money-field"><b>$</b><input name="wholesalePrice" type="number" min="1" step="0.01" required placeholder="210" /></div></label>
                <label><span>Capacidad semanal</span><div className="unit-field"><input name="capacity" type="number" min="1" required placeholder="80" /><b>kg</b></div></label>
                <label><span>Pedido mínimo</span><div className="unit-field"><input name="minimumOrder" type="number" min="1" required placeholder="5" /><b>kg</b></div></label>
              </div></fieldset>

              <fieldset><legend>Entrega y ubicación</legend><div className="form-grid">
                <label><span>Días de entrega</span><input name="deliveryDays" required placeholder="Lunes, miércoles y viernes" /></label>
                <label><span>Tiempo de entrega</span><input name="deliveryTime" required placeholder="24–48 horas" /></label>
                <label><span>Ubicación</span><input name="location" required placeholder="Durango Centro" /></label>
                <label><span>Zona de cobertura</span><input name="zone" required placeholder="Centro y alrededores" /></label>
                <label className="full-field"><span>Fotografía del producto</span><input name="photo" type="url" placeholder="https://ejemplo.com/producto.jpg" /><small>Enlace público opcional.</small></label>
              </div></fieldset>

              {message && <div className={`registration-message ${status}`}>{message}</div>}
              <button className="registration-submit" type="submit" disabled={status === "saving"}>{status === "saving" ? "Guardando..." : "Registrar productor"}</button>
            </form>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
