import type { ApiError } from "@/features/errors";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response.json().catch(() => null)) as ApiError | T | null;
  if (!response.ok) {
    const error = payload as ApiError | null;
    throw new ApiClientError(
      error?.error ?? `请求失败（HTTP ${response.status}）`,
      response.status,
      error?.code,
      error?.details
    );
  }
  return payload as T;
}
