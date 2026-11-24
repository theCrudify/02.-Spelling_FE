"use client";

import { ArrowRight, CornerDownLeft, Loader2, Plus, ScanText, Search, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "./lang-context";
import { useMeta } from "./meta-context";
import type { T } from "@/lib/i18n";
import { toneDot } from "./ui";

type Hit = { id: number; title: string; subtitle: string; badge?: string | null };
type Results = Record<"labels", Hit[]>;
type Item = { key: string; group: string; icon: LucideIcon; title: string; subtitle?: string; badge?: string | null; href: string };

const GROUPS: { key: keyof Results; label: string; icon: LucideIcon; href: (id: number) => string }[] = [
  { key: "labels", label: "Label", icon: ScanText, href: (id) => `/labels/${id}` },
];

/** Empty-query suggestions: "new request" plus the user's menu entries (from the menus table). */
function quickActions(menu: { code: string; name: string; [k: string]: any }[], t: T): Item[] {
  return [
    { key: "new", group: t("Aksi cepat"), icon: Plus, title: t("Label baru"), href: "/labels/new" },
    ...menu.filter((m) => !m.path.startsWith("/admin")).map((m) => ({ key: `menu-${m.code}`, group: t("Buka halaman"), icon: ArrowRight, title: m.name, href: m.path })),
  ];
}

/** ⌘K / Ctrl+K global search across labels. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const meta = useMeta();
  const t = useT();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setResults(null);
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced fetch; the latest query wins.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) setResults(await res.json());
      } catch {
        /* aborted or offline: keep previous results */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const items: Item[] = useMemo(() => {
    if (!results) return q.trim().length < 2 ? quickActions(meta.raw.menu, t) : [];
    return GROUPS.flatMap((g) =>
      results[g.key].map((h) => ({ key: `${g.key}-${h.id}`, group: g.label, icon: g.icon, title: h.title, subtitle: h.subtitle, badge: h.badge, href: g.href(h.id) })),
    );
  }, [results, q, meta, t]);

  useEffect(() => setActive(0), [items]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const go = (item?: Item) => {
    if (!item) return;
    onClose();
    router.push(item.href);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(items[active]);
    } else if (e.key === "Escape") onClose();
  };

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label={t("Pencarian global")}>
      <div className="absolute inset-0 bg-ink/25" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line-2 bg-surface shadow-[0_24px_64px_-16px_rgba(23,25,28,0.35)]">
        <div className="flex items-center gap-3 border-b border-line px-4">
          {loading ? <Loader2 className="size-4 animate-spin text-ink-3" aria-hidden /> : <Search className="size-4 text-ink-3" aria-hidden />}
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder={t("Cari bahan, no. sertifikat, request, manual…")}
            className="h-12 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-3"
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls="palette-list"
            aria-activedescendant={items[active] ? `palette-${items[active].key}` : undefined}
            aria-autocomplete="list"
          />
          <span className="kbd">Esc</span>
        </div>

        <ul id="palette-list" ref={listRef} role="listbox" className="max-h-[52vh] overflow-y-auto p-1.5">
          {items.length === 0 && q.trim().length >= 2 && !loading && (
            <li className="px-3 py-8 text-center text-[13px] text-ink-3">{t("Tidak ada hasil untuk “{q}”.", { q: q.trim() })}</li>
          )}
          {items.map((it, i) => {
            const header = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            return (
              <li key={it.key} role="presentation">
                {header && <p className="eyebrow px-2.5 pb-1 pt-2.5">{header}</p>}
                <div
                  id={`palette-${it.key}`}
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(it)}
                  className={`flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 ${i === active ? "bg-paper-2" : ""}`}
                >
                  <it.icon className="size-4 shrink-0 stroke-[1.75] text-ink-3" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{it.title}</span>
                    {it.subtitle && <span className="block truncate text-xs text-ink-3">{it.subtitle}</span>}
                  </span>
                  {it.badge && (
                    <span className="flex shrink-0 items-center gap-1.5 text-[11.5px] text-ink-2">
                      {meta.state(it.badge) && <span className={`size-1.5 rounded-full ${toneDot(meta.state(it.badge)?.tone)}`} aria-hidden />}
                      {meta.state(it.badge)?.name ?? it.badge}
                    </span>
                  )}
                  {i === active ? <CornerDownLeft className="size-3.5 shrink-0 text-ink-3" aria-hidden /> : <ArrowRight className="size-3.5 shrink-0 text-transparent" aria-hidden />}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-4 border-t border-line bg-paper/60 px-4 py-2 text-[11px] text-ink-3">
          <span className="flex items-center gap-1"><span className="kbd">↑</span><span className="kbd">↓</span> {t("pilih")}</span>
          <span className="flex items-center gap-1"><span className="kbd">Enter</span> {t("buka")}</span>
          <span className="ml-auto">{t("Setiap kata harus cocok · urut relevansi")}</span>
        </div>
      </div>
    </div>
  );
}
