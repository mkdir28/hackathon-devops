/**
 * Unit tests for services/llm.ts
 *
 * AIClient and runJobSearchAgent are mocked.
 * config.demoMode is controlled via a mutable hoisted object so individual
 * tests can toggle it without needing vi.resetModules() / vi.doMock.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { JobMatchResult } from '../../types.js';

//  Mutable config 

const cfg = vi.hoisted(() => ({ demoMode: false as boolean }));

vi.mock('../../config.js', () => ({
  get config() {
    return cfg;
  },
}));

// Mock AIClient 

const mockGenerateStructured = vi.fn<(req: Record<string, unknown>) => Promise<unknown>>();

vi.mock('../../ai/AIClient.js', () => ({
  getAIClient: vi.fn(() => ({
    provider: 'demo' as const,
    model: 'demo',
    generateStructured: mockGenerateStructured,
  })),
}));

// runJobSearchAgent 

const mockRunJobSearchAgent = vi.fn<() => Promise<JobMatchResult>>();

vi.mock('../../agent/JobSearchAgent.js', () => ({
  runJobSearchAgent: mockRunJobSearchAgent,
}));

// ── Mock skills loader ────────────────────────────────────────────────────────

const mockSelectSkillsForTask = vi.fn(() => [] as Array<{ id: string; name: string; description: string; content: string }>);

vi.mock('../../ai/skills/loader.js', () => ({
  selectSkillsForTask: mockSelectSkillsForTask,
  buildSkillsSystemAppendix: vi.fn(() => ''),
  loadAllSkills: vi.fn(() => []),
}));

// Shared fixture

const DEMO_JOB_MATCH: JobMatchResult = {
  jobs: [
    {
      title: 'DevOps Engineer',
      company: 'Demo Corp',
      location: 'Remote',
      score: 88,
      rationale: 'demo',
      tags: ['kubernetes'],
      applyUrl: 'https://example.com/jobs/1',
    },
  ],
  suggestions: ['platform engineer'],
};

beforeEach(() => {
  vi.clearAllMocks();
  cfg.demoMode = false; 
});

// runAgenticJobMatch 

describe('runAgenticJobMatch', () => {
  it('calls DemoAIClient in demo mode', async () => {
    cfg.demoMode = true;
    mockGenerateStructured.mockResolvedValue(DEMO_JOB_MATCH);

    const { runAgenticJobMatch } = await import('../../services/llm.js');
    const result = await runAgenticJobMatch({
      prompt: 'Find DevOps jobs',
      query: 'DevOps',
      countryCode: 'UA',
      countryName: 'Ukraine',
      response_json_schema: {},
    });

    expect(mockGenerateStructured).toHaveBeenCalledWith(
      expect.objectContaining({ task: 'job_match' })
    );
    expect(result.jobs.length).toBeGreaterThan(0);
  });

  it('calls runJobSearchAgent when not in demo mode', async () => {
    cfg.demoMode = false;
    mockRunJobSearchAgent.mockResolvedValue(DEMO_JOB_MATCH);

    const { runAgenticJobMatch } = await import('../../services/llm.js');
    const result = await runAgenticJobMatch({
      prompt: 'Find DevOps jobs',
      query: 'DevOps',
      countryCode: 'UA',
      countryName: 'Ukraine',
      cvSummary: 'Kubernetes expert',
      cvSkills: ['kubernetes'],
      response_json_schema: {},
    });

    expect(mockRunJobSearchAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'DevOps',
        countryCode: 'UA',
        cvSummary: 'Kubernetes expert',
        cvSkills: ['kubernetes'],
      })
    );
    expect(result).toEqual(DEMO_JOB_MATCH);
  });

  it('passes timeRange and salaryHint to the agent', async () => {
    cfg.demoMode = false;
    mockRunJobSearchAgent.mockResolvedValue(DEMO_JOB_MATCH);

    const { runAgenticJobMatch } = await import('../../services/llm.js');
    await runAgenticJobMatch({
      prompt: 'jobs',
      query: 'DevOps',
      countryCode: 'US',
      countryName: 'United States',
      timeRange: 'last 7 days',
      salaryHint: '$100k+',
      response_json_schema: {},
    });

    expect(mockRunJobSearchAgent).toHaveBeenCalledWith(
      expect.objectContaining({ timeRange: 'last 7 days', salaryHint: '$100k+' })
    );
  });

  it('forwards userPrompt to the agent as the prompt field', async () => {
    cfg.demoMode = false;
    mockRunJobSearchAgent.mockResolvedValue(DEMO_JOB_MATCH);

    const { runAgenticJobMatch } = await import('../../services/llm.js');
    await runAgenticJobMatch({
      prompt: 'MY SPECIFIC PROMPT',
      query: 'SRE',
      countryCode: 'DE',
      countryName: 'Germany',
      response_json_schema: {},
    });

    expect(mockRunJobSearchAgent).toHaveBeenCalledWith(
      expect.objectContaining({ userPrompt: 'MY SPECIFIC PROMPT' })
    );
  });
});

// extractCvStructured

describe('extractCvStructured', () => {
  it('returns parsed CV extraction result when status field is present', async () => {
    mockGenerateStructured.mockResolvedValue({
      status: 'success',
      output: { summary: 'DevOps Engineer', skills: ['Kubernetes'] },
    });

    const { extractCvStructured } = await import('../../services/llm.js');
    const result = await extractCvStructured({ text: 'John Doe, DevOps...', json_schema: {} });

    expect(result.status).toBe('success');
    expect(mockGenerateStructured).toHaveBeenCalledWith(
      expect.objectContaining({ task: 'cv_extract' })
    );
  });

  it('wraps raw output in success envelope when status field is missing', async () => {
    mockGenerateStructured.mockResolvedValue({ skills: ['Docker'], summary: 'Engineer' });

    const { extractCvStructured } = await import('../../services/llm.js');
    const result = await extractCvStructured({ text: 'Some CV text', json_schema: {} });

    expect(result.status).toBe('success');
    expect(result.output).toBeDefined();
  });

  it('includes the CV text in the LLM user prompt', async () => {
    mockGenerateStructured.mockResolvedValue({ status: 'success', output: {} });

    const { extractCvStructured } = await import('../../services/llm.js');
    await extractCvStructured({ text: 'CV TEXT GOES HERE', json_schema: {} });

    const callArgs = mockGenerateStructured.mock.calls[0]![0] as unknown as { userPrompt: string };
    expect(callArgs.userPrompt).toContain('CV TEXT GOES HERE');
  });

  it('passes the json_schema to the LLM request', async () => {
    const schema = { type: 'object', properties: { skills: { type: 'array' } } };
    mockGenerateStructured.mockResolvedValue({ status: 'success', output: {} });

    const { extractCvStructured } = await import('../../services/llm.js');
    await extractCvStructured({ text: 'test', json_schema: schema });

    const callArgs = mockGenerateStructured.mock.calls[0]![0] as unknown as { jsonSchema: unknown };
    expect(callArgs.jsonSchema).toEqual(schema);
  });
});

// getActiveSkillIdsForTask

describe('getActiveSkillIdsForTask', () => {
  it('returns skill IDs for job_match task', async () => {
    mockSelectSkillsForTask.mockReturnValue([
      { id: 'job-match-scoring', name: 'Scoring', description: '', content: '' },
      { id: 'transferable-skills', name: 'Skills', description: '', content: '' },
    ]);

    const { getActiveSkillIdsForTask } = await import('../../services/llm.js');
    const ids = getActiveSkillIdsForTask('job_match');
    expect(ids).toContain('job-match-scoring');
    expect(ids).toContain('transferable-skills');
  });

  it('returns empty array when no skills are loaded', async () => {
    mockSelectSkillsForTask.mockReturnValue([]);

    const { getActiveSkillIdsForTask } = await import('../../services/llm.js');
    const ids = getActiveSkillIdsForTask('cv_extract');
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBe(0);
  });
});