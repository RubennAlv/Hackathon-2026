export type RequestStatus = "Pendiente" | "En revisión" | "Aceptada" | "Rechazada" | "Finalizada";
export type RequestType = "Cotización" | "Caja de muestra" | "Abastecimiento";

export type CommercialRequest = {
  id: string;
  producerId: string;
  producerName: string;
  businessName: string;
  product: string;
  quantity: number;
  unit: "kg" | "frasco" | "pieza";
  type: RequestType;
  status: RequestStatus;
  notes: string;
  createdAt: string;
};

export const COMMERCIAL_REQUESTS_KEY = "abasto-dgo-commercial-requests";

export function getCommercialRequests(): CommercialRequest[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(COMMERCIAL_REQUESTS_KEY) || "[]") as CommercialRequest[];
  } catch {
    return [];
  }
}

export function saveCommercialRequests(requests: CommercialRequest[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMMERCIAL_REQUESTS_KEY, JSON.stringify(requests));
}
