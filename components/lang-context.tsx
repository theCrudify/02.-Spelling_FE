"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { translate, type Lang, type T } from "@/lib/i18n";

const Ctx = createContext<Lang>("id");

/** Gives client components the language the server rendered with. */
export function LangProvider({ value, children }: { value: Lang; children: ReactNode }) {
  return <Ctx value={value}>{children}</Ctx>;
}

export const useLang = () => useContext(Ctx);

export function useT(): T {
  const lang = useLang();
  return useCallback((text, vars) => translate(lang, text, vars), [lang]);
}
