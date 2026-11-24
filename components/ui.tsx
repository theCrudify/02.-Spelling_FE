import { ArrowUpRight, FileText, Inbox, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { translate, type Lang } from "@/lib/i18n";

// Callers pass the UI language (getLang / useLang); without it the output is Indonesian.
const LOCALE: Record<Lang, string> = { id: "id-ID", en: "en-GB" };
const fmt = (opts: Intl.DateTimeFormatOptions) => ({ id: new Intl.DateTimeFormat(LOCALE.id, opts), en: new Intl.DateTimeFormat(LOCALE.en, opts) });
const dateFmt = fmt({ day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const dateTimeFmt = fmt({ day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
// DATE columns come as 'YYYY-MM-DD'; parse at noon UTC so the day never shifts.
const toDate = (v: string) => new Date(v.length === 10 ? `${v}T12:00:00Z` : v);
export const fmtDate = (v?: string | null, lang: Lang = "id") => (v ? dateFmt[lang].format(toDate(v)) : "-");
export const fmtDateTime = (v?: string | null, lang: Lang = "id") => (v ? dateTimeFmt[lang].format(toDate(v)) : "-");
export const daysUntil = (v: string) => Math.floor((toDate(v).getTime() - Date.now()) / 86400000);

export function timeAgo(v: string, lang: Lang = "id") {
  const s = (Date.now() - toDate(v).getTime()) / 1000;
  if (s < 60) return translate(lang, "baru saja");
  if (s < 3600) return translate(lang, "{n} mnt lalu", { n: Math.floor(s / 60) });
  if (s < 86400) return translate(lang, "{n} jam lalu", { n: Math.floor(s / 3600) });
  if (s < 86400 * 30) return translate(lang, "{n} hari lalu", { n: Math.floor(s / 86400) });
  return fmtDate(v, lang);
}

/** Highlights every search word inside `text` (case-insensitive). */
export function Hl({ text, q }: { text?: string | null; q?: string }) {
  if (!text) return <>{text ?? ""}</>;
  const words = (q ?? "").split(/\s+/).filter((w) => w.length > 0).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!words.length) return <>{text}</>;
  const re = new RegExp(`(${words.join("|")})`, "gi");
  return (
    <>
      {text.split(re).map((part, i) => (i % 2 ? <mark key={i} className="hl">{part}</mark> : part))}
    </>
  );
}

// --------------------------------------------------------------- badges
export type Tone = "green" | "red" | "blue" | "amber" | "orange" | "violet" | "neutral" | "teal" | "rose";
const TONES: Record<Tone, [string, string]> = {
  green: ["text-emerald-800 bg-emerald-50", "bg-emerald-500"],
  red: ["text-rose-800 bg-rose-50", "bg-rose-500"],
  blue: ["text-sky-800 bg-sky-50", "bg-sky-500"],
  amber: ["text-amber-800 bg-amber-50", "bg-amber-500"],
  orange: ["text-orange-800 bg-orange-50", "bg-orange-500"],
  violet: ["text-purple-800 bg-purple-50", "bg-purple-500"],
  neutral: ["text-slate-700 bg-slate-100", "bg-slate-400"],
  teal: ["text-teal-800 bg-teal-50", "bg-teal-500"],
  rose: ["text-rose-800 bg-rose-50", "bg-rose-500"],
};
/** Soft chip classes (text + background + ring) of a tone. */
export const toneChip = (tone?: string | null) => (TONES[(tone as Tone) ?? "neutral"] ?? TONES.neutral)[0];
// Outline + tint of a finding box drawn over the artwork (SVG), per tone.
const TONE_BOX: Record<Tone, string> = {
  green: "stroke-emerald-600 fill-emerald-500/15",
  red: "stroke-rose-600 fill-rose-500/15",
  blue: "stroke-sky-500 fill-sky-400/10",
  amber: "stroke-amber-500 fill-amber-400/15",
  orange: "stroke-orange-500 fill-orange-400/15",
  violet: "stroke-purple-500 fill-purple-400/15",
  neutral: "stroke-slate-500 fill-slate-400/10",
  teal: "stroke-teal-500 fill-teal-400/15",
  rose: "stroke-rose-600 fill-rose-500/15",
};
export const toneBox = (tone?: string | null) => TONE_BOX[(tone as Tone) ?? "neutral"] ?? TONE_BOX.neutral;
export const toneDot = (tone?: string | null) => (TONES[(tone as Tone) ?? "neutral"] ?? TONES.neutral)[1];

export function Badge({ children, tone = "neutral", dot = true, title }: { children: ReactNode; tone?: Tone | string; dot?: boolean; title?: string }) {
  const [cls, dotCls] = TONES[tone as Tone] ?? TONES.neutral;
  return (
    <span title={title} className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-[12px] font-medium tracking-normal ${cls}`}>
      {dot && <span className={`size-1.5 rounded-full ${dotCls}`} aria-hidden />}
      {children}
    </span>
  );
}

export const ActiveBadge = ({ active, lang = "id" }: { active: boolean; lang?: Lang }) => <Badge tone={active ? "green" : "neutral"}>{translate(lang, active ? "Aktif" : "Nonaktif")}</Badge>;

/** Material type: emphasised when the type requires a halal certificate (material_types.requires_certificate). */
export const TypeBadge = ({ name, critical }: { name: string; critical: boolean }) => (
  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-medium ${critical ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20" : "bg-slate-100 text-slate-600"}`}>
    {critical && <span className="size-1 rounded-full bg-rose-500" />}
    {name}
  </span>
);

/** Expiry with meaning in text: "Kedaluwarsa", "33 hr lagi", or BPJPH open-ended. */
export function ExpiryCell({ date, nonExpiring }: { date?: string | null; nonExpiring?: boolean }) {
  if (!date)
    return nonExpiring ? (
      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-600/15" title="Berlaku selama tidak ada perubahan komposisi / PPH">
        Tanpa batas
      </span>
    ) : (
      <span className="text-slate-400">—</span>
    );
  const days = daysUntil(date);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={`num font-semibold ${days < 0 ? "text-rose-700" : days <= 90 ? "text-amber-700" : "text-slate-800"}`}>{fmtDate(date)}</span>
      {days < 0 ? (
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">Kedaluwarsa</span>
      ) : days <= 90 ? (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">{days} hr lagi</span>
      ) : null}
    </span>
  );
}

// --------------------------------------------------------------- layout
export function PageHeader({ title, description, actions, meta, eyebrow }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; meta?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold leading-8 tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-pretty text-sm text-slate-500">{description}</p>}
        {meta && <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-slate-600">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function Section({ title, description, children, actions, flush, id }: { title: ReactNode; description?: ReactNode; children: ReactNode; actions?: ReactNode; flush?: boolean; id?: string }) {
  return (
    <section className="card mb-6 overflow-hidden last:mb-0" id={id}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        {actions}
      </header>
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

/** Label/value list for detail pages: label column + value, hairline separated. */
export function DetailGrid({ items, cols = 2 }: { items: [string, ReactNode][]; cols?: 1 | 2 | 3 | 4 }) {
  const grid = { 1: "", 2: "md:grid-cols-2", 3: "md:grid-cols-2 xl:grid-cols-3", 4: "md:grid-cols-2 xl:grid-cols-4" }[cols];
  return (
    <dl className={`grid gap-x-8 ${grid}`}>
      {items.map(([k, v]) => (
        <div key={k} className="grid min-w-0 grid-cols-[10rem_1fr] gap-3 border-b border-slate-100 py-2.5 last:border-0 md:[&:nth-last-child(-n+2)]:border-0">
          <dt className="text-xs font-medium text-slate-500">{k}</dt>
          <dd className="min-w-0 break-words text-xs font-semibold text-slate-800">{v === null || v === undefined || v === "" ? <span className="text-slate-400 font-normal">—</span> : v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: { icon?: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20">
        <Icon className="size-5 stroke-[1.75]" aria-hidden />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const FileLink = ({ id, lang = "id", label = translate(lang, "Lihat file") }: { id?: number | null; label?: string; lang?: Lang }) =>
  id ? (
    <a className="group inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700" href={`/files/${id}`} target="_blank" rel="noreferrer">
      <FileText className="size-3.5 shrink-0 stroke-[1.8] text-emerald-500 group-hover:text-emerald-700" aria-hidden />
      <span className="truncate underline decoration-emerald-200 underline-offset-2 group-hover:decoration-emerald-500">{label}</span>
      <ArrowUpRight className="size-3 shrink-0 text-slate-400" aria-hidden />
      <span className="sr-only">{translate(lang, "(tab baru)")}</span>
    </a>
  ) : (
    <span className="text-slate-400">—</span>
  );

export const LinkButton = ({ href, children, primary, accent, icon: Icon }: { href: string; children: ReactNode; primary?: boolean; accent?: boolean; icon?: LucideIcon }) => (
  <Link href={href} className={`btn ${primary ? "btn-primary" : accent ? "btn-accent" : ""}`}>
    {Icon && <Icon aria-hidden />}
    {children}
  </Link>
);

// --------------------------------------------------------------- dashboard
/** Headline number. */
export function StatTile({ label, value, hint, href }: { label: ReactNode; value: ReactNode; hint?: ReactNode; href?: string }) {
  const body = (
    <>
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="num mt-1 block text-[28px] font-semibold leading-9 text-slate-900">{value}</span>
      {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
    </>
  );
  return href ? <Link href={href} className="card block px-5 py-4 hover:border-slate-300">{body}</Link> : <div className="card px-5 py-4">{body}</div>;
}

export type BarRow = { key: string; label: ReactNode; value: number; text?: ReactNode; marker?: number; note?: ReactNode; href?: string };
/**
 * Horizontal bars for one measure across categories: one hue (magnitude, not identity), value printed on every row,
 * bars share a zero baseline. `marker` draws a reference tick (e.g. the SLA) on the same scale.
 */
export function BarList({ rows, empty }: { rows: BarRow[]; empty: ReactNode }) {
  if (!rows.length) return <p className="px-5 py-4 text-sm text-slate-500">{empty}</p>;
  const max = Math.max(...rows.map((r) => Math.max(r.value, r.marker ?? 0)), 1);
  return (
    <ul className="space-y-3 px-5 py-4">
      {rows.map((r) => {
        const name = r.href ? <Link href={r.href} className="hover:underline">{r.label}</Link> : r.label;
        return (
          <li key={r.key}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="min-w-0 truncate text-slate-700">{name}</span>
              <span className="num shrink-0 font-semibold text-slate-900">{r.text ?? r.value}</span>
            </div>
            <div className="relative h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full" style={{ width: `${(r.value / max) * 100}%`, minWidth: r.value ? 4 : 0, background: "var(--series-1)" }} />
              {r.marker != null && <span className="absolute -top-1 h-4 w-0.5 rounded bg-slate-500" style={{ left: `${(r.marker / max) * 100}%` }} aria-hidden />}
            </div>
            {r.note && <p className="mt-1 text-xs text-slate-500">{r.note}</p>}
          </li>
        );
      })}
    </ul>
  );
}
