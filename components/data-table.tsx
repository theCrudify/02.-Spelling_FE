import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Meta } from "@/lib/meta-model";
import type { T } from "@/lib/i18n";
import { getT } from "@/lib/lang";
import type { ListResult, Row } from "@/lib/services/types";
import { PageSizeSelect } from "./list-controls";
import { EmptyState, Hl } from "./ui";

export type Column<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  align?: "right" | "center";
  render?: (row: T, q: string) => ReactNode;
};
type Params = Record<string, string | string[] | undefined>;

export function columnsFor<T extends Row>(
  meta: Meta,
  resource: string,
  renderers: Record<string, Partial<Column<T>>> = {},
  extra: Column<T>[] = []
): Column<T>[] {
  return [...meta.columns(resource).map((f) => ({ key: f.key, label: f.label, sortable: f.sortable, ...renderers[f.key] })), ...extra];
}

export function hrefWith(base: string, params: Params, patch: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (typeof v === "string" && v) q.set(k, v);
  for (const [k, v] of Object.entries(patch)) (v === undefined || v === "" ? q.delete(k) : q.set(k, String(v)));
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

const ALIGN = { right: "text-right", center: "text-center" } as const;

export async function DataTable<T extends Row>({
  columns,
  result,
  params,
  basePath,
  empty,
  toolbar,
  noun = "data",
  numbered = true,
}: {
  columns: Column<T>[];
  result: ListResult<T>;
  params: Params;
  basePath: string;
  empty?: ReactNode;
  toolbar?: ReactNode;
  noun?: string;
  numbered?: boolean;
}) {
  const t = await getT();
  const { data, meta } = result;
  const q = meta.search ?? "";
  const filtered = Object.entries(params).some(([k, v]) => v && !["page", "pageSize", "sortBy", "sortDir", "scope"].includes(k));

  return (
    <div className="card overflow-hidden">
      {toolbar}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {numbered && (
                <th scope="col" className="th w-12 pr-0 text-right">
                  #
                </th>
              )}
              {columns.map((col) => {
                const align = col.align ? ALIGN[col.align] : "";
                if (!col.sortable)
                  return (
                    <th key={col.key} scope="col" className={`th ${align} ${col.className ?? ""}`}>
                      {col.label}
                    </th>
                  );
                const active = meta.sortBy === col.key;
                const nextDir = active && meta.sortDir === "asc" ? "desc" : "asc";
                return (
                  <th key={col.key} scope="col" className={`th ${align} ${col.className ?? ""}`} aria-sort={active ? (meta.sortDir === "asc" ? "ascending" : "descending") : "none"}>
                    <Link
                      href={hrefWith(basePath, params, { sortBy: col.key, sortDir: nextDir, page: 1 })}
                      className={`group -mx-1 inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors hover:bg-slate-200/60 hover:text-slate-900 ${
                        active ? "text-slate-900" : "text-slate-500"
                      }`}
                      title={t("Urutkan: {label}", { label: col.label })}
                    >
                      {col.label}
                      {active ? (
                        meta.sortDir === "asc" ? (
                          <ArrowUp className="size-3 text-emerald-600 stroke-[2.5]" aria-hidden />
                        ) : (
                          <ArrowDown className="size-3 text-emerald-600 stroke-[2.5]" aria-hidden />
                        )
                      ) : (
                        <ArrowDown className="size-3 opacity-0 transition-opacity group-hover:opacity-40" aria-hidden />
                      )}
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr key={row.id} className="group/row transition-colors hover:bg-slate-50">
                {numbered && <td className="td num w-12 pr-0 text-right text-slate-400">{(meta.page - 1) * meta.pageSize + i + 1}</td>}
                {columns.map((col) => {
                  const v = row[col.key];
                  return (
                    <td key={col.key} className={`td ${col.align ? ALIGN[col.align] : ""} ${col.className ?? ""}`}>
                      {col.render ? col.render(row, q) : v == null || v === "" ? <span className="text-slate-400">—</span> : typeof v === "string" ? <Hl text={v} q={q} /> : v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 &&
          (empty ?? (
            <EmptyState
              icon={SearchX}
              title={q ? t("Tidak ada hasil untuk “{q}”", { q }) : t(filtered ? "Tidak ada data yang cocok" : "Belum ada data")}
              description={filtered ? t("Setiap kata harus cocok. Coba kata kunci lain atau sesuaikan filter.") : undefined}
              action={
                filtered ? (
                  <Link className="btn btn-sm" href={basePath + (params.scope ? `?scope=${params.scope}` : "")}>
                    {t("Reset pencarian & filter")}
                  </Link>
                ) : undefined
              }
            />
          ))}
      </div>
      {meta.total > 0 && <Pagination result={result} params={params} basePath={basePath} noun={t(noun)} t={t} />}
    </div>
  );
}

function Pagination({ result: { meta, data }, params, basePath, noun, t }: { result: ListResult<Row>; params: Params; basePath: string; noun: string; t: T }) {
  const from = (meta.page - 1) * meta.pageSize + 1;
  const to = from + data.length - 1;
  const start = Math.max(1, Math.min(meta.page - 2, meta.totalPages - 4));
  const pages = Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => start + i);
  const step = (page: number, label: string, Icon: typeof ChevronLeft, disabled: boolean) =>
    disabled ? (
      <span className="grid size-8 place-items-center text-slate-300" aria-hidden>
        <Icon className="size-4" />
      </span>
    ) : (
      <Link href={hrefWith(basePath, params, { page })} className="grid size-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors" aria-label={label}>
        <Icon className="size-4" />
      </Link>
    );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
      <p className="text-xs text-slate-500">
        {t("Menampilkan")} <span className="num font-medium text-slate-700">{from}–{to}</span> {t("dari")} <span className="num font-medium text-slate-700">{meta.total}</span> {noun}
        {meta.sortBy === "relevance" && <span className="text-emerald-700 font-medium"> · {t("relevansi terbaik")}</span>}
      </p>
      <div className="flex items-center gap-3">
        <PageSizeSelect value={meta.pageSize} />
        {meta.totalPages > 1 && <nav className="flex items-center gap-1" aria-label={t("Halaman")}>
          {step(meta.page - 1, t("Halaman sebelumnya"), ChevronLeft, meta.page === 1)}
          {pages.map((p) => (
            <Link
              key={p}
              href={hrefWith(basePath, params, { page: p })}
              aria-current={p === meta.page ? "page" : undefined}
              className={`num grid size-8 place-items-center rounded-lg text-xs transition-all ${
                p === meta.page ? "bg-slate-900 font-semibold text-white" : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {p}
            </Link>
          ))}
          {step(meta.page + 1, t("Halaman berikutnya"), ChevronRight, meta.page >= meta.totalPages)}
        </nav>}
      </div>
    </div>
  );
}
