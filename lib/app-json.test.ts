import { describe, expect, it } from "vitest";
import { demoState } from "@/lib/demo-data";
import { exportAppStateAsJson, importAppStateFromJson } from "@/lib/app-json";

describe("app JSON import and export", () => {
  it("exports settings and core app data, then imports it back into app state", () => {
    const json = exportAppStateAsJson(demoState);
    const exported = JSON.parse(json);

    expect(exported.settings).toMatchObject({
      language: "en",
      currency: "EGP",
      materialNameDisplayMode: "both"
    });
    expect(exported.data.materials).toHaveLength(demoState.materials.length);
    expect(exported.data.recipes).toHaveLength(demoState.recipes.length);
    expect(exported.data.presets).toHaveLength(demoState.presets.length);
    expect(exported.data.recentCalculations).toEqual([]);

    const imported = importAppStateFromJson(json);

    expect(imported.materials[0].id).toBe(demoState.materials[0].id);
    expect(imported.recipes[0].id).toBe(demoState.recipes[0].id);
    expect(imported.presets[0].id).toBe(demoState.presets[0].id);
    expect(imported.materialNameDisplayMode).toBe("both");
  });

  it("rejects malformed JSON and invalid structures", () => {
    expect(() => importAppStateFromJson("{bad json")).toThrow("not valid JSON");
    expect(() =>
      importAppStateFromJson(JSON.stringify({ data: { materials: "bad" } }))
    ).toThrow("materials must be an array");
  });
});
