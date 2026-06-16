import { describe, it, expect } from 'vitest';
import {
  parseDouVacancies,
  parseWorkUa,
  parseDjinni,
  parseGenericLinks,
  parseBoardHtml,
} from '../../agent/tools/parsers.js';
import { BOARD_DOU, BOARD_DJINNI, BOARD_WORKUA } from '../fixtures/boards.js';
import type { JobBoardDefinition } from '../../agent/types.js';

// DOU parser

describe('parseDouVacancies', () => {
  it('extracts vacancies from DOU HTML', () => {
    const html = `
      <html><body>
        <li>
          <a href="/vacancies/12345/">Senior DevOps Engineer</a>
          <a class="company" href="/companies/acme/">Acme Corp</a>
          <span class="cities">Kyiv</span>
        </li>
        <li>
          <a href="/vacancies/67890/">Platform SRE</a>
          <a class="company">Beta Ltd</a>
          <span class="cities">Remote</span>
        </li>
      </body></html>
    `;
    const results = parseDouVacancies(html, BOARD_DOU, 10);

    expect(results.length).toBe(2);
    expect(results[0]!.applyUrl).toContain('jobs.dou.ua');
    expect(results[0]!.applyUrl).toContain('/vacancies/12345/');
    expect(results[0]!.title).toBe('Senior DevOps Engineer');
    expect(results[0]!.sourceBoardId).toBe('dou');
  });

  it('respects the limit parameter', () => {
    const items = Array.from(
      { length: 20 },
      (_, i) => `<li><a href="/vacancies/${i + 100}/">Job ${i}</a></li>`
    ).join('');
    const html = `<ul>${items}</ul>`;

    const results = parseDouVacancies(html, BOARD_DOU, 5);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('skips the vacancies index page href', () => {
    const html = `
      <ul>
        <a href="/vacancies/">All Vacancies</a>
        <li><a href="/vacancies/99/">Real Job</a></li>
      </ul>
    `;
    const results = parseDouVacancies(html, BOARD_DOU, 10);
    expect(results.every((r) => !r.applyUrl.endsWith('/vacancies/'))).toBe(true);
  });

  it('deduplicates listings with the same URL', () => {
    const html = `
      <ul>
        <li><a href="/vacancies/111/">Same Job</a></li>
        <li><a href="/vacancies/111/">Same Job again</a></li>
      </ul>
    `;
    const results = parseDouVacancies(html, BOARD_DOU, 10);
    expect(results.length).toBe(1);
  });

  it('skips links with very short title text', () => {
    const html = `<ul><li><a href="/vacancies/555/">AB</a></li></ul>`;
    const results = parseDouVacancies(html, BOARD_DOU, 10);
    expect(results.length).toBe(0);
  });
});

// Work.ua parser

describe('parseWorkUa', () => {
  it('extracts work.ua jobs from HTML', () => {
    const html = `
      <html><body>
        <a href="/jobs/12345/">Node.js Developer</a>
        <a href="/jobs/67890/">React Developer</a>
      </body></html>
    `;
    const results = parseWorkUa(html, BOARD_WORKUA, 10);

    expect(results.length).toBe(2);
    expect(results[0]!.applyUrl).toMatch(/work\.ua\/jobs\/\d+/);
    expect(results[0]!.sourceBoardId).toBe('workua');
  });

  it('ignores links that do not match /jobs/N+ pattern', () => {
    const html = `
      <a href="/jobs/">All Jobs</a>
      <a href="/employers/">Employers</a>
      <a href="/jobs/9999/">Actual Listing</a>
    `;
    const results = parseWorkUa(html, BOARD_WORKUA, 10);
    expect(results.length).toBe(1);
    expect(results[0]!.applyUrl).toContain('/jobs/9999/');
  });
});

// Djinni parser

describe('parseDjinni', () => {
  it('extracts Djinni listings from HTML', () => {
    const html = `
      <html><body>
        <ul class="list-jobs">
          <li class="list-jobs__item">
            <a href="/jobs/abc-123/">
              <h2>Senior React Developer</h2>
            </a>
            <span class="company-name">Gamma Inc</span>
            <span class="location">Remote</span>
          </li>
        </ul>
      </body></html>
    `;
    const results = parseDjinni(html, BOARD_DJINNI, 10);

    expect(results.length).toBe(1);
    expect(results[0]!.applyUrl).toContain('djinni.co/jobs/abc-123/');
    expect(results[0]!.title).toBe('Senior React Developer');
  });

  it('skips /jobs/ index and search URLs', () => {
    const html = `
      <a href="/jobs/">Browse</a>
      <a href="/jobs/?keywords=python">Search</a>
      <a href="/jobs/real-job-123/"><h2>Real Job</h2></a>
    `;
    const results = parseDjinni(html, BOARD_DJINNI, 10);
    expect(results.length).toBe(1);
  });
});

// Generic link parser

describe('parseGenericLinks', () => {
  const genericBoard: JobBoardDefinition = {
    id: 'generic-test',
    name: 'Generic Board',
    domain: 'board.example.com',
    region: 'Global',
    countries: ['GLOBAL'],
    parser: 'generic',
    priority: 1,
  };

  it('extracts links matching job URL patterns', () => {
    const html = `
      <a href="https://board.example.com/jobs/sre-engineer">SRE Engineer Position</a>
      <a href="https://board.example.com/about-us">About the Company</a>
      <a href="https://board.example.com/vacancies/100">Vacancy 100</a>
    `;
    const results = parseGenericLinks(html, genericBoard, 10);
    expect(results.length).toBe(2);
    expect(results.every((r) => r.applyUrl.includes('board.example.com'))).toBe(true);
  });

  it('skips links with titles shorter than 8 characters', () => {
    const html = `<a href="https://board.example.com/jobs/1">Job A</a>`;
    const results = parseGenericLinks(html, genericBoard, 10);
    expect(results.length).toBe(0);
  });

  it('excludes links from different domains', () => {
    const html = `
      <a href="https://other.com/jobs/some-role">Other Domain Job</a>
      <a href="https://board.example.com/jobs/devops-role">DevOps position</a>
    `;
    const results = parseGenericLinks(html, genericBoard, 10);
    expect(results.length).toBe(1);
    expect(results[0]!.applyUrl).toContain('board.example.com');
  });
});

// parseBoardHtml dispatcher

describe('parseBoardHtml', () => {
  it('dispatches to parseDouVacancies for dou parser', () => {
    const html = `<li><a href="/vacancies/321/">DevOps Job</a></li>`;
    const results = parseBoardHtml(html, BOARD_DOU, 10);
    expect(Array.isArray(results)).toBe(true);
  });

  it('returns empty array for web-only parser type', () => {
    const unknownBoard: JobBoardDefinition = {
      ...BOARD_DOU,
      parser: 'web-only',
    };
    const html = `<a href="/vacancies/999/">Some Job</a>`;
    const results = parseBoardHtml(html, unknownBoard, 10);
    expect(results).toEqual([]);
  });
});