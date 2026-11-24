import "server-only";
import { cache } from "react";
import { translate } from "./i18n";
import { getLang } from "./lang";
import { Meta, parseValues, type MasterRow, type RawMeta } from "./meta-model";
import { getServices } from "./services/services";

/** Database-driven names (menus, master rows, list columns & filters, permissions) go through the same dictionary as UI text. */
function localize(raw: RawMeta): RawMeta {
  const t = (s: string) => translate("en", s);
  const row = (r: MasterRow) => ({ ...r, name: t(r.name), ...(r.group_name && { group_name: t(r.group_name) }) });
  const each = <V,>(o: Record<string, V>, f: (v: V) => V) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v)]));
  return {
    ...raw,
    masters: each(raw.masters, (rows) => rows.map(row)),
    menu: raw.menu.map(row),
    permissions: each(raw.permissions, t),
    lists: each(raw.lists, (fields) =>
      fields.map((f) => ({
        ...f,
        label: t(f.label),
        null_label: f.null_label && t(f.null_label),
        filter_source: f.filter_type === "values" ? parseValues(f.filter_source).map((o) => `${o.value}:${t(o.label)}`).join("|") : f.filter_source,
      })),
    ),
  };
}

/** Configuration from the database, fetched once per request (in the UI language). */
export const getMeta = cache(async () => {
  const raw = await (await getServices()).api.request<RawMeta>("/meta");
  return new Meta((await getLang()) === "en" ? localize(raw) : raw);
});
