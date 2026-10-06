import { XMLParser } from "fast-xml-parser";
import type { ParsedFeed, RawRecord } from "./types";

/**
 * Parser DATEX II (perfil DGT v3.7). Elimina prefijos de namespace (sit:, loc:, com:, lse:…)
 * para que el normalizador no dependa de ellos, y fuerza arrays donde el feed puede traer 1..n.
 */
const ARRAY_TAGS = new Set(["situation", "situationRecord"]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  parseTagValue: false, // mantenemos strings; el normalizador convierte lo que necesite
  trimValues: true,
  isArray: (name) => ARRAY_TAGS.has(name),
});

export class DatexParseError extends Error {}

const asObject = (v: unknown): RawRecord | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as RawRecord) : null;

export function parseDatex(xml: string): ParsedFeed {
  if (!xml || !xml.trim()) throw new DatexParseError("Respuesta vacía");

  let doc: RawRecord;
  try {
    doc = parser.parse(xml) as RawRecord;
  } catch (e) {
    throw new DatexParseError(`XML no válido: ${(e as Error).message}`);
  }

  // Un <payload/> vacío es un feed válido sin situaciones (se parsea como "").
  const payload = doc.payload === "" ? {} : asObject(doc.payload);
  if (!payload) throw new DatexParseError("No se encontró d2:payload en la respuesta");

  const publicationTime =
    typeof payload.publicationTime === "string" ? payload.publicationTime : null;

  const records: ParsedFeed["records"] = [];
  const situations = (payload.situation as unknown[] | undefined) ?? [];
  for (const s of situations) {
    const situation = asObject(s);
    if (!situation) continue;
    for (const r of (situation.situationRecord as unknown[] | undefined) ?? []) {
      const record = asObject(r);
      if (record) records.push({ situation, record });
    }
  }
  return { publicationTime, records };
}
