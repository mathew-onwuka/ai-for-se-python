/**
 * A deliberately small in-process cache.
 *
 * Not thread safe, not distributed, and not intended to become either.
 * Anything that needs more than this should talk to Redis directly.
 */

const DEFAULT_TTL_S = 300;

/** @type {Map<string, { expiresAt: number, value: unknown }>} */
export const store = new Map();

const now = () => process.hrtime.bigint() / 1_000_000_000n;

export function cachePut(key, value, ttlS = DEFAULT_TTL_S) {
  store.set(key, { expiresAt: Number(now()) + ttlS, value });
}

export function cacheGet(key) {
  const entry = store.get(key);
  if (entry === undefined) {
    return null;
  }
  if (entry.expiresAt < Number(now())) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

/** Remove every entry whose key starts with prefix. Returns the count. */
export function cacheDrop(prefix) {
  const doomed = [...store.keys()].filter((k) => k.startsWith(prefix));
  for (const key of doomed) {
    store.delete(key);
  }
  return doomed.length;
}

/** Return the cached value for key, or call fetcher and cache the result. */
// eslint-disable-next-line no-unused-vars -- `fetcher` is wired up once this stub is finished
export function getOrFetch(key, fetcher) {
  const cached = cacheGet(key);
  if (cached !== null) {
    return cached;
  }
  // TODO: call the fetcher and cache its result before returning it
}

/** Drop every entry. Used by tests between cases. */
export function cacheClear() {
  store.clear();
}
