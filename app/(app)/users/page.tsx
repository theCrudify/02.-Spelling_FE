import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { columnsFor, DataTable, hrefWith } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { EntityForm } from "@/components/entity-form";
import { ListControls } from "@/components/list-controls";
import { ActiveBadge, Hl, PageHeader, Section } from "@/components/ui";
import { userFields } from "@/lib/forms";
import { getLang, getT } from "@/lib/lang";
import { getMeta } from "@/lib/meta";
import { getServices } from "@/lib/services/services";
import type { Row } from "@/lib/services/types";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Users & role") };
}

export default async function UsersPage({ searchParams }: PageProps<"/users">) {
  const me = await requireUser();
  const meta = await getMeta();
  const [t, lang] = [await getT(), await getLang()];
  const query = await searchParams;
  const s = await getServices();
  const editId = Number(query.edit) || null;
  const [result, departments, editing] = await Promise.all([s.users.list(query), s.departments.options(), editId ? s.users.get(editId) : null]);
  const showForm = !!editing || query.new === "1";
  const closeHref = hrefWith("/users", query, { edit: undefined, new: undefined });

  const columns = columnsFor<Row>(
    meta,
    "users",
    {
      employee_code: { render: (r, q) => <span className="code"><Hl text={r.employee_code} q={q} /></span> },
      name: { render: (r, q) => <><span className="font-medium"><Hl text={r.name} q={q} /></span><span className="block text-xs text-ink-3"><Hl text={r.email} q={q} /></span></> },
      role: { render: (r) => meta.name("roles", r.role) },
      department: { render: (r) => r.department_name ?? "—" },
      site: { render: (r) => (r.site ? meta.name("sites", r.site) : <span className="text-ink-3">{t("Semua site")}</span>) },
      is_active: { render: (r) => <ActiveBadge active={r.is_active} lang={lang} /> },
    },
    [{ key: "_edit", label: "", render: (r) => <Link className="text-xs font-medium text-ink-3 hover:text-ink" href={hrefWith("/users", query, { edit: r.id, new: undefined })}>{t("Ubah")}</Link> }],
  );

  return (
    <>
      <PageHeader
        eyebrow="Master data"
        title={meta.name("list_resources", "users")}
        description={t("Role menentukan hak akses dan tahap approval; site membatasi plant yang bisa diakses.")}
        actions={!showForm && <Link className="btn btn-primary" href={hrefWith("/users", query, { new: 1 })}><Plus aria-hidden /> User</Link>}
      />
      {showForm && (
        <Section
          title={editing ? t("Ubah user: {name}", { name: editing.name }) : t("Tambah user")}
          actions={
            <span className="flex gap-2">
              {editing && editing.id !== me.id && <DeleteButton resource="users" id={editing.id} redirectTo={closeHref} itemName={editing.name} />}
              <Link className="btn" href={closeHref}>{t("Tutup")}</Link>
            </span>
          }
        >
          <EntityForm
            key={editId ?? "new"}
            columns={3}
            fields={userFields(meta, departments, !!editing, t)}
            defaults={editing ?? { is_active: true, role: meta.active("roles").at(-1)?.code }}
            target={{ resource: "users", op: editing ? "update" : "create", id: editing?.id, redirectTo: `${closeHref}${closeHref.includes("?") ? "&" : "?"}ok=Tersimpan` }}
          />
        </Section>
      )}
      <DataTable
        noun="user"
        columns={columns}
        result={result}
        params={query}
        basePath="/users"
        toolbar={
          <Suspense>
            <ListControls filters={meta.filters("users")} placeholder={t("NIK, nama, email, departemen…")} />
          </Suspense>
        }
      />
    </>
  );
}
