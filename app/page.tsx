import type { Metadata } from "next";
import { SeoSummary } from "@/components/SeoSummary";
import { TrafficApp } from "@/components/TrafficApp";
import { getIncidents } from "@/lib/dgt/dgt-client";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Tráfico en España en tiempo real",
  description:
    "Consulta las incidencias de tráfico actuales en España: accidentes, obras, cortes de carretera y retenciones. Datos abiertos de la DGT.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const incidents = await getIncidents().then((p) => p.incidents).catch(() => null);
  return (
    <>
      <SeoSummary
        heading="Tráfico en España en tiempo real"
        intro="Consulta las incidencias de tráfico actuales en la red de carreteras de España con datos públicos de la DGT."
        incidents={incidents}
      />
      <TrafficApp />
    </>
  );
}
