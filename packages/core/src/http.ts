import { FetchError, TimeoutError } from "./errors";

/** A minimum-interval gate so we stay polite to a portal's rate limits. */
export interface RateLimiter {
  acquire(): Promise<void>;
}

export function createRateLimiter(requestsPerSecond: number): RateLimiter {
  const minIntervalMs = requestsPerSecond > 0 ? 1000 / requestsPerSecond : 0;
  let last = 0;
  return {
    async acquire() {
      if (minIntervalMs <= 0) return;
      const now = Date.now();
      const wait = Math.max(0, last + minIntervalMs - now);
      last = now + wait;
      if (wait > 0) await sleep(wait);
    },
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface HttpOptions {
  /** Inject a fetch implementation (fixtures in tests). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  timeoutMs?: number; // default 15000
  retries?: number; // default 3
  rateLimiter?: RateLimiter;
  headers?: Record<string, string>;
  userAgent?: string;
}

const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_RETRIES = 3;

function isRetryable(status: number): boolean {
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

/** Fetch with timeout, polite rate-limiting, and exponential backoff + jitter. */
export async function httpRequest(
  connectorId: string,
  url: string,
  opts: HttpOptions = {},
): Promise<Response> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;
  const retries = opts.retries ?? DEFAULT_RETRIES;
  const headers: Record<string, string> = { ...opts.headers };
  if (opts.userAgent) headers["user-agent"] = opts.userAgent;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (opts.rateLimiter) await opts.rateLimiter.acquire();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    opts.signal?.addEventListener("abort", onAbort, { once: true });

    try {
      const res = await fetchImpl(url, { headers, signal: controller.signal });
      if (!res.ok && isRetryable(res.status) && attempt < retries) {
        lastErr = new FetchError(connectorId, `HTTP ${res.status} from ${url}`);
        await backoff(attempt);
        continue;
      }
      if (!res.ok) {
        throw new FetchError(connectorId, `HTTP ${res.status} from ${url}`);
      }
      return res;
    } catch (err) {
      if (controller.signal.aborted && !opts.signal?.aborted) {
        lastErr = new TimeoutError(connectorId, `Request to ${url} timed out after ${timeoutMs}ms`);
      } else {
        lastErr = err instanceof FetchError ? err : new FetchError(connectorId, `Request to ${url} failed`, { cause: err });
      }
      if (attempt < retries) {
        await backoff(attempt);
        continue;
      }
    } finally {
      clearTimeout(timer);
      opts.signal?.removeEventListener("abort", onAbort);
    }
  }
  throw lastErr ?? new FetchError(connectorId, `Request to ${url} failed`);
}

async function backoff(attempt: number): Promise<void> {
  const base = Math.min(2000, 200 * 2 ** attempt);
  const jitter = Math.random() * base * 0.3;
  await sleep(base + jitter);
}

export async function httpJson<T = unknown>(
  connectorId: string,
  url: string,
  opts: HttpOptions = {},
): Promise<T> {
  const res = await httpRequest(connectorId, url, opts);
  try {
    return (await res.json()) as T;
  } catch (err) {
    throw new FetchError(connectorId, `Invalid JSON from ${url}`, { cause: err });
  }
}

export async function httpText(connectorId: string, url: string, opts: HttpOptions = {}): Promise<string> {
  const res = await httpRequest(connectorId, url, opts);
  return res.text();
}
