import type { Request, Response } from 'express';
import { getAuthUser } from '@shared/middleware/auth.middleware.js';
import { authService } from './auth.service.js';
import type { RegisterInput } from './auth.schema.js';

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body as RegisterInput);
    res.status(201).json({ status: 'success', data: result });
  },

  login(req: Request, res: Response) {
    const user = getAuthUser(req);
    res.status(200).json({
      status: 'success',
      data: { user, accessToken: authService.issueToken(user) },
    });
  },

  me(req: Request, res: Response) {
    res.status(200).json({ status: 'success', data: getAuthUser(req) });
  },
};
