import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { JobBoardDefinition } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let catalogCache: JobBoardDefinition[] | null = null;

function catalogPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'server/data/job-boards.json'),
    path.resolve(process.cwd(), 'data/job-boards.json'),
    path.resolve(__dirname, '../data/job-boards.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[2]!;
}

export function loadJobBoardCatalog(): JobBoardDefinition[] {
  if (catalogCache) return catalogCache;
  const raw = JSON.parse(fs.readFileSync(catalogPath(), 'utf8')) as {
    boards: JobBoardDefinition[];
  };
  catalogCache = raw.boards;
  return catalogCache;
}

const GLOBAL_CODES = new Set(['GLOBAL', 'WORLDWIDE', 'REMOTE']);

export function selectBoardsForCountry(
  countryCode: string,
  maxBoards: number
): JobBoardDefinition[] {
  const code = countryCode.toUpperCase();
  const all = loadJobBoardCatalog();

  const matched = all.filter((b) => {
    if (GLOBAL_CODES.has(code)) {
      return b.countries.some((c) => GLOBAL_CODES.has(c));
    }
    return (
      b.countries.includes(code) ||
      b.countries.some((c) => GLOBAL_CODES.has(c))
    );
  });

  const byPriority = [...matched].sort((a, b) => b.priority - a.priority);
  const seen = new Set<string>();
  const unique: JobBoardDefinition[] = [];
  for (const board of byPriority) {
    if (seen.has(board.id)) continue;
    seen.add(board.id);
    unique.push(board);
    if (unique.length >= maxBoards) break;
  }
  return unique;
}

export function formatBoardsForPrompt(boards: JobBoardDefinition[]): string {
  const byRegion = new Map<string, JobBoardDefinition[]>();
  for (const b of boards) {
    const list = byRegion.get(b.region) ?? [];
    list.push(b);
    byRegion.set(b.region, list);
  }
  const lines: string[] = ['## Job boards targeted for this search'];
  for (const [region, list] of [...byRegion.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    lines.push(`### ${region}`);
    for (const b of list) {
      lines.push(`- ${b.name} (${b.domain}) [${b.id}]`);
    }
  }
  return lines.join('\n');
}
