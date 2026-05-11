import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Toast } from "@/components/Toast";
import { useMenu } from "@/App";
import {
  IconFlask, IconEdit, IconTrash, IconPlus, IconChevronDown, IconChevronUp, IconRuler
} from "@tabler/icons-react";
import { getRecipes, saveRecipes, getMaterials } from "@/lib/v3/storage";
import type { Recipe, RecipeComponent, Material } from "@/lib/v3/calculations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtNum(n: number) { return n.toFixed(2); }

function getCurrentCostPerKg(recipe: Recipe, materials: Material[]): number {
  return recipe.components.reduce((sum, comp) => {
    const mat = materials.find(m => m.id === comp.materialId);
    return mat ? sum + (comp.percentage / 100) * mat.pricePerKg : sum;
  }, 0);
}

const CATEGORY_COLORS: Record<Material['category'], string> = {
  HDPE:        'bg-blue-100 text-blue-700',
  LDPE:        'bg-green-100 text-green-700',
  LLDPE:       'bg-teal-100 text-teal-700',
  CaCO3:       'bg-stone-100 text-stone-600',
  Masterbatch: 'bg-purple-100 text-purple-700',
  Recycle:     'bg-yellow-100 text-yellow-700',
  Other:       'bg-gray-100 text-gray-600',
};

// ── form component type ───────────────────────────────────────────────────────

interface FormComp { materialId: string; amount: number; priceAtRun: number; }

const EMPTY_FORM_COMP: FormComp = { materialId: '', amount: 0, priceAtRun: 0 };

// ── page ─────────────────────────────────────────────────────────────────────

