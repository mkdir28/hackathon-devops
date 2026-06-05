import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Lang, Theme } from '@/types';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('jm-theme') as Theme) || 'light'
  );
  const [lang, setLang] = useState<Lang>(
    () => (localStorage.getItem('jm-lang') as Lang) || 'en'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('jm-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('jm-lang', lang);
  }, [lang]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const toggleLang = () => setLang((l) => (l === 'en' ? 'uk' : 'en'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, lang, setLang, toggleLang }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
