import { describe, it, expect, vi, afterEach } from 'vitest';
import { BOARD_DOU } from '../fixtures/boards.js';
import type { ResolvedLlmConfig } from '../../ai/types.js';

// Mock to control provider without env var module caching
const mockResolveLlmConfig = vi.fn<() => ResolvedLlmConfig>();

vi.mock('../../ai/resolve.js', () => ({
  resolveLlmConfig: mockResolveLlmConfig,
}));

// Mock config, API keys are empty by default
vi.mock('../../config.js', () => ({
  config: {
    geminiApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    geminiModel: 'gemini-test',
    openaiModel: 'gpt-test',
    claudeModel: 'claude-test',
    jobSearchFetchTimeoutMs: 5000,
    jobSearchResultsPerBoard: 5,
    jobSearchConcurrency: 4,
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

// webSearchBackend

describe('webSearchBackend', () => {
  it('returns null in demo mode', async () => {
    mockResolveLlmConfig.mockReturnValue({ provider: 'demo', model: 'demo', demoMode: true });
    const { webSearchBackend } = await import('../../agent/tools/web-search.js');
    expect(webSearchBackend()).toBeNull();
  });

  it('returns gemini backend identifier', async () => {
    mockResolveLlmConfig.mockReturnValue({ provider: 'gemini', model: 'gemini-test', demoMode: false });
    const { webSearchBackend } = await import('../../agent/tools/web-search.js');
    expect(webSearchBackend()).toBe('gemini-google-search');
  });

  it('returns openai backend identifier', async () => {
    mockResolveLlmConfig.mockReturnValue({ provider: 'openai', model: 'gpt-test', demoMode: false });
    const { webSearchBackend } = await import('../../agent/tools/web-search.js');
    expect(webSearchBackend()).toBe('openai-web-search');
  });

  it('returns claude backend identifier', async () => {
    mockResolveLlmConfig.mockReturnValue({ provider: 'claude', model: 'claude-test', demoMode: false });
    const { webSearchBackend } = await import('../../agent/tools/web-search.js');
    expect(webSearchBackend()).toBe('claude-web-search');
  });
});

// ── webSearchJobs error paths ────────────────────────────────────────────────

describe('webSearchJobs error paths', () => {
  it('throws when called in demo mode', async () => {
    mockResolveLlmConfig.mockReturnValue({ provider: 'demo', model: 'demo', demoMode: true });
    const { webSearchJobs } = await import('../../agent/tools/web-search.js');
    await expect(webSearchJobs(BOARD_DOU, 'DevOps', 5)).rejects.toThrow(
      'Web search requires a real LLM provider'
    );
  });

  it('throws when gemini is selected but GEMINI_API_KEY is missing', async () => {
    mockResolveLlmConfig.mockReturnValue({ provider: 'gemini', model: 'gemini-test', demoMode: false });
    const { webSearchJobs } = await import('../../agent/tools/web-search.js');
    await expect(webSearchJobs(BOARD_DOU, 'DevOps', 5)).rejects.toThrow(
      'GEMINI_API_KEY is required'
    );
  });

  it('throws when openai is selected but OPENAI_API_KEY is missing', async () => {
    mockResolveLlmConfig.mockReturnValue({ provider: 'openai', model: 'gpt-test', demoMode: false });
    const { webSearchJobs } = await import('../../agent/tools/web-search.js');
    await expect(webSearchJobs(BOARD_DOU, 'DevOps', 5)).rejects.toThrow(
      'OPENAI_API_KEY is required'
    );
  });

  it('throws when claude is selected but ANTHROPIC_API_KEY is missing', async () => {
    mockResolveLlmConfig.mockReturnValue({ provider: 'claude', model: 'claude-test', demoMode: false });
    const { webSearchJobs } = await import('../../agent/tools/web-search.js');
    await expect(webSearchJobs(BOARD_DOU, 'DevOps', 5)).rejects.toThrow(
      'ANTHROPIC_API_KEY is required'
    );
  });
});
