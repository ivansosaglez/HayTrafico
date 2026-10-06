/** Categorías amigables a las que se normalizan los tipos DATEX2. */
export type IncidentType =
  | "accident"
  | "congestion"
  | "roadworks"
  | "closure"
  | "hazard"
  | "other";

export type Severity = "low" | "medium" | "high" | "highest" | "unknown";

export type IncidentStatus = "active" | "suspended" | "planned" | "unknown";

export type Compass =
  | "north" | "northEast" | "east" | "southEast"
  | "south" | "southWest" | "west" | "northWest";

/** Modelo interno simplificado. Los componentes React solo conocen esto. */
export interface TrafficIncident {
  id: string;
  type: IncidentType;
  severity: Severity;
  title: string;
  description: string | null;
  road: string | null;
  kilometer: string | null;
  province: string | null;
  community: string | null;
  municipality: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Tramo afectado [inicio, fin] cuando el feed lo da. */
  segment: [[number, number], [number, number]] | null;
  /** Texto de sentido para mostrar (destino o punto cardinal). */
  direction: string | null;
  directionCompass: Compass | null;
  startTime: string | null;
  lastUpdated: string | null;
  expectedEnd: string | null;
  status: IncidentStatus;
  source: string;
}

export interface IncidentsPayload {
  incidents: TrafficIncident[];
  /** Momento en que nuestro servidor obtuvo con éxito el feed (ISO). */
  fetchedAt: string;
  /** publicationTime declarado por la DGT en el feed (ISO), si existe. */
  publishedAt: string | null;
  /** true si se sirve una copia antigua porque la DGT falló. */
  stale: boolean;
  /** Mensaje del último error al consultar la DGT, si lo hubo. */
  error: string | null;
}

/** Resultado crudo del parser, aún sin normalizar. */
export interface RawRecord {
  [key: string]: unknown;
}

export interface ParsedFeed {
  publicationTime: string | null;
  records: { situation: RawRecord; record: RawRecord }[];
}
