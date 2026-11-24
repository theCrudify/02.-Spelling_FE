import "server-only";
import { toQuery, type ApiClient, type Query } from "../api/api-client";
import type { ListResult, Option, Row, SchemaField } from "./types";

/** REST resource with the shared list contract. Subclasses add resource-specific calls. */
export class ResourceService<T extends Row = Row> {
  constructor(
    protected readonly api: ApiClient,
    protected readonly path: string,
  ) {}

  list(params: Query = {}) {
    return this.api.request<ListResult<T>>(`${this.path}?${toQuery(params)}`);
  }

  get(id: number) {
    return this.api.request<T>(`${this.path}/${id}`);
  }

  options() {
    return this.api.request<Option[]>(`${this.path}/options`);
  }

  /** Form schema read from the database (types, required, FK targets, CHECK choices, column comments as labels). */
  schema() {
    return this.api.request<SchemaField[]>(`${this.path}/schema`);
  }

  create(body: FormData) {
    return this.api.request<{ id: number }>(this.path, { method: "POST", body });
  }

  update(id: number, body: FormData) {
    return this.api.request<{ id?: number }>(`${this.path}/${id}`, { method: "PUT", body });
  }

  /** CSV upload: all rows are validated first; nothing is saved unless every row is valid. */
  import(body: FormData) {
    return this.api.request<{ imported: number }>(`${this.path}/import`, { method: "POST", body });
  }

  remove(id: number) {
    return this.api.request<{ ok: true }>(`${this.path}/${id}`, { method: "DELETE" });
  }
}
