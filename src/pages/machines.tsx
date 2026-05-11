import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useMenu } from "@/App";
import { IconTool, IconEdit, IconTrash, IconPlus, IconCheck } from "@tabler/icons-react";
import { getMachines, saveMachines, getActiveMachineId, setActiveMachineId } from "@/lib/v3/storage";
import type { Machine } from "@/lib/v3/calculations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toast } from "@/components/Toast";

const TYPE_COLORS: Record<Machine['type'], string> = {
  ABA: 'bg-[#E1F5EE] text-[#0F6E56]',
  AB:  'bg-blue-50 text-blue-700',
  Mono:'bg-gray-100 text-gray-600',
};

const EMPTY_FORM: Omit<Machine, 'id'> = {
  name: '', brand: '', model: '', type: 'ABA',
  screwA_mm: 0, screwB_mm: 0, dieWidth_mm: 0, notes: '',
};

export default function MachinesPage() {
  const { openMenu } = useMenu();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Machine, 'id'>>(EMPTY_FORM);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    setMachines(getMachines());
    setActiveId(getActiveMachineId());
  }, []);

  const refresh = () => {
    setMachines(getMachines());
    setActiveId(getActiveMachineId());
  };

  const handleSetActive = (id: string) => {
    setActiveMachineId(id);
    setActiveId(id);
    setToastMsg("تم تحديد الماكينة النشطة");
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  };

  const openEdit = (machine: Machine) => {
    setEditingId(machine.id);
    setForm({ name: machine.name, brand: machine.brand, model: machine.model, type: machine.type,
      screwA_mm: machine.screwA_mm, screwB_mm: machine.screwB_mm, dieWidth_mm: machine.dieWidth_mm,
      notes: machine.notes ?? '' });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const all = getMachines();
    if (editingId) {
      const updated = all.map(m => m.id === editingId ? { ...m, ...form, name: form.name.trim() } : m);
      saveMachines(updated);
    } else {
      const newMachine: Machine = { id: `machine_${Date.now()}`, ...form, name: form.name.trim() };
      saveMachines([...all, newMachine]);
    }
    setShowDialog(false);
    refresh();
    setToastMsg(editingId ? "تم تعديل الماكينة" : "تمت إضافة الماكينة");
  };

  const handleDelete = (id: string) => {
    const all = getMachines();
    if (all.length <= 1) return;
    const updated = all.filter(m => m.id !== id);
    saveMachines(updated);
    if (activeId === id) {
      setActiveMachineId(updated[0].id);
    }
    setShowDeleteConfirm(null);
    refresh();
    setToastMsg("تم حذف الماكينة");
  };

  const setField = <K extends keyof typeof EMPTY_FORM>(key: K, val: typeof EMPTY_FORM[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="الماكينات" icon={<IconTool size={24} />} onMenuClick={openMenu} />

      <div className="p-4 flex flex-col gap-4">
        {machines.length === 0 && (
          <div className="text-center text-gray-400 py-8">لا توجد ماكينات بعد</div>
        )}

        {machines.map(machine => {
          const isActive = machine.id === activeId;
          return (
            <div
              key={machine.id}
              onClick={() => handleSetActive(machine.id)}
              className={`bg-white rounded-xl border-2 p-4 flex flex-col gap-2 cursor-pointer transition-colors ${
                isActive ? 'border-[#0F6E56]' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[17px] text-gray-900">{machine.name}</span>
                    {isActive && (
                      <span className="flex items-center gap-1 bg-[#0F6E56] text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                        <IconCheck size={11} />
                        نشطة
                      </span>
                    )}
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${TYPE_COLORS[machine.type]}`}>
                      {machine.type}
                    </span>
                  </div>
                  <div className="text-[13px] text-gray-500 mt-0.5">
                    {machine.brand} — {machine.model}
                  </div>
                  <div className="text-[12px] text-gray-400 mt-1">
                    سكرو A: {machine.screwA_mm}mm · سكرو B: {machine.screwB_mm}mm · داي: {machine.dieWidth_mm}mm
                  </div>
                </div>

                <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => openEdit(machine)}
                    className="w-[36px] h-[36px] flex items-center justify-center text-[#0F6E56] hover:bg-[#E1F5EE] rounded-lg transition-colors"
                  >
                    <IconEdit size={18} />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(machine.id)}
                    disabled={machines.length <= 1}
                    className="w-[36px] h-[36px] flex items-center justify-center text-[#A32D2D] hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <IconTrash size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={openAdd}
          className="w-full h-[52px] border-2 border-dashed border-[#0F6E56] text-[#0F6E56] rounded-xl flex items-center justify-center gap-2 font-bold text-[15px] bg-white hover:bg-[#E1F5EE] transition-colors"
        >
          <IconPlus size={20} />
          أضف ماكينة
        </button>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[420px] mx-auto max-h-[90dvh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? "تعديل الماكينة" : "إضافة ماكينة جديدة"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div>
              <Label className="text-base mb-2 block">اسم الماكينة *</Label>
              <Input value={form.name} onChange={e => setField('name', e.target.value)}
                placeholder="مثال: ماكينة 1" className="h-[48px] text-base" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-base mb-2 block">الماركة</Label>
                <Input value={form.brand} onChange={e => setField('brand', e.target.value)}
                  placeholder="YE, W&H ..." className="h-[48px] text-base" />
              </div>
              <div>
                <Label className="text-base mb-2 block">الموديل</Label>
                <Input value={form.model} onChange={e => setField('model', e.target.value)}
                  placeholder="ABA 55/45" className="h-[48px] text-base" />
              </div>
            </div>
            <div>
              <Label className="text-base mb-2 block">النوع</Label>
              <Select value={form.type} onValueChange={val => setField('type', val as Machine['type'])}>
                <SelectTrigger className="h-[48px] text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABA">ABA</SelectItem>
                  <SelectItem value="AB">AB</SelectItem>
                  <SelectItem value="Mono">Mono</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm mb-2 block">سكرو A (mm)</Label>
                <Input type="number" value={form.screwA_mm || ''}
                  onChange={e => setField('screwA_mm', parseFloat(e.target.value) || 0)}
                  className="h-[48px] text-base text-center font-bold" />
              </div>
              <div>
                <Label className="text-sm mb-2 block">سكرو B (mm)</Label>
                <Input type="number" value={form.screwB_mm || ''}
                  onChange={e => setField('screwB_mm', parseFloat(e.target.value) || 0)}
                  className="h-[48px] text-base text-center font-bold" />
              </div>
              <div>
                <Label className="text-sm mb-2 block">عرض الداي (mm)</Label>
                <Input type="number" value={form.dieWidth_mm || ''}
                  onChange={e => setField('dieWidth_mm', parseFloat(e.target.value) || 0)}
                  className="h-[48px] text-base text-center font-bold" />
              </div>
            </div>
            <div>
              <Label className="text-base mb-2 block">ملاحظات</Label>
              <Input value={form.notes ?? ''} onChange={e => setField('notes', e.target.value)}
                placeholder="اختياري" className="h-[48px] text-base" />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <button onClick={() => setShowDialog(false)}
              className="flex-1 h-[48px] border border-gray-300 rounded-lg font-bold text-gray-700">
              إلغاء
            </button>
            <button onClick={handleSave}
              className="flex-1 h-[48px] bg-[#0F6E56] text-white rounded-lg font-bold">
              حفظ
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-[340px] mx-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 py-2">هل أنت متأكد من حذف هذه الماكينة؟ لا يمكن التراجع.</p>
          <DialogFooter className="flex gap-2">
            <button onClick={() => setShowDeleteConfirm(null)}
              className="flex-1 h-[48px] border border-gray-300 rounded-lg font-bold text-gray-700">
              إلغاء
            </button>
            <button onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
              className="flex-1 h-[48px] bg-[#A32D2D] text-white rounded-lg font-bold">
              احذف
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toast isVisible={!!toastMsg} message={toastMsg} onClose={() => setToastMsg("")} />
    </div>
  );
}
