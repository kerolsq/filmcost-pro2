import { Material, Recipe, SavedCalculation } from "./calculations";

const SEED_MATERIALS: Material[] = [
  { id: "m1", name: "كربون بلاك", nameEn: "Carbon Black", pricePerKg: 28 },
  { id: "m2", name: "LDPE", nameEn: "LDPE", pricePerKg: 42 },
  { id: "m3", name: "LLDPE", nameEn: "LLDPE", pricePerKg: 38 },
  { id: "m4", name: "أوميا", nameEn: "Omya CaCO3", pricePerKg: 8 },
  { id: "m5", name: "ماستر باتش", nameEn: "Masterbatch", pricePerKg: 55 },
  { id: "m6", name: "مثبت UV", nameEn: "UV Stabilizer", pricePerKg: 120 }
];

const SEED_RECIPES: Recipe[] = [
  { id: "ra1", name: "خلطة سوداء", type: "A", lines: [
    { materialId: "m2", percentage: 60 },
    { materialId: "m3", percentage: 25 },
    { materialId: "m1", percentage: 10 },
    { materialId: "m5", percentage: 5 }
  ]},
  { id: "ra2", name: "خلطة شفافة", type: "A", lines: [
    { materialId: "m2", percentage: 70 },
    { materialId: "m3", percentage: 30 }
  ]},
  { id: "rb1", name: "خلطة أوميا", type: "B", lines: [
    { materialId: "m4", percentage: 80 },
    { materialId: "m2", percentage: 20 }
  ]},
  { id: "rb2", name: "خلطة UV", type: "B", lines: [
    { materialId: "m2", percentage: 75 },
    { materialId: "m6", percentage: 25 }
  ]}
];

export function initStorage() {
  if (!localStorage.getItem("filmcost_materials")) {
    localStorage.setItem("filmcost_materials", JSON.stringify(SEED_MATERIALS));
  }
  if (!localStorage.getItem("filmcost_recipes")) {
    localStorage.setItem("filmcost_recipes", JSON.stringify(SEED_RECIPES));
  }
  if (!localStorage.getItem("filmcost_history")) {
    localStorage.setItem("filmcost_history", JSON.stringify([]));
  }
}

export function getMaterials(): Material[] {
  const data = localStorage.getItem("filmcost_materials");
  return data ? JSON.parse(data) : [];
}

export function saveMaterials(materials: Material[]) {
  localStorage.setItem("filmcost_materials", JSON.stringify(materials));
}

export function getRecipes(): Recipe[] {
  const data = localStorage.getItem("filmcost_recipes");
  return data ? JSON.parse(data) : [];
}

export function saveRecipes(recipes: Recipe[]) {
  localStorage.setItem("filmcost_recipes", JSON.stringify(recipes));
}

export function getHistory(): SavedCalculation[] {
  const data = localStorage.getItem("filmcost_history");
  return data ? JSON.parse(data) : [];
}

export function saveToHistory(calculation: SavedCalculation) {
  const history = getHistory();
  history.unshift(calculation);
  if (history.length > 50) {
    history.pop();
  }
  localStorage.setItem("filmcost_history", JSON.stringify(history));
}
