export type Lang = 'en' | 'uk';
export type Theme = 'light' | 'dark';
export type TimeRangeValue = '2w' | '2m' | 'all';

export interface TimeRangeOption {
  value: TimeRangeValue;
  label: string;
}

export interface TranslationStrings {
  appTagline: string;
  cvLabel: string;
  cvDrop: string;
  cvHint: string;
  queryLabel: string;
  queryPlaceholder: string;
  countryLabel: string;
  countryPlaceholder: string;
  timeRangeLabel: string;
  submitBtn: string;
  backBtn: string;
  topMatches: string;
  sortedBy: string;
  applyBtn: string;
  rationale: string;
  tryNext: string;
  salaryLabel: string;
  salaryHint: string;
  salaryEstimate: string;
  salaryEstimateNote: string;
  footer: string;
  loading: string[];
  timeRanges: TimeRangeOption[];
}

export type Translations = Record<Lang, TranslationStrings>;

export interface Country {
  code: string;
  name: string;
}

export interface Job {
  applyUrl: string;
  title: string;
  company: string;
  location: string;
  score: number;
  logoUrl?: string;
  salaryEstimate?: string;
  tags?: string[];
  rationale?: string;
}

export interface JobMatchResponse {
  jobs?: Job[];
  suggestions?: string[];
}

export interface CvExperience {
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface CvEducation {
  degree: string;
  institution: string;
  year: string;
}

export interface CvData {
  summary?: string;
  skills?: string[];
  experience?: CvExperience[];
  education?: CvEducation[];
}

export interface CvExtractionResponse {
  status: string;
  output?: CvData;
  message?: string;
}

export interface ApiError extends Error {
  status?: number;
  data?: Record<string, unknown>;
}
