"use client";

import { useT } from "@/components/lang-context";

/** Skeleton shown instantly on navigation while the server fetches data. */
export default function Loading() {
  const t = useT();
  return (
    <div aria-busy="true" aria-label={t("Memuat halaman")}>
      <div className="skeleton mb-2 h-7 w-72" />
      <div className="skeleton mb-6 h-4 w-[28rem] max-w-full" />
      <div className="card mb-4 flex flex-wrap gap-3 p-4">
        <div className="skeleton h-9 min-w-64 flex-1" />
        <div className="skeleton h-9 w-44" />
        <div className="skeleton h-9 w-44" />
      </div>
      <div className="card overflow-hidden">
        <div className="h-10 border-b border-line bg-paper" />
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex gap-6 border-b border-line px-4 py-4">
            <div className="skeleton h-4 w-1/4" />
            <div className="skeleton h-4 w-1/6" />
            <div className="skeleton h-4 w-1/5" />
            <div className="skeleton h-4 w-1/6" />
          </div>
        ))}
      </div>
    </div>
  );
}
