/**
 * Builds server/data/job-boards.json from src/lib/jobWebsites.ts (run after editing JOB_WEBSITES). 
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tsPath = path.join(root, 'src/lib/jobWebsites.ts');
const outPath = path.join(root, 'server/data/job-boards.json');

const ts = fs.readFileSync(tsPath, 'utf8');
const block = ts.match(/export const JOB_WEBSITES[^=]*=\s*\[([\s\S]*?)\]\s*as const/)?.[1];
if (!block) throw new Error('Could not parse JOB_WEBSITES from jobWebsites.ts');

const entryRe =
  /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*url:\s*'([^']+)',\s*domain:\s*'([^']+)',\s*countries:\s*\[([^\]]*)\]\s*\}/g;

const SEARCH_TEMPLATES = {
  'remoteok': 'https://remoteok.com/remote-{query}-jobs',
  'dou-ua': 'https://jobs.dou.ua/vacancies/?search={query}',
  'work-ua': 'https://www.work.ua/jobs/?search={query}',
  'robota-ua': 'https://robota.ua/zapros/{query}',
  'djinni': 'https://djinni.co/jobs/?full_text={query}',
  'justjoin-pl': 'https://justjoin.it/job-offers/all/all?keyword={query}',
  'reed-uk': 'https://www.reed.co.uk/jobs/{query}-jobs',
};

const PARSER = {
  'dou-ua': 'dou',
  'work-ua': 'workua',
  'djinni': 'djinni',
  'remoteok': 'generic',
  'robota-ua': 'generic',
  'justjoin-pl': 'generic',
  'reed-uk': 'generic',
};

const PRIORITY = {
  linkedin: 10,
  'indeed-us': 10,
  'dou-ua': 10,
  'work-ua': 10,
  glassdoor: 9,
  djinni: 9,
  wellfound: 8,
  remoteok: 8,
};

function inferRegion(countries) {
  const local = countries.filter((c) => !['WORLDWIDE', 'REMOTE', 'GLOBAL'].includes(c));
  if (local.length === 0 || local.length > 6) return 'Global';
  if (local.includes('UA')) return 'Ukraine';
  if (local.includes('US')) return 'North America';
  if (local.includes('GB')) return 'United Kingdom';
  if (local.includes('DE')) return 'Germany';
  if (local.includes('FR')) return 'France';
  if (local.includes('NL')) return 'Netherlands';
  if (local.includes('PL')) return 'Poland';
  if (local.includes('CA')) return 'Canada';
  if (local.includes('AU')) return 'Australia';
  if (local.includes('IN')) return 'India';
  if (local.includes('BR')) return 'Brazil';
  if (local.includes('IL')) return 'Israel';
  if (local.includes('IE')) return 'Ireland';
  if (local.includes('ES')) return 'Spain';
  if (local.includes('IT')) return 'Italy';
  if (local.includes('SE')) return 'Sweden';
  if (local.includes('CH')) return 'Switzerland';
  if (local.includes('SG')) return 'Singapore';
  if (local.includes('JP')) return 'Japan';
  if (local.includes('KR')) return 'South Korea';
  if (local.includes('AE')) return 'Middle East';
  return 'Global';
}

const boards = [];
let m;
while ((m = entryRe.exec(block)) !== null) {
  const [, id, name, , domain, countriesRaw] = m;
  const countries = [...countriesRaw.matchAll(/'([^']+)'/g)].map((x) => x[1]);
  const board = {
    id,
    name,
    domain,
    region: inferRegion(countries),
    countries,
    parser: PARSER[id] ?? 'web-only',
    priority: PRIORITY[id] ?? 6,
  };
  if (SEARCH_TEMPLATES[id]) board.searchUrlTemplate = SEARCH_TEMPLATES[id];
  boards.push(board);
}

const payload = { version: 2, boards };
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n');
console.log(`[build-job-boards] wrote ${boards.length} boards -> ${outPath}`);
