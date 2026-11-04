import { Router } from 'express';
import { authRouter } from '@modules/auth/index.js';
import { postRouter } from '@modules/post/index.js';

export const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/posts', postRouter);
