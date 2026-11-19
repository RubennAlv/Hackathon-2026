"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header({ panel = false }: { panel?: boolean }) {
  const pathname = usePathname();
  const active = (href: string) => pathname === href;

  return (
    <header className="nav">
      <Link className="logo" href="/">NEX<span>24</span></Link>
      {panel ? (
        <nav className="panel-header-links" aria-label="Panel">
          <Link className={active("/") ? "active" : ""} href="/">Inicio</Link>
          <Link className={active("/emprendedores") ? "active" : ""} href="/emprendedores">Resumen</Link>
          <Link className={active("/solicitudes") ? "active" : ""} href="/solicitudes">Solicitudes</Link>
          <Link className={active("/alianzas") ? "active" : ""} href="/alianzas">Alianzas</Link>
        </nav>
      ) : (
        <nav aria-label="Navegación principal">
          <Link className={pathname === "/" ? "active-nav" : ""} href="/">Inicio</Link>
          <Link className={active("/catalogo") ? "active-nav" : ""} href="/catalogo">Catálogo</Link>
          <Link className={active("/match") ? "active-nav" : ""} href="/match">Match B2B</Link>
          <Link className={active("/solicitudes") ? "active-nav" : ""} href="/solicitudes">Solicitudes</Link>
          <Link className={active("/alianzas") ? "active-nav" : ""} href="/alianzas">Alianzas</Link>
          <Link className={active("/registro") ? "nav-shop active-nav" : "nav-shop"} href="/registro">Crear cuenta</Link>
        </nav>
      )}
    </header>
  );
}
