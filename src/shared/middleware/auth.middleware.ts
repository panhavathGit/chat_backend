import type { Request, RequestHandler } from 'express';
import passport from 'passport';
import { UnauthorizedError } from '@shared/errors/AppError.js';

// * Custom callback so auth failures go through errorHandler as JSON instead of passport's plain-text 401
const authenticateWith =
  (strategy: 'jwt' | 'local', failureMessage: string): RequestHandler =>
  (req, res, next) => {
    passport.authenticate(
      strategy,
      { session: false },
      (err: unknown, user: Express.User | false, info?: { message?: string }) => {
        if (err) return next(err);
        if (!user) return next(new UnauthorizedError(info?.message ?? failureMessage));
        req.user = user;
        next();
      },
    )(req, res, next);
  };

export const authenticate = authenticateWith('jwt', 'Invalid or missing access token');
export const authenticateLocal = authenticateWith('local', 'Invalid email or password');

export const getAuthUser = (req: Request): Express.User => {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
};
