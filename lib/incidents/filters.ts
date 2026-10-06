import { RECENT_HOURS } from "@/lib/dgt/config";
import type { Compass, IncidentStatus, IncidentType, Severity, TrafficIncident } from "@/lib/dgt/types";
import { SEVERITY_RANK, TYPE_ORDER } from "./labels";

export interface Filters {
  types: IncidentType[];
  province: string;
  community: string;
  road: string;
  severity: Severity | "";
  status: IncidentStatus | "";
  direction: Compass | "";
  recentOnly: boolean;
  query: string;
}

export const EMPTY_FILTERS: Filters = {
  types: [],
  province: "",
  community: "",
  road: "",
  severity: "",
  status: "",
  direction: "",
  recentOnly: false,
  query: "",
};

/** Minúsculas y sin acentos, para búsquedas tolerantes ("malaga" encuentra "Málaga"). */
export function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Normaliza el código de carretera: "a 6", "A6" y "a-6" → "a-6". */
export function foldRoad(s: string): string {
  return fold(s).replace(/\s+/g, "").replace(/^([a-z]+)-?(\d)/, "$1-$2");
}

export function hasActiveFilters(f: Filters): boolean {
  return (
    f.types.length > 0 || !!f.province || !!f.community || !!f.road || !!f.severity ||
    !!f.status || !!f.direction || f.recentOnly || f.query.trim() !== ""
  );
}

export function matchesQuery(i: TrafficIncident, query: string): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  const qRoad = foldRoad(query.trim());
  const roadFolded = i.road ? foldRoad(i.road) : "";
  // Carretera: "A-6" encuentra A-6 pero no A-62/A-63 (tras un código completo no sigue un dígito);
  // "AP-" o "A" sí funcionan como prefijo mientras se escribe.
  if (roadFolded) {
    const endsInDigit = /\d$/.test(qRoad);
    const next = roadFolded[qRoad.length] ?? "";
    if (roadFolded === qRoad || (roadFolded.startsWith(qRoad) && !(endsInDigit && /\d/.test(next)))) return true;
  }
  return [i.municipality, i.province, i.community, i.title]
    .filter((v): v is string => !!v)
    .some((v) => fold(v).includes(q));
}

export function applyFilters(
  incidents: TrafficIncident[],
  f: Filters,
  now: number = Date.now(),
): TrafficIncident[] {
  const recentMs = RECENT_HOURS * 3600_000;
  const road = f.road ? foldRoad(f.road) : "";
  return incidents.filter((i) => {
    if (f.types.length && !f.types.includes(i.type)) return false;
    if (f.province && i.province !== f.province) return false;
    if (f.community && i.community !== f.community) return false;
    if (road && (!i.road || foldRoad(i.road) !== road)) return false;
    if (f.severity && i.severity !== f.severity) return false;
    if (f.status && i.status !== f.status) return false;
    if (f.direction && i.directionCompass !== f.direction) return false;
    if (f.recentOnly) {
      const t = i.lastUpdated ? Date.parse(i.lastUpdated) : NaN;
      if (Number.isNaN(t) || now - t > recentMs) return false;
    }
    return matchesQuery(i, f.query);
  });
}

export type SortKey = "time" | "severity" | "type" | "road";

const ts = (s: string | null) => (s ? Date.parse(s) || 0 : 0);

export function sortIncidents(list: TrafficIncident[], key: SortKey): TrafficIncident[] {
  const out = [...list];
  const byTime = (a: TrafficIncident, b: TrafficIncident) => ts(b.lastUpdated) - ts(a.lastUpdated);
  switch (key) {
    case "time":
      return out.sort(byTime);
    case "severity":
      return out.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || byTime(a, b));
    case "type":
      return out.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || byTime(a, b));
    case "road":
      return out.sort(
        (a, b) =>
          (a.road ?? "￿").localeCompare(b.road ?? "￿", "es", { numeric: true }) ||
          (parseFloat(a.kilometer ?? "") || 0) - (parseFloat(b.kilometer ?? "") || 0),
      );
  }
}

export function countByType(list: TrafficIncident[]): Record<IncidentType, number> {
  const counts = Object.fromEntries(TYPE_ORDER.map((t) => [t, 0])) as Record<IncidentType, number>;
  for (const i of list) counts[i.type]++;
  return counts;
}

export function distinctSorted(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b, "es"));
}
