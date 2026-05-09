import { getDemoData } from "@/lib/demoData";
import type { Language } from "@/types/domain";
import type {
  CalculationInput,
  Material,
  MaterialCategory,
  Recipe,
  SizePreset
} from "@/types/film-cost";

export const APP_DATA_STORAGE_KEY = "filmcost-pro-app-data-v1";

export type JsonSettingValue =
  | string
  | number
  | boolean
  | null
  | JsonSettingValue[]
  | { [key: string]: JsonSettingValue };

export interface AppSettings {
  currency: string;
  [key: string]: JsonSettingValue;
}

export interface AppData {
  materials: Material[];
  recipes: Recipe[];
  presets: SizePreset[];
  calculationInput: CalculationInput;
  language: Language;
  settings: AppSettings;
}

class AppDataValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppDataValidationError";
  }
}

function hasLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "ar";
}

function isMaterialCategory(value: unknown): value is MaterialCategory {
  return (
    value === "PE Resin" ||
    value === "Virgin Resin" ||
    value === "Recycled Material" ||
    value === "Off-grade Resin" ||
    value === "Filler" ||
    value === "Masterbatch" ||
    value === "Additive" ||
    value === "Other"
  );
}

function categoryFromLegacyType(value: unknown): MaterialCategory {
  switch (value) {
    case "filler":
      return "Filler";
    case "masterbatch":
      return "Masterbatch";
    case "additive":
      return "Additive";
    case "recycled":
      return "Recycled Material";
    case "virgin":
      return "Virgin Resin";
    default:
      return "Other";
  }
}

function legacyName(value: Record<string, unknown>, language: Language) {
  const name = value.name;

  if (isString(name)) {
    return name;
  }

  if (isRecord(name)) {
    const localized = name[language];
    const english = name.en;
    const arabic = name.ar;
    return [localized, english, arabic].find(isString) ?? "";
  }

  return "";
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function isJsonSettingValue(value: unknown): value is JsonSettingValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    isFiniteNumber(value)
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonSettingValue);
  }

  if (isRecord(value)) {
    return Object.values(value).every(isJsonSettingValue);
  }

  return false;
}

function validateMaterial(value: unknown): asserts value is Material {
  if (!isRecord(value)) {
    throw new AppDataValidationError("Material must be an object.");
  }

  if (!isString(value.id) || !isString(value.marketNameAr) || !isString(value.scientificNameEn)) {
    throw new AppDataValidationError(
      "Material id, marketNameAr, and scientificNameEn must be strings."
    );
  }

  if (!isNonNegativeNumber(value.pricePerKg)) {
    throw new AppDataValidationError(`Material "${value.id}" pricePerKg must be non-negative.`);
  }

  if (value.usage !== "A" && value.usage !== "B" && value.usage !== "A+B") {
    throw new AppDataValidationError(`Material "${value.id}" usage must be A, B, or A+B.`);
  }

  if (!isMaterialCategory(value.category)) {
    throw new AppDataValidationError(`Material "${value.id}" category is invalid.`);
  }

  if (value.notes !== undefined && !isString(value.notes)) {
    throw new AppDataValidationError(`Material "${value.id}" notes must be a string.`);
  }
}

function validateRecipe(value: unknown): asserts value is Recipe {
  if (!isRecord(value)) {
    throw new AppDataValidationError("Recipe must be an object.");
  }

  if (!isString(value.id) || !isString(value.name)) {
    throw new AppDataValidationError("Recipe id and name must be strings.");
  }

  if (value.type !== "A" && value.type !== "B") {
    throw new AppDataValidationError(`Recipe "${value.id}" type must be A or B.`);
  }

  if (!Array.isArray(value.items)) {
    throw new AppDataValidationError(`Recipe "${value.id}" items must be an array.`);
  }

  value.items.forEach((item) => {
    if (!isRecord(item) || !isString(item.materialId) || !isNonNegativeNumber(item.percentage)) {
      throw new AppDataValidationError(
        `Recipe "${value.id}" items must include materialId and non-negative percentage.`
      );
    }
  });

  if (value.notes !== undefined && !isString(value.notes)) {
    throw new AppDataValidationError(`Recipe "${value.id}" notes must be a string.`);
  }
}

