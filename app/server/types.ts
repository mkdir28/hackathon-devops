export interface JobListing {
  title: string;
  company: string;
  location: string;
  score: number;
  rationale: string;
  tags: string[];
  applyUrl: string;
  logoUrl?: string;
  salaryEstimate?: string;
}

export interface JobMatchResult {
  jobs: JobListing[];
  suggestions: string[];
}

export interface CvExtractionResult {
  status: 'success' | 'error';
  output?: Record<string, unknown>;
  message?: string;
}
