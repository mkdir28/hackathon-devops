import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import { Globe } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { translations } from "@/lib/i18n";

interface CountrySelectProps {
  value: string;
  onChange: (code: string) => void;
}

export default function CountrySelect({ value, onChange }: CountrySelectProps) {
  const { lang } = useTheme();
  const t = translations[lang];

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        {t.countryLabel}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 rounded-2xl bg-background border-border">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <SelectValue placeholder={t.countryPlaceholder} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}