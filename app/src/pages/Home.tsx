import { useState, useCallback } from "react";
import { api } from "@/api/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import { COUNTRIES } from "@/lib/countries";
import { formatJobWebsitesForPrompt } from "@/lib/jobWebsites";
import { ThemeProvider, useTheme } from "@/lib/ThemeContext";
import { translations } from "@/lib/i18n";
import type { ApiError, CvData, Job, TimeRangeValue } from "@/types";
import Header from "@/components/job-search/Header";
import SearchForm from "@/components/job-search/SearchForm";
import LoadingState from "@/components/job-search/LoadingState";
import ResultsList from "@/components/job-search/ResultsList";
import { toast } from "sonner";

const JOB_MATCH_SCHEMA = {
  type: "object",
  properties: {
    jobs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          company: { type: "string" },
          location: { type: "string" },
          score: { type: "number" },
          rationale: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          applyUrl: { type: "string", description: "Direct URL to the job posting on LinkedIn, Indeed, DOU.ua, work.ua, jooble.ua, glassdoor, or another job board. REQUIRED — must be a real, specific URL to the actual job listing." },
          logoUrl: { type: "string", description: "URL to the company logo image. Try: https://logo.clearbit.com/{domain} using the company website domain." },
          salaryEstimate: { type: "string", description: "Estimated monthly salary range in USD based on public data from DOU.ua, Glassdoor, LinkedIn, and other sources. Format as '$X,XXX – $X,XXX / mo'. Leave empty if truly unknown." },
        },
      },
    },
    suggestions: { type: "array", items: { type: "string" } },
  },
};

const CV_SCHEMA = {
  type: "object",
  properties: {
    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: { type: "string" },
          company: { type: "string" },
          duration: { type: "string" },
          description: { type: "string" },
        },
      },
    },
    skills: { type: "array", items: { type: "string" } },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          degree: { type: "string" },
          institution: { type: "string" },
          year: { type: "string" },
        },
      },
    },
    summary: { type: "string" },
  },
};

function formatSalary(val: number): string {
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
  return `$${val}`;
}

function buildPrompt(
  cvData: CvData | null,
  query: string,
  country: string,
  timeRange: TimeRangeValue,
  salaryRange: [number, number]
): string {
  const countryName = COUNTRIES.find((c) => c.code === country)?.name || country;
  const timeLabel =
    timeRange === "2w" ? "past 2 weeks"
    : timeRange === "2m" ? "past 2 months"
    : "any time period";

  const [salMin, salMax] = salaryRange;
  const salaryFilter = (salMin > 500 || salMax < 20000)
    ? `- Expected salary: ${formatSalary(salMin)} – ${formatSalary(salMax)} per month (USD)${salMax >= 20000 ? "+" : ""}`
    : "";

  let cvSection = "";
  if (cvData) {
    cvSection = `
## Candidate CV Data:
${cvData.summary ? `Summary: ${cvData.summary}` : ""}
${cvData.skills?.length ? `Skills: ${cvData.skills.join(", ")}` : ""}
${cvData.experience?.length ? `Experience:\n${cvData.experience.map((e) => `- ${e.role} at ${e.company} (${e.duration}): ${e.description}`).join("\n")}` : ""}
${cvData.education?.length ? `Education:\n${cvData.education.map((e) => `- ${e.degree} from ${e.institution} (${e.year})`).join("\n")}` : ""}
`;
  }

  return `You are an expert career advisor and job market analyst. Search real job listings and generate a ranked list of the top 10 most relevant job opportunities.

${cvSection}

## Search Preferences:
- Looking for: ${query}
- Country/Region: ${countryName}
- Time range: ${timeLabel}
${salaryFilter}

## CRITICAL Instructions:
1. The server agent already searched job boards for ${countryName} (${formatJobWebsitesForPrompt(country)}). Rank only verified listings provided below.
2. Each job MUST keep the exact applyUrl from the verified list. Do not invent URLs.
3. For logoUrl, use https://logo.clearbit.com/{companydomain} with the company's real website domain (e.g. https://logo.clearbit.com/google.com).
4. For salaryEstimate, research public salary data from DOU.ua salary surveys, Glassdoor, LinkedIn salary insights, and similar sources to provide a realistic monthly USD range. Clearly note it is an AI estimate.
5. Each job should have: specific title, real company, location, match score 0-100, concise rationale (max 40 words), 2-5 skill tags.
6. Sort by score descending.
7. Suggest 3-5 refined search queries the candidate might try next.
8. Only include jobs where you can provide a real applyUrl — quality over quantity.`;
}

