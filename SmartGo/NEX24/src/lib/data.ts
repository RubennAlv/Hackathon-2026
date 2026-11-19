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
