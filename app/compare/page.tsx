"use client";

import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/components/AppProvider";
import { MaterialName } from "@/components/MaterialName";
import { calculateSetup, formatMoney, formatNumber } from "@/lib/calculations";
import { localName } from "@/lib/i18n";
import type { CalculatorInput } from "@/types/domain";

function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max,
  step = 1
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
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
          value={value}
          onChange={(event) => {
            const numericValue = Number(event.target.value);
            onChange(Math.min(max ?? numericValue, Math.max(min, numericValue || 0)));
          }}
          className="min-w-0 flex-1 rounded-lg bg-transparent px-3 py-3 text-lg font-bold outline-none"
        />
        {suffix ? <span className="px-3 py-3 text-sm font-semibold text-slate-500">{suffix}</span> : null}
      </span>
    </label>
  );
}

function SetupCard({
  title,
  input,
  onChange,
  cost,
  isCheaper
}: {
  title: string;
  input: CalculatorInput;
  onChange: (input: CalculatorInput) => void;
  cost: number;
  isCheaper: boolean;
}) {
  const { state, t } = useApp();
  const recipesA = state.recipes.filter((recipe) => recipe.extruder === "A");
  const recipesB = state.recipes.filter((recipe) => recipe.extruder === "B");
  const selectedRecipeA = state.recipes.find((recipe) => recipe.id === input.recipeAId);
  const selectedRecipeB = state.recipes.find((recipe) => recipe.id === input.recipeBId);
  const selectedMaterials = Array.from(
    new Set([
      ...(selectedRecipeA?.lines.map((line) => line.materialId) ?? []),
      ...(selectedRecipeB?.lines.map((line) => line.materialId) ?? [])
    ])
  )
    .map((materialId) => state.materials.find((material) => material.id === materialId))
    .filter((material): material is NonNullable<typeof material> => Boolean(material));
  const drawTotal = input.aShare + input.bShare;
  const aRatio = drawTotal > 0 ? input.aShare / drawTotal : 0;
  const bRatio = drawTotal > 0 ? input.bShare / drawTotal : 0;

  const patch = (updates: Partial<CalculatorInput>) => {
    const next = { ...input, ...updates };
    onChange({ ...next, rollWeight: next.aShare + next.bShare });
  };

  return (
    <section
      className={`rounded-lg border bg-white p-4 shadow-soft ${
        isCheaper ? "border-teal-300 ring-2 ring-teal-100" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-ink">{title}</h2>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("rawMaterialsOnlyWarning")}
          </p>
        </div>
        {isCheaper ? (
          <span className="rounded-md bg-teal-100 px-2 py-1 text-xs font-black text-teal-800">
            {t("cheaper")}
          </span>
        ) : null}
      </div>

      <div className="mt-4 rounded-lg bg-panel p-4">
        <p className="text-sm font-bold text-slate-600">{t("costAfterWaste")}</p>
        <p className="mt-1 text-3xl font-black text-ink">
          {formatMoney(cost, state.currency, state.language)}
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
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
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <NumberField
          label={t("aDraw")}
          value={input.aShare}
          onChange={(value) => patch({ aShare: value })}
          suffix={t("kg")}
          min={0.01}
          step={0.01}
        />
        <NumberField
          label={t("bDraw")}
          value={input.bShare}
          onChange={(value) => patch({ bShare: value })}
          suffix={t("kg")}
          min={0.01}
          step={0.01}
        />
        <NumberField
          label={t("waste")}
          value={input.wastePercent}
          onChange={(value) => patch({ wastePercent: value })}
          suffix="%"
          max={99.99}
          step={0.01}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MetricCard label={t("aRatio")} value={`${formatNumber(aRatio * 100, state.language, 2)}%`} />
        <MetricCard label={t("bRatio")} value={`${formatNumber(bRatio * 100, state.language, 2)}%`} />
      </div>

      <div className="mt-4 rounded-lg border border-line bg-panel p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("material")}</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {selectedMaterials.map((material) => (
            <div key={material.id} className="rounded-md bg-white px-3 py-2">
              <MaterialName material={material} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ComparePage() {
  const { state, setState, t } = useApp();
  const left = calculateSetup(state, state.compare.left);
  const right = calculateSetup(state, state.compare.right);
  const orderQuantity =
    state.compare.left.orderQuantityKg ?? state.compare.right.orderQuantityKg ?? 5000;
  const signedDifference = left.costPerSaleableKg - right.costPerSaleableKg;
  const differencePerKg = Math.abs(signedDifference);
  const fullOrderDifference = differencePerKg * orderQuantity;
  const isBalanced = differencePerKg < 0.01;
  const leftIsCheaper = signedDifference < -0.01;
  const rightIsCheaper = signedDifference > 0.01;
  const cheaper = isBalanced ? t("balanced") : leftIsCheaper ? t("leftSetup") : t("rightSetup");

  const updateLeft = (leftInput: CalculatorInput) =>
    setState((current) => ({
      ...current,
      compare: {
        ...current.compare,
        left: { ...leftInput, orderQuantityKg: orderQuantity },
        right: { ...current.compare.right, orderQuantityKg: orderQuantity }
      }
    }));

  const updateRight = (rightInput: CalculatorInput) =>
    setState((current) => ({
      ...current,
      compare: {
        ...current.compare,
        left: { ...current.compare.left, orderQuantityKg: orderQuantity },
        right: { ...rightInput, orderQuantityKg: orderQuantity }
      }
    }));

  const updateOrderQuantity = (nextQuantity: number) =>
    setState((current) => ({
      ...current,
      compare: {
        left: { ...current.compare.left, orderQuantityKg: nextQuantity },
        right: { ...current.compare.right, orderQuantityKg: nextQuantity }
      }
    }));

  return (
    <div className="space-y-6">
      <PageHeader title={t("compare")} eyebrow={t("materialOnly")} />

      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="max-w-sm">
          <NumberField
            label={t("orderQuantity")}
            value={orderQuantity}
            onChange={updateOrderQuantity}
            suffix={t("kg")}
            step={1}
          />
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-4">
        <MetricCard
          label={t("leftSetup")}
          value={formatMoney(left.costPerSaleableKg, state.currency, state.language)}
          tone={leftIsCheaper || isBalanced ? "accent" : "default"}
        />
        <MetricCard
          label={t("rightSetup")}
          value={formatMoney(right.costPerSaleableKg, state.currency, state.language)}
          tone={rightIsCheaper || isBalanced ? "accent" : "default"}
        />
        <MetricCard
          label={t("differencePerKg")}
          value={formatMoney(differencePerKg, state.currency, state.language)}
          detail={t("costPerKg")}
          tone="warning"
        />
        <MetricCard
          label={t("fullOrderDifference")}
          value={formatMoney(fullOrderDifference, state.currency, state.language)}
          detail={`${formatNumber(orderQuantity, state.language, 0)} ${t("kg")}`}
          tone="warning"
        />
      </section>

      <section
        className={`rounded-lg border p-5 shadow-soft ${
          isBalanced ? "border-line bg-white" : "border-teal-200 bg-teal-50"
        }`}
      >
        <p className="text-sm font-bold text-slate-600">{t("cheaper")}</p>
        <p className="mt-1 text-3xl font-black text-ink">{cheaper}</p>
        <p className="mt-2 text-sm font-semibold text-slate-700">
          {t("difference")}: {formatMoney(differencePerKg, state.currency, state.language)} / {t("kg")} ·{" "}
          {formatMoney(fullOrderDifference, state.currency, state.language)} {t("fullOrderDifference")}
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SetupCard
          title={t("leftSetup")}
          input={state.compare.left}
          onChange={updateLeft}
          cost={left.costPerSaleableKg}
          isCheaper={leftIsCheaper || isBalanced}
        />
        <SetupCard
          title={t("rightSetup")}
          input={state.compare.right}
          onChange={updateRight}
          cost={right.costPerSaleableKg}
          isCheaper={rightIsCheaper || isBalanced}
        />
      </section>
    </div>
  );
}
