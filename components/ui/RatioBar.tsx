"use client";

interface RatioBarProps {
  aRatio: number;
  bRatio: number;
}

export function RatioBar({ aRatio, bRatio }: RatioBarProps) {
  const aPercent = Math.round(aRatio * 100);
  const bPercent = Math.round(bRatio * 100);

  return (
    <div className="bg-primary-light rounded-xl p-4 mb-3">
      <p className="text-primary font-semibold text-sm mb-3">النسبة المحسوبة</p>
      <div className="h-[22px] rounded-full overflow-hidden flex bg-gray-200">
        {aRatio > 0 && (
          <div
            className="bg-primary transition-all duration-300"
            style={{ width: `${aRatio * 100}%` }}
          />
        )}
        {bRatio > 0 && (
          <div
            className="bg-secondary transition-all duration-300"
            style={{ width: `${bRatio * 100}%` }}
          />
        )}
      </div>
      <div className="flex justify-between mt-2 text-sm font-medium">
        <span className="text-secondary">B — {bPercent}%</span>
        <span className="text-primary">A — {aPercent}%</span>
      </div>
    </div>
  );
}
