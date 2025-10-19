import { Env } from "#/const/env";
import { isServer } from "@tanstack/react-query";

type RequestOptions<T> = RequestInit & {
  method?: string;
  headers?: Record<string, string>;
  cookie?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
};

export function getServerCookies() {
  if (typeof window !== "undefined") return "";

  return import("next/headers").then(async ({ cookies }) => {
    const cookieStore = cookies();
    return (await cookieStore)
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any

export const fetchApi = async <T, K = object>(
  path: string,
  {
    method,
    headers,
    cookie,
    body,
    cache = "default",
    next,
    ...props
  }: RequestOptions<K>
) => {
  const fullUrl = `${Env.ApiUrl}${path}`;
  let cookieHeader = cookie;
  if (isServer && !cookie) {
    cookieHeader = await getServerCookies();
  }

  const response = await fetch(fullUrl, {
    method,
    headers: {
      ...headers,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    credentials: "include",
    cache,
    next,
    ...props,
  });

  return response;
};

export const api = {
  get: async <T, K = object>(
    url: string,
    options?: Partial<RequestOptions<K>>
  ) => await fetchApi<T, K>(url, { method: "GET", ...options }),
  post: async <T, K = object>(
    url: string,
    options?: Partial<RequestOptions<K>>
  ) => await fetchApi<T, K>(url, { method: "POST", ...options }),
  options: async <T, K = object>(
    url: string,
    options?: Partial<RequestOptions<K>>
  ) => await fetchApi<T, K>(url, { method: "OPTIONS", ...options }),
  put: async <T, K = object>(
    url: string,
    options?: Partial<RequestOptions<K>>
  ) => await fetchApi<T, K>(url, { method: "PUT", ...options }),
  patch: async <T, K = object>(
    url: string,
    options?: Partial<RequestOptions<K>>
  ) => await fetchApi<T, K>(url, { method: "PATCH", ...options }),
  delete: async <T, K = object>(
    url: string,
    options?: Partial<RequestOptions<K>>
  ) => await fetchApi<T, K>(url, { method: "DELETE", ...options }),
};
