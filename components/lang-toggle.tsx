"use client";

import { useRouter } from "next/navigation";
import { useLang } from "./lang-context";

/** Indonesian / English switch. The choice is kept in a cookie so the server renders in that language. */
export function LangToggle() {
  const lang = useLang();
  const router = useRouter();
  const toggle = () => {
    document.cookie = `lang=${lang === "en" ? "id" : "en"}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  // The label names the language you switch to, in that language.
  const other = lang === "en" ? "Bahasa Indonesia" : "English";
  return (
    <button type="button" onClick={toggle} className="btn btn-sm" aria-label={other} title={other}>
      {lang === "en" ? "EN" : "ID"}
    </button>
  );
}
