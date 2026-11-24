import "server-only";
import { ApiClient } from "../api/api-client";
import { ResourceService } from "./resource.service";
import type { Row } from "./types";

export class AuthService {
  constructor(private readonly api: ApiClient) {}
  login(employee_code: string, password: string) {
    return this.api.request<{ token: string; user: Row }>(
      "/auth/login",
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ employee_code, password }) },
      { redirectOn401: false },
    );
  }
  changePassword(body: FormData) {
    return this.api.request<{ ok: true }>("/auth/change-password", { method: "POST", body });
  }
}

export class LabelService extends ResourceService {
  detail(id: number, version?: string) {
    return this.api.request<Row & Record<string, any>>(`${this.path}/${id}${version ? `?version=${encodeURIComponent(version)}` : ""}`);
  }
  summary() {
    return this.api.request<Record<string, any>>(`${this.path}/summary`);
  }
  /** POST /labels/:id/<action>, e.g. versions, submit, approve, revision, reject, recheck, findings/:fid */
  action(id: number, action: string, body: FormData) {
    return this.api.request<Record<string, any>>(`${this.path}/${id}/${action}`, { method: "POST", body });
  }
}

/** All services bound to the current session's token. */
export async function getServices() {
  const api = await ApiClient.forSession();
  return {
    api,
    auth: new AuthService(api),
    labels: new LabelService(api, "/labels"),
    users: new ResourceService(api, "/users"),
    departments: new ResourceService(api, "/departments"),
    countries: new ResourceService(api, "/countries"),
    products: new ResourceService(api, "/products"),
    /** Any CRUD resource by API path (admin pages for master & configuration tables). */
    resource: (path: string) => new ResourceService(api, path),
  };
}
export type Services = Awaited<ReturnType<typeof getServices>>;
