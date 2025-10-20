import {
  InfiniteData,
  UseInfiniteQueryOptions,
  UseQueryOptions,
} from "@tanstack/react-query";

export type InfiniteQueryOptions<T extends readonly unknown[] = unknown[]> =
  Partial<UseInfiniteQueryOptions<T, Error, InfiniteData<T>, T>>;

export type QueryOptions<T> = Partial<UseQueryOptions<T>>;

export type ListResponse<T> = { items: T[] };
