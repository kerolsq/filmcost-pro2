"use client";

import { IconMenu2 } from "@tabler/icons-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  icon: ReactNode;
  subtitle?: string;
  onMenuClick?: () => void;
}

export function PageHeader({ title, icon, subtitle, onMenuClick }: PageHeaderProps) {
  return (
    <header className="bg-primary flex items-center justify-between px-4 min-h-[64px] shadow-md">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-white opacity-90 flex-shrink-0">{icon}</span>
        <div>
          <h1 className="text-white font-semibold text-lg leading-tight">{title}</h1>
          {subtitle && <p className="text-white opacity-75 text-xs">{subtitle}</p>}
        </div>
      </div>
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="text-white p-2 rounded-lg hover:bg-primary-dark transition-colors"
          aria-label="القائمة"
        >
          <IconMenu2 size={24} />
        </button>
      )}
    </header>
  );
}
