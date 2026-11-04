import { Router } from 'express';
import { authenticate, authenticateLocal } from '@shared/middleware/auth.middleware.js';
import { validate } from '@shared/middleware/validate.middleware.js';
import { authController } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), authController.register);
authRouter.post('/login', validate({ body: loginSchema }), authenticateLocal, authController.login);
authRouter.get('/me', authenticate, authController.me);
