import { t, tMaybe, type Params } from '../i18n/core.ts';

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

/**
 * The server's error in the learner's language: errors carry a message key ("api.wrongLogin") next to the
 * English text, so the text is looked up here; unknown keys fall back to the server's English.
 */
function errorText(data: Record<string, unknown>, status: number): string {
  const english = typeof data.error === 'string' ? data.error : t('api.requestFailed', { status });
  if (typeof data.key !== 'string') return english;
  const params = data.params && typeof data.params === 'object' ? (data.params as Params) : undefined;
  return tMaybe(data.key, english, params);
}

/** JSON request to our own API. Throws ApiError with the server's message (translated) on failure. */
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
    throw new ApiError(0, t('api.unreachable'), {});
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, errorText(data, res.status), data);
  return data as T;
}
