import { Router } from 'express';
import { prisma } from '@config/database.js';
import { authenticate } from '@shared/middleware/auth.middleware.js';
import { validate } from '@shared/middleware/validate.middleware.js';
import { PostController } from './post.controller.js';
import { PostRepository } from './post.repository.js';
import { PostService } from './post.service.js';
import { createPostSchema, listPostsQuerySchema, postIdParamSchema, updatePostSchema } from './post.schema.js';

const postRepository = new PostRepository(prisma);
const postService = new PostService(postRepository);
const postController = new PostController(postService);

export const postRouter = Router();

postRouter.use(authenticate);

postRouter.post('/', validate({ body: createPostSchema }), postController.create);
postRouter.get('/', validate({ query: listPostsQuerySchema }), postController.list);
postRouter.get('/:id', validate({ params: postIdParamSchema }), postController.getById);
postRouter.patch('/:id', validate({ params: postIdParamSchema, body: updatePostSchema }), postController.update);
postRouter.delete('/:id', validate({ params: postIdParamSchema }), postController.remove);
