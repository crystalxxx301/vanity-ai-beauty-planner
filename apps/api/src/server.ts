import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { failure, success } from "./lib/envelope.ts";
import { followUpFixture, parseContextFixture, planFixture } from "./services/fixture-engine.ts";
import { OpenAiProvider } from "./services/openai-provider.ts";

const port = Number(process.env.PORT ?? 8787);
const provider = process.env.OPENAI_API_KEY ? new OpenAiProvider() : undefined;

function setCors(request: IncomingMessage, response: ServerResponse) {
  const origin = request.headers.origin;
  const allowed = new Set(["http://127.0.0.1:4173", "http://localhost:4173", "http://127.0.0.1:5173", "http://localhost:5173"]);
  response.setHeader("Access-Control-Allow-Origin", origin && allowed.has(origin) ? origin : "http://127.0.0.1:4173");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}

function send(request: IncomingMessage, response: ServerResponse, status: number, body: unknown) {
  setCors(request, response);
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage) {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 12 * 1024 * 1024) throw new Error("PAYLOAD_TOO_LARGE");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
  } catch {
    throw new Error("INVALID_JSON_REQUEST");
  }
}

export async function handleRequest(request: IncomingMessage, response: ServerResponse) {
  const path = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`).pathname;

  if (request.method === "OPTIONS") {
    setCors(request, response);
    response.writeHead(204).end();
    return;
  }

  try {
    if (request.method === "GET" && path === "/api/health") {
      send(request, response, 200, success({ status: "ok", mode: provider ? "provider" : "fixture" }));
      return;
    }

    if (request.method === "POST" && path === "/api/context/parse") {
      const body = await readJson(request);
      const input = { rawInput: String(body.rawInput ?? ""), quickContexts: Array.isArray(body.quickContexts) ? body.quickContexts.map(String) : [], demoMode: body.demoMode === true };
      if (!provider && !input.demoMode) { send(request, response, 503, failure("PROVIDER_NOT_CONFIGURED", "真实 AI 尚未配置；你仍可试用明确标记的 Demo 场景。")); return; }
      const parsed = provider ? await provider.run<any>({ task: "context", payload: input }) : parseContextFixture(input.rawInput, input.quickContexts);
      const result = { ...parsed, demoMode: input.demoMode };
      send(request, response, 200, success(result));
      return;
    }

    if (request.method === "POST" && path === "/api/context/follow-up") {
      const body = await readJson(request);
      if (!provider && (body.context as { demoMode?: boolean } | undefined)?.demoMode !== true) { send(request, response, 503, failure("PROVIDER_NOT_CONFIGURED", "真实 AI 尚未配置。")); return; }
      const result = provider ? await provider.run({ task: "follow-up", payload: body }) : followUpFixture();
      send(request, response, 200, success(result));
      return;
    }

    if (request.method === "POST" && path === "/api/plan/generate") {
      const body = await readJson(request);
      if (!provider && (body.context as { demoMode?: boolean } | undefined)?.demoMode !== true) { send(request, response, 503, failure("PROVIDER_NOT_CONFIGURED", "真实 AI 尚未配置。")); return; }
      const generated = provider ? await provider.run<Record<string, unknown>>({ task: "plan", payload: body }) : planFixture(Array.isArray(body.beautyBag) ? body.beautyBag as Array<{ id?: unknown }> : []);
      const result = { ...generated, id: provider ? randomUUID() : generated.id, createdAt: new Date().toISOString(), version: 1 };
      send(request, response, 200, success(result));
      return;
    }

    if (request.method === "POST" && path === "/api/plan/refine") {
      const body = await readJson(request);
      const instruction = String(body.instruction ?? "");
      const stepId = String(body.stepId ?? "");
      if (!provider && (body.plan as { id?: string } | undefined)?.id !== "demo-plan") { send(request, response, 503, failure("PROVIDER_NOT_CONFIGURED", "真实 AI 尚未配置，无法修改这份方案。")); return; }
      if (provider) {
        const generated = await provider.run<Record<string, unknown>>({ task: "refine", payload: body });
        const prior = body.plan as { id?: string; createdAt?: string; version?: number } | undefined;
        const result = {
          ...generated,
          id: prior?.id ?? randomUUID(),
          createdAt: prior?.createdAt ?? new Date().toISOString(),
          version: Number(prior?.version ?? 1) + 1,
        };
        send(request, response, 200, success({ plan: result, refinementSummary: instruction }));
        return;
      }
      const source = body.plan as any;
      const globalChange = body.scope === "global";
      const plan = {
        ...source,
        version: Number(source?.version ?? 1) + 1,
        summary: globalChange && instruction ? `${String(source?.summary ?? "方案")} 已按“${instruction}”重新平衡。` : source?.summary,
        steps: Array.isArray(source?.steps) ? source.steps.map((step: any) => step.id === stepId
          ? { ...step, do: `${step.do} 调整：${instruction}` }
          : step) : [],
      };
      send(request, response, 200, success({ mode: "local_patch", plan, refinementSummary: instruction }));
      return;
    }

    if (request.method === "POST" && path === "/api/vision/analyze") {
      if (!provider) { send(request, response, 503, failure("PROVIDER_NOT_CONFIGURED", "请先配置 OpenAI API Key。")); return; }
      const body = await readJson(request);
      const imageDataUrl = String(body.imageDataUrl ?? "");
      const kind = body.kind === "outfit" ? "outfit" : "face";
      if (!/^data:image\/(jpeg|png|webp);base64,/.test(imageDataUrl)) {
        send(request, response, 400, failure("INVALID_IMAGE", "仅支持 JPG、PNG 或 WebP 图片。")); return;
      }
      send(request, response, 200, success(await provider.analyzeVision(imageDataUrl, kind)));
      return;
    }

    if (request.method === "POST" && path === "/api/speech/transcribe") {
      if (!provider) { send(request, response, 503, failure("PROVIDER_NOT_CONFIGURED", "请先配置 OpenAI API Key。")); return; }
      const body = await readJson(request);
      const audioBase64 = String(body.audioBase64 ?? "");
      const mimeType = String(body.mimeType ?? "audio/webm");
      if (!audioBase64 || Buffer.byteLength(audioBase64, "base64") > 8 * 1024 * 1024) {
        send(request, response, 400, failure("INVALID_AUDIO", "录音为空或超过 8MB。")); return;
      }
      send(request, response, 200, success(await provider.transcribe(audioBase64, mimeType)));
      return;
    }

    if (request.method === "POST" && path === "/api/products/search") {
      if (!provider) { send(request, response, 503, failure("PROVIDER_NOT_CONFIGURED", "请先配置 OpenAI API Key。")); return; }
      const body = await readJson(request);
      const query = String(body.query ?? "").trim();
      if (!query) { send(request, response, 400, failure("EMPTY_QUERY", "请输入品牌或产品名称。")); return; }
      send(request, response, 200, success(await provider.searchProducts(query)));
      return;
    }

    if (request.method === "POST" && path === "/api/weather") {
      const body = await readJson(request);
      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        send(request, response, 400, failure("INVALID_LOCATION", "定位信息无效。")); return;
      }
      // Deliberately reduce location precision to roughly 10 km before contacting the weather provider.
      const coarseLatitude = Math.round(latitude * 10) / 10;
      const coarseLongitude = Math.round(longitude * 10) / 10;
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(coarseLatitude));
      url.searchParams.set("longitude", String(coarseLongitude));
      url.searchParams.set("current", "temperature_2m,relative_humidity_2m,rain");
      url.searchParams.set("daily", "precipitation_probability_max,uv_index_max");
      url.searchParams.set("timezone", "auto");
      url.searchParams.set("forecast_days", "1");
      const weatherResponse = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!weatherResponse.ok) throw new Error("WEATHER_UNAVAILABLE");
      const weather = await weatherResponse.json() as any;
      send(request, response, 200, success({
        temperature: Number(weather.current?.temperature_2m ?? 0),
        humidity: Number(weather.current?.relative_humidity_2m ?? 0),
        rain: { probability: Number(weather.daily?.precipitation_probability_max?.[0] ?? 0), expected: Number(weather.current?.rain ?? 0) > 0 },
        uv: Number(weather.daily?.uv_index_max?.[0] ?? 0), source: "api", fetchedAt: new Date().toISOString(),
      }));
      return;
    }

    send(request, response, 404, failure("NOT_FOUND", "未找到对应接口。"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error(`[VANITY BFF] ${message.slice(0, 400)}`);
    if (message === "PAYLOAD_TOO_LARGE") send(request, response, 413, failure("PAYLOAD_TOO_LARGE", "上传内容超过大小限制。"));
    else if (message === "INVALID_JSON_REQUEST") send(request, response, 400, failure("INVALID_REQUEST", "请求格式无效，请修改后重试。"));
    else if (path === "/api/products/search" && (message === "AI_OUTPUT_INCOMPLETE" || message === "AI_OUTPUT_INVALID")) send(request, response, 502, failure("SEARCH_RESPONSE_INCOMPLETE", "搜索结果未完整返回，请重试一次。"));
    else if (path === "/api/products/search") send(request, response, 502, failure("SEARCH_UNAVAILABLE", "商品搜索暂时没完成，请稍后重试。"));
    else send(request, response, 502, failure("UPSTREAM_UNAVAILABLE", "服务暂时不可用，请稍后重试或继续使用文字输入。"));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createServer(handleRequest);
  server.listen(port, "127.0.0.1", () => {
    console.log(`VANITY BFF ready at http://127.0.0.1:${port}`);
  });
}
