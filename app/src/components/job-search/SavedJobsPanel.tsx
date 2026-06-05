import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, X, ExternalLink, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/ThemeContext";
import type { Job } from "@/types";

interface SavedJobsPanelProps {
  saved: Job[];
  onRemove: (job: Job) => void;
}

export default function SavedJobsPanel({ saved, onRemove }: SavedJobsPanelProps) {
  const [open, setOpen] = useState(false);
  const { lang } = useTheme();
  const label = lang === "uk" ? "Збережені" : "Saved";
  const emptyLabel = lang === "uk" ? "Немає збережених вакансій" : "No saved jobs yet";

  if (saved.length === 0 && !open) return null;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold">{label}</span>
          {saved.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">
              {saved.length}
            </span>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
              {saved.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{emptyLabel}</p>
              ) : (
                saved.map((job, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                    {job.logoUrl && (
                      <img
                        src={job.logoUrl}
                        alt={job.company}
                        className="w-8 h-8 rounded-lg object-contain bg-white border border-border p-0.5 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{job.company} · {job.location}</p>
                    </div>
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-primary" />
                    </a>
                    <button
                      onClick={() => onRemove(job)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}