import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiter: Ratelimit | null | undefined;

function getLimiter() {
  if (limiter !== undefined) return limiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") throw new Error("Rate limiting is not configured.");
    limiter = null;
    return limiter;
  }
  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(8, "10 m"),
    analytics: false,
    prefix: "bandhannama:public-wish"
  });
  return limiter;
}

export async function enforceWishRateLimit(key: string) {
  const activeLimiter = getLimiter();
  if (!activeLimiter) return { success: true, reset: 0 };
  return activeLimiter.limit(key);
}
