import { describe, expect, it } from "vitest";
import { DatexParseError, parseDatex } from "@/lib/dgt/datex-parser";
import { fixture } from "./helpers";

describe("parseDatex", () => {
  it("lee publicationTime y todos los registros de la muestra real", () => {
    const feed = parseDatex(fixture("real-sample.xml"));
    expect(feed.publicationTime).toBe("2026-10-06T17:10:08.571+02:00");
    expect(feed.records.length).toBeGreaterThanOrEqual(14);
  });

  it("elimina prefijos de namespace y conserva el xsi:type", () => {
    const feed = parseDatex(fixture("real-sample.xml"));
    const types = new Set(feed.records.map((r) => String(r.record["@_type"])));
    expect([...types].some((t) => t.endsWith("AbnormalTraffic"))).toBe(true);
    expect(feed.records[0].record).toHaveProperty("locationReference");
  });

  it("trata una situación con un único registro como array", () => {
    const xml = `<d2:payload xmlns:d2="x" xmlns:sit="y"><sit:situation id="1"><sit:situationRecord id="a"/></sit:situation></d2:payload>`;
    expect(parseDatex(xml).records).toHaveLength(1);
  });

  it("falla con error claro ante respuestas vacías o no XML de DATEX", () => {
    expect(() => parseDatex("")).toThrow(DatexParseError);
    expect(() => parseDatex("<html><body>Mantenimiento</body></html>")).toThrow(/payload/);
  });

  it("tolera un payload sin situaciones", () => {
    const feed = parseDatex(`<d2:payload xmlns:d2="x"></d2:payload>`);
    expect(feed.records).toEqual([]);
  });
});
