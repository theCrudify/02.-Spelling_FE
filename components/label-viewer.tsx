"use client";

import { Loader2, MapPin, ZoomIn, ZoomOut } from "lucide-react";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { submitForm, type FormState } from "@/app/actions";
import type { Row } from "@/lib/services/types";
import { useT } from "./lang-context";
import { useMeta } from "./meta-context";
import { Badge, toneBox } from "./ui";

/**
 * Review workspace: artwork with finding boxes on the left; on the right a rail with `aside` (the next step for this user)
 * above the findings. Click a box or a finding to link them. Reviewers resolve findings inline.
 */
export function LabelViewer({ labelId, versionId, pages, findings, blocks, canReview, aside }: { labelId: number; versionId: number; pages: Row[]; findings: Row[]; blocks: Row[]; canReview: boolean; aside?: ReactNode }) {
  const t = useT();
  const meta = useMeta();
  // Names, colours and rules of severities / check types / review outcomes are master data.
  const cleared = (f: Row) => meta.get("finding_resolutions", f.resolution)?.kind === "cleared";
  const [zoom, setZoom] = useState(100);
  const [selected, setSelected] = useState<number | null>(null);
  const [showText, setShowText] = useState(false);
  const [filter, setFilter] = useState<"todo" | "all">("todo");
  const listRef = useRef<HTMLOListElement>(null);
  const shown = findings.filter((f) => filter === "all" || !cleared(f));

  const select = (id: number, from: "box" | "list") => {
    setSelected(id);
    const target = from === "box" ? listRef.current?.querySelector(`[data-finding="${id}"]`) : document.getElementById(`box-${id}`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <section className="card overflow-hidden" aria-label="Artwork">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} />
            {t("Tampilkan semua teks terbaca")}
          </label>
          <span className="flex items-center gap-1">
            <button type="button" className="btn btn-sm" onClick={() => setZoom((z) => Math.max(50, z - 25))} aria-label={t("Perkecil")}><ZoomOut aria-hidden /></button>
            <span className="num w-12 text-center text-xs text-slate-600">{zoom}%</span>
            <button type="button" className="btn btn-sm" onClick={() => setZoom((z) => Math.min(400, z + 25))} aria-label={t("Perbesar")}><ZoomIn aria-hidden /></button>
          </span>
        </header>
        <div className="max-h-[calc(100vh-9.5rem)] overflow-auto bg-slate-100 p-5">
          {pages.map((p) => (
            <figure key={p.page_no} className="artwork relative mx-auto mb-4 bg-white shadow-sm" style={{ width: `min(${zoom}%, ${zoom * 8}px)` }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- authenticated stream, not a static asset */}
              <img src={`/labels/${labelId}/pages/${versionId}/${p.page_no}`} alt={t("Artwork halaman {n}", { n: p.page_no })} className="block w-full" />
              <svg viewBox={`0 0 ${p.width} ${p.height}`} className="absolute inset-0 size-full" role="group" aria-label={t("Temuan halaman {n}", { n: p.page_no })}>
                {showText &&
                  blocks
                    .filter((b) => b.page_no === p.page_no)
                    .map((b) => (
                      <rect key={`b${b.id}`} x={b.bbox[0]} y={b.bbox[1]} width={b.bbox[2] - b.bbox[0]} height={b.bbox[3] - b.bbox[1]} className={b.source === "ocr" ? "fill-none stroke-violet-400" : "fill-none stroke-emerald-400"} strokeWidth={Math.max(1, p.width / 900)}>
                        <title>{`${b.text} · ${b.source === "ocr" ? `OCR ${Math.round(b.confidence * 100)}%` : "text layer"} · ${b.lang ?? "-"}`}</title>
                      </rect>
                    ))}
                {shown
                  .filter((f) => f.page_no === p.page_no && f.bbox)
                  .map((f) => (
                    <rect
                      key={f.id}
                      id={`box-${f.id}`}
                      x={f.bbox[0] - 4}
                      y={f.bbox[1] - 4}
                      width={f.bbox[2] - f.bbox[0] + 8}
                      height={f.bbox[3] - f.bbox[1] + 8}
                      rx={4}
                      className={`cursor-pointer ${toneBox(meta.get("severities", f.severity)?.tone)} ${cleared(f) ? "opacity-30" : ""}`}
                      strokeWidth={selected === f.id ? Math.max(3, p.width / 250) : Math.max(2, p.width / 500)}
                      onClick={() => select(f.id, "box")}
                    >
                      <title>{t(f.message)}</title>
                    </rect>
                  ))}
              </svg>
            </figure>
          ))}
          {!pages.length && <p className="py-16 text-center text-sm text-slate-500">{t("Belum ada halaman yang dirender.")}</p>}
        </div>
      </section>

      <div className="space-y-4 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6.5rem)] xl:overflow-y-auto">
      {aside}
      <section className="card overflow-hidden" aria-label={t("Temuan")}>
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
          <h2 className="text-sm font-semibold text-slate-900">{t("Temuan")} <span className="num font-normal text-slate-400">{findings.length}</span></h2>
          <select className="input h-8 w-auto text-xs" value={filter} onChange={(e) => setFilter(e.target.value as "todo" | "all")} aria-label={t("Filter temuan")}>
            <option value="todo">{t('Sembunyikan "bukan masalah"')}</option>
            <option value="all">{t("Tampilkan semua")}</option>
          </select>
        </header>
        {shown.length ? (
          <ol ref={listRef} className="max-h-[78vh] divide-y divide-slate-100 overflow-auto xl:max-h-none">
            {shown.map((f) => (
              <li key={f.id} data-finding={f.id} className={`border-l-2 px-4 py-3.5 ${selected === f.id ? "border-l-amber-500 bg-amber-50/60" : "border-l-transparent"}`}>
                <button type="button" className="block w-full text-left" onClick={() => f.bbox && select(f.id, "list")}>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={meta.get("severities", f.severity)?.tone} dot={false}>{meta.name("severities", f.severity)}</Badge>
                    <span className="text-[11px] font-medium text-slate-500">{meta.name("check_types", f.check_type)}</span>
                    {f.lang && <span className="code text-[10.5px]">{f.lang}</span>}
                    {f.page_no && f.bbox ? <MapPin className="size-3 text-slate-400" aria-label={t("halaman {n}", { n: f.page_no })} /> : null}
                  </span>
                  <span className="mt-1.5 block text-[13px] leading-5 text-slate-800">{t(f.message)}</span>
                </button>
                {meta.get("finding_resolutions", f.resolution)?.kind !== "open" && <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <Badge tone={meta.get("finding_resolutions", f.resolution)?.tone}>{meta.name("finding_resolutions", f.resolution)}</Badge>
                  {f.resolved_by_name && <span className="font-normal text-slate-400"> · {f.resolved_by_name}</span>}
                  {f.note && <span className="block w-full font-normal text-slate-600">“{f.note}”</span>}
                </p>}
                {canReview && <FindingActions labelId={labelId} finding={f} />}
              </li>
            ))}
          </ol>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-slate-500">{t(findings.length ? "Semua temuan sudah ditandai bukan masalah." : "Tidak ada temuan. Label sesuai teks master dan aturan.")}</p>
        )}
      </section>
      </div>
    </div>
  );
}

