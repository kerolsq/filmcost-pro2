"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  IconCalculator,
  IconBookmark,
  IconCopy,
} from "@tabler/icons-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { InputField } from "@/components/ui/InputField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { RatioBar } from "@/components/ui/RatioBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { DetailRow } from "@/components/ui/DetailRow";
import { Toast } from "@/components/ui/Toast";
import { SideMenu, type MenuItem } from "@/components/ui/SideMenu";
import { calculateSetup, getSetupWarnings, calculateRatios } from "@/lib/calculations";
import type { AppState, RawMaterial, Recipe, CalculatorResult } from "@/types/domain";
import {
  IconHome,
  IconFlask,
  IconPackage,
  IconHistory,
  IconSettings,
} from "@tabler/icons-react";

interface StoredMaterial {
  id: string;
  name: string;
  pricePerKg: number;
  scientificName?: string;
  marketNameAr?: string;
  scientificNameEn?: string;
  usage?: string;
  category?: string;
}

interface StoredRecipe {
  id: string;
  name: string;
  type: "A" | "B";
  extruder?: "A" | "B";
  lines: { materialId: string; percentage: number }[];
}

interface StoredSettings {
  defaultWaste: number;
  currency: string;
}

function buildAppState(
  materials: StoredMaterial[],
  recipes: StoredRecipe[]
): AppState {
  const appMaterials: RawMaterial[] = materials.map((m) => ({
    id: m.id,
    marketNameAr: m.marketNameAr ?? m.name,
    scientificNameEn: m.scientificNameEn ?? m.scientificName ?? m.name,
    name: { en: m.scientificNameEn ?? m.name, ar: m.marketNameAr ?? m.name },
    pricePerKg: m.pricePerKg,
    usage: (m.usage as RawMaterial["usage"]) ?? "A+B",
    category: (m.category as RawMaterial["category"]) ?? "Other",
  }));

  const appRecipes: Recipe[] = recipes.map((r) => ({
    id: r.id,
    name: { en: r.name, ar: r.name },
    extruder: (r.extruder ?? r.type) as "A" | "B",
    lines: r.lines,
  }));

  return {
    language: "ar",
    currency: "EGP",
    materialNameDisplayMode: "marketOnly",
    materials: appMaterials,
    recipes: appRecipes,
    presets: [],
    calculator: {
      recipeAId: recipes.find((r) => r.type === "A")?.id ?? "",
      recipeBId: recipes.find((r) => r.type === "B")?.id ?? "",
      presetId: "",
      aShare: 10,
      bShare: 45,
      rollWeight: 0,
      wastePercent: 1,
    },
    recentCalculations: [],
    compare: {
      left: { recipeAId: "", recipeBId: "", presetId: "", aShare: 0, bShare: 0, rollWeight: 0, wastePercent: 1 },
      right: { recipeAId: "", recipeBId: "", presetId: "", aShare: 0, bShare: 0, rollWeight: 0, wastePercent: 1 },
    },
  };
}

const menuItems: MenuItem[] = [
  { label: "الحاسبة الرئيسية", icon: <IconHome size={20} />, href: "/", active: true },
  { label: "الخلطات", icon: <IconFlask size={20} />, href: "/recipes" },
  { label: "الخامات والأسعار", icon: <IconPackage size={20} />, href: "/raw-materials" },
  { label: "سجل الحسابات", icon: <IconHistory size={20} />, href: "/history" },
  { label: "الإعدادات", icon: <IconSettings size={20} />, href: "/settings" },
];

type ExtendedResult = CalculatorResult & { aRatio?: number; bRatio?: number };

