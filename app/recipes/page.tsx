"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/components/AppProvider";
import { calculateAppRecipeCost, formatMoney, formatNumber } from "@/lib/calculations";
import { localName } from "@/lib/i18n";
import { getMaterialSelectorLabel } from "@/lib/materials";
import type { Extruder, Recipe } from "@/types/domain";

function createRecipe(extruder: Extruder, materialId: string): Recipe {
  return {
    id: `recipe-${extruder.toLowerCase()}-${Date.now().toString(36)}`,
    name: {
      en: `New ${extruder} recipe`,
      ar: `خلطة ${extruder} جديدة`
    },
    extruder,
    lines: materialId ? [{ materialId, percentage: 100 }] : []
  };
}

export default function RecipesPage() {
  const { state, setState, t } = useApp();
  const [saveMessage, setSaveMessage] = useState("");
  const groups: Extruder[] = ["A", "B"];

  const updateRecipe = (id: string, patch: Partial<Recipe>) => {
    setSaveMessage("");
    setState((current) => ({
      ...current,
      recipes: current.recipes.map((recipe) => (recipe.id === id ? { ...recipe, ...patch } : recipe))
    }));
  };

  const updateRecipeName = (recipe: Recipe, name: string) => {
    updateRecipe(recipe.id, {
      name: {
        ...recipe.name,
        en: name,
        ar: name
      }
    });
  };

  const removeRecipe = (id: string) => {
    setSaveMessage("");
    setState((current) => ({
      ...current,
      recipes: current.recipes.filter((recipe) => recipe.id !== id)
    }));
  };

  const addRecipe = (extruder: Extruder) => {
    const firstMaterial = state.materials[0]?.id ?? "";
    setSaveMessage("");
    setState((current) => ({
      ...current,
      recipes: [...current.recipes, createRecipe(extruder, firstMaterial)]
    }));
  };

  const addLine = (recipe: Recipe) => {
    const materialId = state.materials[0]?.id;
    if (!materialId) {
      return;
    }

    updateRecipe(recipe.id, {
      lines: [...recipe.lines, { materialId, percentage: 0 }]
    });
  };

  const updateLine = (
    recipe: Recipe,
    index: number,
    patch: Partial<Recipe["lines"][number]>
  ) => {
    updateRecipe(recipe.id, {
      lines: recipe.lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line
      )
    });
  };

  const removeLine = (recipe: Recipe, index: number) => {
    updateRecipe(recipe.id, {
      lines: recipe.lines.filter((_, lineIndex) => lineIndex !== index)
    });
  };

  const saveRecipes = () => {
    setState((current) => ({ ...current, recipes: [...current.recipes] }));
    setSaveMessage(t("changesSaved"));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("recipes")}
        eyebrow={t("materialOnly")}
        action={
          <button
            type="button"
            onClick={saveRecipes}
            className="w-full rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white sm:w-auto"
          >
            {t("save")}
          </button>
        }
      />

      {saveMessage && (
        <section className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-900">
          {saveMessage}
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        {groups.map((extruder) => {
          const recipes = state.recipes.filter((recipe) => recipe.extruder === extruder);

          return (
            <div key={extruder} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-ink">
                  {extruder === "A" ? t("recipeA") : t("recipeB")}
                </h2>
                <button
                  type="button"
                  onClick={() => addRecipe(extruder)}
                  className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white"
                >
                  {t("addRecipe")}
                </button>
              </div>

              {recipes.length === 0 && (
                <p className="rounded-lg border border-line bg-white px-4 py-6 text-center text-sm font-semibold text-slate-500">
                  {t("noRecipes")}
                </p>
              )}

              {recipes.map((recipe) => {
                const cost = calculateAppRecipeCost(recipe, state.materials);
                const totalOk = Math.abs(cost.percentageTotal - 100) < 0.01;

                return (
                  <section key={recipe.id} className="rounded-lg border border-line bg-white p-3 shadow-soft sm:p-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                      <label>
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          {t("name")}
                        </span>
                        <input
                          value={localName(recipe.name, state.language)}
                          onChange={(event) => updateRecipeName(recipe, event.target.value)}
                          className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-semibold outline-none focus:border-accent"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeRecipe(recipe.id)}
                        className="self-end rounded-lg border border-red-200 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
                      >
                        {t("deleteRecipe")}
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-line bg-panel px-3 py-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          {t("totalPercentage")}
                        </p>
                        <p className="mt-1 text-xl font-black text-ink">
                          {formatNumber(cost.percentageTotal, state.language, 2)}%
                        </p>
                      </div>
                      <div className="rounded-lg border border-line bg-panel px-3 py-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          {t("recipeCost")}
                        </p>
                        <p className="mt-1 text-xl font-black text-ink">
                          {formatMoney(cost.costPerKg, state.currency, state.language)}
                        </p>
                      </div>
                    </div>

                    {!totalOk && (
                      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                        {t("recipePercentageWarning")}
                      </p>
                    )}

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-slate-700">{t("items")}</h3>
                        <button
                          type="button"
                          onClick={() => addLine(recipe)}
                          disabled={state.materials.length === 0}
                          className="rounded-lg border border-line px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          {t("addRecipeItem")}
                        </button>
                      </div>

                      <div className="space-y-2">
                        {recipe.lines.map((line, index) => {
                          const material = state.materials.find((item) => item.id === line.materialId);
                          const contribution = material
                            ? (material.pricePerKg * line.percentage) / 100
                            : 0;

                          return (
                            <div
                              key={`${line.materialId}-${index}`}
                              className="grid gap-3 rounded-lg border border-line p-3 md:grid-cols-[1fr_120px_130px_auto] md:items-end"
                            >
                              <label className="block">
                                <span className="text-xs font-bold uppercase tracking-wide text-slate-500 md:sr-only">
                                  {t("material")}
                                </span>
                                <select
                                  value={line.materialId}
                                  onChange={(event) =>
                                    updateLine(recipe, index, { materialId: event.target.value })
                                  }
                                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 font-semibold outline-none focus:border-accent md:mt-0"
                                >
                                  {state.materials.map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {getMaterialSelectorLabel(
                                        option,
                                        state.language,
                                        state.materialNameDisplayMode
                                      )}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="block">
                                <span className="text-xs font-bold uppercase tracking-wide text-slate-500 md:sr-only">
                                  {t("percentage")}
                                </span>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min={0}
                                  step={0.01}
                                  value={line.percentage}
                                  onChange={(event) =>
                                    updateLine(recipe, index, {
                                      percentage: Math.max(0, Number(event.target.value) || 0)
                                    })
                                  }
                                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-right font-bold outline-none focus:border-accent md:mt-0"
                                />
                              </label>
                              <div className="rounded-lg bg-panel px-3 py-2">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  {t("contribution")}
                                </p>
                                <p className="font-bold text-ink">
                                  {formatMoney(contribution, state.currency, state.language)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeLine(recipe, index)}
                                className="rounded-lg border border-line px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
                              >
                                {t("remove")}
                              </button>
                            </div>
                          );
                        })}
                        {recipe.lines.length === 0 && (
                          <p className="rounded-lg bg-panel px-4 py-4 text-sm font-semibold text-slate-600">
                            {t("noRecipeItems")}
                          </p>
                        )}
                        {state.materials.length === 0 && (
                          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                            {t("noMaterialsForRecipe")}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          );
        })}
      </section>
    </div>
  );
}
