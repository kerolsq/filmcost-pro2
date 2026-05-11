"use client";

interface InputFieldProps {
  label: string;
  value: number | string;
  onChange: (v: string) => void;
  unit?: string;
  type?: "number" | "text";
  placeholder?: string;
}

export function InputField({ label, value, onChange, unit, type = "number", placeholder }: InputFieldProps) {
  return (
    <div className="mb-3">
      <label className="block text-sm text-gray-600 mb-1 font-medium">{label}</label>
      <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden h-[52px]">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 text-[22px] font-medium text-gray-900 outline-none bg-transparent h-full"
          style={{ direction: type === "number" ? "ltr" : "inherit" }}
        />
        {unit && (
          <span className="px-4 text-sm text-gray-500 bg-gray-50 h-full flex items-center border-r border-gray-200 font-medium">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
