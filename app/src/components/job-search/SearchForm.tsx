import type { ChangeEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "lucide-react";
import CVDropzone from "./CVDropzone";
import CountrySelect from "./CountrySelect";
import TimeRangeSelect from "./TimeRangeSelect";
import SalarySlider from "./SalarySlider";
import { useTheme } from "@/lib/ThemeContext";
import { translations } from "@/lib/i18n";
import type { SearchFormProps } from "./types";

export default function SearchForm({
  query, setQuery,
  country, setCountry,
  timeRange, setTimeRange,
  salaryRange, setSalaryRange,
  file, setFile,
  onSubmit, isLoading,
}: SearchFormProps) {
  const { lang } = useTheme();
  const t = translations[lang];
  const canSubmit = query.trim().length > 0 && !isLoading;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (canSubmit) onSubmit(); }}
      className="space-y-5"
    >
      {/* CV Upload */}
      <div className="space-y-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          {t.cvLabel}
        </label>
        <CVDropzone file={file} onFileChange={setFile} />
      </div>

      {/* Query */}
      <div className="space-y-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          {t.queryLabel}
        </label>
        <Textarea
          value={query}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQuery(e.target.value)}
          placeholder={t.queryPlaceholder}
          className="min-h-[90px] resize-none rounded-2xl bg-background border-border text-sm leading-relaxed placeholder:text-muted-foreground/40 focus-visible:ring-primary/30"
        />
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CountrySelect value={country} onChange={setCountry} />
        <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Salary slider */}
      <SalarySlider value={salaryRange} onChange={setSalaryRange} />

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-primary-foreground bg-primary transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
        style={{ clipPath: "polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)" }}
      >
        <Search className="w-4 h-4" />
        {t.submitBtn}
      </button>
    </form>
  );
}