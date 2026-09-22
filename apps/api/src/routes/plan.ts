import type { FastifyInstance } from "fastify";
import { success } from "../lib/envelope.ts";
import { planFixture } from "../services/fixture-engine.ts";

export async function planRoutes(app: FastifyInstance) {
  app.post("/api/plan/generate", async () => success(planFixture()));
  app.post("/api/plan/refine", async (request) => {
    const body = request.body as { plan?: Record<string, unknown>; instruction?: string };
    return success({ mode: "local_patch", plan: body.plan, refinementSummary: body.instruction ?? "" });
  });
}
