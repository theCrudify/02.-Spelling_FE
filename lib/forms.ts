import type { FieldSpec } from "@/components/entity-form";
import type { T } from "./i18n";
import type { Meta } from "./meta-model";
import type { Option as IdOption } from "./services/types";

// Form field configs. Every option list comes from master data (meta) or relation tables (id options) — none is in code.

export const fromIds = (list: IdOption[], withCode = false) => list.map((o) => ({ value: String(o.id), label: withCode ? `${o.code} · ${o.name}` : o.name }));

export const ARTWORK_ACCEPT = (meta: Meta) =>
  meta
    .active("file_types") // allowed artwork formats are master data (code = extension)
    .map((f) => `.${f.code}`)
    .join(",");

export const labelFields = (meta: Meta, r: { products: IdOption[]; countries: IdOption[] }, t: T): FieldSpec[] => [
  { name: "code", label: t("Kode label"), required: true, placeholder: "LBL-PCS500-ID-PRI", section: t("Identitas label"), sectionHint: t("1 label = 1 SKU × negara × tipe kemasan") },
  { name: "name", label: t("Nama label"), required: true },
  { name: "product_id", label: t("Produk / SKU"), type: "select", required: true, options: fromIds(r.products, true) },
  { name: "country_id", label: t("Negara tujuan"), type: "select", required: true, options: fromIds(r.countries, true), hint: t("Menentukan teks master, elemen wajib, dan rute approval") },
  { name: "label_type", label: t("Tipe label"), type: "select", required: true, options: meta.options("label_types") },
  { name: "plant", label: "Plant", type: "select", required: true, options: meta.plantOptions() },
  { name: "languages", label: t("Bahasa di label"), type: "checkboxes", required: true, wide: true, options: meta.options("languages"), hint: t("Menentukan model OCR dan kamus yang dipakai") },
  ...versionFields(meta, t, t("Artwork versi 1")),
];

export const versionFields = (meta: Meta, t: T, section = "Artwork"): FieldSpec[] => [
  {
    name: "file",
    label: t("File artwork"),
    type: "file",
    required: true,
    accept: ARTWORK_ACCEPT(meta),
    wide: true,
    section,
    sectionHint: t(`PDF / AI (simpan "PDF compatible") paling akurat karena teks dibaca langsung. JPG/PNG/TIFF/PSD/EPS dibaca dengan OCR lokal. Maks {mb} MB.`, { mb: meta.setting("file_max_mb", "200") }),
  },
  { name: "note", label: t("Catatan versi (opsional)"), type: "textarea", wide: true },
];

export const userFields = (meta: Meta, departments: IdOption[], isEdit: boolean, t: T): FieldSpec[] => [
  { name: "employee_code", label: t("NIK"), required: true },
  { name: "name", label: t("Nama"), required: true },
  { name: "email", label: "Email", type: "email" },
  { name: "role", label: "Role", type: "select", required: true, options: meta.options("roles") },
  { name: "department_id", label: t("Departemen"), type: "select", options: fromIds(departments) },
  { name: "site", label: "Site", type: "select", options: meta.options("sites"), hint: t("Kosongkan untuk akses semua site") },
  { name: "password", label: isEdit ? t("Password baru") : "Password", type: "password", required: !isEdit, hint: t(isEdit ? "Kosongkan jika tidak diganti" : "Minimal 8 karakter") },
  { name: "is_active", label: "Status", type: "checkbox", placeholder: t("Aktif") },
];
