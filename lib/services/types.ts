export type ListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  search: string;
  sortBy: string;
  sortDir: "asc" | "desc";
};
export type ListResult<T> = { data: T[]; meta: ListMeta };
export type Row = Record<string, any> & { id: number };
export type Option = { id: number; code: string; name: string };
export type SchemaField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "boolean" | "date" | "array";
  required: boolean;
  choices: string[] | null;
  ref: { table: string; column: string } | null;
};
