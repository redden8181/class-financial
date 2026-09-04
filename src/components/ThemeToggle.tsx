"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "kk-theme";
const LIGHT_BG = "#eef0f7";
const DARK_BG = "#070b16";

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.setAttribute("content", dark ? DARK_BG : LIGHT_BG);
  });
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* noop */
    }
    applyTheme(next);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.88, rotate: -12 }}
      onClick={toggle}
      aria-label={dark ? "Включить светлую тему" : "Включить тёмную тему"}
      className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/[0.05] text-slate-600 transition-colors dark:bg-white/[0.07] dark:text-amber-300"
    >
      {dark ? <Sun size={19} strokeWidth={2.4} /> : <Moon size={19} strokeWidth={2.4} />}
    </motion.button>
  );
}
