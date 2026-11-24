"use client";

import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { submitForm, type FormState, type FormTarget } from "@/app/actions";
import { useT } from "./lang-context";

export type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "date" | "textarea" | "select" | "file" | "checkbox" | "checkboxes" | "hidden";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  wide?: boolean; // full row
  accept?: string;
  section?: string; // starts a new titled group
  sectionHint?: string;
};
type Values = Record<string, unknown>;

const asList = (v: unknown) => (Array.isArray(v) ? v.map(String) : typeof v === "string" && v ? v.split(",").map((s) => s.trim()) : []);

/** Config-driven form posting FormData to a server action. Backend field errors appear next to each field and in a summary. */
export function EntityForm({
  fields,
  target,
  defaults = {},
  submitLabel,
  danger,
  columns = 2,
  stickyActions,
  secondaryAction,
  quiet,
}: {
  fields: FieldSpec[];
  target: FormTarget;
  defaults?: Values;
  submitLabel?: string;
  danger?: boolean;
  columns?: 1 | 2 | 3;
  stickyActions?: boolean;
  secondaryAction?: React.ReactNode;
  quiet?: boolean; // secondary action: plain button, no primary colour
}) {
  const t = useT();
  const [state, action, pending] = useActionState<FormState, FormData>(submitForm.bind(null, target), {});
  const values: Values = { ...defaults, ...state.values };
  const grid = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3" }[columns];
  const summaryRef = useRef<HTMLDivElement>(null);
  const errorFields = fields.filter((f) => state.errors?.[f.name]);

  // Move focus to the summary after a failed submit so screen readers and keyboard users land on it.
  useEffect(() => {
    if (state.ok === false) summaryRef.current?.focus();
  }, [state]);

  // Split into sections (a field with `section` starts a new one).
  const sections: { title?: string; hint?: string; fields: FieldSpec[] }[] = [];
  for (const f of fields) {
    if (f.section || !sections.length) sections.push({ title: f.section, hint: f.sectionHint, fields: [] });
    sections[sections.length - 1].fields.push(f);
  }

  return (
    <form action={action} noValidate>
      {state.message && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role={state.ok ? "status" : "alert"}
          className={`mb-5 flex gap-3 rounded-lg border px-4 py-3 text-sm outline-none ${state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}
        >
          {state.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}
          <div>
            <p className="font-medium">{t(state.message)}</p>
            {errorFields.length > 0 && (
              <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                {errorFields.map((f) => (
                  <li key={f.name}>
                    <a href={`#field-${f.name}`} className="underline underline-offset-2 hover:no-underline">
                      {f.label}: {t(state.errors![f.name][0])}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {sections.map((s, i) => (
          <fieldset key={i} className={s.title ? "border-t border-line pt-6 first:border-0 first:pt-0" : ""}>
            {s.title && (
              <legend className="contents">
                <span className="block text-sm font-semibold text-ink">{s.title}</span>
                {s.hint && <span className="mt-0.5 block text-sm text-ink-3">{s.hint}</span>}
              </legend>
            )}
            <div className={`grid gap-x-5 gap-y-5 ${grid} ${s.title ? "mt-4" : ""}`}>
              {s.fields.map((f) => (
                <Field key={f.name} field={f} value={values[f.name]} error={state.errors?.[f.name]?.[0] && t(state.errors[f.name][0])} />
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className={`${fields.some((f) => f.type !== "hidden") ? "mt-5" : ""} flex items-center justify-end gap-3 ${stickyActions ? "sticky bottom-0 -mx-5 -mb-5 rounded-b-xl border-t border-line bg-white/95 px-5 py-4 backdrop-blur" : ""}`}>
        {fields.some((f) => f.required) && <p className="mr-auto text-xs text-ink-3"><span className="text-red-600">*</span> {t("wajib diisi")}</p>}
        {secondaryAction}
        <button type="submit" className={`btn ${quiet ? "" : danger ? "btn-danger" : "btn-primary"} min-w-28`} disabled={pending} aria-busy={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {pending ? t("Memproses…") : (submitLabel ?? t("Simpan"))}
        </button>
      </div>
    </form>
  );
}

function FileInput({ id, name, accept, describedBy, invalid }: { id: string; name: string; accept?: string; describedBy?: string; invalid: boolean }) {
  const t = useT();
  const [file, setFile] = useState<string>();
  return (
    <label
      htmlFor={id}
      className={`flex h-9 cursor-pointer items-center gap-2.5 rounded-lg border border-dashed px-3 text-sm transition-colors hover:border-brand-600 hover:bg-brand-50/40 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-brand-100 ${invalid ? "border-red-400" : "border-line-2"}`}
    >
      <Upload className="size-4 shrink-0 text-ink-3" aria-hidden />
      <span className={`truncate ${file ? "text-ink" : "text-ink-3"}`}>{file ?? t("Pilih file")}</span>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept ?? ".pdf,.png,.jpg,.jpeg"}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        className="sr-only"
        onChange={(e) => setFile(e.target.files?.[0]?.name)}
      />
    </label>
  );
}

function Field({ field: f, value, error }: { field: FieldSpec; value: unknown; error?: string }) {
  const t = useT();
  const id = `field-${f.name}`;
  if (f.type === "hidden") return <input type="hidden" name={f.name} value={String(value ?? "")} />;
  const str = value == null ? "" : String(value);
  const describedBy = [error && `${id}-error`, f.hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  const common = { id, name: f.name, "aria-invalid": !!error, "aria-describedby": describedBy, "aria-required": f.required, className: "input" };

  let control;
  switch (f.type) {
    case "textarea":
      control = <textarea {...common} rows={3} defaultValue={str} placeholder={f.placeholder} />;
      break;
    case "select":
      control = (
        <select {...common} defaultValue={str}>
          <option value="">{f.required ? t("Pilih…") : "—"}</option>
          {f.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
      break;
    case "checkbox":
      control = (
        <label className="flex h-9 items-center gap-2.5 text-sm text-ink-2">
          <input type="checkbox" name={f.name} id={id} value="true" defaultChecked={value === true || value === "true"} className="size-4 rounded accent-brand-700" />
          {f.placeholder ?? t("Ya")}
        </label>
      );
      break;
    case "checkboxes": {
      const selected = asList(value);
      return (
        <fieldset className={f.wide ? "sm:col-span-full" : ""} aria-describedby={describedBy}>
          <legend className="label">{f.label}</legend>
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-lg border border-line bg-paper/50 p-3.5 sm:grid-cols-2 lg:grid-cols-3" id={id}>
            {f.options?.map((o) => (
              <label key={o.value} className="flex items-center gap-2.5 text-sm text-ink-2">
                <input type="checkbox" name={f.name} value={o.value} defaultChecked={selected.includes(o.value)} className="size-4 rounded accent-brand-700" />
                {o.label}
              </label>
            ))}
          </div>
          {f.hint && <p id={`${id}-hint`} className="hint">{f.hint}</p>}
        </fieldset>
      );
    }
    case "file":
      control = <FileInput id={id} name={f.name} accept={f.accept} describedBy={describedBy} invalid={!!error} />;
      break;
    default:
      control = <input {...common} type={f.type ?? "text"} defaultValue={str} placeholder={f.placeholder} autoComplete={f.type === "password" ? "new-password" : undefined} />;
  }

  return (
    <div className={f.wide ? "sm:col-span-full" : ""}>
      <label className="label" htmlFor={id}>
        {f.label}
        {f.required && <span className="ml-0.5 text-red-600" aria-hidden>*</span>}
      </label>
      {control}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1 text-xs font-medium text-red-600">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      {f.hint && <p id={`${id}-hint`} className="hint">{f.hint}</p>}
    </div>
  );
}
