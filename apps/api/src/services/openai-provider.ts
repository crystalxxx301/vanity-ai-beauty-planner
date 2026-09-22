import type { AiProvider, ProviderRequest } from "./ai-provider.ts";
import { contextSchema, followUpSchema, outfitSchema, planSchema, productCandidatesSchema, visionSchema } from "./schemas.ts";

const API_URL = "https://api.openai.com/v1";

function extractOutputText(response: any): string {
  if (typeof response.output_text === "string") return response.output_text;
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  throw new Error("OpenAI response did not contain output text");
}

export class OpenAiProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY ?? "";
    this.model = process.env.OPENAI_MODEL ?? "gpt-5.6-terra";
  }

  private async json<T>(options: {
    name: string;
    schema: Record<string, unknown>;
    instructions: string;
    input: unknown;
    tools?: Array<Record<string, unknown>>;
    include?: string[];
    maxOutputTokens?: number;
    model?: string;
  }): Promise<T> {
    const response = await fetch(`${API_URL}/responses`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: options.model ?? this.model,
        store: false,
        instructions: options.instructions,
        input: options.input,
        tools: options.tools,
        include: options.include,
        max_output_tokens: options.maxOutputTokens ?? 1800,
        text: { format: { type: "json_schema", name: options.name, strict: true, schema: options.schema } },
      }),
      signal: AbortSignal.timeout(45_000),
    });
    const body = await response.json() as any;
    if (!response.ok) throw new Error(body?.error?.message ?? "OpenAI request failed");
    if (body.status === "incomplete") throw new Error("AI_OUTPUT_INCOMPLETE");
    try {
      return JSON.parse(extractOutputText(body)) as T;
    } catch {
      throw new Error("AI_OUTPUT_INVALID");
    }
  }

  async run<T>({ task, payload }: ProviderRequest): Promise<T> {
    if (task === "context") {
      return this.json<T>({
        name: "beauty_context",
        schema: contextSchema,
        instructions: "你是 VANITY 的 Context Parser。只提取用户明确提供的信息；缺失信息用 null、空数组或 unknown，不猜测身份、年龄、种族、健康或医学结论。输出语言为中文。",
        input: JSON.stringify(payload),
        maxOutputTokens: 1200,
      });
    }
    if (task === "follow-up") {
      return this.json<T>({
        name: "follow_up",
        schema: followUpSchema,
        instructions: "你是 VANITY 的追问决策器。只有缺失信息会显著改变妆容策略时才追问，最多一个问题和 2–3 个短选项；否则 needed=false。输出中文。",
        input: JSON.stringify(payload),
        maxOutputTokens: 500,
      });
    }
    if (task === "plan") {
      return this.json<T>({
        name: "beauty_plan",
        schema: planSchema,
        instructions: "你是 VANITY 的美妆决策引擎。根据场景、时间、天气、用户目标、面部可见状态、穿搭和已有产品生成恰好五段连续方案：skin-prep、base、eyes-brows、cheeks-lips、finish。title 不超过 12 个汉字，summary 不超过 32 个汉字。总预计时间不得超过用户预算；方案至少明确体现两个有效 Context 条件；productIds 只能引用输入 Beauty Bag 中真实存在的 id，缺少产品时只写类型与属性。若 context.outfit.visibility=clear，必须在 outfitMatch.observed 写出识别到的服装与主色，在 outfitMatch.makeupConnection 写出具体如何影响本次眼妆、腮红或唇妆，并在相应步骤的 do 或 why 落实；不得只写泛泛的适配穿搭。若衣物不清晰、未出现或未提供照片，outfitMatch=null，不得猜测穿搭。visibleIrritationOrWound=true 时避免相应区域的刺激或覆盖操作，并用非诊断语言提醒谨慎处理。优先使用 Beauty Bag，理由简短可执行，不做医学判断，输出中文。",
        input: JSON.stringify(payload),
        maxOutputTokens: 3000,
      });
    }
    const isGlobalRefinement = (payload as { scope?: string })?.scope === "global";
    return this.json<T>({
      name: "refined_beauty_plan",
      schema: planSchema,
      instructions: isGlobalRefinement
        ? "用户修改了时间、场合、天气或只用已有产品等全局约束。根据新约束重新平衡整套五阶段方案，保持仍然成立的事实，包括已确认的穿搭依据 outfitMatch，version 增加 1，输出中文。"
        : "只修改用户指定的一个方案步骤，其余步骤与事实保持不变，包括已确认的穿搭依据 outfitMatch。version 增加 1。输出中文。",
      input: JSON.stringify(payload),
      maxOutputTokens: 3000,
    });
  }

  async analyzeVision(imageDataUrl: string, kind: "face" | "outfit" = "face") {
    return this.json({
      name: kind === "outfit" ? "outfit_context" : "visible_beauty_state",
      schema: kind === "outfit" ? outfitSchema : visionSchema,
      instructions: kind === "outfit"
        ? "仅用中文概括照片中可见的服装与主色，不识别人物身份、年龄、种族、身材或吸引力，不评价外貌。清楚看到服装时 visibility=clear；衣物模糊或被遮挡时为 uncertain；没有可见服装时为 not_visible。后两种情况不要推测服装颜色或风格，description 简述无法识别的原因，dominantColor 设为空字符串。"
        : "仅分析六个允许字段。不要识别身份、年龄、种族、吸引力，不做医学诊断。看不清时必须返回 uncertain。",
      input: [{ role: "user", content: [
        { type: "input_text", text: kind === "outfit" ? "提取这张穿搭参考照片的服装描述与主色。" : "分析这张本次妆容参考照片。" },
        { type: "input_image", image_url: imageDataUrl, detail: "low" },
      ] }],
      maxOutputTokens: 500,
    });
  }

  async searchProducts(query: string) {
    return this.json({
      name: "product_candidates",
      schema: productCandidatesSchema,
      instructions: "先使用 web_search 搜索用户给出的美妆产品，再仅根据搜索证据结构化最多 3 个候选。每个候选最多保留 2 条直接证据和 4 个简短属性标签，摘要简洁。禁止凭记忆补造品牌、型号、色号、图片或属性；证据冲突时降低 confidence。",
      input: `搜索并标准化这个美妆产品：${query}`,
      tools: [{ type: "web_search", search_context_size: "low" }],
      include: ["web_search_call.action.sources"],
      maxOutputTokens: 3500,
      model: process.env.OPENAI_SEARCH_MODEL ?? "gpt-5.6-luna",
    });
  }

  async transcribe(audioBase64: string, mimeType: string) {
    const bytes = Buffer.from(audioBase64, "base64");
    const form = new FormData();
    form.set("model", process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-transcribe");
    form.set("language", "zh");
    const extension = mimeType.includes("webm") ? "webm"
      : mimeType.includes("wav") ? "wav"
      : mimeType.includes("mpeg") ? "mp3"
      : mimeType.includes("ogg") ? "ogg"
      : "m4a";
    form.set("file", new Blob([bytes], { type: mimeType }), `recording.${extension}`);
    const response = await fetch(`${API_URL}/audio/transcriptions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${this.apiKey}` },
      body: form,
      signal: AbortSignal.timeout(45_000),
    });
    const body = await response.json() as any;
    if (!response.ok) throw new Error(body?.error?.message ?? "Transcription failed");
    return { text: String(body.text ?? "") };
  }
}
