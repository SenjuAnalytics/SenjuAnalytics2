/**
 * Rate limiting utility for API routes
 * Prevents abuse and protects API resources
 */

import { API_CONFIG } from "@/config";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Clean up expired entries
 */
function cleanup(): void {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}

// Cleanup every minute
if (typeof setInterval !== "undefined") {
  setInterval(cleanup, 60_000);
}

/**
 * Check rate limit for a given identifier (IP, user ID, etc.)
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = API_CONFIG.rateLimit.maxRequests,
  windowMs: number = API_CONFIG.rateLimit.windowMs
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = store[identifier];

  // First request or expired window
  if (!entry || entry.resetTime < now) {
    store[identifier] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  // Within window
  entry.count += 1;

  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  const ip = cfConnectingIp || realIp || forwardedFor?.split(",")[0] || "unknown";
  return ip.trim();
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(resetTime: number): Response {
  return Response.json(
    {
      error: "Too many requests",
      message: "Please try again later",
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)),
        "X-RateLimit-Reset": new Date(resetTime).toISOString(),
      },
    }
  );
}

/**
 * Rate limiter middleware for API routes
 */
export function withRateLimit(
  handler: (req: Request, ...args: unknown[]) => Promise<Response>,
  options?: {
    maxRequests?: number;
    windowMs?: number;
  }
) {
  return async (req: Request, ...args: unknown[]): Promise<Response> => {
    const identifier = getClientIdentifier(req);
    const { allowed, remaining, resetTime } = checkRateLimit(
      identifier,
      options?.maxRequests,
      options?.windowMs
    );

    if (!allowed) {
      return createRateLimitResponse(resetTime);
    }

    const response = await handler(req, ...args);

    // Add rate limit headers to successful responses
    response.headers.set("X-RateLimit-Limit", String(options?.maxRequests || API_CONFIG.rateLimit.maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set("X-RateLimit-Reset", new Date(resetTime).toISOString());

    return response;
  };
}
