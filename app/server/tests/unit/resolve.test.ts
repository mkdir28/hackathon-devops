/**
 * Unit tests for ai/resolve.ts — resolveLlmConfig().
 * config is mocked per test to cover every provider branch.
 */
import { describe, it, expect, vi } from 'vitest';

describe('resolveLlmConfig', () => {
  it('returns gemini provider + model', async () => {
    vi.doMock('../../config.js', () => ({
      config: { llmProvider: 'gemini', geminiModel: 'gemini-flash', openaiModel: 'gpt', claudeModel: 'claude', demoMode: false },
    }));
    const { resolveLlmConfig } = await import('../../ai/resolve.js');
    const result = resolveLlmConfig();
    expect(result.provider).toBe('gemini');
    expect(result.model).toBe('gemini-flash');
    expect(result.demoMode).toBe(false);
    vi.resetModules();
  });

  it('returns openai provider + model', async () => {
    vi.doMock('../../config.js', () => ({
      config: { llmProvider: 'openai', openaiModel: 'gpt-4o', geminiModel: 'g', claudeModel: 'c', demoMode: false },
    }));
    const { resolveLlmConfig } = await import('../../ai/resolve.js');
    const result = resolveLlmConfig();
    expect(result.provider).toBe('openai');
    expect(result.model).toBe('gpt-4o');
    vi.resetModules();
  });

  it('returns claude provider + model', async () => {
    vi.doMock('../../config.js', () => ({
      config: { llmProvider: 'claude', claudeModel: 'claude-sonnet', openaiModel: 'o', geminiModel: 'g', demoMode: false },
    }));
    const { resolveLlmConfig } = await import('../../ai/resolve.js');
    const result = resolveLlmConfig();
    expect(result.provider).toBe('claude');
    expect(result.model).toBe('claude-sonnet');
    vi.resetModules();
  });

  it('returns demo model when provider is demo', async () => {
    vi.doMock('../../config.js', () => ({
      config: { llmProvider: 'demo', openaiModel: 'o', geminiModel: 'g', claudeModel: 'c', demoMode: true },
    }));
    const { resolveLlmConfig } = await import('../../ai/resolve.js');
    const result = resolveLlmConfig();
    expect(result.provider).toBe('demo');
    expect(result.model).toBe('demo');
    expect(result.demoMode).toBe(true);
    vi.resetModules();
  });

  it('sets demoMode: true when config.demoMode is true', async () => {
    vi.doMock('../../config.js', () => ({
      config: { llmProvider: 'gemini', geminiModel: 'g', openaiModel: 'o', claudeModel: 'c', demoMode: true },
    }));
    const { resolveLlmConfig } = await import('../../ai/resolve.js');
    expect(resolveLlmConfig().demoMode).toBe(true);
    vi.resetModules();
  });
});