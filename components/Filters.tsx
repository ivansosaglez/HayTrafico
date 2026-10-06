"use client";

import type { Compass, IncidentStatus, IncidentType, Severity } from "@/lib/dgt/types";
import { EMPTY_FILTERS, hasActiveFilters, type Filters as FiltersState } from "@/lib/incidents/filters";
import {
  COMPASS_FILTER_LABEL, SEVERITY_LABEL, STATUS_LABEL, TYPE_META, TYPE_ORDER,
} from "@/lib/incidents/labels";
import { POPULAR_ROADS } from "@/lib/incidents/roads";
import { RECENT_HOURS } from "@/lib/dgt/config";

interface Options {
  provinces: string[];
  communities: string[];
  roads: string[];
  statuses: IncidentStatus[];
  severities: Severity[];
  directions: Compass[];
}

interface Props {
  filters: FiltersState;
  onChange: (f: FiltersState) => void;
  options: Options;
  typeCounts: Record<IncidentType, number>;
  roadCounts: Map<string, number>;
}

export function TypeChips({
  filters, onChange, typeCounts,
}: Pick<Props, "filters" | "onChange" | "typeCounts">) {
  const toggle = (t: IncidentType) =>
    onChange({
      ...filters,
      types: filters.types.includes(t) ? filters.types.filter((x) => x !== t) : [...filters.types, t],
    });
  return (
    <div role="group" aria-label="Filtrar por tipo de incidencia" className="flex flex-wrap gap-1.5">
      {TYPE_ORDER.map((t) => {
        const on = filters.types.includes(t);
        return (
          <button
            key={t}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(t)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              on ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span aria-hidden="true" className="tm-glyph" data-type={t} style={{ background: TYPE_META[t].color }}>
              {TYPE_META[t].symbol}
            </span>
            {TYPE_META[t].plural}
            <span className="tabular-nums opacity-70">{typeCounts[t]}</span>
          </button>
        );
      })}
    </div>
  );
}

export function FilterFields({ filters, onChange, options, roadCounts }: Omit<Props, "typeCounts">) {
  const set = <K extends keyof FiltersState>(k: K, v: FiltersState[K]) => onChange({ ...filters, [k]: v });
  const otherRoads = options.roads.filter((r) => !POPULAR_ROADS.includes(r));

  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Provincia">
        <select value={filters.province} onChange={(e) => set("province", e.target.value)} className="field">
          <option value="">Todas</option>
          {options.provinces.map((p) => <option key={p}>{p}</option>)}
        </select>
      </Field>
      <Field label="Comunidad autónoma">
        <select value={filters.community} onChange={(e) => set("community", e.target.value)} className="field">
          <option value="">Todas</option>
          {options.communities.map((p) => <option key={p}>{p}</option>)}
        </select>
      </Field>
      <Field label="Carretera">
        <select value={filters.road} onChange={(e) => set("road", e.target.value)} className="field">
          <option value="">Todas</option>
          <optgroup label="Principales">
            {POPULAR_ROADS.map((r) => (
              <option key={r} value={r}>{r} ({roadCounts.get(r) ?? 0})</option>
            ))}
          </optgroup>
          {otherRoads.length > 0 && (
            <optgroup label="Otras con incidencias">
              {otherRoads.map((r) => <option key={r} value={r}>{r} ({roadCounts.get(r) ?? 0})</option>)}
            </optgroup>
          )}
        </select>
      </Field>
      <Field label="Gravedad">
        <select value={filters.severity} onChange={(e) => set("severity", e.target.value as Severity | "")} className="field">
          <option value="">Todas</option>
          {options.severities.map((s) => <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>)}
        </select>
      </Field>
      <Field label="Estado">
        <select value={filters.status} onChange={(e) => set("status", e.target.value as IncidentStatus | "")} className="field">
          <option value="">Todos</option>
          {options.statuses.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </Field>
      <Field label="Sentido">
        <select value={filters.direction} onChange={(e) => set("direction", e.target.value as Compass | "")} className="field">
          <option value="">Todos</option>
          {options.directions.map((d) => <option key={d} value={d}>{COMPASS_FILTER_LABEL[d]}</option>)}
        </select>
      </Field>
      <label className="col-span-2 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={filters.recentOnly}
          onChange={(e) => set("recentOnly", e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Solo recientes (actualizadas en las últimas {RECENT_HOURS} h)
      </label>
      {hasActiveFilters(filters) && (
        <button type="button" onClick={() => onChange(EMPTY_FILTERS)} className="btn-link col-span-2 justify-self-start">
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-600">
      {label}
      {children}
    </label>
  );
}
