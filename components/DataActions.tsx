"use client";

import { useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { exportAppStateAsJson, importAppStateFromJson } from "@/lib/app-json";

interface DataActionsProps {
  compact?: boolean;
}

function downloadJson(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function DataActions({ compact = false }: DataActionsProps) {
  const { state, setState, resetDemo, t } = useApp();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const buttonClass = compact
    ? "inline-flex rounded-lg border border-line bg-white px-4 py-3 text-sm font-bold text-ink"
    : "w-full rounded-lg border border-line bg-white px-4 py-3 text-sm font-bold text-ink hover:bg-panel sm:w-auto";

  const exportData = () => {
    downloadJson("filmcost-pro-data.json", exportAppStateAsJson(state));
    setError("");
    setMessage(t("exportComplete"));
  };

  const importData = async (file: File | undefined) => {
    setMessage("");
    setError("");

    if (!file) {
      return;
    }

    if (!window.confirm(t("importReplaceWarning"))) {
      return;
    }

    try {
      const text = await file.text();
      const importedState = importAppStateFromJson(text);
      setState(importedState);
      setMessage(t("importComplete"));
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : t("importFailed"));
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const resetData = () => {
    setMessage("");
    setError("");

    if (!window.confirm(t("resetDemoWarning"))) {
      return;
    }

    resetDemo();
    setMessage(t("resetComplete"));
  };

  return (
    <div className="space-y-3">
      <div className={compact ? "flex flex-wrap gap-2" : "grid gap-2 sm:flex sm:flex-wrap"}>
        <button type="button" onClick={exportData} className={buttonClass}>
          {t("export")}
        </button>
        <button type="button" onClick={() => inputRef.current?.click()} className={buttonClass}>
          {t("import")}
        </button>
        <button
          type="button"
          onClick={resetData}
          className={
            compact
              ? "inline-flex rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900"
              : "w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 hover:bg-amber-100 sm:w-auto"
          }
        >
          {t("resetDemo")}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        onChange={(event) => void importData(event.target.files?.[0])}
        className="hidden"
      />
      {message ? <p className="text-sm font-semibold text-teal-700">{message}</p> : null}
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
