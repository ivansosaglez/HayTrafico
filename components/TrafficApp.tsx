"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIncidents, useNow } from "@/hooks/use-incidents";
import type { Compass, IncidentStatus, Severity, TrafficIncident } from "@/lib/dgt/types";
import { COVERAGE_SHORT, isLimitedCoverageArea } from "@/lib/incidents/coverage";
import {
  EMPTY_FILTERS, applyFilters, countByType, distinctSorted, foldRoad, hasActiveFilters,
  sortIncidents, type Filters, type SortKey,
} from "@/lib/incidents/filters";
import { SPAIN_VIEW } from "@/lib/incidents/cities";
import { SEVERITY_RANK } from "@/lib/incidents/labels";
import { FilterFields, TypeChips } from "./Filters";
import { IncidentCard, IncidentRow } from "./IncidentCard";
import { MapView } from "./MapLoader";
import { StatusBadge } from "./StatusBadge";

export interface Preset {
  name: string;
  province: string;
  center: [number, number];
  zoom: number;
}

const PAGE = 100;
const SORTS: { key: SortKey; label: string }[] = [
  { key: "time", label: "Hora" },
  { key: "severity", label: "Gravedad" },
  { key: "type", label: "Tipo" },
  { key: "road", label: "Carretera" },
];

export function TrafficApp({ preset }: { preset?: Preset }) {
  const { payload, loading, error, refresh } = useIncidents();
  const now = useNow(10_000);

  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    province: preset?.province ?? "",
  });
  const [view, setView] = useState<"map" | "list">("map");
  const [sort, setSort] = useState<SortKey>("time");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [fitSignal, setFitSignal] = useState(0);

  const all = useMemo(() => payload?.incidents ?? [], [payload]);

  const options = useMemo(
    () => ({
      provinces: distinctSorted(all.map((i) => i.province)),
      communities: distinctSorted(all.map((i) => i.community)),
      roads: distinctSorted(all.map((i) => i.road)).sort((a, b) => a.localeCompare(b, "es", { numeric: true })),
      statuses: [...new Set(all.map((i) => i.status))] as IncidentStatus[],
      severities: ([...new Set(all.map((i) => i.severity))] as Severity[])
        .filter((s) => s !== "unknown")
        .sort((a, b) => SEVERITY_RANK[b] - SEVERITY_RANK[a]),
      directions: distinctSorted(all.map((i) => i.directionCompass)) as Compass[],
    }),
    [all],
  );

  const roadCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of all) {
      if (!i.road) continue;
      const k = foldRoad(i.road);
      m.set(i.road, (m.get(i.road) ?? 0) + 1);
      if (k !== i.road) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [all]);

  const filtered = useMemo(() => applyFilters(all, filters), [all, filters]);
  const sorted = useMemo(() => sortIncidents(filtered, sort), [filtered, sort]);
  const typeCounts = useMemo(() => countByType(applyFilters(all, { ...filters, types: [] })), [all, filters]);
  const selected: TrafficIncident | null = useMemo(
    () => filtered.find((i) => i.id === selectedId) ?? null,
    [filtered, selectedId],
  );

  // Encuadra el mapa tras cambiar filtros (con debounce para no saltar en cada tecla).
  const firstFilterRun = useRef(true);
  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    if (firstFilterRun.current) {
      firstFilterRun.current = false;
      return;
    }
    setLimit(PAGE);
    const t = setTimeout(() => setFitSignal((n) => n + 1), 350);
    return () => clearTimeout(t);
  }, [filterKey]);

  // Primer encuadre de una página de ciudad cuando llegan los datos.
  const fittedPreset = useRef(false);
  useEffect(() => {
    if (preset && !fittedPreset.current && payload) {
      fittedPreset.current = true;
      setFitSignal((n) => n + 1);
    }
  }, [preset, payload]);

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (id && typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
        setSheetOpen(false);
        if (view === "list") setView("map");
      }
    },
    [view],
  );

  // Mantiene visible en la lista la incidencia elegida en el mapa.
  useEffect(() => {
    if (!selectedId) return;
    const idx = sorted.findIndex((i) => i.id === selectedId);
    if (idx >= limit) setLimit(idx + 50);
    requestAnimationFrame(() =>
      document.getElementById(`inc-${selectedId}`)?.scrollIntoView({ block: "nearest" }),
    );
  }, [selectedId, sorted, limit]);

  const setQuery = (q: string) => setFilters((f) => ({ ...f, query: q }));
  const total = all.length;
  const active = hasActiveFilters(filters);
  const coverageWarn = isLimitedCoverageArea(
    `${filters.query} ${filters.province} ${filters.community} ${preset?.name ?? ""}`,
  );
  const dataTime = payload ? new Date(payload.publishedAt ?? payload.fetchedAt) : null;
  const sourceDown = !payload && !loading;
  const mobileList = view === "list";

  const touchY = useRef<number | null>(null);

  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-900">
      {/* ---------- Cabecera ---------- */}
      <header className="z-[1300] flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 bg-white px-3 py-2 sm:px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900">
          <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-xl bg-blue-600 text-white">⚑</span>
          HayTrafico
        </Link>

        <div className="order-3 w-full lg:order-2 lg:w-auto lg:max-w-xl lg:flex-1">
          <label htmlFor="q" className="sr-only">Buscar carretera, municipio o provincia</label>
          <input
            id="q"
            type="search"
            value={filters.query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar carretera, municipio o provincia..."
            autoComplete="off"
            className="field w-full !py-2"
          />
        </div>

        <div className="order-2 ml-auto flex items-center gap-3 lg:order-3">
          <StatusBadge payload={payload} loading={loading} error={error} now={now} onRetry={refresh} />
          <div role="group" aria-label="Modo de visualización" className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-sm">
            {(["map", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`rounded-md px-2.5 py-1 font-medium focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  view === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {v === "map" ? "🗺️ Mapa" : "📋 Lista"}
              </button>
            ))}
          </div>
          <Link href="/fuentes" className="btn-link hidden sm:inline">Fuentes y datos</Link>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* ---------- Panel lateral / hoja inferior ---------- */}
        <aside
          aria-label="Incidencias y filtros"
          className={`absolute inset-x-0 bottom-0 z-[1200] flex flex-col bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.18)] transition-[height] duration-200 lg:static lg:z-auto lg:h-auto lg:w-[400px] lg:shrink-0 lg:rounded-none lg:border-r lg:border-slate-200 lg:shadow-none ${
            mobileList ? "top-0 h-auto" : sheetOpen ? "h-[78%] rounded-t-2xl" : "h-[76px] rounded-t-2xl"
          }`}
        >
          <button
            type="button"
            aria-expanded={sheetOpen || mobileList}
            aria-controls="panel-body"
            onClick={() => setSheetOpen((o) => !o)}
            onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
            onTouchEnd={(e) => {
              if (touchY.current === null) return;
              const dy = e.changedTouches[0].clientY - touchY.current;
              if (dy < -40) setSheetOpen(true);
              if (dy > 40) setSheetOpen(false);
              touchY.current = null;
            }}
            className={`flex w-full flex-col items-center gap-1 px-4 pb-2 pt-2 lg:hidden ${mobileList ? "hidden" : ""}`}
          >
            <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-slate-300" />
            <span className="text-base font-bold">
              {loading && !payload ? "Cargando tráfico..." : `${filtered.length} incidencias`}
              <span className="ml-2 text-sm font-normal text-slate-500">{sheetOpen ? "Cerrar" : "Ver lista"}</span>
            </span>
          </button>

          <div id="panel-body" className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 lg:pt-4">
            <section aria-labelledby="now-h">
              <div className="flex items-baseline justify-between gap-2">
                <h2 id="now-h" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Incidencias ahora
                </h2>
                {dataTime && (
                  <span className="text-xs text-slate-500">
                    Última actualización:{" "}
                    {dataTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" })}
                  </span>
                )}
              </div>
              <p className="mt-1 text-3xl font-extrabold tabular-nums">
                {payload ? filtered.length : "–"}
                <span className="ml-1.5 text-base font-semibold text-slate-600">incidencias</span>
                {payload && active && total !== filtered.length && (
                  <span className="ml-2 text-sm font-normal text-slate-500">de {total}</span>
                )}
              </p>
              <div className="mt-2">
                <TypeChips filters={filters} onChange={setFilters} typeCounts={typeCounts} />
              </div>
            </section>

            <div className="mt-3">
              <button
                type="button"
                aria-expanded={filtersOpen}
                aria-controls="filters-body"
                onClick={() => setFiltersOpen((o) => !o)}
                className="btn-outline w-full justify-between"
              >
                <span>Filtros{active ? " (activos)" : ""}</span>
                <span aria-hidden="true">{filtersOpen ? "▲" : "▼"}</span>
              </button>
              {filtersOpen && (
                <div id="filters-body" className="mt-3">
                  <FilterFields
                    filters={filters}
                    onChange={setFilters}
                    options={options}
                    roadCounts={roadCounts}
                  />
                </div>
              )}
            </div>

            <p
              className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                coverageWarn ? "bg-amber-50 text-amber-900 ring-1 ring-amber-300" : "bg-slate-50 text-slate-600"
              }`}
            >
              {coverageWarn ? "⚠️ " : "ℹ️ "}
              {COVERAGE_SHORT}{" "}
              <Link href="/fuentes#cobertura" className="underline">Más información</Link>
            </p>

            <div className={view === "list" ? "lg:hidden" : ""}>
              <div className="mt-4 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Lista</h3>
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  Ordenar por
                  <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="field !py-1">
                    {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </label>
              </div>
              <ListBody
                items={sorted.slice(0, limit)}
                remaining={sorted.length - limit}
                onMore={() => setLimit((l) => l + PAGE)}
                state={stateOf(payload !== null, loading, total, filtered.length)}
                selectedId={selectedId}
                onSelect={select}
                now={now}
                onClear={() => setFilters(EMPTY_FILTERS)}
                compact
              />
            </div>
          </div>
        </aside>

        {/* ---------- Zona principal: mapa o lista ---------- */}
        <main className="relative min-w-0 flex-1">
          <div className={`absolute inset-0 ${view === "list" ? "invisible" : ""}`}>
            <MapView
              incidents={filtered}
              selectedId={selected?.id ?? null}
              onSelect={select}
              initialView={preset ? { center: preset.center, zoom: preset.zoom } : SPAIN_VIEW}
              fitSignal={fitSignal}
            />
          </div>

          {view === "list" && (
            <div className="absolute inset-0 hidden overflow-y-auto bg-slate-50 p-6 lg:block">
              <div className="mx-auto max-w-3xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold">{filtered.length} incidencias</h2>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    Ordenar por
                    <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="field">
                      {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </label>
                </div>
                <ListBody
                  items={sorted.slice(0, limit)}
                  remaining={sorted.length - limit}
                  onMore={() => setLimit((l) => l + PAGE)}
                  state={stateOf(payload !== null, loading, total, filtered.length)}
                  selectedId={selectedId}
                  onSelect={select}
                  now={now}
                  onClear={() => setFilters(EMPTY_FILTERS)}
                />
              </div>
            </div>
          )}

          {/* Estados globales (sobre el mapa) */}
          {loading && !payload && (
            <Overlay><p className="text-base font-medium">Cargando tráfico...</p></Overlay>
          )}
          {sourceDown && (
            <Overlay>
              <p className="text-base font-bold text-red-700">No se ha podido obtener la información de tráfico.</p>
              <p className="mt-1 text-sm text-slate-600">No se ha podido conectar con DGT. Esto no significa que no haya incidencias.</p>
              {error && <p className="mt-1 text-xs text-slate-500">{error}</p>}
              <button type="button" onClick={refresh} className="btn-primary mt-3">Reintentar</button>
            </Overlay>
          )}
          {payload && total === 0 && (
            <Overlay><p className="text-base font-medium">No hay incidencias disponibles.</p>
              <p className="mt-1 text-sm text-slate-600">La DGT ha respondido pero no publica ninguna incidencia ahora mismo.</p>
            </Overlay>
          )}

          {selected && (
            <div className="absolute inset-x-3 bottom-[88px] z-[1150] lg:inset-x-auto lg:bottom-4 lg:left-4 lg:w-[380px]">
              <IncidentCard
                incident={selected}
                now={now}
                onClose={() => setSelectedId(null)}
                onShowOnMap={view === "list" ? () => setView("map") : undefined}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

type ListState = "loading" | "error" | "empty" | "nomatch" | "ok";
function stateOf(hasPayload: boolean, loading: boolean, total: number, shown: number): ListState {
  if (!hasPayload) return loading ? "loading" : "error";
  if (total === 0) return "empty";
  if (shown === 0) return "nomatch";
  return "ok";
}

function ListBody({
  items, remaining, onMore, state, selectedId, onSelect, now, onClear, compact,
}: {
  items: TrafficIncident[];
  remaining: number;
  onMore: () => void;
  state: ListState;
  selectedId: string | null;
  onSelect: (id: string) => void;
  now: number;
  onClear: () => void;
  compact?: boolean;
}) {
  if (state === "loading") return <p className="mt-3 text-sm text-slate-500">Cargando tráfico...</p>;
  if (state === "error")
    return <p className="mt-3 text-sm text-red-700">No se ha podido conectar con DGT.</p>;
  if (state === "empty") return <p className="mt-3 text-sm text-slate-600">No hay incidencias disponibles.</p>;
  if (state === "nomatch")
    return (
      <p className="mt-3 text-sm text-slate-600">
        Ninguna incidencia coincide con los filtros.{" "}
        <button type="button" onClick={onClear} className="btn-link">Limpiar filtros</button>
      </p>
    );
  return (
    <>
      <ul className={`mt-2 space-y-2 ${compact ? "" : "grid gap-2 space-y-0 sm:grid-cols-2"}`}>
        {items.map((i) => (
          <IncidentRow
            key={i.id}
            id={compact ? `inc-${i.id}` : undefined}
            incident={i}
            selected={i.id === selectedId}
            onSelect={onSelect}
            now={now}
          />
        ))}
      </ul>
      {remaining > 0 && (
        <button type="button" onClick={onMore} className="btn-outline mt-3 w-full">
          Mostrar más ({remaining} restantes)
        </button>
      )}
    </>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1100] grid place-items-center p-4">
      <div role="status" className="pointer-events-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-lg">
        {children}
      </div>
    </div>
  );
}
