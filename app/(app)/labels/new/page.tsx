import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityForm } from "@/components/entity-form";
import { PageHeader, Section } from "@/components/ui";
import { labelFields } from "@/lib/forms";
import { getT } from "@/lib/lang";
import { getMeta } from "@/lib/meta";
import { getServices } from "@/lib/services/services";
import { requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Label baru") };
}

export default async function NewLabelPage() {
  await requireUser();
  const meta = await getMeta();
  const t = await getT();
  if (!meta.can("label.edit")) notFound();
  const s = await getServices();
  const [products, countries] = await Promise.all([s.products.options(), s.countries.options()]);
  return (
    <>
      <PageHeader eyebrow={t("Draft label")} title={t("Label baru")} description={t("Setelah diunggah, artwork langsung diperiksa mesin di server internal (tidak ada data yang keluar).")} />
      {/* Form width follows its fields, not the monitor. */}
      <div className="max-w-4xl">
      <Section title={t("Data label & artwork")}>
        <EntityForm
          columns={2}
          stickyActions
          submitLabel={t("Unggah & periksa")}
          target={{ resource: "labels", op: "create", redirectTo: `/labels/:id?ok=${encodeURIComponent("Label dibuat, artwork sedang diperiksa")}` }}
          fields={labelFields(meta, { products, countries }, t)}
        />
      </Section>
      </div>
    </>
  );
}