export default function CalculatorPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [recipes, setRecipes] = useState<StoredRecipe[]>([]);
  const [, setSettings] = useState<StoredSettings>({ defaultWaste: 1, currency: "جنيه مصري" });
  const [currency, setCurrency] = useState("جنيه");

  const [selectedRecipeA, setSelectedRecipeA] = useState("");
  const [selectedRecipeB, setSelectedRecipeB] = useState("");
  const [massA, setMassA] = useState("10");
  const [massB, setMassB] = useState("45");
  const [wastePercent, setWastePercent] = useState("1");

  const [result, setResult] = useState<ExtendedResult | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const showToastMsg = useCallback((msg: string) => {
    setToastMessage(msg);
    setShowToast((v) => !v);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  useEffect(() => {
    const done = localStorage.getItem("filmcost_onboarding_done");
    if (!done) {
      router.replace("/onboarding");
      return;
    }

    const rawMaterials = localStorage.getItem("filmcost_materials");
    const rawRecipes = localStorage.getItem("filmcost_recipes");
    const rawSettings = localStorage.getItem("filmcost_settings");

    if (!rawMaterials || !rawRecipes) {
      router.replace("/onboarding");
      return;
    }

    const materials: StoredMaterial[] = JSON.parse(rawMaterials);
    const storedRecipes: StoredRecipe[] = JSON.parse(rawRecipes);
    const storedSettings: StoredSettings = rawSettings ? JSON.parse(rawSettings) : { defaultWaste: 1, currency: "جنيه مصري" };

    setRecipes(storedRecipes);
    setSettings(storedSettings);
    setCurrency(storedSettings.currency);
    setWastePercent(String(storedSettings.defaultWaste ?? 1));

    const state = buildAppState(materials, storedRecipes);
    setAppState(state);

    const defaultA = storedRecipes.find((r) => r.type === "A")?.id ?? "";
    const defaultB = storedRecipes.find((r) => r.type === "B")?.id ?? "";
    setSelectedRecipeA(defaultA);
    setSelectedRecipeB(defaultB);
  }, [router]);

  const liveRatios = calculateRatios(parseFloat(massA) || 0, parseFloat(massB) || 0);

  function handleCalculate() {
    if (!appState) return;

    const input = {
      recipeAId: selectedRecipeA,
      recipeBId: selectedRecipeB,
      presetId: "",
      aShare: parseFloat(massA) || 0,
      bShare: parseFloat(massB) || 0,
      rollWeight: 0,
      wastePercent: parseFloat(wastePercent) || 0,
    };

    try {
      const state = { ...appState };
      const res = calculateSetup(state, input) as ExtendedResult;
      const warns = getSetupWarnings(state, input);
      setResult(res);
      setWarnings(warns);
    } catch (e) {
      console.error(e);
    }
  }

  function handleSave() {
    if (!result) return;
    const history = JSON.parse(localStorage.getItem("filmcost_history") ?? "[]");
    const entry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      recipeAName: recipes.find((r) => r.id === selectedRecipeA)?.name ?? "",
      recipeBName: recipes.find((r) => r.id === selectedRecipeB)?.name ?? "",
      massA: parseFloat(massA),
      massB: parseFloat(massB),
      wastePercent: parseFloat(wastePercent),
      result: { costPerSaleableKg: result.costPerSaleableKg, blendCostPerKg: result.blendCostPerKg },
    };
    history.unshift(entry);
    localStorage.setItem("filmcost_history", JSON.stringify(history.slice(0, 50)));
    showToastMsg("تم الحفظ ✓");
  }

  function handleCopy() {
    if (!result) return;
    const aPercent = Math.round((liveRatios.aRatio) * 100);
    const bPercent = Math.round((liveRatios.bRatio) * 100);
    const text = `تكلفة الكيلو: ${result.costPerSaleableKg.toFixed(2)} ${currency}\nخلطة A: ${aPercent}% / خلطة B: ${bPercent}%\nالهالك: ${wastePercent}%`;
    navigator.clipboard.writeText(text).then(() => showToastMsg("تم النسخ ✓"));
  }

  const recipesA = recipes.filter((r) => r.type === "A");
  const recipesB = recipes.filter((r) => r.type === "B");

  if (!appState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <>
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} items={menuItems} />
      <div className="min-h-screen bg-gray-50 max-w-[440px] mx-auto">
        <PageHeader
          title="حاسبة التكلفة"
          icon={<IconCalculator size={24} />}
          onMenuClick={() => setMenuOpen(true)}
        />

        <div className="p-4 space-y-1">
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1 font-medium">خلطة A</label>
            <select
              className="w-full h-[52px] border border-gray-200 rounded-xl px-4 bg-white text-base"
              value={selectedRecipeA}
              onChange={(e) => setSelectedRecipeA(e.target.value)}
            >
              <option value="">اختر خلطة A</option>
              {recipesA.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1 font-medium">خلطة B</label>
            <select
              className="w-full h-[52px] border border-gray-200 rounded-xl px-4 bg-white text-base"
              value={selectedRecipeB}
              onChange={(e) => setSelectedRecipeB(e.target.value)}
            >
              <option value="">اختر خلطة B</option>
              {recipesB.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <hr className="border-gray-100 my-2" />

          <InputField
            label="كمية A المستهلكة"
            value={massA}
            onChange={setMassA}
            unit="كجم"
          />
          <InputField
            label="كمية B المستهلكة"
            value={massB}
            onChange={setMassB}
            unit="كجم"
          />

          <RatioBar aRatio={liveRatios.aRatio} bRatio={liveRatios.bRatio} />

          <InputField
            label="نسبة الهالك"
            value={wastePercent}
            onChange={setWastePercent}
            unit="%"
          />

          <PrimaryButton onClick={handleCalculate} icon={<IconCalculator size={20} />}>
            احسب التكلفة
          </PrimaryButton>

          {result && (
            <div className="pt-2 space-y-3">
              {warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <p className="text-warning font-semibold text-sm mb-1">تحذيرات</p>
                  {warnings.map((w, i) => (
                    <p key={i} className="text-yellow-700 text-xs">{w}</p>
                  ))}
                </div>
              )}

              <ResultCard
                value={result.costPerSaleableKg}
                label="تكلفة الكيلو بعد الهالك"
                unit={`${currency} / كجم`}
              />

              <div className="bg-white rounded-xl px-4 shadow-sm border border-gray-100">
                <DetailRow
                  label="تكلفة كيلو خلطة A"
                  value={`${result.recipeA.costPerKg.toFixed(2)} ${currency}`}
                />
                <DetailRow
                  label="تكلفة كيلو خلطة B"
                  value={`${result.recipeB.costPerKg.toFixed(2)} ${currency}`}
                />
                <DetailRow
                  label="قبل الهالك"
                  value={`${result.blendCostPerKg.toFixed(2)} ${currency}`}
                />
                <DetailRow
                  label="تكلفة الهالك"
                  value={`+${result.wasteCostPerKg.toFixed(2)} ${currency}`}
                  color="warning"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <SecondaryButton onClick={handleSave} icon={<IconBookmark size={18} />}>
                  احفظ
                </SecondaryButton>
                <SecondaryButton onClick={handleCopy} icon={<IconCopy size={18} />}>
                  انسخ
                </SecondaryButton>
              </div>
            </div>
          )}
        </div>

        <Toast message={toastMessage} show={showToast} />
      </div>
    </>
  );
}
