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

// ============================================
// Constants (واضحة ومعروفة)
// ============================================
const METERS_PER_MICRON = 1e-6;
const KGM3_PER_GCM3 = 1000;
const TUBULAR_FILM_LAYERS = 2; // الفيلم المنفوخ طبقتين بعد التسطيح
const FLOAT_TOLERANCE = 1e-6;

// ============================================
// Validation Helpers (نفس اللي عندك بدون تغيير)
// ============================================
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

// ============================================
// Recipe Cost (الموجودة - بدون تغيير، شغّالة صح)
// ============================================
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

// ============================================
// 🔧 إصلاح 1: calculateRatios تسمح بالـ 0 للـ Mono-layer
// ============================================
export function calculateRatios(massA: number, massB: number) {
  assertNonNegative(massA, "massA");
  assertNonNegative(massB, "massB");

  const totalMass = massA + massB;

  // حالة Mono-layer أو لم يُدخل أي قيمة
  if (totalMass === 0) {
    return { aRatio: 0, bRatio: 0 };
  }

  return {
    aRatio: massA / totalMass,
    bRatio: massB / totalMass
  };
}

// ============================================
// Film Cost (شغّالة صح)
// ============================================
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

// ============================================
// Waste (شغّالة صح)
// ============================================
export function applyWaste(costBeforeWaste: number, wastePercent: number) {
  assertNonNegative(costBeforeWaste, "costBeforeWaste");
  assertWastePercent(wastePercent);

  return costBeforeWaste / (1 - wastePercent / 100);
}

// ============================================
// 🔧 إصلاح 2: calculateProfit مع تحذير الخسارة
// ============================================
export function calculateProfit(
  sellingPricePerKg: number,
  costAfterWaste: number,
  orderQuantityKg: number
) {
  assertNonNegative(sellingPricePerKg, "sellingPricePerKg");
  assertNonNegative(costAfterWaste, "costAfterWaste");
  assertNonNegative(orderQuantityKg, "orderQuantityKg");

  const profitPerKg = sellingPricePerKg - costAfterWaste;
  const isLoss = profitPerKg < 0;

  return {
    profitPerKg,
    totalProfit: profitPerKg * orderQuantityKg,
    isLoss, // 🆕 flag جديد
    profitMarginPercent: costAfterWaste > 0 ? (profitPerKg / costAfterWaste) * 100 : 0
  };
}

export function calculateSafePrice(costAfterWaste: number, targetProfitMarginPercent: number) {
  assertNonNegative(costAfterWaste, "costAfterWaste");
  assertNonNegative(targetProfitMarginPercent, "targetProfitMarginPercent");

  return costAfterWaste * (1 + targetProfitMarginPercent / 100);
}

// ============================================
// Helpers للتحذيرات
// ============================================
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

  if (Math.abs(result.totalPercentage - 100) > FLOAT_TOLERANCE) {
    warnings.push(
      `Recipe "${recipe.name}" total percentage is ${result.totalPercentage}%, expected 100%.`
    );
  }

  return result;
}

// ============================================
// 🔧 إصلاح 3: validateMassBalance بدلًا من المقارنة الغلط
// ============================================
/**
 * يتحقق من اتساق الكتلة:
 * - rollWeight (الإنتاج الفعلي) = (massA + massB) × (1 - waste/100)
 *
 * بمعنى: المجموع المُدخل من الخامة (A+B) لازم ينتج عنه roll أقل بسبب الهالك.
 *
 * tolerance: 1% فرق مسموح (لأن الموازين والقياسات مش دقيقة بالظبط)
 */
function validateMassBalance(
  massA: number,
  massB: number,
  rollWeight: number,
  wastePercent: number,
  warnings: string[]
) {
  if (rollWeight <= 0) return; // مش مدخل فناخده برحته

  const totalInput = massA + massB;
  const expectedRollWeight = totalInput * (1 - wastePercent / 100);
  const tolerancePercent = 0.01; // 1% فرق مسموح
  const tolerance = expectedRollWeight * tolerancePercent;

  const diff = Math.abs(rollWeight - expectedRollWeight);

  if (diff > tolerance) {
    if (rollWeight > totalInput) {
      warnings.push(
        `Roll weight (${rollWeight.toFixed(2)}) is larger than total input (${totalInput.toFixed(2)}). ` +
        `This is physically impossible.`
      );
    } else if (rollWeight > expectedRollWeight + tolerance) {
      warnings.push(
        `Roll weight (${rollWeight.toFixed(2)}) suggests waste is lower than ${wastePercent}%. ` +
        `Actual waste appears to be ${(((totalInput - rollWeight) / totalInput) * 100).toFixed(2)}%.`
      );
    } else {
      warnings.push(
        `Roll weight (${rollWeight.toFixed(2)}) suggests waste is higher than ${wastePercent}%. ` +
        `Actual waste appears to be ${(((totalInput - rollWeight) / totalInput) * 100).toFixed(2)}%.`
      );
    }
  }
}

