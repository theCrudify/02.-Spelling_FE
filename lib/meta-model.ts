// Isomorphic helpers over the /api/meta payload. Every option, label, colour, list column, filter, menu and
// permission in the UI comes from here, i.e. from the database.

export type MasterRow = { id: number; code: string; name: string; sort_order: number; is_active: boolean } & Record<string, any>
export type ListField = {
  id: number
  resource: string
  key: string
  label: string
  column_ref: string
  show_in_table: boolean
  sortable: boolean
  filter_type: "master" | "relation" | "site" | "values" | "year" | null
  filter_source: string | null
  null_label: string | null
  filter_primary: boolean
  sort_order: number
}
export type RawMeta = {
  masters: Record<string, MasterRow[]>
  lists: Record<string, ListField[]>
  relations: Record<string, { value: string; label: string }[]>
  settings: Record<string, string>
  permissions: Record<string, string>
  me: { role: string; site: string | null; permissions: string[] }
  menu: MasterRow[]
  shortcuts: { site: string; category: string | null; total: number }[]
}
export type Option = { value: string; label: string }
export type FilterDef = { name: string; label: string; options: Option[]; primary: boolean }

/** Parses 'value:Label|value:Label' (list_fields.filter_source for 'values' filters). */
export const parseValues = (source?: string | null): Option[] =>
  (source ?? "")
    .split("|")
    .filter(Boolean)
    .map((p) => {
      const [value, ...rest] = p.split(":")
      return { value, label: rest.join(":") || value }
    })

export class Meta {
  constructor(readonly raw: RawMeta) {}

  all(table: string) {
    return this.raw.masters[table] ?? []
  }
  active(table: string) {
    return this.all(table).filter((r) => r.is_active)
  }
  get(table: string, code?: string | null) {
    return code ? this.all(table).find((r) => r.code === code) : undefined
  }
  name(table: string, code?: string | null) {
    return this.get(table, code)?.name ?? code ?? ""
  }
  /** Active rows as select options (value = code). */
  options(table: string): Option[] {
    if (table === "plants") return this.plantOptions()
    return this.active(table).map((r) => ({ value: r.code, label: r.name }))
  }
  setting(key: string, fallback = "") {
    return this.raw.settings[key] ?? fallback
  }

  // ---- permissions & scope
  can(permission: string) {
    return this.raw.me.permissions.includes("admin") || this.raw.me.permissions.includes(permission)
  }
  /** Plants the user may pick (their site only, unless they cover all sites). */
  plantOptions(): Option[] {
    const site = this.raw.me.site
    return this.active("plants")
      .filter((p) => !site || p.site_code === site)
      .map((p) => ({ value: p.code, label: `${p.code} · ${p.name}` }))
  }
  plantLabel(code?: string | null) {
    const p = this.get("plants", code)
    return p ? `${p.code} · ${p.name}` : (code ?? "-")
  }

  // ---- label status (kinds are fixed: draft, processing, review, approval, approved, revision, rejected)
  state(code?: string | null) {
    return this.get("workflow_states", code)
  }
  kindOf(code?: string | null) {
    return this.state(code)?.kind as string | undefined
  }

  // ---- lists
  fields(resource: string) {
    return [...(this.raw.lists[resource] ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  }
  columns(resource: string) {
    return this.fields(resource).filter((f) => f.show_in_table)
  }
  /** Filter controls of a list, built from list_fields. */
  filters(resource: string): FilterDef[] {
    const year = new Date().getFullYear()
    const span = Number(this.setting("filter_year_span", "4"))
    return this.fields(resource)
      .filter((f) => f.filter_type)
      .map((f) => {
        let options: Option[] = []
        switch (f.filter_type) {
          case "master":
            options = this.options(f.filter_source ?? "")
            break
          case "relation":
            options = this.raw.relations[f.filter_source ?? ""] ?? []
            break
          case "site":
            options = this.active("sites")
              .filter((s) => !this.raw.me.site || s.code === this.raw.me.site)
              .map((s) => ({ value: s.code, label: s.name }))
            break
          case "values":
            options = parseValues(f.filter_source)
            break
          case "year":
            options = Array.from({ length: span }, (_, i) => ({ value: String(year - i), label: String(year - i) }))
        }
        if (f.null_label) options = [...options, { value: "__none", label: f.null_label }]
        return { name: f.key, label: f.label, options, primary: f.filter_primary }
      })
      .filter((f) => f.options.length > 0)
  }
}
