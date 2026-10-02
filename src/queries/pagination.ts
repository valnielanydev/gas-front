import { useInfiniteQuery, type QueryKey } from "@tanstack/react-query";
import type { Paginated } from "@/types/common";

interface Args<T> {
  queryKey: QueryKey;
  enabled: boolean;
  pageSize: number;
  fetchPage: (limit: number, offset: number) => Promise<Paginated<T>>;
}

/**
 * Offset-paginated list ("Carregar mais"). Pages are flattened and de-duplicated by id,
 * since rows can shift between pages while new orders arrive.
 */
export function useOffsetPagination<T extends { id: string }>({
  queryKey,
  enabled,
  pageSize,
  fetchPage,
}: Args<T>) {
  const query = useInfiniteQuery({
    queryKey,
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchPage(pageSize, pageParam),
    getNextPageParam: (last, pages) => {
      const rows = last.orders ?? [];
      const hasMore = last.hasMore ?? rows.length === pageSize;
      if (!hasMore || !rows.length) return undefined;
      return pages.reduce((total, page) => total + (page.orders?.length ?? 0), 0);
    },
    select: (data) => {
      const seen = new Set<string>();
      return data.pages
        .flatMap((page) => page.orders ?? [])
        .filter((row) => (seen.has(row.id) ? false : (seen.add(row.id), true)));
    },
  });

  return {
    /** `null` until the first page loads (still loading, or failed: see `isError`). */
    items: query.data ?? null,
    /** The first page failed; an empty `items` never means an error. */
    isError: query.isError && !query.data,
    retry: () => void query.refetch(),
    isRetrying: query.isFetching && !query.isFetchingNextPage,
    hasMore: !!query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
    isLoadingMore: query.isFetchingNextPage,
  };
}
