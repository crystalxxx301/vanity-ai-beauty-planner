export type ProductCategory = "skincare" | "base" | "eyes" | "brows" | "cheeks" | "lips" | "finish";

export type WeatherContext = {
  temperature?: number;
  humidity?: number;
  rain?: { probability?: number; expected?: boolean };
  uv?: number;
  userDescription?: string;
  interpretedConditions?: string[];
  source?: "api" | "user" | "combined" | "demo";
  fetchedAt?: string;
};

export type VisibleBeautyState = {
  redness?: "none" | "mild" | "visible" | "uncertain";
  dryness?: "none" | "mild" | "visible" | "uncertain";
  oiliness?: "none" | "mild" | "visible" | "uncertain";
  browsDefined?: boolean | "uncertain";
  makeupAlreadyPresent?: boolean | "uncertain";
  visibleIrritationOrWound?: boolean | "uncertain";
};

export type BeautyContext = {
  rawInput: string;
  timeMinutes?: number;
  occasion?: string;
  locationType?: "indoor" | "outdoor" | "mixed" | "unknown";
  desiredEffect?: string[];
  weather?: WeatherContext;
  visibleBeautyState?: VisibleBeautyState;
  outfit?: { description?: string; dominantColor?: string; visibility?: "clear" | "uncertain" | "not_visible" };
  userConstraints?: string[];
  userPreferences?: string[];
  notes?: string;
  assumptions?: string[];
  demoMode?: boolean;
};

export type BeautyProduct = {
  id: string;
  brand: string;
  name: string;
  category: ProductCategory;
  shade?: string;
  imageUrl?: string;
  tags?: string[];
  attributes?: { finish?: string; coverage?: string; texture?: string; wear?: string };
  userNotes?: string;
  userExperience?: string;
  source?: { url?: string; title?: string; domain?: string; retrievedAt?: string };
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductCandidate = Omit<BeautyProduct, "id" | "createdAt" | "updatedAt"> & {
  confidence: "high" | "medium" | "low";
  evidence: Array<{ url: string; title?: string; snippet?: string }>;
};

export type BeautyPlanStep = {
  id: string;
  category: "skin-prep" | "base" | "eyes-brows" | "cheeks-lips" | "finish";
  title: string;
  do: string;
  why: string;
  estimatedMinutes: number;
  productIds: string[];
  missingProductCriteria?: string[];
};

export type BeautyPlan = {
  id: string;
  createdAt: string;
  title: string;
  summary: string;
  contextSummary: string[];
  priorities: string[];
  steps: BeautyPlanStep[];
  skipToday: Array<{ title: string; reason: string }>;
  usedProductIds: string[];
  missingNeeds: Array<{ category: ProductCategory | string; criteria: string[]; reason?: string }>;
  whyThisPlan: string[];
  outfitMatch?: { observed: string; makeupConnection: string } | null;
  assumptions: string[];
  totalEstimatedMinutes: number;
  version: number;
};

export type PlanHistory = {
  id: string;
  timestamp: string;
  contextSummary: string[];
  finalPlan: BeautyPlan;
  refinementSummary?: string;
};
