import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useMenu } from "@/App";
import { IconPackage, IconEdit, IconPlus, IconSearch } from "@tabler/icons-react";
import { getMaterials, saveMaterials } from "@/lib/storage";
import { Material } from "@/lib/calculations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function MaterialsPage() {
  const { openMenu } = useMenu();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formName, setFormName] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formPrice, setFormPrice] = useState("");

  useEffect(() => {
    setMaterials(getMaterials());
  }, []);

  const filtered = materials.filter(m =>
    m.name.includes(search) || m.nameEn.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingMaterial(null);
    setFormName("");
    setFormNameEn("");
    setFormPrice("");
    setShowDialog(true);
  };

  const openEdit = (mat: Material) => {
    setEditingMaterial(mat);
    setFormName(mat.name);
    setFormNameEn(mat.nameEn);
    setFormPrice(mat.pricePerKg.toString());
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formPrice) return;
    const price = parseFloat(formPrice);
    if (isNaN(price) || price <= 0) return;

    let updated: Material[];
    if (editingMaterial) {
      updated = materials.map(m =>
        m.id === editingMaterial.id
          ? { ...m, name: formName.trim(), nameEn: formNameEn.trim(), pricePerKg: price }
          : m
      );
    } else {
      const newMat: Material = {
        id: Date.now().toString(),
        name: formName.trim(),
        nameEn: formNameEn.trim(),
        pricePerKg: price
      };
      updated = [...materials, newMat];
    }
    saveMaterials(updated);
    setMaterials(updated);
    setShowDialog(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="الخامات والأسعار" icon={<IconPackage size={24} />} onMenuClick={openMenu} />

      <div className="p-4 flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن خامة..."
            className="h-[48px] text-base pr-4 pl-11"
            data-testid="input-search-material"
          />
          <IconSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Material list */}
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
          {filtered.length === 0 && (
            <div className="text-center text-gray-400 py-8">لا توجد خامات مطابقة</div>
          )}
          {filtered.map((mat, idx) => (
            <div
              key={mat.id}
              data-testid={`row-material-${mat.id}`}
              className={`flex items-center justify-between px-4 py-[14px] ${
                idx < filtered.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              {/* Name */}
              <div className="flex-1 text-right">
                <div className="text-[16px] font-bold text-gray-900">{mat.name}</div>
                <div className="text-[12px] text-gray-500">{mat.nameEn}</div>
              </div>

              {/* Price */}
              <div className="flex-1 text-center">
                <div className="text-[18px] font-bold text-[#0F6E56]">{mat.pricePerKg}</div>
                <div className="text-[11px] text-gray-500">للكيلو</div>
              </div>

              {/* Edit button */}
              <div className="flex-none">
                <button
                  onClick={() => openEdit(mat)}
                  data-testid={`button-edit-material-${mat.id}`}
                  className="w-[36px] h-[36px] flex items-center justify-center text-[#0F6E56] hover:bg-[#E1F5EE] rounded-lg transition-colors"
                >
                  <IconEdit size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add button */}
        <button
          onClick={openAdd}
          data-testid="button-add-material"
          className="w-full h-[52px] border-2 border-dashed border-[#0F6E56] text-[#0F6E56] rounded-xl flex items-center justify-center gap-2 font-bold text-[15px] bg-white hover:bg-[#E1F5EE] transition-colors"
        >
          <IconPlus size={20} />
          أضف خامة جديدة
        </button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[380px] mx-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? "تعديل الخامة" : "إضافة خامة جديدة"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div>
              <Label className="text-base mb-2 block">الاسم بالعربي</Label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="مثال: كربون بلاك"
                className="h-[48px] text-base"
                data-testid="input-material-name"
              />
            </div>
            <div>
              <Label className="text-base mb-2 block">الاسم العلمي (اختياري)</Label>
              <Input
                value={formNameEn}
                onChange={e => setFormNameEn(e.target.value)}
                placeholder="e.g. Carbon Black"
                className="h-[48px] text-base"
                dir="ltr"
                data-testid="input-material-name-en"
              />
            </div>
            <div>
              <Label className="text-base mb-2 block">السعر للكيلو (ج)</Label>
              <Input
                type="number"
                value={formPrice}
                onChange={e => setFormPrice(e.target.value)}
                placeholder="0.00"
                className="h-[48px] text-[20px] font-bold text-center"
                data-testid="input-material-price"
              />
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
              data-testid="button-save-material"
            >
              حفظ
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
