"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconRocket,
  IconPlus,
  IconTrash,
  IconChevronLeft,
  IconCheck,
} from "@tabler/icons-react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { InputField } from "@/components/ui/InputField";

interface OnboardingMaterial {
  id: string;
  name: string;
  pricePerKg: string;
  scientificName: string;
}

interface RecipeIngredient {
  materialId: string;
  percentage: string;
}

interface OnboardingRecipe {
  name: string;
  ingredients: RecipeIngredient[];
}

const STEPS = ["مرحبًا", "الخامات", "خلطة A", "خلطة B", "الإعدادات"];

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1 py-4 px-4">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-1">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < current
                ? "bg-primary text-white"
                : i === current
                ? "bg-primary text-white ring-4 ring-primary-light"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {i < current ? <IconCheck size={14} /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-6 ${i < current ? "bg-primary" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [materials, setMaterials] = useState<OnboardingMaterial[]>([
    { id: "m1", name: "", pricePerKg: "", scientificName: "" },
    { id: "m2", name: "", pricePerKg: "", scientificName: "" },
  ]);

  const [recipeA, setRecipeA] = useState<OnboardingRecipe>({
    name: "خلطة A",
    ingredients: [{ materialId: "", percentage: "" }],
  });

  const [recipeB, setRecipeB] = useState<OnboardingRecipe>({
    name: "خلطة B",
    ingredients: [{ materialId: "", percentage: "" }],
  });

  const [settings, setSettings] = useState({ defaultWaste: "1", currency: "جنيه مصري" });

  const addMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      { id: `m${Date.now()}`, name: "", pricePerKg: "", scientificName: "" },
    ]);
  };

  const removeMaterial = (id: string) => {
    if (materials.length <= 2) return;
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMaterial = (id: string, field: keyof OnboardingMaterial, value: string) => {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const validMaterials = materials.filter((m) => m.name.trim() && m.pricePerKg);
  const canProceedStep2 = validMaterials.length >= 2;

  function recipeTotal(recipe: OnboardingRecipe) {
    return recipe.ingredients.reduce((sum, ing) => sum + (parseFloat(ing.percentage) || 0), 0);
  }

  function updateRecipeIngredient(
    recipe: OnboardingRecipe,
    setRecipe: (r: OnboardingRecipe) => void,
    index: number,
    field: keyof RecipeIngredient,
    value: string
  ) {
    const updated = [...recipe.ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipe({ ...recipe, ingredients: updated });
  }

  function addIngredient(recipe: OnboardingRecipe, setRecipe: (r: OnboardingRecipe) => void) {
    setRecipe({ ...recipe, ingredients: [...recipe.ingredients, { materialId: "", percentage: "" }] });
  }

  function removeIngredient(recipe: OnboardingRecipe, setRecipe: (r: OnboardingRecipe) => void, index: number) {
    if (recipe.ingredients.length <= 1) return;
    setRecipe({ ...recipe, ingredients: recipe.ingredients.filter((_, i) => i !== index) });
  }

  function RecipeStep({
    recipe,
    setRecipe,
    subtitle,
  }: {
    recipe: OnboardingRecipe;
    setRecipe: (r: OnboardingRecipe) => void;
    subtitle: string;
  }) {
    const total = recipeTotal(recipe);
    const isValid = Math.abs(total - 100) < 0.01 && recipe.ingredients.every((i) => i.materialId);

    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-500">{subtitle}</p>
        <InputField
          label="اسم الخلطة"
          value={recipe.name}
          onChange={(v) => setRecipe({ ...recipe, name: v })}
          type="text"
        />
        <div className="space-y-2">
          {recipe.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">الخامة</label>
                <select
                  className="w-full h-[44px] border border-gray-200 rounded-xl px-3 bg-white text-sm"
                  value={ing.materialId}
                  onChange={(e) => updateRecipeIngredient(recipe, setRecipe, i, "materialId", e.target.value)}
                >
                  <option value="">اختر خامة</option>
                  {validMaterials.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs text-gray-500 mb-1">النسبة %</label>
                <input
                  type="number"
                  value={ing.percentage}
                  onChange={(e) => updateRecipeIngredient(recipe, setRecipe, i, "percentage", e.target.value)}
                  className="w-full h-[44px] border border-gray-200 rounded-xl px-3 text-sm text-center"
                  placeholder="0"
                />
              </div>
              <button
                onClick={() => removeIngredient(recipe, setRecipe, i)}
                className="h-[44px] px-2 text-gray-400 hover:text-danger"
              >
                <IconTrash size={18} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => addIngredient(recipe, setRecipe)}
          className="flex items-center gap-2 text-primary text-sm font-medium py-2"
        >
          <IconPlus size={16} /> أضف خامة
        </button>
        <div
          className={`flex justify-between items-center p-3 rounded-xl text-sm font-medium ${
            Math.abs(total - 100) < 0.01
              ? "bg-primary-light text-primary"
              : total > 100
              ? "bg-red-50 text-danger"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          <span>المجموع الكلي</span>
          <span>{total.toFixed(1)}%</span>
        </div>
        {!isValid && (
          <p className="text-xs text-gray-400 text-center">المجموع لازم يساوي 100% وكل الخامات لازم تتحدد</p>
        )}
        <PrimaryButton
          onClick={() => setStep((s) => s + 1)}
          disabled={!isValid}
        >
          التالي
        </PrimaryButton>
      </div>
    );
  }

  function handleFinish() {
    const savedMaterials = validMaterials.map((m) => ({
      id: m.id,
      name: m.name,
      pricePerKg: parseFloat(m.pricePerKg) || 0,
      scientificName: m.scientificName,
      marketNameAr: m.name,
      scientificNameEn: m.scientificName || m.name,
      usage: "A+B",
      category: "Other",
    }));

    const savedRecipes = [
      {
        id: "recipe-a",
        name: recipeA.name,
        type: "A",
        extruder: "A",
        lines: recipeA.ingredients
          .filter((i) => i.materialId)
          .map((i) => ({ materialId: i.materialId, percentage: parseFloat(i.percentage) || 0 })),
      },
      {
        id: "recipe-b",
        name: recipeB.name,
        type: "B",
        extruder: "B",
        lines: recipeB.ingredients
          .filter((i) => i.materialId)
          .map((i) => ({ materialId: i.materialId, percentage: parseFloat(i.percentage) || 0 })),
      },
    ];

    localStorage.setItem("filmcost_materials", JSON.stringify(savedMaterials));
    localStorage.setItem("filmcost_recipes", JSON.stringify(savedRecipes));
    localStorage.setItem("filmcost_settings", JSON.stringify({
      defaultWaste: parseFloat(settings.defaultWaste) || 1,
      currency: settings.currency,
    }));
    localStorage.setItem("filmcost_onboarding_done", "true");

    router.push("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-[440px] mx-auto">
      <div className="bg-primary px-4 pt-6 pb-4 text-center">
        <h1 className="text-white font-bold text-xl">فيلم كوست برو</h1>
        <p className="text-white opacity-75 text-sm mt-1">إعداد البرنامج</p>
      </div>

      <Stepper current={step} />

      <div className="flex-1 px-4 pb-8">
        {step === 0 && (
          <div className="flex flex-col items-center text-center gap-4 pt-8">
            <div className="w-24 h-24 bg-primary-light rounded-full flex items-center justify-center">
              <IconRocket size={48} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">أهلاً بك في فيلم كوست برو</h2>
            <p className="text-gray-500 text-lg">حاسبة تكلفة أكياس البلاستيك</p>
            <p className="text-gray-600 text-base leading-relaxed">
              هنرشدك خطوة بخطوة عشان تجهز برنامجك في 5 دقايق
            </p>
            <div className="w-full mt-4">
              <PrimaryButton onClick={() => setStep(1)}>ابدأ</PrimaryButton>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-gray-900">ابدأ بإضافة الخامات اللي بتشتريها</h2>
            <div className="space-y-3">
              {materials.map((m, i) => (
                <div key={m.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-medium">خامة {i + 1}</span>
                    {materials.length > 2 && (
                      <button onClick={() => removeMaterial(m.id)} className="text-danger p-1">
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>
                  <InputField
                    label="اسم الخامة"
                    value={m.name}
                    onChange={(v) => updateMaterial(m.id, "name", v)}
                    type="text"
                    placeholder="مثل: بولي إيثيلين"
                  />
                  <InputField
                    label="السعر لكل كجم"
                    value={m.pricePerKg}
                    onChange={(v) => updateMaterial(m.id, "pricePerKg", v)}
                    unit="جنيه"
                    placeholder="0.00"
                  />
                  <InputField
                    label="الاسم العلمي (اختياري)"
                    value={m.scientificName}
                    onChange={(v) => updateMaterial(m.id, "scientificName", v)}
                    type="text"
                    placeholder="مثل: LDPE"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={addMaterial}
              className="flex items-center gap-2 text-primary text-sm font-medium py-2 justify-center border-2 border-dashed border-primary rounded-xl"
            >
              <IconPlus size={18} /> أضف خامة جديدة
            </button>
            <PrimaryButton onClick={() => setStep(2)} disabled={!canProceedStep2}>
              التالي
            </PrimaryButton>
            {!canProceedStep2 && (
              <p className="text-xs text-center text-gray-400">لازم تضيف خامتين على الأقل</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">كوّن خلطة A</h2>
            <RecipeStep
              recipe={recipeA}
              setRecipe={setRecipeA}
              subtitle="خلطة A هي الطبقات الخارجية للفيلم"
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">كوّن خلطة B</h2>
            <RecipeStep
              recipe={recipeB}
              setRecipe={setRecipeB}
              subtitle="خلطة B هي الطبقة الوسطى، عادة فيها أوميا"
            />
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-gray-900">خطوة أخيرة</h2>
            <InputField
              label="نسبة الهالك الافتراضية"
              value={settings.defaultWaste}
              onChange={(v) => setSettings((s) => ({ ...s, defaultWaste: v }))}
              unit="%"
            />
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1 font-medium">العملة</label>
              <select
                className="w-full h-[52px] border border-gray-200 rounded-xl px-4 bg-white text-base"
                value={settings.currency}
                onChange={(e) => setSettings((s) => ({ ...s, currency: e.target.value }))}
              >
                <option>جنيه مصري</option>
                <option>دولار أمريكي</option>
                <option>ريال سعودي</option>
                <option>درهم إماراتي</option>
              </select>
            </div>
            <PrimaryButton onClick={handleFinish} icon={<IconCheck size={20} />}>
              خلصت! ابدأ الحساب
            </PrimaryButton>
          </div>
        )}

        {step > 0 && step < 4 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1 text-gray-500 text-sm mt-4"
          >
            <IconChevronLeft size={16} /> رجوع
          </button>
        )}
      </div>
    </div>
  );
}
