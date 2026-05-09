import type {
  AppState,
  CalculatorInput,
  CalculatorResult,
  FilmPreset,
  FilmYield,
  RawMaterial,
  Recipe as AppRecipe,
  RecipeCost as AppRecipeCost
} from "@/types/domain";
import type {
  CalculationInput,
  FilmCostResult,
  Material,
  Recipe,
  RecipeCostResult,
  SizePreset
} from "@/types/film-cost";
import { getMaterialDisplayName } from "@/lib/materials";

function byId<T extends { id: string }>(items: T[], id: string) {
  return items.find((item) => item.id === id) ?? null;
}

function assertFiniteNumber(value: number, name: string) {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number.`);
  }
}

function assertNonNegative(value: number, name: string) {
  assertFiniteNumber(value, name);
  if (value < 0) {
    throw new RangeError(`${name} cannot be negative.`);
  }
}

function assertPositive(value: number, name: string) {
  assertFiniteNumber(value, name);
  if (value <= 0) {
    throw new RangeError(`${name} must be greater than 0.`);
  }
}

function assertWastePercent(wastePercent: number) {
  assertNonNegative(wastePercent, "wastePercent");
  if (wastePercent >= 100) {
    throw new RangeError("wastePercent must be less than 100.");
  }
}

function assertMaterialsAreValid(materials: Material[]) {
  materials.forEach((material) => {
    assertNonNegative(material.pricePerKg, `material ${material.id} pricePerKg`);
  });
}

function assertRecipeItemsAreValid(recipe: Recipe) {
  recipe.items.forEach((item) => {
    assertNonNegative(item.percentage, `recipe ${recipe.id} material ${item.materialId} percentage`);
  });
}

export function calculateRecipeCost(
  recipe: Recipe,
  materials: Material[]
): RecipeCostResult {
  assertMaterialsAreValid(materials);
  assertRecipeItemsAreValid(recipe);

  const breakdown = recipe.items.map((item) => {
    const material = byId(materials, item.materialId);
    const pricePerKg = material?.pricePerKg ?? 0;
    const contribution = (pricePerKg * item.percentage) / 100;

    return {
      materialName: material
        ? getMaterialDisplayName(material, "en", "englishOnly")
        : item.materialId,
      percentage: item.percentage,
      pricePerKg,
      contribution
    };
  });

  return {
    costPerKg: breakdown.reduce((sum, item) => sum + item.contribution, 0),
    totalPercentage: recipe.items.reduce((sum, item) => sum + item.percentage, 0),
    breakdown
  };
}

export function calculateRatios(drawA: number, drawB: number) {
  assertPositive(drawA, "drawA");
  assertPositive(drawB, "drawB");

  const totalDraw = drawA + drawB;

  return {
    aRatio: drawA / totalDraw,
    bRatio: drawB / totalDraw
  };
}

export function calculateFilmCost(
  recipeACost: number,
  recipeBCost: number,
  aRatio: number,
  bRatio: number
) {
  assertNonNegative(recipeACost, "recipeACost");
  assertNonNegative(recipeBCost, "recipeBCost");
  assertNonNegative(aRatio, "aRatio");
  assertNonNegative(bRatio, "bRatio");

  return recipeACost * aRatio + recipeBCost * bRatio;
}

export function applyWaste(costBeforeWaste: number, wastePercent: number) {
  assertNonNegative(costBeforeWaste, "costBeforeWaste");
  assertWastePercent(wastePercent);

  return costBeforeWaste / (1 - wastePercent / 100);
}

export function calculateProfit(
  sellingPricePerKg: number,
  costAfterWaste: number,
  orderQuantityKg: number
) {
  assertNonNegative(sellingPricePerKg, "sellingPricePerKg");
  assertNonNegative(costAfterWaste, "costAfterWaste");
  assertNonNegative(orderQuantityKg, "orderQuantityKg");

  const profitPerKg = sellingPricePerKg - costAfterWaste;

  return {
    profitPerKg,
    totalProfit: profitPerKg * orderQuantityKg
  };
}

export function calculateSafePrice(costAfterWaste: number, targetProfitMarginPercent: number) {
  assertNonNegative(costAfterWaste, "costAfterWaste");
  assertNonNegative(targetProfitMarginPercent, "targetProfitMarginPercent");

  return costAfterWaste * (1 + targetProfitMarginPercent / 100);
}

function warnForMissingMaterials(recipe: Recipe, materials: Material[], warnings: string[]) {
  const materialIds = new Set(materials.map((material) => material.id));

  recipe.items.forEach((item) => {
    if (!materialIds.has(item.materialId)) {
      warnings.push(`Missing material "${item.materialId}" in recipe "${recipe.name}".`);
    }
  });
}

function calculateRecipeCostForFull(
  recipe: Recipe | null,
  materials: Material[],
  expectedType: "A" | "B",
  warnings: string[]
) {
  if (!recipe) {
    warnings.push(`Missing recipe ${expectedType}.`);
    return {
      costPerKg: 0,
      totalPercentage: 0,
      breakdown: []
    } satisfies RecipeCostResult;
  }

  if (recipe.type !== expectedType) {
    warnings.push(`Recipe "${recipe.name}" is type ${recipe.type}, expected ${expectedType}.`);
  }

  warnForMissingMaterials(recipe, materials, warnings);
  const result = calculateRecipeCost(recipe, materials);

  if (Math.abs(result.totalPercentage - 100) > 0.000001) {
    warnings.push(
      `Recipe "${recipe.name}" total percentage is ${result.totalPercentage}%, expected 100%.`
    );
  }

  return result;
}

export function calculateFullFilmCost(
  input: CalculationInput,
  materials: Material[],
  recipes: Recipe[],
  presets: SizePreset[] = []
): FilmCostResult {
  const warnings: string[] = [];
  assertMaterialsAreValid(materials);
  assertPositive(input.drawA, "drawA");
  assertPositive(input.drawB, "drawB");
  assertNonNegative(input.rollWeight, "rollWeight");
  assertWastePercent(input.wastePercent);

  if (input.presetId && !byId(presets, input.presetId)) {
    warnings.push(`Missing preset "${input.presetId}".`);
  }

  if (Math.abs(input.drawA + input.drawB - input.rollWeight) > 0.000001) {
    warnings.push(
      `A draw + B draw (${input.drawA + input.drawB}) differs from roll weight (${input.rollWeight}).`
    );
  }

  const recipeA = byId(recipes, input.recipeAId);
  const recipeB = byId(recipes, input.recipeBId);
  const recipeAResult = calculateRecipeCostForFull(recipeA, materials, "A", warnings);
  const recipeBResult = calculateRecipeCostForFull(recipeB, materials, "B", warnings);
  const { aRatio, bRatio } = calculateRatios(input.drawA, input.drawB);
  const costBeforeWaste = calculateFilmCost(
    recipeAResult.costPerKg,
    recipeBResult.costPerKg,
    aRatio,
    bRatio
  );
  const costAfterWaste = applyWaste(costBeforeWaste, input.wastePercent);
  const profit: ReturnType<typeof calculateProfit> | undefined =
    input.sellingPricePerKg !== undefined && input.orderQuantityKg !== undefined
      ? calculateProfit(input.sellingPricePerKg, costAfterWaste, input.orderQuantityKg)
      : undefined;
  const safePrice =
    input.targetProfitMarginPercent !== undefined
      ? calculateSafePrice(costAfterWaste, input.targetProfitMarginPercent)
      : undefined;

  return {
    recipeACost: recipeAResult.costPerKg,
    recipeBCost: recipeBResult.costPerKg,
    aRatio,
    bRatio,
    costBeforeWaste,
    costAfterWaste,
    sellingPricePerKg: input.sellingPricePerKg,
    profitPerKg: profit?.profitPerKg,
    totalProfit: profit?.totalProfit,
    safePrice,
    warnings
  };
}

export function calculateAppRecipeCost(
  recipe: AppRecipe | null,
  materials: RawMaterial[]
): AppRecipeCost {
  if (!recipe) {
    return {
      recipe: null,
      costPerKg: 0,
      percentageTotal: 0,
      lines: []
    };
  }

  const lines = recipe.lines
    .map((line) => {
      const material = byId(materials, line.materialId);
      if (!material) {
        return null;
      }

      return {
        material,
        percentage: line.percentage,
        costPerKg: (material.pricePerKg * line.percentage) / 100
      };
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line));

  return {
    recipe,
    costPerKg: lines.reduce((sum, line) => sum + line.costPerKg, 0),
    percentageTotal: recipe.lines.reduce((sum, line) => sum + line.percentage, 0),
    lines
  };
}

export function calculateYield(preset: FilmPreset | null): FilmYield | null {
  if (!preset || preset.widthMm <= 0 || preset.thicknessMicron <= 0 || preset.densityGcm3 <= 0) {
    return null;
  }

  const massPerSquareMeter =
    (preset.thicknessMicron / 1_000_000) * (preset.densityGcm3 * 1000);
  const squareMetersPerKg = 1 / massPerSquareMeter;
  const linearMetersPerKg = squareMetersPerKg / (preset.widthMm / 1000);

  return {
    massPerSquareMeter,
    squareMetersPerKg,
    linearMetersPerKg
  };
}

export function calculateSetup(state: AppState, input: CalculatorInput): CalculatorResult {
  const recipeA = calculateAppRecipeCost(byId(state.recipes, input.recipeAId), state.materials);
  const recipeB = calculateAppRecipeCost(byId(state.recipes, input.recipeBId), state.materials);
  const preset = byId(state.presets, input.presetId);
  const drawTotal = Math.max(input.aShare + input.bShare, 0);
  const wasteFraction = Math.min(Math.max(input.wastePercent, 0), 99.9) / 100;
  const blendCostPerKg =
    drawTotal > 0
      ? (recipeA.costPerKg * input.aShare + recipeB.costPerKg * input.bShare) / drawTotal
      : 0;
  const costPerSaleableKg = blendCostPerKg / (1 - wasteFraction);

  return {
    recipeA,
    recipeB,
    preset,
    drawTotal,
    blendCostPerKg,
    costPerSaleableKg,
    wasteCostPerKg: costPerSaleableKg - blendCostPerKg,
    rawKgForOneKg: 1 / (1 - wasteFraction),
    yield: calculateYield(preset)
  };
}

export function getSetupWarnings(state: AppState, input: CalculatorInput) {
  const result = calculateSetup(state, input);

  return [
    input.aShare <= 0 || input.bShare <= 0 ? "A draw and B draw must be greater than 0." : "",
    input.wastePercent < 0 || input.wastePercent >= 100
      ? "Waste must be 0% or more and less than 100%."
      : "",
    Math.abs(input.aShare + input.bShare - input.rollWeight) > 0.000001
      ? "A draw + B draw differs from roll weight."
      : "",
    Math.abs(result.recipeA.percentageTotal - 100) >= 0.01
      ? "Recipe A total should be 100%."
      : "",
    Math.abs(result.recipeB.percentageTotal - 100) >= 0.01
      ? "Recipe B total should be 100%."
      : ""
  ].filter(Boolean);
}

export function formatNumber(value: number, language: "en" | "ar", maximumFractionDigits = 2) {
  return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US", {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatMoney(value: number, currency: string, language: "en" | "ar") {
  return `${formatNumber(value, language, 2)} ${currency}`;
}
