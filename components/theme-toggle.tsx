"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "./lang-context";

/** Light / dark switch. The choice is kept in a cookie so the server renders the right theme (no flash). */
export function ThemeToggle() {
  const t = useT();
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  useEffect(() => setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light"), []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
    setTheme(next);
  };
  return (
    <button type="button" onClick={toggle} className="btn btn-sm" aria-label={t(theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap")} title={t(theme === "dark" ? "Tema terang" : "Tema gelap")}>
      {theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </button>
  );
}
