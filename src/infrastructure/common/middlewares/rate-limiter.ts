import rateLimit from 'express-rate-limit';

const isPerformanceTesting =
  process.env.NODE_ENV === 'test' ||
  process.env.DISABLE_RATE_LIMITING === 'true' ||
  process.env.PERFORMANCE_TESTING === 'true';

export const rateLimiterMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isPerformanceTesting ? () => true : undefined, // Skip all requests during testing
  handler: function (_req, res) {
    return res.status(429).json({
      error: 'You sent too many requests. Please wait a while then try again',
    });
  },
});

// Export for debugging
export const isRateLimitingDisabled = isPerformanceTesting;
