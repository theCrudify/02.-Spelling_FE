import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { getLang, getT } from "@/lib/lang";
import { getMeta } from "@/lib/meta";
import type { Row } from "@/lib/services/types";
import { StatusBadge } from "./status-badge";
import { fmtDateTime, timeAgo, toneChip } from "./ui";

/** Approval timeline. */
export async function HistoryTimeline({ items }: { items: Row[] }) {
  const [t, lang, meta] = [await getT(), await getLang(), await getMeta()];
  if (!items.length) return <p className="text-sm text-ink-3">{t("Belum ada riwayat.")}</p>;
  return (
    <ol className="space-y-0">
      {items.map((h, i) => {
        const a = meta.get("history_actions", h.action); // label, icon and colour are master data
        return (
          <li key={h.id} className="relative flex gap-4 pb-6 last:pb-0">
            {i < items.length - 1 && <span className="absolute left-4 top-9 -bottom-0 w-px bg-line" aria-hidden />}
            <span className={`relative z-[1] grid size-8 shrink-0 place-items-center rounded-full ${toneChip(a?.tone)}`}>
              <DynamicIcon name={(a?.icon ?? "circle") as IconName} className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-[13px] text-ink">
                  <span className="font-semibold">{h.user_name}</span> <span className="text-ink-3">({t(h.role_name ?? h.role)})</span> {(a?.name ?? h.action).toLowerCase()}{h.step_no ? t(" (tahap {n})", { n: h.step_no }) : ""}
                </p>
                <StatusBadge status={h.to_status} />
              </div>
              <time className="text-xs text-ink-3" dateTime={h.created_at} title={fmtDateTime(h.created_at, lang)}>
                {fmtDateTime(h.created_at, lang)} · {timeAgo(h.created_at, lang)}
              </time>
              {h.signed && <span className="ml-1.5 text-xs font-medium text-emerald-700">· {t("ditandatangani elektronik")}</span>}
              {h.note && <p className="mt-2 rounded-md border border-line bg-paper px-3 py-2 text-[13px] text-ink-2">{h.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
