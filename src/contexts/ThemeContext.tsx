import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ThemeName } from '../types/user';

interface ThemeValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
}

const KEY = 'cw-theme';
const ThemeContext = createContext<ThemeValue | null>(null);

function storedTheme(): ThemeName | null {
  try {
    const s = localStorage.getItem(KEY);
    return s === 'dark' || s === 'light' ? s : null;
  } catch {
    return null;
  }
}

function systemTheme(): ThemeName {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(t: ThemeName) {
  const el = document.documentElement;
  el.dataset.theme = t;
  el.classList.toggle('dark', t === 'dark');
}

export function ThemeProvider({ children }: {children: React.ReactNode;}) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const t = storedTheme() ?? systemTheme();
    applyTheme(t);
    return t;
  });

  const setTheme = useCallback((t: ThemeName) => {
    applyTheme(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {

      /* storage unavailable */}
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme]);

  // Follow the OS setting until the user picks a theme explicitly.
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: light)');
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => {
      if (storedTheme()) return;
      const t: ThemeName = e.matches ? 'light' : 'dark';
      applyTheme(t);
      setThemeState(t);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}