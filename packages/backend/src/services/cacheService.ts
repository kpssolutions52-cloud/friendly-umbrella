// @ts-nocheck
/**
 * Cache Service for AI responses and supplier data
 * Uses Redis for fast caching
 */

import crypto from 'crypto';

// Redis client type - optional
type RedisClient = any;

let redisClient: RedisClient | null = null;

/**
 * Initialize Redis client
 * Optional - continues without Redis if not available
 */
export async function initRedis(): Promise<void> {
  if (redisClient) {
    return;
  }

  try {
    // Try to import redis dynamically
    const redis = await import('redis');
    const { createClient } = redis;

    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err: any) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (error) {
    console.warn('Redis not available, continuing without cache:', error);
    // Continue without Redis if connection fails
    redisClient = null;
  }
}

/**
 * Hash question for cache key
 */
function hashQuestion(question: string): string {
  return crypto.createHash('md5').update(question.toLowerCase().trim()).digest('hex');
}

/**
 * Get cached AI response
 */
export async function getCachedResponse(question: string): Promise<string | null> {
  if (!redisClient) {
    return null;
  }

  try {
    const key = `ai:response:${hashQuestion(question)}`;
    const cached = await redisClient.get(key);
    return cached;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set cached AI response
 */
export async function setCachedResponse(
  question: string,
  response: string,
  ttl: number = 60 // 1 minute default
): Promise<void> {
  if (!redisClient) {
    return;
  }

  try {
    const key = `ai:response:${hashQuestion(question)}`;
    await redisClient.setEx(key, ttl, response);
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

/**
 * Get cached supplier data
 */
export async function getCachedSupplierData(productName: string): Promise<any[] | null> {
  if (!redisClient) {
    return null;
  }

  try {
    const key = `supplier:data:${productName.toLowerCase()}`;
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set cached supplier data
 */
export async function setCachedSupplierData(
  productName: string,
  data: any[],
  ttl: number = 30 // 30 seconds for price data
): Promise<void> {
  if (!redisClient) {
    return;
  }

  try {
    const key = `supplier:data:${productName.toLowerCase()}`;
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

/**
 * Invalidate cache for a product (when price updates)
 */
export async function invalidateProductCache(productName: string): Promise<void> {
  if (!redisClient) {
    return;
  }

  try {
    const key = `supplier:data:${productName.toLowerCase()}`;
    await redisClient.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}

/**
 * Clear all AI response cache
 */
export async function clearAICache(): Promise<void> {
  if (!redisClient) {
    return;
  }

  try {
    const keys = await redisClient.keys('ai:response:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Redis clear error:', error);
  }
}
