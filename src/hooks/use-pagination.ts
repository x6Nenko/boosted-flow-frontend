import { useMemo, useState, useCallback } from 'react';

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

type UsePaginationOptions = {
  defaultPageSize?: PageSize;
};

type UsePaginationReturn<T> = {
  page: number;
  pageSize: PageSize;
  totalPages: number;
  paginatedItems: T[];
  totalItems: number;
  hasPrev: boolean;
  hasNext: boolean;
  setPage: (page: number) => void;
  setPageSize: (size: PageSize) => void;
  pageSizeOptions: readonly PageSize[];
};

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {},
): UsePaginationReturn<T> {
  const { defaultPageSize = 20 } = options;
  const [page, setPageRaw] = useState(1);
  const [pageSize, setPageSizeRaw] = useState<PageSize>(defaultPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp page when data or pageSize changes
  const clampedPage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, clampedPage, pageSize]);

  const setPage = useCallback(
    (p: number) => setPageRaw(Math.max(1, Math.min(p, totalPages))),
    [totalPages],
  );

  const setPageSize = useCallback((size: PageSize) => {
    setPageSizeRaw(size);
    setPageRaw(1);
  }, []);

  return {
    page: clampedPage,
    pageSize,
    totalPages,
    paginatedItems,
    totalItems,
    hasPrev: clampedPage > 1,
    hasNext: clampedPage < totalPages,
    setPage,
    setPageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  };
}
