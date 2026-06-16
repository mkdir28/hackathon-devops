/**
 * Unit tests for agent/boards.ts
 * fs is mocked so no job-boards.json file is required on disk.
 */
import { describe, it, expect, vi } from 'vitest';
import type { JobBoardDefinition } from '../../agent/types.js';

// Fake catalog used across all tests

const FAKE_BOARDS: JobBoardDefinition[] = [
  { id: 'dou',       name: 'DOU.ua',       domain: 'jobs.dou.ua', region: 'Ukraine',  countries: ['UA', 'GLOBAL'],    parser: 'dou',     priority: 10, searchUrlTemplate: 'https://jobs.dou.ua/vacancies/?search={query}' },
  { id: 'djinni',   name: 'Djinni',        domain: 'djinni.co',   region: 'Remote',   countries: ['UA', 'GLOBAL'],    parser: 'djinni',  priority: 9,  searchUrlTemplate: 'https://djinni.co/jobs/?keyword={query}' },
  { id: 'workua',   name: 'Work.ua',       domain: 'work.ua',     region: 'Ukraine',  countries: ['UA'],              parser: 'workua',  priority: 8,  searchUrlTemplate: 'https://www.work.ua/jobs/{query}/' },
  { id: 'linkedin', name: 'LinkedIn',      domain: 'linkedin.com',region: 'Global',   countries: ['GLOBAL'],          parser: 'generic', priority: 7 },
  { id: 'xing',     name: 'Xing',          domain: 'xing.com',    region: 'Germany',  countries: ['DE', 'GLOBAL'],    parser: 'generic', priority: 5 },
  { id: 'stepstone',name: 'StepStone DE',  domain: 'stepstone.de',region: 'Germany',  countries: ['DE'],              parser: 'generic', priority: 4 },
];

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn().mockReturnValue(JSON.stringify({ boards: FAKE_BOARDS })),
    readdirSync: vi.fn().mockReturnValue([]),
  },
  existsSync: vi.fn().mockReturnValue(true),
  readFileSync: vi.fn().mockReturnValue(JSON.stringify({ boards: FAKE_BOARDS })),
  readdirSync: vi.fn().mockReturnValue([]),
}));

// formatBoardsForPrompt

describe('formatBoardsForPrompt', () => {
  it('produces a markdown string with region headers', async () => {
    const { formatBoardsForPrompt } = await import('../../agent/boards.js');
    const out = formatBoardsForPrompt(FAKE_BOARDS.slice(0, 2));
    expect(out).toContain('## Job boards targeted for this search');
    expect(out).toContain('DOU.ua');
    expect(out).toContain('Djinni');
  });

  it('groups boards under their region header', async () => {
    const { formatBoardsForPrompt } = await import('../../agent/boards.js');
    const out = formatBoardsForPrompt([FAKE_BOARDS[0]!, FAKE_BOARDS[2]!]);
    expect(out).toContain('### Ukraine');
    expect(out).toContain('- DOU.ua');
    expect(out).toContain('- Work.ua');
  });

  it('sorts regions alphabetically', async () => {
    const { formatBoardsForPrompt } = await import('../../agent/boards.js');
    const out = formatBoardsForPrompt([FAKE_BOARDS[3]!, FAKE_BOARDS[0]!]); 
    const globalIdx = out.indexOf('### Global');
    const ukraineIdx = out.indexOf('### Ukraine');
    expect(globalIdx).toBeLessThan(ukraineIdx);
  });

  it('returns empty section header when boards array is empty', async () => {
    const { formatBoardsForPrompt } = await import('../../agent/boards.js');
    const out = formatBoardsForPrompt([]);
    expect(out).toContain('## Job boards targeted for this search');
  });

  it('includes domain and id in each board line', async () => {
    const { formatBoardsForPrompt } = await import('../../agent/boards.js');
    const out = formatBoardsForPrompt([FAKE_BOARDS[0]!]);
    expect(out).toContain('jobs.dou.ua');
    expect(out).toContain('[dou]');
  });
});

// selectBoardsForCountry

describe('selectBoardsForCountry', () => {
  it('returns global boards when code is GLOBAL', async () => {
    const { selectBoardsForCountry } = await import('../../agent/boards.js');
    const boards = selectBoardsForCountry('GLOBAL', 20);
    // Only boards that have a GLOBAL_CODES country
    expect(boards.every((b) =>
      b.countries.some((c) => ['GLOBAL', 'WORLDWIDE', 'REMOTE'].includes(c))
    )).toBe(true);
  });

  it('returns global boards when code is WORLDWIDE', async () => {
    const { selectBoardsForCountry } = await import('../../agent/boards.js');
    const boards = selectBoardsForCountry('WORLDWIDE', 20);
    expect(boards.length).toBeGreaterThan(0);
  });

  it('returns UA-specific + global boards for UA country', async () => {
    const { selectBoardsForCountry } = await import('../../agent/boards.js');
    const boards = selectBoardsForCountry('UA', 20);
    const ids = boards.map((b) => b.id);
    expect(ids).toContain('dou');
    expect(ids).toContain('workua');
    expect(ids).toContain('linkedin');
  });

  it('returns only global boards for unknown country code', async () => {
    const { selectBoardsForCountry } = await import('../../agent/boards.js');
    const boards = selectBoardsForCountry('ZZ', 20);
    // ZZ has no boards → only global ones
    expect(boards.every((b) =>
      b.countries.some((c) => ['GLOBAL', 'WORLDWIDE', 'REMOTE'].includes(c))
    )).toBe(true);
  });

  it('respects maxBoards limit', async () => {
    const { selectBoardsForCountry } = await import('../../agent/boards.js');
    const boards = selectBoardsForCountry('UA', 2);
    expect(boards.length).toBeLessThanOrEqual(2);
  });

  it('returns boards sorted by priority descending', async () => {
    const { selectBoardsForCountry } = await import('../../agent/boards.js');
    const boards = selectBoardsForCountry('UA', 20);
    for (let i = 1; i < boards.length; i++) {
      expect(boards[i - 1]!.priority).toBeGreaterThanOrEqual(boards[i]!.priority);
    }
  });

  it('deduplicates boards with the same id', async () => {
    const { selectBoardsForCountry } = await import('../../agent/boards.js');
    const boards = selectBoardsForCountry('UA', 20);
    const ids = boards.map((b) => b.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  it('is case-insensitive for country code', async () => {
    const { selectBoardsForCountry } = await import('../../agent/boards.js');
    const upper = selectBoardsForCountry('UA', 20).map((b) => b.id);
    const lower = selectBoardsForCountry('ua', 20).map((b) => b.id);
    expect(upper).toEqual(lower);
  });

  it('returns DE-specific boards for DE country', async () => {
    const { selectBoardsForCountry } = await import('../../agent/boards.js');
    const boards = selectBoardsForCountry('DE', 20);
    const ids = boards.map((b) => b.id);
    expect(ids).toContain('xing');
    expect(ids).toContain('stepstone');
  });
});

// loadJobBoardCatalog

describe('loadJobBoardCatalog', () => {
  it('loads boards from the JSON file', async () => {
    const { loadJobBoardCatalog } = await import('../../agent/boards.js');
    const catalog = loadJobBoardCatalog();
    expect(catalog.length).toBe(FAKE_BOARDS.length);
    expect(catalog[0]!.id).toBe('dou');
  });

  it('returns the same array on repeated calls (cache hit)', async () => {
    const { loadJobBoardCatalog } = await import('../../agent/boards.js');
    const first = loadJobBoardCatalog();
    const second = loadJobBoardCatalog();
    expect(first).toBe(second); 
  });
});