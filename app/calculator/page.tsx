"use client";

import { CalculatorPanel } from "@/components/CalculatorPanel";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/components/AppProvider";
import { calculateSetup } from "@/lib/calculations";
import type { AppState, CalculatorInput } from "@/types/domain";

function addRecentCalculation(current: AppState, calculator: CalculatorInput): AppState {
  const nextState = { ...current, calculator };
  const result = calculateSetup(nextState, calculator);
  const recipeAName = result.recipeA.recipe?.name ?? { en: "-", ar: "-" };
  const recipeBName = result.recipeB.recipe?.name ?? { en: "-", ar: "-" };
  const signature = JSON.stringify({
    recipeAId: calculator.recipeAId,
    recipeBId: calculator.recipeBId,
    aShare: calculator.aShare,
    bShare: calculator.bShare,
    wastePercent: calculator.wastePercent,
    costAfterWaste: Number(result.costPerSaleableKg.toFixed(4))
  });
  const recentCalculations = [
    {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      input: calculator,
      costAfterWaste: result.costPerSaleableKg,
      recipeAName,
      recipeBName
    },
    ...(current.recentCalculations ?? []).filter((item) => {
      const itemSignature = JSON.stringify({
        recipeAId: item.input.recipeAId,
        recipeBId: item.input.recipeBId,
        aShare: item.input.aShare,
        bShare: item.input.bShare,
        wastePercent: item.input.wastePercent,
        costAfterWaste: Number(item.costAfterWaste.toFixed(4))
      });

      return itemSignature !== signature;
    })
  ].slice(0, 8);

  return {
    ...nextState,
    recentCalculations
  };
}

export default function CalculatorPage() {
  const { state, setState, t } = useApp();

  return (
    <div className="space-y-6">
      <PageHeader title={t("calculator")} eyebrow={t("materialOnly")} />
      <CalculatorPanel
        input={state.calculator}
        onChange={(calculator) => setState((current) => addRecentCalculation(current, calculator))}
      />
    </div>
  );
}
