import { useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";
const STORAGE_KEY = "vaptgas:theme";

function resolveSystemTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "light";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "dark" || v === "light" || v === "system" ? v : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>("light");
  const [theme, setThemeState] = useState<Theme>("light");

  // Hydrate from localStorage on mount (avoid SSR mismatch)
  useEffect(() => {
    const p = readStoredPreference();
    const resolved = p === "system" ? resolveSystemTheme() : p;
    setPreferenceState(p);
    setThemeState(resolved);
    applyTheme(resolved);
  }, []);

  // Track OS changes while following the system preference
  useEffect(() => {
    if (preference !== "system" || typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = resolveSystemTheme();
      setThemeState(resolved);
      applyTheme(resolved);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((p: ThemePreference) => {
    const resolved = p === "system" ? resolveSystemTheme() : p;
    setPreferenceState(p);
    setThemeState(resolved);
    applyTheme(resolved);
    try {
      window.localStorage.setItem(STORAGE_KEY, p);
    } catch {
      /* ignore */
    }
  }, []);

  const setTheme = useCallback(
    (t: Theme) => {
      setPreference(t);
    },
    [setPreference],
  );

  const toggle = useCallback(() => {
    setPreference(theme === "dark" ? "light" : "dark");
  }, [theme, setPreference]);

  return {
    theme,
    preference,
    followSystem: preference === "system",
    setTheme,
    setPreference,
    toggle,
  };
}
