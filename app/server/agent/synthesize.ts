import { getAIClient } from '../ai/AIClient.js';
import { buildSkillsSystemAppendix } from '../ai/skills/loader.js';
import type { JobMatchResult, JobListing } from '../types.js';
import type { RawJobListing } from './types.js';
import { formatBoardsForPrompt } from './boards.js';
import type { JobBoardDefinition } from './types.js';

const RANK_SYSTEM = `You are a job-matching analyst. You receive ONLY verified job listings collected by search tools.
Rules:
- Output jobs ONLY from the provided listings array (same applyUrl).
- Do not invent companies, titles, or URLs.
- Assign match score 0-100 using the job-match-scoring skill (weighted factors).
- Match transferable skills, not titles alone (see transferable-skills skill).
- rationale max 40 words; 2-5 tags per job.
- Return up to 10 jobs, sorted by score descending.
- Provide 3-5 suggestions as alternative search queries.`;

export async function rankListingsWithLlm(
  listings: RawJobListing[],
  boards: JobBoardDefinition[],
  input: {
    userPrompt: string;
    cvSummary?: string;
    cvSkills?: string[];
    jsonSchema: Record<string, unknown>;
  }
): Promise<JobMatchResult> {
  if (listings.length === 0) {
    throw new Error('No verified listings to rank.');
  }

  const allowList = listings.map((l) => ({
    title: l.title,
    company: l.company,
    location: l.location,
    applyUrl: l.applyUrl,
    source: l.source,
    snippet: l.snippet,
  }));

  const skills = buildSkillsSystemAppendix('job_match');
  const boardsBlock = formatBoardsForPrompt(boards);

  const userBlock = `${input.userPrompt}

${boardsBlock}

## Verified listings (use ONLY these applyUrl values)
${JSON.stringify(allowList, null, 2)}

${input.cvSummary ? `CV summary: ${input.cvSummary}` : ''}
${input.cvSkills?.length ? `CV skills: ${input.cvSkills.join(', ')}` : ''}`;

  const client = getAIClient();
  const result = await client.generateStructured<JobMatchResult>({
    task: 'job_match',
    systemPrompt: RANK_SYSTEM + skills,
    userPrompt: userBlock,
    jsonSchema: input.jsonSchema,
  });

  const allowed = new Set(listings.map((l) => l.applyUrl.toLowerCase()));
  const jobs: JobListing[] = (result.jobs ?? [])
    .filter((j) => j.applyUrl && allowed.has(j.applyUrl.toLowerCase()))
    .slice(0, 10);

  if (jobs.length === 0) {
    return fallbackRank(listings.slice(0, 10), input.cvSkills ?? []);
  }

  return {
    jobs,
    suggestions: result.suggestions?.length
      ? result.suggestions
      : buildDefaultSuggestions(input.userPrompt),
  };
}

function fallbackRank(listings: RawJobListing[], skills: string[]): JobMatchResult {
  const jobs: JobListing[] = listings.map((l, i) => ({
    title: l.title,
    company: l.company,
    location: l.location,
    applyUrl: l.applyUrl,
    score: Math.max(60, 92 - i * 3),
    rationale: `Matched via ${l.source}. ${skills.length ? `Relevant to: ${skills.slice(0, 3).join(', ')}.` : ''}`,
    tags: skills.slice(0, 4),
    logoUrl: undefined,
    salaryEstimate: undefined,
  }));
  return { jobs, suggestions: buildDefaultSuggestions('') };
}

function buildDefaultSuggestions(prompt: string): string[] {
  const base = prompt.slice(0, 40) || 'engineering';
  return [
    `${base} remote`,
    `senior ${base}`,
    `${base} hybrid`,
  ];
}
