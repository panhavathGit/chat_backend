import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(10_000).optional(),
  published: z.boolean().optional(),
});

export const updatePostSchema = createPostSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field to update' });

export const postIdParamSchema = z.object({
  id: z.uuid(),
});

export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
});
