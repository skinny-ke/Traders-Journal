import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  const getStoredTheme = useCallback(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem("tj:theme");
    } catch {
      return null;
    }
  }, []);

  const getSystemTheme = useCallback(() => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);

  const resolveTheme = useCallback(() => {
    const stored = getStoredTheme();
    if (stored === "light" || stored === "dark") return stored;
    return getSystemTheme();
  }, [getStoredTheme, getSystemTheme]);

  const applyTheme = useCallback((next) => {
    if (typeof document === "undefined") return;
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const initial = resolveTheme();
    setTheme(initial);
    applyTheme(initial);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      const stored = getStoredTheme();
      if (!stored) {
        const next = e.matches ? "dark" : "light";
        setTheme(next);
        applyTheme(next);
      }
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [resolveTheme, applyTheme, getStoredTheme]);

  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem("tj:theme", next);
    } catch {
      // localStorage may be unavailable in some environments.
    }
  }, [theme, applyTheme]);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