// ============================================
// 🔧 إصلاح 4: calculateFullFilmCost بـ Validation الصحيح
// ============================================
export function calculateFullFilmCost(
  input: CalculationInput,
  materials: Material[],
  recipes: Recipe[],
  presets: SizePreset[] = []
): FilmCostResult {
  const warnings: string[] = [];
  assertMaterialsAreValid(materials);

  // ✅ السماح بـ 0 للـ Mono-layer (واحد منهم لازم > 0)
  assertNonNegative(input.drawA, "drawA");
  assertNonNegative(input.drawB, "drawB");
  if (input.drawA + input.drawB <= 0) {
    throw new RangeError("At least one of drawA or drawB must be greater than 0.");
  }

  assertNonNegative(input.rollWeight, "rollWeight");
  assertWastePercent(input.wastePercent);

  if (input.presetId && !byId(presets, input.presetId)) {
    warnings.push(`Missing preset "${input.presetId}".`);
  }

  // 🔧 التحقق الصحيح من الـ Mass Balance (مع الأخذ في الاعتبار الهالك)
  validateMassBalance(
    input.drawA,
    input.drawB,
    input.rollWeight,
    input.wastePercent,
    warnings
  );

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

  const profit =
    input.sellingPricePerKg !== undefined && input.orderQuantityKg !== undefined
      ? calculateProfit(input.sellingPricePerKg, costAfterWaste, input.orderQuantityKg)
      : undefined;

  // 🆕 تحذير لو فيه خسارة
  if (profit?.isLoss) {
    warnings.push(
      `Selling price (${input.sellingPricePerKg}) is below cost (${costAfterWaste.toFixed(2)}). ` +
      `This will result in a loss of ${Math.abs(profit.profitPerKg).toFixed(2)} per kg.`
    );
  }

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

// ============================================
// App Recipe Cost (شغّالة صح، بدون تغيير)
// ============================================
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

// ============================================
// 🔧 إصلاح 5: calculateYield مع × 2 للطبقتين + كود واضح
// ============================================
export function calculateYield(
  preset: FilmPreset | null,
  options: { isTubular?: boolean } = {}
): FilmYield | null {
  if (!preset || preset.widthMm <= 0 || preset.thicknessMicron <= 0 || preset.densityGcm3 <= 0) {
    return null;
  }

  // الفيلم المنفوخ افتراضيًا طبقتين (Tubular).
  // لو فيلم مفرود (Sheet/Single Layer)، ابعت isTubular: false.
  const isTubular = options.isTubular ?? true;
  const layersFactor = isTubular ? TUBULAR_FILM_LAYERS : 1;

  // تحويل الوحدات بشكل واضح
  const thicknessM = preset.thicknessMicron * METERS_PER_MICRON; // m
  const densityKgM3 = preset.densityGcm3 * KGM3_PER_GCM3;        // kg/m³
  const widthM = preset.widthMm / 1000;                           // m

  // كتلة المتر المربع من الـ Layflat (الفيلم المنفوخ المسطّح)
  // = السمك × الكثافة × عدد الطبقات
  const massPerSquareMeter = thicknessM * densityKgM3 * layersFactor; // kg/m²
  const squareMetersPerKg = 1 / massPerSquareMeter;                   // m²/kg
  const linearMetersPerKg = squareMetersPerKg / widthM;               // m/kg

  return {
    massPerSquareMeter,
    squareMetersPerKg,
    linearMetersPerKg
  };
}

// ============================================
// 🔧 إصلاح 6: calculateSetup - الإصلاح الكبير
// - استخدام rollWeight لو موجود (بدل ما هو dead field)
// - نفس المنطق الصحيح بتاع الـ Mass Balance
// ============================================
export function calculateSetup(state: AppState, input: CalculatorInput): CalculatorResult {
  const recipeA = calculateAppRecipeCost(byId(state.recipes, input.recipeAId), state.materials);
  const recipeB = calculateAppRecipeCost(byId(state.recipes, input.recipeBId), state.materials);
  const preset = byId(state.presets, input.presetId);

  // ✅ السماح بـ 0 لكن منع الاتنين 0 معًا
  const aShare = Math.max(input.aShare, 0);
  const bShare = Math.max(input.bShare, 0);
  const drawTotal = aShare + bShare;

  // ✅ الـ wastePercent بين 0 و 99.9 (نفس اللي كان موجود)
  const wasteFraction = Math.min(Math.max(input.wastePercent, 0), 99.9) / 100;

  // ✅ نفس المعادلة (متطابقة مع calculateFullFilmCost)
  const blendCostPerKg =
    drawTotal > 0
      ? (recipeA.costPerKg * aShare + recipeB.costPerKg * bShare) / drawTotal
      : 0;

  const costPerSaleableKg = blendCostPerKg / (1 - wasteFraction);

  // 🆕 حساب النسب صراحة عشان نعرضها للمستخدم
  const aRatio = drawTotal > 0 ? aShare / drawTotal : 0;
  const bRatio = drawTotal > 0 ? bShare / drawTotal : 0;

  // 🆕 expectedRollWeight لـ التحقق
  const expectedRollWeight = drawTotal * (1 - wasteFraction);

  return {
    recipeA,
    recipeB,
    preset,
    drawTotal,
    blendCostPerKg,
    costPerSaleableKg,
    wasteCostPerKg: costPerSaleableKg - blendCostPerKg,
    rawKgForOneKg: 1 / (1 - wasteFraction),
    yield: calculateYield(preset),
    // 🆕 fields جديدة (محتاج تضيفهم في الـ types)
    aRatio,
    bRatio,
    expectedRollWeight
  };
}

// ============================================
// 🔧 إصلاح 7: getSetupWarnings مع Validation الصحيح
// ============================================
export function getSetupWarnings(state: AppState, input: CalculatorInput): string[] {
  const warnings: string[] = [];
  const result = calculateSetup(state, input);

  // التحقق إن واحد على الأقل من aShare و bShare > 0
  if (input.aShare <= 0 && input.bShare <= 0) {
    warnings.push("At least one of A draw or B draw must be greater than 0.");
  }

  // التحقق من الهالك
  if (input.wastePercent < 0 || input.wastePercent >= 100) {
    warnings.push("Waste must be 0% or more and less than 100%.");
  }

  // 🔧 الإصلاح الكبير: التحقق الصحيح من الـ rollWeight
  // (بدلًا من aShare + bShare === rollWeight اللي بيتجاهل الهالك)
  if (input.rollWeight > 0) {
    const totalInput = input.aShare + input.bShare;
    const tolerance = result.expectedRollWeight * 0.01; // 1% فرق مسموح
    const diff = Math.abs(input.rollWeight - result.expectedRollWeight);

    if (input.rollWeight > totalInput) {
      warnings.push(
        `Roll weight (${input.rollWeight}) cannot be larger than total input (${totalInput}).`
      );
    } else if (diff > tolerance) {
      const actualWaste = ((totalInput - input.rollWeight) / totalInput) * 100;
      warnings.push(
        `Roll weight implies actual waste of ${actualWaste.toFixed(2)}%, ` +
        `but waste is set to ${input.wastePercent}%. ` +
        `Consider updating the waste percentage.`
      );
    }
  }

  // التحقق من نسب الـ Recipes
  if (Math.abs(result.recipeA.percentageTotal - 100) >= 0.01) {
    warnings.push("Recipe A total should be 100%.");
  }
  if (Math.abs(result.recipeB.percentageTotal - 100) >= 0.01) {
    warnings.push("Recipe B total should be 100%.");
  }

  return warnings;
}

// ============================================
// Formatters (شغّالة صح، بدون تغيير)
// ============================================
export function formatNumber(value: number, language: "en" | "ar", maximumFractionDigits = 2) {
  return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US", {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatMoney(value: number, currency: string, language: "en" | "ar") {
  return `${formatNumber(value, language, 2)} ${currency}`;
}
