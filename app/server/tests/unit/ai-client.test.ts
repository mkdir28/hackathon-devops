/**
 * Unit tests for ai/AIClient.ts (createAIClient, getAIClient, resetAIClient).
 * Provider classes and resolveLlmConfig are mocked — no SDKs needed.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { ResolvedLlmConfig } from '../../ai/types.js';

// Mock resolveLlmConfig

const mockResolveLlmConfig = vi.fn<() => ResolvedLlmConfig>();

vi.mock('../../ai/resolve.js', () => ({
  resolveLlmConfig: mockResolveLlmConfig,
}));

// Mock all provider classes

vi.mock('../../ai/providers/demo.js', () => ({
  DemoAIClient: class {
    readonly provider = 'demo' as const;
    readonly model = 'demo';
    generateStructured = vi.fn();
  },
}));

vi.mock('../../ai/providers/gemini.js', () => ({
  GeminiProvider: class {
    readonly provider = 'gemini' as const;
    readonly model: string;
    constructor(model?: string) { this.model = model ?? 'gemini-test'; }
    generateStructured = vi.fn();
  },
}));

vi.mock('../../ai/providers/openai.js', () => ({
  OpenAIProvider: class {
    readonly provider = 'openai' as const;
    readonly model: string;
    constructor(model?: string) { this.model = model ?? 'gpt-test'; }
    generateStructured = vi.fn();
  },
}));

vi.mock('../../ai/providers/claude.js', () => ({
  ClaudeProvider: class {
    readonly provider = 'claude' as const;
    readonly model: string;
    constructor(model?: string) { this.model = model ?? 'claude-test'; }
    generateStructured = vi.fn();
  },
}));

vi.mock('../../ai/demo-notice.js', () => ({
  logDemoModeWarningIfNeeded: vi.fn(),
}));

// Cleanup

afterEach(async () => {
  vi.clearAllMocks();
  delete process.env.GATEWAY_URL;
  const { resetAIClient } = await import('../../ai/AIClient.js');
  resetAIClient();
});

// createAIClient

describe('createAIClient', () => {
  it('returns DemoAIClient when demoMode is true', async () => {
    mockResolveLlmConfig.mockReturnValue({ provider: 'demo', model: 'demo', demoMode: true });
    const { createAIClient } = await import('../../ai/AIClient.js');
    const client = createAIClient();
    expect(client.provider).toBe('demo');
  });

  it('returns DemoAIClient when provider is demo (even without demoMode flag)', async () => {
    mockResolveLlmConfig.mockReturnValue({ provider: 'demo', model: 'demo', demoMode: false });
    const { createAIClient } = await import('../../ai/AIClient.js');
    const client = createAIClient();
    expect(client.provider).toBe('demo');
  });

  it('returns GeminiProvider when provider is gemini', async () => {
    mockResolveLlmConfig.mockReturnValue({ provider: 'gemini', model: 'gemini-test', demoMode: false });
    const { createAIClient } = await import('../../ai/AIClient.js');
    const client = createAIClient();
    expect(client.provider).toBe('gemini');
  });

  it('returns ClaudeProvider when provider is claude', async () => {
    mockResolveLlmConfig.mockReturnValue({ provider: 'claude', model: 'claude-test', demoMode: false });
    const { createAIClient } = await import('../../ai/AIClient.js');
    const client = createAIClient();
    expect(client.provider).toBe('claude');
  });

  it('returns OpenAIProvider when GATEWAY_URL is set (regardless of provider)', async () => {
    process.env.GATEWAY_URL = 'http://abox/v1';
    mockResolveLlmConfig.mockReturnValue({ provider: 'gemini', model: 'gemini-test', demoMode: false });
    const { createAIClient } = await import('../../ai/AIClient.js');
    const client = createAIClient();
    expect(client.provider).toBe('openai');
  });

  it('returns DemoAIClient as fallback for unknown provider', async () => {
    mockResolveLlmConfig.mockReturnValue({ provider: 'demo', model: 'demo', demoMode: false });
    const { createAIClient } = await import('../../ai/AIClient.js');
    const client = createAIClient();
    expect(client.provider).toBe('demo');
  });
});

// getAIClient singleton

describe('getAIClient', () => {
  it('returns the same instance on repeated calls (singleton)', async () => {
    mockResolveLlmConfig.mockReturnValue({ provider: 'demo', model: 'demo', demoMode: true });
    const { getAIClient } = await import('../../ai/AIClient.js');
    const a = getAIClient();
    const b = getAIClient();
    expect(a).toBe(b);
  });

  it('logs provider info on first call', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    mockResolveLlmConfig.mockReturnValue({ provider: 'gemini', model: 'gemini-test', demoMode: false });
    const { getAIClient } = await import('../../ai/AIClient.js');
    getAIClient();
    expect(infoSpy).toHaveBeenCalled();
    infoSpy.mockRestore();
  });
});

// resetAIClient

describe('resetAIClient', () => {
  it('clears the singleton so a new instance is created on next call', async () => {
    mockResolveLlmConfig.mockReturnValue({ provider: 'demo', model: 'demo', demoMode: true });
    const { getAIClient, resetAIClient } = await import('../../ai/AIClient.js');
    const before = getAIClient();
    resetAIClient();
    const after = getAIClient();
    expect(before).not.toBe(after);
  });
});