/**
 * @module api-cache
 * @description Centralized API caching, debounce, retry, and deduplication layer
 * for the PharmaInsight platform.
 *
 * Provides:
 * 1. **Request Deduplication** — Prevents duplicate concurrent requests for the same data.
 * 2. **Retry with Exponential Backoff** — Resilient fetching with configurable retries.
 * 3. **Rate Limiters** — Per-source rate limiting (PubMed, CrossRef, OpenAlex).
 * 4. **Graceful API Error Handling** — Standardised error responses for common failure modes.
 * 5. **Debounce Utility** — Throttles rapid-fire calls (e.g. search input).
 * 6. **Supabase Cache Integration** — Additional remote cache layer via Supabase.
 * 7. **Timeout Wrapper** — Race promises against a deadline.
 */

import { isSupabaseActive, getCachedQuery, setCachedQuery } from '@/lib/supabase';

// ═══════════════════════════════════════════════════════════════
// 1. REQUEST DEDUPLICATION
// ═══════════════════════════════════════════════════════════════

/** Map of in-flight requests keyed by a unique cache key. */
const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Deduplicates concurrent requests that share the same key.
 *
 * If a request with the given `key` is already in-flight, the same Promise is
 * returned to all callers instead of firing a second network request. Once the
 * promise settles the entry is automatically cleaned up.
 *
 * @template T - The resolved value type of the fetcher.
 * @param key    - A unique identifier for the request (e.g. `"pubmed::warfarin::garlic"`).
 * @param fetcher - An async function that performs the actual fetch.
 * @returns The resolved value of the fetcher.
 *
 * @example
 * ```ts
 * const data = await dedupedFetch('pubmed::aspirin::ginger', () => fetchPubMed(query));
 * ```
 */
export async function dedupedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  // If a request with this key is already in-flight, return the same promise
  // This prevents duplicate concurrent requests for the same data
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }

  const promise = fetcher().finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, promise);
  return promise;
}

// ═══════════════════════════════════════════════════════════════
// 2. RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ═══════════════════════════════════════════════════════════════

/** Options for {@link withRetry}. */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 2). */
  maxRetries?: number;
  /** Base delay in milliseconds before the first retry (default: 1000). */
  baseDelay?: number;
  /** Upper bound for the delay in milliseconds (default: 5000). */
  maxDelay?: number;
}

/**
 * Executes an async function with automatic retries and exponential backoff.
 *
 * On each retry the delay is calculated as:
 * `min(baseDelay * 2^attempt + random_jitter, maxDelay)`
 *
 * The random jitter (0-500 ms) helps avoid the "thundering herd" problem when
 * many clients retry simultaneously.
 *
 * @template T - The resolved value type of the function.
 * @param fn      - The async operation to attempt.
 * @param options - Retry configuration.
 * @returns The resolved value of `fn`.
 * @throws The last encountered error if all attempts fail.
 *
 * @example
 * ```ts
 * const data = await withRetry(() => fetchPubMed(query), { maxRetries: 1 });
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 2, baseDelay = 1000, maxDelay = 5000 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 500,
          maxDelay
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// ═══════════════════════════════════════════════════════════════
// 3. RATE LIMITER
// ═══════════════════════════════════════════════════════════════

/**
 * Token-bucket–style rate limiter that restricts the number of requests
 * per second for a given API source.
 *
 * Callers must `acquire()` a slot before making a request and `release()`
 * it when the request completes. If the rate limit is exceeded, `acquire()`
 * will block until a slot becomes available.
 *
 * @example
 * ```ts
 * await pubmedLimiter.acquire();
 * try {
 *   const data = await fetch(url);
 * } finally {
 *   pubmedLimiter.release();
 * }
 * ```
 */
class RateLimiter {
  private queue: Array<{ resolve: () => void }> = [];
  private activeCount = 0;
  private lastRequestTime = 0;

  /**
   * @param maxPerSecond - Maximum number of requests allowed per second.
   */
  constructor(private maxPerSecond: number = 3) {}

  /**
   * Acquire a rate-limit slot. Resolves immediately if under the limit,
   * otherwise queues and waits until a slot opens.
   */
  async acquire(): Promise<void> {
    const now = Date.now();
    const minInterval = 1000 / this.maxPerSecond;
    const timeSinceLast = now - this.lastRequestTime;

    // If we still have capacity, proceed immediately
    if (this.activeCount < this.maxPerSecond && timeSinceLast >= minInterval) {
      this.activeCount++;
      this.lastRequestTime = now;
      return;
    }

    // Otherwise, wait for a slot
    return new Promise<void>((resolve) => {
      const waitTime = Math.max(minInterval - timeSinceLast, 0);
      setTimeout(() => {
        this.activeCount++;
        this.lastRequestTime = Date.now();
        resolve();
        this.processQueue();
      }, waitTime);
      this.queue.push({ resolve });
    });
  }

  /**
   * Release a previously acquired rate-limit slot.
   * Processes the next queued request if one exists.
   */
  release(): void {
    this.activeCount--;
    this.processQueue();
  }

  /** Process the next request in the queue. */
  private processQueue(): void {
    if (this.queue.length === 0) return;

    const now = Date.now();
    const minInterval = 1000 / this.maxPerSecond;
    const timeSinceLast = now - this.lastRequestTime;

    if (this.activeCount < this.maxPerSecond && timeSinceLast >= minInterval) {
      const next = this.queue.shift();
      if (next) {
        this.activeCount++;
        this.lastRequestTime = Date.now();
        next.resolve();
      }
    } else if (this.queue.length > 0) {
      // Schedule processing for when a slot opens
      const waitTime = Math.max(minInterval - timeSinceLast, 0);
      setTimeout(() => this.processQueue(), waitTime);
    }
  }
}

