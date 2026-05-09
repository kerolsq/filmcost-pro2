"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { DataActions } from "@/components/DataActions";
import { MaterialName } from "@/components/MaterialName";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { calculateSetup, formatMoney, formatNumber, getSetupWarnings } from "@/lib/calculations";
import { localName } from "@/lib/i18n";

export default function DashboardPage() {
  const { state, t } = useApp();
  const result = calculateSetup(state, state.calculator);
  const warnings = getSetupWarnings(state, state.calculator);
  const drawTotal = state.calculator.aShare + state.calculator.bShare;
  const aRatio = drawTotal > 0 ? state.calculator.aShare / drawTotal : 0;
  const bRatio = drawTotal > 0 ? state.calculator.bShare / drawTotal : 0;
  const mostExpensiveMaterial =
    [...state.materials].sort((first, second) => second.pricePerKg - first.pricePerKg)[0] ?? null;
  const profitPerKg =
    state.calculator.sellingPricePerKg !== undefined
      ? state.calculator.sellingPricePerKg - result.costPerSaleableKg
      : undefined;
  const lastCalculation = state.recentCalculations[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard")}
        eyebrow={t("materialOnly")}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/calculator" className="inline-flex rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white">
              {t("openCalculator")}
            </Link>
            <DataActions compact />
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label={t("defaultSetupCost")}
          value={formatMoney(result.costPerSaleableKg, state.currency, state.language)}
          detail={t("costAfterWaste")}
          tone="accent"
        />
        <MetricCard
          label={t("recipeACost")}
          value={formatMoney(result.recipeA.costPerKg, state.currency, state.language)}
        />
        <MetricCard
          label={t("recipeBCost")}
          value={formatMoney(result.recipeB.costPerKg, state.currency, state.language)}
        />
        <MetricCard label={t("aRatio")} value={`${formatNumber(aRatio * 100, state.language, 2)}%`} />
        <MetricCard label={t("bRatio")} value={`${formatNumber(bRatio * 100, state.language, 2)}%`} />
        <MetricCard
          label={t("mostExpensiveMaterial")}
          value={
            mostExpensiveMaterial ? (
              <span className="block text-lg">
                <MaterialName material={mostExpensiveMaterial} />
              </span>
            ) : (
              "-"
            )
          }
          detail={
            mostExpensiveMaterial
              ? formatMoney(mostExpensiveMaterial.pricePerKg, state.currency, state.language)
              : undefined
          }
        />
        <MetricCard
          label={t("lastCalculation")}
          value={
            lastCalculation
              ? formatMoney(lastCalculation.costAfterWaste, state.currency, state.language)
              : formatMoney(result.costPerSaleableKg, state.currency, state.language)
          }
          detail={lastCalculation ? new Date(lastCalculation.createdAt).toLocaleString() : t("currentSetup")}
        />
        <MetricCard
          label={t("profitPerKg")}
          value={profitPerKg !== undefined ? formatMoney(profitPerKg, state.currency, state.language) : "-"}
          tone={profitPerKg !== undefined ? "warning" : "default"}
        />
        <MetricCard
          label={t("warningsCount")}
          value={formatNumber(warnings.length, state.language, 0)}
          detail={warnings.length > 0 ? t("warnings") : t("ready")}
          tone={warnings.length > 0 ? "warning" : "accent"}
        />
      </section>

      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">{t("recentCalculations")}</h2>
          <span className="rounded-md bg-panel px-2 py-1 text-xs font-bold text-slate-600">
            {formatNumber(state.recentCalculations.length, state.language, 0)}
          </span>
        </div>

        {state.recentCalculations.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="py-2">{t("lastCalculation")}</th>
                  <th className="py-2">{t("recipeA")}</th>
                  <th className="py-2">{t("recipeB")}</th>
                  <th className="py-2">{t("aDraw")}</th>
                  <th className="py-2">{t("bDraw")}</th>
                  <th className="py-2">{t("waste")}</th>
                  <th className="py-2 text-right">{t("costAfterWaste")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {state.recentCalculations.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 font-semibold text-slate-700">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 font-semibold text-ink">{localName(item.recipeAName, state.language)}</td>
                    <td className="py-3 font-semibold text-ink">{localName(item.recipeBName, state.language)}</td>
                    <td className="py-3 tabular-nums">
                      {formatNumber(item.input.aShare, state.language, 2)} {t("kg")}
                    </td>
                    <td className="py-3 tabular-nums">
                      {formatNumber(item.input.bShare, state.language, 2)} {t("kg")}
                    </td>
                    <td className="py-3 tabular-nums">
                      {formatNumber(item.input.wastePercent, state.language, 2)}%
                    </td>
                    <td className="py-3 text-right font-black tabular-nums text-ink">
                      {formatMoney(item.costAfterWaste, state.currency, state.language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-panel p-4 text-sm font-semibold text-slate-600">
            {t("noRecentCalculations")}
          </p>
        )}
      </section>
    </div>
  );
}
