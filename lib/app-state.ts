import { demoState } from "@/lib/demo-data";
import type {
  AppState,
  LocalizedName,
  RawMaterial,
  RawMaterialCategory,
  RawMaterialType
} from "@/types/domain";

type LegacyMaterial = Partial<Omit<RawMaterial, "name">> & {
  id: string;
  name?: string | Partial<LocalizedName>;
};

function categoryFromLegacyType(type?: RawMaterialType): RawMaterialCategory {
  switch (type) {
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

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function legacyName(material: LegacyMaterial, language: "ar" | "en") {
  if (!material.name) {
    return "";
  }

  if (typeof material.name === "string") {
    return material.name;
  }

  return material.name[language] ?? "";
}

function normalizeMaterial(material: LegacyMaterial): RawMaterial {
  const legacyArabicName = legacyName(material, "ar");
  const legacyEnglishName = legacyName(material, "en");
  const marketNameAr = material.marketNameAr ?? legacyArabicName ?? legacyEnglishName ?? material.id;
  const scientificNameEn = material.scientificNameEn ?? legacyEnglishName ?? legacyArabicName ?? material.id;

  return {
    ...material,
    id: material.id,
    marketNameAr,
    scientificNameEn,
    name:
      typeof material.name === "object" && material.name
        ? { en: material.name.en ?? scientificNameEn, ar: material.name.ar ?? marketNameAr }
        : { en: scientificNameEn, ar: marketNameAr },
    type: material.type,
    pricePerKg: material.pricePerKg ?? 0,
    supplier: material.supplier,
    usage: material.usage ?? "A+B",
    category: material.category ?? categoryFromLegacyType(material.type),
    notes: material.notes ?? ""
  };
}

function createMaterialAliasMap(materials: RawMaterial[]) {
  const aliases = new Map<string, string>();

  materials.forEach((material) => {
    [
      material.id,
      material.marketNameAr,
      material.scientificNameEn,
      material.name?.ar ?? "",
      material.name?.en ?? ""
    ].forEach((alias) => {
      if (alias) {
        aliases.set(normalizeKey(alias), material.id);
      }
    });
  });

  return aliases;
}

export function mergeAppState(saved: Partial<AppState>): AppState {
  const mergedMaterials = (saved.materials ?? demoState.materials).map((material) =>
    normalizeMaterial(material)
  );
  const materialAliases = createMaterialAliasMap(mergedMaterials);
  const mergedPresets = (saved.presets ?? demoState.presets).map((preset, index) => {
    const demoPreset = demoState.presets[index] ?? demoState.presets[0];

    return {
      ...demoPreset,
      ...preset,
      thicknessGauge: preset.thicknessGauge ?? demoPreset.thicknessGauge,
      drawA: preset.drawA ?? demoPreset.drawA,
      drawB: preset.drawB ?? demoPreset.drawB,
      rollWeight: preset.rollWeight ?? demoPreset.rollWeight,
      wastePercent: preset.wastePercent ?? demoPreset.wastePercent,
      notes: preset.notes ?? ""
    };
  });

  return {
    ...demoState,
    ...saved,
    materialNameDisplayMode: saved.materialNameDisplayMode ?? demoState.materialNameDisplayMode,
    materials: mergedMaterials,
    presets: mergedPresets,
    calculator: {
      ...demoState.calculator,
      ...saved.calculator
    },
    recentCalculations: saved.recentCalculations ?? demoState.recentCalculations,
    compare: {
      left: {
        ...demoState.compare.left,
        ...saved.compare?.left
      },
      right: {
        ...demoState.compare.right,
        ...saved.compare?.right
      }
    },
    recipes: (saved.recipes ?? demoState.recipes).map((recipe) => ({
      ...recipe,
      lines: recipe.lines.map((line) => ({
        ...line,
        materialId: materialAliases.get(normalizeKey(line.materialId)) ?? line.materialId
      }))
    }))
  };
}
