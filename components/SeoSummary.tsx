import type { TrafficIncident } from "@/lib/dgt/types";
import { TYPE_META, TYPE_ORDER } from "@/lib/incidents/labels";
import { countByType, sortIncidents } from "@/lib/incidents/filters";
import { placeLine, roadLine } from "./IncidentCard";

/**
 * Resumen renderizado en servidor para buscadores y lectores de pantalla.
 * Es contenido real (se regenera cada minuto vía ISR); si no hay datos, no inventa nada.
 */
export function SeoSummary({
  heading, intro, incidents,
}: {
  heading: string;
  intro: string;
  incidents: TrafficIncident[] | null;
}) {
  const counts = incidents ? countByType(incidents) : null;
  const top = incidents ? sortIncidents(incidents, "time").slice(0, 15) : [];
  return (
    <section className="sr-only" aria-label="Resumen de tráfico">
      <h1>{heading}</h1>
      <p>{intro}</p>
      {incidents && counts ? (
        <>
          <p>
            {incidents.length} incidencias activas:{" "}
            {TYPE_ORDER.filter((t) => counts[t] > 0)
              .map((t) => `${counts[t]} ${TYPE_META[t].plural.toLowerCase()}`)
              .join(", ")}
            .
          </p>
          {top.length > 0 && (
            <ul>
              {top.map((i) => (
                <li key={i.id}>
                  {[i.title, roadLine(i), placeLine(i)].filter(Boolean).join(" — ")}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p>Los datos de tráfico se cargan en tiempo real desde la DGT.</p>
      )}
    </section>
  );
}
