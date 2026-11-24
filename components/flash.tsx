"use client";

import { CheckCircle2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "./lang-context";

/** One-shot toast from a `?ok=` message set by a redirect after an action; the param is removed right away. */
export function Flash() {
  const t = useT();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const ok = params.get("ok");
    if (!ok) return;
    setMsg(ok);
    const q = new URLSearchParams(params.toString());
    q.delete("ok");
    router.replace(q.size ? `${pathname}?${q}` : pathname, { scroll: false });
    const t = setTimeout(() => setMsg(null), 5000);
    return () => clearTimeout(t);
  }, [params, pathname, router]);

  if (!msg) return null;
  return (
    <div role="status" className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-ink py-2.5 pl-3.5 pr-2 text-[13px] text-white shadow-[0_12px_32px_-8px_rgba(23,25,28,0.5)]">
      <CheckCircle2 className="size-4 text-emerald-400" aria-hidden />
      {t(msg)}
      <button onClick={() => setMsg(null)} className="ml-2 grid size-6 place-items-center rounded text-white/60 hover:bg-white/10 hover:text-white" aria-label={t("Tutup")}>
        <X className="size-3.5" />
      </button>
    </div>
  );
}
