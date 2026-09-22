export type ProviderRequest = {
  task: "context" | "follow-up" | "plan" | "refine";
  payload: unknown;
};

export interface AiProvider {
  run<T>(request: ProviderRequest): Promise<T>;
}

export class ProviderNotConfiguredError extends Error {
  constructor() {
    super("AI provider is not configured");
  }
}
