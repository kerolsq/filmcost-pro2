"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useApp } from "@/components/AppProvider";
import type { TranslationKey } from "@/lib/i18n";

const navItems: Array<{ href: string; key: TranslationKey }> = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/raw-materials", key: "rawMaterials" },
  { href: "/recipes", key: "recipes" },
  { href: "/presets", key: "presets" },
  { href: "/calculator", key: "calculator" },
  { href: "/compare", key: "compare" },
  { href: "/settings", key: "settings" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useApp();

  return (
    <div className="min-h-screen bg-panel text-ink">
      <aside className="app-sidebar fixed inset-y-0 hidden w-64 border-r border-line bg-white px-4 py-5 md:block">
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-accent">{t("materialOnly")}</p>
          <p className="mt-2 text-2xl font-black text-ink">{t("appName")}</p>
        </div>
        <nav className="mt-5 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-3 text-sm font-semibold transition ${
                  active ? "bg-ink text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-white/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard" className="min-w-0 truncate text-lg font-black text-ink md:hidden">
              {t("appName")}
            </Link>
            <div className="ms-auto">
              <LanguageToggle />
            </div>
          </div>
          <nav className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold ${
                    active
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-slate-700"
                  }`}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-3 py-5 sm:px-4 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
