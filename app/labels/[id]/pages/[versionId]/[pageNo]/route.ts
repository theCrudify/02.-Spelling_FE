import { ApiClient } from "@/lib/api/api-client";

/** Streams a rendered artwork page from the API with the session token (the browser never holds the token). */
export async function GET(_req: Request, ctx: RouteContext<"/labels/[id]/pages/[versionId]/[pageNo]">) {
  const { id, versionId, pageNo } = await ctx.params;
  if (![id, versionId, pageNo].every((v) => /^\d+$/.test(v))) return new Response("Not found", { status: 404 });
  const res = await (await ApiClient.forSession()).fetch(`/labels/${id}/pages/${versionId}/${pageNo}`);
  const headers = new Headers();
  for (const h of ["content-type", "cache-control", "x-content-type-options"]) {
    const v = res.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(res.body, { status: res.status, headers });
}
