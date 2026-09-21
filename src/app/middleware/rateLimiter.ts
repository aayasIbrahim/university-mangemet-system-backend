import { rateLimit } from "express-rate-limit";
import type { Request, Response } from "express";

import config from "../config";

const rateLimitResponse = (_req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    statusCode: 429,
    message: "Too many requests. Please try again later.",
  });
};

export const apiRateLimiter = rateLimit({
  windowMs: config.rate_limit_window_ms,
  limit: config.rate_limit_max,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitResponse,
});

export const authRateLimiter = rateLimit({
  windowMs: config.rate_limit_window_ms,
  limit: config.auth_rate_limit_max,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitResponse,
});