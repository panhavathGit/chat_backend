import { prisma } from '@config/database.js';
import type { CreatePostInput, UpdatePostInput } from './post.schema.js';

export const postRepository = {
  create(authorId: string, data: CreatePostInput) {
    return prisma.post.create({
      data: {
        title: data.title,
        content: data.content ?? null,
        published: data.published ?? false,
        authorId,
      },
    });
  },

  findById(id: string) {
    return prisma.post.findUnique({ where: { id } });
  },

  async findManyByAuthor(authorId: string, { skip, take }: { skip: number; take: number }) {
    const where = { authorId };
    const [items, total] = await prisma.$transaction([
      prisma.post.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.post.count({ where }),
    ]);
    return { items, total };
  },

  update(id: string, data: UpdatePostInput) {
    return prisma.post.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.published !== undefined && { published: data.published }),
      },
    });
  },

  delete(id: string) {
    return prisma.post.delete({ where: { id } });
  },
};
