import { DGT_API_URL, DGT_CACHE_TTL_SECONDS, DGT_FETCH_TIMEOUT_MS } from "./config";
import { parseDatex } from "./datex-parser";
import { normalizeFeed } from "./incident-normalizer";
import type { IncidentsPayload, TrafficIncident } from "./types";

/**
 * Cliente server-side de la DGT con caché en memoria:
 *  - reutiliza la última respuesta durante DGT_CACHE_TTL_SECONDS,
 *  - agrupa peticiones simultáneas en una sola (single-flight),
 *  - si la DGT falla y hay copia previa, la sirve marcada como `stale` con el error.
 */

interface Snapshot {
  incidents: TrafficIncident[];
  fetchedAt: number;
  publishedAt: string | null;
}

let snapshot: Snapshot | null = null;
let inflight: Promise<Snapshot> | null = null;
let lastError: string | null = null;

export class DgtUnavailableError extends Error {}

/** Descarga, parsea y normaliza el feed. Lanza si la DGT no responde o el XML no es válido. */
export async function fetchIncidentsFromDgt(
  url: string = DGT_API_URL,
  fetchImpl: typeof fetch = fetch,
): Promise<{ incidents: TrafficIncident[]; publishedAt: string | null }> {
  let res: Response;
  try {
    res = await fetchImpl(url, {
      headers: { Accept: "application/xml, text/xml" },
      signal: AbortSignal.timeout(DGT_FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (e) {
    throw new DgtUnavailableError(`No se pudo conectar con la DGT: ${(e as Error).message}`);
  }
  if (!res.ok) throw new DgtUnavailableError(`La DGT respondió con HTTP ${res.status}`);

  const feed = parseDatex(await res.text());
  return { incidents: normalizeFeed(feed), publishedAt: feed.publicationTime };
}

async function refresh(): Promise<Snapshot> {
  const { incidents, publishedAt } = await fetchIncidentsFromDgt();
  snapshot = { incidents, publishedAt, fetchedAt: Date.now() };
  lastError = null;
  return snapshot;
}

/**
 * Devuelve las incidencias (con caché). Lanza solo si no hay datos que servir:
 * ni frescos ni una copia anterior.
 */
export async function getIncidents(now: number = Date.now()): Promise<IncidentsPayload> {
  const fresh = snapshot && now - snapshot.fetchedAt < DGT_CACHE_TTL_SECONDS * 1000;
  if (!fresh) {
    try {
      inflight ??= refresh().finally(() => {
        inflight = null;
      });
      await inflight;
    } catch (e) {
      lastError = (e as Error).message;
      if (!snapshot) throw e;
    }
  }
  const s = snapshot as Snapshot;
  return {
    incidents: s.incidents,
    fetchedAt: new Date(s.fetchedAt).toISOString(),
    publishedAt: s.publishedAt,
    stale: lastError !== null,
    error: lastError,
  };
}

/** Solo para tests. */
export function __resetCacheForTests() {
  snapshot = null;
  inflight = null;
  lastError = null;
}
