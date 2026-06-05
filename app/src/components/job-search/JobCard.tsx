import { useState } from "react";
import type { JobCardProps } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronDown, Sparkles, ExternalLink, Bot, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/ThemeContext";
import { translations } from "@/lib/i18n";

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
    : score >= 60 ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
    : "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={cn("inline-flex items-center px-2.5 py-0.5 text-xs font-mono font-bold border", color)}
      style={{ clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)" }}
    >
      {score}%
    </span>
  );
}

function CompanyLogo({ logoUrl, company }: { logoUrl?: string; company: string }) {
  const [error, setError] = useState(false);

  if (error || !logoUrl) {
    // Fallback: letter avatar
    return (
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-border">
        <span className="text-sm font-black text-primary">{company?.[0]?.toUpperCase() || "?"}</span>
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={company}
      onError={() => setError(true)}
      className="w-10 h-10 rounded-xl object-contain bg-white border border-border p-1 flex-shrink-0"
    />
  );
}

export default function JobCard({ job, index, isSaved, onSaveToggle }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { lang } = useTheme();
  const t = translations[lang];

  // Only show cards that have a direct apply link
  if (!job.applyUrl) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
    >
      <div className={cn(
        "rounded-2xl border transition-all duration-200",
        expanded
          ? "bg-card border-primary/30 shadow-lg shadow-primary/5"
          : "bg-card border-border hover:border-primary/20"
      )}>
        {/* Main row */}
        <div className="flex items-center gap-3 px-4 py-4">
          {/* Company logo */}
          <CompanyLogo logoUrl={job.logoUrl} company={job.company} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold leading-tight">{job.title}</h3>
              <ScoreBadge score={job.score} />
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">{job.company}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {job.location}
              </span>
            </div>

            {/* Salary estimate */}
            {job.salaryEstimate && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Bot className="w-3 h-3 text-primary/60" />
                <span className="text-xs font-mono text-primary font-semibold">{job.salaryEstimate}</span>
                <span className="text-[10px] text-muted-foreground">· {t.salaryEstimate}</span>
              </div>
            )}

            {/* Tags */}
            {(job.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {job.tags?.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 text-[10px] font-medium bg-secondary text-secondary-foreground rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Save star */}
            <button
              onClick={() => onSaveToggle(job)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title={isSaved ? "Unsave" : "Save"}
            >
              <Star className={cn(
                "w-4 h-4 transition-colors",
                isSaved ? "fill-amber-400 text-amber-400" : "text-muted-foreground hover:text-amber-400"
              )} />
            </button>
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              style={{ clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}
            >
              {t.applyBtn}
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180"
              )} />
            </button>
          </div>
        </div>

        {/* Mobile apply */}
        <div className="sm:hidden px-4 pb-3">
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground"
            style={{ clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}
          >
            {t.applyBtn}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Expanded rationale */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mx-4 mb-4 pt-3 border-t border-border space-y-3">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {t.rationale}
                  </p>
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed">{job.rationale}</p>
                  </div>
                </div>
                {job.salaryEstimate && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">{t.salaryEstimate}</span>
                    </div>
                    <p className="text-sm font-mono font-bold text-foreground">{job.salaryEstimate}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{t.salaryEstimateNote}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}