"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Meta, type RawMeta } from "@/lib/meta-model";

const Ctx = createContext<RawMeta | null>(null);

/** Gives client components the same database configuration the server rendered with. */
export function MetaProvider({ value, children }: { value: RawMeta; children: ReactNode }) {
  return <Ctx value={value}>{children}</Ctx>;
}

export function useMeta() {
  const raw = useContext(Ctx);
  if (!raw) throw new Error("useMeta must be used inside MetaProvider");
  return useMemo(() => new Meta(raw), [raw]);
}
