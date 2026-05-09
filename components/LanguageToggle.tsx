"use client";

import { useApp } from "@/components/AppProvider";

export function LanguageToggle() {
  const { state, setLanguage, t } = useApp();

  return (
    <div className="inline-grid grid-cols-2 rounded-lg border border-line bg-white p-1 text-sm font-semibold">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-md px-3 py-2 transition ${
          state.language === "en" ? "bg-ink text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        {t("english")}
      </button>
      <button
        type="button"
        onClick={() => setLanguage("ar")}
        className={`rounded-md px-3 py-2 transition ${
          state.language === "ar" ? "bg-ink text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        {t("arabic")}
      </button>
    </div>
  );
}
