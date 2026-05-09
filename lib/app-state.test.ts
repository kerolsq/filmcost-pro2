import { describe, expect, it } from "vitest";
import { mergeAppState } from "@/lib/app-state";
import {
  getMaterialDisplayLines,
  getMaterialDisplayName,
  getMaterialSelectorLabel
} from "@/lib/materials";
import type { AppState, RawMaterial } from "@/types/domain";

describe("app state migration", () => {
  it("keeps old saved material names usable after the raw material model update", () => {
    const migrated = mergeAppState({
      materials: [
        {
          id: "legacy-sabic",
          name: { en: "Sabic", ar: "سابك" },
          pricePerKg: 102,
          usage: "A+B",
          type: "virgin"
        } as RawMaterial,
        {
          id: "legacy-omya",
          name: "أوميا",
          pricePerKg: 23,
          usage: "B",
          type: "filler"
        } as unknown as RawMaterial
      ],
      recipes: [
        {
          id: "legacy-recipe-a",
          name: { en: "Legacy A", ar: "خلطة A قديمة" },
          extruder: "A",
          lines: [
            { materialId: "Sabic", percentage: 90 },
            { materialId: "أوميا", percentage: 10 }
          ]
        }
      ]
    } satisfies Partial<AppState>);

    expect(migrated.materials[0]).toMatchObject({
      id: "legacy-sabic",
      marketNameAr: "سابك",
      scientificNameEn: "Sabic",
      category: "Virgin Resin",
      pricePerKg: 102
    });
    expect(migrated.recipes[0].lines[0].materialId).toBe("legacy-sabic");
    expect(migrated.materials[1]).toMatchObject({
      id: "legacy-omya",
      marketNameAr: "أوميا",
      scientificNameEn: "أوميا",
      category: "Filler",
      pricePerKg: 23
    });
    expect(migrated.recipes[0].lines[1].materialId).toBe("legacy-omya");
  });
});

describe("material display names", () => {
  const material: RawMaterial = {
    id: "sabic",
    marketNameAr: "سابك",
    scientificNameEn: "SABIC Polyethylene Grade",
    pricePerKg: 102,
    usage: "A+B",
    category: "PE Resin"
  };

  it("returns the selected display mode without changing material identity", () => {
    expect(getMaterialDisplayLines(material, "ar", "marketOnly")).toEqual(["سابك"]);
    expect(getMaterialDisplayLines(material, "en", "englishOnly")).toEqual([
      "SABIC Polyethylene Grade"
    ]);
    expect(getMaterialDisplayLines(material, "ar", "both")).toEqual([
      "سابك",
      "SABIC Polyethylene Grade"
    ]);
  });

  it("uses the same helper for compact material dropdown labels", () => {
    expect(getMaterialSelectorLabel(material, "ar", "both")).toBe(
      "سابك - SABIC Polyethylene Grade"
    );
  });

  it("falls back gracefully when one display field is missing", () => {
    expect(
      getMaterialDisplayName(
        {
          id: "legacy",
          marketNameAr: "",
          scientificNameEn: "Legacy Resin"
        },
        "ar",
        "marketOnly"
      )
    ).toBe("Legacy Resin");
  });
});
