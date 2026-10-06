import type { IncidentType } from "@/lib/dgt/types";
import { TYPE_META } from "@/lib/incidents/labels";

/** Símbolo + color + texto: el tipo no depende solo del color. */
export function TypeBadge({ type, label }: { type: IncidentType; label?: string }) {
  const m = TYPE_META[type];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
      <span
        aria-hidden="true"
        className="tm-glyph"
        data-type={type}
        style={{ background: m.color }}
      >
        {m.symbol}
      </span>
      {label ?? m.label}
    </span>
  );
}
