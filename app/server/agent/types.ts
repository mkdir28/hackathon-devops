export type BoardParser = 'web-only' | 'generic' | 'dou' | 'workua' | 'djinni';

export interface JobBoardDefinition {
  id: string;
  name: string;
  domain: string;
  region: string;
  countries: string[];
  parser: BoardParser;
  priority: number;
  searchUrlTemplate?: string;
}

export interface RawJobListing {
  title: string;
  company: string;
  location: string;
  applyUrl: string;
  source: string;
  sourceBoardId: string;
  snippet?: string;
}

export interface JobSearchAgentInput {
  query: string;
  countryCode: string;
  countryName: string;
  timeRange?: string;
  salaryHint?: string;
  cvSummary?: string;
  cvSkills?: string[];
  userPrompt: string;
  jsonSchema: Record<string, unknown>;
}

export interface AgentToolCallLog {
  tool: 'fetch_job_board' | 'web_search_jobs';
  boardId: string;
  boardName: string;
  status: 'ok' | 'error' | 'skipped';
  found: number;
  message?: string;
}
