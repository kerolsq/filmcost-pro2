// Types
export interface Material {
  id: string;
  name: string;
  nameEn: string;
  pricePerKg: number;
}

export interface RecipeLine {
  materialId: string;
  percentage: number; // 0-100
}

export interface Recipe {
  id: string;
  name: string;
  type: 'A' | 'B';
  lines: RecipeLine[];
}

export interface CalculatorState {
  recipeAId: string;
  recipeBId: string;
  massA: number;
  massB: number;
  wastePercent: number;
}

export interface CalculationResult {
  recipeACostPerKg: number;
  recipeBCostPerKg: number;
  blendCostPerKg: number; // before waste
  wasteCostPerKg: number;
  costAfterWastePerKg: number; // the main result
  aRatio: number; // 0-100
  bRatio: number; // 0-100
}

export interface SavedCalculation {
  id: string;
  timestamp: number;
  recipeAName: string;
  recipeBName: string;
  aRatio: number;
  bRatio: number;
  wastePercent: number;
  costAfterWastePerKg: number;
}

// Calculate cost per kg for a recipe given materials
export function calcRecipeCostPerKg(recipe: Recipe, materials: Material[]): number {
  return recipe.lines.reduce((total, line) => {
    const mat = materials.find(m => m.id === line.materialId);
    if (!mat) return total;
    return total + (mat.pricePerKg * line.percentage / 100);
  }, 0);
}

// Main calculation
export function calculate(state: CalculatorState, recipes: Recipe[], materials: Material[]): CalculationResult | null {
  const recipeA = recipes.find(r => r.id === state.recipeAId);
  const recipeB = recipes.find(r => r.id === state.recipeBId);
  if (!recipeA || !recipeB) return null;
  
  const totalMass = state.massA + state.massB;
  if (totalMass <= 0) return null;
  
  const aRatio = (state.massA / totalMass) * 100;
  const bRatio = (state.massB / totalMass) * 100;
  
  const recipeACostPerKg = calcRecipeCostPerKg(recipeA, materials);
  const recipeBCostPerKg = calcRecipeCostPerKg(recipeB, materials);
  
  const blendCostPerKg = (recipeACostPerKg * aRatio / 100) + (recipeBCostPerKg * bRatio / 100);
  
  const wasteFactor = state.wastePercent / 100;
  const wasteCostPerKg = blendCostPerKg * wasteFactor / (1 - wasteFactor);
  const costAfterWastePerKg = blendCostPerKg + wasteCostPerKg;
  
  return { recipeACostPerKg, recipeBCostPerKg, blendCostPerKg, wasteCostPerKg, costAfterWastePerKg, aRatio, bRatio };
}

export function formatNum(value: number): string {
  return value.toFixed(2);
}
