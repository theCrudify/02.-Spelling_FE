"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { deleteItem } from "@/app/actions";
import { useT } from "./lang-context";

type Resource = Parameters<typeof deleteItem>[0];

/** Delete with a real confirmation dialog that names what will be removed. */
export function DeleteButton({ resource, id, redirectTo, label, itemName, path }: { resource: Resource; id: number; redirectTo: string; label?: string; itemName?: string; path?: string }) {
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <>
      <button type="button" className="btn btn-danger-ghost" onClick={() => dialog.current?.showModal()}>
        <Trash2 aria-hidden /> {label ?? t("Hapus")}
      </button>
      <dialog
        ref={dialog}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-line p-0 shadow-2xl backdrop:bg-slate-950/40 backdrop:backdrop-blur-[2px]"
        aria-labelledby={`del-${id}-title`}
        onClose={() => setError(undefined)}
      >
        <div className="flex gap-4 p-6">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <div>
            <h2 id={`del-${id}-title`} className="text-base font-semibold text-ink">{t("Hapus {what}?", { what: itemName ? `“${itemName}”` : t("data ini") })}</h2>
            <p className="mt-1.5 text-sm text-ink-2">{t("Data dihapus dari daftar. Data yang masih dipakai data lain tidak bisa dihapus — nonaktifkan saja.")}</p>
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{t(error)}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 rounded-b-xl border-t border-line bg-paper px-6 py-3.5">
          <button type="button" className="btn" onClick={() => dialog.current?.close()} autoFocus>
            {t("Batal")}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={pending}
            onClick={() => start(async () => setError((await deleteItem(resource, id, redirectTo, path))?.message))}
          >
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {t("Ya, hapus")}
          </button>
        </div>
      </dialog>
    </>
  );
}
