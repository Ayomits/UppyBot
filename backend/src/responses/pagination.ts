export class PaginationResponse<T> {
  items: T[];
  hasNext: boolean;
  count: number;
  maxPages: number;
  limit: number;

  constructor({
    hasNext = false,
    items = [],
    count = 0,
    limit = 10,
  }: {
    items: T[];
    hasNext: boolean;
    limit: number;
    count?: number;
  }) {
    this.hasNext = hasNext;
    this.items = items;
    this.count = count ?? items.length;
    this.limit = limit;
    this.maxPages = Math.max(1, Math.ceil(this.count / this.limit)) + 1;
  }
}
