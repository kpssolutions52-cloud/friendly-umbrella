/**
 * Cache Service for AI responses.
 * Uses Redis when available; silently degrades to no-op without it.
 */

import crypto from 'crypto';

/** Minimal interface covering only the Redis operations this module uses. */
interface RedisClient {
  get(key: string): Promise<string | null>;
  setEx(key: string, ttl: number, value: string): Promise<unknown>;
  on(event: string, listener: (err: Error) => void): void;
  connect(): Promise<void>;
}

let redisClient: RedisClient | null = null;

/**
 * Initialize Redis client.
 * Optional — continues without Redis if connection fails.
 */
export async function initRedis(): Promise<void> {
  if (redisClient) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { createClient } = (await import('redis' as any)) as { createClient: (opts: { url: string }) => RedisClient };
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    client.on('error', (err: Error) => {
      console.error('Redis Client Error:', err);
    });

    await client.connect();
    redisClient = client;
    console.log('Redis connected successfully');
  } catch (error) {
    console.warn('Redis not available, continuing without cache:', error);
    redisClient = null;
  }
}

function hashCacheKey(key: string): string {
  return crypto.createHash('md5').update(key.toLowerCase().trim()).digest('hex');
}

/**
 * Get cached AI response.
 */
export async function getCachedResponse(key: string): Promise<string | null> {
  if (!redisClient) return null;
  try {
    return await redisClient.get(`ai:response:${hashCacheKey(key)}`);
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set cached AI response.
 * @param ttl Time-to-live in seconds (default 300 = 5 minutes).
 */
export async function setCachedResponse(
  key: string,
  response: string,
  ttl: number = 300
): Promise<void> {
  if (!redisClient) return;
  try {
    await redisClient.setEx(`ai:response:${hashCacheKey(key)}`, ttl, response);
  } catch (error) {
    console.error('Redis set error:', error);
  }
}
