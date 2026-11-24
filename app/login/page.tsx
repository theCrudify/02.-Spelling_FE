import { Building2, CheckCircle2, ClipboardCheck, FileBadge2, ShieldCheck, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LangToggle } from "@/components/lang-toggle";
import { getT } from "@/lib/lang";
import { getUser } from "@/lib/session";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Masuk"), description: t("Pemeriksaan teks label kemasan PT Amerta Indah Otsuka") };
}

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: "Approval Bertingkat per Rute",
    text: "Rute approval dipetakan per negara, brand, tipe label, dan plant, lalu dikunci saat diajukan.",
  },
  {
    icon: ShieldCheck,
    title: "Cek Otomatis vs Teks Master",
    text: "Teks artwork dibandingkan dengan teks master: salah ketik, angka, dan kalimat hilang langsung ditandai di gambar.",
  },
  {
    icon: FileBadge2,
    title: "OCR Lokal, Semua Bahasa",
    text: "OCR berjalan di server internal untuk semua bahasa. Tidak ada artwork yang keluar perusahaan.",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string; next?: string }>;
}) {
  if (await getUser()) redirect("/");
  const { expired, next } = await searchParams;
  const t = await getT();

  // Demo shortcuts only when the server is configured for them (never set these on a real deployment).
  const accounts = (process.env.DEMO_ACCOUNTS ?? "").split(",").map((a) => a.trim()).filter(Boolean);
  const demo = accounts.length && process.env.DEMO_PASSWORD ? { accounts, password: process.env.DEMO_PASSWORD } : undefined;
  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center">
      <div className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
        {/* Left Hero Section (Enterprise Brand Showcase) */}
        <section className="on-dark relative hidden overflow-hidden bg-gradient-to-br from-[#083b27] via-[#0b5236] to-[#042015] px-14 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          {/* Subtle Ambient Glows */}
          <div
            className="pointer-events-none absolute -right-24 -top-24 size-[32rem] rounded-full bg-emerald-400/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-24 bottom-10 size-[28rem] rounded-full bg-emerald-500/10 blur-3xl"
            aria-hidden
          />

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <span
                className="grid size-11 place-items-center rounded-xl bg-white/10 text-base font-black text-emerald-300 shadow-inner ring-1 ring-white/20 backdrop-blur-md"
                aria-hidden
              >
                Aa✓
              </span>
              <div>
                <span className="block text-base font-bold tracking-tight text-white">Label Spelling</span>
                <span className="block text-xs font-medium text-emerald-200/80">PT Amerta Indah Otsuka</span>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200 backdrop-blur-sm">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              {t("Pemeriksaan Teks Label Kemasan")}
            </div>
          </div>

          {/* Center Pitch */}
          <div className="relative z-10 my-auto max-w-lg py-8">
            <div className="inline-flex items-center gap-2 rounded-md bg-white/[0.08] px-2.5 py-1 text-xs font-medium text-emerald-200 ring-1 ring-white/10 mb-4">
              <Sparkles className="size-3.5 text-emerald-300" />
              {t("Draft label → cek otomatis → approval")}
            </div>
            <h1 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight text-white">
              {t("Satu tempat untuk memeriksa label kemasan semua negara.")}
            </h1>
            <p className="mt-3 text-sm text-emerald-100/70 leading-relaxed">
              {t("Unggah PDF, AI, JPG, PNG, TIFF, PSD, atau EPS. Mesin membaca teks, mencocokkan dengan teks master dan glossary, lalu label disetujui bertingkat sesuai rute.")}
            </p>

            {/* Feature Cards */}
            <div className="mt-8 space-y-3.5">
              {FEATURES.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm transition-colors hover:bg-white/[0.07]"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/20">
                    <item.icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-white">{t(item.title)}</h2>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-emerald-100/65">{t(item.text)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Compliance Footer */}
          <div className="relative z-10 border-t border-white/10 pt-4">
            <p className="text-[11px] text-emerald-200/50 leading-relaxed">
              {t("Sesuai amanat UU No. 33/2014 jo. UU No. 6/2023, PP No. 42/2024 jo. PP No. 40/2026, dan Keputusan Kepala BPJPH No. 20/2023 tentang Kriteria SJPH.")}
            </p>
          </div>
        </section>

        {/* Right Authentication Panel */}
        <main className="flex items-center justify-center bg-paper px-6 py-12 lg:px-14">
          <div className="w-full max-w-md">
            {/* Mobile Header (Only visible on small screens) */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <span className="grid size-10 place-items-center rounded-lg bg-emerald-700 text-sm font-black text-white">
                Aa✓
              </span>
              <div>
                <span className="block text-base font-bold text-ink">Label Spelling Otsuka</span>
                <span className="block text-xs text-ink-3">{t("Pemeriksaan Teks Label Kemasan")}</span>
              </div>
            </div>

            {/* Main Auth Card */}
            <div className="rounded-2xl border border-line bg-surface p-7 sm:p-9 shadow-sm shadow-emerald-950/5">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-ink">{t("Selamat Datang")}</h2>
                <p className="mt-1 text-xs text-ink-3">
                  {t("Masuk ke sistem atau gunakan bypass akun master di bawah ini.")}
                </p>
              </div>

              {expired && (
                <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900" role="status">
                  <p className="font-semibold">{t("Sesi Telah Kedaluwarsa")}</p>
                  <p className="mt-0.5 text-amber-700">{t("Waktu sesi Anda telah habis. Silakan masuk kembali.")}</p>
                </div>
              )}

              <LoginForm next={typeof next === "string" ? next : "/"} demo={demo} />
            </div>

            {/* Footer Note */}
            <div className="mt-6 text-center text-[11px] text-ink-3 space-y-1">
              <p>PT Amerta Indah Otsuka · Sukabumi & Kejayan Plants</p>
              <p>{t("Kendala akses? Hubungi Tim IT / Regulatory.")}</p>
              <div className="flex justify-center pt-2">
                <LangToggle />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
