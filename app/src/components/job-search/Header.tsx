import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

export default function Header() {
  const { theme, toggleTheme, lang, toggleLang } = useTheme();

  return (
    <header className="flex items-center justify-between py-1">
      {/* Logo mark + wordmark */}
      <div className="flex items-center gap-3">
        {/* Unique hexagon-inspired logo mark */}
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg viewBox="0 0 40 40" className="w-10 h-10 absolute">
            <polygon
              points="20,2 36,11 36,29 20,38 4,29 4,11"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              className="opacity-80"
            />
            <polygon
              points="20,8 30,14 30,26 20,32 10,26 10,14"
              fill="hsl(var(--primary))"
              opacity="0.15"
            />
          </svg>
          <span className="relative text-sm font-black text-primary leading-none">J</span>
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight leading-none">
            Job<span className="text-primary">Match</span>
          </h1>
          <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mt-0.5">
            {lang === "en" ? "AI-powered" : "на основі ШІ"}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Language toggle — pill shape */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-0 rounded-full border border-border overflow-hidden text-xs font-semibold"
        >
          <span className={`px-3 py-1.5 transition-colors ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            EN
          </span>
          <span className={`px-3 py-1.5 transition-colors ${lang === "uk" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            UA
          </span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark"
            ? <Sun className="w-4 h-4 text-muted-foreground" />
            : <Moon className="w-4 h-4 text-muted-foreground" />
          }
        </button>
      </div>
    </header>
  );
}