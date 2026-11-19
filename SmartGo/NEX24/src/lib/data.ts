export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: "kg" | "frasco";
  stock: number;
  emoji: string;
  bulk: boolean;
};

export const products: Product[] = [
  { id: "frijol", name: "Frijol local", category: "Granos · A granel", price: 35, unit: "kg", stock: 18, emoji: "🫘", bulk: true },
  { id: "miel", name: "Miel regional", category: "Productor local", price: 95, unit: "frasco", stock: 12, emoji: "🍯", bulk: false },
  { id: "nuez", name: "Nuez", category: "Semillas · A granel", price: 140, unit: "kg", stock: 4, emoji: "🥜", bulk: true },
  { id: "dulces", name: "Dulces regionales", category: "Dulces · A granel", price: 80, unit: "kg", stock: 9, emoji: "🍬", bulk: true },
];

export const locations = [
  { name: "NEX24 Centro", area: "Zona Centro", address: "Av. 20 de Noviembre · Durango, Dgo.", distance: "Punto principal" },
  { name: "NEX24 Jardines", area: "Jardines de Durango", address: "Blvd. Domingo Arrieta · Durango, Dgo.", distance: "A 2.4 km" },
  { name: "NEX24 Tecnológico", area: "Col. Tecnológico", address: "Av. Tecnológico · Durango, Dgo.", distance: "A 4.1 km" },
];

export type Producer = {
  id: string;
  name: string;
  category: string;
  location: string;
  zone: string;
  description: string;
  products: string[];
  wholesalePrice: number;
  unit: string;
  capacity: number;
  minimumOrder: number;
  available: boolean;
  deliveryDays: string;
  deliveryTime: string;
  rating: number;
  accent: string;
};

export const producers: Producer[] = [
  { id: "sierra", name: "Tostaduría Sierra", category: "Café", location: "Centro", zone: "Centro y alrededores", description: "Café de altura tostado artesanalmente para cafeterías y restaurantes.", products: ["Café en grano", "Café molido"], wholesalePrice: 210, unit: "kg", capacity: 80, minimumOrder: 5, available: true, deliveryDays: "Lun, Mié y Vie", deliveryTime: "24–48 h", rating: 4.9, accent: "#b77945" },
  { id: "miel-nuevo", name: "Miel Nuevo Horizonte", category: "Procesados", location: "Nuevo Ideal", zone: "Sur y valle", description: "Miel regional con trazabilidad y presentaciones comerciales.", products: ["Miel multifloral", "Miel de mezquite"], wholesalePrice: 180, unit: "kg", capacity: 45, minimumOrder: 10, available: true, deliveryDays: "Martes y jueves", deliveryTime: "48 h", rating: 4.8, accent: "#d9a441" },
  { id: "nuez-mezquital", name: "Nuez del Mezquital", category: "Frutos secos", location: "Mezquital", zone: "Sur de Durango", description: "Nuez seleccionada y empacada para ventas institucionales.", products: ["Nuez con cáscara", "Nuez pelada"], wholesalePrice: 260, unit: "kg", capacity: 120, minimumOrder: 20, available: true, deliveryDays: "Lunes y jueves", deliveryTime: "3–4 días", rating: 4.5, accent: "#8a6847" },
  { id: "granos-parque", name: "Granos del Parque", category: "Granos", location: "Durango", zone: "Zona metropolitana", description: "Frijol y legumbres seleccionadas para cocina profesional.", products: ["Frijol negro", "Frijol pinto"], wholesalePrice: 48, unit: "kg", capacity: 300, minimumOrder: 25, available: true, deliveryDays: "Todos los días", deliveryTime: "24 h", rating: 4.6, accent: "#7d4f3a" },
  { id: "huerto-norte", name: "Huertos del Norte", category: "Hortalizas", location: "Nombre de Dios", zone: "Norte y centro", description: "Hortalizas frescas cosechadas bajo pedido para negocios locales.", products: ["Tomate", "Chile", "Verduras de hoja"], wholesalePrice: 32, unit: "kg", capacity: 180, minimumOrder: 15, available: true, deliveryDays: "Lunes a sábado", deliveryTime: "12–24 h", rating: 4.8, accent: "#75a66b" },
  { id: "dulces-canon", name: "Dulces del Cañón", category: "Dulces", location: "Victoria", zone: "Norte de Durango", description: "Dulces regionales en presentaciones para tienda y venta minorista.", products: ["Dulce de leche", "Cocada", "Nueces garapiñadas"], wholesalePrice: 95, unit: "kg", capacity: 60, minimumOrder: 8, available: false, deliveryDays: "Miércoles", deliveryTime: "72 h", rating: 4.5, accent: "#c98a7a" },
];
