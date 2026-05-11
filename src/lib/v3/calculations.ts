// ============ TYPES ============

export interface Material {
  id: string;
  name: string;
  nameEn: string;
  category: 'HDPE'|'LDPE'|'LLDPE'|'CaCO3'|'Masterbatch'|'Recycle'|'Other';
  pricePerKg: number;
}

export interface RecipeComponent {
  materialId: string;
  percentage: number;
  priceAtRun: number;
}

export interface Recipe {
  id: string;
  name: string;
  type: 'A'|'B';
  components: RecipeComponent[];
}

export interface Machine {
  id: string;
  name: string;
  brand: string;
  model: string;
  type: 'ABA'|'AB'|'Mono';
  screwA_mm: number;
  screwB_mm: number;
  dieWidth_mm: number;
  notes?: string;
}

export interface ProductionRun {
  id: string;
  machineId: string;
  recipeAId: string;
  recipeBId: string;
  date: number;
  productType: string;
  filmWidth_m: number;
  thickness_micron: number;
  aRatio: number;
  bRatio: number;
  goodWeight_kg: number;
  wasteWeight_kg: number;
  productionMinutes: number;
  takeupSpeed_m_min?: number;
  rpmA?: number;
  rpmB?: number;
  mode: 'estimate'|'actual';
  notes?: string;
  approved: boolean;
}

export interface CalibrationResult {
  machineId: string;
  updatedAt: number;
  avgOutputKgHr: number;
  avgWastePercent: number;
  confidenceScore: number;
  runCount: number;
}

