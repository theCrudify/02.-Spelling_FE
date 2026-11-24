import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { MetaProvider } from "@/components/meta-context";
import { getMeta } from "@/lib/meta";
import { getServices } from "@/lib/services/services";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const meta = await getMeta();
  const tasks = meta.raw.menu.some((m) => m.badge === "tasks") ? (await (await getServices()).labels.list({ scope: "tasks", pageSize: "1" })).meta.total : 0;
  return (
    <MetaProvider value={meta.raw}>
      <Suspense>
        <AppShell user={{ name: user.name, role: user.role, site: user.site }} tasks={tasks}>
          {children}
        </AppShell>
      </Suspense>
    </MetaProvider>
  );
}
