import { CheckCircle2, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { columnsFor, DataTable } from "@/components/data-table";
import { ListControls, QueryTabs } from "@/components/list-controls";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, fmtDateTime, Hl, LinkButton, PageHeader, timeAgo } from "@/components/ui";
import { getLang, getT } from "@/lib/lang";
import { getMeta } from "@/lib/meta";
import { getServices } from "@/lib/services/services";
import type { Row } from "@/lib/services/types";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Label kemasan") };
}

export default async function LabelsPage({ searchParams }: PageProps<"/labels">) {
  await requireUser();
  const meta = await getMeta();
  const [t, lang] = [await getT(), await getLang()];
  const params = await searchParams;
  const scope = params.scope === "tasks" ? "tasks" : "all";
  // Work queue: oldest waiting first (setting), unless the user sorts or searches.
  const fifo = meta.setting("task_queue_oldest_first", "true") === "true";
  const queueSort = scope === "tasks" && fifo && !params.sortBy && !params.search ? { sortBy: "updated_at", sortDir: "asc" } : {};
  const s = await getServices();
  const [result, tasks] = await Promise.all([s.labels.list({ ...params, ...queueSort, scope }), s.labels.list({ scope: "tasks", pageSize: "1" })]);

  const columns = columnsFor<Row>(meta, "labels", {
    code: {
      render: (r, q) => (
        <Link href={`/labels/${r.id}`} className="group block min-w-64">
          <span className="font-medium text-ink group-hover:underline group-hover:decoration-line-2 group-hover:underline-offset-2"><Hl text={r.name} q={q} /></span>
          <span className="code block"><Hl text={r.code} q={q} /> · {r.product_code}</span>
        </Link>
      ),
    },
    country: { className: "whitespace-nowrap text-ink-2", render: (r) => r.country_name },
    label_type: { className: "whitespace-nowrap text-ink-2", render: (r) => meta.name("label_types", r.label_type) },
    current_version: { render: (r) => <span className="num">v{r.current_version}</span> },
    open_findings: {
      render: (r) =>
        r.ocr_status === "done" ? (
          r.open_findings ? <span className="num font-semibold text-amber-700">{r.open_findings} / {r.total_findings}</span> : <span className="text-emerald-700">{t("Bersih")}</span>
        ) : (
          <span className="text-xs text-ink-3">{t(r.ocr_status === "failed" ? "Gagal dibaca" : "Diproses…")}</span>
        ),
    },
    status: { render: (r) => <StatusBadge status={r.status} /> },
    updated_at: { render: (r) => <time className="num whitespace-nowrap text-ink-2" dateTime={r.updated_at} title={fmtDateTime(r.updated_at, lang)}>{timeAgo(r.updated_at, lang)}</time> },
  });

  return (
    <>
      <PageHeader
        eyebrow={t("Draft label")}
        title={meta.name("list_resources", "labels")}
        description={t("Setiap versi artwork diperiksa otomatis: beda vs teks master, salah ketik, istilah glossary, dan elemen wajib negara.")}
        actions={meta.can("label.edit") && <LinkButton href="/labels/new" primary icon={Plus}>{t("Label baru")}</LinkButton>}
      />
      <Suspense>
        <QueryTabs name="scope" tabs={[{ value: "tasks", label: t("Task List"), count: tasks.meta.total }, { value: "all", label: t("Semua label") }]} />
      </Suspense>
      <DataTable
        noun="label"
        columns={columns}
        result={result}
        params={{ ...params, scope }}
        basePath="/labels"
        toolbar={
          <Suspense>
            <ListControls filters={meta.filters("labels")} placeholder={t("Kode, nama label, produk…")} />
          </Suspense>
        }
        empty={scope === "tasks" && !params.search && !params.status ? <EmptyState icon={CheckCircle2} title={t("Antrian kosong")} description={t("Tidak ada label yang menunggu persetujuan Anda.")} /> : undefined}
      />
    </>
  );
}