export interface CalculationResult {
  layerACostPerKg: number;
  layerBCostPerKg: number;
  weightedRecipeCost: number;
  wastePercent: number;
  finalCostPerKg: number;
  sellingPricePerKg: number;
  actualOutputKgHr: number;
  mode: 'estimate'|'actual';
  confidenceLevel: 'low'|'medium'|'high';
  warnings: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============ CORE FORMULAS ============
// These are the heart of the app. Do not change without approval.

export function calcLayerCost(components: RecipeComponent[], materials: Material[]): number {
  return components.reduce((total, comp) => {
    const mat = materials.find(m => m.id === comp.materialId);
    if (!mat) return total;
    return total + (comp.percentage / 100) * comp.priceAtRun;
  }, 0);
}

export function calcWeightedCost(aRatio: number, bRatio: number, aCost: number, bCost: number): number {
  return (aRatio / 100) * aCost + (bRatio / 100) * bCost;
}

export function calcWastePercent(wasteKg: number, goodKg: number): number {
  const total = goodKg + wasteKg;
  if (total <= 0) return 0;
  return (wasteKg / total) * 100;
}

export function calcFinalCost(weightedCost: number, wastePercent: number): number {
  const wasteFraction = wastePercent / 100;
  if (wasteFraction >= 1) throw new Error('Waste >= 100%');
  return weightedCost / (1 - wasteFraction);
}

export function calcOutputKgHr(goodKg: number, minutes: number): number {
  if (minutes <= 0) return 0;
  return goodKg / (minutes / 60);
}

export function calcSellingPrice(finalCost: number, profitPercent: number): number {
  return finalCost * (1 + profitPercent / 100);
}

// ============ VALIDATION ============

export function validateRun(run: Partial<ProductionRun>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (run.aRatio !== undefined && run.bRatio !== undefined) {
    if (Math.abs((run.aRatio + run.bRatio) - 100) > 0.01) {
      errors.push('نسبة A + نسبة B لازم تساوي 100%');
    }
    if (run.bRatio > 80) {
      warnings.push(`نسبة B ${run.bRatio}% مرتفعة جداً — قد يؤثر على جودة السطح`);
    }
  }

  if (run.wasteWeight_kg !== undefined && run.goodWeight_kg !== undefined) {
    const w = calcWastePercent(run.wasteWeight_kg, run.goodWeight_kg);
    if (w > 25) warnings.push(`الهالك ${w.toFixed(1)}% مرتفع — تأكد من الأرقام`);
    if (w > 50) errors.push('الهالك أكبر من 50% — بيانات غير منطقية');
  }

  if (run.goodWeight_kg !== undefined && run.productionMinutes !== undefined) {
    const out = calcOutputKgHr(run.goodWeight_kg, run.productionMinutes);
    if (out > 500) warnings.push(`إنتاج ${out.toFixed(0)} كجم/س مرتفع جداً — راجع الأرقام`);
    if (out < 5 && out > 0) warnings.push(`إنتاج ${out.toFixed(1)} كجم/س منخفض جداً`);
  }

  if (run.thickness_micron !== undefined) {
    if (run.thickness_micron < 8) warnings.push('السمك أقل من 8 ميكرون — تأكد');
    if (run.thickness_micron > 300) errors.push('السمك أكبر من 300 ميكرون — غير منطقي');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateRecipe(components: RecipeComponent[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const total = components.reduce((s, c) => s + c.percentage, 0);
  if (Math.abs(total - 100) > 0.01) {
    errors.push(`مجموع النسب ${total.toFixed(1)}% — لازم يكون 100%`);
  }
  return { valid: errors.length === 0, errors, warnings };
}

// ============ MAIN CALCULATE ============

export function calculate(
  run: ProductionRun,
  recipeA: Recipe,
  recipeB: Recipe,
  materials: Material[],
  profitPercent = 0,
  calibration?: CalibrationResult
): CalculationResult {
  const warnings: string[] = [];

  const layerACostPerKg = calcLayerCost(recipeA.components, materials);
  const layerBCostPerKg = calcLayerCost(recipeB.components, materials);
  const weightedRecipeCost = calcWeightedCost(run.aRatio, run.bRatio, layerACostPerKg, layerBCostPerKg);
  const wastePercent = calcWastePercent(run.wasteWeight_kg, run.goodWeight_kg);
  const finalCostPerKg = calcFinalCost(weightedRecipeCost, wastePercent);
  const sellingPricePerKg = calcSellingPrice(finalCostPerKg, profitPercent);
  const actualOutputKgHr = calcOutputKgHr(run.goodWeight_kg, run.productionMinutes);

  const validation = validateRun(run);
  warnings.push(...validation.warnings);

  if (calibration && calibration.runCount >= 3) {
    const diffOutput = Math.abs(actualOutputKgHr - calibration.avgOutputKgHr);
    if (diffOutput > calibration.avgOutputKgHr * 0.3) {
      warnings.push(`الإنتاج ${actualOutputKgHr.toFixed(1)} بعيد عن متوسط الماكينة ${calibration.avgOutputKgHr.toFixed(1)} كجم/س`);
    }
    const diffWaste = Math.abs(wastePercent - calibration.avgWastePercent);
    if (diffWaste > 5) {
      warnings.push(`الهالك ${wastePercent.toFixed(1)}% بعيد عن متوسط الماكينة ${calibration.avgWastePercent.toFixed(1)}%`);
    }
  }

  let confidenceLevel: 'low'|'medium'|'high' = 'low';
  if (run.mode === 'actual') {
    if (calibration && calibration.runCount >= 10) confidenceLevel = 'high';
    else if (calibration && calibration.runCount >= 3) confidenceLevel = 'medium';
  }

  return {
    layerACostPerKg, layerBCostPerKg, weightedRecipeCost,
    wastePercent, finalCostPerKg, sellingPricePerKg,
    actualOutputKgHr, mode: run.mode, confidenceLevel, warnings
  };
}

// ============ MACHINE LEARNING ============

export function updateCalibration(machineId: string, approvedRuns: ProductionRun[]): CalibrationResult {
  const runs = approvedRuns.filter(r => r.machineId === machineId && r.approved);
  if (runs.length === 0) {
    return { machineId, updatedAt: Date.now(), avgOutputKgHr: 0, avgWastePercent: 0, confidenceScore: 0, runCount: 0 };
  }
  const outputs = runs.map(r => calcOutputKgHr(r.goodWeight_kg, r.productionMinutes));
  const wastes = runs.map(r => calcWastePercent(r.wasteWeight_kg, r.goodWeight_kg));
  return {
    machineId,
    updatedAt: Date.now(),
    avgOutputKgHr: outputs.reduce((a,b) => a+b, 0) / outputs.length,
    avgWastePercent: wastes.reduce((a,b) => a+b, 0) / wastes.length,
    confidenceScore: Math.min(runs.length / 20, 1),
    runCount: runs.length
  };
}

export function suggestFromHistory(
  machineId: string,
  width_m: number,
  thickness_micron: number,
  approvedRuns: ProductionRun[]
): { suggestedOutput: number; suggestedWaste: number; basedOnRuns: number } | null {
  const similar = approvedRuns.filter(r =>
    r.machineId === machineId && r.approved &&
    Math.abs(r.filmWidth_m - width_m) < 0.10 &&
    Math.abs(r.thickness_micron - thickness_micron) < 5
  );
  if (similar.length < 2) return null;
  const outputs = similar.map(r => calcOutputKgHr(r.goodWeight_kg, r.productionMinutes));
  const wastes = similar.map(r => calcWastePercent(r.wasteWeight_kg, r.goodWeight_kg));
  return {
    suggestedOutput: outputs.reduce((a,b) => a+b,0) / outputs.length,
    suggestedWaste: wastes.reduce((a,b) => a+b,0) / wastes.length,
    basedOnRuns: similar.length
  };
}
