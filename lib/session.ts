import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "spelling_token";

export type SessionUser = {
  id: number;
  employee_code: string;
  name: string;
  role: string; // roles.code
  site: string | null; // sites.code; null = all sites
  department_id: number | null;
};

export async function getToken() {
  return (await cookies()).get(COOKIE)?.value;
}

/** Reads the user from the JWT payload for UI decisions. The backend verifies the signature on every call. */
export async function getUser(): Promise<SessionUser | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    if (payload.exp * 1000 < Date.now()) return null;
    return payload.user as SessionUser;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function setSession(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Same lifetime as the token (setting session_hours on the API).
    maxAge: Math.max(60, JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).exp - Math.floor(Date.now() / 1000)),
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