function validatePreset(value: unknown): asserts value is SizePreset {
  if (!isRecord(value)) {
    throw new AppDataValidationError("Preset must be an object.");
  }

  if (!isString(value.id) || !isString(value.name)) {
    throw new AppDataValidationError("Preset id and name must be strings.");
  }

  if (value.thickness !== undefined && !isString(value.thickness)) {
    throw new AppDataValidationError(`Preset "${value.id}" thickness must be a string.`);
  }

  if (!isPositiveNumber(value.drawA) || !isPositiveNumber(value.drawB)) {
    throw new AppDataValidationError(`Preset "${value.id}" drawA and drawB must be greater than 0.`);
  }

  if (!isNonNegativeNumber(value.rollWeight)) {
    throw new AppDataValidationError(`Preset "${value.id}" rollWeight must be non-negative.`);
  }

  if (!isNonNegativeNumber(value.wastePercent) || value.wastePercent >= 100) {
    throw new AppDataValidationError(`Preset "${value.id}" wastePercent must be >= 0 and < 100.`);
  }

  if (value.notes !== undefined && !isString(value.notes)) {
    throw new AppDataValidationError(`Preset "${value.id}" notes must be a string.`);
  }
}

function validateCalculationInput(value: unknown): asserts value is CalculationInput {
  if (!isRecord(value)) {
    throw new AppDataValidationError("Calculation input must be an object.");
  }

  if (!isString(value.recipeAId) || !isString(value.recipeBId)) {
    throw new AppDataValidationError("Calculation input recipe ids must be strings.");
  }

  if (value.presetId !== undefined && !isString(value.presetId)) {
    throw new AppDataValidationError("Calculation input presetId must be a string.");
  }

  if (!isPositiveNumber(value.drawA) || !isPositiveNumber(value.drawB)) {
    throw new AppDataValidationError("Calculation input drawA and drawB must be greater than 0.");
  }

  if (!isNonNegativeNumber(value.rollWeight)) {
    throw new AppDataValidationError("Calculation input rollWeight must be non-negative.");
  }

  if (!isNonNegativeNumber(value.wastePercent) || value.wastePercent >= 100) {
    throw new AppDataValidationError("Calculation input wastePercent must be >= 0 and < 100.");
  }

  if (value.sellingPricePerKg !== undefined && !isNonNegativeNumber(value.sellingPricePerKg)) {
    throw new AppDataValidationError("Calculation input sellingPricePerKg must be non-negative.");
  }

  if (value.orderQuantityKg !== undefined && !isNonNegativeNumber(value.orderQuantityKg)) {
    throw new AppDataValidationError("Calculation input orderQuantityKg must be non-negative.");
  }

  if (
    value.targetProfitMarginPercent !== undefined &&
    !isNonNegativeNumber(value.targetProfitMarginPercent)
  ) {
    throw new AppDataValidationError(
      "Calculation input targetProfitMarginPercent must be non-negative."
    );
  }
}

function validateSettings(value: unknown): asserts value is AppSettings {
  if (!isRecord(value)) {
    throw new AppDataValidationError("Settings must be an object.");
  }

  if (!isString(value.currency)) {
    throw new AppDataValidationError("Settings currency must be a string.");
  }

  Object.values(value).forEach((settingValue) => {
    if (!isJsonSettingValue(settingValue)) {
      throw new AppDataValidationError("Settings must contain only JSON-compatible values.");
    }
  });
}

function validateAppData(value: unknown): asserts value is AppData {
  if (!isRecord(value)) {
    throw new AppDataValidationError("Imported app data must be an object.");
  }

  if (!Array.isArray(value.materials)) {
    throw new AppDataValidationError("App data materials must be an array.");
  }

  if (!Array.isArray(value.recipes)) {
    throw new AppDataValidationError("App data recipes must be an array.");
  }

  if (!Array.isArray(value.presets)) {
    throw new AppDataValidationError("App data presets must be an array.");
  }

  value.materials.forEach(validateMaterial);
  value.recipes.forEach(validateRecipe);
  value.presets.forEach(validatePreset);
  validateCalculationInput(value.calculationInput);

  if (!isLanguage(value.language)) {
    throw new AppDataValidationError("App data language must be en or ar.");
  }

  validateSettings(value.settings);
}

