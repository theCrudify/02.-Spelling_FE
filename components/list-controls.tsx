"use client";

import { ListFilter, Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";

import type { FilterDef } from "@/lib/meta-model";
import { useT } from "./lang-context";
export type { FilterDef };

/** Applies a patch to the current query; any filter change returns to page 1. */
function useQueryUpdate() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const update = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) (v ? q.set(k, v) : q.delete(k));
    q.delete("page");
    // Starting a search ranks by relevance, so an earlier column sort is dropped.
    if (patch.search && !params.get("search")) {
      q.delete("sortBy");
      q.delete("sortDir");
    }
    const s = q.toString();
    startTransition(() => router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false }));
  };
  return { params, update, pending };
}

/** Filter select: reads "Semua status" when idle, the chosen value (tinted, clearable) when active. */
function FilterSelect({ f, value, onChange }: { f: FilterDef; value: string; onChange: (v: string) => void }) {
  const t = useT();
  const active = !!value;
  return (
    <span className="relative inline-flex">
      <select
        className={`input w-auto max-w-52 truncate pr-8 ${active ? "border-emerald-600/40 bg-emerald-50 bg-none font-medium text-emerald-900" : "text-slate-600"}`}
        style={{ fieldSizing: "content" } as React.CSSProperties}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={f.label}
      >
        <option value="">{t("Semua {label}", { label: f.label.toLowerCase() })}</option>
        {f.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {active && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-emerald-800 hover:bg-emerald-200/60"
          aria-label={t("Hapus filter {label}", { label: f.label })}
        >
          <X className="size-3.5" />
        </button>
      )}
    </span>
  );
}

export function ListControls({
  filters = [],
  placeholder,
  children,
}: {
  filters?: FilterDef[];
  placeholder?: string;
  children?: ReactNode;
}) {
  const t = useT();
  const { params, update, pending } = useQueryUpdate();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchRef = useRef<HTMLInputElement>(null);

  const visible = filters.filter((f) => f.primary);
  const advanced = filters.filter((f) => !f.primary);
  const advancedActive = advanced.filter((f) => params.get(f.name)).length;
  const [showAdvanced, setShowAdvanced] = useState(advancedActive > 0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeCount = filters.filter((f) => params.get(f.name)).length;
  const anything = activeCount > 0 || !!params.get("search");

  useEffect(() => setSearch(params.get("search") ?? ""), [params]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onSearch = (v: string) => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => update({ search: v.trim() || null }), 300);
  };
  const setFilter = (name: string) => (v: string) => update({ [name]: v || null });

  return (
    <div className="border-b border-slate-200">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            ref={searchRef}
            className="input h-9 pl-9 pr-8"
            type="search"
            value={search}
            placeholder={placeholder ?? t("Cari data…")}
            onChange={(e) => onSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                clearTimeout(timer.current);
                update({ search: search.trim() || null });
              }
              if (e.key === "Escape" && search) onSearch("");
            }}
            aria-label={t("Cari")}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {pending ? (
              <Loader2 className="size-3.5 animate-spin text-emerald-600" aria-label={t("Memuat")} />
            ) : (
              !search && <span className="kbd hidden sm:inline-flex text-[9px]" aria-hidden>/</span>
            )}
          </span>
        </div>

        {filters.length > 0 && (
          <button
            type="button"
            className="btn sm:hidden"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <ListFilter aria-hidden /> Filter
            {activeCount > 0 && <span className="rounded-full bg-emerald-600 px-1.5 text-[9px] text-white font-bold">{activeCount}</span>}
          </button>
        )}

        <div className={`${mobileOpen ? "flex w-full flex-wrap gap-2" : "hidden"} sm:contents`}>
          {visible.map((f) => (
            <FilterSelect key={f.name} f={f} value={params.get(f.name) ?? ""} onChange={setFilter(f.name)} />
          ))}
          {advanced.length > 0 && (
            <button
              type="button"
              className={`btn ${advancedActive ? "border-emerald-600/40 bg-emerald-50 text-emerald-900" : "text-slate-600"}`}
              aria-expanded={showAdvanced}
              onClick={() => setShowAdvanced((v) => !v)}
            >
              <ListFilter aria-hidden />
              <span>{t(showAdvanced ? "Sembunyikan Filter" : "Filter Lanjutan")}</span>
              {advancedActive > 0 && (
                <span className="num rounded-full bg-emerald-600 px-1.5 text-[10.5px] font-semibold text-white">
                  {advancedActive}
                </span>
              )}
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {anything && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => update(Object.fromEntries([...filters.map((f) => [f.name, null]), ["search", null]]))}
            >
              {t("Reset Filter")}
            </button>
          )}
          {children}
        </div>
      </div>
      {showAdvanced && advanced.length > 0 && (
        <div className={`${mobileOpen ? "flex" : "hidden sm:flex"} flex-wrap gap-2 border-t border-slate-100 bg-slate-50 p-3`}>
          {advanced.map((f) => (
            <FilterSelect key={f.name} f={f} value={params.get(f.name) ?? ""} onChange={setFilter(f.name)} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PageSizeSelect({ value }: { value: number }) {
  const t = useT();
  const { update } = useQueryUpdate();
  return (
    <label className="flex items-center gap-2 text-xs text-slate-500">
      <span className="hidden sm:inline">{t("Baris per halaman")}</span>
      <select
        className="input h-8 w-auto pl-2.5 pr-7"
        value={value}
        onChange={(e) => update({ pageSize: e.target.value })}
        aria-label={t("Baris per halaman")}
      >
        {[10, 25, 50, 100].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Segmented tab control with badges */
export function QueryTabs({ name, tabs }: { name: string; tabs: { value: string; label: string; count?: number }[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const current = params.get(name) ?? tabs[0].value;

  return (
    <div className="mb-5 flex gap-6 border-b border-slate-200" role="tablist">
      {tabs.map((t) => {
        const selected = current === t.value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={selected}
            className={`-mb-px flex items-center gap-2 border-b-2 pb-2.5 pt-1 text-sm transition-colors ${
              selected ? "border-emerald-600 font-semibold text-slate-900" : "border-transparent font-medium text-slate-500 hover:text-slate-900"
            }`}
            onClick={() => router.replace(`${pathname}?${name}=${t.value}`)}
          >
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span
                className={`num rounded-full px-1.5 py-0.5 text-[11px] font-medium leading-none ${selected ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
