export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

const RAW_API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? '';
const API_BASE_URL = (import.meta as any).env?.DEV ? '' : RAW_API_BASE_URL;

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

async function readJsonSafe(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return null;
  try {
    return (await response.json()) as Json;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  opts: { retryOn401?: boolean } = {},
): Promise<T> {
  const retryOn401 = opts.retryOn401 ?? true;
  const url = `${API_BASE_URL}${path}`;

  const headers = new Headers(init.headers);
  if (!headers.has('content-type') && init.body) headers.set('content-type', 'application/json');

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && retryOn401) {
    const refreshed = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshed.ok) return apiFetch<T>(path, init, { retryOn401: false });
  }

  if (!response.ok) {
    const body = await readJsonSafe(response);
    const message =
      (body as any)?.error ||
      (body as any)?.message ||
      `Request failed: ${response.status} ${response.statusText}`;
    throw new ApiError(String(message), response.status, body);
  }

  if (response.status === 204) return null as T;

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      return (await response.json()) as T;
    } catch {
      return null as T;
    }
  }

  const text = await response.text();
  const hasContent = text.trim().length > 0;
  return (hasContent ? (text as unknown as T) : (null as T));
}
