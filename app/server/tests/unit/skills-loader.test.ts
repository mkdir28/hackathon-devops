/**
 * Unit tests for ai/skills/loader.ts
 * node:fs is mocked
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Fake skill markdown

const FAKE_SKILL_MD = `# Job Match Scoring

> Score jobs based on skills overlap and experience.

## Rules
- Weight Kubernetes experience heavily.
- Remote positions score a bonus of +5.
`;

const FAKE_CV_SKILL_MD = `# CV Extraction

> Extract structured data from resumes.

## Output format
Return JSON with skills array.
`;

// Mock node:fs

const mockExistsSync = vi.fn();
const mockReaddirSync = vi.fn();
const mockReadFileSync = vi.fn();

vi.mock('node:fs', () => ({
  default: {
    existsSync: mockExistsSync,
    readdirSync: mockReaddirSync,
    readFileSync: mockReadFileSync,
  },
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
  readFileSync: mockReadFileSync,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  delete process.env.SKILLS_DIR;
});

// loadAllSkills

describe('loadAllSkills', () => {
  it('returns empty array when skills directory does not exist', async () => {
    mockExistsSync.mockReturnValue(false);

    const { loadAllSkills } = await import('../../ai/skills/loader.js');
    const skills = loadAllSkills();
    expect(skills).toEqual([]);
  });

  it('loads skills from SKILL.md files inside subdirectories', async () => {
    process.env.SKILLS_DIR = '/fake/skills';
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([
      { name: 'job-match-scoring', isDirectory: () => true, isFile: () => false },
    ]);
    mockReadFileSync.mockReturnValue(FAKE_SKILL_MD);

    const { loadAllSkills } = await import('../../ai/skills/loader.js');
    const skills = loadAllSkills();
    expect(skills.length).toBe(1);
    expect(skills[0]!.id).toBe('job-match-scoring');
    expect(skills[0]!.name).toBe('Job Match Scoring');
    expect(skills[0]!.description).toBe('Score jobs based on skills overlap and experience.');
  });

  it('loads skills from top-level .md files', async () => {
    process.env.SKILLS_DIR = '/fake/skills';
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([
      { name: 'cv-extraction.md', isDirectory: () => false, isFile: () => true },
    ]);
    mockReadFileSync.mockReturnValue(FAKE_CV_SKILL_MD);

    const { loadAllSkills } = await import('../../ai/skills/loader.js');
    const skills = loadAllSkills();
    expect(skills.length).toBe(1);
    expect(skills[0]!.id).toBe('cv-extraction');
    expect(skills[0]!.name).toBe('CV Extraction');
  });

  it('skips non-.md files and non-SKILL.md directories', async () => {
    process.env.SKILLS_DIR = '/fake/skills';
    mockExistsSync.mockImplementation((p: string) => {
      if (p === '/fake/skills') return true;
      // SKILL.md does not exist for 'not-a-skill' dir
      if (p.includes('not-a-skill')) return false;
      return false;
    });
    mockReaddirSync.mockReturnValue([
      { name: 'not-a-skill', isDirectory: () => true, isFile: () => false },
      { name: 'README.txt', isDirectory: () => false, isFile: () => true },
    ]);

    const { loadAllSkills } = await import('../../ai/skills/loader.js');
    const skills = loadAllSkills();
    expect(skills).toEqual([]);
  });

  it('uses SKILLS_DIR env variable to resolve root', async () => {
    process.env.SKILLS_DIR = '/custom/path/skills';
    mockExistsSync.mockReturnValue(false);

    const { loadAllSkills } = await import('../../ai/skills/loader.js');
    loadAllSkills();
    expect(mockExistsSync).toHaveBeenCalledWith('/custom/path/skills');
  });
});

// selectSkillsForTask

describe('selectSkillsForTask', () => {
  it('returns skills matching the job_match task IDs', async () => {
    process.env.SKILLS_DIR = '/fake/skills';
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([
      { name: 'job-match-scoring', isDirectory: () => true, isFile: () => false },
      { name: 'transferable-skills', isDirectory: () => true, isFile: () => false },
      { name: 'cv-extraction', isDirectory: () => true, isFile: () => false },
    ]);
    mockReadFileSync.mockReturnValue(FAKE_SKILL_MD);

    const { selectSkillsForTask } = await import('../../ai/skills/loader.js');
    const skills = selectSkillsForTask('job_match');
    // Only job_match id's are returned
    const ids = skills.map((s) => s.id);
    expect(ids).toContain('job-match-scoring');
    expect(ids).toContain('transferable-skills');
    expect(ids).not.toContain('cv-extraction');
  });

  it('returns skills matching the cv_extract task IDs', async () => {
    process.env.SKILLS_DIR = '/fake/skills';
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([
      { name: 'cv-extraction', isDirectory: () => true, isFile: () => false },
      { name: 'structured-output', isDirectory: () => true, isFile: () => false },
      { name: 'job-match-scoring', isDirectory: () => true, isFile: () => false },
    ]);
    mockReadFileSync.mockReturnValue(FAKE_CV_SKILL_MD);

    const { selectSkillsForTask } = await import('../../ai/skills/loader.js');
    const skills = selectSkillsForTask('cv_extract');
    const ids = skills.map((s) => s.id);
    expect(ids).toContain('cv-extraction');
    expect(ids).toContain('structured-output');
    expect(ids).not.toContain('job-match-scoring');
  });

  it('returns empty array when no skills match the task', async () => {
    process.env.SKILLS_DIR = '/fake/skills';
    mockExistsSync.mockReturnValue(false);

    const { selectSkillsForTask } = await import('../../ai/skills/loader.js');
    const skills = selectSkillsForTask('job_match');
    expect(skills).toEqual([]);
  });
});

// buildSkillsSystemAppendix

describe('buildSkillsSystemAppendix', () => {
  it('returns empty string when no skills match', async () => {
    process.env.SKILLS_DIR = '/fake/skills';
    mockExistsSync.mockReturnValue(false);

    const { buildSkillsSystemAppendix } = await import('../../ai/skills/loader.js');
    const result = buildSkillsSystemAppendix('job_match');
    expect(result).toBe('');
  });

  it('returns markdown appendix with skill content when skills are found', async () => {
    process.env.SKILLS_DIR = '/fake/skills';
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([
      { name: 'job-match-scoring', isDirectory: () => true, isFile: () => false },
    ]);
    mockReadFileSync.mockReturnValue(FAKE_SKILL_MD);

    const { buildSkillsSystemAppendix } = await import('../../ai/skills/loader.js');
    const appendix = buildSkillsSystemAppendix('job_match');
    expect(appendix).toContain('## Agent skills');
    expect(appendix).toContain('Job Match Scoring');
    expect(appendix).toContain(FAKE_SKILL_MD.trim());
  });
});