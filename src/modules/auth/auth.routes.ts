import { Router } from 'express';
import { prisma } from '@config/database.js';
import { authenticate, authenticateLocal } from '@shared/middleware/auth.middleware.js';
import { validate } from '@shared/middleware/validate.middleware.js';
import { AuthController } from './auth.controller.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';
import { loginSchema, registerSchema } from './auth.schema.js';

const authRepository = new AuthRepository(prisma);
// * Exported so the passport strategies (@config/passport.ts) share this same instance
export const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), authController.register);
authRouter.post('/login', validate({ body: loginSchema }), authenticateLocal, authController.login);
authRouter.get('/me', authenticate, authController.me);
