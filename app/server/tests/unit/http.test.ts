import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchHtml, encodeQuery } from '../../agent/tools/http.js';

afterEach(() => {
  vi.restoreAllMocks();
});

// encodeQuery

describe('encodeQuery', () => {
  it('URL-encodes spaces', () => {
    const encoded = encodeQuery('senior devops engineer');
    expect(encoded).toContain('%20');
  });

  it('trims leading and trailing whitespace', () => {
    const encoded = encodeQuery('  kubernetes  ');
    expect(encoded).toBe(encodeURIComponent('kubernetes'));
  });

  it('collapses multiple spaces into one before encoding', () => {
    const a = encodeQuery('devops  engineer');
    const b = encodeQuery('devops engineer');
    expect(a).toBe(b);
  });

  it('encodes special characters', () => {
    const encoded = encodeQuery('C++ developer');
    expect(encoded).toContain('C%2B%2B');
  });
});

// fetchHtml

describe('fetchHtml', () => {
  it('returns HTML body on successful fetch', async () => {
    const mockHtml = '<html><body>Job Board</body></html>';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockHtml,
    }));

    const result = await fetchHtml('https://example.com/jobs', 5000);
    expect(result).toBe(mockHtml);
  });

  it('throws on non-ok HTTP status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    }));

    await expect(fetchHtml('https://example.com/jobs', 5000))
      .rejects
      .toThrow('HTTP 403');
  });

  it('propagates AbortError when signal fires', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(
      new DOMException('The user aborted a request.', 'AbortError')
    ));

    await expect(fetchHtml('https://example.com/jobs', 5000))
      .rejects
      .toThrow();
  });

  it('sends a User-Agent header', async () => {
    let capturedInit: RequestInit | undefined;
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      capturedInit = init;
      return Promise.resolve({ ok: true, text: async () => '<html/>' });
    }));

    await fetchHtml('https://example.com', 5000);
    const headers = capturedInit?.headers as Record<string, string>;
    expect(headers['User-Agent']).toMatch(/JobMatchAgent/);
  });
});