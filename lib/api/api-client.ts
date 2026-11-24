import "server-only";
import { notFound, redirect } from "next/navigation";
import { getToken } from "../session";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export type Query = Record<string, string | string[] | undefined>;

export const toQuery = (params: Query) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (typeof v === "string" && v !== "") q.set(k, v);
  return q.toString();
};

/** Server-side HTTP client for the Hono API. The token never reaches the browser. */
export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token?: string,
  ) {}

  static async forSession() {
    const baseUrl = process.env.API_URL;
    if (!baseUrl) throw new Error("API_URL is not set (see .env.example)");
    return new ApiClient(baseUrl, await getToken());
  }

  /** Raw response, used to stream files and CSV through route handlers. */
  fetch(path: string, init: RequestInit = {}) {
    return fetch(`${this.baseUrl}/api${path}`, {
      ...init,
      cache: "no-store",
      headers: { ...(this.token && { authorization: `Bearer ${this.token}` }), ...init.headers },
    });
  }

  async request<T>(path: string, init: RequestInit = {}, { redirectOn401 = true } = {}): Promise<T> {
    const res = await this.fetch(path, init);
    if (res.status === 401 && redirectOn401) redirect("/logout?expired=1");
    // Reading a record that is missing or outside the user's scope shows the not-found page (doesn't reveal which).
    if ((res.status === 404 || res.status === 403) && (init.method ?? "GET") === "GET") notFound();
    const body = res.headers.get("content-type")?.includes("json") ? await res.json() : null;
    if (!res.ok) throw new ApiError(res.status, body?.message ?? `Request gagal (${res.status})`, body?.errors);
    return body as T;
  }
}
