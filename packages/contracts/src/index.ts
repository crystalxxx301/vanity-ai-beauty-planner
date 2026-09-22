import { z } from "zod";

export const productCategorySchema = z.enum([
  "skincare",
  "base",
  "eyes",
  "brows",
  "cheeks",
  "lips",
  "finish",
]);

export const weatherContextSchema = z.object({
  temperature: z.number().optional(),
  humidity: z.number().min(0).max(100).optional(),
  rain: z.object({
    probability: z.number().min(0).max(100).optional(),
    expected: z.boolean().optional(),
  }).optional(),
  uv: z.number().min(0).optional(),
  userDescription: z.string().optional(),
  interpretedConditions: z.array(z.string()).optional(),
  source: z.enum(["api", "user", "combined", "demo"]).optional(),
  fetchedAt: z.string().datetime().optional(),
});

export const visibleBeautyStateSchema = z.object({
  redness: z.enum(["none", "mild", "visible", "uncertain"]).optional(),
  dryness: z.enum(["none", "mild", "visible", "uncertain"]).optional(),
  oiliness: z.enum(["none", "mild", "visible", "uncertain"]).optional(),
  browsDefined: z.union([z.boolean(), z.literal("uncertain")]).optional(),
  makeupAlreadyPresent: z.union([z.boolean(), z.literal("uncertain")]).optional(),
  visibleIrritationOrWound: z.union([z.boolean(), z.literal("uncertain")]).optional(),
});

export const beautyContextSchema = z.object({
  rawInput: z.string(),
  timeMinutes: z.number().positive().optional(),
  occasion: z.string().optional(),
  locationType: z.enum(["indoor", "outdoor", "mixed", "unknown"]).optional(),
  desiredEffect: z.array(z.string()).optional(),
  weather: weatherContextSchema.optional(),
  visibleBeautyState: visibleBeautyStateSchema.optional(),
  outfit: z.object({
    description: z.string().optional(),
    dominantColor: z.string().optional(),
    visibility: z.enum(["clear", "uncertain", "not_visible"]).optional(),
  }).optional(),
  userConstraints: z.array(z.string()).optional(),
  userPreferences: z.array(z.string()).optional(),
  notes: z.string().optional(),
  assumptions: z.array(z.string()).optional(),
  demoMode: z.boolean().optional(),
});

export const beautyProductSchema = z.object({
  id: z.string(),
  brand: z.string(),
  name: z.string(),
  category: productCategorySchema,
  shade: z.string().optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.object({
    finish: z.string().optional(),
    coverage: z.string().optional(),
    texture: z.string().optional(),
    wear: z.string().optional(),
  }).optional(),
  userNotes: z.string().optional(),
  userExperience: z.string().optional(),
  source: z.object({
    url: z.string().url().optional(),
    title: z.string().optional(),
    domain: z.string().optional(),
    retrievedAt: z.string().datetime().optional(),
  }).optional(),
  isDemo: z.boolean().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const beautyPlanStepSchema = z.object({
  id: z.string(),
  category: z.enum(["skin-prep", "base", "eyes-brows", "cheeks-lips", "finish"]),
  title: z.string(),
  do: z.string(),
  why: z.string(),
  estimatedMinutes: z.number().nonnegative(),
  productIds: z.array(z.string()),
  missingProductCriteria: z.array(z.string()).optional(),
});

export const beautyPlanSchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  title: z.string().min(1),
  summary: z.string().min(1),
  contextSummary: z.array(z.string()),
  priorities: z.array(z.string()),
  steps: z.array(beautyPlanStepSchema).length(5),
  skipToday: z.array(z.object({ title: z.string(), reason: z.string() })),
  usedProductIds: z.array(z.string()),
  missingNeeds: z.array(z.object({
    category: z.string(),
    criteria: z.array(z.string()),
    reason: z.string().optional(),
  })),
  whyThisPlan: z.array(z.string()),
  outfitMatch: z.object({ observed: z.string(), makeupConnection: z.string() }).nullable().optional(),
  assumptions: z.array(z.string()),
  totalEstimatedMinutes: z.number().nonnegative(),
  version: z.number().int().positive(),
});

export const planHistorySchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  contextSummary: z.array(z.string()),
  finalPlan: beautyPlanSchema,
  refinementSummary: z.string().optional(),
});

export type ProductCategory = z.infer<typeof productCategorySchema>;
export type WeatherContext = z.infer<typeof weatherContextSchema>;
export type VisibleBeautyState = z.infer<typeof visibleBeautyStateSchema>;
export type BeautyContext = z.infer<typeof beautyContextSchema>;
export type BeautyProduct = z.infer<typeof beautyProductSchema>;
export type BeautyPlan = z.infer<typeof beautyPlanSchema>;
export type PlanHistory = z.infer<typeof planHistorySchema>;

export type ApiEnvelope<T> = {
  data?: T;
  error?: { code: string; message: string };
  requestId: string;
};
