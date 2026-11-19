import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import "./platform.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Abasto DGO | Plataforma local de abastecimiento",
  description: "Conecta negocios de Durango con productores locales.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body className={dmSans.variable}>{children}</body>
    </html>
  );
}
