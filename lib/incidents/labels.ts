import type { IncidentStatus, IncidentType, Severity } from "@/lib/dgt/types";

/**
 * Presentación de cada tipo. El color nunca es la única señal: cada tipo tiene además
 * un símbolo y una etiqueta de texto.
 */
export const TYPE_META: Record<
  IncidentType,
  { label: string; plural: string; color: string; symbol: string; emoji: string }
> = {
  accident: { label: "Accidente", plural: "Accidentes", color: "#dc2626", symbol: "!", emoji: "🔴" },
  congestion: { label: "Retención", plural: "Retenciones", color: "#ea580c", symbol: "≈", emoji: "🟠" },
  roadworks: { label: "Obras", plural: "Obras", color: "#ca8a04", symbol: "⚒", emoji: "🟡" },
  closure: { label: "Corte", plural: "Cortes", color: "#1f2937", symbol: "✕", emoji: "⚫" },
  hazard: { label: "Peligro", plural: "Peligros", color: "#7c3aed", symbol: "▲", emoji: "🟣" },
  other: { label: "Otros", plural: "Otros", color: "#2563eb", symbol: "i", emoji: "🔵" },
};

export const TYPE_ORDER: IncidentType[] = [
  "accident", "congestion", "closure", "roadworks", "hazard", "other",
];

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  highest: "Máxima",
  unknown: "Sin dato",
};

/** Mayor número = más grave; "sin dato" va al final al ordenar por gravedad. */
export const SEVERITY_RANK: Record<Severity, number> = {
  highest: 4, high: 3, medium: 2, low: 1, unknown: 0,
};

export const STATUS_LABEL: Record<IncidentStatus, string> = {
  active: "Activa",
  suspended: "Suspendida",
  planned: "Programada",
  unknown: "Desconocido",
};

export const COMPASS_FILTER_LABEL: Record<string, string> = {
  north: "Norte", northEast: "Noreste", east: "Este", southEast: "Sureste",
  south: "Sur", southWest: "Suroeste", west: "Oeste", northWest: "Noroeste",
};
