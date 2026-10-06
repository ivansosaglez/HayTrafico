import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/dgt/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Tráfico en España en tiempo real", template: "%s | HayTrafico" },
  description:
    "Mapa de incidencias de tráfico en España en tiempo real con datos abiertos de la DGT: accidentes, obras, cortes y retenciones.",
  applicationName: "HayTrafico",
  appleWebApp: { capable: true, title: "HayTrafico", statusBarStyle: "default" },
  icons: { apple: "/icons/180" },
  openGraph: { type: "website", locale: "es_ES", siteName: "HayTrafico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d4ed8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
