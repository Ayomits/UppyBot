export class PaginationResponse<T> {
  items: T[];
  hasNext: boolean;

  constructor(items: T[], hasNext: boolean) {
    this.hasNext = hasNext;
    this.items = items;
  }

  toObject() {
    return {
      items: this.items,
      hasNext: this.hasNext,
    };
  }
}