function AppContent() {
  const { lang } = useTheme();
  const t = translations[lang];

  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("WORLDWIDE");
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("2m");
  const [salaryRange, setSalaryRange] = useState<[number, number]>([500, 20000]);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Job[] | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleBack = useCallback(() => {
    setResults(null);
    setSuggestions([]);
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    setResults(null);
    setSuggestions([]);

    try {
      let cvData: CvData | null = null;
      if (file) {
        const { file_url } = await api.integrations.Core.UploadFile({ file });
        const extraction = await api.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: CV_SCHEMA,
        });
        if (extraction.status === "success" && extraction.output) {
          cvData = extraction.output;
        } else {
          toast.error(lang === "uk" ? "Не вдалося розпарсити резюме." : "Could not parse CV. Proceeding without it.");
        }
      }

      const countryName = COUNTRIES.find((c) => c.code === country)?.name || country;
      const prompt = buildPrompt(cvData, query, country, timeRange, salaryRange);
      const [salMin, salMax] = salaryRange;
      const salaryHint =
        salMin > 500 || salMax < 20000
          ? `${formatSalary(salMin)} – ${formatSalary(salMax)} / mo USD`
          : undefined;

      const result = await api.integrations.Core.InvokeLLM({
        prompt,
        query,
        countryCode: country,
        countryName,
        timeRange,
        salaryHint,
        cvSummary: cvData?.summary,
        cvSkills: cvData?.skills,
        response_json_schema: JOB_MATCH_SCHEMA,
      });

      if (result?.jobs) {
        const validJobs = result.jobs.filter((j) => j.applyUrl && j.applyUrl.startsWith("http"));
        setResults(validJobs);
        setSuggestions(result.suggestions || []);
        if (validJobs.length === 0) {
          toast.error(lang === "uk" ? "Не знайдено вакансій з посиланнями." : "No jobs with direct links found. Try a different search.");
        }
      } else {
        toast.error(lang === "uk" ? "Не вдалося знайти вакансії." : "Could not generate job matches. Please try again.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : (lang === "uk" ? "Помилка пошуку." : "Search failed. Is the API running?");
      toast.error((err as ApiError).message || message);
    } finally {
      setIsLoading(false);
    }
  }, [query, country, timeRange, salaryRange, file, lang]);

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setResults(null);
    setSuggestions([]);
    setTimeout(() => document.querySelector("form")?.requestSubmit(), 100);
  }, []);

  const showResults = !isLoading && results;
  const showForm = !isLoading && !results;

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="space-y-8">

          <Header />

          <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <AnimatePresence mode="wait">
            {showForm && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="bg-card/60 backdrop-blur-sm rounded-3xl border border-border p-5 sm:p-6"
              >
                <SearchForm
                  query={query} setQuery={setQuery}
                  country={country} setCountry={setCountry}
                  timeRange={timeRange} setTimeRange={setTimeRange}
                  salaryRange={salaryRange} setSalaryRange={setSalaryRange}
                  file={file} setFile={setFile}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isLoading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LoadingState />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showResults && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ResultsList
                  results={results}
                  suggestions={suggestions}
                  onSuggestionSelect={handleSuggestionSelect}
                  onBack={handleBack}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="text-center pt-4 pb-6">
            <p className="text-xs font-mono text-muted-foreground/50">{t.footer}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}