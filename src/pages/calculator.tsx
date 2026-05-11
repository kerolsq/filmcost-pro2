import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RatioBar } from "@/components/RatioBar";
import { Toast } from "@/components/Toast";
import { useMenu } from "@/App";
import { IconCalculator, IconFlask, IconBookmark, IconCopy } from "@tabler/icons-react";
import { getMaterials, getRecipes, saveToHistory } from "@/lib/storage";
import { calculate, calcRecipeCostPerKg, formatNum, CalculatorState, CalculationResult, Material, Recipe } from "@/lib/calculations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CalculatorPage() {
  const { openMenu } = useMenu();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  
  const [state, setState] = useState<CalculatorState>({
    recipeAId: "",
    recipeBId: "",
    massA: 0,
    massB: 0,
    wastePercent: 0
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    setMaterials(getMaterials());
    setRecipes(getRecipes());
  }, []);

  const recipesA = useMemo(() => recipes.filter(r => r.type === 'A'), [recipes]);
  const recipesB = useMemo(() => recipes.filter(r => r.type === 'B'), [recipes]);

  // Set default selections if available
  useEffect(() => {
    if (!state.recipeAId && recipesA.length > 0) {
      setState(s => ({ ...s, recipeAId: recipesA[0].id }));
    }
    if (!state.recipeBId && recipesB.length > 0) {
      setState(s => ({ ...s, recipeBId: recipesB[0].id }));
    }
  }, [recipesA, recipesB, state.recipeAId, state.recipeBId]);

  const liveRatio = useMemo(() => {
    const total = state.massA + state.massB;
    if (total <= 0) return { a: 0, b: 0 };
    return {
      a: (state.massA / total) * 100,
      b: (state.massB / total) * 100
    };
  }, [state.massA, state.massB]);

  const handleCalculate = () => {
    const res = calculate(state, recipes, materials);
    setResult(res);
  };

  const handleSave = () => {
    if (!result) return;
    const rA = recipes.find(r => r.id === state.recipeAId);
    const rB = recipes.find(r => r.id === state.recipeBId);
    
    saveToHistory({
      id: Date.now().toString(),
      timestamp: Date.now(),
      recipeAName: rA?.name || "Unknown",
      recipeBName: rB?.name || "Unknown",
      aRatio: result.aRatio,
      bRatio: result.bRatio,
      wastePercent: state.wastePercent,
      costAfterWastePerKg: result.costAfterWastePerKg
    });
    
    setToastMsg("تم الحفظ ✓");
  };

  const handleCopy = () => {
    if (!result) return;
    const rA = recipes.find(r => r.id === state.recipeAId);
    const rB = recipes.find(r => r.id === state.recipeBId);
    
    const text = `تكلفة الكيلو: ${formatNum(result.costAfterWastePerKg)} ج/كجم | خلطة A: ${rA?.name} | خلطة B: ${rB?.name}`;
    navigator.clipboard.writeText(text);
    setToastMsg("تم النسخ ✓");
  };

  const getCostPreview = (r: Recipe) => {
    return calcRecipeCostPerKg(r, materials);
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <PageHeader title="حاسبة التكلفة" icon={<IconCalculator size={24} />} onMenuClick={openMenu} />
      
      <div className="flex-1 p-4 flex flex-col gap-5">
        
        {/* Selectors */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-gray-700 flex items-center gap-2 text-base">
              <IconFlask size={20} className="text-[#0F6E56]" />
              خلطة A
            </Label>
            <Select value={state.recipeAId} onValueChange={(val) => setState(s => ({ ...s, recipeAId: val }))}>
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
            <Select value={state.recipeBId} onValueChange={(val) => setState(s => ({ ...s, recipeBId: val }))}>
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

        {/* Inputs */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-gray-700 text-base">كمية A المستهلكة</Label>
            <div className="relative">
              <Input 
                type="number" 
                value={state.massA || ""} 
                onChange={e => setState(s => ({ ...s, massA: parseFloat(e.target.value) || 0 }))}
                className="h-[52px] text-[22px] text-center font-bold"
                data-testid="input-massA"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">كجم</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-gray-700 text-base">كمية B المستهلكة</Label>
            <div className="relative">
              <Input 
                type="number" 
                value={state.massB || ""} 
                onChange={e => setState(s => ({ ...s, massB: parseFloat(e.target.value) || 0 }))}
                className="h-[52px] text-[22px] text-center font-bold"
                data-testid="input-massB"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">كجم</div>
            </div>
          </div>
        </div>

        <RatioBar aRatio={liveRatio.a} bRatio={liveRatio.b} />

        <div className="flex flex-col gap-2 mt-2">
          <Label className="text-gray-700 text-base">نسبة الهالك</Label>
          <div className="relative">
            <Input 
              type="number" 
              value={state.wastePercent || ""} 
              onChange={e => setState(s => ({ ...s, wastePercent: parseFloat(e.target.value) || 0 }))}
              className="h-[52px] text-[22px] text-center font-bold bg-amber-50/30 border-amber-200"
              data-testid="input-waste"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</div>
          </div>
        </div>

        <hr className="border-gray-200 my-2" />

        <button 
          onClick={handleCalculate}
          className="w-full h-[56px] bg-[#0F6E56] text-white text-[18px] font-bold rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          data-testid="button-calculate"
        >
          <IconCalculator size={24} />
          احسب التكلفة
        </button>

        {/* Results */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4 flex flex-col gap-4">
            <div className="bg-[#0F6E56] rounded-xl p-6 text-white text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
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

      <Toast 
        isVisible={!!toastMsg} 
        message={toastMsg} 
        onClose={() => setToastMsg("")} 
      />
    </div>
  );
}
