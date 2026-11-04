import type { Request, Response } from 'express';
import { getAuthUser } from '@shared/middleware/auth.middleware.js';
import { postService } from './post.service.js';
import type { CreatePostInput, ListPostsQuery, PostIdParam, UpdatePostInput } from './post.schema.js';

export const postController = {
  async create(req: Request, res: Response) {
    const post = await postService.create(getAuthUser(req).id, req.body as CreatePostInput);
    res.status(201).json({ status: 'success', data: post });
  },

  async list(req: Request, res: Response) {
    const { items, meta } = await postService.list(getAuthUser(req).id, req.query as unknown as ListPostsQuery);
    res.status(200).json({ status: 'success', data: items, meta });
  },

  async getById(req: Request, res: Response) {
    const { id } = req.params as PostIdParam;
    const post = await postService.getById(getAuthUser(req).id, id);
    res.status(200).json({ status: 'success', data: post });
  },

  async update(req: Request, res: Response) {
    const { id } = req.params as PostIdParam;
    const post = await postService.update(getAuthUser(req).id, id, req.body as UpdatePostInput);
    res.status(200).json({ status: 'success', data: post });
  },

  async remove(req: Request, res: Response) {
    const { id } = req.params as PostIdParam;
    await postService.remove(getAuthUser(req).id, id);
    res.status(204).send();
  },
};
