"use client";

import { LanguageToggle } from "@/components/LanguageToggle";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/components/AppProvider";
import { DataActions } from "@/components/DataActions";
import type { MaterialNameDisplayMode } from "@/types/domain";

const displayModes: MaterialNameDisplayMode[] = ["both", "marketOnly", "englishOnly"];

export default function SettingsPage() {
  const { state, setState, t } = useApp();

  return (
    <div className="space-y-6">
      <PageHeader title={t("settings")} eyebrow={t("materialOnly")} />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <h2 className="text-lg font-bold text-ink">{t("language")}</h2>
          <div className="mt-4">
            <LanguageToggle />
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <h2 className="text-lg font-bold text-ink">{t("currency")}</h2>
          <input
            value={state.currency}
            onChange={(event) => setState((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
            className="mt-4 w-full rounded-lg border border-line px-3 py-3 text-lg font-bold outline-none focus:border-accent"
          />
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <h2 className="text-lg font-bold text-ink">{t("materialNameDisplayMode")}</h2>
          <select
            value={state.materialNameDisplayMode}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                materialNameDisplayMode: event.target.value as MaterialNameDisplayMode
              }))
            }
            className="mt-4 w-full rounded-lg border border-line bg-white px-3 py-3 text-lg font-bold outline-none focus:border-accent"
          >
            {displayModes.map((mode) => (
              <option key={mode} value={mode}>
                {mode === "marketOnly"
                  ? t("marketOnly")
                  : mode === "englishOnly"
                    ? t("englishOnly")
                    : t("bothMaterialNames")}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <h2 className="text-lg font-bold text-ink">{t("data")}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">{t("localStorage")}</p>
          <div className="mt-4">
            <DataActions />
          </div>
        </div>
      </section>
    </div>
  );
}
