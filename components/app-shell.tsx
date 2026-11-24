"use client";

import { ChevronRight, LogOut, Menu, Search, Sparkles, X } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CommandPalette } from "./command-palette";
import { Flash } from "./flash";
import { useT } from "./lang-context";
import { LangToggle } from "./lang-toggle";
import { useMeta } from "./meta-context";
import { ThemeToggle } from "./theme-toggle";
import type { Meta } from "@/lib/meta-model";

type ShellUser = { name: string; role: string; site: string | null };
type NavItem = { href: string; label: string; icon: string; badge?: number };
type NavGroup = { title?: string; items: NavItem[] };

/** Navigation from the menus table (already filtered by permission on the server). */
function buildMenu(meta: Meta, tasks: number): NavGroup[] {
  const groups: NavGroup[] = [];
  for (const m of meta.raw.menu) {
    const title = m.group_name ?? undefined;
    let g = groups.find((x) => x.title === title);
    if (!g) groups.push((g = { title, items: [] }));
    g.items.push({ href: m.path, label: m.name, icon: m.icon, badge: m.badge === "tasks" ? tasks : undefined });
  }
  return groups;
}

/** Active when the path matches and every query param of the link is in the URL. */
function isActive(href: string, pathname: string, params: URLSearchParams) {
  const [path, query] = href.split("?");
  if (path === "/") return pathname === "/";
  if (!(pathname === path || pathname.startsWith(`${path}/`))) return false;
  if (pathname !== path) return !query; // detail pages light up the section's plain link
  const want = new URLSearchParams(query);
  if (![...want].every(([k, v]) => params.get(k) === v)) return false;
  return query ? true : !params.get("site") && !params.get("category") && !params.get("scope");
}

function Sidebar({ user, tasks, onNavigate, onSearch }: { user: ShellUser; tasks: number; onNavigate?: () => void; onSearch: () => void }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const meta = useMeta();
  const t = useT();
  const groups = buildMenu(meta, tasks);
  // Most specific match wins, so /labels/new does not also light up /labels.
  const activeHref = groups.flatMap((g) => g.items).filter((i) => isActive(i.href, pathname, params)).sort((a, b) => b.href.split("?")[0].length - a.href.split("?")[0].length)[0]?.href;
  const initials = user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex h-full flex-col border-r border-slate-200/90 bg-white">
      {/* Brand Header */}
      <div className="p-4 pb-3">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3 group">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-xs font-black text-white shadow-sm shadow-emerald-700/25 ring-1 ring-emerald-600/30 transition-transform group-hover:scale-105">
            Aa✓
          </div>
          <div className="leading-tight min-w-0">
            <span className="block text-sm font-semibold tracking-tight text-slate-900">
              Label Spelling
            </span>
            <span className="block text-[11px] font-medium text-slate-400 truncate">
              PT Amerta Indah Otsuka
            </span>
          </div>
        </Link>
      </div>

      {/* Global Search Shortcut */}
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onSearch}
          className="flex h-9 w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800"
        >
          <Search className="size-3.5 text-slate-400" aria-hidden />
          <span className="flex-1 truncate text-left">{t("Cari data & menu…")}</span>
          <span className="kbd text-[9.5px]">Ctrl K</span>
        </button>
      </div>

      {/* Navigation Group Items */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-4" aria-label={t("Menu utama")}>
        {groups.map((g, i) => (
          <div key={i} className="first:mt-0">
            {g.title && (
              <p className="px-2.5 pb-1.5 text-[11px] font-medium text-slate-400">
                {g.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {g.items.map(({ href, label, icon, badge }) => {
                const active = href === activeHref;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-xs transition-all duration-150 ${
                        active
                          ? "bg-emerald-50 font-semibold text-emerald-900"
                          : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <DynamicIcon
                        name={icon as IconName}
                        fallback={() => <span className="size-4 shrink-0" />}
                        className={`size-4 shrink-0 stroke-[1.8] ${active ? "text-emerald-700" : "text-slate-400"}`}
                        aria-hidden
                      />
                      <span className="flex-1 truncate">{label}</span>
                      {!!badge && (
                        <span className="num rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10.5px] font-semibold leading-none text-white">
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Footer Profile Card */}
      <div className="border-t border-slate-100 p-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white p-2 shadow-2xs">
          <Link href="/account" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-2.5 hover:opacity-80 transition-opacity">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold text-white shadow-xs">
              {initials}
            </span>
            <div className="min-w-0 leading-tight">
              <span className="block truncate text-xs font-bold text-slate-800">{user.name}</span>
              <span className="block truncate text-[10.5px] font-medium text-slate-400">
                {meta.name("roles", user.role)} · {user.site ? meta.name("sites", user.site) : "All Sites"}
              </span>
            </div>
          </Link>
          <a
            href="/logout"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            aria-label={t("Keluar")}
            title={t("Keluar")}
          >
            <LogOut className="size-4 stroke-[1.8]" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- breadcrumbs
function Breadcrumbs() {
  const meta = useMeta();
  const t = useT();
  const parts = usePathname().split("/").filter(Boolean);
  const labelOf = (href: string, part: string) =>
    (meta.raw.menu.find((m) => m.path === href) ?? meta.raw.menu.find((m) => m.path.split("?")[0] === href))?.name ??
    (part === "new" ? t("Baru") : /^\d+$/.test(part) ? `#${part}` : part === "admin" ? "Admin" : meta.name("list_resources", part) || part);

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-xs">
        <li>
          <Link href="/" className="font-semibold text-slate-400 hover:text-emerald-700 transition-colors">
            Spelling
          </Link>
        </li>
        {(parts.length ? parts : [""]).map((p, i) => {
          const href = "/" + parts.slice(0, i + 1).join("/");
          const last = i === Math.max(parts.length, 1) - 1;
          const label = p === "" ? labelOf("/", "") : labelOf(href, p);
          return (
            <li key={href + i} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight className="size-3 shrink-0 text-slate-300" aria-hidden />
              {last || p === "admin" ? (
                <span className={`truncate ${last ? "font-bold text-slate-900" : "font-medium text-slate-500"}`} aria-current={last ? "page" : undefined}>
                  {label}
                </span>
              ) : (
                <Link href={href} className="truncate font-medium text-slate-500 hover:text-slate-900 transition-colors">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ----------------------------------------------------------------- shell
export function AppShell({ user, tasks, children }: { user: ShellUser; tasks: number; children: ReactNode }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50/60">
      <a href="#main" className="sr-only z-50 rounded-lg bg-white px-4 py-2 shadow-md focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        {t("Lewati ke konten")}
      </a>

      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <Sidebar user={user} tasks={tasks} onSearch={() => setPalette(true)} />
      </aside>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar user={user} tasks={tasks} onNavigate={() => setOpen(false)} onSearch={() => { setOpen(false); setPalette(true); }} />
            <button className="absolute right-2.5 top-3.5 grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" onClick={() => setOpen(false)} aria-label={t("Tutup menu")}>
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button className="btn btn-ghost -ml-2 size-8 p-0 lg:hidden" onClick={() => setOpen(true)} aria-label={t("Buka menu")}>
            <Menu className="size-4" />
          </button>
          <Breadcrumbs />
          <div className="ml-auto flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            <button className="btn btn-ghost size-8 p-0 lg:hidden" onClick={() => setPalette(true)} aria-label={t("Cari")}>
              <Search className="size-4" />
            </button>
          </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-7 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <Flash />
    </div>
  );
}
