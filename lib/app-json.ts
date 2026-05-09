import { mergeAppState } from "@/lib/app-state";
import type { AppState, MaterialNameDisplayMode } from "@/types/domain";

const EXPORT_VERSION = 1;

type ImportedRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ImportedRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function requireArray(value: unknown, name: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array.`);
  }
}

function requireString(value: unknown, name: string) {
  if (!isString(value) || value.trim() === "") {
    throw new Error(`${name} is required.`);
  }
}

function requireNumber(value: unknown, name: string) {
  if (!isNumber(value)) {
    throw new Error(`${name} must be a number.`);
  }
}

function validateMaterials(materials: unknown) {
  requireArray(materials, "materials");
  materials.forEach((material, index) => {
    if (!isRecord(material)) {
      throw new Error(`materials[${index}] must be an object.`);
    }

    requireString(material.id, `materials[${index}].id`);
    requireNumber(material.pricePerKg, `materials[${index}].pricePerKg`);
  });
}

function validateRecipes(recipes: unknown) {
  requireArray(recipes, "recipes");
  recipes.forEach((recipe, index) => {
    if (!isRecord(recipe)) {
      throw new Error(`recipes[${index}] must be an object.`);
    }

    requireString(recipe.id, `recipes[${index}].id`);
    requireArray(recipe.lines, `recipes[${index}].lines`);
  });
}

function validatePresets(presets: unknown) {
  requireArray(presets, "presets");
  presets.forEach((preset, index) => {
    if (!isRecord(preset)) {
      throw new Error(`presets[${index}] must be an object.`);
    }

    requireString(preset.id, `presets[${index}].id`);
    requireNumber(preset.drawA, `presets[${index}].drawA`);
    requireNumber(preset.drawB, `presets[${index}].drawB`);
    requireNumber(preset.rollWeight, `presets[${index}].rollWeight`);
    requireNumber(preset.wastePercent, `presets[${index}].wastePercent`);
  });
}

function validateCalculator(value: unknown, name: string) {
  if (!isRecord(value)) {
    throw new Error(`${name} must be an object.`);
  }

  requireString(value.recipeAId, `${name}.recipeAId`);
  requireString(value.recipeBId, `${name}.recipeBId`);
  requireNumber(value.aShare, `${name}.aShare`);
  requireNumber(value.bShare, `${name}.bShare`);
  requireNumber(value.rollWeight, `${name}.rollWeight`);
  requireNumber(value.wastePercent, `${name}.wastePercent`);
}

function validateRecentCalculations(value: unknown) {
  requireArray(value, "recentCalculations");
  value.forEach((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`recentCalculations[${index}] must be an object.`);
    }

    requireString(item.id, `recentCalculations[${index}].id`);
    requireString(item.createdAt, `recentCalculations[${index}].createdAt`);
    requireNumber(item.costAfterWaste, `recentCalculations[${index}].costAfterWaste`);
    validateCalculator(item.input, `recentCalculations[${index}].input`);
  });
}

function isDisplayMode(value: unknown): value is MaterialNameDisplayMode {
  return value === "marketOnly" || value === "englishOnly" || value === "both";
}

function extractState(parsed: unknown): Partial<AppState> {
  if (!isRecord(parsed)) {
    throw new Error("Imported JSON must contain an object.");
  }

  const settings = isRecord(parsed.settings) ? parsed.settings : {};
  const data = isRecord(parsed.data) ? parsed.data : parsed;
  const importedState: Partial<AppState> = {
    ...data,
    language: parsed.language === "ar" || parsed.language === "en" ? parsed.language : undefined,
    currency: isString(parsed.currency) ? parsed.currency : undefined,
    materialNameDisplayMode: isDisplayMode(parsed.materialNameDisplayMode)
      ? parsed.materialNameDisplayMode
      : undefined
  };

  if (settings.language === "ar" || settings.language === "en") {
    importedState.language = settings.language;
  }

  if (isString(settings.currency)) {
    importedState.currency = settings.currency;
  }

  if (isDisplayMode(settings.materialNameDisplayMode)) {
    importedState.materialNameDisplayMode = settings.materialNameDisplayMode;
  }

  return importedState;
}

export function exportAppStateAsJson(state: AppState) {
  return JSON.stringify(
    {
      appName: "FilmCost Pro",
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      settings: {
        language: state.language,
        currency: state.currency,
        materialNameDisplayMode: state.materialNameDisplayMode
      },
      data: {
        materials: state.materials,
        recipes: state.recipes,
        presets: state.presets,
        calculator: state.calculator,
        compare: state.compare,
        recentCalculations: state.recentCalculations
      }
    },
    null,
    2
  );
}

export function importAppStateFromJson(json: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  const importedState = extractState(parsed);
  validateMaterials(importedState.materials);
  validateRecipes(importedState.recipes);
  validatePresets(importedState.presets);
  validateCalculator(importedState.calculator, "calculator");

  if (!isRecord(importedState.compare)) {
    throw new Error("compare must be an object.");
  }

  validateCalculator(importedState.compare.left, "compare.left");
  validateCalculator(importedState.compare.right, "compare.right");
  validateRecentCalculations(importedState.recentCalculations ?? []);

  return mergeAppState(importedState);
}
