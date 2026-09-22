import { describe, expect, it } from "vitest";
import { beautyPlanSchema } from "@vanity/contracts";
import { demoBeautyPlan } from "./demo";

describe("demoBeautyPlan", () => {
  it("matches the runtime plan contract and contains all five stages", () => {
    expect(beautyPlanSchema.safeParse(demoBeautyPlan).success).toBe(true);
    expect(demoBeautyPlan.steps.map((step) => step.category)).toEqual([
      "skin-prep",
      "base",
      "eyes-brows",
      "cheeks-lips",
      "finish",
    ]);
  });
});
