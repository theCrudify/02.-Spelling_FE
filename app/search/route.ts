import { ApiClient, toQuery } from "@/lib/api/api-client";

/** Command palette search: labels by code, name or product. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const res = await (await ApiClient.forSession()).fetch(`/labels?${toQuery({ search: q, pageSize: "8" })}`);
  if (!res.ok) return Response.json({ labels: [] }, { status: res.status });
  const { data } = await res.json();
  return Response.json({ labels: data.map((l: any) => ({ id: l.id, title: l.name, subtitle: `${l.code} · ${l.country_name} · v${l.current_version}`, badge: l.status })) });
}
