import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoSummary } from "@/components/SeoSummary";
import { TrafficApp } from "@/components/TrafficApp";
import { getIncidents } from "@/lib/dgt/dgt-client";
import { CITIES, getCity } from "@/lib/incidents/cities";
import { isLimitedCoverageArea } from "@/lib/incidents/coverage";

export const revalidate = 60;
// Solo las ciudades declaradas en lib/incidents/cities.ts; el resto devuelve 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return CITIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const city = getCity((await params).slug);
  if (!city) return {};
  return {
    title: `Tráfico en ${city.name} en tiempo real`,
    description: `Consulta las incidencias de tráfico actuales en ${city.name}: accidentes, obras, cortes y retenciones en las carreteras de la provincia, con datos abiertos de la DGT.`,
    alternates: { canonical: `/trafico/${city.slug}` },
  };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const city = getCity((await params).slug);
  if (!city) notFound();

  const incidents = await getIncidents()
    .then((p) => p.incidents.filter((i) => i.province && city.provinces.includes(i.province)))
    .catch(() => null);

  const limited = isLimitedCoverageArea(city.name);
  return (
    <>
      <SeoSummary
        heading={`Tráfico en ${city.name} en tiempo real`}
        intro={`Consulta las incidencias de tráfico actuales en ${city.name} con datos públicos de la DGT.${
          limited ? " La DGT no publica todas las incidencias de Cataluña y el País Vasco, por lo que la cobertura es parcial." : ""
        }`}
        incidents={incidents}
      />
      <TrafficApp
        preset={{ name: city.name, province: city.provinces[0], center: city.center, zoom: city.zoom }}
      />
    </>
  );
}
