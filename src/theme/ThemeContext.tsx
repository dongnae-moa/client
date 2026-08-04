import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";

export type ThemeMode = "dark" | "light";

export type AppTheme = {
  mode: ThemeMode;
  colors: {
    background: string;
    surface: string;
    surfaceRaised: string;
    border: string;
    text: string;
    muted: string;
    faint: string;
    green: string;
    greenSoft: string;
    purple: string;
    blue: string;
    orange: string;
    navTint: string;
    navBorder: string;
    navIndicator: string;
  };
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const palettes = {
  dark: {
    background: "#050505",
    surface: "#141414",
    surfaceRaised: "#1b1b1b",
    border: "#2b2b2b",
    text: "#f5f5f5",
    muted: "#a4a4a4",
    faint: "#676767",
    green: "#a7e66d",
    greenSoft: "#c8f1a7",
    purple: "#b285ff",
    blue: "#72a7ff",
    orange: "#ffb93f",
    navTint: "rgba(3, 8, 18, 0.24)",
    navBorder: "rgba(255,255,255,0.22)",
    navIndicator: "rgba(255,255,255,0.15)",
  },
  light: {
    background: "#f3f5f1",
    surface: "#ffffff",
    surfaceRaised: "#edf2eb",
    border: "#d9dfd7",
    text: "#10140f",
    muted: "#5d675e",
    faint: "#879188",
    green: "#77c84d",
    greenSoft: "#d8f6bb",
    purple: "#7d5dcc",
    blue: "#3d78ce",
    orange: "#d28b0e",
    navTint: "rgba(245, 248, 244, 0.42)",
    navBorder: "rgba(255,255,255,0.78)",
    navIndicator: "rgba(255,255,255,0.68)",
  },
} as const;

const ThemeContext = createContext<AppTheme | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const value = useMemo<AppTheme>(() => ({
    mode,
    colors: palettes[mode],
    setMode,
    toggleMode: () => setMode((current) => current === "dark" ? "light" : "dark"),
  }), [mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useTheme must be used inside ThemeProvider");
  return theme;
}