function normalizeAppData(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  const materials = Array.isArray(value.materials)
    ? value.materials.map((material) => {
        if (!isRecord(material)) {
          return material;
        }

        const id = isString(material.id) ? material.id : "";
        const marketNameAr = isString(material.marketNameAr)
          ? material.marketNameAr
          : legacyName(material, "ar") || id;
        const scientificNameEn = isString(material.scientificNameEn)
          ? material.scientificNameEn
          : legacyName(material, "en") || marketNameAr || id;

        return {
          ...material,
          id,
          marketNameAr,
          scientificNameEn,
          category: isMaterialCategory(material.category)
            ? material.category
            : categoryFromLegacyType(material.type)
        };
      })
    : value.materials;

  const aliasMap = new Map<string, string>();
  if (Array.isArray(materials)) {
    materials.forEach((material) => {
      if (!isRecord(material) || !isString(material.id)) {
        return;
      }

      [
        material.id,
        material.marketNameAr,
        material.scientificNameEn,
        legacyName(material, "ar"),
        legacyName(material, "en")
      ].forEach((alias) => {
        if (isString(alias) && alias) {
          aliasMap.set(normalizeKey(alias), material.id as string);
        }
      });
    });
  }

  const recipes = Array.isArray(value.recipes)
    ? value.recipes.map((recipe) => {
        if (!isRecord(recipe) || !Array.isArray(recipe.items)) {
          return recipe;
        }

        return {
          ...recipe,
          items: recipe.items.map((item) => {
            if (!isRecord(item) || !isString(item.materialId)) {
              return item;
            }

            return {
              ...item,
              materialId: aliasMap.get(normalizeKey(item.materialId)) ?? item.materialId
            };
          })
        };
      })
    : value.recipes;

  return {
    ...value,
    materials,
    recipes
  };
}

function getDefaultAppData(): AppData {
  const demoData = getDemoData();

  return {
    ...demoData,
    language: "en",
    settings: {
      currency: "EGP"
    }
  };
}

function cloneAppData(data: AppData): AppData {
  return {
    materials: data.materials.map((material) => ({ ...material })),
    recipes: data.recipes.map((recipe) => ({
      ...recipe,
      items: recipe.items.map((item) => ({ ...item }))
    })),
    presets: data.presets.map((preset) => ({ ...preset })),
    calculationInput: { ...data.calculationInput },
    language: data.language,
    settings: { ...data.settings }
  };
}

export function loadAppData(): AppData {
  if (!hasLocalStorage()) {
    return getDefaultAppData();
  }

  const savedData = window.localStorage.getItem(APP_DATA_STORAGE_KEY);
  if (!savedData) {
    return resetToDemoData();
  }

  try {
    return importAppDataFromJson(savedData);
  } catch {
    return resetToDemoData();
  }
}

export function saveAppData(data: AppData) {
  validateAppData(data);

  if (hasLocalStorage()) {
    window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(data));
  }
}

export function resetToDemoData(): AppData {
  const demoData = getDefaultAppData();
  saveAppData(demoData);
  return cloneAppData(demoData);
}

export function exportAppDataAsJson(data: AppData) {
  validateAppData(data);
  return JSON.stringify(data, null, 2);
}

export function importAppDataFromJson(json: string): AppData {
  let parsedData: unknown;

  try {
    parsedData = JSON.parse(json);
  } catch {
    throw new AppDataValidationError("Imported app data is not valid JSON.");
  }

  const normalizedData = normalizeAppData(parsedData);
  validateAppData(normalizedData);
  const importedData = cloneAppData(normalizedData);
  saveAppData(importedData);

  return importedData;
}
