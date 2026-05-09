import { describe, expect, it } from "vitest";
import { demoState } from "@/lib/demo-data";
import { calculateSetup, formatMoney } from "@/lib/calculations";
import {
  getMaterialDisplayLines,
  getMaterialDisplayName,
  getMaterialSelectorLabel
} from "@/lib/materials";

const sabic = demoState.materials.find((material) => material.id === "sabic");
const omya = demoState.materials.find((material) => material.id === "omya");

describe("material name localization QA", () => {
  it("shows Arabic market names in market-only mode", () => {
    expect(sabic).toBeDefined();
    expect(omya).toBeDefined();
    expect(getMaterialDisplayName(sabic!, "ar", "marketOnly")).toBe("سابك");
    expect(getMaterialSelectorLabel(omya!, "ar", "marketOnly")).toBe("أوميا");
  });

  it("shows English scientific names in english-only mode", () => {
    expect(getMaterialDisplayName(sabic!, "en", "englishOnly")).toBe(
      "SABIC Polyethylene Grade"
    );
    expect(getMaterialSelectorLabel(omya!, "en", "englishOnly")).toBe(
      "Calcium Carbonate / CaCO3 Filler"
    );
  });

  it("shows both names together in both mode without blank lines", () => {
    const lines = getMaterialDisplayLines(sabic!, "ar", "both");

    expect(lines).toEqual(["سابك", "SABIC Polyethylene Grade"]);
    expect(lines.every((line) => line.trim().length > 0)).toBe(true);
  });

  it("keeps the demo calculation values unchanged", () => {
    const result = calculateSetup(demoState, demoState.calculator);

    expect(formatMoney(result.recipeA.costPerKg, demoState.currency, "en")).toBe("90.49 EGP");
    expect(formatMoney(result.recipeB.costPerKg, demoState.currency, "en")).toBe("31.38 EGP");
    expect(formatMoney(result.costPerSaleableKg, demoState.currency, "en")).toBe("42.56 EGP");
  });
});
