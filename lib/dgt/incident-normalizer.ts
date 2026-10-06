import {
  COMPASS_LABELS,
  LANE_LABELS,
  MANAGEMENT_LABELS,
  VEHICLE_LABELS,
  buildTitle,
  classifyType,
  mapSeverity,
} from "./classify";
import type {
  Compass,
  IncidentStatus,
  ParsedFeed,
  RawRecord,
  TrafficIncident,
} from "./types";

/** Límites amplios de España (incluye Canarias y Baleares) para descartar coordenadas absurdas. */
const BOUNDS = { latMin: 26, latMax: 45, lngMin: -20, lngMax: 6 };

// ---------- helpers de acceso tolerantes ----------

function get(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const key of path.split(".")) {
    if (cur && typeof cur === "object" && !Array.isArray(cur)) {
      cur = (cur as RawRecord)[key];
    } else {
      return undefined;
    }
  }
  return cur;
}

function str(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return String(v);
  if (v && typeof v === "object" && "#text" in (v as RawRecord)) return str((v as RawRecord)["#text"]);
  return null;
}

function num(v: unknown): number | null {
  const s = str(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function isoOrNull(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  return Number.isNaN(Date.parse(s)) ? null : s;
}

/** "sit:AbnormalTraffic" → "AbnormalTraffic" */
const stripPrefix = (s: string | null) => (s ? s.replace(/^[^:]*:/, "") : null);

function titleCaseIfShouting(s: string): string {
  if (s !== s.toUpperCase() || s.length < 3) return s;
  return s.toLowerCase().replace(/(^|[\s\-/(])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

// ---------- ubicación ----------

interface Point {
  lat: number | null;
  lng: number | null;
  km: number | null;
  province: string | null;
  community: string | null;
  municipality: string | null;
}

function readPoint(node: unknown): Point | null {
  if (!node || typeof node !== "object") return null;
  const ext = get(node, "_tpegNonJunctionPointExtension.extendedTpegNonJunctionPoint");
  let lat = num(get(node, "pointCoordinates.latitude"));
  let lng = num(get(node, "pointCoordinates.longitude"));
  if (
    lat === null || lng === null ||
    lat < BOUNDS.latMin || lat > BOUNDS.latMax || lng < BOUNDS.lngMin || lng > BOUNDS.lngMax
  ) {
    lat = null;
    lng = null;
  }
  return {
    lat,
    lng,
    km: num(get(ext, "kilometerPoint")),
    province: str(get(ext, "province")),
    community: str(get(ext, "autonomousCommunity")),
    municipality: str(get(ext, "municipality")),
  };
}

const fmtKm = (n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 1, useGrouping: false });

function formatKm(a: Point | null, b: Point | null): string | null {
  const kms = [a?.km, b?.km].filter((k): k is number => typeof k === "number");
  if (kms.length === 0) return null;
  const lo = Math.min(...kms);
  const hi = Math.max(...kms);
  return lo === hi ? fmtKm(lo) : `${fmtKm(lo)}–${fmtKm(hi)}`;
}

function describeCharacteristic(v: unknown, field: string, unit: string, noun: string): string | null {
  const value = num(get(v, field));
  if (value === null) return null;
  const ops: Record<string, string> = {
    greaterThan: "más de",
    lessThan: "menos de",
    equalTo: "igual a",
    greaterThanOrEqualTo: "al menos",
    lessThanOrEqualTo: "como máximo",
  };
  const op = ops[str(get(v, "comparisonOperator")) ?? ""] ?? "";
  return `${noun} ${op} ${fmtKm(value)} ${unit}`.replace(/\s+/g, " ").trim();
}

// ---------- normalización de un registro ----------

const DETAILED_KEYS = [
  "accidentType", "roadMaintenanceType", "vehicleObstructionType", "obstructionType",
  "environmentalObstructionType", "infrastructureDamageType", "poorEnvironmentType",
  "nonWeatherRelatedRoadConditionType", "abnormalTrafficType", "speedManagementType",
  "generalInstructionToRoadUsersType",
];

function detailedCause(record: RawRecord): string | null {
  // Preferimos el tipo propio del registro (p. ej. abnormalTrafficType) y luego el de la causa.
  for (const k of DETAILED_KEYS) {
    const own = str(record[k]);
    if (own) return own;
  }
  const d = get(record, "cause.detailedCauseType");
  if (d && typeof d === "object") {
    for (const v of Object.values(d as RawRecord)) {
      const s = str(v);
      if (s) return s;
    }
  }
  return null;
}

export function normalizeRecord(situation: RawRecord, record: RawRecord): TrafficIncident | null {
  const rawId = str(record["@_id"]);
  if (!rawId) return null;

  const recordType = stripPrefix(str(record["@_type"]));
  const causeType = str(get(record, "cause.causeType"));
  const detail = detailedCause(record);
  const managementType = str(record.roadOrCarriagewayOrLaneManagementType);
  const input = { recordType, causeType, detailedCause: detail, managementType };

  const type = classifyType(input);
  const title = buildTitle(input, type);

  // Ubicación: tramo (from/to) o punto.
  const loc = get(record, "locationReference");
  const linear = get(loc, "tpegLinearLocation");
  const from = readPoint(get(linear, "from"));
  const to = readPoint(get(linear, "to"));
  const single = readPoint(get(loc, "tpegPointLocation.point"));
  const points = [from, to, single].filter((p): p is Point => !!p);
  const withCoords = points.filter((p) => p.lat !== null && p.lng !== null);

  let latitude: number | null = null;
  let longitude: number | null = null;
  if (withCoords.length > 0) {
    const avg = (k: "lat" | "lng") =>
      Math.round((withCoords.reduce((s, p) => s + (p[k] as number), 0) / withCoords.length) * 1e6) / 1e6;
    latitude = avg("lat");
    longitude = avg("lng");
  }
  const segment: TrafficIncident["segment"] =
    from?.lat != null && to?.lat != null && (from.lat !== to.lat || from.lng !== to.lng)
      ? [[from.lat, from.lng as number], [to.lat, to.lng as number]]
      : null;

  const firstOf = (key: keyof Point) =>
    points.map((p) => p[key]).find((v) => typeof v === "string" && v) as string | undefined;
  const province = firstOf("province") ?? null;
  const community = firstOf("community") ?? null;
  const municipality = firstOf("municipality") ?? null;
  const kilometer = single ? formatKm(single, null) : formatKm(from, to);

  // Carretera y sentido.
  const road = str(get(loc, "supplementaryPositionalDescription.roadInformation.roadName"))?.toUpperCase() ?? null;
  const destination = str(get(loc, "supplementaryPositionalDescription.roadInformation.roadDestination"));
  const rawCompass = str(get(linear, "tpegDirection")) ?? str(get(loc, "tpegPointLocation.tpegDirection"));
  const compass = rawCompass && rawCompass in COMPASS_LABELS ? (rawCompass as Compass) : null;
  const bothWays =
    str(get(linear, "_tpegLinearLocationExtension.extendedTpegLinearLocation.tpegDirectionRoad")) === "both";
  const direction = destination
    ? `Sentido ${titleCaseIfShouting(destination)}`
    : bothWays
      ? "Ambos sentidos"
      : compass
        ? `Sentido ${COMPASS_LABELS[compass]}`
        : null;

  // Descripción construida solo con códigos presentes en el feed.
  const parts: string[] = [];
  if (managementType && managementType in MANAGEMENT_LABELS && type !== "closure" && title !== MANAGEMENT_LABELS[managementType]) {
    let t = MANAGEMENT_LABELS[managementType];
    const lane = str(get(loc, "supplementaryPositionalDescription.carriageway.lane.laneUsage"));
    if (lane && LANE_LABELS[lane]) t += ` (${LANE_LABELS[lane]})`;
    parts.push(t);
  }
  if (type === "closure" && causeType === "roadMaintenance") parts.push("Por obras");
  const speed = num(record.temporarySpeedLimit);
  if (speed !== null) parts.push(`Límite temporal de velocidad: ${fmtKm(speed)} km/h`);
  const veh = get(record, "forVehiclesWithCharacteristicsOf");
  const vehType = str(get(veh, "vehicleType"));
  const affects = [
    vehType && VEHICLE_LABELS[vehType] ? VEHICLE_LABELS[vehType] : null,
    describeCharacteristic(get(veh, "grossWeightCharacteristic"), "grossVehicleWeight", "t", "peso"),
    describeCharacteristic(get(veh, "widthCharacteristic"), "vehicleWidth", "m", "ancho"),
    describeCharacteristic(get(veh, "lengthCharacteristic"), "vehicleLength", "m", "largo"),
  ].filter(Boolean);
  if (affects.length) parts.push(`Afecta a: ${affects.join(", ")}`);
  if (str(record.complianceOption) === "advisory") parts.push("Recomendación (no obligatoria)");

  // Tiempos y estado.
  const startTime = isoOrNull(get(record, "validity.validityTimeSpecification.overallStartTime"));
  const expectedEnd = isoOrNull(get(record, "validity.validityTimeSpecification.overallEndTime"));
  const lastUpdated =
    isoOrNull(record.situationRecordVersionTime) ?? isoOrNull(record.situationRecordCreationTime);
  const validity = str(get(record, "validity.validityStatus"));
  let status: IncidentStatus = "unknown";
  if (validity === "active") status = "active";
  else if (validity === "suspended") status = "suspended";
  else if (validity === "definedByValidityTimeSpec") {
    status = startTime && Date.parse(startTime) > Date.now() ? "planned" : "active";
  }

  return {
    id: rawId,
    type,
    severity: mapSeverity(str(record.severity) ?? str(situation.overallSeverity)),
    title,
    description: parts.length ? parts.join(" · ") : null,
    road,
    kilometer,
    province,
    community,
    municipality,
    latitude,
    longitude,
    segment,
    direction,
    directionCompass: compass,
    startTime,
    lastUpdated,
    expectedEnd,
    status,
    source: str(get(record, "source.sourceIdentification")) ?? "DGT",
  };
}

/** Normaliza todo el feed. Un registro defectuoso se descarta sin afectar al resto. */
export function normalizeFeed(feed: ParsedFeed): TrafficIncident[] {
  const byId = new Map<string, TrafficIncident>();
  for (const { situation, record } of feed.records) {
    try {
      const inc = normalizeRecord(situation, record);
      if (inc) byId.set(inc.id, inc);
    } catch {
      // registro con estructura inesperada: se omite
    }
  }
  return [...byId.values()];
}
