"use client";

interface DetailRowProps {
  label: string;
  value: string;
  color?: "default" | "warning" | "success" | "danger";
}

const colorMap = {
  default: "text-gray-800",
  warning: "text-warning",
  success: "text-primary",
  danger: "text-danger",
};

export function DetailRow({ label, value, color = "default" }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-t border-gray-100">
      <span className={`font-medium text-sm ${colorMap[color]}`}>{value}</span>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}