/**
 * Rate limiter for PubMed API.
 * PubMed allows 3 requests/second without an API key, 10/second with one.
 */
export const pubmedLimiter = new RateLimiter(3);

/**
 * Rate limiter for CrossRef API.
 * CrossRef polite pool allows ~10 requests/second with a User-Agent header.
 */
export const crossrefLimiter = new RateLimiter(10);

/**
 * Rate limiter for OpenAlex API.
 * OpenAlex allows ~10 requests/second (higher with email parameter).
 */
export const openalexLimiter = new RateLimiter(10);

// ═══════════════════════════════════════════════════════════════
// 4. GRACEFUL API FAILURE HANDLER
// ═══════════════════════════════════════════════════════════════

/** Standardised error result returned by {@link handleApiError}. */
export interface ApiErrorResult {
  ok: false;
  error: string;
}

/**
 * Converts a caught error from an external API call into a user-friendly,
 * standardised error object.
 *
 * Recognises common failure patterns:
 * - **AbortError** → timeout
 * - **429** → rate limit exceeded
 * - **503** → service unavailable
 *
 * @param source - Human-readable API source name (e.g. `"PubMed"`, `"OpenFDA"`).
 * @param error  - The caught error value.
 * @returns A standardised `{ ok: false, error }` object.
 *
 * @example
 * ```ts
 * try {
 *   await fetch(url);
 * } catch (err) {
 *   return handleApiError('PubMed', err);
 * }
 * ```
 */
export function handleApiError(source: string, error: unknown): ApiErrorResult {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return { ok: false, error: `${source} request timed out` };
    }
    if (error.message.includes('429')) {
      return { ok: false, error: `${source} rate limit exceeded` };
    }
    if (error.message.includes('503')) {
      return { ok: false, error: `${source} service unavailable` };
    }
  }
  return { ok: false, error: `${source} request failed` };
}

// ═══════════════════════════════════════════════════════════════
// 5. DEBOUNCE UTILITY
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a debounced version of a function that delays invocation until
 * `delay` milliseconds have elapsed since the last call.
 *
 * Useful for search inputs where you want to avoid firing a request on
 * every keystroke.
 *
 * @template T - The function type to debounce.
 * @param fn    - The function to debounce.
 * @param delay - Delay in milliseconds.
 * @returns A debounced function with the same parameter signature.
 *
 * @example
 * ```ts
 * const debouncedSearch = debounce((q: string) => searchApi(q), 300);
 * // Only fires 300ms after the last call
 * debouncedSearch('aspirin');
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ═══════════════════════════════════════════════════════════════
// 6. SUPABASE CACHE INTEGRATION
// ═══════════════════════════════════════════════════════════════

/**
 * Attempts to retrieve cached results from the Supabase remote cache.
 *
 * Returns `null` if Supabase is not active, the cache entry does not exist,
 * or the lookup fails for any reason (errors are silently swallowed so the
 * caller can always fall back to a live fetch).
 *
 * @param cacheKey - The unique cache key (e.g. `"interaction::warfarin::garlic"`).
 * @returns The cached row data, or `null` if unavailable.
 *
 * @example
 * ```ts
 * const cached = await getCachedResults('interaction::aspirin::ginger');
 * if (cached) return cached;
 * ```
 */
export async function getCachedResults(cacheKey: string): Promise<unknown | null> {
  if (!isSupabaseActive()) return null;
  try {
    return await getCachedQuery(cacheKey);
  } catch {
    return null;
  }
}

/**
 * Persists query results to the Supabase remote cache.
 *
 * If Supabase is not active, or the write fails, the operation is silently
 * skipped — cache failures must never break the user-facing request flow.
 *
 * @param cacheKey    - Unique cache key for this result set.
 * @param queryType   - Type of query (e.g. `"interaction"`, `"pharmacology"`).
 * @param results     - The data to cache.
 * @param sourcesUsed - List of API sources that were consulted.
 * @param ttlHours    - Time-to-live in hours (default: 24).
 *
 * @example
 * ```ts
 * await setCachedResults('interaction::aspirin::ginger', 'interaction', data, ['PubMed', 'OpenFDA']);
 * ```
 */
export async function setCachedResults(
  cacheKey: string,
  queryType: string,
  results: unknown,
  sourcesUsed: string[],
  ttlHours: number = 24
): Promise<void> {
  if (!isSupabaseActive()) return;
  try {
    await setCachedQuery({
      cache_key: cacheKey,
      query_type: queryType,
      results: results as Record<string, unknown>,
      sources_used: sourcesUsed,
      result_count: Array.isArray(results) ? results.length : 0,
      expires_at: new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString(),
    });
  } catch {
    /* ignore cache errors */
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. TIMEOUT WRAPPER
// ═══════════════════════════════════════════════════════════════

/**
 * Races a promise against a timeout. If the promise does not settle within
 * `ms` milliseconds, it is rejected with a timeout error.
 *
 * @template T - The resolved value type of the promise.
 * @param promise - The promise to race.
 * @param ms      - Timeout threshold in milliseconds.
 * @returns The resolved value of `promise`, or a rejection on timeout.
 *
 * @example
 * ```ts
 * const data = await withTimeout(fetchPubMed(query), 10_000);
 * ```
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Request timed out after ${ms}ms`)),
        ms
      )
    ),
  ]);
}
