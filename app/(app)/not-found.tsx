import { SearchX } from "lucide-react";
import Link from "next/link";
import { getT } from "@/lib/lang";

/** Rendered inside the app shell for missing records or records outside the user's access. */
export default async function NotFound() {
  const t = await getT();
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-paper-2 text-ink-3">
        <SearchX className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-ink">{t("Data tidak ditemukan")}</h1>
      <p className="mt-1.5 text-sm text-ink-2">{t("Data mungkin sudah dihapus, atau berada di luar akses site / role Anda.")}</p>
      <Link href="/" className="btn btn-primary mt-6">{t("Kembali ke dashboard")}</Link>
    </div>
  );
}
