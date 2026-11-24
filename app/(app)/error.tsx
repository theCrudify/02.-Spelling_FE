"use client";

import { AlertOctagon, RotateCw } from "lucide-react";
import Link from "next/link";
import { useT } from "@/components/lang-context";

/** Unexpected errors only (missing records go to not-found). Detail stays in the server log; the digest helps support. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-red-600">
        <AlertOctagon className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-ink">
        {t("Terjadi kesalahan")}
      </h1>
      <p className="mt-1.5 text-sm text-ink-2">
        {t("Halaman gagal dimuat. Coba lagi, atau hubungi admin bila masalah berlanjut.")}
      </p>
      {error.digest && <p className="mt-3 font-mono text-xs text-ink-3">{t("Kode")}: {error.digest}</p>}
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/" className="btn">{t("Ke dashboard")}</Link>
        <button className="btn btn-primary" onClick={reset}>
          <RotateCw aria-hidden /> {t("Coba lagi")}
        </button>
      </div>
    </div>
  );
}
