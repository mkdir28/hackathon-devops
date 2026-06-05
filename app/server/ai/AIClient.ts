import { config } from '../config.js';
import { resolveLlmConfig } from './resolve.js';
import { DemoAIClient } from './providers/demo.js';
import { OpenAIProvider } from './providers/openai.js';
import { GeminiProvider } from './providers/gemini.js';
import { ClaudeProvider } from './providers/claude.js';
import type { AIClient, LlmProviderId } from './types.js';
import { logDemoModeWarningIfNeeded } from './demo-notice.js';

export function createAIClient(): AIClient {
  const resolved = resolveLlmConfig();

  if (resolved.demoMode || resolved.provider === 'demo') {
    logDemoModeWarningIfNeeded();
    return new DemoAIClient();
  }

  switch (resolved.provider) {
    case 'openai':
      return new OpenAIProvider(resolved.model);
    case 'gemini':
      return new GeminiProvider(resolved.model);
    case 'claude':
      return new ClaudeProvider(resolved.model);
    default:
      logDemoModeWarningIfNeeded();
      return new DemoAIClient();
  }
}

let singleton: AIClient | null = null;

/** Shared AI client (provider chosen from environment). */
export function getAIClient(): AIClient {
  if (!singleton) {
    singleton = createAIClient();
    const r = resolveLlmConfig();
    console.info(`[ai] provider=${r.provider} model=${r.model} demo=${r.demoMode}`);
    if (r.demoMode) {
      logDemoModeWarningIfNeeded();
    } else {
      const keyHint: Record<LlmProviderId, string> = {
        openai: 'OPENAI_API_KEY',
        gemini: 'GEMINI_API_KEY',
        claude: 'ANTHROPIC_API_KEY',
        demo: '',
      };
      console.info(`[ai] docs: OpenAI https://developers.openai.com/api/docs/ | Gemini https://github.com/google-gemini/api-examples | Claude https://docs.anthropic.com/`);
      if (keyHint[r.provider]) {
        console.info(`[ai] active credential: ${keyHint[r.provider]}`);
      }
    }
  }
  return singleton;
}

/** Reset client (tests or hot reload). */
export function resetAIClient(): void {
  singleton = null;
}

export { config as aiConfig };
