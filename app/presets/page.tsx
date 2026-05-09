"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/components/AppProvider";
import { calculateRatios, formatNumber } from "@/lib/calculations";
import { localName } from "@/lib/i18n";
import type { FilmPreset } from "@/types/domain";

function createPreset(): FilmPreset {
  return {
    id: `preset-${Date.now().toString(36)}`,
    name: { en: "New preset", ar: "مقاس جديد" },
    widthMm: 1000,
    thicknessMicron: 1,
    densityGcm3: 0.92,
    thicknessGauge: "Default",
    drawA: 10,
    drawB: 45,
    rollWeight: 55,
    wastePercent: 1,
    notes: ""
  };
}

function toNonNegativeNumber(value: string) {
  return Math.max(0, Number(value) || 0);
}

function ratioFor(drawA: number, drawB: number) {
  if (drawA <= 0 || drawB <= 0) {
    return { aRatio: 0, bRatio: 0 };
  }

  return calculateRatios(drawA, drawB);
}

export default function PresetsPage() {
  const { state, setState, t } = useApp();
  const [saveMessage, setSaveMessage] = useState("");

  const updatePreset = (id: string, patch: Partial<FilmPreset>) => {
    setSaveMessage("");
    setState((current) => ({
      ...current,
      presets: current.presets.map((preset) => (preset.id === id ? { ...preset, ...patch } : preset))
    }));
  };

  const updatePresetName = (preset: FilmPreset, name: string) => {
    updatePreset(preset.id, {
      name: {
        ...preset.name,
        en: name,
        ar: name
      }
    });
  };

  const addPreset = () => {
    setSaveMessage("");
    setState((current) => ({ ...current, presets: [...current.presets, createPreset()] }));
  };

  const removePreset = (id: string) => {
    setSaveMessage("");
    setState((current) => ({ ...current, presets: current.presets.filter((preset) => preset.id !== id) }));
  };

  const savePresets = () => {
    setState((current) => ({ ...current, presets: [...current.presets] }));
    setSaveMessage(t("changesSaved"));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("presets")}
        eyebrow={t("materialOnly")}
        action={
          <div className="grid gap-2 sm:flex">
            <button
              type="button"
              onClick={addPreset}
              className="rounded-lg border border-line bg-white px-4 py-3 text-sm font-bold text-ink hover:bg-slate-100"
            >
              {t("addPreset")}
            </button>
            <button
              type="button"
              onClick={savePresets}
              className="rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white"
            >
              {t("save")}
            </button>
          </div>
        }
      />

      {saveMessage && (
        <section className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-900">
          {saveMessage}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        {state.presets.map((preset) => {
          const drawA = preset.drawA ?? 0;
          const drawB = preset.drawB ?? 0;
          const rollWeight = preset.rollWeight ?? 0;
          const { aRatio, bRatio } = ratioFor(drawA, drawB);
          const drawTotal = drawA + drawB;
          const drawMismatch = Math.abs(drawTotal - rollWeight) > 0.000001;

          return (
            <section key={preset.id} className="rounded-lg border border-line bg-white p-3 shadow-soft sm:p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                <label>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {t("presetName")}
                  </span>
                  <input
                    value={localName(preset.name, state.language)}
                    onChange={(event) => updatePresetName(preset, event.target.value)}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-semibold outline-none focus:border-accent"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removePreset(preset.id)}
                  className="self-end rounded-lg border border-red-200 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
                >
                  {t("deletePreset")}
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <label>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {t("thicknessGauge")}
                  </span>
                  <input
                    value={preset.thicknessGauge ?? ""}
                    onChange={(event) => updatePreset(preset.id, { thicknessGauge: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-semibold outline-none focus:border-accent"
                  />
                </label>
                <label>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("aDraw")}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.01}
                    value={drawA}
                    onChange={(event) => updatePreset(preset.id, { drawA: toNonNegativeNumber(event.target.value) })}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-bold outline-none focus:border-accent"
                  />
                </label>
                <label>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("bDraw")}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.01}
                    value={drawB}
                    onChange={(event) => updatePreset(preset.id, { drawB: toNonNegativeNumber(event.target.value) })}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-bold outline-none focus:border-accent"
                  />
                </label>
                <label>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {t("rollWeight")}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.01}
                    value={rollWeight}
                    onChange={(event) =>
                      updatePreset(preset.id, { rollWeight: toNonNegativeNumber(event.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-bold outline-none focus:border-accent"
                  />
                </label>
                <label>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("waste")}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={99.99}
                    step={0.01}
                    value={preset.wastePercent ?? 0}
                    onChange={(event) =>
                      updatePreset(preset.id, {
                        wastePercent: Math.min(99.99, toNonNegativeNumber(event.target.value))
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-bold outline-none focus:border-accent"
                  />
                </label>
                <label>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("notes")}</span>
                  <input
                    value={preset.notes ?? ""}
                    onChange={(event) => updatePreset(preset.id, { notes: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-3 font-semibold outline-none focus:border-accent"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("aRatio")}</p>
                  <p className="mt-1 text-xl font-black text-ink">
                    {formatNumber(aRatio * 100, state.language, 2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("bRatio")}</p>
                  <p className="mt-1 text-xl font-black text-ink">
                    {formatNumber(bRatio * 100, state.language, 2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("total")}</p>
                  <p className="mt-1 text-xl font-black text-ink">
                    {formatNumber(drawTotal, state.language, 2)} {t("kg")}
                  </p>
                </div>
              </div>

              {drawMismatch && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                  {t("drawMismatchWarning")}
                </p>
              )}
            </section>
          );
        })}

        {state.presets.length === 0 && (
          <p className="rounded-lg border border-line bg-white px-4 py-6 text-center text-sm font-semibold text-slate-500">
            {t("noPresets")}
          </p>
        )}
      </section>
    </div>
  );
}
