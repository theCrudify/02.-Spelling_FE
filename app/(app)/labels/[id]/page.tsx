import { AlertTriangle, ArrowLeft, Check, ChevronDown, CornerUpLeft, Info, Loader2, RotateCw, ShieldCheck, Upload, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { EntityForm } from "@/components/entity-form";
import { HistoryTimeline } from "@/components/history";
import { LabelViewer } from "@/components/label-viewer";
import { StatusBadge } from "@/components/status-badge";
import { FileLink, fmtDateTime, PageHeader, Section } from "@/components/ui";
import { versionFields } from "@/lib/forms";
import type { T } from "@/lib/i18n";
import { getLang, getT } from "@/lib/lang";
import { getMeta } from "@/lib/meta";
import { getServices } from "@/lib/services/services";
import type { Row } from "@/lib/services/types";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Detail label") };
}

/** Snapshot steps of the current approval round. */
function Stepper({ steps, current, kind, approvedBy, t }: { steps: Row[]; current: number | null; kind?: string; approvedBy: number[]; t: T }) {
  return (
    <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label={t("Progres approval")}>
      {steps.map((s) => {
        const done = s.status === "approved";
        const now = kind === "approval" && s.step_no === current;
        const bad = s.status === "returned" || s.status === "rejected";
        return (
          <li key={s.id} className="min-w-0" aria-current={now ? "step" : undefined}>
            <span className={`block h-1.5 rounded-full ${done ? "bg-accent" : now ? "bg-amber-400" : bad ? "bg-rose-400" : "bg-line"}`} />
            <span className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${done ? "text-accent-2" : now ? "text-amber-800" : bad ? "text-rose-700" : "text-ink-3"}`}>
              {done && <Check className="size-3.5 shrink-0" aria-hidden />}
              <span className="truncate">{t(s.name)}</span>
            </span>
            <span className="block truncate text-[11px] text-ink-3">
              {s.user_name ?? s.role_code} · {t("butuh {n} persetujuan", { n: `${now ? `${approvedBy.length}/` : ""}${s.required}` })} · {t("SLA {n} hr", { n: s.sla_days })}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default async function LabelDetailPage({ params, searchParams }: PageProps<"/labels/[id]">) {
  await requireUser();
  const meta = await getMeta();
  const [t, lang] = [await getT(), await getLang()];
  const id = Number((await params).id);
  const version = (await searchParams).version as string | undefined;
  const s = await getServices();
  const l = await s.labels.detail(id, version);
  const kind = meta.kindOf(l.status);
  const v = l.version;
  const isCurrent = v?.version === l.current_version;
  const busy = isCurrent && (v?.ocr_status === "queued" || v?.ocr_status === "running");
  const step = l.steps.find((st: Row) => st.step_no === l.current_step);
  const hasActions = !!step && (l.can_approve || kind === "approval") || l.can_review || l.can_upload;
  const target = (action: string, done: string) => ({ resource: "labels" as const, op: "labelAction" as const, id, action, redirectTo: `/labels/${id}?ok=${encodeURIComponent(done)}` });

  const reviewed = l.findings.length - l.open_findings;
  const viewable = v && !busy && v.ocr_status === "done";
  // What this user does next. Lives in the rail beside the artwork, above the findings, so it is never below the fold.
  const actions = hasActions ? (
        <div className="space-y-4">
          {l.can_approve && step && (
            <section className="card overflow-hidden border-accent/30" aria-labelledby="decision-title">
              <header className="border-b border-accent/15 bg-accent-soft px-4 py-3">
                <h2 id="decision-title" className="text-[13.5px] font-semibold text-accent-2">{t("Keputusan Anda")} · {t(step.name)}</h2>
                <p className="mt-0.5 text-[13px] text-accent-2/80">
                  {t("Tahap ini butuh {b} persetujuan ({a} sudah).", { a: l.approved_by.length, b: step.required })} {t("Pastikan semua temuan sudah sesuai pada artwork v{n}.", { n: l.current_version })}
                </p>
              </header>
              <div className="p-4">
                <EntityForm
                  columns={1}
                  submitLabel={t("Setujui")}
                  target={target("approve", "Persetujuan tersimpan")}
                  defaults={{ revision: l.revision }}
                  fields={[{ name: "revision", label: "", type: "hidden" }, { name: "note", label: t("Catatan (opsional)"), type: "textarea" }, { name: "password", label: t("Password Anda (tanda tangan elektronik)"), type: "password", required: true, hint: t("Keputusan dicatat atas nama Anda beserta waktu dan alasannya.") }]}
                />
                <details className="group mt-4 border-t border-line pt-3.5">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-medium text-orange-700 [&::-webkit-details-marker]:hidden">
                    <CornerUpLeft className="size-4" aria-hidden /> {t("Minta revisi ke designer")}
                  </summary>
                  <div className="mt-3.5">
                    <EntityForm
                      columns={1}
                      danger
                      submitLabel={t("Minta revisi")}
                      target={target("revision", "Revisi diminta")}
                      defaults={{ revision: l.revision }}
                      fields={[{ name: "revision", label: "", type: "hidden" }, { name: "note", label: t("Yang harus diperbaiki"), type: "textarea", required: true, hint: t("Wajib, minimal 5 karakter. Approval akan mulai dari tahap 1 setelah versi baru diajukan.") }, { name: "password", label: t("Password Anda (tanda tangan elektronik)"), type: "password", required: true, hint: t("Keputusan dicatat atas nama Anda beserta waktu dan alasannya.") }]}
                    />
                  </div>
                </details>
                <details className="group mt-3 border-t border-line pt-3.5">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-medium text-red-700 [&::-webkit-details-marker]:hidden">
                    <XCircle className="size-4" aria-hidden /> {t("Tolak label (final)")}
                  </summary>
                  <div className="mt-3.5">
                    <EntityForm
                      columns={1}
                      danger
                      submitLabel={t("Tolak")}
                      target={target("reject", "Label ditolak")}
                      defaults={{ revision: l.revision }}
                      fields={[{ name: "revision", label: "", type: "hidden" }, { name: "note", label: t("Alasan"), type: "textarea", required: true }, { name: "password", label: t("Password Anda (tanda tangan elektronik)"), type: "password", required: true, hint: t("Keputusan dicatat atas nama Anda beserta waktu dan alasannya.") }]}
                    />
                  </div>
                </details>
              </div>
            </section>
          )}
          {kind === "approval" && !l.can_approve && step && (
            <div className="card flex gap-3 p-4 text-[13px] text-ink-2">
              <Info className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
              <p>{t("Menunggu")} <b className="text-ink">{t(step.name)}</b> ({step.user_name ?? meta.name("roles", step.role_code)}).</p>
            </div>
          )}

          {l.can_review && (
            <section className="card p-4" aria-labelledby="next-title">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="next-title" className="text-sm font-semibold text-ink">{t("Review temuan")}</h2>
                <span className="num text-xs text-ink-3">{reviewed}/{l.findings.length}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-labelledby="next-title" aria-valuemin={0} aria-valuemax={l.findings.length} aria-valuenow={reviewed}>
                <div className="h-full rounded-full bg-accent" style={{ width: `${l.findings.length ? (reviewed / l.findings.length) * 100 : 100}%` }} />
              </div>
              <p className="mt-2.5 text-[13px] leading-5 text-ink-3">
                {l.open_findings ? t('{n} temuan belum selesai: tandai "Bukan masalah", atau "Harus diperbaiki" lalu unggah versi baru.', { n: l.open_findings }) : t("Semua temuan sudah direview. Rute approval dipilih otomatis sesuai negara, brand, tipe label, dan plant.")}
              </p>
              {l.can_submit && (
                <div className="mt-4">
                  <EntityForm columns={1} submitLabel={t("Ajukan approval")} target={target("submit", "Diajukan ke approval")} fields={[{ name: "note", label: t("Catatan untuk approver (opsional)"), type: "textarea" }]} />
                </div>
              )}
              <div className="mt-4 border-t border-line pt-3">
                <EntityForm quiet columns={1} submitLabel={t("Periksa ulang dengan glossary & teks master terbaru")} target={target("recheck", "Pemeriksaan ulang dimulai")} fields={[]} />
              </div>
            </section>
          )}

          {l.can_upload && (
            <details className="card group" open={!l.can_review}>
              <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                <Upload className="size-4 text-ink-3" aria-hidden />
                {t("Unggah versi baru (v{n})", { n: l.current_version + 1 })}
                <ChevronDown className="ml-auto size-4 text-ink-3 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="border-t border-line p-4">
                <p className="mb-4 text-[13px] leading-5 text-ink-3">{t("Versi baru langsung diperiksa ulang. Temuan versi lama tetap tersimpan di riwayat versi.")}</p>
                <EntityForm columns={1} submitLabel={t("Unggah & periksa")} target={target("versions", "Versi baru diunggah")} fields={versionFields(meta, t)} />
              </div>
            </details>
          )}
        </div>
  ) : null;

  return (
    <>
      {busy && <AutoRefresh />}
      <Link href="/labels" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {t("Label kemasan")}
      </Link>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">{l.name}<StatusBadge status={l.status} /></span>}
        meta={
          <>
            <span className="code">{l.code}</span>
            <span className="text-line-2">·</span>
            <span>{l.product_name} ({meta.name("brands", l.brand)})</span>
            <span className="text-line-2">·</span>
            <span>{l.country_name}</span>
            <span className="text-line-2">·</span>
            <span>{meta.name("label_types", l.label_type)}</span>
            <span className="text-line-2">·</span>
            <span>{l.languages.map((c: string) => meta.name("languages", c)).join(", ")}</span>
          </>
        }
        actions={
          l.versions.length > 1 && (
            <nav className="flex flex-wrap gap-1" aria-label={t("Versi artwork")}>
              {l.versions.map((x: Row) => (
                <Link key={x.id} href={`/labels/${id}?version=${x.version}`} className={`btn btn-sm ${x.version === v?.version ? "btn-primary" : ""}`} aria-current={x.version === v?.version ? "page" : undefined}>
                  v{x.version}
                </Link>
              ))}
            </nav>
          )
        }
      />

      {l.steps.length > 0 && (
        <div className="card mb-5 p-4">
          <p className="mb-3 text-xs font-medium text-ink-3">{t("Rute approval")}: {meta.name("approval_routes", l.route_code)} · {t("putaran {n}", { n: l.round })}</p>
          <Stepper steps={l.steps} current={l.current_step} kind={kind} approvedBy={l.approved_by} t={t} />
        </div>
      )}

      {busy && (
        <p className="card mb-5 flex items-center gap-2.5 p-4 text-sm text-sky-800">
          <Loader2 className="size-4 animate-spin" aria-hidden /> {t("Artwork v{n} sedang dibaca & diperiksa oleh mesin OCR lokal. Halaman ini diperbarui otomatis.", { n: v.version })}
        </p>
      )}
      {v?.ocr_status === "failed" && (
        <p className="card mb-5 flex gap-2.5 border-rose-200 p-4 text-sm text-rose-800" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{t("File tidak bisa dibaca:")} <code className="text-xs">{v.ocr_error}</code>. {t("Unggah ulang dalam format PDF / AI (PDF compatible) / PNG / JPG.")}</span>
        </p>
      )}
      {!isCurrent && v && (
        <p className="card mb-5 flex gap-2.5 p-4 text-sm text-ink-2">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> {t("Anda melihat versi lama (v{n}).", { n: v.version })} <Link className="link" href={`/labels/${id}`}>{t("Ke versi terbaru (v{n})", { n: l.current_version })}</Link>
        </p>
      )}
      {kind === "approved" && (
        <p className="card mb-5 flex gap-2.5 border-emerald-200 p-4 text-sm text-emerald-800">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> {t("Artwork v{n} disetujui dan dikunci.", { n: l.current_version })} SHA-256: <code className="break-all text-xs">{l.versions.find((x: Row) => x.version === l.current_version)?.sha256}</code>
        </p>
      )}

      {viewable ? (
        <LabelViewer labelId={id} versionId={v.id} pages={l.pages} findings={l.findings} blocks={l.blocks} canReview={l.can_review} aside={actions} />
      ) : (
        actions && <div className="max-w-xl">{actions}</div>
      )}

      {/* Same columns as the workspace above: history under the artwork, files under the rail. */}
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <Section title={t("Riwayat")} actions={<RotateCw className="size-4 text-ink-3" aria-hidden />}>
          <HistoryTimeline items={l.histories} />
        </Section>
        <div className="space-y-6">
          <Section title={t("Versi artwork")} flush>
            <ul className="divide-y divide-slate-100">
              {l.versions.map((x: Row) => (
                <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[13px]">
                  <span className="min-w-0">
                    <Link className="font-semibold text-ink hover:underline" href={`/labels/${id}?version=${x.version}`}>v{x.version}</Link>{" "}
                    <span className="text-ink-3">· {x.created_by_name} · {fmtDateTime(x.created_at, lang)}</span>
                    {x.note && <span className="block text-xs text-ink-2">{x.note}</span>}
                  </span>
                  <span className="flex items-center gap-3">
                    {x.locked_at && <span className="text-xs font-semibold text-emerald-700">{t("Approved & dikunci")}</span>}
                    <span className="text-xs text-ink-3">{x.ocr_status === "done" ? (x.ocr_started_at && x.ocr_finished_at ? t("{n} dtk", { n: Math.max(1, Math.round((Date.parse(x.ocr_finished_at) - Date.parse(x.ocr_started_at)) / 1000)) }) : "") : x.ocr_status}</span>
                    <FileLink id={x.file_id} label={x.file_name} lang={lang} />
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          {v && v.ocr_status === "done" && (
            <Section title={t("Teks terbaca")} description={t("Urutan baca per halaman; hijau = text layer (akurat), ungu = OCR.")}>
              <details>
                <summary className="cursor-pointer text-sm text-ink-2">{t("Tampilkan {n} kata", { n: l.blocks.length })}</summary>
                <p className="mt-3 text-[13px] leading-6">
                  {l.blocks.map((b: Row) => (
                    <span key={b.id} className={b.source === "ocr" ? "text-violet-800" : "text-emerald-900"} title={`${b.lang ?? "-"} · ${b.source === "ocr" ? `OCR ${Math.round(b.confidence * 100)}%` : "text layer"}`}>
                      {b.text}{" "}
                    </span>
                  ))}
                </p>
              </details>
            </Section>
          )}

        </div>
      </div>
    </>
  );
}
