import type { Request, Response } from 'express';
import { getAuthUser } from '@shared/middleware/auth.middleware.js';
import type { PostService } from './post.service.js';

// * Handlers are arrow-function properties so `this` stays bound when passed to the router
export class PostController {
  constructor(private readonly postService: PostService) {}

  create = async (req: Request, res: Response) => {
    const post = await this.postService.create(getAuthUser(req).id, req.body);
    res.status(201).json({ status: 'success', data: post });
  };

  list = async (req: Request, res: Response) => {
    const { items, meta } = await this.postService.list(getAuthUser(req).id, req.query);
    res.status(200).json({ status: 'success', data: items, meta });
  };

  getById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const post = await this.postService.getById(getAuthUser(req).id, id);
    res.status(200).json({ status: 'success', data: post });
  };

  update = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const post = await this.postService.update(getAuthUser(req).id, id, req.body);
    res.status(200).json({ status: 'success', data: post });
  };

  remove = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await this.postService.remove(getAuthUser(req).id, id);
    res.status(204).send();
  };
}
