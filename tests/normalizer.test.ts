import { describe, expect, it } from "vitest";
import { parseDatex } from "@/lib/dgt/datex-parser";
import { normalizeFeed } from "@/lib/dgt/incident-normalizer";
import { fixture, loadFixtureIncidents } from "./helpers";

const real = () => loadFixtureIncidents("real-sample.xml");

describe("normalizeFeed (muestra real DGT)", () => {
  it("genera incidencias con id único y campos del modelo", () => {
    const list = real();
    expect(list.length).toBeGreaterThanOrEqual(14);
    expect(new Set(list.map((i) => i.id)).size).toBe(list.length);
    for (const i of list) {
      expect(i.source).toBeTruthy();
      expect(i.title).toBeTruthy();
    }
  });

  it("extrae carretera, p.k., provincia, municipio y coordenadas de un tramo", () => {
    const i = real().find((x) => x.id === "21204838")!; // AbnormalTraffic en AS-227
    expect(i.type).toBe("congestion");
    expect(i.road).toBe("AS-227");
    expect(i.kilometer).toBe("37,3–37,5");
    expect(i.province).toBe("Asturias");
    expect(i.municipality).toBe("Somiedo");
    expect(i.community).toBe("Asturias, Principado de");
    expect(i.latitude).toBeCloseTo(43.1065, 3);
    expect(i.longitude).toBeCloseTo(-6.2594, 3);
    expect(i.segment).toHaveLength(2);
    expect(i.severity).toBe("medium");
    expect(i.status).toBe("active");
    expect(i.startTime).toBe("2026-03-12T06:38:39.000+01:00");
  });

  it("lee el punto de un PointLocation", () => {
    const point = real().find((i) => i.road === "HU-883");
    expect(point).toBeDefined();
    expect(point!.segment).toBeNull();
    expect(point!.kilometer).toBe("1,2");
    expect(point!.latitude).toBeCloseTo(41.705166, 5);
  });

  it("usa el destino como sentido y lo pasa a mayúscula inicial si venía en mayúsculas", () => {
    const withDest = real().filter((i) => i.direction?.startsWith("Sentido ") && i.direction.length > 9);
    expect(withDest.length).toBeGreaterThan(0);
    for (const i of withDest) expect(i.direction).not.toBe(i.direction!.toUpperCase());
  });

  it("fin previsto solo si existe en el feed", () => {
    const list = real();
    expect(list.some((i) => i.expectedEnd)).toBe(true);
    expect(list.some((i) => i.expectedEnd === null)).toBe(true);
  });

  it("describe restricciones de vehículos a partir de los códigos", () => {
    const heavy = real().find((i) => i.description?.includes("peso"));
    expect(heavy?.description).toMatch(/Afecta a: peso más de [\d,]+ t/);
  });
});

describe("normalizeFeed (datos incompletos)", () => {
  const list = normalizeFeed(parseDatex(fixture("incomplete.xml")));
  const byId = (id: string) => list.find((i) => i.id === id)!;

  it("conserva registros sin ubicación, sin inventar coordenadas", () => {
    const i = byId("r-nolocation");
    expect(i.latitude).toBeNull();
    expect(i.longitude).toBeNull();
    expect(i.road).toBeNull();
    expect(i.province).toBeNull();
    expect(i.kilometer).toBeNull();
    expect(i.direction).toBeNull();
    expect(i.description).toBeNull();
    expect(i.type).toBe("other");
  });

  it("descarta coordenadas fuera de España (p. ej. 0,0)", () => {
    const i = byId("r-badcoords");
    expect(i.type).toBe("accident");
    expect(i.latitude).toBeNull();
    expect(i.longitude).toBeNull();
  });

  it("descarta registros sin id y tolera situaciones vacías", () => {
    expect(list.map((i) => i.id).sort()).toEqual(["r-badcoords", "r-nolocation", "r-unknown"]);
  });

  it("fecha corrupta → null; tipo desconocido → 'other' con título genérico", () => {
    const i = byId("r-unknown");
    expect(i.lastUpdated).toBeNull();
    expect(i.type).toBe("other");
    expect(i.title).toBe("Incidencia");
    expect(i.status).toBe("unknown");
    expect(i.severity).toBe("unknown");
  });
});
