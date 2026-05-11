import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Toast } from "@/components/Toast";
import { useMenu } from "@/App";
import {
  IconCalculator, IconTool, IconChevronDown, IconFlask,
  IconBookmark, IconCopy, IconCheck, IconClock
} from "@tabler/icons-react";
import {
  getMachines, getActiveMachineId, setActiveMachineId as storeActiveMachine,
  getMaterials, getRecipes, getRuns, saveRun, getCalibration, saveCalibration,
} from "@/lib/v3/storage";
import type {
  Machine, Recipe, Material, ProductionRun, CalibrationResult, CalculationResult,
} from "@/lib/v3/calculations";
import {
  calculate, updateCalibration, calcWastePercent, calcOutputKgHr,
} from "@/lib/v3/calculations";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtNum(n: number) { return n.toFixed(2); }

function withCurrentPrices(recipe: Recipe, materials: Material[]): Recipe {
  return {
    ...recipe,
    components: recipe.components.map(c => {
      const mat = materials.find(m => m.id === c.materialId);
      return { ...c, priceAtRun: mat?.pricePerKg ?? c.priceAtRun };
    }),
  };
}

function getRecipeCostPreview(recipe: Recipe, materials: Material[]): number {
  return recipe.components.reduce((sum, c) => {
    const mat = materials.find(m => m.id === c.materialId);
    return mat ? sum + (c.percentage / 100) * mat.pricePerKg : sum;
  }, 0);
}

const CONFIDENCE: Record<string, { label: string; dot: string }> = {
  low:    { label: 'منخفض', dot: '🔴' },
  medium: { label: 'متوسط', dot: '🟡' },
  high:   { label: 'عالي',  dot: '🟢' },
};

// ── page ─────────────────────────────────────────────────────────────────────

