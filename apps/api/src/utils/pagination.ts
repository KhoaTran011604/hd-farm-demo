export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

export interface PaginationResult<T> {
  items: T[];
  nextCursor: string | null;
}

export function paginate<T>(
  items: T[],
  limit: number,
  getCursor: (item: T) => string
): PaginationResult<T> {
  const hasMore = items.length > limit;
  const sliced = hasMore ? items.slice(0, limit) : items;
  return {
    items: sliced,
    nextCursor: hasMore ? getCursor(sliced[sliced.length - 1]!) : null,
  };
}
