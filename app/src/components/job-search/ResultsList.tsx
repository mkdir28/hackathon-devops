import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import JobCard from "./JobCard";
import SuggestionChips from "./SuggestionChips";
import SavedJobsPanel from "./SavedJobsPanel";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { useTheme } from "@/lib/ThemeContext";
import { translations } from "@/lib/i18n";
import type { ResultsListProps } from "./types";

export default function ResultsList({
  results,
  suggestions,
  onSuggestionSelect,
  onBack,
}: ResultsListProps) {
  const { lang } = useTheme();
  const t = translations[lang];
  const { saved, toggle, isSaved } = useSavedJobs();

  if (!results || results.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Saved jobs panel */}
      <SavedJobsPanel saved={saved} onRemove={toggle} />

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black">
            {t.topMatches}
            <span className="ml-2 text-primary">({results.length})</span>
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">{t.sortedBy}</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-border rounded-full hover:bg-muted hover:border-primary/30 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t.backBtn}
        </button>
      </div>

      {/* Job list */}
      <div className="space-y-2.5">
        {results.map((job, i) => (
          <JobCard key={i} job={job} index={i} isSaved={isSaved(job)} onSaveToggle={toggle} />
        ))}
      </div>

      {/* Suggestions */}
      <SuggestionChips suggestions={suggestions} onSelect={onSuggestionSelect} />
    </motion.div>
  );
}