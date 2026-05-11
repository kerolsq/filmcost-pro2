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
import { InputField } from "@/components/ui/InputField";

interface OnboardingMaterial {
  id: string;
  name: string;
  pricePerKg: string;
  scientificName: string;
}

interface RecipeIngredient {
  materialId: string;
  amountKg: string;
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
    ingredients: [{ materialId: "", amountKg: "" }],
  });

  const [recipeB, setRecipeB] = useState<OnboardingRecipe>({
    name: "خلطة B",
    ingredients: [{ materialId: "", amountKg: "" }],
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

  function calcPercentages(ingredients: RecipeIngredient[]) {
    const totalKg = ingredients.reduce((sum, ing) => sum + (parseFloat(ing.amountKg) || 0), 0);
    return ingredients.map((ing) => {
      const kg = parseFloat(ing.amountKg) || 0;
      return totalKg > 0 ? (kg / totalKg) * 100 : 0;
    });
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
    const percentages = calcPercentages(recipe.ingredients);
    const totalKg = recipe.ingredients.reduce((sum, ing) => sum + (parseFloat(ing.amountKg) || 0), 0);
    const isValid =
      totalKg > 0 &&
      recipe.ingredients.every((ing) => ing.materialId && parseFloat(ing.amountKg) > 0);

    function setIngredient(index: number, field: keyof RecipeIngredient, value: string) {
      const updated = recipe.ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      );
      setRecipe({ ...recipe, ingredients: updated });
    }

    function addIngredient() {
      setRecipe({ ...recipe, ingredients: [...recipe.ingredients, { materialId: "", amountKg: "" }] });
    }

    function removeIngredient(index: number) {
      if (recipe.ingredients.length <= 1) return;
      setRecipe({ ...recipe, ingredients: recipe.ingredients.filter((_, i) => i !== index) });
    }

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
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <select
                  className="flex-1 h-[42px] border border-gray-200 rounded-lg px-3 bg-white text-sm"
                  value={ing.materialId}
                  onChange={(e) => setIngredient(i, "materialId", e.target.value)}
                >
                  <option value="">اختر خامة</option>
                  {validMaterials.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => removeIngredient(i)}
                  className="h-[42px] w-[42px] flex items-center justify-center text-gray-300 hover:text-danger rounded-lg flex-shrink-0"
                >
                  <IconTrash size={17} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">الكمية</label>
                  <div className="flex items-center border border-gray-200 rounded-lg h-[42px] overflow-hidden">
                    <input
                      type="number"
                      value={ing.amountKg}
                      onChange={(e) => setIngredient(i, "amountKg", e.target.value)}
                      className="flex-1 px-3 text-base font-medium text-gray-900 outline-none bg-white h-full"
                      placeholder="0"
                      min="0"
                    />
                    <span className="px-2 text-xs text-gray-400 bg-gray-50 h-full flex items-center border-r border-gray-200">
                      كجم
                    </span>
                  </div>
                </div>

                <div className="w-[72px] text-center">
                  <label className="block text-xs text-gray-400 mb-1">النسبة</label>
                  <div
                    className={`h-[42px] rounded-lg flex items-center justify-center text-sm font-bold ${
                      percentages[i] > 0
                        ? "bg-primary-light text-primary"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {percentages[i] > 0 ? `${percentages[i].toFixed(1)}%` : "—"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addIngredient}
          className="flex items-center gap-2 text-primary text-sm font-medium py-2 justify-center border-2 border-dashed border-primary-light rounded-xl"
        >
          <IconPlus size={16} /> أضف خامة
        </button>

        <div className={`flex justify-between items-center p-3 rounded-xl text-sm font-medium ${
          isValid ? "bg-primary-light text-primary" : "bg-gray-100 text-gray-500"
        }`}>
          <span>الإجمالي</span>
          <span>{totalKg > 0 ? `${totalKg.toFixed(2)} كجم — 100%` : "—"}</span>
        </div>

        {!isValid && totalKg > 0 && (
          <p className="text-xs text-gray-400 text-center">اختر خامة لكل صف وأدخل كمية أكبر من صفر</p>
        )}

        <PrimaryButton onClick={() => setStep((s) => s + 1)} disabled={!isValid}>
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

    function toLines(ingredients: RecipeIngredient[]) {
      const valid = ingredients.filter((i) => i.materialId && parseFloat(i.amountKg) > 0);
      const totalKg = valid.reduce((sum, i) => sum + parseFloat(i.amountKg), 0);
      return valid.map((i) => ({
        materialId: i.materialId,
        percentage: totalKg > 0 ? (parseFloat(i.amountKg) / totalKg) * 100 : 0,
      }));
    }

    const savedRecipes = [
      { id: "recipe-a", name: recipeA.name, type: "A", extruder: "A", lines: toLines(recipeA.ingredients) },
      { id: "recipe-b", name: recipeB.name, type: "B", extruder: "B", lines: toLines(recipeB.ingredients) },
    ];

    localStorage.setItem("filmcost_materials", JSON.stringify(savedMaterials));
    localStorage.setItem("filmcost_recipes", JSON.stringify(savedRecipes));
    localStorage.setItem("filmcost_settings", JSON.stringify({
      defaultWaste: parseFloat(settings.defaultWaste) || 1,
      currency: settings.currency,
    }));
    localStorage.setItem("filmcost_onboarding_done", "true");
    localStorage.setItem("filmcost-pro-language", "ar");

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
