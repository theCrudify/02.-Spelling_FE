import { ApiClient } from "@/lib/api/api-client";

/** Streams an attachment from the API with the session token (the browser never holds the token). */
export async function GET(_req: Request, ctx: RouteContext<"/files/[id]">) {
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return new Response("Not found", { status: 404 });
  const res = await (await ApiClient.forSession()).fetch(`/files/${id}`);
  const headers = new Headers();
  for (const h of ["content-type", "content-disposition", "cache-control", "x-content-type-options"]) {
    const v = res.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(res.body, { status: res.status, headers });
}
