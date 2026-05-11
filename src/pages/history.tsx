import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { useMenu } from "@/App";
import {
  IconHistory, IconCalculator, IconCheck, IconChevronDown, IconChevronUp, IconRefresh,
} from "@tabler/icons-react";
import { getRuns, saveRun, getMachines, saveCalibration } from "@/lib/v3/storage";
import { updateCalibration, calcWastePercent, calcOutputKgHr } from "@/lib/v3/calculations";
import type { ProductionRun, Machine } from "@/lib/v3/calculations";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtNum(n: number) { return n.toFixed(2); }

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function groupLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, today))     return 'اليوم';
  if (isSameDay(d, yesterday)) return 'أمس';
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

// Extended run type — includes extra fields cached at save time
type RunX = ProductionRun & {
  _recipeAName?: string;
  _recipeBName?: string;
  _finalCostPerKg?: number;
  _wastePercent?: number;
  _outputKgHr?: number;
};

// ── page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { openMenu } = useMenu();
  const [, navigate] = useLocation();
  const [runs, setRuns]         = useState<RunX[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setRuns(getRuns() as RunX[]);
    setMachines(getMachines());
  }, []);

  const getMachineName = (id: string) =>
    machines.find(m => m.id === id)?.name ?? id;

  // ── group runs by date ────────────────────────────────────────────────────

  const groups: { label: string; runs: RunX[] }[] = [];
  {
    const seen = new Map<string, RunX[]>();
    runs.forEach(run => {
      const key = groupLabel(run.date);
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key)!.push(run);
    });
    seen.forEach((groupRuns, label) => groups.push({ label, runs: groupRuns }));
  }

  // ── handlers ─────────────────────────────────────────────────────────────

  const handleApprove = (runId: string) => {
    const allRuns = getRuns() as RunX[];
    const run = allRuns.find(r => r.id === runId);
    if (!run) return;
    const approved = { ...run, approved: true };
    saveRun(approved);
    const merged = allRuns.map(r => r.id === runId ? approved : r);
    const cal = updateCalibration(run.machineId, merged);
    saveCalibration(cal);
    setRuns(merged);
  };

  const handleUseAgain = (run: RunX) => {
    localStorage.setItem('fc_v3_prefill', JSON.stringify({
      recipeAId:   run.recipeAId,
      recipeBId:   run.recipeBId,
      aRatio:      run.aRatio,
      bRatio:      run.bRatio,
      productType: run.productType,
      mode:        run.mode,
    }));
    navigate('/');
  };

  // ── empty state ───────────────────────────────────────────────────────────

  if (runs.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <PageHeader title="سجل التشغيلات" icon={<IconHistory size={24} />} onMenuClick={openMenu} />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 p-8">
          <IconCalculator size={56} className="opacity-30" />
          <p className="text-center font-bold text-[16px] text-gray-500">لا يوجد تشغيلات محفوظة بعد</p>
          <p className="text-center text-[13px]">احسب تكلفة واحفظ التشغيل من الشاشة الرئيسية</p>
        </div>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="سجل التشغيلات" icon={<IconHistory size={24} />} onMenuClick={openMenu} />

      <div className="p-4 flex flex-col gap-6 pb-8">
        {groups.map(({ label, runs: groupRuns }) => (
          <div key={label}>
            {/* Date group header */}
            <div className="text-[13px] font-bold text-gray-500 mb-2 pr-1">{label}</div>

            <div className="flex flex-col gap-3">
              {groupRuns.map(run => {
                const wastePercent = run._wastePercent
                  ?? calcWastePercent(run.wasteWeight_kg, run.goodWeight_kg);
                const outputKgHr   = run._outputKgHr
                  ?? calcOutputKgHr(run.goodWeight_kg, run.productionMinutes);
                const finalCost    = run._finalCostPerKg;
                const isExpanded   = expandedId === run.id;

                return (
                  <div key={run.id}
                    className={`bg-white rounded-xl overflow-hidden border-2 transition-colors ${
                      run.approved ? 'border-[#0F6E56]/40' : 'border-gray-200'
                    }`}>

                    {/* Card body */}
                    <div className="p-4 flex flex-col gap-2">

                      {/* Top row: cost + badges */}
                      <div className="flex items-start justify-between gap-2">
                        {/* Final cost */}
                        <div>
                          {finalCost !== undefined ? (
                            <>
                              <div className="text-[28px] font-bold text-[#0F6E56] leading-none">
                                {fmtNum(finalCost)}
                              </div>
                              <div className="text-[11px] text-gray-500">ج / كجم</div>
                            </>
                          ) : (
                            <div className="text-[18px] font-bold text-gray-400">—</div>
                          )}
                        </div>

                        {/* Badges + time */}
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              run.mode === 'actual'
                                ? 'bg-[#E1F5EE] text-[#0F6E56]'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {run.mode === 'actual' ? 'فعلي' : 'تقديري'}
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              run.approved
                                ? 'bg-[#E1F5EE] text-[#0F6E56]'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {run.approved ? '✓ معتمد' : '⏳ في انتظار'}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-400">{fmtTime(run.date)}</div>
                        </div>
                      </div>

                      {/* Product type + machine tag */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {run.productType && (
                          <span className="text-[14px] font-bold text-gray-800">{run.productType}</span>
                        )}
                        <span className="text-[12px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                          {getMachineName(run.machineId)}
                        </span>
                      </div>

                      {/* Recipe names */}
                      {(run._recipeAName || run._recipeBName) && (
                        <div className="text-[12px] text-gray-500">
                          A: {run._recipeAName ?? '—'} / B: {run._recipeBName ?? '—'}
                        </div>
                      )}

                      {/* Stats chips */}
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-[12px] bg-[#E1F5EE] text-[#0F6E56] px-2 py-1 rounded font-bold">
                          A {run.aRatio.toFixed(0)}% / B {run.bRatio.toFixed(0)}%
                        </span>
                        <span className="text-[12px] bg-amber-50 text-amber-700 px-2 py-1 rounded font-bold">
                          هالك {fmtNum(wastePercent)}%
                        </span>
                        {outputKgHr > 0 && (
                          <span className="text-[12px] bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">
                            {fmtNum(outputKgHr)} كجم/س
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex flex-col gap-2 text-[13px]">
                        {[
                          { label: 'وزن الرول الجيد',  value: `${run.goodWeight_kg} كجم` },
                          { label: 'وزن الهالك',        value: `${run.wasteWeight_kg} كجم` },
                          { label: 'وقت الإنتاج',       value: `${run.productionMinutes} دقيقة` },
                          { label: 'الوضع',             value: run.mode === 'actual' ? 'فعلي' : 'تقديري' },
                          { label: 'الماكينة',          value: getMachineName(run.machineId) },
                          ...(run.notes ? [{ label: 'ملاحظات', value: run.notes }] : []),
                        ].map(row => (
                          <div key={row.label} className="flex justify-between">
                            <span className="text-gray-500">{row.label}</span>
                            <span className="font-bold text-gray-800">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer action buttons */}
                    <div className={`grid border-t border-gray-100 ${run.approved ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {!run.approved && (
                        <button
                          onClick={() => handleApprove(run.id)}
                          className="flex items-center justify-center gap-1.5 h-[44px] text-[#0F6E56] font-bold text-[13px] border-l border-gray-100 hover:bg-[#E1F5EE] transition-colors"
                        >
                          <IconCheck size={15} />
                          اعتمد
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : run.id)}
                        className="flex items-center justify-center gap-1.5 h-[44px] text-gray-600 font-bold text-[13px] border-l border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        {isExpanded ? <IconChevronUp size={15} /> : <IconChevronDown size={15} />}
                        تفاصيل
                      </button>
                      <button
                        onClick={() => handleUseAgain(run)}
                        className="flex items-center justify-center gap-1.5 h-[44px] text-[#185FA5] font-bold text-[13px] hover:bg-blue-50 transition-colors"
                      >
                        <IconRefresh size={15} />
                        استخدم مرة أخرى
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
