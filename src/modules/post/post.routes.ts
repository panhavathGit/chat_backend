import { Router } from 'express';
import { authenticate } from '@shared/middleware/auth.middleware.js';
import { validate } from '@shared/middleware/validate.middleware.js';
import { postController } from './post.controller.js';
import { createPostSchema, listPostsQuerySchema, postIdParamSchema, updatePostSchema } from './post.schema.js';

export const postRouter = Router();

postRouter.use(authenticate);

postRouter.post('/', validate({ body: createPostSchema }), postController.create);
postRouter.get('/', validate({ query: listPostsQuerySchema }), postController.list);
postRouter.get('/:id', validate({ params: postIdParamSchema }), postController.getById);
postRouter.patch('/:id', validate({ params: postIdParamSchema, body: updatePostSchema }), postController.update);
postRouter.delete('/:id', validate({ params: postIdParamSchema }), postController.remove);
