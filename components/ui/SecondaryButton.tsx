"use client";

import type { ReactNode } from "react";

interface SecondaryButtonProps {
  onClick?: () => void;
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
}

export function SecondaryButton({ onClick, children, icon, disabled, type = "button" }: SecondaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full h-14 bg-white hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed text-primary border-2 border-primary text-lg font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
