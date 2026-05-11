import { IconChartPie } from "@tabler/icons-react";

interface RatioBarProps {
  aRatio: number; // 0-100
  bRatio: number; // 0-100
}

export function RatioBar({ aRatio, bRatio }: RatioBarProps) {
  return (
    <div className="bg-[#E1F5EE] rounded-lg p-4 flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2 text-[#0F6E56] font-bold">
        <IconChartPie size={20} />
        <span>النسبة المحسوبة</span>
      </div>
      
      <div className="h-[22px] w-full flex rounded-sm overflow-hidden">
        <div 
          style={{ width: `${aRatio}%` }} 
          className="bg-[#0F6E56] h-full transition-all duration-300"
        />
        <div 
          style={{ width: `${bRatio}%` }} 
          className="bg-[#185FA5] h-full transition-all duration-300"
        />
      </div>

      <div className="flex justify-between items-center text-sm font-semibold">
        <div className="text-[#0F6E56]">A — {aRatio.toFixed(1)}%</div>
        <div className="text-[#185FA5]">B — {bRatio.toFixed(1)}%</div>
      </div>
    </div>
  );
}
