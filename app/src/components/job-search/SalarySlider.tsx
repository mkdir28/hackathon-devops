import { Slider } from "@/components/ui/slider";
import { DollarSign } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { translations } from "@/lib/i18n";

interface SalarySliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

function formatSalary(val: number): string {
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
  return `$${val}`;
}

export default function SalarySlider({ value, onChange }: SalarySliderProps) {
  const { lang } = useTheme();
  const t = translations[lang];
  const [min, max] = value;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          {t.salaryLabel}
        </label>
        <span className="text-xs font-mono text-primary font-semibold">
          {formatSalary(min)} – {formatSalary(max)}{max >= 20000 ? "+" : ""}
        </span>
      </div>
      <div className="flex items-center gap-3 px-1">
        <DollarSign className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <Slider
          min={500}
          max={20000}
          step={500}
          value={value}
          onValueChange={onChange}
          className="flex-1"
        />
      </div>
      <p className="text-[10px] text-muted-foreground">{t.salaryHint}</p>
    </div>
  );
}