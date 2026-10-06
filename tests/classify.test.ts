import { describe, expect, it } from "vitest";
import { buildTitle, classifyType, mapSeverity, type ClassifyInput } from "@/lib/dgt/classify";

const c = (over: Partial<ClassifyInput>): ClassifyInput => ({
  recordType: null, causeType: null, detailedCause: null, managementType: null, ...over,
});

describe("classifyType", () => {
  it.each([
    [c({ causeType: "accident", detailedCause: "accident" }), "accident"],
    [c({ recordType: "AbnormalTraffic", causeType: "environmentalObstruction" }), "congestion"],
    [c({ causeType: "roadMaintenance", managementType: "roadClosed" }), "closure"],
    [c({ causeType: "roadMaintenance", managementType: "carriagewayClosures" }), "closure"],
    [c({ causeType: "roadMaintenance", managementType: "laneClosures" }), "roadworks"],
    [c({ causeType: "roadMaintenance" }), "roadworks"],
    [c({ causeType: "vehicleObstruction", detailedCause: "vehicleStuck" }), "hazard"],
    [c({ causeType: "environmentalObstruction", detailedCause: "rockfalls" }), "hazard"],
    [c({ causeType: "poorEnvironment" }), "hazard"],
    [c({ recordType: "GeneralInstructionOrMessageToRoadUsers" }), "other"],
    [c({ managementType: "weightRestrictionInOperation" }), "other"],
    [c({}), "other"],
  ] as const)("%j → %s", (input, expected) => {
    expect(classifyType(input)).toBe(expected);
  });

  it("un accidente con carril cortado sigue siendo accidente", () => {
    expect(classifyType(c({ causeType: "accident", managementType: "laneClosures" }))).toBe("accident");
  });
});

describe("buildTitle / mapSeverity", () => {
  it("usa el detalle más específico y cae a genérico si no se conoce", () => {
    expect(buildTitle(c({ detailedCause: "vehicleStuck" }), "hazard")).toBe("Vehículo detenido");
    expect(buildTitle(c({ causeType: "roadMaintenance" }), "roadworks")).toBe("Obras");
    expect(buildTitle(c({ causeType: "zzz", detailedCause: "zzz" }), "other")).toBe("Incidencia");
    expect(buildTitle(c({ managementType: "roadClosed" }), "closure")).toBe("Carretera cortada");
  });

  it("mapea severidad DATEX y trata lo desconocido como 'unknown'", () => {
    expect(mapSeverity("highest")).toBe("highest");
    expect(mapSeverity("medium")).toBe("medium");
    expect(mapSeverity("lowest")).toBe("low");
    expect(mapSeverity(undefined)).toBe("unknown");
    expect(mapSeverity("raro")).toBe("unknown");
  });
});
