"use client";

import { calculateAppRecipeCost, formatMoney, formatNumber } from "@/lib/calculations";
import { localName } from "@/lib/i18n";
import { MaterialName } from "@/components/MaterialName";
import { useApp } from "@/components/AppProvider";
import { MetricCard } from "@/components/MetricCard";
import type { CalculatorInput, RecipeCost } from "@/types/domain";

interface CalculatorPanelProps {
  title?: string;
  input: CalculatorInput;
  onChange: (input: CalculatorInput) => void;
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max,
  step = 1,
  optional = false
}: {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="mt-1 flex rounded-lg border border-line bg-white focus-within:border-accent">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value ?? ""}
          onChange={(event) => {
            if (optional && event.target.value === "") {
              onChange(undefined);
              return;
            }

            const numericValue = Number(event.target.value);
            const boundedValue = Math.min(max ?? numericValue, Math.max(min, numericValue || 0));
            onChange(boundedValue);
          }}
          className="min-w-0 flex-1 rounded-lg bg-transparent px-3 py-3 text-lg font-bold outline-none"
        />
        {suffix ? <span className="px-3 py-3 text-sm font-semibold text-slate-500">{suffix}</span> : null}
      </span>
    </label>
  );
}

function RecipeBreakdown({ recipe }: { recipe: RecipeCost }) {
  const { state, t } = useApp();
  const totalOk = Math.abs(recipe.percentageTotal - 100) < 0.01;

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-ink">
          {recipe.recipe ? localName(recipe.recipe.name, state.language) : t("recipe")}
        </h3>
        <span
          className={`rounded-md px-2 py-1 text-xs font-bold ${
            totalOk ? "bg-teal-100 text-teal-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {totalOk ? t("ready") : t("invalidTotal")}: {formatNumber(recipe.percentageTotal, state.language, 2)}%
        </span>
      </div>
      <div className="mt-3 divide-y divide-line">
        {recipe.lines.map((line) => (
          <div key={line.material.id} className="grid grid-cols-[1fr_auto_auto] gap-3 py-2 text-sm">
            <MaterialName material={line.material} />
            <span className="tabular-nums text-slate-600">{formatNumber(line.percentage, state.language, 2)}%</span>
            <span className="min-w-20 text-right font-bold tabular-nums text-ink">
              {formatMoney(line.costPerKg, state.currency, state.language)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-panel px-3 py-2 font-bold">
        <span>{t("recipeCost")}</span>
        <span>{formatMoney(recipe.costPerKg, state.currency, state.language)}</span>
      </div>
    </section>
  );
}

export function CalculatorPanel({ title, input, onChange }: CalculatorPanelProps) {
  const { state, t } = useApp();
  const recipesA = state.recipes.filter((recipe) => recipe.extruder === "A");
  const recipesB = state.recipes.filter((recipe) => recipe.extruder === "B");
  const preset = state.presets.find((item) => item.id === input.presetId) ?? state.presets[0] ?? null;
  const recipeA = calculateAppRecipeCost(
    state.recipes.find((recipe) => recipe.id === input.recipeAId) ?? null,
    state.materials
  );
  const recipeB = calculateAppRecipeCost(
    state.recipes.find((recipe) => recipe.id === input.recipeBId) ?? null,
    state.materials
  );
  const drawA = input.aShare;
  const drawB = input.bShare;
  const rollWeight = input.rollWeight;
  const wastePercent = input.wastePercent;
  const drawTotal = drawA + drawB;
  const drawValid = drawA > 0 && drawB > 0;
  const wasteValid = wastePercent >= 0 && wastePercent < 100;
  const aRatio = drawValid ? drawA / drawTotal : 0;
  const bRatio = drawValid ? drawB / drawTotal : 0;
  const costBeforeWaste = recipeA.costPerKg * aRatio + recipeB.costPerKg * bRatio;
  const costAfterWaste = wasteValid ? costBeforeWaste / (1 - wastePercent / 100) : costBeforeWaste;
  const profitPerKg =
    input.sellingPricePerKg !== undefined ? input.sellingPricePerKg - costAfterWaste : undefined;
  const totalProfit =
    profitPerKg !== undefined && input.orderQuantityKg !== undefined
      ? profitPerKg * input.orderQuantityKg
      : undefined;
  const safeSellingPrice =
    input.targetProfitMarginPercent !== undefined
      ? costAfterWaste * (1 + input.targetProfitMarginPercent / 100)
      : undefined;
  const warnings = [
    !drawValid ? t("drawPositiveWarning") : "",
    !wasteValid ? t("invalidWasteWarning") : "",
    Math.abs(drawTotal - rollWeight) > 0.000001 ? t("drawMismatchWarning") : "",
    Math.abs(recipeA.percentageTotal - 100) >= 0.01
      ? `${t("recipeA")}: ${t("recipePercentageWarning")}`
      : "",
    Math.abs(recipeB.percentageTotal - 100) >= 0.01
      ? `${t("recipeB")}: ${t("recipePercentageWarning")}`
      : ""
  ].filter(Boolean);

  const patch = (updates: Partial<CalculatorInput>) => onChange({ ...input, ...updates });

  const applyPreset = (presetId: string) => {
    const selectedPreset = state.presets.find((item) => item.id === presetId);

    patch({
      presetId,
      ...(selectedPreset
        ? {
            aShare: selectedPreset.drawA,
            bShare: selectedPreset.drawB,
            rollWeight: selectedPreset.rollWeight,
            wastePercent: selectedPreset.wastePercent
          }
        : {})
    });
  };

  return (
    <div className="space-y-5">
      {title ? <h2 className="text-xl font-bold text-ink">{title}</h2> : null}

      <section className="sticky top-[116px] z-10 rounded-lg border border-teal-200 bg-teal-50 p-4 shadow-soft sm:static sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-800">{t("rawMaterialsOnlyWarning")}</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-900">{t("costAfterWaste")}</p>
            <p className="mt-1 text-4xl font-black leading-none text-ink sm:text-5xl">
              {formatMoney(costAfterWaste, state.currency, state.language)}
            </p>
          </div>
          <div className="rounded-lg bg-white px-4 py-3 text-sm font-bold text-slate-700">
            {preset ? localName(preset.name, state.language) : t("preset")}
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-lg border border-line bg-white p-3 shadow-soft sm:p-4 md:grid-cols-3">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("recipeA")}</span>
          <select
            value={input.recipeAId}
            onChange={(event) => patch({ recipeAId: event.target.value })}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-3 font-semibold outline-none focus:border-accent"
          >
            {recipesA.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {localName(recipe.name, state.language)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("recipeB")}</span>
          <select
            value={input.recipeBId}
            onChange={(event) => patch({ recipeBId: event.target.value })}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-3 font-semibold outline-none focus:border-accent"
          >
            {recipesB.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {localName(recipe.name, state.language)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("preset")}</span>
          <select
            value={input.presetId}
            onChange={(event) => applyPreset(event.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-3 font-semibold outline-none focus:border-accent"
          >
            {state.presets.map((item) => (
              <option key={item.id} value={item.id}>
                {localName(item.name, state.language)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="rounded-lg border border-line bg-white p-3 shadow-soft sm:p-4">
        <h3 className="text-sm font-bold text-slate-700">{t("manualOverrides")}</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <NumberField label={t("aDraw")} value={drawA} onChange={(value) => patch({ aShare: value ?? 0 })} suffix={t("kg")} step={0.01} />
          <NumberField label={t("bDraw")} value={drawB} onChange={(value) => patch({ bShare: value ?? 0 })} suffix={t("kg")} step={0.01} />
          <NumberField label={t("rollWeight")} value={rollWeight} onChange={(value) => patch({ rollWeight: value ?? 0 })} suffix={t("kg")} step={0.01} />
          <NumberField
            label={t("waste")}
            value={wastePercent}
            onChange={(value) => patch({ wastePercent: value ?? 0 })}
            suffix="%"
            max={99.99}
            step={0.01}
          />
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-3 shadow-soft sm:p-4">
        <h3 className="text-sm font-bold text-slate-700">{t("profitPerKg")}</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <NumberField
            label={t("sellingPrice")}
            value={input.sellingPricePerKg}
            onChange={(value) => patch({ sellingPricePerKg: value })}
            suffix={`${state.currency}/${t("kg")}`}
            step={0.01}
            optional
          />
          <NumberField
            label={t("orderQuantity")}
            value={input.orderQuantityKg}
            onChange={(value) => patch({ orderQuantityKg: value })}
            suffix={t("kg")}
            step={0.01}
            optional
          />
          <NumberField
            label={t("targetProfitMargin")}
            value={input.targetProfitMarginPercent}
            onChange={(value) => patch({ targetProfitMarginPercent: value })}
            suffix="%"
            step={0.01}
            optional
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label={t("recipeACost")} value={formatMoney(recipeA.costPerKg, state.currency, state.language)} />
        <MetricCard label={t("recipeBCost")} value={formatMoney(recipeB.costPerKg, state.currency, state.language)} />
        <MetricCard label={t("aRatio")} value={`${formatNumber(aRatio * 100, state.language, 2)}%`} />
        <MetricCard label={t("bRatio")} value={`${formatNumber(bRatio * 100, state.language, 2)}%`} />
        <MetricCard label={t("costBeforeWaste")} value={formatMoney(costBeforeWaste, state.currency, state.language)} />
        <MetricCard
          label={t("profitPerKg")}
          value={profitPerKg !== undefined ? formatMoney(profitPerKg, state.currency, state.language) : "-"}
          tone={profitPerKg !== undefined ? "warning" : "default"}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label={t("orderProfit")}
          value={totalProfit !== undefined ? formatMoney(totalProfit, state.currency, state.language) : "-"}
        />
        <MetricCard
          label={t("safeSellingPrice")}
          value={safeSellingPrice !== undefined ? formatMoney(safeSellingPrice, state.currency, state.language) : "-"}
          tone="accent"
        />
        <MetricCard
          label={t("rawKgNeeded")}
          value={wasteValid ? `${formatNumber(1 / (1 - wastePercent / 100), state.language, 3)} ${t("kg")}` : "-"}
        />
      </section>

      {warnings.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          <p className="font-bold">{t("warnings")}</p>
          <ul className="mt-2 space-y-1">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <RecipeBreakdown recipe={recipeA} />
        <RecipeBreakdown recipe={recipeB} />
      </section>
    </div>
  );
}
