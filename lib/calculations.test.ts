import { describe, expect, it } from "vitest";
import {
  applyWaste,
  calculateFilmCost,
  calculateFullFilmCost,
  calculateRatios,
  calculateRecipeCost
} from "@/lib/calculations";
import { getDemoData } from "@/lib/demoData";
import type { Recipe } from "@/types/film-cost";

const tolerance = 0.05;
const demoData = getDemoData();

const materials = demoData.materials;
const recipeA = demoData.recipes.find((recipe) => recipe.type === "A") as Recipe;
const recipeB = demoData.recipes.find((recipe) => recipe.type === "B") as Recipe;
const preset = demoData.presets[0];
const input = demoData.calculationInput;

function expectClose(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

describe("raw material film cost calculations", () => {
  it("calculates recipe costs from the mandatory demo material prices and percentages", () => {
    const recipeACost = calculateRecipeCost(recipeA, materials);
    const recipeBCost = calculateRecipeCost(recipeB, materials);

    expectClose(recipeACost.costPerKg, 90.48);
    expectClose(recipeBCost.costPerKg, 31.4);
    expect(recipeACost.breakdown).toHaveLength(4);
    expect(recipeBCost.breakdown).toHaveLength(4);
  });

  it("calculates A/B ratios and film cost before and after 1% waste", () => {
    const recipeACost = calculateRecipeCost(recipeA, materials);
    const recipeBCost = calculateRecipeCost(recipeB, materials);
    const { aRatio, bRatio } = calculateRatios(10, 45);
    const costBeforeWaste = calculateFilmCost(
      recipeACost.costPerKg,
      recipeBCost.costPerKg,
      aRatio,
      bRatio
    );
    const costAfterWaste = applyWaste(costBeforeWaste, 1);

    expectClose(aRatio * 100, 18.18);
    expectClose(bRatio * 100, 81.82);
    expectClose(costBeforeWaste, 42.14);
    expectClose(costAfterWaste, 42.57);
  });

  it("combines the mandatory demo data into a full FilmCostResult", () => {
    const result = calculateFullFilmCost(input, materials, [recipeA, recipeB], [preset]);

    expectClose(result.recipeACost, 90.48);
    expectClose(result.recipeBCost, 31.4);
    expectClose(result.aRatio * 100, 18.18);
    expectClose(result.bRatio * 100, 81.82);
    expectClose(result.costBeforeWaste, 42.14);
    expectClose(result.costAfterWaste, 42.57);
    expect(result.warnings.some((warning) => warning.includes("differs from roll weight"))).toBe(
      false
    );
  });

  it("warns when a recipe total percentage is not 100%", () => {
    const invalidRecipeA: Recipe = {
      ...recipeA,
      items: recipeA.items.map((item, index) =>
        index === 0 ? { ...item, percentage: 40 } : item
      )
    };

    const result = calculateFullFilmCost(input, materials, [invalidRecipeA, recipeB], [preset]);

    expect(result.warnings.some((warning) => warning.includes("total percentage"))).toBe(true);
  });

  it("rejects waste percentages greater than or equal to 100", () => {
    expect(() => applyWaste(42.14, 100)).toThrow(RangeError);
    expect(() =>
      calculateFullFilmCost({ ...input, wastePercent: 100 }, materials, [recipeA, recipeB], [preset])
    ).toThrow(RangeError);
  });

  it("rejects negative material prices", () => {
    const negativePriceMaterials = materials.map((material) =>
      material.id === "sabic" ? { ...material, pricePerKg: -1 } : material
    );

    expect(() => calculateRecipeCost(recipeA, negativePriceMaterials)).toThrow(RangeError);
  });

  it("warns when A draw plus B draw does not equal roll weight", () => {
    const result = calculateFullFilmCost(
      { ...input, rollWeight: 60 },
      materials,
      [recipeA, recipeB],
      [preset]
    );

    expect(result.warnings.some((warning) => warning.includes("differs from roll weight"))).toBe(
      true
    );
  });
});