export default function RecipesPage() {
  const { openMenu } = useMenu();
  const [tab, setTab] = useState<'A' | 'B'>('A');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // per-card kg mode: set of recipeIds that have kg mode toggled
  const [cardKgMode, setCardKgMode] = useState<Set<string>>(new Set());
  // per-card kg amounts: recipeId → array of kg per component index
  const [cardKgAmounts, setCardKgAmounts] = useState<Record<string, number[]>>({});

  // dialog
  const [showDialog, setShowDialog] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [formName, setFormName] = useState('');
  const [formMode, setFormMode] = useState<'kg' | 'percent'>('kg');
  const [formComponents, setFormComponents] = useState<FormComp[]>([{ ...EMPTY_FORM_COMP }]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  // ── load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const r = getRecipes();
    setRecipes(r);
    setMaterials(getMaterials());
    const first = r.find(rec => rec.type === tab);
    if (first) setExpandedId(first.id);
  }, []);

  const filtered = useMemo(() => recipes.filter(r => r.type === tab), [recipes, tab]);

  // ── form derived values ────────────────────────────────────────────────────

  const formTotalKg = useMemo(
    () => formComponents.reduce((s, c) => s + (c.amount || 0), 0),
    [formComponents]
  );
  const formTotalPct = useMemo(
    () => formMode === 'percent'
      ? formComponents.reduce((s, c) => s + (c.amount || 0), 0)
      : 100,
    [formComponents, formMode]
  );
  const isFormValid = formMode === 'kg'
    ? formTotalKg > 0
    : Math.abs(formTotalPct - 100) < 0.01;

  const caco3Warning = useMemo(() => {
    const caco3Ids = new Set(materials.filter(m => m.category === 'CaCO3').map(m => m.id));
    let total = 0;
    formComponents.forEach(fc => {
      if (!caco3Ids.has(fc.materialId)) return;
      const pct = formMode === 'kg' && formTotalKg > 0
        ? (fc.amount / formTotalKg) * 100
        : fc.amount;
      total += pct;
    });
    return total > 40 ? total : null;
  }, [formComponents, formMode, formTotalKg, materials]);

  // ── tab switch ────────────────────────────────────────────────────────────

  const handleTabSwitch = (t: 'A' | 'B') => {
    setTab(t);
    const first = recipes.find(r => r.type === t);
    setExpandedId(first?.id ?? null);
  };

  // ── card kg mode ──────────────────────────────────────────────────────────

  const toggleCardKgMode = (recipeId: string, recipe: Recipe) => {
    setCardKgMode(prev => {
      const next = new Set(prev);
      if (next.has(recipeId)) {
        next.delete(recipeId);
      } else {
        next.add(recipeId);
        // initialise kg amounts = percentage values (relative to 100kg batch)
        setCardKgAmounts(a => ({
          ...a,
          [recipeId]: recipe.components.map(c => c.percentage),
        }));
      }
      return next;
    });
  };

  const updateCardKg = (recipeId: string, idx: number, val: number) => {
    setCardKgAmounts(prev => {
      const arr = [...(prev[recipeId] ?? [])];
      arr[idx] = val;
      return { ...prev, [recipeId]: arr };
    });
  };

  // ── dialog helpers ────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingRecipe(null);
    setFormName('');
    setFormMode('kg');
    setFormComponents([{ ...EMPTY_FORM_COMP }]);
    setShowDialog(true);
  };

  const openEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormName(recipe.name);
    setFormMode('percent');
    setFormComponents(recipe.components.map(c => ({
      materialId: c.materialId,
      amount: c.percentage,
      priceAtRun: c.priceAtRun,
    })));
    setShowDialog(true);
  };

  const addFormComp = () =>
    setFormComponents(prev => [...prev, { ...EMPTY_FORM_COMP }]);

  const removeFormComp = (i: number) =>
    setFormComponents(prev => prev.filter((_, idx) => idx !== i));

  const updateFormComp = (i: number, key: keyof FormComp, val: string | number) =>
    setFormComponents(prev => prev.map((c, idx) => {
      if (idx !== i) return c;
      if (key === 'materialId') {
        const mat = materials.find(m => m.id === val);
        return { ...c, materialId: val as string, priceAtRun: mat?.pricePerKg ?? 0 };
      }
      return { ...c, [key]: typeof val === 'string' ? parseFloat(val) || 0 : val };
    }));

  const handleSave = () => {
    if (!formName.trim() || !isFormValid) return;

    const components: RecipeComponent[] = formComponents
      .filter(c => c.materialId && c.amount > 0)
      .map(c => ({
        materialId: c.materialId,
        percentage: formMode === 'kg' && formTotalKg > 0
          ? (c.amount / formTotalKg) * 100
          : c.amount,
        priceAtRun: c.priceAtRun,
      }));

    if (components.length === 0) return;

    const all = getRecipes();
    if (editingRecipe) {
      const updated = all.map(r =>
        r.id === editingRecipe.id ? { ...r, name: formName.trim(), components } : r
      );
      saveRecipes(updated);
      setRecipes(updated);
    } else {
      const newRecipe: Recipe = {
        id: `recipe_${Date.now()}`,
        name: formName.trim(),
        type: tab,
        components,
      };
      const updated = [...all, newRecipe];
      saveRecipes(updated);
      setRecipes(updated);
    }
    setShowDialog(false);
    setToastMsg(editingRecipe ? 'تم تعديل الخلطة' : 'تمت إضافة الخلطة');
  };

  const handleDelete = (id: string) => {
    const updated = getRecipes().filter(r => r.id !== id);
    saveRecipes(updated);
    setRecipes(updated);
    setShowDeleteConfirm(null);
    if (expandedId === id) setExpandedId(null);
    setToastMsg('تم حذف الخلطة');
  };

  const getMat = (id: string) => materials.find(m => m.id === id);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="الخلطات" icon={<IconFlask size={24} />} onMenuClick={openMenu} />

      <div className="p-4 flex flex-col gap-4">

        {/* Tab switcher */}
        <div className="flex gap-2 bg-white border border-gray-200 rounded-lg p-1">
          {(['A', 'B'] as const).map(t => (
            <button
              key={t}
              onClick={() => handleTabSwitch(t)}
              data-testid={`tab-recipes-${t}`}
              className={`flex-1 h-[44px] rounded-md text-[15px] font-bold transition-colors ${
                tab === t
                  ? 'bg-[#0F6E56] text-white'
                  : 'text-[#0F6E56] border border-[#0F6E56] bg-white'
              }`}
            >
              خلطات {t}
            </button>
          ))}
        </div>

        {/* Recipe cards */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="text-center text-gray-400 py-8">لا توجد خلطات بعد</div>
          )}

          {filtered.map(recipe => {
            const costPerKg = getCurrentCostPerKg(recipe, materials);
            const isExpanded = expandedId === recipe.id;
            const isKgMode = cardKgMode.has(recipe.id);
            const kgAmounts = cardKgAmounts[recipe.id] ?? recipe.components.map(c => c.percentage);
            const totalKgCard = kgAmounts.reduce((s, v) => s + (v || 0), 0);

            return (
              <div
                key={recipe.id}
                data-testid={`card-recipe-${recipe.id}`}
                className={`bg-white rounded-xl overflow-hidden border-2 transition-colors ${
                  isExpanded ? 'border-[#0F6E56]' : 'border-gray-200'
                }`}
              >
                {/* Card header */}
                <button
                  className={`w-full flex items-center justify-between px-4 py-3 ${
                    isExpanded ? 'bg-[#E1F5EE]' : 'bg-white'
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : recipe.id)}
                  data-testid={`toggle-recipe-${recipe.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[16px]">{recipe.name}</span>
                    {isExpanded && (
                      <span className="bg-[#0F6E56] text-white text-[11px] px-2 py-0.5 rounded-full">
                        مفعّلة
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] text-[#0F6E56] font-bold">
                      {fmtNum(costPerKg)} ج/كجم
                    </span>
                    {isExpanded
                      ? <IconChevronUp size={18} className="text-gray-500" />
                      : <IconChevronDown size={18} className="text-gray-500" />}
                  </div>
                </button>

                {/* Expanded body */}
                {isExpanded && (
                  <>
                    {/* KG mode toggle */}
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-end">
                      <button
                        onClick={() => toggleCardKgMode(recipe.id, recipe)}
                        className={`flex items-center gap-1 text-[13px] font-bold px-3 py-1 rounded-full border transition-colors ${
                          isKgMode
                            ? 'bg-[#0F6E56] text-white border-[#0F6E56]'
                            : 'text-[#0F6E56] border-[#0F6E56] bg-white'
                        }`}
                      >
                        <IconRuler size={14} />
                        أدخل بالكجم
                      </button>
                    </div>

                    {/* Ingredient rows */}
                    <div className="divide-y divide-gray-100">
                      {recipe.components.map((comp, i) => {
                        const mat = getMat(comp.materialId);
                        const contribution = (comp.percentage / 100) * comp.priceAtRun;
                        const kgVal = kgAmounts[i] ?? comp.percentage;
                        const derivedPct = totalKgCard > 0 ? (kgVal / totalKgCard) * 100 : 0;

                        return (
                          <div key={i} className="px-4 py-3">
                            <div className="flex items-center justify-between">
                              {/* Left: name + category */}
                              <div className="text-right">
                                <div className="text-[15px] font-bold">
                                  {mat?.name ?? comp.materialId}
                                </div>
                                {mat && (
                                  <span className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${CATEGORY_COLORS[mat.category]}`}>
                                    {mat.category}
                                  </span>
                                )}
                                {mat && (
                                  <div className="text-[11px] text-gray-400 mt-0.5">
                                    {mat.pricePerKg} ج/كجم
                                  </div>
                                )}
                              </div>

                              {/* Right: percentage + contribution */}
                              {!isKgMode && (
                                <div className="text-left">
                                  <div className="text-[18px] font-bold text-[#0F6E56]">
                                    {fmtNum(comp.percentage)}%
                                  </div>
                                  <div className="text-[12px] text-gray-500">
                                    {fmtNum(contribution)} ج
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* KG mode input row */}
                            {isKgMode && (
                              <div className="flex items-center gap-2 mt-2">
                                <Input
                                  type="number"
                                  value={kgVal || ''}
                                  onChange={e =>
                                    updateCardKg(recipe.id, i, parseFloat(e.target.value) || 0)
                                  }
                                  className="h-[40px] text-base text-center font-bold w-[90px]"
                                />
                                <span className="text-gray-500 text-sm">كجم</span>
                                <span className="text-gray-400 text-[13px]">
                                  = <span className="font-bold text-[#0F6E56]">{fmtNum(derivedPct)}%</span>
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* KG total row */}
                    {isKgMode && (
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-between text-[13px]">
                        <span className="text-gray-500">الإجمالي</span>
                        <span className="font-bold text-gray-800">{fmtNum(totalKgCard)} كجم</span>
                      </div>
                    )}

                    {/* Footer: edit / delete */}
                    <div className="grid grid-cols-2 border-t border-gray-100">
                      <button
                        onClick={() => openEdit(recipe)}
                        data-testid={`button-edit-recipe-${recipe.id}`}
                        className="flex items-center justify-center gap-2 h-[48px] text-gray-700 font-bold text-[14px] border-l border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <IconEdit size={18} />
                        عدّل
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(recipe.id)}
                        data-testid={`button-delete-recipe-${recipe.id}`}
                        className="flex items-center justify-center gap-2 h-[48px] text-[#A32D2D] font-bold text-[14px] hover:bg-red-50 transition-colors"
                      >
                        <IconTrash size={18} />
                        احذف
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Add button */}
        <button
          onClick={openAdd}
          data-testid="button-add-recipe"
          className="w-full h-[52px] border-2 border-dashed border-[#0F6E56] text-[#0F6E56] rounded-xl flex items-center justify-center gap-2 font-bold text-[15px] bg-white hover:bg-[#E1F5EE] transition-colors"
        >
          <IconPlus size={20} />
          أضف خلطة {tab} جديدة
        </button>
      </div>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[420px] mx-auto max-h-[90dvh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingRecipe ? 'تعديل الخلطة' : `إضافة خلطة ${tab} جديدة`}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Name */}
            <div>
              <Label className="text-base mb-2 block">اسم الخلطة</Label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="مثال: خلطة سوداء"
                className="h-[48px] text-base"
                data-testid="input-recipe-name"
              />
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
              {(['kg', 'percent'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setFormMode(m)}
                  className={`flex-1 h-[38px] rounded-md text-[14px] font-bold transition-colors ${
                    formMode === m ? 'bg-white text-[#0F6E56] shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {m === 'kg' ? 'إدخال بالكجم' : 'إدخال بالنسبة %'}
                </button>
              ))}
            </div>

            {/* Components */}
            <div>
              <Label className="text-base mb-2 block">المكونات</Label>
              <div className="flex flex-col gap-3">
                {formComponents.map((fc, i) => {
                  const mat = getMat(fc.materialId);
                  const derivedPct = formMode === 'kg' && formTotalKg > 0
                    ? (fc.amount / formTotalKg) * 100
                    : null;

                  return (
                    <div key={i} className="flex flex-col gap-1.5 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {/* Material select */}
                        <Select
                          value={fc.materialId}
                          onValueChange={val => updateFormComp(i, 'materialId', val)}
                        >
                          <SelectTrigger className="flex-1 h-[44px]">
                            <SelectValue placeholder="اختر الخامة" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map(m => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name}
                                <span className={`mr-2 text-[11px] px-1 rounded ${CATEGORY_COLORS[m.category]}`}>
                                  {m.category}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Amount input */}
                        <div className="relative w-[80px]">
                          <Input
                            type="number"
                            value={fc.amount || ''}
                            onChange={e => updateFormComp(i, 'amount', e.target.value)}
                            className="h-[44px] text-center text-base font-bold pr-8"
                            data-testid={`input-line-pct-${i}`}
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                            {formMode === 'kg' ? 'كجم' : '%'}
                          </span>
                        </div>

                        {/* Remove */}
                        {formComponents.length > 1 && (
                          <button
                            onClick={() => removeFormComp(i)}
                            className="w-[36px] h-[36px] flex items-center justify-center text-[#A32D2D] hover:bg-red-50 rounded"
                          >
                            <IconTrash size={16} />
                          </button>
                        )}
                      </div>

                      {/* Derived % and priceAtRun row */}
                      <div className="flex items-center gap-3 px-1">
                        {formMode === 'kg' && derivedPct !== null && (
                          <span className="text-[12px] text-gray-500">
                            = <span className="font-bold text-[#0F6E56]">{fmtNum(derivedPct)}%</span>
                          </span>
                        )}
                        <div className="flex items-center gap-1 mr-auto">
                          <span className="text-[12px] text-gray-500">سعر التشغيل:</span>
                          <Input
                            type="number"
                            value={fc.priceAtRun || ''}
                            onChange={e => updateFormComp(i, 'priceAtRun', e.target.value)}
                            className="h-[32px] w-[70px] text-center text-sm font-bold"
                          />
                          <span className="text-[11px] text-gray-400">ج/كجم</span>
                        </div>
                      </div>

                      {/* Category badge */}
                      {mat && (
                        <span className={`self-start text-[11px] px-1.5 py-0.5 rounded font-bold ${CATEGORY_COLORS[mat.category]}`}>
                          {mat.category}
                        </span>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={addFormComp}
                  className="flex items-center gap-1 text-[#0F6E56] font-bold text-[14px] py-1"
                  data-testid="button-add-line"
                >
                  <IconPlus size={16} />
                  أضف خامة
                </button>
              </div>
            </div>

            {/* Running total */}
            <div className={`rounded-lg p-3 text-center font-bold text-[15px] ${
              isFormValid ? 'bg-[#E1F5EE] text-[#0F6E56]' : 'bg-red-50 text-red-600'
            }`}>
              {formMode === 'kg'
                ? `المجموع: ${fmtNum(formTotalKg)} كجم = 100% ${isFormValid ? '✅' : '⚠️'}`
                : `المجموع: ${fmtNum(formTotalPct)}% ${isFormValid ? '✅' : '— لازم يكون 100%'}`}
            </div>

            {/* CaCO3 warning */}
            {caco3Warning !== null && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[13px] text-amber-700 font-bold">
                ⚠️ نسبة CaCO3 {fmtNum(caco3Warning)}% — يُنصح بعدم تجاوز 40%
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <button
              onClick={() => setShowDialog(false)}
              className="flex-1 h-[48px] border border-gray-300 rounded-lg font-bold text-gray-700"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={!isFormValid || !formName.trim()}
              className="flex-1 h-[48px] bg-[#0F6E56] text-white rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              data-testid="button-save-recipe"
            >
              حفظ
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-[340px] mx-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 py-2">هل أنت متأكد من حذف هذه الخلطة؟ لا يمكن التراجع.</p>
          <DialogFooter className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1 h-[48px] border border-gray-300 rounded-lg font-bold text-gray-700"
            >
              إلغاء
            </button>
            <button
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
              className="flex-1 h-[48px] bg-[#A32D2D] text-white rounded-lg font-bold"
              data-testid="button-confirm-delete"
            >
              احذف
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toast isVisible={!!toastMsg} message={toastMsg} onClose={() => setToastMsg('')} />
    </div>
  );
}
