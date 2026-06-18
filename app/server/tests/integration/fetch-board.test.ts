/**
 * Integration tests for fetchJobBoard.
 * Uses vi.stubGlobal to mock global fetch, no real HTTP calls made.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchJobBoard } from '../../agent/tools/fetch-board.js';
import { BOARD_DOU, BOARD_WORKUA, BOARD_WEB_ONLY } from '../fixtures/boards.js';

vi.mock('../../config.js', () => ({
  config: {
    jobSearchFetchTimeoutMs: 5000,
    jobSearchResultsPerBoard: 5,
    jobSearchConcurrency: 4,
    geminiApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    geminiModel: 'gemini-test',
    openaiModel: 'gpt-test',
    claudeModel: 'claude-test',
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
});

const DOU_HTML = `
  <ul>
    <li><a href="/vacancies/100/">DevOps Engineer</a><a class="company">Acme</a><span class="cities">Kyiv</span></li>
    <li><a href="/vacancies/101/">SRE Lead</a><a class="company">Beta Ltd</a><span class="cities">Remote</span></li>
  </ul>
`;

describe('fetchJobBoard', () => {
  it('fetches and parses HTML from a board URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => DOU_HTML,
    }));

    const results = await fetchJobBoard(BOARD_DOU, 'DevOps');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.applyUrl).toContain('jobs.dou.ua/vacancies/');
  });

  it('returns empty array for web-only boards without calling fetch', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const results = await fetchJobBoard(BOARD_WEB_ONLY, 'DevOps');

    expect(results).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('throws on non-ok HTTP response from board', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }));

    await expect(fetchJobBoard(BOARD_DOU, 'DevOps')).rejects.toThrow('HTTP 503');
  });

  it('substitutes {query} placeholder in the URL template', async () => {
    let capturedUrl = '';
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({ ok: true, text: async () => DOU_HTML });
    }));

    await fetchJobBoard(BOARD_DOU, 'platform engineer');

    expect(capturedUrl).toContain('platform');
    expect(capturedUrl).not.toContain('{query}');
  });

  it('propagates AbortError when fetch is cancelled', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(
      new DOMException('The user aborted a request.', 'AbortError')
    ));

    await expect(fetchJobBoard(BOARD_DOU, 'DevOps')).rejects.toThrow();
  });

  it('passes the correct board domain in the URL for Work.ua', async () => {
    let capturedUrl = '';
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({ ok: true, text: async () => '<html/>' });
    }));

    await fetchJobBoard(BOARD_WORKUA, 'React developer');

    expect(capturedUrl).toContain('work.ua');
    expect(capturedUrl).not.toContain('{query}');
  });
});