import React, { createContext, useContext, useEffect, useState } from "react";
import { storageService } from "../services/storageService";

interface ThemeContextValue {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => storageService.loadSettings().theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    const settings = storageService.loadSettings();
    storageService.saveSettings({ ...settings, theme });
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
