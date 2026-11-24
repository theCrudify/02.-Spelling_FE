import { NextResponse, type NextRequest } from "next/server";
import { clearSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  await clearSession();
  const url = new URL("/login", req.url);
  if (req.nextUrl.searchParams.get("expired")) url.searchParams.set("expired", "1");
  return NextResponse.redirect(url);
}
