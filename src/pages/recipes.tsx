import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useMenu } from "@/App";
import {
  IconFlask, IconEdit, IconTrash, IconPlus, IconChevronDown, IconChevronUp
} from "@tabler/icons-react";
import { getRecipes, saveRecipes, getMaterials } from "@/lib/storage";
import { Recipe, RecipeLine, Material, calcRecipeCostPerKg, formatNum } from "@/lib/calculations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RecipesPage() {
  const { openMenu } = useMenu();
  const [tab, setTab] = useState<'A' | 'B'>('A');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [formName, setFormName] = useState("");
  const [formLines, setFormLines] = useState<RecipeLine[]>([{ materialId: "", percentage: 0 }]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const r = getRecipes();
    setRecipes(r);
    setMaterials(getMaterials());
    const firstOfTab = r.find(rec => rec.type === tab);
    if (firstOfTab) setExpandedId(firstOfTab.id);
  }, []);

  const filtered = recipes.filter(r => r.type === tab);

  const handleTabSwitch = (t: 'A' | 'B') => {
    setTab(t);
    const firstOfTab = recipes.find(r => r.type === t);
    setExpandedId(firstOfTab?.id || null);
  };

  const openAdd = () => {
    setEditingRecipe(null);
    setFormName("");
    setFormLines([{ materialId: "", percentage: 0 }]);
    setShowDialog(true);
  };

  const openEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormName(recipe.name);
    setFormLines(recipe.lines.map(l => ({ ...l })));
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    const validLines = formLines.filter(l => l.materialId && l.percentage > 0);
    if (validLines.length === 0) return;

    const updated = [...recipes];
    if (editingRecipe) {
      const idx = updated.findIndex(r => r.id === editingRecipe.id);
      if (idx >= 0) {
        updated[idx] = { ...editingRecipe, name: formName.trim(), lines: validLines };
      }
    } else {
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        name: formName.trim(),
        type: tab,
        lines: validLines
      };
      updated.push(newRecipe);
    }
    saveRecipes(updated);
    setRecipes(updated);
    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    const updated = recipes.filter(r => r.id !== id);
    saveRecipes(updated);
    setRecipes(updated);
    setShowDeleteConfirm(null);
    if (expandedId === id) setExpandedId(null);
  };

  const addLine = () => setFormLines(prev => [...prev, { materialId: "", percentage: 0 }]);
  const removeLine = (i: number) => setFormLines(prev => prev.filter((_, idx) => idx !== i));
  const updateLine = (i: number, key: keyof RecipeLine, val: string | number) => {
    setFormLines(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
  };

  const getMaterialName = (id: string) => materials.find(m => m.id === id)?.name || "";

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
                  ? "bg-[#0F6E56] text-white"
                  : "text-[#0F6E56] border border-[#0F6E56] bg-white"
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
            const costPerKg = calcRecipeCostPerKg(recipe, materials);
            const isExpanded = expandedId === recipe.id;

            return (
              <div
                key={recipe.id}
                data-testid={`card-recipe-${recipe.id}`}
                className={`bg-white rounded-xl overflow-hidden border-2 transition-colors ${
                  isExpanded ? "border-[#0F6E56]" : "border-gray-200"
                }`}
              >
                {/* Header */}
                <button
                  className={`w-full flex items-center justify-between px-4 py-3 ${
                    isExpanded ? "bg-[#E1F5EE]" : "bg-white"
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : recipe.id)}
                  data-testid={`toggle-recipe-${recipe.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[16px]">{recipe.name}</span>
                    {isExpanded && (
                      <span className="bg-[#0F6E56] text-white text-[11px] px-2 py-0.5 rounded-full">مفعّلة</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] text-[#0F6E56] font-bold">{formatNum(costPerKg)} ج/كجم</span>
                    {isExpanded ? <IconChevronUp size={18} className="text-gray-500" /> : <IconChevronDown size={18} className="text-gray-500" />}
                  </div>
                </button>

                {/* Body - ingredient list */}
                {isExpanded && (
                  <>
                    <div className="divide-y divide-gray-100">
                      {recipe.lines.map((line, i) => {
                        const mat = materials.find(m => m.id === line.materialId);
                        const contribution = mat ? (mat.pricePerKg * line.percentage / 100) : 0;
                        return (
                          <div key={i} className="flex items-center justify-between px-4 py-3">
                            <div className="text-right">
                              <div className="text-[15px] font-bold">{getMaterialName(line.materialId)}</div>
                              {mat && <div className="text-[12px] text-gray-500">{mat.pricePerKg} ج/كجم</div>}
                            </div>
                            <div className="text-left">
                              <div className="text-[18px] font-bold text-[#0F6E56]">{line.percentage}%</div>
                              <div className="text-[12px] text-gray-500">{formatNum(contribution)} ج</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer buttons */}
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

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[400px] mx-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingRecipe ? "تعديل الخلطة" : `إضافة خلطة ${tab} جديدة`}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
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

            <div>
              <Label className="text-base mb-2 block">المكونات</Label>
              <div className="flex flex-col gap-3">
                {formLines.map((line, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select
                      value={line.materialId}
                      onValueChange={val => updateLine(i, "materialId", val)}
                    >
                      <SelectTrigger className="flex-1 h-[44px]">
                        <SelectValue placeholder="الخامة" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={line.percentage || ""}
                      onChange={e => updateLine(i, "percentage", parseFloat(e.target.value) || 0)}
                      placeholder="%"
                      className="w-[64px] h-[44px] text-center text-base font-bold"
                      data-testid={`input-line-pct-${i}`}
                    />
                    {formLines.length > 1 && (
                      <button
                        onClick={() => removeLine(i)}
                        className="w-[36px] h-[36px] flex items-center justify-center text-[#A32D2D] hover:bg-red-50 rounded"
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addLine}
                  className="flex items-center gap-1 text-[#0F6E56] font-bold text-[14px] py-1"
                  data-testid="button-add-line"
                >
                  <IconPlus size={16} />
                  أضف مكون
                </button>
              </div>
            </div>
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
              className="flex-1 h-[48px] bg-[#0F6E56] text-white rounded-lg font-bold"
              data-testid="button-save-recipe"
            >
              حفظ
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
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
    </div>
  );
}
