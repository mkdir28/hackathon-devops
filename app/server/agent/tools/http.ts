const DEFAULT_UA =
  'Mozilla/5.0 (compatible; JobMatchAgent/1.0; +https://github.com/devops-sre-job-match)';

export async function fetchHtml(
  url: string,
  timeoutMs: number
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': DEFAULT_UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9,uk;q=0.8',
        'Accept-Encoding': 'identity',
      },
      redirect: 'follow',
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export function encodeQuery(q: string): string {
  return encodeURIComponent(q.trim().replace(/\s+/g, ' '));
}
