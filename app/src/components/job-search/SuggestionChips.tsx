import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { translations } from "@/lib/i18n";

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export default function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  const { lang } = useTheme();
  const t = translations[lang];

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          {t.tryNext}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.07 }}
            onClick={() => onSelect(s)}
            className="px-4 py-2 rounded-full border border-border bg-card text-sm font-medium hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all duration-150"
          >
            {s}
          </motion.button>
        ))}
      </div>
    </div>
  );
}