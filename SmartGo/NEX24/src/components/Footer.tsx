import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <Link className="logo" href="/">NEX<span>24</span></Link>
      <p>Impulsando lo local, las 24 horas.</p>
      <small>Durango, México · Prototipo Hackathon</small>
    </footer>
  );
}
