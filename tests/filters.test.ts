import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS, applyFilters, countByType, foldRoad, matchesQuery, sortIncidents,
} from "@/lib/incidents/filters";
import { isLimitedCoverageArea } from "@/lib/incidents/coverage";
import { makeIncident as mk } from "./helpers";

const NOW = Date.parse("2026-10-06T12:00:00Z");
const data = [
  mk({ id: "a", type: "accident", road: "A-6", province: "Madrid", community: "Madrid, Comunidad de", severity: "highest", lastUpdated: "2026-10-06T11:55:00Z", directionCompass: "north" }),
  mk({ id: "b", type: "roadworks", road: "AP-7", province: "Alacant/Alicante", severity: "unknown", lastUpdated: "2026-10-01T11:55:00Z" }),
  mk({ id: "c", type: "closure", road: "A-62", province: "Málaga", municipality: "Ronda", severity: "medium", lastUpdated: "2026-10-06T11:00:00Z", status: "planned" }),
  mk({ id: "d", type: "accident", road: null, province: null, lastUpdated: null }),
];
const ids = (l: { id: string }[]) => l.map((i) => i.id);

describe("applyFilters", () => {
  it("sin filtros devuelve todo", () => expect(applyFilters(data, EMPTY_FILTERS, NOW)).toHaveLength(4));
  it("por tipo (múltiple)", () =>
    expect(ids(applyFilters(data, { ...EMPTY_FILTERS, types: ["accident", "closure"] }, NOW))).toEqual(["a", "c", "d"]));
  it("por provincia, comunidad, gravedad, estado y sentido", () => {
    expect(ids(applyFilters(data, { ...EMPTY_FILTERS, province: "Málaga" }, NOW))).toEqual(["c"]);
    expect(ids(applyFilters(data, { ...EMPTY_FILTERS, community: "Madrid, Comunidad de" }, NOW))).toEqual(["a"]);
    expect(ids(applyFilters(data, { ...EMPTY_FILTERS, severity: "medium" }, NOW))).toEqual(["c"]);
    expect(ids(applyFilters(data, { ...EMPTY_FILTERS, status: "planned" }, NOW))).toEqual(["c"]);
    expect(ids(applyFilters(data, { ...EMPTY_FILTERS, direction: "north" }, NOW))).toEqual(["a"]);
  });
  it("por carretera tolera formato (A6, a-6)", () => {
    expect(ids(applyFilters(data, { ...EMPTY_FILTERS, road: "A6" }, NOW))).toEqual(["a"]);
    expect(ids(applyFilters(data, { ...EMPTY_FILTERS, road: "ap-7" }, NOW))).toEqual(["b"]);
  });
  it("solo recientes excluye antiguas y sin fecha", () =>
    expect(ids(applyFilters(data, { ...EMPTY_FILTERS, recentOnly: true }, NOW))).toEqual(["a", "c"]));
  it("combina filtros", () =>
    expect(applyFilters(data, { ...EMPTY_FILTERS, types: ["accident"], province: "Madrid" }, NOW)).toHaveLength(1));
});

describe("búsqueda", () => {
  it("encuentra carretera, municipio y provincia sin acentos ni mayúsculas", () => {
    expect(matchesQuery(data[0], "a-6")).toBe(true);
    expect(matchesQuery(data[0], "A6")).toBe(true);
    expect(matchesQuery(data[2], "malaga")).toBe(true);
    expect(matchesQuery(data[2], "ronda")).toBe(true);
    expect(matchesQuery(data[0], "ap-7")).toBe(false);
  });
  it("'A-6' no coincide con A-62 (el código no se busca por prefijo numérico)", () => {
    expect(matchesQuery(data[2], "a-6")).toBe(false);
    expect(matchesQuery(data[2], "a-62")).toBe(true);
    expect(matchesQuery(data[0], "a-6")).toBe(true);
    expect(foldRoad("A 6")).toBe("a-6");
  });
  it("detecta zonas sin cobertura DGT", () => {
    expect(isLimitedCoverageArea("Bilbao")).toBe(true);
    expect(isLimitedCoverageArea("Barcelona")).toBe(true);
    expect(isLimitedCoverageArea("Tenerife")).toBe(false);
  });
});

describe("orden y recuentos", () => {
  it("por hora: más reciente primero, sin fecha al final", () =>
    expect(ids(sortIncidents(data, "time"))).toEqual(["a", "c", "b", "d"]));
  it("por gravedad", () => expect(ids(sortIncidents(data, "severity"))[0]).toBe("a"));
  it("por tipo", () => expect(ids(sortIncidents(data, "type"))).toEqual(["a", "d", "c", "b"]));
  it("por carretera (numérico) y sin carretera al final", () =>
    expect(ids(sortIncidents(data, "road"))).toEqual(["a", "c", "b", "d"]));
  it("recuentos por tipo", () => expect(countByType(data)).toMatchObject({ accident: 2, closure: 1, roadworks: 1, hazard: 0 }));
});
