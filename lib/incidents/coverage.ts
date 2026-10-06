import { fold } from "./filters";

/**
 * La DGT NO publica (salvo algún punto aislado) incidencias de Cataluña y País Vasco.
 * Si el usuario busca o filtra por esas zonas, se muestra un aviso explícito.
 */
const LIMITED_TERMS = [
  "cataluna", "catalunya", "barcelona", "girona", "gerona", "lleida", "lerida", "tarragona",
  "pais vasco", "euskadi", "bilbao", "bizkaia", "vizcaya", "gipuzkoa", "guipuzcoa",
  "san sebastian", "donostia", "araba", "alava", "vitoria", "gasteiz",
];

export function isLimitedCoverageArea(text: string): boolean {
  const t = fold(text);
  return t.length >= 3 && LIMITED_TERMS.some((term) => t.includes(term) || term.startsWith(t));
}

export const COVERAGE_SHORT =
  "La DGT no publica incidencias de Cataluña ni del País Vasco (sus propios servicios de tráfico las gestionan).";
