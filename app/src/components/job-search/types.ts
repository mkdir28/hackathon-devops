import type { Job, TimeRangeValue } from '@/types';

export interface SearchFormProps {
  query: string;
  setQuery: (value: string) => void;
  country: string;
  setCountry: (value: string) => void;
  timeRange: TimeRangeValue;
  setTimeRange: (value: TimeRangeValue) => void;
  salaryRange: [number, number];
  setSalaryRange: (value: [number, number]) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export interface JobCardProps {
  job: Job;
  index: number;
  isSaved: boolean;
  onSaveToggle: (job: Job) => void;
}

export interface ResultsListProps {
  results: Job[];
  suggestions: string[];
  onSuggestionSelect: (suggestion: string) => void;
  onBack: () => void;
}
