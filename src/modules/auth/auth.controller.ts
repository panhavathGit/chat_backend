import type { Request, Response } from 'express';
import { getAuthUser } from '@shared/middleware/auth.middleware.js';
import type { AuthService } from './auth.service.js';

// * Handlers are arrow-function properties so `this` stays bound when passed to the router
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response) => {
    const result = await this.authService.register(req.body);
    res.status(201).json({ status: 'success', data: result });
  };

  login = (req: Request, res: Response) => {
    const user = getAuthUser(req);
    res.status(200).json({
      status: 'success',
      data: { user, accessToken: this.authService.issueToken(user) },
    });
  };

  me = (req: Request, res: Response) => {
    res.status(200).json({ status: 'success', data: getAuthUser(req) });
  };
}
