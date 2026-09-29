export interface PagedQuery {
  page: number;
  pageSize: number;
  search?: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Bỏ các giá trị rỗng để không gửi ?search=&status= lên backend
export const toPagedParams = (query: object) =>
  Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );

export const mapPagedResult = <T, R>(
  data: PagedResult<T>,
  mapItem: (item: T) => R,
): PagedResult<R> => ({ ...data, items: (data.items ?? []).map(mapItem) });
