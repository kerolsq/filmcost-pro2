import type { } from "@/types/domain";

declare module "@/types/domain" {
  interface CalculatorResult {
    aRatio: number;
    bRatio: number;
    expectedRollWeight: number;
  }
}
