import { config } from '../config.js';

const DEMO_WARNING = `
================================================================================
  WARNING: Application is running in DEMO MODE (no LLM API keys configured).
  CV parsing and job search use sample data only — not live AI or web search.

  Configure at least one LLM key for AI features:
    OPENAI_API_KEY     — https://developers.openai.com/api/docs/
    GEMINI_API_KEY     — https://github.com/google-gemini/api-examples
    ANTHROPIC_API_KEY  — https://docs.anthropic.com/

  Job search uses each provider's built-in web search (no extra search API keys).

  Set DEMO_MODE=false in .env after adding keys and restart the API.
================================================================================
`;

let logged = false;

/** Log demo-mode warning once per process. */
export function logDemoModeWarningIfNeeded(): void {
  if (!config.demoMode || logged) return;
  logged = true;
  console.warn(DEMO_WARNING);
}
