/** Configuración central. Los intervalos se cambian aquí o por variables de entorno. */

export const DGT_API_URL =
  process.env.DGT_API_URL ??
  "https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v37.xml";

/** Segundos que el servidor reutiliza la respuesta de la DGT (feed: ~60 s). */
export const DGT_CACHE_TTL_SECONDS = Number(process.env.DGT_CACHE_TTL ?? 60) || 60;

/** Tiempo máximo de espera a la DGT. */
export const DGT_FETCH_TIMEOUT_MS = 20_000;

/** Segundos entre consultas del navegador a nuestra API. */
export const POLL_INTERVAL_SECONDS =
  Number(process.env.NEXT_PUBLIC_POLL_INTERVAL ?? 60) || 60;

/** "Incidencias recientes": actualizadas en las últimas N horas. */
export const RECENT_HOURS = 6;

export const TILE_URL =
  process.env.NEXT_PUBLIC_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_TILE_ATTRIBUTION ??
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
