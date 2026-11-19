import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { locations, products } from "@/lib/data";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <small>Tecnología local · Durango</small>
            <h1>
              Lo local,
              <br />
              <em>siempre cerca.</em>
            </h1>
            <p>
              Compra productos de pequeños negocios y productores de Durango, a
              cualquier hora.
            </p>
            <div className="actions">
              <Link className="btn green" href="/tienda">
                Entrar a la tienda →
              </Link>
              <Link className="btn outline" href="/emprendedores">
                Soy emprendedor
              </Link>
            </div>
            <div className="note">
              <strong>24/7</strong>
              <span>
                Autoservicio disponible
                <br />
                todos los días del año
              </span>
            </div>
          </div>
          <div className="visual">
            <div className="visual-card">
              <small>NEX24 MARKET · EN LÍNEA</small>
              <div className="basket">🛍️</div>
              <h2>
                Compra local.
                <br /> Compra inteligente.
              </h2>
              <small>PRODUCTOS DE DURANGO</small>
            </div>
            <b className="origin">🌱 Hecho en Durango</b>
          </div>
        </section>

        <section className="section" id="propuesta">
          <small>Una experiencia diferente</small>
          <h2>Compra a tu manera.</h2>
          <p>Autoservicio sencillo, productos locales y una tienda que no cierra.</p>
          <div className="feature-grid">
            {[
              ["◷", "Disponible 24/7", "Compra cuando lo necesites."],
              ["⚖", "Productos a granel", "Paga por la cantidad que necesitas."],
              ["✳", "Consumo local", "Apoyamos a productores de Durango."],
              ["▣", "Autoservicio", "Consulta, selecciona y paga."],
            ].map(([icon, title, text]) => (
              <article key={title}>
                <b>{icon}</b>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section products" id="productos">
          <small>Orgullo local</small>
          <h2>Un vistazo al catálogo.</h2>
          <p>Productos de ejemplo para el prototipo.</p>
          <div className="feature-grid product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="emoji">{product.emoji}</div>
                <h3>{product.name}</h3>
                <p>{product.category}</p>
                <strong>
                  ${product.price.toFixed(2)} / {product.unit}
                </strong>
              </article>
            ))}
          </div>
          <Link className="more" href="/tienda">
            Explorar la tienda →
          </Link>
        </section>

        <section className="section locations" id="ubicaciones">
          <small>Encuéntranos cerca</small>
          <h2>Tu punto NEX24 más cercano.</h2>
          <p>Consulta nuestros puntos de autoservicio en Durango.</p>
          <div className="location-layout">
            <div className="map-card">
              <div className="map-grid" />
              <span className="road road-one" />
              <span className="road road-two" />
              <button className="pin pin-one">
                ●<small>Centro</small>
              </button>
              <button className="pin pin-two">
                ●<small>Jardines</small>
              </button>
              <button className="pin pin-three">
                ●<small>Tecnológico</small>
              </button>
              <b className="map-label">DURANGO, DGO.</b>
            </div>
            <div className="location-list">
              {locations.map((location) => (
                <article className="location-card" key={location.name}>
                  <div className="location-card-top">
                    <span className="location-icon">⌖</span>
                    <span className="open-label">● Abierto 24/7</span>
                  </div>
                  <h3>{location.name}</h3>
                  <p className="location-area">{location.area}</p>
                  <p>{location.address}</p>
                  <div className="location-meta">
                    <span>{location.distance}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        location.address
                      )}`}
                      target="_blank"
                      rel="noopener"
                    >
                      Cómo llegar ↗
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section experience">
          <small>Así funciona NEX24</small>
          <h2>Una tienda que cobra sola.</h2>
          <p>Un espacio diseñado para hacer tu compra más simple.</p>
          <div className="store-demo">
            <div className="demo-shelf" />
            <div className="demo-counter">
              <span>⚖</span>
              <b>Báscula digital</b>
            </div>
            <div className="demo-checkout">
              <span>▣</span>
              <b>Pago rápido</b>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
