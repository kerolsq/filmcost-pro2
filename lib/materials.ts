import type { Language, MaterialNameDisplayMode, RawMaterial } from "@/types/domain";
import type { Material } from "@/types/film-cost";

type MaterialLike = Pick<Material, "id"> & Partial<Pick<Material, "marketNameAr" | "scientificNameEn">> & {
  name?: string | { en?: string; ar?: string };
};

function cleanName(value: string | undefined) {
  return value?.trim() ?? "";
}

export function getMaterialMarketName(material: MaterialLike) {
  return (
    cleanName(material.marketNameAr) ||
    cleanName(legacyMaterialName(material, "ar")) ||
    cleanName(material.scientificNameEn) ||
    cleanName(legacyMaterialName(material, "en")) ||
    material.id
  );
}

export function getMaterialScientificName(material: MaterialLike) {
  return (
    cleanName(material.scientificNameEn) ||
    cleanName(legacyMaterialName(material, "en")) ||
    cleanName(material.marketNameAr) ||
    cleanName(legacyMaterialName(material, "ar")) ||
    material.id
  );
}

export function getMaterialDisplayLines(
  material: MaterialLike,
  language: Language,
  mode: MaterialNameDisplayMode = "both"
) {
  const marketName = getMaterialMarketName(material);
  const englishName = getMaterialScientificName(material);

  if (mode === "marketOnly") {
    return [marketName];
  }

  if (mode === "englishOnly") {
    return [englishName];
  }

  return marketName === englishName ? [marketName] : [marketName, englishName];
}

export function getMaterialDisplayName(
  material: MaterialLike,
  language: Language,
  mode: MaterialNameDisplayMode = "both"
) {
  return getMaterialDisplayLines(material, language, mode).join("\n");
}

export function getMaterialDisplayText(
  material: MaterialLike,
  language: Language,
  mode: MaterialNameDisplayMode = "both",
  separator = "\n"
) {
  return getMaterialDisplayLines(material, language, mode).join(separator);
}

export function getMaterialSelectorLabel(
  material: RawMaterial,
  language: Language,
  mode: MaterialNameDisplayMode = "both"
) {
  const lines = getMaterialDisplayLines(material, language, mode);
  const primary = lines[0] ?? material.id;
  const secondary = lines[1];

  return secondary ? `${primary} - ${secondary}` : primary;
}

export function legacyMaterialName(material: MaterialLike, language: Language) {
  if (!material.name) {
    return "";
  }

  if (typeof material.name === "string") {
    return material.name;
  }

  return material.name[language] || material.name.en || material.name.ar || "";
}
