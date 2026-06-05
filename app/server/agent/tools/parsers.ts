import * as cheerio from 'cheerio';
import type { JobBoardDefinition, RawJobListing } from '../types.js';

function normalizeUrl(href: string, base: string): string | null {
  try {
    const u = new URL(href, base);
    if (!/^https?:$/i.test(u.protocol)) return null;
    return u.href.split('#')[0] ?? null;
  } catch {
    return null;
  }
}

function pushUnique(
  out: RawJobListing[],
  seen: Set<string>,
  item: RawJobListing
): void {
  const key = item.applyUrl.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  out.push(item);
}

export function parseDouVacancies(
  html: string,
  board: JobBoardDefinition,
  limit: number
): RawJobListing[] {
  const $ = cheerio.load(html);
  const out: RawJobListing[] = [];
  const seen = new Set<string>();
  const base = 'https://jobs.dou.ua';

  $('a[href*="/vacancies/"]').each((_, el) => {
    if (out.length >= limit) return false;
    const href = $(el).attr('href');
    if (!href || href.endsWith('/vacancies/')) return;
    const url = normalizeUrl(href, base);
    if (!url || !url.includes('/vacancies/')) return;

    const title = $(el).text().trim() || $(el).find('h2, .title').text().trim();
    if (title.length < 3) return;

    const row = $(el).closest('li, article, .vacancy, div');
    const company =
      row.find('.company, .company-name, a[href*="/companies/"]').first().text().trim() ||
      'Unknown';
    const location = row.find('.cities, .location').first().text().trim() || 'Ukraine';

    pushUnique(out, seen, {
      title,
      company,
      location,
      applyUrl: url,
      source: board.name,
      sourceBoardId: board.id,
    });
  });

  return out;
}

export function parseWorkUa(
  html: string,
  board: JobBoardDefinition,
  limit: number
): RawJobListing[] {
  const $ = cheerio.load(html);
  const out: RawJobListing[] = [];
  const seen = new Set<string>();
  const base = 'https://www.work.ua';

  $('a[href*="/jobs/"]').each((_, el) => {
    if (out.length >= limit) return false;
    const href = $(el).attr('href');
    if (!href || !/\/jobs\/\d+/.test(href)) return;
    const url = normalizeUrl(href, base);
    if (!url) return;

    const title = $(el).text().trim();
    if (title.length < 3) return;

    pushUnique(out, seen, {
      title,
      company: 'See listing',
      location: 'Ukraine',
      applyUrl: url,
      source: board.name,
      sourceBoardId: board.id,
    });
  });

  return out;
}

export function parseDjinni(
  html: string,
  board: JobBoardDefinition,
  limit: number
): RawJobListing[] {
  const $ = cheerio.load(html);
  const out: RawJobListing[] = [];
  const seen = new Set<string>();
  const base = 'https://djinni.co';

  $('a[href*="/jobs/"]').each((_, el) => {
    if (out.length >= limit) return false;
    const href = $(el).attr('href');
    if (!href || href === '/jobs/' || href.startsWith('/jobs/?')) return;
    const url = normalizeUrl(href, base);
    if (!url || !url.includes('/jobs/')) return;

    const title =
      $(el).find('h2, .job-title, strong').first().text().trim() || $(el).text().trim();
    if (title.length < 3) return;

    const card = $(el).closest('li, article, .list-jobs__item');
    const company = card.find('.company, .company-name').first().text().trim() || 'Unknown';

    pushUnique(out, seen, {
      title,
      company,
      location: card.find('.location').text().trim() || 'Remote / Ukraine',
      applyUrl: url,
      source: board.name,
      sourceBoardId: board.id,
    });
  });

  return out;
}

export function parseGenericLinks(
  html: string,
  board: JobBoardDefinition,
  limit: number
): RawJobListing[] {
  const $ = cheerio.load(html);
  const out: RawJobListing[] = [];
  const seen = new Set<string>();
  const base = `https://${board.domain}`;

  const jobPatterns = [
    /vacanc/i,
    /job/i,
    /career/i,
    /position/i,
    /opening/i,
  ];

  $('a[href]').each((_, el) => {
    if (out.length >= limit) return false;
    const href = $(el).attr('href');
    if (!href) return;
    const url = normalizeUrl(href, base);
    if (!url || !url.includes(board.domain)) return;
    if (!jobPatterns.some((p) => p.test(url))) return;

    const title = $(el).text().trim().replace(/\s+/g, ' ');
    if (title.length < 8 || title.length > 120) return;

    pushUnique(out, seen, {
      title,
      company: 'See listing',
      location: board.region,
      applyUrl: url,
      source: board.name,
      sourceBoardId: board.id,
    });
  });

  return out;
}

export function parseBoardHtml(
  html: string,
  board: JobBoardDefinition,
  limit: number
): RawJobListing[] {
  switch (board.parser) {
    case 'dou':
      return parseDouVacancies(html, board, limit);
    case 'workua':
      return parseWorkUa(html, board, limit);
    case 'djinni':
      return parseDjinni(html, board, limit);
    case 'generic':
      return parseGenericLinks(html, board, limit);
    default:
      return [];
  }
}
