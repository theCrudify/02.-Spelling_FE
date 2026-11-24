import { Compass } from "lucide-react";
import Link from "next/link";
import { getT } from "@/lib/lang";

export default async function NotFound() {
  const t = await getT();
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-paper-2 text-ink-3">
          <Compass className="size-6" aria-hidden />
        </span>
        <p className="mt-4 text-sm font-semibold text-brand-700">404</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">{t("Halaman tidak ditemukan")}</h1>
        <p className="mt-2 text-sm text-ink-2">{t("Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.")}</p>
        <Link href="/" className="btn btn-primary mt-6">{t("Kembali ke dashboard")}</Link>
      </div>
    </div>
  );
}
