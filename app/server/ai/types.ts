export type LlmProviderId = 'openai' | 'gemini' | 'claude' | 'demo';

export type LlmTask = 'job_match' | 'cv_extract';

export interface StructuredGenerateRequest {
  task: LlmTask;
  systemPrompt: string;
  userPrompt: string;
  jsonSchema?: Record<string, unknown>;
}

export interface AIClient {
  readonly provider: LlmProviderId;
  readonly model: string;
  generateStructured<T>(request: StructuredGenerateRequest): Promise<T>;
}

export interface ResolvedLlmConfig {
  provider: LlmProviderId;
  model: string;
  demoMode: boolean;
}
