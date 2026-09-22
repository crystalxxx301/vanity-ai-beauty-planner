import type { FastifyInstance } from "fastify";
import { success } from "../lib/envelope.ts";
import { followUpFixture, parseContextFixture } from "../services/fixture-engine.ts";

export async function contextRoutes(app: FastifyInstance) {
  app.post("/api/context/parse", async (request) => {
    const body = request.body as { rawInput?: string; quickContexts?: string[] };
    return success(parseContextFixture(body.rawInput ?? "", body.quickContexts));
  });

  app.post("/api/context/follow-up", async () => success(followUpFixture()));
}