export default function CalculatorPage() {
  const { openMenu } = useMenu();

  // data
  const [machines, setMachines]             = useState<Machine[]>([]);
  const [activeMachineId, setActiveMachineId] = useState<string | null>(null);
  const [calibration, setCalibration]       = useState<CalibrationResult | null>(null);
  const [recipes, setRecipes]               = useState<Recipe[]>([]);
  const [materials, setMaterials]           = useState<Material[]>([]);

  // mode
  const [mode, setMode] = useState<'actual' | 'estimate'>('actual');

  // recipe + ratio
  const [recipeAId, setRecipeAId] = useState('');
  const [recipeBId, setRecipeBId] = useState('');
  const [aRatio, setARatio]       = useState(50);
  const [bRatio, setBRatio]       = useState(50);

  // actual mode inputs
  const [goodWeight, setGoodWeight]               = useState(0);
  const [wasteWeight, setWasteWeight]             = useState(0);
  const [productionMinutes, setProductionMinutes] = useState(0);
  const [productType, setProductType]             = useState('');

  // estimate mode inputs
  const [estOutput, setEstOutput] = useState(0);
  const [estWaste, setEstWaste]   = useState(0);

  // profit
  const [profitPercent, setProfitPercent] = useState(0);

  // output
  const [result, setResult]                   = useState<CalculationResult | null>(null);
  const [savedRun, setSavedRun]               = useState<ProductionRun | null>(null);
  const [showMachineSelector, setShowMachineSelector] = useState(false);
  const [toastMsg, setToastMsg]               = useState('');

  // ── load on mount ─────────────────────────────────────────────────────────

  useEffect(() => {
    const ms  = getMachines();
    const mid = getActiveMachineId();
    const mats = getMaterials();
    const recs = getRecipes();

    setMachines(ms);
    setActiveMachineId(mid);
    if (mid) setCalibration(getCalibration(mid) ?? null);
    setMaterials(mats);
    setRecipes(recs);

    // pre-fill from history "use again"
    const prefillJson = localStorage.getItem('fc_v3_prefill');
    if (prefillJson) {
      try {
        const p = JSON.parse(prefillJson);
        if (p.recipeAId)           setRecipeAId(p.recipeAId);
        if (p.recipeBId)           setRecipeBId(p.recipeBId);
        if (p.aRatio  !== undefined) setARatio(p.aRatio);
        if (p.bRatio  !== undefined) setBRatio(p.bRatio);
        if (p.productType)         setProductType(p.productType);
        if (p.mode)                setMode(p.mode);
      } catch {}
      localStorage.removeItem('fc_v3_prefill');
    } else {
      const ra = recs.filter(r => r.type === 'A');
      const rb = recs.filter(r => r.type === 'B');
      if (ra.length > 0) setRecipeAId(ra[0].id);
      if (rb.length > 0) setRecipeBId(rb[0].id);
    }
  }, []);

  // auto-fill estimate values from calibration when switching to estimate mode
  useEffect(() => {
    if (mode === 'estimate' && calibration && calibration.runCount > 0) {
      setEstOutput(parseFloat(calibration.avgOutputKgHr.toFixed(1)));
      setEstWaste(parseFloat(calibration.avgWastePercent.toFixed(1)));
    }
  }, [mode]); // intentionally only on mode change

  // ── derived ───────────────────────────────────────────────────────────────

  const recipesA     = useMemo(() => recipes.filter(r => r.type === 'A'), [recipes]);
  const recipesB     = useMemo(() => recipes.filter(r => r.type === 'B'), [recipes]);
  const activeMachine = useMemo(() => machines.find(m => m.id === activeMachineId), [machines, activeMachineId]);
  const ratioValid   = Math.abs(aRatio + bRatio - 100) < 0.01;
  const halfA        = aRatio / 2;

  // ── handlers ─────────────────────────────────────────────────────────────

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

  const handleSelectMachine = (id: string) => {
    storeActiveMachine(id);
    setActiveMachineId(id);
    setCalibration(getCalibration(id) ?? null);
    setShowMachineSelector(false);
  };

  const handleCalculate = () => {
    if (!ratioValid) return;
    const recipeA = recipes.find(r => r.id === recipeAId);
    const recipeB = recipes.find(r => r.id === recipeBId);
    if (!recipeA || !recipeB) return;

    let goodKg: number, wasteKg: number, minutes: number;
    if (mode === 'actual') {
      goodKg  = goodWeight;
      wasteKg = wasteWeight;
      minutes = productionMinutes;
    } else {
      goodKg  = estOutput;
      minutes = 60;
      wasteKg = estWaste < 100 && estOutput > 0
        ? estOutput * estWaste / (100 - estWaste)
        : 0;
    }

    const run: ProductionRun = {
      id: `run_${Date.now()}`,
      machineId: activeMachineId ?? 'machine_default',
      recipeAId, recipeBId,
      date: Date.now(),
      productType,
      filmWidth_m: 0, thickness_micron: 0,
      aRatio, bRatio,
      goodWeight_kg: goodKg,
      wasteWeight_kg: wasteKg,
      productionMinutes: minutes,
      mode,
      approved: false,
    };

    const lockedA = withCurrentPrices(recipeA, materials);
    const lockedB = withCurrentPrices(recipeB, materials);
    const res = calculate(run, lockedA, lockedB, materials, profitPercent, calibration ?? undefined);
    setResult(res);
    setSavedRun(null);
  };

  const handleSaveRun = () => {
    if (!result) return;
    const recipeA = recipes.find(r => r.id === recipeAId);
    const recipeB = recipes.find(r => r.id === recipeBId);

    let goodKg: number, wasteKg: number, minutes: number;
    if (mode === 'actual') {
      goodKg = goodWeight; wasteKg = wasteWeight; minutes = productionMinutes;
    } else {
      goodKg = estOutput; minutes = 60;
      wasteKg = estWaste < 100 && estOutput > 0
        ? estOutput * estWaste / (100 - estWaste)
        : 0;
    }

    const run = {
      id: `run_${Date.now()}`,
      machineId: activeMachineId ?? 'machine_default',
      recipeAId, recipeBId,
      date: Date.now(),
      productType,
      filmWidth_m: 0, thickness_micron: 0,
      aRatio, bRatio,
      goodWeight_kg: goodKg,
      wasteWeight_kg: wasteKg,
      productionMinutes: minutes,
      mode,
      approved: false,
      // cached computed fields for history display
      _recipeAName:    recipeA?.name,
      _recipeBName:    recipeB?.name,
      _finalCostPerKg: result.finalCostPerKg,
      _wastePercent:   result.wastePercent,
      _outputKgHr:     result.actualOutputKgHr,
    } as unknown as ProductionRun;

    saveRun(run);
    setSavedRun(run);
  };

  const handleApprove = () => {
    if (!savedRun) return;
    const approved = { ...savedRun, approved: true };
    saveRun(approved);
    const allRuns = getRuns();
    const merged  = allRuns.map(r => r.id === approved.id ? approved : r);
    const cal      = updateCalibration(approved.machineId, merged);
    saveCalibration(cal);
    setCalibration(cal);
    setSavedRun(null);
    setToastMsg('تم الاعتماد ✓ — الكاليبريشن محدّث');
  };

  const handleReviewLater = () => {
    setSavedRun(null);
    setToastMsg('تم الحفظ — في انتظار المراجعة');
  };

  const handleCopy = () => {
    if (!result) return;
    const rA = recipes.find(r => r.id === recipeAId);
    const rB = recipes.find(r => r.id === recipeBId);
    const lines = [
      `ماكينة: ${activeMachine?.name ?? '—'}`,
      `خلطة A: ${rA?.name ?? '—'} | خلطة B: ${rB?.name ?? '—'}`,
      `A: ${aRatio}% / B: ${bRatio}%`,
      `الهالك: ${fmtNum(result.wastePercent)}%`,
      `الإنتاج: ${fmtNum(result.actualOutputKgHr)} كجم/س`,
      `تكلفة الكيلو: ${fmtNum(result.finalCostPerKg)} ج/كجم`,
      profitPercent > 0 ? `سعر البيع: ${fmtNum(result.sellingPricePerKg)} ج/كجم` : '',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines);
    setToastMsg('تم النسخ ✓');
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <PageHeader title="حاسبة التكلفة" icon={<IconCalculator size={24} />} onMenuClick={openMenu} />

      <div className="flex-1 p-4 flex flex-col gap-4">

        {/* ── Section 1: Machine bar ── */}
        <button
          onClick={() => setShowMachineSelector(true)}
          className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors"
        >
          <IconTool size={18} className="text-[#4ade80] shrink-0" />
          <div className="flex-1 text-right">
            <div className="font-bold text-[15px]">
              {activeMachine?.name ?? 'اختر ماكينة'}
            </div>
            {calibration && calibration.runCount > 0 && (
              <div className="text-[11px] text-gray-400 mt-0.5">
                متوسط إنتاج: {fmtNum(calibration.avgOutputKgHr)} كجم/س
                {' | '}
                متوسط هالك: {fmtNum(calibration.avgWastePercent)}%
                {' | '}
                {calibration.runCount} تشغيل
              </div>
            )}
          </div>
          <IconChevronDown size={18} className="text-gray-400 shrink-0" />
        </button>

        {/* ── Section 2: Mode selector ── */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('actual')}
            className={`h-[60px] rounded-xl font-bold text-[14px] flex flex-col items-center justify-center gap-0.5 border-2 transition-colors ${
              mode === 'actual'
                ? 'bg-[#0F6E56] text-white border-[#0F6E56]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            <span>وضع الإنتاج الفعلي</span>
            <span className="text-[11px] opacity-70">ACTUAL</span>
          </button>
          <button
            onClick={() => setMode('estimate')}
            className={`h-[60px] rounded-xl font-bold text-[14px] flex flex-col items-center justify-center gap-0.5 border-2 transition-colors ${
              mode === 'estimate'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            <span>وضع التقدير</span>
            <span className="text-[11px] opacity-70">ESTIMATE</span>
          </button>
        </div>

        {mode === 'estimate' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-[13px] text-amber-700 font-bold text-right">
            ⚠️ هذا تقدير — استخدم الوضع الفعلي بعد الإنتاج للدقة
          </div>
        )}

        {/* ── Section 3: Recipes + ratios ── */}
        <div className="flex flex-col gap-3">
          {/* Recipe A */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-gray-700 flex items-center gap-2 text-sm">
              <IconFlask size={16} className="text-[#0F6E56]" /> خلطة A
            </Label>
            <Select value={recipeAId} onValueChange={setRecipeAId}>
              <SelectTrigger className="h-[48px] text-base text-right bg-gray-50">
                <SelectValue placeholder="اختر خلطة A" />
              </SelectTrigger>
              <SelectContent>
                {recipesA.length === 0
                  ? <SelectItem value="__none__" disabled>لا توجد خلطات A — أضفها من الخلطات</SelectItem>
                  : recipesA.map(r => (
                    <SelectItem key={r.id} value={r.id} className="text-right">
                      {r.name} — {fmtNum(getRecipeCostPreview(r, materials))} ج/كجم
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          {/* Recipe B */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-gray-700 flex items-center gap-2 text-sm">
              <IconFlask size={16} className="text-[#185FA5]" /> خلطة B
            </Label>
            <Select value={recipeBId} onValueChange={setRecipeBId}>
              <SelectTrigger className="h-[48px] text-base text-right bg-gray-50 border-[#185FA5]/30">
                <SelectValue placeholder="اختر خلطة B" />
              </SelectTrigger>
              <SelectContent>
                {recipesB.length === 0
                  ? <SelectItem value="__none__" disabled>لا توجد خلطات B — أضفها من الخلطات</SelectItem>
                  : recipesB.map(r => (
                    <SelectItem key={r.id} value={r.id} className="text-right">
                      {r.name} — {fmtNum(getRecipeCostPreview(r, materials))} ج/كجم
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          <hr className="border-gray-200" />

          {/* A% / B% */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-gray-600 text-sm text-right">نسبة A</Label>
              <div className="relative">
                <Input type="number" min={0} max={100}
                  value={aRatio || ''}
                  onChange={e => handleChangeA(parseFloat(e.target.value) || 0)}
                  className="h-[52px] text-[22px] text-center font-bold border-[#0F6E56]/40" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0F6E56] font-bold text-sm">%</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-gray-600 text-sm text-right">نسبة B</Label>
              <div className="relative">
                <Input type="number" min={0} max={100}
                  value={bRatio || ''}
                  onChange={e => handleChangeB(parseFloat(e.target.value) || 0)}
                  className="h-[52px] text-[22px] text-center font-bold border-[#185FA5]/40" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#185FA5] font-bold text-sm">%</span>
              </div>
            </div>
          </div>

          <div className={`text-center text-[13px] font-bold ${ratioValid ? 'text-[#0F6E56]' : 'text-red-500'}`}>
            المجموع: {aRatio + bRatio}% {ratioValid ? '✅' : '— لازم يكون 100%'}
          </div>

          {/* ABA structure bar */}
          <div className="flex h-[40px] rounded-lg overflow-hidden text-white text-[12px] font-bold">
            <div className="flex items-center justify-center bg-[#0F6E56] transition-all duration-300"
              style={{ width: `${halfA}%`, minWidth: halfA > 0 ? '28px' : '0' }}>
              {halfA >= 8 && `A ${fmtNum(halfA)}%`}
            </div>
            <div className="flex items-center justify-center bg-[#185FA5] transition-all duration-300"
              style={{ width: `${bRatio}%`, minWidth: bRatio > 0 ? '28px' : '0' }}>
              {bRatio >= 8 && `B ${fmtNum(bRatio)}%`}
            </div>
            <div className="flex items-center justify-center bg-[#0F6E56] transition-all duration-300"
              style={{ width: `${halfA}%`, minWidth: halfA > 0 ? '28px' : '0' }}>
              {halfA >= 8 && `A ${fmtNum(halfA)}%`}
            </div>
          </div>
        </div>

        {/* ── Section 4: Production data ── */}
        {mode === 'actual' ? (
          <div className="flex flex-col gap-3">
            <div className="text-gray-700 font-bold text-sm text-right">بيانات الإنتاج</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-gray-600 text-sm text-right">وزن الرول الجيد</Label>
                <div className="relative">
                  <Input type="number" value={goodWeight || ''}
                    onChange={e => setGoodWeight(parseFloat(e.target.value) || 0)}
                    className="h-[52px] text-[20px] text-center font-bold" />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">كجم</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-gray-600 text-sm text-right">وزن الهالك</Label>
                <div className="relative">
                  <Input type="number" value={wasteWeight || ''}
                    onChange={e => setWasteWeight(parseFloat(e.target.value) || 0)}
                    className="h-[52px] text-[20px] text-center font-bold bg-amber-50/30 border-amber-200" />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">كجم</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-gray-600 text-sm text-right">وقت الإنتاج</Label>
                <div className="relative">
                  <Input type="number" value={productionMinutes || ''}
                    onChange={e => setProductionMinutes(parseFloat(e.target.value) || 0)}
                    className="h-[52px] text-[20px] text-center font-bold" />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">دقيقة</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-gray-600 text-sm text-right">نوع المنتج</Label>
                <Input value={productType}
                  onChange={e => setProductType(e.target.value)}
                  placeholder="شنطة 40×60"
                  className="h-[52px] text-base" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-gray-700 font-bold text-sm text-right flex items-center gap-2">
              بيانات التقدير
              {calibration && calibration.runCount > 0 && (
                <span className="text-[11px] font-normal text-gray-400">
                  (من {calibration.runCount} تشغيل سابق)
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-gray-600 text-sm text-right">الإنتاج المتوقع</Label>
                <div className="relative">
                  <Input type="number" value={estOutput || ''}
                    onChange={e => setEstOutput(parseFloat(e.target.value) || 0)}
                    className="h-[52px] text-[20px] text-center font-bold" />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">كجم/س</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-gray-600 text-sm text-right">الهالك المتوقع</Label>
                <div className="relative">
                  <Input type="number" value={estWaste || ''}
                    onChange={e => setEstWaste(parseFloat(e.target.value) || 0)}
                    className="h-[52px] text-[20px] text-center font-bold bg-amber-50/30 border-amber-200" />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-gray-600 text-sm text-right">نوع المنتج</Label>
              <Input value={productType}
                onChange={e => setProductType(e.target.value)}
                placeholder="شنطة 40×60"
                className="h-[48px] text-base" />
            </div>
          </div>
        )}

        {/* ── Section 5: Profit ── */}
        <div className="flex items-center gap-3">
          <Label className="text-gray-600 text-sm shrink-0">هامش الربح (اختياري)</Label>
          <div className="relative flex-1">
            <Input type="number" value={profitPercent || ''}
              onChange={e => setProfitPercent(parseFloat(e.target.value) || 0)}
              className="h-[44px] text-base text-center font-bold" />
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
          </div>
        </div>

        {/* ── Section 6: Calculate button ── */}
        <button
          onClick={handleCalculate}
          disabled={!ratioValid || !recipeAId || !recipeBId}
          className="w-full h-[56px] bg-[#0F6E56] text-white text-[18px] font-bold rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconCalculator size={24} />
          احسب التكلفة
        </button>

        {/* ── Section 7: Results ── */}
        {result && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Main cost card */}
            <div className="bg-[#0F6E56] rounded-xl p-6 text-white text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="text-sm opacity-90 mb-1">تكلفة الكيلو بعد التصنيع</div>
              <div className="text-[40px] font-bold leading-none">{fmtNum(result.finalCostPerKg)}</div>
              <div className="text-sm opacity-80 mt-1">جنيه / كجم</div>
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
                  result.mode === 'actual' ? 'bg-white/20' : 'bg-amber-500/80'
                }`}>
                  {result.mode === 'actual' ? 'فعلي ✓' : 'تقديري ⚠'}
                </span>
                <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-white/20">
                  {CONFIDENCE[result.confidenceLevel]?.dot ?? ''} {CONFIDENCE[result.confidenceLevel]?.label ?? result.confidenceLevel}
                </span>
              </div>
            </div>

            {/* Details card */}
            <div className="bg-gray-100 rounded-xl p-4 flex flex-col gap-2.5 text-[14px]">
              {[
                { label: 'تكلفة خامة A',        value: `${fmtNum(result.layerACostPerKg)} ج/كجم`,      color: 'text-[#0F6E56]' },
                { label: 'تكلفة خامة B',        value: `${fmtNum(result.layerBCostPerKg)} ج/كجم`,      color: 'text-[#185FA5]' },
                { label: 'متوسط تكلفة الخلطة',  value: `${fmtNum(result.weightedRecipeCost)} ج/كجم`,   color: 'text-gray-800' },
                { label: 'الهالك الفعلي',        value: `${fmtNum(result.wastePercent)}%`,               color: 'text-amber-600' },
                { label: 'الإنتاج الفعلي',       value: `${fmtNum(result.actualOutputKgHr)} كجم/ساعة`, color: 'text-gray-800' },
                ...(profitPercent > 0
                  ? [{ label: 'سعر البيع', value: `${fmtNum(result.sellingPricePerKg)} ج/كجم`, color: 'text-[#0F6E56] font-bold' }]
                  : []),
              ].map((row, i, arr) => (
                <div key={row.label} className={`flex justify-between items-center ${i < arr.length - 1 ? 'pb-2 border-b border-gray-200' : ''}`}>
                  <span className="text-gray-600">{row.label}</span>
                  <span className={`font-bold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="flex flex-col gap-2">
                {result.warnings.map((w, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-[13px] text-amber-700 font-bold text-right">
                    ⚠️ {w}
                  </div>
                ))}
              </div>
            )}

            {/* ── Section 8: Save / Approve ── */}
            {!savedRun ? (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleSaveRun}
                  className="h-[48px] bg-white border border-gray-200 rounded-lg flex items-center justify-center gap-2 font-bold text-gray-700 hover:bg-gray-50 shadow-sm">
                  <IconBookmark size={20} className="text-[#0F6E56]" />
                  احفظ التشغيل
                </button>
                <button onClick={handleCopy}
                  className="h-[48px] bg-white border border-gray-200 rounded-lg flex items-center justify-center gap-2 font-bold text-gray-700 hover:bg-gray-50 shadow-sm">
                  <IconCopy size={20} className="text-[#0F6E56]" />
                  انسخ النتيجة
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                <div className="text-center font-bold text-[15px] text-gray-800">
                  تم الحفظ — هل تعتمد هذا التشغيل؟
                </div>
                <div className="text-center text-[12px] text-gray-500">
                  الاعتماد يحسّن دقة الكاليبريشن للتشغيلات القادمة
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleApprove}
                    className="h-[48px] bg-[#0F6E56] text-white rounded-lg font-bold flex items-center justify-center gap-2">
                    <IconCheck size={20} />
                    اعتمد
                  </button>
                  <button onClick={handleReviewLater}
                    className="h-[48px] bg-white border border-gray-300 rounded-lg font-bold text-gray-600 flex items-center justify-center gap-2">
                    <IconClock size={20} />
                    مراجعة لاحقاً
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Machine Selector Dialog ── */}
      <Dialog open={showMachineSelector} onOpenChange={setShowMachineSelector}>
        <DialogContent className="max-w-[380px] mx-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>اختر الماكينة النشطة</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            {machines.length === 0 && (
              <p className="text-center text-gray-400 py-4">لا توجد ماكينات — أضف من صفحة الماكينات</p>
            )}
            {machines.map(machine => {
              const isActive = machine.id === activeMachineId;
              const cal = getCalibration(machine.id);
              return (
                <button key={machine.id} onClick={() => handleSelectMachine(machine.id)}
                  className={`w-full text-right px-4 py-3 rounded-xl border-2 transition-colors flex items-center justify-between ${
                    isActive ? 'border-[#0F6E56] bg-[#E1F5EE]' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                  <div>
                    <div className="font-bold text-[15px]">{machine.name}</div>
                    <div className="text-[12px] text-gray-500">{machine.brand} {machine.model} — {machine.type}</div>
                    {cal && cal.runCount > 0 && (
                      <div className="text-[11px] text-gray-400">{cal.runCount} تشغيل معتمد</div>
                    )}
                  </div>
                  {isActive && <IconCheck size={20} className="text-[#0F6E56] shrink-0" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Toast isVisible={!!toastMsg} message={toastMsg} onClose={() => setToastMsg('')} />
    </div>
  );
}
