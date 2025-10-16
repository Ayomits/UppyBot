import { Env } from "#/const/env";
import { isServer } from "@tanstack/react-query";

type RequestOptions<T> = {
  method?: string;
  headers?: Record<string, string>;
  body?: T;
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
  options: RequestOptions<K>
) => {
  const { method, headers, cookie, body, cache = "default", next } = options;
  const fullUrl = `${Env.ApiUrl}${path}`;
  let cookieHeader = cookie;
  if (isServer && !cookie) {
    cookieHeader = await getServerCookies();
  }

  const isFormData = body instanceof FormData;
  const requestHeaders = isFormData
    ? {
        ...headers,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      }
    : {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      };

  const requestBody = isFormData
    ? body
    : body
    ? JSON.stringify(body)
    : undefined;

  const requestData = { fullUrl, method, requestHeaders, requestBody };

  if (Env.AppEnv == "dev") {
    console.log(requestData);
  }

  const response = await fetch(fullUrl, {
    method,
    headers: requestHeaders,
    body: requestBody,
    credentials: "include",
    cache,
    next,
  });

  const bodyText = response.body ? await response.text() : undefined;

  if (Env.AppEnv == "dev") {
    console.log({ response, bodyText: bodyText, requestData });
  }

  const data = bodyText ? JSON.parse(bodyText) : response;
  return data as T;
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
