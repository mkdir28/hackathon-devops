import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/ThemeContext";
import { translations } from "@/lib/i18n";
import type { TimeRangeValue } from "@/types";

interface TimeRangeSelectProps {
  value: TimeRangeValue;
  onChange: (value: TimeRangeValue) => void;
}

export default function TimeRangeSelect({ value, onChange }: TimeRangeSelectProps) {
  const { lang } = useTheme();
  const t = translations[lang];

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        {t.timeRangeLabel}
      </label>
      <div className="flex gap-1.5">
        {t.timeRanges.map((range) => (
          <button
            key={range.value}
            type="button"
            onClick={() => onChange(range.value)}
            className={cn(
              "flex-1 py-2 text-xs font-semibold transition-all duration-150 rounded-full border",
              value === range.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}