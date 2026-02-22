/**
 * Redis connection for caching.
 * Uses REDIS_URL (e.g. redis://localhost:6379). If unset, cache is disabled.
 */

import Redis from "ioredis";

let client: Redis | null = null;

const REDIS_URL = process.env.REDIS_URL;

/**
 * Get Redis client. Returns null if REDIS_URL is not set (cache disabled).
 */
export function getRedis(): Redis | null {
  if (client) return client;
  if (!REDIS_URL) return null;
  try {
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
    return client;
  } catch (err) {
    console.error("[Redis] Failed to create client:", err);
    return null;
  }
}

/**
 * Close Redis connection. Call on app shutdown.
 */
export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}

/**
 * Check if cache is available (client exists and is connected).
 */
export async function isRedisAvailable(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
