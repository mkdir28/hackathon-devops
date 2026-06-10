import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LlmTask } from '../types.js';

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  content: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Task → skill folder names under `skills/` (repo root). */
const TASK_SKILL_MAP: Record<LlmTask, string[]> = {
  job_match: [
    'job-search',
    'global-job-boards',
    'agent-tools',
    'job-crawler',
    'job-match-scoring',
    'job-analyzer',
    'transferable-skills',
    'structured-output',
  ],
  cv_extract: ['cv-extraction', 'structured-output'],
};

function resolveSkillsRoot(): string {
  if (process.env.SKILLS_DIR) {
    return process.env.SKILLS_DIR;
  }
  const candidates = [
    path.resolve(process.cwd(), 'skills'),
    path.resolve(process.cwd(), '../skills'),
    path.resolve(__dirname, '../../../skills'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return candidates[0]!;
}

function parseSkillMarkdown(filePath: string, id: string): AgentSkill {
  const raw = fs.readFileSync(filePath, 'utf8');
  const titleMatch = raw.match(/^#\s+(.+)$/m);
  const descMatch = raw.match(/^>\s+(.+)$/m);
  return {
    id,
    name: titleMatch?.[1]?.trim() ?? id,
    description: descMatch?.[1]?.trim() ?? '',
    content: raw.trim(),
  };
}

let cache: AgentSkill[] | null = null;

export function loadAllSkills(): AgentSkill[] {
  if (cache) return cache;
  const root = resolveSkillsRoot();
  if (!fs.existsSync(root)) {
    cache = [];
    return cache;
  }
  const skills: AgentSkill[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const skillFile = path.join(root, entry.name, 'SKILL.md');
      if (fs.existsSync(skillFile)) {
        skills.push(parseSkillMarkdown(skillFile, entry.name));
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const skillFile = path.join(root, entry.name);
      const id = entry.name.replace(/\.md$/, '');
      skills.push(parseSkillMarkdown(skillFile, id));
    }
  }
  cache = skills;
  return skills;
}

export function selectSkillsForTask(task: LlmTask): AgentSkill[] {
  const ids = TASK_SKILL_MAP[task];
  const all = loadAllSkills();
  const byId = new Map(all.map((s) => [s.id, s]));
  return ids.map((id) => byId.get(id)).filter((s): s is AgentSkill => Boolean(s));
}

export function buildSkillsSystemAppendix(task: LlmTask): string {
  const selected = selectSkillsForTask(task);
  if (selected.length === 0) return '';
  const blocks = selected.map((s) => `### Skill: ${s.name}\n\n${s.content}`);
  return `\n\n---\n## Agent skills (follow for this request)\n\n${blocks.join('\n\n')}`;
}
