import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { translate, type Lang, type T } from "./i18n";

/** UI language from the `lang` cookie (set by LangToggle); Indonesian by default. */
export const getLang = cache(async (): Promise<Lang> => ((await cookies()).get("lang")?.value === "en" ? "en" : "id"));

export async function getT(): Promise<T> {
  const lang = await getLang();
  return (text, vars) => translate(lang, text, vars);
}
