"use client";

import Link from "next/link";
import { IconX } from "@tabler/icons-react";
import type { ReactNode } from "react";

export interface MenuItem {
  label: string;
  icon: ReactNode;
  href: string;
  active?: boolean;
}

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
  items: MenuItem[];
  currentPath?: string;
}

export function SideMenu({ open, onClose, items }: SideMenuProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-primary flex items-center justify-between px-4 h-16">
          <h2 className="text-white font-semibold text-lg">القائمة</h2>
          <button
            onClick={onClose}
            className="text-white p-2 rounded-lg hover:bg-primary-dark transition-colors"
            aria-label="إغلاق"
          >
            <IconX size={22} />
          </button>
        </div>
        <nav className="py-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-primary-light transition-colors ${
                item.active
                  ? "bg-primary-light text-primary border-r-4 border-primary font-semibold"
                  : ""
              }`}
            >
              <span className={item.active ? "text-primary" : "text-gray-500"}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
