import type { DatabaseClient } from '@config/database.js';

// * Only these columns ever reach the client; a new column stays private until it is added here
export const postSelect = {
  id: true,
  title: true,
  content: true,
  published: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class PostRepository {
  constructor(private readonly db: DatabaseClient) {}

  create(authorId: string, data: any) {
    return this.db.post.create({
      data: {
        title: data.title,
        content: data.content ?? null,
        published: data.published ?? false,
        authorId,
      },
      select: postSelect,
    });
  }

  findById(id: string) {
    return this.db.post.findUnique({ where: { id }, select: postSelect });
  }

  async findManyByAuthor(authorId: string, { skip, take }: { skip: number; take: number }) {
    const where = { authorId };
    const [items, total] = await this.db.$transaction([
      this.db.post.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, select: postSelect }),
      this.db.post.count({ where }),
    ]);
    return { items, total };
  }

  update(id: string, data: any) {
    return this.db.post.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.published !== undefined && { published: data.published }),
      },
      select: postSelect,
    });
  }

  delete(id: string) {
    return this.db.post.delete({ where: { id }, select: postSelect });
  }
}
