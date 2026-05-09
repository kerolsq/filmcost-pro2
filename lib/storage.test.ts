import { afterEach, describe, expect, it, vi } from "vitest";
import { getDemoData } from "@/lib/demoData";
import {
  APP_DATA_STORAGE_KEY,
  exportAppDataAsJson,
  importAppDataFromJson,
  loadAppData,
  resetToDemoData,
  saveAppData,
  type AppData
} from "@/lib/storage";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => {
      values.set(key, value);
    }
  };
}

function stubStorage() {
  const localStorage = createMemoryStorage();
  vi.stubGlobal("window", { localStorage });
  return localStorage;
}

function createAppData(): AppData {
  const demoData = getDemoData();

  return {
    ...demoData,
    language: "en",
    settings: {
      currency: "EGP"
    }
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("localStorage app data utilities", () => {
  it("loads demo data when no saved data exists", () => {
    stubStorage();

    const data = loadAppData();

    expect(data.materials.map((material) => material.marketNameAr)).toEqual([
      "سابك",
      "لو",
      "لينير",
      "لو + لينير",
      "مخرز",
      "أوميا",
      "اسيدكو",
      "صبغة أسود",
      "صبغة ألوان",
      "خامة درجة تانية",
      "كربونات"
    ]);
    expect(data.recipes[0].name).toBe("A Black Test Recipe");
    expect(data.presets[0].name).toBe("Test Size");
    expect(data.settings.currency).toBe("EGP");
  });

  it("saves and exports valid app data as JSON", () => {
    const localStorage = stubStorage();
    const data = createAppData();
    const updatedData: AppData = {
      ...data,
      language: "ar",
      settings: {
        currency: "EGP",
        priceDecimals: 2
      }
    };

    saveAppData(updatedData);

    expect(JSON.parse(localStorage.getItem(APP_DATA_STORAGE_KEY) ?? "{}")).toEqual(updatedData);
    expect(JSON.parse(exportAppDataAsJson(updatedData))).toEqual(updatedData);
    expect(loadAppData().language).toBe("ar");
    expect(loadAppData().settings.priceDecimals).toBe(2);
  });

  it("imports only valid JSON and does not replace saved data on invalid input", () => {
    const localStorage = stubStorage();
    const existingData = resetToDemoData();
    const validImportedData: AppData = {
      ...existingData,
      settings: {
        currency: "USD"
      }
    };

    importAppDataFromJson(JSON.stringify(validImportedData));
    expect(loadAppData().settings.currency).toBe("USD");

    expect(() => importAppDataFromJson("{not json")).toThrow("not valid JSON");
    expect(loadAppData().settings.currency).toBe("USD");

    expect(() =>
      importAppDataFromJson(JSON.stringify({ ...validImportedData, materials: "bad" }))
    ).toThrow("materials must be an array");
    expect(JSON.parse(localStorage.getItem(APP_DATA_STORAGE_KEY) ?? "{}").settings.currency).toBe(
      "USD"
    );
  });
});
