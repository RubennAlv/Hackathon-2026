export type AllianceStatus = "Activa" | "En negociación" | "Suspendida" | "Finalizada";

export type CommercialAlliance = {
  id: string;
  requestId: string;
  businessName: string;
  producerId: string;
  producerName: string;
  products: string[];
  quantity: number;
  unit: "kg" | "frasco" | "pieza";
  conditions: string;
  status: AllianceStatus;
  createdAt: string;
};

export const ALLIANCES_KEY = "abasto-dgo-commercial-alliances";

export function getCommercialAlliances(): CommercialAlliance[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ALLIANCES_KEY) || "[]") as CommercialAlliance[];
  } catch {
    return [];
  }
}

export function saveCommercialAlliances(alliances: CommercialAlliance[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ALLIANCES_KEY, JSON.stringify(alliances));
}
