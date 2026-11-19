import Link from "next/link";

export default function Header({ panel = false }: { panel?: boolean }) {
  return (
    <header className="nav">
      <Link className="logo" href="/">NEX<span>24</span></Link>
      {panel ? (
        <><Link className="back-link" href="/">← Volver al inicio</Link><b className="status">● PANEL DEMO</b></>
      ) : (
        <nav aria-label="Navegación principal">
          <Link href="/#propuesta">Propuesta</Link>
          <Link href="/#productos">Productos</Link>
          <Link href="/#ubicaciones">Ubicaciones</Link>
          <Link href="/tienda" className="nav-shop">Ir a tienda</Link>
        </nav>
      )}
    </header>
  );
}
