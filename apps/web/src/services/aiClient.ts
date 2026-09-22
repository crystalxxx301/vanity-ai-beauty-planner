import type { BeautyContext, BeautyPlan, BeautyProduct, ProductCandidate, VisibleBeautyState, WeatherContext } from "@vanity/contracts/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ?? (import.meta.env.DEV ? "http://127.0.0.1:8787" : "");

type Envelope<T> = { data?: T; error?: { code: string; message: string }; requestId?: string };

export type ParsedContext = BeautyContext;

export type FollowUp = {
  needed: boolean;
  question?: string;
  options?: string[];
  reasonCode?: string;
};

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json() as Envelope<T>;
  if (!response.ok || payload.error || payload.data === undefined) {
    throw new Error(payload.error?.message ?? "AI 服务暂时不可用");
  }
  return payload.data;
}

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("无法读取文件"));
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
}

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("无法读取图片"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function assertBeautyPlan(value: BeautyPlan): BeautyPlan {
  if (!value || typeof value.id !== "string" || typeof value.title !== "string" || typeof value.summary !== "string") {
    throw new Error("AI 返回的方案格式无效");
  }
  if (!Array.isArray(value.steps) || value.steps.length !== 5 || !Array.isArray(value.contextSummary)) {
    throw new Error("AI 返回的五阶段方案不完整");
  }
  const validStep = value.steps.every((step) =>
    typeof step.id === "string"
    && typeof step.title === "string"
    && typeof step.do === "string"
    && typeof step.why === "string"
    && typeof step.estimatedMinutes === "number"
    && Array.isArray(step.productIds));
  if (!validStep) throw new Error("AI 返回的步骤格式无效");
  return value;
}

function assertPlanPolicy(plan: BeautyPlan, input: { context?: ParsedContext; beautyBag: BeautyProduct[] }): BeautyPlan {
  const expectedCategories = new Set(["skin-prep", "base", "eyes-brows", "cheeks-lips", "finish"]);
  if (new Set(plan.steps.map((step) => step.category)).size !== 5 || plan.steps.some((step) => !expectedCategories.has(step.category))) {
    throw new Error("AI 返回的五阶段方案不完整");
  }
  const productIds = new Set(input.beautyBag.map((product) => product.id));
  if (plan.steps.some((step) => step.productIds.some((id) => !productIds.has(id)))) {
    throw new Error("AI 引用了美妆包中不存在的产品");
  }
  const budget = input.context?.timeMinutes;
  if (budget && plan.totalEstimatedMinutes > budget + 1) {
    throw new Error("AI 方案超出你的时间预算");
  }
  if (plan.contextSummary.length < 2) throw new Error("AI 方案没有充分体现本次条件");
  if (input.context?.outfit?.visibility === "clear"
    && (!plan.outfitMatch?.observed?.trim() || !plan.outfitMatch.makeupConnection?.trim())) {
    throw new Error("AI 方案没有说明如何参考穿搭，请重试");
  }
  return plan;
}

export const aiClient = {
  parseContext: (rawInput: string, quickContexts: string[], demoMode = false) =>
    post<ParsedContext>("/api/context/parse", { rawInput, quickContexts, demoMode }),
  getFollowUp: (context: ParsedContext) =>
    post<FollowUp>("/api/context/follow-up", { context }),
  getWeather: (latitude: number, longitude: number) =>
    post<WeatherContext>("/api/weather", { latitude, longitude }),
  analyzeImage: async (file: File, kind: "face" | "outfit" = "face") =>
    post<VisibleBeautyState | NonNullable<BeautyContext["outfit"]>>("/api/vision/analyze", { imageDataUrl: await fileToDataUrl(file), kind }),
  transcribeAudio: async (blob: Blob) =>
    post<{ text: string }>("/api/speech/transcribe", { audioBase64: await fileToBase64(blob), mimeType: blob.type || "audio/webm" }),
  searchProducts: (query: string) =>
    post<{ candidates: ProductCandidate[] }>("/api/products/search", { query }),
  generatePlan: (input: {
    context?: ParsedContext;
    followUpAnswer?: string;
    beautyBag: BeautyProduct[];
  }) => post<BeautyPlan>("/api/plan/generate", input).then(assertBeautyPlan).then((plan) => assertPlanPolicy(plan, input)),
  refinePlan: (plan: BeautyPlan, stepId: string, instruction: string, scope: "local" | "global" = "local") =>
    post<{ plan: BeautyPlan; refinementSummary: string }>("/api/plan/refine", { plan, stepId, instruction, scope })
      .then((result) => {
        const generated = assertBeautyPlan(result.plan);
        if (scope === "global") return { ...result, plan: generated };
        const updatedStep = generated.steps.find((step) => step.id === stepId);
        if (!updatedStep) throw new Error("AI 没有返回需要调整的步骤");
        const steps = plan.steps.map((step) => step.id === stepId ? updatedStep : step);
        return {
          ...result,
          plan: {
            ...plan,
            version: generated.version,
            steps,
            usedProductIds: [...new Set(steps.flatMap((step) => step.productIds))],
          },
        };
      }),
};
