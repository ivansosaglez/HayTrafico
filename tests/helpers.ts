import { readFileSync } from "node:fs";
import path from "node:path";
import { parseDatex } from "@/lib/dgt/datex-parser";
import { normalizeFeed } from "@/lib/dgt/incident-normalizer";
import type { TrafficIncident } from "@/lib/dgt/types";

export const fixture = (name: string) =>
  readFileSync(path.join(import.meta.dirname, "fixtures", name), "utf8");

export const loadFixtureIncidents = (name: string): TrafficIncident[] =>
  normalizeFeed(parseDatex(fixture(name)));

export function makeIncident(over: Partial<TrafficIncident> = {}): TrafficIncident {
  return {
    id: "1", type: "other", severity: "unknown", title: "Incidencia", description: null,
    road: null, kilometer: null, province: null, community: null, municipality: null,
    latitude: null, longitude: null, segment: null, direction: null, directionCompass: null,
    startTime: null, lastUpdated: null, expectedEnd: null, status: "active", source: "DGT",
    ...over,
  };
}
