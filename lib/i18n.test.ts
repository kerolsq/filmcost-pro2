import { describe, expect, it } from "vitest";
import { directionFor, translate, type TranslationKey } from "@/lib/i18n";

const requiredLabels: Array<[TranslationKey, string, string]> = [
  ["rawMaterials", "Materials & Prices", "الخامات والأسعار"],
  ["recipeA", "Extruder A Recipe", "خلطة دوس A"],
  ["recipeB", "Extruder B Recipe", "خلطة دوس B"],
  ["presets", "Size & Thickness", "المقاس والسمك"],
  ["aDraw", "A Draw", "سحب A"],
  ["bDraw", "B Draw", "سحب B"],
  ["rollWeight", "Roll Weight", "وزن البكرة"],
  ["waste", "Waste", "الهالك"],
  ["costBeforeWaste", "Film Cost Before Waste", "تكلفة كيلو الفيلم قبل الهالك"],
  ["costAfterWaste", "Film Cost After Waste", "تكلفة كيلو الفيلم بعد الهالك"],
  ["profitPerKg", "Profit per kg", "ربح الكيلو"],
  ["orderProfit", "Order Profit", "ربح الأوردر"],
  ["compare", "Compare Setups", "مقارنة الخلطات"],
  ["save", "Save", "حفظ"],
  ["export", "Export", "تصدير"],
  ["import", "Import", "استيراد"],
  ["reset", "Reset", "إعادة ضبط"]
];

describe("i18n dictionary", () => {
  it("contains the required English and Arabic labels", () => {
    requiredLabels.forEach(([key, english, arabic]) => {
      expect(translate("en", key)).toBe(english);
      expect(translate("ar", key)).toBe(arabic);
    });
  });

  it("returns the correct writing direction for each language", () => {
    expect(directionFor("en")).toBe("ltr");
    expect(directionFor("ar")).toBe("rtl");
  });
});
