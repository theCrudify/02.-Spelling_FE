import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: send visitors without a session cookie to /login. Real authorization is in the API.
export function proxy(req: NextRequest) {
  if (req.cookies.has("spelling_token")) return NextResponse.next();
  const url = new URL("/login", req.url);
  if (req.nextUrl.pathname !== "/") url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|logout|_next/static|_next/image|favicon.ico).*)"],
};
