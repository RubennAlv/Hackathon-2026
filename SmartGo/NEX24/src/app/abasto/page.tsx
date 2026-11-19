import { redirect } from "next/navigation";

export const metadata = {
  title: "Abasto DGO | Compras locales para negocios",
  description: "Conecta negocios de Durango con productores locales.",
};

export default function AbastoPage() {
  redirect("/#catalogo");
}
