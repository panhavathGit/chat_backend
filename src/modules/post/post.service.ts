import { ForbiddenError, NotFoundError } from '@shared/errors/AppError.js';
import { postRepository } from './post.repository.js';
import type { CreatePostInput, ListPostsQuery, UpdatePostInput } from './post.schema.js';

const findOwnedPost = async (userId: string, postId: string) => {
  const post = await postRepository.findById(postId);
  if (!post) throw new NotFoundError('Post not found');
  if (post.authorId !== userId) throw new ForbiddenError('You can only modify your own posts');
  return post;
};

export const postService = {
  create(userId: string, input: CreatePostInput) {
    return postRepository.create(userId, input);
  },

  async list(userId: string, { page, size }: ListPostsQuery) {
    const { items, total } = await postRepository.findManyByAuthor(userId, {
      skip: (page - 1) * size,
      take: size,
    });
    return { items, meta: { total, page, size, totalPages: Math.ceil(total / size) } };
  },

  async getById(userId: string, postId: string) {
    const post = await postRepository.findById(postId);
    // * Other users' drafts return 404 rather than 403 so their existence isn't revealed
    if (!post || (post.authorId !== userId && !post.published)) {
      throw new NotFoundError('Post not found');
    }
    return post;
  },

  async update(userId: string, postId: string, input: UpdatePostInput) {
    await findOwnedPost(userId, postId);
    return postRepository.update(postId, input);
  },

  async remove(userId: string, postId: string) {
    await findOwnedPost(userId, postId);
    await postRepository.delete(postId);
  },
};
