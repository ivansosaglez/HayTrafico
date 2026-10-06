/** "Hace 4 min", "Hace 3 h", "Hace 2 días". `now` es inyectable para tests. */
export function timeAgo(iso: string | null, now: number = Date.now()): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 45) return "Hace unos segundos";
  const m = Math.round(s / 60);
  if (m < 60) return `Hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.round(h / 24);
  return `Hace ${d} ${d === 1 ? "día" : "días"}`;
}

/** "32 segundos", "4 minutos" (sin "hace"). */
export function durationLabel(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} ${s === 1 ? "segundo" : "segundos"}`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} ${m === 1 ? "minuto" : "minutos"}`;
  const h = Math.round(m / 60);
  return `${h} ${h === 1 ? "hora" : "horas"}`;
}

const fmt = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid",
});

export function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : fmt.format(t);
}
