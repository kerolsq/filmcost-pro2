import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "default" | "accent" | "warning";
}

const toneClasses = {
  default: "border-line bg-white",
  accent: "border-teal-200 bg-teal-50",
  warning: "border-amber-200 bg-amber-50"
};

export function MetricCard({ label, value, detail, tone = "default" }: MetricCardProps) {
  return (
    <section className={`rounded-lg border p-4 shadow-soft ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 break-words text-2xl font-bold leading-tight text-ink">{value}</div>
      {detail ? <div className="mt-1 text-sm text-slate-600">{detail}</div> : null}
    </section>
  );
}
