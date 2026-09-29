import { useCallback, useEffect, useRef, useState } from "react";
import type { TablePaginationConfig } from "antd";
import type { PagedQuery, PagedResult } from "@/types/Pagination";

type Fetcher<T, F> = (query: PagedQuery & F) => Promise<PagedResult<T>>;

interface Options<F> {
  initialFilters: F;
  initialPageSize?: number;
  onError?: (err: unknown) => void;
}

// Quản lý danh sách phân trang phía server: page, pageSize, bộ lọc và tải lại
export function usePagedList<T, F extends object>(
  fetcher: Fetcher<T, F>,
  { initialFilters, initialPageSize = 10, onError }: Options<F>,
) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filters, setFiltersState] = useState<F>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Giữ tham chiếu mới nhất để không phải đưa fetcher/onError vào deps
  const fetcherRef = useRef(fetcher);
  const onErrorRef = useRef(onError);
  fetcherRef.current = fetcher;
  onErrorRef.current = onError;

  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);

    fetcherRef
      .current({ page, pageSize, ...filters })
      .then((res) => {
        // Bỏ qua response cũ khi người dùng đổi trang/lọc liên tục
        if (requestId !== requestIdRef.current) return;

        // Xóa hết bản ghi ở trang cuối thì lùi về trang trước
        if (res.items.length === 0 && page > 1) {
          setPage(Math.max(1, res.totalPages));
          return;
        }

        setItems(res.items);
        setTotal(res.totalItems);
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        onErrorRef.current?.(err);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [page, pageSize, filters, reloadKey]);

  const filtersRef = useRef(filters);

  // Đổi bộ lọc thì quay về trang 1; giá trị không đổi thì bỏ qua để khỏi gọi lại API
  const setFilters = useCallback((patch: Partial<F>) => {
    const prev = filtersRef.current;
    const changed = (Object.keys(patch) as (keyof F)[]).some(
      (k) => !Object.is(prev[k], patch[k]),
    );
    if (!changed) return;

    filtersRef.current = { ...prev, ...patch };
    setFiltersState(filtersRef.current);
    setPage(1);
  }, []);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20", "50"],
    showTotal: (t) => `Tổng ${t} bản ghi`,
    onChange: (p, ps) => {
      if (ps !== pageSize) {
        setPageSize(ps);
        setPage(1);
      } else {
        setPage(p);
      }
    },
  };

  // STT liên tục giữa các trang
  const rowNumber = (index: number) => (page - 1) * pageSize + index + 1;

  return { items, total, loading, filters, setFilters, reload, pagination, rowNumber };
}
