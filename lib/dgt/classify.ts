import type { IncidentType, Severity } from "./types";

/**
 * Clasificación de tipos DATEX2 reales a categorías amigables y traducción de códigos.
 * Todos los códigos proceden de valores observados en el feed (ver docs/dgt-data-source.md);
 * un código desconocido nunca rompe nada: cae en una etiqueta genérica.
 */

export interface ClassifyInput {
  /** xsi:type del situationRecord sin prefijo, p. ej. "AbnormalTraffic". */
  recordType: string | null;
  causeType: string | null;
  /** Valor del tipo detallado (accidentType, roadMaintenanceType, vehicleObstructionType…). */
  detailedCause: string | null;
  /** roadOrCarriagewayOrLaneManagementType, si existe. */
  managementType: string | null;
}

const CLOSURE_MANAGEMENT = new Set(["roadClosed", "carriagewayClosures"]);

export function classifyType(i: ClassifyInput): IncidentType {
  if (i.causeType === "accident" || i.detailedCause === "accident") return "accident";
  if (i.recordType === "AbnormalTraffic" || i.causeType === "abnormalTraffic") return "congestion";
  if (i.managementType && CLOSURE_MANAGEMENT.has(i.managementType)) return "closure";
  if (i.causeType === "roadMaintenance" || i.detailedCause === "roadworks") return "roadworks";
  switch (i.causeType) {
    case "vehicleObstruction":
    case "obstruction":
    case "environmentalObstruction":
    case "infrastructureDamageObstruction":
    case "poorEnvironment":
    case "nonWeatherRelatedRoadConditions":
      return "hazard";
  }
  switch (i.recordType) {
    case "VehicleObstruction":
    case "GeneralObstruction":
    case "PoorEnvironmentConditions":
    case "NonWeatherRelatedRoadConditions":
      return "hazard";
  }
  return "other";
}

const DETAIL_LABELS: Record<string, string> = {
  accident: "Accidente",
  roadworks: "Obras",
  vehicleStuck: "Vehículo detenido",
  vehicleOnFire: "Vehículo en llamas",
  vehicleCarryingHazardousMaterials: "Vehículo con mercancías peligrosas",
  vehicleWithOverwideLoad: "Vehículo con carga ancha",
  objectOnTheRoad: "Objeto en la calzada",
  obstructionOnTheRoad: "Obstáculo en la calzada",
  shedLoad: "Carga caída en la calzada",
  rockfalls: "Desprendimiento de rocas",
  flooding: "Inundación",
  avalanches: "Avalancha",
  forestFire: "Incendio forestal",
  damagedRoadSurface: "Firme en mal estado",
  roadSurfaceInPoorCondition: "Firme en mal estado",
  slipperyRoad: "Calzada deslizante",
  rain: "Lluvia",
  badWeather: "Mal tiempo",
  fog: "Niebla",
  visibilityReduced: "Visibilidad reducida",
  slowTraffic: "Tráfico lento",
  queuingTraffic: "Cola de tráfico",
  stationaryTraffic: "Tráfico detenido",
  heavyTraffic: "Tráfico denso",
  speedRestrictionInOperation: "Limitación de velocidad",
  driveCarefully: "Conducir con precaución",
};

const CAUSE_LABELS: Record<string, string> = {
  roadMaintenance: "Obras",
  accident: "Accidente",
  vehicleObstruction: "Vehículo en la vía",
  obstruction: "Obstáculo en la vía",
  environmentalObstruction: "Obstáculo por causas naturales",
  infrastructureDamageObstruction: "Daños en la infraestructura",
  abnormalTraffic: "Tráfico anormal",
  poorEnvironment: "Condiciones meteorológicas adversas",
};

export const MANAGEMENT_LABELS: Record<string, string> = {
  laneClosures: "Carril cerrado",
  singleAlternateLineTraffic: "Circulación alterna por un solo carril",
  carriagewayClosures: "Calzada cerrada",
  narrowLanes: "Carriles estrechos",
  useOfSpecifiedLanesOrCarriagewaysAllowed: "Uso permitido de carriles o calzadas indicados",
  roadClosed: "Carretera cortada",
  intermittentShortTermClosures: "Cortes intermitentes de corta duración",
  newRoadworksLayout: "Nueva disposición de la vía por obras",
  doNotUseSpecifiedLanesOrCarriageways: "Prohibido usar los carriles o calzadas indicados",
  lanesDeviated: "Carriles desviados",
  other: "Otras restricciones",
  weightRestrictionInOperation: "Restricción de peso",
};

export const LANE_LABELS: Record<string, string> = {
  rightLane: "carril derecho",
  leftLane: "carril izquierdo",
  middleLane: "carril central",
  tidalFlowLane: "carril reversible",
  centralReservation: "mediana",
  carPoolLane: "carril VAO",
  turningLane: "carril de giro",
};

export const VEHICLE_LABELS: Record<string, string> = {
  bus: "autobuses",
  car: "turismos",
  carOrLightVehicle: "turismos y vehículos ligeros",
  motorcycle: "motocicletas",
  heavyVehicle: "vehículos pesados",
};

export const COMPASS_LABELS: Record<string, string> = {
  north: "norte",
  northEast: "noreste",
  east: "este",
  southEast: "sureste",
  south: "sur",
  southWest: "suroeste",
  west: "oeste",
  northWest: "noroeste",
};

/** Título corto del incidente: lo más específico que el feed permita. */
export function buildTitle(i: ClassifyInput, type: IncidentType): string {
  if (type === "closure" && i.managementType) {
    return i.managementType === "carriagewayClosures" ? "Calzada cortada" : "Carretera cortada";
  }
  if (i.detailedCause && DETAIL_LABELS[i.detailedCause]) return DETAIL_LABELS[i.detailedCause];
  if (i.causeType && CAUSE_LABELS[i.causeType]) return CAUSE_LABELS[i.causeType];
  if (i.managementType && MANAGEMENT_LABELS[i.managementType]) return MANAGEMENT_LABELS[i.managementType];
  return "Incidencia";
}

export function mapSeverity(value: string | null | undefined): Severity {
  switch (value) {
    case "lowest":
    case "low":
      return "low";
    case "medium":
      return "medium";
    case "high":
      return "high";
    case "highest":
      return "highest";
    default:
      return "unknown";
  }
}
