import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NEX24 | Tienda local inteligente",
  description: "Compra productos locales de Durango las 24 horas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body className={dmSans.variable}>{children}</body>
    </html>
  );
}
