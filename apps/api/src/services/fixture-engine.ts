const fixturePlan = {
  id: "demo-plan",
  createdAt: new Date().toISOString(),
  title: "柔雾玫瑰婚礼妆",
  summary: "精致、自然，也能从容应对高温与湿度。",
  contextSummary: ["朋友婚礼", "20 分钟", "主要室内", "自然但精致", "高温高湿"],
  priorities: ["先处理泛红与肤色均匀", "减少厚重叠加", "已有产品优先"],
  steps: [
    { id: "step-prep", category: "skin-prep", title: "轻量保湿", do: "薄涂清爽保湿。", why: "减少卡粉但避免厚重。", estimatedMinutes: 2, productIds: [] },
    { id: "step-base", category: "base", title: "薄层校色，不叠加厚重底妆", do: "在鼻翼与面中轻点，再向外拍开。", why: "高温高湿下更轻盈持久。", estimatedMinutes: 5, productIds: ["demo-base"] },
    { id: "step-eyes", category: "eyes-brows", title: "清晰眉形与克制眼妆", do: "补齐眉尾并轻压睫毛根部。", why: "提升精神感但不过分浓重。", estimatedMinutes: 5, productIds: [] },
    { id: "step-cheeks", category: "cheeks-lips", title: "灰粉腮红与豆沙唇色", do: "少量晕染，保留柔和边缘。", why: "呼应深绿色裙装。", estimatedMinutes: 5, productIds: ["demo-cheek", "demo-lip"] },
    { id: "step-finish", category: "finish", title: "局部定妆", do: "只在易出油区域轻压。", why: "兼顾持妆与自然光泽。", estimatedMinutes: 3, productIds: ["demo-finish"] },
  ],
  skipToday: [{ title: "复杂眼影层次", reason: "时间收益较低。" }],
  usedProductIds: ["demo-base", "demo-cheek", "demo-lip", "demo-finish"],
  missingNeeds: [],
  whyThisPlan: ["20 分钟内优先高影响区域。", "高温高湿下减少厚重叠加。"],
  assumptions: ["活动主要在室内"],
  totalEstimatedMinutes: 20,
  version: 1,
};

export function parseContextFixture(rawInput: string, quickContexts: string[] = []) {
  const timeMatch = rawInput.match(/(\d+)\s*分钟/);
  return {
    rawInput,
    timeMinutes: timeMatch ? Number(timeMatch[1]) : undefined,
    occasion: rawInput.includes("婚礼") ? "朋友婚礼" : quickContexts[0],
    desiredEffect: rawInput.includes("精致") ? ["自然", "精致"] : quickContexts,
    notes: "Fixture fallback：真实 Provider 接通后由 LLM 解析。",
    demoMode: false,
  };
}

export function followUpFixture() {
  return {
    needed: true,
    question: "婚礼主要在室内，还是会长时间待在户外？",
    options: ["主要室内", "会长时间待在户外", "不确定"],
    reasonCode: "location_changes_uv_and_wear_strategy",
  };
}

export function planFixture(beautyBag: Array<{ id?: unknown }> = []) {
  const plan = structuredClone(fixturePlan);
  const allowedIds = new Set(beautyBag.map((product) => String(product.id ?? "")).filter(Boolean));
  plan.steps = plan.steps.map((step) => ({ ...step, productIds: step.productIds.filter((id) => allowedIds.has(id)) }));
  plan.usedProductIds = plan.usedProductIds.filter((id) => allowedIds.has(id));
  return plan;
}
