import { describe, expect, it } from "vitest";
import { durationLabel, timeAgo } from "@/lib/incidents/format";

const now = Date.parse("2026-10-06T12:00:00Z");
describe("format", () => {
  it("timeAgo", () => {
    expect(timeAgo("2026-10-06T11:56:00Z", now)).toBe("Hace 4 min");
    expect(timeAgo("2026-10-06T11:59:50Z", now)).toBe("Hace unos segundos");
    expect(timeAgo("2026-10-06T09:00:00Z", now)).toBe("Hace 3 h");
    expect(timeAgo("2026-10-04T12:00:00Z", now)).toBe("Hace 2 días");
    expect(timeAgo(null, now)).toBeNull();
    expect(timeAgo("basura", now)).toBeNull();
  });
  it("durationLabel", () => {
    expect(durationLabel(32_000)).toBe("32 segundos");
    expect(durationLabel(4 * 60_000)).toBe("4 minutos");
  });
});
