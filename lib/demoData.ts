import type { CalculationInput, Material, Recipe, SizePreset } from "@/types/film-cost";

export interface DemoData {
  materials: Material[];
  recipes: Recipe[];
  presets: SizePreset[];
  calculationInput: CalculationInput;
}

const demoMaterials: Material[] = [
  {
    id: "sabic",
    marketNameAr: "سابك",
    scientificNameEn: "SABIC Polyethylene Grade",
    category: "PE Resin",
    usage: "A+B",
    pricePerKg: 102
  },
  {
    id: "ldpe-low",
    marketNameAr: "لو",
    scientificNameEn: "LDPE - Low Density Polyethylene",
    category: "PE Resin",
    usage: "A+B",
    pricePerKg: 100
  },
  {
    id: "linear-lldpe",
    marketNameAr: "لينير",
    scientificNameEn: "LLDPE - Linear Low Density Polyethylene",
    category: "PE Resin",
    usage: "A",
    pricePerKg: 115
  },
  {
    id: "low-linear-blend",
    marketNameAr: "لو + لينير",
    scientificNameEn: "LDPE + LLDPE Blend",
    category: "PE Resin",
    usage: "A",
    pricePerKg: 115
  },
  {
    id: "makhraz",
    marketNameAr: "مخرز",
    scientificNameEn: "Recycled PE / Reprocessed Polyethylene",
    category: "Recycled Material",
    usage: "A+B",
    pricePerKg: 65
  },
  {
    id: "omya",
    marketNameAr: "أوميا",
    scientificNameEn: "Calcium Carbonate / CaCO3 Filler",
    category: "Filler",
    usage: "B",
    pricePerKg: 23
  },
  {
    id: "sidpec",
    marketNameAr: "اسيدكو",
    scientificNameEn: "SIDPEC HDPE / PE Grade",
    category: "PE Resin",
    usage: "A+B",
    pricePerKg: 102
  },
  {
    id: "black-masterbatch",
    marketNameAr: "صبغة أسود",
    scientificNameEn: "Black Masterbatch / Carbon Black Masterbatch",
    category: "Masterbatch",
    usage: "A+B",
    pricePerKg: 140
  },
  {
    id: "color-masterbatch",
    marketNameAr: "صبغة ألوان",
    scientificNameEn: "Color Masterbatch",
    category: "Masterbatch",
    usage: "A+B",
    pricePerKg: 140
  },
  {
    id: "off-grade-pe",
    marketNameAr: "خامة درجة تانية",
    scientificNameEn: "Off-grade PE / Second Grade Polyethylene Resin",
    category: "Off-grade Resin",
    usage: "A+B",
    pricePerKg: 90
  },
  {
    id: "calcium-carbonate",
    marketNameAr: "كربونات",
    scientificNameEn: "Calcium Carbonate Powder / CaCO3",
    category: "Filler",
    usage: "B",
    pricePerKg: 23
  }
];

const demoRecipes: Recipe[] = [
  {
    id: "recipe-a-black-test",
    name: "A Black Test Recipe",
    type: "A",
    items: [
      { materialId: "sabic", percentage: 48.08 },
      { materialId: "makhraz", percentage: 38.46 },
      { materialId: "low-linear-blend", percentage: 9.62 },
      { materialId: "black-masterbatch", percentage: 3.85 }
    ]
  },
  {
    id: "recipe-b-omya-test",
    name: "B Omya Test Recipe",
    type: "B",
    items: [
      { materialId: "omya", percentage: 87.21 },
      { materialId: "sidpec", percentage: 5.81 },
      { materialId: "makhraz", percentage: 5.81 },
      { materialId: "black-masterbatch", percentage: 1.16 }
    ]
  }
];

const demoPresets: SizePreset[] = [
  {
    id: "preset-test-size",
    name: "Test Size",
    thickness: "Default",
    drawA: 10,
    drawB: 45,
    rollWeight: 55,
    wastePercent: 1
  }
];

const demoCalculationInput: CalculationInput = {
  recipeAId: "recipe-a-black-test",
  recipeBId: "recipe-b-omya-test",
  presetId: "preset-test-size",
  drawA: 10,
  drawB: 45,
  rollWeight: 55,
  wastePercent: 1
};

export function getDemoData(): DemoData {
  return {
    materials: demoMaterials.map((material) => ({ ...material })),
    recipes: demoRecipes.map((recipe) => ({
      ...recipe,
      items: recipe.items.map((item) => ({ ...item }))
    })),
    presets: demoPresets.map((preset) => ({ ...preset })),
    calculationInput: { ...demoCalculationInput }
  };
}
