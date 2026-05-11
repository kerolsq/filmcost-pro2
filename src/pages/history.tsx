import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useMenu } from "@/App";
import { IconHistory } from "@tabler/icons-react";
import { getHistory } from "@/lib/storage";
import { formatNum, SavedCalculation } from "@/lib/calculations";

export default function HistoryPage() {
  const { openMenu } = useMenu();
  const [history, setHistory] = useState<SavedCalculation[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader title="سجل الحسابات" icon={<IconHistory size={24} />} onMenuClick={openMenu} />
      
      <div className="flex-1 p-4 flex flex-col gap-3">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <IconHistory size={48} className="mb-2 opacity-50" />
            <p>لا يوجد سجل حسابات بعد</p>
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="text-[22px] font-bold text-[#0F6E56]" dir="ltr">
                  {formatNum(item.costAfterWastePerKg)} <span className="text-sm text-gray-500 font-normal">ج/كجم</span>
                </div>
                <div className="text-[12px] text-gray-500">{formatDate(item.timestamp)}</div>
              </div>
              
              <div className="text-[16px] font-medium text-gray-800 border-b border-gray-100 pb-2">
                A: {item.recipeAName} <br/> B: {item.recipeBName}
              </div>
              
              <div className="flex gap-2 pt-1 flex-wrap">
                <span className="bg-[#E1F5EE] text-[#0F6E56] px-2 py-1 rounded text-[12px] font-bold">
                  A {item.aRatio.toFixed(1)}% / B {item.bRatio.toFixed(1)}%
                </span>
                <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-[12px] font-bold">
                  هالك {item.wastePercent}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
