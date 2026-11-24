// gettext-style translation: the Indonesian source text is the key. Isomorphic (server + client).
import { EN, PATTERNS } from "./en";

export type Lang = "id" | "en";
export type Vars = Record<string, string | number>;
export type T = (text: string, vars?: Vars) => string;

const fill = (s: string, vars?: Vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s);
// typeof guard: EN["constructor"] must not hit Object.prototype.
const exact = (s: string) => (typeof EN[s] === "string" ? EN[s] : undefined);

/** "id": the text itself. "en": dictionary, then PATTERNS (backend messages), then the Indonesian text. */
export function translate(lang: Lang, text: string, vars?: Vars): string {
  if (typeof text !== "string") return text; // API value that is not text: show as is, never crash
  if (lang !== "en") return fill(text, vars);
  const hit = exact(text);
  if (hit !== undefined) return fill(hit, vars);
  for (const [re, to] of PATTERNS) {
    const m = re.exec(text);
    // $1 = captured text as is (user data); #1 = captured text looked up in the dictionary (resource names).
    if (m) return to.replace(/([$#])(\d)/g, (_, kind, i) => (kind === "#" ? (exact(m[i] ?? "") ?? m[i]) : m[i]) ?? "");
  }
  return fill(text, vars);
}
