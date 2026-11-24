"use client";

import { useMeta } from "./meta-context";
import { Badge, toneDot } from "./ui";

/** Workflow status with its configured name and colour (workflow_states). */
export function StatusBadge({ status }: { status: string }) {
  const s = useMeta().state(status);
  return (
    <Badge tone={s?.tone ?? "neutral"} title={s?.name}>
      {s?.name ?? status}
    </Badge>
  );
}

export function StatusDot({ status }: { status: string }) {
  const s = useMeta().state(status);
  return <span className={`size-1.5 rounded-full ${toneDot(s?.tone)}`} aria-hidden />;
}

/** Name of a master row by code, for client components. */
export function MasterName({ table, code }: { table: string; code?: string | null }) {
  return <>{useMeta().name(table, code)}</>;
}
