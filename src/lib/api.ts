export class ApiError extends Error {
  status: number;
  code?: string;
  data: Record<string, unknown>;
  constructor(status: number, message: string, data: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = typeof data.code === 'string' ? data.code : undefined;
    this.data = data;
  }
}

/** JSON request to our own API. Throws ApiError with the server's message on failure. */
export async function api<T = Record<string, unknown>>(path: string, body?: unknown, method?: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`./api${path}`, {
      method: method ?? (body === undefined ? 'GET' : 'POST'),
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Is it running? (npm run dev)", {});
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`, data);
  return data as T;
}
