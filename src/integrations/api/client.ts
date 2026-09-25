// Browser-side HTTP client — sends cookies automatically via credentials: "include".

import { getApiBase } from "@/lib/constants";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  body?: unknown;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, signal } = options;
  const url = `${getApiBase()}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (method !== "GET") {
    const csrf = getCsrfToken();
    if (csrf) headers["x-csrf-token"] = csrf;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
    signal: signal ?? AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    let errorBody: unknown;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = await res.text().catch(() => undefined);
    }
    const message =
      typeof errorBody === "object" &&
      errorBody !== null &&
      "message" in errorBody &&
      typeof (errorBody as { message: unknown }).message === "string"
        ? (errorBody as { message: string }).message
        : `Erro ${res.status}`;
    throw new ApiError(res.status, message, errorBody);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "body">) => request<T>("GET", path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PUT", path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PATCH", path, { ...opts, body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, "body">) =>
    request<T>("DELETE", path, opts),
};
