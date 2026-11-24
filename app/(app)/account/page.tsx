import type { Metadata } from "next";
import { EntityForm } from "@/components/entity-form";
import { DetailGrid, PageHeader, Section } from "@/components/ui";
import { getT } from "@/lib/lang";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Akun") };
}

export default async function AccountPage() {
  const user = await requireUser();
  const t = await getT();
  return (
    <>
      <PageHeader title={t("Akun Saya")} />
      <Section title={t("Profil")}>
        <DetailGrid items={[[t("NIK"), user.employee_code], [t("Nama"), user.name], ["Role", user.role], ["Site", user.site]]} />
      </Section>
      <Section title={t("Ganti password")}>
        <div className="max-w-md">
          <EntityForm
            columns={1}
            target={{ resource: "auth", op: "changePassword", success: "Password berhasil diganti" }}
            fields={[
              { name: "current_password", label: t("Password lama"), type: "password", required: true },
              { name: "new_password", label: t("Password baru"), type: "password", required: true, hint: t("Minimal 8 karakter") },
            ]}
          />
        </div>
      </Section>
    </>
  );
}
