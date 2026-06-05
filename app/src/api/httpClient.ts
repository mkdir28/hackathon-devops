import type { ApiError } from '@/types';

export interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function request<T = Record<string, unknown>>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const isFormData = body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: Record<string, unknown> = {};
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const error = new Error(
      (data.message as string) || response.statusText || 'Request failed'
    ) as ApiError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}
