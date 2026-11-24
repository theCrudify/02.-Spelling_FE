"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/api-client";
import { getServices, type Services } from "@/lib/services/services";
import { setSession } from "@/lib/session";

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  values?: Record<string, string | string[]>; // echoed back so a failed submit keeps the user's input
};

type Resource = Exclude<keyof Services, "api" | "auth" | "resource">;
export type FormTarget = {
  resource: Resource | "auth" | "path"; // "path": generic CRUD resource at `path` (admin pages)
  path?: string;
  op: "create" | "update" | "import" | "labelAction" | "changePassword";
  id?: number;
  action?: string; // labelAction: path after /labels/:id/ (versions, submit, approve, revision, reject, recheck, findings/:fid)
  redirectTo?: string; // ":id" is replaced by the created / updated id
  success?: string;
};

/** Drops Next's internal $ACTION fields and empty file inputs. */
function clean(fd: FormData) {
  const out = new FormData();
  for (const [k, v] of fd.entries()) {
    if (k.startsWith("$")) continue;
    if (v instanceof File && v.size === 0) continue;
    out.append(k, v);
  }
  return out;
}

function echo(fd: FormData) {
  const values: Record<string, string | string[]> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v !== "string" || k.startsWith("$") || k.includes("password")) continue;
    const prev = values[k];
    values[k] = prev === undefined ? v : [...(Array.isArray(prev) ? prev : [prev]), v];
  }
  return values;
}

async function dispatch(s: Services, t: FormTarget, body: FormData): Promise<{ id?: number } | unknown> {
  const id = t.id!;
  if (t.resource === "auth") return s.auth.changePassword(body);
  const crud = t.resource === "path" ? s.resource(t.path!) : s[t.resource];
  switch (t.op) {
    case "create":
      return crud.create(body);
    case "update":
      return crud.update(id, body);
    case "import":
      return crud.import(body);
    case "labelAction":
      return s.labels.action(id, t.action!, body);
  }
}

export async function submitForm(target: FormTarget, _prev: FormState, fd: FormData): Promise<FormState> {
  let result: unknown;
  try {
    result = await dispatch(await getServices(), target, clean(fd));
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, message: e.message, errors: e.errors, values: echo(fd) };
    throw e;
  }
  revalidatePath("/", "layout");
  if (target.redirectTo) {
    const newId = (result as { id?: number } | undefined)?.id ?? target.id ?? "";
    redirect(target.redirectTo.replace(":id", String(newId)));
  }
  return { ok: true, message: target.success ?? "Berhasil disimpan" };
}

export async function deleteItem(resource: Resource | "path", id: number, redirectTo: string, path?: string) {
  const s = await getServices();
  try {
    await (resource === "path" ? s.resource(path!) : s[resource]).remove(id);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, message: e.message };
    throw e;
  }
  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const employee_code = String(fd.get("employee_code") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  if (!employee_code || !password) return { ok: false, message: "NIK dan password wajib diisi", values: { employee_code } };
  try {
    const { token } = await (await getServices()).auth.login(employee_code, password);
    await setSession(token);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, message: e.message, values: { employee_code } };
    return { ok: false, message: "Server API tidak dapat dihubungi", values: { employee_code } };
  }
  const next = String(fd.get("next") ?? "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/"); // only same-site redirects
}

export async function loginAsMaster(_prev: FormState, fd: FormData): Promise<FormState> {
  // Development convenience only: in production this would let anyone in as Administrator without a password.
  // Opt-in: off unless ENABLE_DEV_BYPASS=true, so a staging or `next dev` server is never open by default.
  // The account comes from DEMO_ACCOUNTS / DEMO_PASSWORD (first account), never from code.
  const [account] = (process.env.DEMO_ACCOUNTS ?? "").split(",");
  const demoPassword = process.env.DEMO_PASSWORD;
  if (process.env.NODE_ENV === "production" || process.env.ENABLE_DEV_BYPASS !== "true" || !account?.trim() || !demoPassword) return { ok: false, message: "Akses bypass tidak tersedia" };
  const next = String(fd.get("next") ?? "/");
  try {
    const { token } = await (await getServices()).auth.login(account.trim(), demoPassword);
    await setSession(token);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, message: e.message };
    return { ok: false, message: "Server API tidak dapat dihubungi" };
  }
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}
