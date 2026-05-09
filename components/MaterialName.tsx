"use client";

import { useApp } from "@/components/AppProvider";
import { getMaterialDisplayLines } from "@/lib/materials";
import type { RawMaterial } from "@/types/domain";

export function MaterialName({ material }: { material: RawMaterial }) {
  const { state } = useApp();
  const lines = getMaterialDisplayLines(
    material,
    state.language,
    state.materialNameDisplayMode
  );

  return (
    <span className="block leading-snug">
      <span className="block font-semibold text-slate-800">{lines[0]}</span>
      {lines[1] ? <span className="block text-xs font-semibold text-slate-500">{lines[1]}</span> : null}
    </span>
  );
}
