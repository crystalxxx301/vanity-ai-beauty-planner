const nullable = (type: string) => ({ anyOf: [{ type }, { type: "null" }] });

export const contextSchema = {
  type: "object", additionalProperties: false,
  properties: {
    rawInput: { type: "string" }, timeMinutes: nullable("number"), occasion: nullable("string"),
    locationType: { enum: ["indoor", "outdoor", "mixed", "unknown"] },
    desiredEffect: { type: "array", items: { type: "string" } },
    weather: { type: "object", additionalProperties: false, properties: {
      temperature: nullable("number"), humidity: nullable("number"),
      rain: { type: "object", additionalProperties: false, properties: { probability: nullable("number"), expected: { anyOf: [{ type: "boolean" }, { type: "null" }] } }, required: ["probability", "expected"] }, uv: nullable("number"),
      userDescription: nullable("string"), interpretedConditions: { type: "array", items: { type: "string" } },
      source: { enum: ["user", "demo"] },
    }, required: ["temperature", "humidity", "rain", "uv", "userDescription", "interpretedConditions", "source"] },
    userConstraints: { type: "array", items: { type: "string" } }, userPreferences: { type: "array", items: { type: "string" } },
    notes: nullable("string"), assumptions: { type: "array", items: { type: "string" } }, demoMode: { type: "boolean" },
  },
  required: ["rawInput", "timeMinutes", "occasion", "locationType", "desiredEffect", "weather", "userConstraints", "userPreferences", "notes", "assumptions", "demoMode"],
};

export const followUpSchema = {
  type: "object", additionalProperties: false,
  properties: { needed: { type: "boolean" }, question: nullable("string"), options: { type: "array", minItems: 0, maxItems: 3, items: { type: "string" } }, reasonCode: nullable("string") },
  required: ["needed", "question", "options", "reasonCode"],
};

const planStep = {
  type: "object", additionalProperties: false,
  properties: {
    id: { type: "string" }, category: { enum: ["skin-prep", "base", "eyes-brows", "cheeks-lips", "finish"] },
    title: { type: "string" }, do: { type: "string" }, why: { type: "string" }, estimatedMinutes: { type: "number" },
    productIds: { type: "array", items: { type: "string" } }, missingProductCriteria: { type: "array", items: { type: "string" } },
  }, required: ["id", "category", "title", "do", "why", "estimatedMinutes", "productIds", "missingProductCriteria"],
};

export const planSchema = {
  type: "object", additionalProperties: false,
  properties: {
    id: { type: "string" }, createdAt: { type: "string" }, title: { type: "string" }, summary: { type: "string" }, contextSummary: { type: "array", items: { type: "string" } }, priorities: { type: "array", items: { type: "string" } },
    steps: { type: "array", minItems: 5, maxItems: 5, items: planStep },
    skipToday: { type: "array", items: { type: "object", additionalProperties: false, properties: { title: { type: "string" }, reason: { type: "string" } }, required: ["title", "reason"] } },
    usedProductIds: { type: "array", items: { type: "string" } },
    missingNeeds: { type: "array", items: { type: "object", additionalProperties: false, properties: { category: { type: "string" }, criteria: { type: "array", items: { type: "string" } }, reason: { type: "string" } }, required: ["category", "criteria", "reason"] } },
    whyThisPlan: { type: "array", items: { type: "string" } }, assumptions: { type: "array", items: { type: "string" } }, totalEstimatedMinutes: { type: "number" }, version: { type: "number" },
    outfitMatch: { anyOf: [
      { type: "object", additionalProperties: false, properties: { observed: { type: "string" }, makeupConnection: { type: "string" } }, required: ["observed", "makeupConnection"] },
      { type: "null" },
    ] },
  }, required: ["id", "createdAt", "title", "summary", "contextSummary", "priorities", "steps", "skipToday", "usedProductIds", "missingNeeds", "whyThisPlan", "assumptions", "totalEstimatedMinutes", "version", "outfitMatch"],
};

export const visionSchema = {
  type: "object", additionalProperties: false,
  properties: {
    redness: { enum: ["none", "mild", "visible", "uncertain"] }, dryness: { enum: ["none", "mild", "visible", "uncertain"] }, oiliness: { enum: ["none", "mild", "visible", "uncertain"] },
    browsDefined: { anyOf: [{ type: "boolean" }, { type: "string", enum: ["uncertain"] }] }, makeupAlreadyPresent: { anyOf: [{ type: "boolean" }, { type: "string", enum: ["uncertain"] }] }, visibleIrritationOrWound: { anyOf: [{ type: "boolean" }, { type: "string", enum: ["uncertain"] }] },
  }, required: ["redness", "dryness", "oiliness", "browsDefined", "makeupAlreadyPresent", "visibleIrritationOrWound"],
};

export const outfitSchema = {
  type: "object", additionalProperties: false,
  properties: { description: { type: "string" }, dominantColor: { type: "string" }, visibility: { enum: ["clear", "uncertain", "not_visible"] } },
  required: ["description", "dominantColor", "visibility"],
};

const candidate = {
  type: "object", additionalProperties: false,
  properties: {
    brand: { type: "string" }, name: { type: "string" }, category: { enum: ["skincare", "base", "eyes", "brows", "cheeks", "lips", "finish"] }, shade: { type: "string" }, imageUrl: { type: "string" },
    tags: { type: "array", maxItems: 4, items: { type: "string" } }, confidence: { enum: ["high", "medium", "low"] },
    evidence: { type: "array", maxItems: 2, items: { type: "object", additionalProperties: false, properties: { url: { type: "string" }, title: { type: "string" }, snippet: { type: "string" } }, required: ["url", "title", "snippet"] } },
  }, required: ["brand", "name", "category", "shade", "imageUrl", "tags", "confidence", "evidence"],
};
export const productCandidatesSchema = { type: "object", additionalProperties: false, properties: { candidates: { type: "array", maxItems: 3, items: candidate } }, required: ["candidates"] };
