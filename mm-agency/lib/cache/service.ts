/**
 * Generic cache service: get, set, del with JSON serialization and TTL.
 * Gracefully no-ops when Redis is unavailable.
 */

import { getRedis } from "../redis";

/** Default TTL in seconds for single-entity cache (e.g. brand:1, product:1). */
export const CACHE_TTL_ENTITY = 300; // 5 minutes

/** Default TTL for list caches (e.g. product:list). Shorter to allow fresher lists. */
export const CACHE_TTL_LIST = 120; // 2 minutes

/**
 * Get value from cache. Returns null if key missing, Redis down, or parse error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Set value in cache with optional TTL (seconds). No-op if Redis unavailable.
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = CACHE_TTL_ENTITY
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  } catch {
    // Fail silently; app continues without cache
  }
}

/**
 * Delete a single key. No-op if Redis unavailable.
 */
export async function cacheDel(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // Fail silently
  }
}

/**
 * Delete multiple keys. Use for cache invalidation after UPDATE/DELETE.
 */
export async function cacheDelMany(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(...keys);
  } catch {
    // Fail silently
  }
}

/**
 * Bulk invalidation: find keys by prefix and delete them.
 * Example: invalidateProductList() deletes all keys starting with mm:product:list
 */
export async function cacheInvalidateByPrefix(prefix: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        `${prefix}*`,
        "COUNT",
        100
      );
      cursor = nextCursor;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== "0");
  } catch {
    // Fail silently
  }
}
