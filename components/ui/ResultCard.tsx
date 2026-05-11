"use client";

interface ResultCardProps {
  value: number;
  label: string;
  unit: string;
}

export function ResultCard({ value, label, unit }: ResultCardProps) {
  return (
    <div className="bg-primary rounded-xl p-5 text-white text-center mb-3">
      <p className="text-sm opacity-80 mb-1">{label}</p>
      <p className="text-[38px] font-medium leading-none mb-1">{value.toFixed(2)}</p>
      <p className="text-sm opacity-70">{unit}</p>
    </div>
  );
}
