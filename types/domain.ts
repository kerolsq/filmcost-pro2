export type Language = "en" | "ar";

export type Extruder = "A" | "B";

export type RawMaterialType =
  | "virgin"
  | "recycled"
  | "filler"
  | "masterbatch"
  | "additive";

export type RawMaterialUsage = "A" | "B" | "A+B";

export type RawMaterialCategory =
  | "PE Resin"
  | "Virgin Resin"
  | "Recycled Material"
  | "Off-grade Resin"
  | "Filler"
  | "Masterbatch"
  | "Additive"
  | "Other";

export type MaterialNameDisplayMode = "marketOnly" | "englishOnly" | "both";

export interface LocalizedName {
  en: string;
  ar: string;
}

export interface RawMaterial {
  id: string;
  marketNameAr: string;
  scientificNameEn: string;
  pricePerKg: number;
  usage: RawMaterialUsage;
  category: RawMaterialCategory;
  notes?: string;
  name?: LocalizedName;
  type?: RawMaterialType;
  supplier?: string;
}

export interface RecipeLine {
  materialId: string;
  percentage: number;
}

export interface Recipe {
  id: string;
  name: LocalizedName;
  extruder: Extruder;
  lines: RecipeLine[];
}

export interface FilmPreset {
  id: string;
  name: LocalizedName;
  widthMm: number;
  thicknessMicron: number;
  densityGcm3: number;
  thicknessGauge: string;
  drawA: number;
  drawB: number;
  rollWeight: number;
  wastePercent: number;
  notes?: string;
}

export interface CalculatorInput {
  recipeAId: string;
  recipeBId: string;
  presetId: string;
  aShare: number;
  bShare: number;
  rollWeight: number;
  wastePercent: number;
  sellingPricePerKg?: number;
  orderQuantityKg?: number;
  targetProfitMarginPercent?: number;
}

export interface RecentCalculation {
  id: string;
  createdAt: string;
  input: CalculatorInput;
  costAfterWaste: number;
  recipeAName: LocalizedName;
  recipeBName: LocalizedName;
}

export interface AppState {
  language: Language;
  currency: string;
  materialNameDisplayMode: MaterialNameDisplayMode;
  materials: RawMaterial[];
  recipes: Recipe[];
  presets: FilmPreset[];
  calculator: CalculatorInput;
  recentCalculations: RecentCalculation[];
  compare: {
    left: CalculatorInput;
    right: CalculatorInput;
  };
}

export interface RecipeCostLine {
  material: RawMaterial;
  percentage: number;
  costPerKg: number;
}

export interface RecipeCost {
  recipe: Recipe | null;
  costPerKg: number;
  percentageTotal: number;
  lines: RecipeCostLine[];
}

export interface FilmYield {
  massPerSquareMeter: number;
  squareMetersPerKg: number;
  linearMetersPerKg: number;
}

export interface CalculatorResult {
  recipeA: RecipeCost;
  recipeB: RecipeCost;
  preset: FilmPreset | null;
  drawTotal: number;
  blendCostPerKg: number;
  costPerSaleableKg: number;
  wasteCostPerKg: number;
  rawKgForOneKg: number;
  yield: FilmYield | null;
  // 🆕 الحقول الجديدة
  aRatio: number;
  bRatio: number;
  expectedRollWeight: number;
}
