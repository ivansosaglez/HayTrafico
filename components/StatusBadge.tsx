"use client";

import type { IncidentsPayload } from "@/lib/dgt/types";
import { durationLabel } from "@/lib/incidents/format";
import { POLL_INTERVAL_SECONDS } from "@/lib/dgt/config";

interface Props {
  payload: IncidentsPayload | null;
  loading: boolean;
  error: string | null;
  now: number;
  onRetry: () => void;
}

/** Indicador de frescura. Nunca oculta un fallo de la fuente. */
export function StatusBadge({ payload, loading, error, now, onRetry }: Props) {
  if (loading && !payload) {
    return <Pill tone="slate" text="Cargando tráfico..." />;
  }
  if (!payload) {
    return (
      <div className="flex items-center gap-2">
        <Pill tone="red" text="Sin conexión con la DGT" />
        <button type="button" onClick={onRetry} className="btn-link">Reintentar</button>
      </div>
    );
  }

  const ref = Date.parse(payload.publishedAt ?? payload.fetchedAt);
  const age = Number.isNaN(ref) ? 0 : now - ref;
  const old = age > POLL_INTERVAL_SECONDS * 3 * 1000;

  if (error || payload.stale || old) {
    return (
      <div className="flex items-center gap-2" role="status">
        <Pill tone="amber" text={`Última actualización hace ${durationLabel(age)}`} />
        {error && (
          <span className="hidden text-xs text-amber-800 xl:inline" title={error}>
            La fuente no responde
          </span>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      <Pill tone="green" text="Datos actualizados" />
      <span className="hidden text-xs text-slate-500 md:inline">
        Actualizado hace {durationLabel(age)} · automático
      </span>
    </div>
  );
}

function Pill({ tone, text }: { tone: "green" | "amber" | "red" | "slate"; text: string }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    amber: "bg-amber-50 text-amber-900 ring-amber-300",
    red: "bg-red-50 text-red-800 ring-red-200",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  }[tone];
  const dot = { green: "🟢", amber: "🟠", red: "🔴", slate: "⏳" }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${styles}`}>
      <span aria-hidden="true">{dot}</span>
      {text}
    </span>
  );
}
