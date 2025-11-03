export interface Loop {
  create(): void | Promise<void>
  task(): void | Promise<void>;
}
