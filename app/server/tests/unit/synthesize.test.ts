/**
 * Unit tests for rankListingsWithLlm (synthesize.ts).
 * The AI client is mocked to isolate business logic from real LLM calls.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { JobMatchResult } from '../../types.js';
import { RAW_LISTINGS, BOARD_DOU, BOARD_DJINNI } from '../fixtures/boards.js';

// Mock AI client

const mockGenerateStructured = vi.fn<(args: any) => Promise<JobMatchResult>>();

vi.mock('../../ai/AIClient.js', () => ({
  getAIClient: () => ({
    provider: 'gemini',
    model: 'gemini-test',
    generateStructured: mockGenerateStructured,
  }),
}));

vi.mock('../../ai/skills/loader.js', () => ({
  buildSkillsSystemAppendix: vi.fn(() => ''),
  selectSkillsForTask: vi.fn(() => []),
  loadAllSkills: vi.fn(() => []),
}));

vi.mock('../../agent/boards.js', () => ({
  formatBoardsForPrompt: vi.fn(() => 'Board context'),
  selectBoardsForCountry: vi.fn(() => []),
  loadJobBoardCatalog: vi.fn(() => []),
}));

afterEach(() => {
  vi.clearAllMocks();
});

const BOARDS = [BOARD_DOU, BOARD_DJINNI];

const INPUT = {
  userPrompt: 'Find DevOps jobs',
  cvSummary: 'Kubernetes, Terraform expert',
  cvSkills: ['Kubernetes', 'Terraform'],
  jsonSchema: {},
};

describe('rankListingsWithLlm', () => {
  it('throws when listings array is empty', async () => {
    const { rankListingsWithLlm } = await import('../../agent/synthesize.js');
    await expect(rankListingsWithLlm([], BOARDS, INPUT)).rejects.toThrow(
      'No verified listings to rank.'
    );
  });

  it('returns valid jobs from the LLM response', async () => {
    mockGenerateStructured.mockResolvedValue({
      jobs: [
        {
          title: 'Senior DevOps Engineer',
          company: 'Acme Corp',
          location: 'Ukraine',
          applyUrl: RAW_LISTINGS[0]!.applyUrl,
          score: 88,
          rationale: 'Kubernetes match',
          tags: ['kubernetes'],
        },
      ],
      suggestions: ['devops remote'],
    });

    const { rankListingsWithLlm } = await import('../../agent/synthesize.js');
    const result = await rankListingsWithLlm(RAW_LISTINGS, BOARDS, INPUT);

    expect(result.jobs.length).toBe(1);
    expect(result.jobs[0]!.applyUrl).toBe(RAW_LISTINGS[0]!.applyUrl);
  });

  it('filters out hallucinated URLs not in the original listings', async () => {
    mockGenerateStructured.mockResolvedValue({
      jobs: [
        {
          title: 'Fake Job',
          company: 'Hallucinated Corp',
          location: 'Nowhere',
          applyUrl: 'https://invented.example.com/jobs/999/',
          score: 99,
          rationale: 'Best ever',
          tags: [],
        },
      ],
      suggestions: [],
    });

    const { rankListingsWithLlm } = await import('../../agent/synthesize.js');
    const result = await rankListingsWithLlm(RAW_LISTINGS, BOARDS, INPUT);

    // hallucinated URL filtered => fallback kicks in with real listings
    expect(result.jobs.every((j) => !j.applyUrl.includes('invented.example.com'))).toBe(true);
  });

  it('returns fallback results when LLM returns no valid jobs', async () => {
    mockGenerateStructured.mockResolvedValue({ jobs: [], suggestions: [] });

    const { rankListingsWithLlm } = await import('../../agent/synthesize.js');
    const result = await rankListingsWithLlm(RAW_LISTINGS, BOARDS, INPUT);

    expect(result.jobs.length).toBeGreaterThan(0);
    expect(result.jobs[0]!.score).toBeGreaterThanOrEqual(60);
  });

  it('caps the output at 10 jobs even when LLM returns more', async () => {
    const manyJobs = Array.from({ length: 15 }, (_, i) => ({
      title: `Job ${i}`,
      company: 'Corp',
      location: 'Remote',
      applyUrl: RAW_LISTINGS[0]!.applyUrl,
      score: 80 - i,
      rationale: 'ok',
      tags: [],
    }));
    mockGenerateStructured.mockResolvedValue({ jobs: manyJobs, suggestions: [] });

    const { rankListingsWithLlm } = await import('../../agent/synthesize.js');
    const result = await rankListingsWithLlm(RAW_LISTINGS, BOARDS, INPUT);

    expect(result.jobs.length).toBeLessThanOrEqual(10);
  });

  it('generates default suggestions when LLM returns none', async () => {
    mockGenerateStructured.mockResolvedValue({ jobs: [], suggestions: [] });

    const { rankListingsWithLlm } = await import('../../agent/synthesize.js');
    const result = await rankListingsWithLlm(RAW_LISTINGS, BOARDS, INPUT);

    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('uses LLM suggestions when provided alongside valid jobs', async () => {
    mockGenerateStructured.mockResolvedValue({
      jobs: [
        {
          title: 'Senior DevOps Engineer',
          company: 'Acme',
          location: 'Ukraine',
          applyUrl: RAW_LISTINGS[0]!.applyUrl,
          score: 85,
          rationale: 'Good match',
          tags: ['kubernetes'],
        },
      ],
      suggestions: ['platform engineer remote', 'sre lead', 'kubernetes consultant'],
    });

    const { rankListingsWithLlm } = await import('../../agent/synthesize.js');
    const result = await rankListingsWithLlm(RAW_LISTINGS, BOARDS, INPUT);

    expect(result.suggestions).toContain('platform engineer remote');
  });

  it('sends cvSummary and cvSkills in the LLM user prompt', async () => {
    mockGenerateStructured.mockResolvedValue({ jobs: [], suggestions: [] });

    const { rankListingsWithLlm } = await import('../../agent/synthesize.js');
    await rankListingsWithLlm(RAW_LISTINGS, BOARDS, INPUT);

    const call = mockGenerateStructured.mock.calls[0]![0];
    expect(call.userPrompt).toContain('Kubernetes, Terraform expert');
    expect(call.userPrompt).toContain('Kubernetes, Terraform');
    expect(call.task).toBe('job_match');
  });
});
