import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Toast } from "@/components/Toast";
import { useMenu } from "@/App";
import { IconCalculator, IconFlask, IconBookmark, IconCopy } from "@tabler/icons-react";
import { getMaterials, getRecipes, saveToHistory } from "@/lib/storage";
import { calculate, calcRecipeCostPerKg, formatNum, CalculationResult, Material, Recipe } from "@/lib/calculations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CalculatorPage() {
  const { openMenu } = useMenu();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // massA / massB now represent A% / B% directly (0-100)
  const [recipeAId, setRecipeAId] = useState('');
  const [recipeBId, setRecipeBId] = useState('');
  const [aRatio, setARatio] = useState(50);
  const [bRatio, setBRatio] = useState(50);
  const [wastePercent, setWastePercent] = useState(0);

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    setMaterials(getMaterials());
    setRecipes(getRecipes());
  }, []);

  const recipesA = useMemo(() => recipes.filter(r => r.type === 'A'), [recipes]);
  const recipesB = useMemo(() => recipes.filter(r => r.type === 'B'), [recipes]);

  useEffect(() => {
    if (!recipeAId && recipesA.length > 0) setRecipeAId(recipesA[0].id);
  }, [recipesA, recipeAId]);

  useEffect(() => {
    if (!recipeBId && recipesB.length > 0) setRecipeBId(recipesB[0].id);
  }, [recipesB, recipeBId]);

  const ratioValid = Math.abs(aRatio + bRatio - 100) < 0.01;

  const handleChangeA = (val: number) => {
    const a = Math.min(100, Math.max(0, val));
    setARatio(a);
    setBRatio(Math.round((100 - a) * 100) / 100);
  };

  const handleChangeB = (val: number) => {
    const b = Math.min(100, Math.max(0, val));
    setBRatio(b);
    setARatio(Math.round((100 - b) * 100) / 100);
  };

  const handleCalculate = () => {
    if (!ratioValid) return;
    // Pass aRatio/bRatio as massA/massB — V2 calculate derives same ratio since aRatio/(aRatio+bRatio)=aRatio/100
    const res = calculate(
      { recipeAId, recipeBId, massA: aRatio, massB: bRatio, wastePercent },
      recipes,
      materials
    );
    setResult(res);
  };

  const handleSave = () => {
    if (!result) return;
    const rA = recipes.find(r => r.id === recipeAId);
    const rB = recipes.find(r => r.id === recipeBId);
    saveToHistory({
      id: Date.now().toString(),
      timestamp: Date.now(),
      recipeAName: rA?.name ?? 'Unknown',
      recipeBName: rB?.name ?? 'Unknown',
      aRatio: result.aRatio,
      bRatio: result.bRatio,
      wastePercent,
      costAfterWastePerKg: result.costAfterWastePerKg,
    });
    setToastMsg('تم الحفظ ✓');
  };

  const handleCopy = () => {
    if (!result) return;
    const rA = recipes.find(r => r.id === recipeAId);
    const rB = recipes.find(r => r.id === recipeBId);
    const text = `تكلفة الكيلو: ${formatNum(result.costAfterWastePerKg)} ج/كجم | خلطة A: ${rA?.name} | خلطة B: ${rB?.name}`;
    navigator.clipboard.writeText(text);
    setToastMsg('تم النسخ ✓');
  };

  const getCostPreview = (r: Recipe) => calcRecipeCostPerKg(r, materials);

  // ABA bar segment widths
  const halfA = aRatio / 2;

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <PageHeader title="حاسبة التكلفة" icon={<IconCalculator size={24} />} onMenuClick={openMenu} />

      <div className="flex-1 p-4 flex flex-col gap-5">

        {/* Recipe selectors */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-gray-700 flex items-center gap-2 text-base">
              <IconFlask size={20} className="text-[#0F6E56]" />
              خلطة A
            </Label>
            <Select value={recipeAId} onValueChange={setRecipeAId}>
              <SelectTrigger className="h-12 text-base text-right bg-gray-50">
                <SelectValue placeholder="اختر خلطة A" />
              </SelectTrigger>
              <SelectContent>
                {recipesA.map(r => (
                  <SelectItem key={r.id} value={r.id} className="text-right">
                    {r.name} — {formatNum(getCostPreview(r))} ج/كجم
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-gray-700 flex items-center gap-2 text-base">
              <IconFlask size={20} className="text-[#185FA5]" />
              خلطة B
            </Label>
            <Select value={recipeBId} onValueChange={setRecipeBId}>
              <SelectTrigger className="h-12 text-base text-right bg-gray-50 border-[#185FA5]/30">
                <SelectValue placeholder="اختر خلطة B" />
              </SelectTrigger>
              <SelectContent>
                {recipesB.map(r => (
                  <SelectItem key={r.id} value={r.id} className="text-right">
                    {r.name} — {formatNum(getCostPreview(r))} ج/كجم
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* ── ABA Ratio Section ── */}
        <div className="flex flex-col gap-3">
          <div className="text-gray-700 font-bold text-base text-right">
            هيكل ABA — نسبة A / B
          </div>

          {/* A% and B% inputs side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-gray-600 text-sm text-right">نسبة A</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={aRatio || ''}
                  onChange={e => handleChangeA(parseFloat(e.target.value) || 0)}
                  className="h-[52px] text-[22px] text-center font-bold border-[#0F6E56]/40"
                  data-testid="input-aRatio"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0F6E56] font-bold text-sm">%</div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-gray-600 text-sm text-right">نسبة B</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={bRatio || ''}
                  onChange={e => handleChangeB(parseFloat(e.target.value) || 0)}
                  className="h-[52px] text-[22px] text-center font-bold border-[#185FA5]/40"
                  data-testid="input-bRatio"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#185FA5] font-bold text-sm">%</div>
              </div>
            </div>
          </div>

          {/* Total validation */}
          <div className={`text-center text-[14px] font-bold ${ratioValid ? 'text-[#0F6E56]' : 'text-red-500'}`}>
            المجموع: {aRatio + bRatio}%
            {ratioValid ? ' ✅' : ' — لازم يكون 100%'}
          </div>

          {/* ABA structure bar */}
          <div className="flex flex-col gap-1">
            <div className="text-[12px] text-gray-400 text-right">الهيكل</div>
            <div className="flex h-[40px] rounded-lg overflow-hidden text-white text-[12px] font-bold">
              {/* A left */}
              <div
                className="flex items-center justify-center bg-[#0F6E56] transition-all duration-300"
                style={{ width: `${halfA}%`, minWidth: halfA > 0 ? '32px' : '0' }}
              >
                {halfA >= 8 && `A ${fmtNum(halfA)}%`}
              </div>
              {/* B */}
              <div
                className="flex items-center justify-center bg-[#185FA5] transition-all duration-300"
                style={{ width: `${bRatio}%`, minWidth: bRatio > 0 ? '32px' : '0' }}
              >
                {bRatio >= 8 && `B ${fmtNum(bRatio)}%`}
              </div>
              {/* A right */}
              <div
                className="flex items-center justify-center bg-[#0F6E56] transition-all duration-300"
                style={{ width: `${halfA}%`, minWidth: halfA > 0 ? '32px' : '0' }}
              >
                {halfA >= 8 && `A ${fmtNum(halfA)}%`}
              </div>
            </div>
          </div>
        </div>

        {/* Waste % */}
        <div className="flex flex-col gap-2">
          <Label className="text-gray-700 text-base">نسبة الهالك</Label>
          <div className="relative">
            <Input
              type="number"
              value={wastePercent || ''}
              onChange={e => setWastePercent(parseFloat(e.target.value) || 0)}
              className="h-[52px] text-[22px] text-center font-bold bg-amber-50/30 border-amber-200"
              data-testid="input-waste"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</div>
          </div>
        </div>

        <hr className="border-gray-200 my-2" />

        <button
          onClick={handleCalculate}
          disabled={!ratioValid}
          className="w-full h-[56px] bg-[#0F6E56] text-white text-[18px] font-bold rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="button-calculate"
        >
          <IconCalculator size={24} />
          احسب التكلفة
        </button>

        {/* Results */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4 flex flex-col gap-4">
            <div className="bg-[#0F6E56] rounded-xl p-6 text-white text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="text-sm font-medium opacity-90 mb-1">تكلفة الكيلو بعد الهالك</div>
              <div className="text-[38px] font-bold leading-none">{formatNum(result.costAfterWastePerKg)}</div>
              <div className="text-sm opacity-80 mt-1">جنيه / كجم</div>
            </div>

            <div className="bg-gray-100 rounded-xl p-4 flex flex-col gap-3 text-[15px]">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-600">تكلفة كيلو خلطة A</span>
                <span className="font-bold text-[#0F6E56]">{formatNum(result.recipeACostPerKg)} ج</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-600">تكلفة كيلو خلطة B</span>
                <span className="font-bold text-[#185FA5]">{formatNum(result.recipeBCostPerKg)} ج</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-600">قبل الهالك</span>
                <span className="font-bold">{formatNum(result.blendCostPerKg)} ج</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">تكلفة الهالك</span>
                <span className="font-bold text-[#BA7517]">+{formatNum(result.wasteCostPerKg)} ج</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSave}
                className="h-[48px] bg-white border border-gray-200 rounded-lg flex items-center justify-center gap-2 font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
              >
                <IconBookmark size={20} className="text-[#0F6E56]" />
                احفظ
              </button>
              <button
                onClick={handleCopy}
                className="h-[48px] bg-white border border-gray-200 rounded-lg flex items-center justify-center gap-2 font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
              >
                <IconCopy size={20} className="text-[#0F6E56]" />
                انسخ
              </button>
            </div>
          </div>
        )}
      </div>

      <Toast isVisible={!!toastMsg} message={toastMsg} onClose={() => setToastMsg('')} />
    </div>
  );
}

function fmtNum(n: number) { return n.toFixed(2); }