function FindingActions({ labelId, finding: f }: { labelId: number; finding: Row }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitForm.bind(null, { resource: "labels", op: "labelAction", id: labelId, action: `findings/${f.id}`, success: "Temuan diperbarui" }), {});
  const t = useT();
  const outcomes = useMeta().active("finding_resolutions");
  const accept = outcomes.find((r) => r.kind === "cleared");
  const [more, setMore] = useState(false);
  useEffect(() => {
    if (state.ok) setMore(false);
  }, [state]);
  return (
    <form action={action} className="mt-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {outcomes
          .filter((r) => r.code !== f.resolution)
          .map((r) => (
            <button key={r.code} className="btn btn-sm" name="resolution" value={r.code} disabled={pending}>
              {r.kind === "open" ? t("Buka lagi") : r.name}
            </button>
          ))}
        <button type="button" className="btn btn-sm btn-ghost ml-auto" onClick={() => setMore((m) => !m)} aria-expanded={more}>
          {t(more ? "Tutup" : "Koreksi / catatan")}
        </button>
        {pending && <Loader2 className="size-4 animate-spin text-slate-400" aria-label={t("Menyimpan")} />}
      </div>
      {more && (
        <div className="mt-2 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
          {f.found && f.bbox && (
            <label className="block text-xs text-slate-600">
              {t("Teks sebenarnya di artwork (jika OCR salah baca)")}
              <input name="correct_text" className="input mt-1 h-8 text-sm" defaultValue="" placeholder={f.found} />
              <span className="mt-0.5 block text-[11px] text-slate-400">{t("Disimpan sebagai data latih model OCR sendiri.")}</span>
            </label>
          )}
          {f.found && (
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" name="add_glossary" value="true" /> {t("Tambahkan ke glossary (tidak dilaporkan lagi)")}
            </label>
          )}
          <textarea name="note" className="input min-h-14 text-sm" placeholder={t("Catatan (opsional)")} defaultValue={f.note ?? ""} />
          {accept && <button className="btn btn-sm btn-primary" name="resolution" value={accept.code} disabled={pending}>{t("Simpan sebagai: {name}", { name: accept.name })}</button>}
        </div>
      )}
      {state.ok === false && <p className="mt-1 text-xs text-rose-700" role="alert">{state.message && t(state.message)}</p>}
    </form>
  );
}
