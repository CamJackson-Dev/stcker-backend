import { NextFunction, Request, Response } from "express";
import { ExpressContext } from "apollo-server-express";
import { MiddlewareFn } from "type-graphql";

import {
  ACCESS_COOKIE_OPTIONS,
  ACCESS_TOKEN_COOKIE_NAME,
  APP_ACCESS_SECRET,
  APP_REFRESH_SECRET,
  REFRESH_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_NAME,
} from "../config";
import { User } from "../models";
import { validateToken } from "../utils/tokens";
import { redis } from "../app/database";
import { clearCookiesResponse } from "../utils/helpers";

export const tokenValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies[ACCESS_TOKEN_COOKIE_NAME];
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

  // Not login in
  if (!accessToken && !refreshToken) return next();

  let decodedAccessToken = validateToken({
    secret: APP_ACCESS_SECRET,
    token: accessToken,
  });

  let decodedRefreshToken = validateToken({
    secret: APP_REFRESH_SECRET,
    token: refreshToken,
  });

  // Tokens are still valid
  if (decodedAccessToken && decodedRefreshToken) {
    req.user = decodedAccessToken;
    const user = await User.findById(decodedRefreshToken._id)!;

    if (decodedRefreshToken.exp <= decodedAccessToken.exp && user) {
      // Generate new refresh token
      const newRefreshToken = user.generateRefreshToken();
      res.cookie(
        REFRESH_TOKEN_COOKIE_NAME,
        newRefreshToken,
        REFRESH_COOKIE_OPTIONS
      );

      return next();
    }
    return next();
  }

  // Access token has expired but refresh token is valid
  if (decodedRefreshToken) {
    const user = await User.findById(decodedRefreshToken._id)!;
    req.user = user;

    // Generate new access token
    const newAccessToken = user?.generateAccessToken();
    res.cookie(ACCESS_TOKEN_COOKIE_NAME, newAccessToken, ACCESS_COOKIE_OPTIONS);

    return next();
  }

  if (decodedAccessToken) {
    req.user = decodedAccessToken;
  }

  // Clear invalid cookies
  clearCookiesResponse(res);
  next();
};

export const IsAuthorized: MiddlewareFn<ExpressContext> = async (
  { context: { req } },
  next
) => {
  if (!req.user) throw new Error("Unauthorized");

  return next();
};

export const IsAdmin: MiddlewareFn<ExpressContext> = async (
  { context: { req } },
  next
) => {
  if (req.user?.role.toLowerCase() !== "admin") throw new Error("Forbidden");

  return next();
};

export const RateLimit: (limit: number) => MiddlewareFn<ExpressContext> =
  (limit: number) =>
  async ({ context: { req }, info }, next) => {
    const isNotLoggedIn = !req.user;
    const key = `rate-limit:${info.fieldName}:${
      isNotLoggedIn ? req.ip : req.user?._id
    }`;

    const current = await redis.incr(key);
    if (current > limit)
      throw new Error(
        "You have sent too much requests. Please try again later"
      );

    if (current === 1) {
      const SECONDS_IN_ONE_DAY = 60 * 60 * 24;
      await redis.expire(key, SECONDS_IN_ONE_DAY);
    }

    return next();
  };
