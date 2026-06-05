import type { Country, TimeRangeOption } from '@/types';

export const COUNTRIES: Country[] = [
  { code: "WORLDWIDE", name: "Worldwide" },
  { code: "UA", name: "Ukraine" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SG", name: "Singapore" },
  { code: "JP", name: "Japan" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "IL", name: "Israel" },
  { code: "IE", name: "Ireland" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "PL", name: "Poland" },
  { code: "KR", name: "South Korea" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "REMOTE", name: "Remote / Worldwide" },
];

export const TIME_RANGES: TimeRangeOption[] = [
  { value: "2w", label: "Past 2 weeks" },
  { value: "2m", label: "Past 2 months" },
  { value: "all", label: "Any time" },
];