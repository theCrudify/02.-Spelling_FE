import { AlertTriangle, Clock, Inbox, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { TrendChart } from "@/components/dashboard-charts";
import { BarList, EmptyState, LinkButton, PageHeader, Section, StatTile, toneDot } from "@/components/ui";
import { getLang, getT } from "@/lib/lang";
import { getMeta } from "@/lib/meta";
import { getServices } from "@/lib/services/services";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Ringkasan") };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const meta = await getMeta();
  const t = await getT();
  const s = await getServices();
  const [summary, tasks] = await Promise.all([s.labels.summary(), s.labels.list({ scope: "tasks", pageSize: "5", sortBy: "updated_at", sortDir: "asc" })]);
  const count = (code: string) => summary.byStatus.find((b: any) => b.status === code)?.n ?? 0;
  const states = [...meta.active("workflow_states")].sort((a, b) => a.sort_order - b.sort_order);
  const lang = await getLang();
  const tot = summary.totals;
  const waiting = states.filter((st) => st.kind === "approval").reduce((n, st) => n + count(st.code), 0);
  const monthFmt = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "id-ID", { month: "short", year: "2-digit" });
  const trend = summary.trend.map((m: any) => ({ ...m, month: monthFmt.format(new Date(`${m.month}-15T00:00:00Z`)) }));

  return (
    <>
      <PageHeader
        eyebrow="Label Spelling"
        title={t("Halo, {name}", { name: user.name.split(" ")[0] })}
        description={t("Draft label diperiksa otomatis (text layer + OCR lokal), direview checker, lalu disetujui bertingkat sesuai rute approval.")}
        actions={meta.can("label.edit") && <LinkButton href="/labels/new" primary icon={Plus}>{t("Label baru")}</LinkButton>}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label={t("Total label")} value={tot.labels} hint={t("{n} sudah approved", { n: tot.approved })} href="/labels" />
        <StatTile label={t("Menunggu approval")} value={waiting} hint={summary.overdue.length ? t("{n} melewati SLA", { n: summary.overdue.length }) : t("Semua sesuai SLA")} href="/labels?scope=tasks" />
        <StatTile label={t("Lolos tanpa revisi")} value={tot.approved ? `${Math.round((tot.first_pass / tot.approved) * 100)}%` : "–"} hint={t("{a} dari {b} label approved", { a: tot.first_pass, b: tot.approved })} />
        <StatTile label={t("Rata-rata temuan per label")} value={tot.versions ? (tot.findings / tot.versions).toFixed(1) : "–"} hint={t("pada versi terbaru")} />
      </div>
      {/* One strip instead of seven loose cards: cells share hairlines (gap-px over the line colour); the last cell fills the odd row on narrow screens. */}
      <div className="card mb-6 grid grid-cols-2 gap-px overflow-hidden bg-slate-200 sm:grid-cols-4 xl:grid-cols-7">
        {states.map((st) => (
          <Link key={st.code} href={`/labels?status=${st.code}`} className="flex flex-col-reverse justify-end gap-1 bg-white px-5 py-4 transition-colors last:col-span-2 hover:bg-slate-50 xl:last:col-span-1">
            <span className="flex items-baseline gap-2 text-xs font-medium leading-snug text-slate-500">
              <span className={`size-2 shrink-0 rounded-full ${toneDot(st.tone)}`} aria-hidden />
              {st.name}
            </span>
            <span className={`num block text-[26px] font-semibold leading-9 ${count(st.code) ? "text-slate-900" : "text-slate-300"}`}>{count(st.code)}</span>
          </Link>
        ))}
      </div>
      <div className="mb-0 grid items-start gap-x-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title={t("Tren {n} bulan terakhir", { n: trend.length })} description={t("Versi artwork yang diunggah dan label yang selesai di-approve per bulan.")}>
            <TrendChart data={trend} labels={{ uploaded: t("Versi diunggah"), approved: t("Label approved"), month: t("Bulan") }} />
          </Section>
        </div>
        <Section title={t("Temuan per jenis pengecekan")} description={t("Pada versi terbaru setiap label.")} flush>
          <BarList empty={t("Belum ada temuan")} rows={summary.findingTypes.map((f: any) => ({ key: f.check_type, label: meta.name("check_types", f.check_type), value: f.n }))} />
        </Section>
        <Section title={t("Label per negara tujuan")} flush>
          <BarList empty={t("Belum ada label")} rows={summary.byCountry.map((c: any) => ({ key: c.name, label: c.name, value: c.n }))} />
        </Section>
        <Section title={t("Rata-rata lama approval per tahap")} description={t("Hari dari tahap dimulai sampai diputuskan. Garis = SLA.")} flush>
          <BarList
            empty={t("Belum ada tahap yang selesai")}
            rows={summary.stepTimes.map((st: any) => ({
              key: st.name,
              label: t(st.name),
              value: st.days,
              marker: st.sla,
              text: t("{n} hari", { n: st.days }),
              note: (
                <span className="flex items-center gap-1">
                  {st.days > st.sla && <AlertTriangle className="size-3.5 text-amber-600" aria-hidden />}
                  {t(st.days > st.sla ? "Lebih lama dari SLA {sla} hari · {n} keputusan" : "SLA {sla} hari · {n} keputusan", { sla: st.sla, n: st.n })}
                </span>
              ),
            }))}
          />
        </Section>
        <div>
          <Section title={t("Melewati SLA")} description={t("Tahap approval yang menunggu lebih lama dari SLA rutenya.")} flush>
            {summary.overdue.length ? (
              <ul className="divide-y divide-slate-100">
                {summary.overdue.map((o: any) => (
                  <li key={o.id}>
                    <Link href={`/labels/${o.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900">{o.name}</span>
                        <span className="block text-xs text-slate-500">{t(o.step_name)}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium text-rose-700"><Clock className="size-3.5" aria-hidden />{t("{n} hari", { n: o.days })}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2.5 px-5 py-4 text-sm text-slate-500"><Clock className="size-4 text-emerald-600" aria-hidden />{t("Semua sesuai SLA")}</p>
            )}
          </Section>
        </div>
        <div className="lg:col-span-3">
        <Section title={t("Menunggu keputusan Anda")} description={t("Label di tahap approval yang menjadi tugas Anda.")} flush actions={<Link className="btn btn-sm" href="/labels?scope=tasks">{t("Semua")}</Link>}>
          {tasks.data.length ? (
            <ul className="divide-y divide-slate-100">
              {tasks.data.map((l) => (
                <li key={l.id}>
                  <Link href={`/labels/${l.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">{l.name}</span>
                      <span className="code block">{l.code} · v{l.current_version}</span>
                    </span>
                    <StatusBadge status={l.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Inbox} title={t("Antrian kosong")} description={t("Tidak ada label yang menunggu persetujuan Anda.")} />
          )}
        </Section>
        </div>
      </div>
    </>
  );
}
