import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const THEME_KEY = "klassnaya-kopilka/theme";
const LIGHT_BG = "#faf7f2";
const DARK_BG = "#16130f";

interface ThemeCtx {
  dark: boolean;
  toggle(): void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

function initialDark(): boolean {
  try {
    return localStorage.getItem(THEME_KEY) === "dark";
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // светлая тема — основная; тёмная включается вручную и запоминается
  const [dark, setDark] = useState<boolean>(initialDark);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
      /* noop */
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? DARK_BG : LIGHT_BG);
  }, [dark]);

  const value = useMemo<ThemeCtx>(
    () => ({ dark, toggle: () => setDark((d) => !d) }),
    [dark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme должен использоваться внутри ThemeProvider");
  return ctx;
}
