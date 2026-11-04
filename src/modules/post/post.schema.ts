import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(10_000).optional(),
  published: z.boolean().optional(),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = createPostSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field to update' });
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const postIdParamSchema = z.object({
  id: z.uuid(),
});

export type PostIdParam = z.infer<typeof postIdParamSchema>;

export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
