import type { TrafficIncident } from "@/lib/dgt/types";
import { formatDateTime, timeAgo } from "@/lib/incidents/format";
import { SEVERITY_LABEL, STATUS_LABEL, TYPE_META } from "@/lib/incidents/labels";
import { TypeBadge } from "./TypeBadge";

/** Compone "A-6 · km 42". Omite lo que no exista. */
export function roadLine(i: TrafficIncident): string | null {
  const parts = [i.road, i.kilometer ? `km ${i.kilometer}` : null].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export function placeLine(i: TrafficIncident): string | null {
  const parts = [i.municipality, i.province].filter(Boolean);
  return parts.length ? [...new Set(parts)].join(", ") : null;
}

/** Fila compacta para listas. */
export function IncidentRow({
  incident, selected, onSelect, now, id,
}: {
  incident: TrafficIncident;
  selected: boolean;
  onSelect: (id: string) => void;
  now: number;
  id?: string;
}) {
  const i = incident;
  return (
    <li id={id}>
      <button
        type="button"
        onClick={() => onSelect(i.id)}
        aria-pressed={selected}
        className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
          selected ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <TypeBadge type={i.type} label={i.title} />
          <span className="shrink-0 text-xs text-slate-500">{timeAgo(i.lastUpdated, now)}</span>
        </div>
        {roadLine(i) && <div className="mt-1 text-sm font-semibold text-slate-900">{roadLine(i)}</div>}
        {placeLine(i) && <div className="text-sm text-slate-600">{placeLine(i)}</div>}
        {i.latitude === null && (
          <div className="mt-1 text-xs text-slate-500">Sin ubicación en el mapa</div>
        )}
      </button>
    </li>
  );
}

/** Tarjeta de detalle. Solo muestra campos que existen en el feed. */
export function IncidentCard({
  incident, now, onClose, onShowOnMap,
}: {
  incident: TrafficIncident;
  now: number;
  onClose?: () => void;
  onShowOnMap?: () => void;
}) {
  const i = incident;
  const m = TYPE_META[i.type];
  const rows: [string, string | null][] = [
    ["Estado", STATUS_LABEL[i.status] !== STATUS_LABEL.unknown ? STATUS_LABEL[i.status] : null],
    ["Gravedad", i.severity !== "unknown" ? SEVERITY_LABEL[i.severity] : null],
    ["Inicio", formatDateTime(i.startTime)],
    ["Fin previsto", formatDateTime(i.expectedEnd)],
    ["Última actualización", formatDateTime(i.lastUpdated)],
  ];
  return (
    <article
      aria-label={`Detalle: ${i.title}`}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/10"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <TypeBadge type={i.type} label={m.label} />
          <h2 className="mt-1 text-lg font-bold leading-tight text-slate-900">{i.title}</h2>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Cerrar detalle" className="icon-btn">✕</button>
        )}
      </header>

      {roadLine(i) && <p className="mt-2 text-base font-semibold text-slate-900">{roadLine(i)}</p>}
      {placeLine(i) && <p className="text-sm text-slate-700">{placeLine(i)}</p>}
      {i.community && <p className="text-xs text-slate-500">{i.community}</p>}
      {i.direction && <p className="mt-1 text-sm text-slate-700">{i.direction}</p>}
      {i.description && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span aria-hidden="true">⚠️ </span>
          {i.description}
        </p>
      )}

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {rows.map(([k, v]) =>
          v ? (
            <div key={k} className="contents">
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-slate-900">{v}</dd>
            </div>
          ) : null,
        )}
      </dl>

      <footer className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
        <span>
          {timeAgo(i.lastUpdated, now) ? `Actualizado: ${timeAgo(i.lastUpdated, now)!.toLowerCase()} · ` : ""}
          Fuente: {i.source === "DGT" || i.source === "DGT3.0" ? "DGT" : `${i.source} (vía DGT)`}
        </span>
        {onShowOnMap && i.latitude !== null && (
          <button type="button" onClick={onShowOnMap} className="btn-link">Ver en el mapa</button>
        )}
      </footer>
    </article>
  );
}
