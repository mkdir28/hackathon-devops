import { config } from '../config.js';
import type { ResolvedLlmConfig } from './types.js';

export function resolveLlmConfig(): ResolvedLlmConfig {
  const provider = config.llmProvider;
  const model =
    provider === 'openai'
      ? config.openaiModel
      : provider === 'gemini'
        ? config.geminiModel
        : provider === 'claude'
          ? config.claudeModel
          : 'demo';

  return {
    provider,
    model,
    demoMode: config.demoMode,
  };
}
