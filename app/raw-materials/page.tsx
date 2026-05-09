"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/components/AppProvider";
import { MaterialName } from "@/components/MaterialName";
import { formatNumber } from "@/lib/calculations";
import { getMaterialDisplayText } from "@/lib/materials";
import type { RawMaterial, RawMaterialCategory, RawMaterialUsage } from "@/types/domain";

const usageOptions: RawMaterialUsage[] = ["A", "B", "A+B"];
const categoryOptions: RawMaterialCategory[] = [
  "PE Resin",
  "Virgin Resin",
  "Recycled Material",
  "Off-grade Resin",
  "Filler",
  "Masterbatch",
  "Additive",
  "Other"
];

function createMaterial(): RawMaterial {
  const id = `mat-${Date.now().toString(36)}`;
  return {
    id,
    marketNameAr: "",
    scientificNameEn: "",
    pricePerKg: 0,
    usage: "A+B",
    category: "Other",
    notes: ""
  };
}

function priceLabel(value: number, language: "en" | "ar") {
  return `${formatNumber(value, language, 2)} EGP/kg`;
}

export default function RawMaterialsPage() {
  const { state, setState, t } = useApp();
  const [draft, setDraft] = useState<RawMaterial>(createMaterial);
  const [saveMessage, setSaveMessage] = useState("");

  const validateMaterial = (material: RawMaterial) => {
    const warnings: string[] = [];
    const displayName =
      getMaterialDisplayText(material, state.language, state.materialNameDisplayMode, " / ") ||
      material.id;

    if (!material.marketNameAr.trim() || !material.scientificNameEn.trim()) {
      warnings.push(`${displayName}: ${t("materialNameRequired")}`);
    }

    if (!Number.isFinite(material.pricePerKg) || material.pricePerKg < 0) {
      warnings.push(`${displayName}: ${t("materialPriceInvalid")}`);
    }

    return warnings;
  };

  const materialWarnings = state.materials.flatMap(validateMaterial);
  const draftWarnings = validateMaterial(draft);

  const updateMaterial = (id: string, patch: Partial<RawMaterial>) => {
    setSaveMessage("");
    setState((current) => ({
      ...current,
      materials: current.materials.map((material) =>
        material.id === id ? { ...material, ...patch } : material
      )
    }));
  };

  const removeMaterial = (id: string) => {
    setSaveMessage("");
    setState((current) => ({
      ...current,
      materials: current.materials.filter((material) => material.id !== id),
      recipes: current.recipes.map((recipe) => ({
        ...recipe,
        lines: recipe.lines.filter((line) => line.materialId !== id)
      }))
    }));
  };

  const addMaterial = () => {
    if (draftWarnings.length > 0) {
      setSaveMessage(t("fixWarningsBeforeSave"));
      return;
    }

    setState((current) => ({ ...current, materials: [...current.materials, draft] }));
    setDraft(createMaterial());
    setSaveMessage(t("changesSaved"));
  };

  const saveMaterials = () => {
    setSaveMessage(materialWarnings.length > 0 ? t("fixWarningsBeforeSave") : t("changesSaved"));
    if (materialWarnings.length === 0) {
      setState((current) => ({ ...current, materials: [...current.materials] }));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("rawMaterials")}
        eyebrow={t("materialOnly")}
        action={
          <button
            type="button"
            onClick={saveMaterials}
            className="w-full rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white sm:w-auto"
          >
            {t("save")}
          </button>
        }
      />

      {(materialWarnings.length > 0 || saveMessage) && (
        <section
          className={`rounded-lg border p-4 text-sm font-semibold ${
            materialWarnings.length > 0
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-teal-200 bg-teal-50 text-teal-900"
          }`}
        >
          {materialWarnings.length > 0 ? (
            <ul className="space-y-1">
              {materialWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : (
            saveMessage
          )}
        </section>
      )}

      <section className="rounded-lg border border-line bg-white p-3 shadow-soft sm:p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1.2fr_130px_170px_1fr_auto]">
          <label>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("marketNameAr")}</span>
            <input
              value={draft.marketNameAr}
              onChange={(event) => setDraft({ ...draft, marketNameAr: event.target.value })}
              className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-semibold outline-none focus:border-accent"
            />
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("scientificNameEn")}</span>
            <input
              value={draft.scientificNameEn}
              onChange={(event) => setDraft({ ...draft, scientificNameEn: event.target.value })}
              className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-semibold outline-none focus:border-accent"
            />
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("price")}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              value={draft.pricePerKg}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  pricePerKg: Math.max(0, Number(event.target.value) || 0)
                })
              }
              className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-bold outline-none focus:border-accent"
            />
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("category")}</span>
            <select
              value={draft.category}
              onChange={(event) => setDraft({ ...draft, category: event.target.value as RawMaterialCategory })}
              className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-semibold outline-none focus:border-accent"
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("notes")}</span>
            <input
              value={draft.notes ?? ""}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
              className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-semibold outline-none focus:border-accent"
            />
          </label>
          <button
            type="button"
            onClick={addMaterial}
            className="self-end rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300 md:w-auto"
            disabled={draftWarnings.length > 0}
          >
            {t("addMaterial")}
          </button>
        </div>
        <div className="mt-3 max-w-xs">
          <label>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("usage")}</span>
            <select
              value={draft.usage}
              onChange={(event) => setDraft({ ...draft, usage: event.target.value as RawMaterialUsage })}
              className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-semibold outline-none focus:border-accent"
            >
              {usageOptions.map((usage) => (
                <option key={usage} value={usage}>
                  {usage}
                </option>
              ))}
            </select>
          </label>
        </div>
        {draftWarnings.length > 0 && (
          <p className="mt-3 text-sm font-semibold text-amber-700">{draftWarnings.join(" ")}</p>
        )}
      </section>

      <section className="hidden overflow-x-auto rounded-lg border border-line bg-white shadow-soft md:block">
        <table className="min-w-[1120px] border-collapse text-sm">
          <thead className="bg-panel text-left text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">{t("material")}</th>
              <th className="px-4 py-3">{t("marketNameAr")}</th>
              <th className="px-4 py-3">{t("scientificNameEn")}</th>
              <th className="px-4 py-3">{t("price")}</th>
              <th className="px-4 py-3">{t("usage")}</th>
              <th className="px-4 py-3">{t("category")}</th>
              <th className="px-4 py-3">{t("notes")}</th>
              <th className="px-4 py-3 text-right">{t("remove")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {state.materials.map((material) => (
              <tr key={material.id}>
                <td className="px-4 py-3">
                  <MaterialName material={material} />
                </td>
                <td className="px-4 py-3">
                  <input
                    value={material.marketNameAr}
                    aria-label={t("marketNameAr")}
                    onChange={(event) => updateMaterial(material.id, { marketNameAr: event.target.value })}
                    className="w-full rounded-lg border border-line px-3 py-2 font-semibold outline-none focus:border-accent"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    value={material.scientificNameEn}
                    aria-label={t("scientificNameEn")}
                    onChange={(event) => updateMaterial(material.id, { scientificNameEn: event.target.value })}
                    className="w-full rounded-lg border border-line px-3 py-2 font-semibold outline-none focus:border-accent"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.01}
                    value={material.pricePerKg}
                    aria-label={t("price")}
                    onChange={(event) =>
                      updateMaterial(material.id, {
                        pricePerKg: Math.max(0, Number(event.target.value) || 0)
                      })
                    }
                    className="w-full rounded-lg border border-line px-3 py-2 font-bold outline-none focus:border-accent"
                  />
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {priceLabel(material.pricePerKg, state.language)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={material.usage}
                    aria-label={t("usage")}
                    onChange={(event) =>
                      updateMaterial(material.id, { usage: event.target.value as RawMaterialUsage })
                    }
                    className="w-full rounded-lg border border-line px-3 py-2 font-semibold outline-none focus:border-accent"
                  >
                    {usageOptions.map((usage) => (
                      <option key={usage} value={usage}>
                        {usage}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={material.category}
                    aria-label={t("category")}
                    onChange={(event) =>
                      updateMaterial(material.id, { category: event.target.value as RawMaterialCategory })
                    }
                    className="w-full rounded-lg border border-line px-3 py-2 font-semibold outline-none focus:border-accent"
                  >
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    value={material.notes ?? ""}
                    aria-label={t("notes")}
                    onChange={(event) => updateMaterial(material.id, { notes: event.target.value })}
                    className="w-full rounded-lg border border-line px-3 py-2 font-semibold outline-none focus:border-accent"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => removeMaterial(material.id)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
                  >
                    {t("remove")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {state.materials.length === 0 && (
          <p className="px-4 py-6 text-center text-sm font-semibold text-slate-500">{t("noMaterials")}</p>
        )}
      </section>

      <section className="space-y-3 md:hidden">
        {state.materials.map((material) => (
          <article key={material.id} className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <MaterialName material={material} />
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("price")}</p>
                <p className="mt-1 text-lg font-black text-ink">
                  {priceLabel(material.pricePerKg, state.language)}
                </p>
              </div>
              <span className="rounded-md bg-teal-100 px-2 py-1 text-xs font-bold text-teal-800">
                {material.usage}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("marketNameAr")}</span>
                <input
                  value={material.marketNameAr}
                  onChange={(event) => updateMaterial(material.id, { marketNameAr: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-semibold outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("scientificNameEn")}</span>
                <input
                  value={material.scientificNameEn}
                  onChange={(event) => updateMaterial(material.id, { scientificNameEn: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-semibold outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("price")}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.01}
                  value={material.pricePerKg}
                  onChange={(event) =>
                    updateMaterial(material.id, {
                      pricePerKg: Math.max(0, Number(event.target.value) || 0)
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-bold outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("usage")}</span>
                <select
                  value={material.usage}
                  onChange={(event) =>
                    updateMaterial(material.id, { usage: event.target.value as RawMaterialUsage })
                  }
                  className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-semibold outline-none focus:border-accent"
                >
                  {usageOptions.map((usage) => (
                    <option key={usage} value={usage}>
                      {usage}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("category")}</span>
                <select
                  value={material.category}
                  onChange={(event) =>
                    updateMaterial(material.id, { category: event.target.value as RawMaterialCategory })
                  }
                  className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-semibold outline-none focus:border-accent"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("notes")}</span>
                <textarea
                  value={material.notes ?? ""}
                  onChange={(event) => updateMaterial(material.id, { notes: event.target.value })}
                  className="mt-1 min-h-20 w-full rounded-lg border border-line px-3 py-3 font-semibold outline-none focus:border-accent"
                />
              </label>
              <button
                type="button"
                onClick={() => removeMaterial(material.id)}
                className="w-full rounded-lg border border-red-200 px-3 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
              >
                {t("remove")}
              </button>
            </div>
          </article>
        ))}
        {state.materials.length === 0 && (
          <p className="rounded-lg border border-line bg-white px-4 py-6 text-center text-sm font-semibold text-slate-500">
            {t("noMaterials")}
          </p>
        )}
      </section>
    </div>
  );
}
