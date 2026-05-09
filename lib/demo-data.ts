import { getDemoData } from "@/lib/demoData";
import type { AppState, CalculatorInput, RawMaterialCategory, RawMaterialType } from "@/types/domain";
import type { Material } from "@/types/film-cost";

const demoData = getDemoData();

const calculator: CalculatorInput = {
  recipeAId: demoData.calculationInput.recipeAId,
  recipeBId: demoData.calculationInput.recipeBId,
  presetId: demoData.calculationInput.presetId ?? demoData.presets[0].id,
  aShare: demoData.calculationInput.drawA,
  bShare: demoData.calculationInput.drawB,
  rollWeight: demoData.calculationInput.rollWeight,
  wastePercent: demoData.calculationInput.wastePercent
};

function materialTypeFor(material: Material): RawMaterialType {
  const name = `${material.marketNameAr} ${material.scientificNameEn}`.toLowerCase();

  if (name.includes("pigment")) {
    return "masterbatch";
  }

  if (name.includes("omya")) {
    return "filler";
  }

  return "virgin";
}

function materialCategoryFor(material: Material): RawMaterialCategory {
  return material.category;
}

export const demoState: AppState = {
  language: "en",
  currency: "EGP",
  materialNameDisplayMode: "both",
  materials: demoData.materials.map((material) => ({
    id: material.id,
    marketNameAr: material.marketNameAr,
    scientificNameEn: material.scientificNameEn,
    name: { en: material.scientificNameEn, ar: material.marketNameAr },
    type: materialTypeFor(material),
    pricePerKg: material.pricePerKg,
    supplier: "Demo",
    usage: material.usage,
    category: materialCategoryFor(material),
    notes: material.notes
  })),
  recipes: demoData.recipes.map((recipe) => ({
    id: recipe.id,
    name: { en: recipe.name, ar: recipe.name },
    extruder: recipe.type,
    lines: recipe.items.map((item) => ({
      materialId: item.materialId,
      percentage: item.percentage
    }))
  })),
  presets: demoData.presets.map((preset) => ({
    id: preset.id,
    name: { en: preset.name, ar: preset.name },
    widthMm: 1000,
    thicknessMicron: 1,
    densityGcm3: 0.92,
    thicknessGauge: preset.thickness ?? "Default",
    drawA: preset.drawA,
    drawB: preset.drawB,
    rollWeight: preset.rollWeight,
    wastePercent: preset.wastePercent,
    notes: preset.notes
  })),
  calculator,
  recentCalculations: [],
  compare: {
    left: calculator,
    right: calculator
  }
};
