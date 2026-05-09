export type MaterialUsage = "A" | "B" | "A+B";

export type MaterialCategory =
  | "PE Resin"
  | "Virgin Resin"
  | "Recycled Material"
  | "Off-grade Resin"
  | "Filler"
  | "Masterbatch"
  | "Additive"
  | "Other";

export interface Material {
  id: string;
  marketNameAr: string;
  scientificNameEn: string;
  pricePerKg: number;
  usage: MaterialUsage;
  category: MaterialCategory;
  notes?: string;
}

export interface RecipeItem {
  materialId: string;
  percentage: number;
}

export type RecipeType = "A" | "B";

export interface Recipe {
  id: string;
  name: string;
  type: RecipeType;
  items: RecipeItem[];
  notes?: string;
}

export interface SizePreset {
  id: string;
  name: string;
  thickness?: string;
  drawA: number;
  drawB: number;
  rollWeight: number;
  wastePercent: number;
  notes?: string;
}

export interface CalculationInput {
  recipeAId: string;
  recipeBId: string;
  presetId?: string;
  drawA: number;
  drawB: number;
  rollWeight: number;
  wastePercent: number;
  sellingPricePerKg?: number;
  orderQuantityKg?: number;
  targetProfitMarginPercent?: number;
}

export interface RecipeCostBreakdownItem {
  materialName: string;
  percentage: number;
  pricePerKg: number;
  contribution: number;
}

export interface RecipeCostResult {
  costPerKg: number;
  totalPercentage: number;
  breakdown: RecipeCostBreakdownItem[];
}

export interface FilmCostResult {
  recipeACost: number;
  recipeBCost: number;
  aRatio: number;
  bRatio: number;
  costBeforeWaste: number;
  costAfterWaste: number;
  sellingPricePerKg?: number;
  profitPerKg?: number;
  totalProfit?: number;
  safePrice?: number;
  warnings: string[];
}
