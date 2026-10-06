import { beforeEach, describe, expect, it, vi } from "vitest";
import { DgtUnavailableError, __resetCacheForTests, fetchIncidentsFromDgt, getIncidents } from "@/lib/dgt/dgt-client";
import { fixture } from "./helpers";

const xmlResponse = (body: string, status = 200) =>
  new Response(body, { status, headers: { "content-type": "text/xml" } });

beforeEach(() => {
  __resetCacheForTests();
  vi.restoreAllMocks();
});

describe("fetchIncidentsFromDgt", () => {
  it("descarga y normaliza", async () => {
    const f = vi.fn(async () => xmlResponse(fixture("real-sample.xml")));
    const r = await fetchIncidentsFromDgt("http://x", f as unknown as typeof fetch);
    expect(r.incidents.length).toBeGreaterThan(10);
    expect(r.publishedAt).toContain("2026-10-06");
  });
  it("HTTP 500 → DgtUnavailableError", async () => {
    const f = vi.fn(async () => xmlResponse("boom", 500));
    await expect(fetchIncidentsFromDgt("http://x", f as unknown as typeof fetch)).rejects.toThrow(/HTTP 500/);
  });
  it("fallo de red → DgtUnavailableError", async () => {
    const f = vi.fn(async () => { throw new TypeError("fetch failed"); });
    await expect(fetchIncidentsFromDgt("http://x", f as unknown as typeof fetch)).rejects.toBeInstanceOf(DgtUnavailableError);
  });
  it("respuesta que no es DATEX → error (no lista vacía)", async () => {
    const f = vi.fn(async () => xmlResponse("<html>mantenimiento</html>"));
    await expect(fetchIncidentsFromDgt("http://x", f as unknown as typeof fetch)).rejects.toThrow();
  });
  it("feed válido sin incidencias → lista vacía (distinto de error)", async () => {
    const f = vi.fn(async () => xmlResponse(`<d2:payload xmlns:d2="x"><com:publicationTime xmlns:com="y">2026-10-06T10:00:00Z</com:publicationTime></d2:payload>`));
    const r = await fetchIncidentsFromDgt("http://x", f as unknown as typeof fetch);
    expect(r.incidents).toEqual([]);
  });
});

describe("getIncidents (caché)", () => {
  it("reutiliza la caché dentro del TTL y agrupa llamadas simultáneas", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => xmlResponse(fixture("real-sample.xml")));
    const [a, b] = await Promise.all([getIncidents(1000), getIncidents(1000)]);
    await getIncidents(2000);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(a.stale).toBe(false);
    expect(b.incidents.length).toBe(a.incidents.length);
  });
  it("si la DGT falla sirve la copia anterior marcada como stale con el error", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementationOnce(async () => xmlResponse(fixture("real-sample.xml")));
    await getIncidents(0);
    spy.mockImplementation(async () => xmlResponse("x", 503));
    const r = await getIncidents(Date.now() + 10 * 60_000);
    expect(r.stale).toBe(true);
    expect(r.error).toMatch(/503/);
    expect(r.incidents.length).toBeGreaterThan(0);
  });
  it("si falla y no hay copia, lanza", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => xmlResponse("x", 503));
    await expect(getIncidents()).rejects.toThrow(/503/);
  });
});
