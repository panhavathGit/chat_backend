import type { DatabaseClient } from '@config/database.js';

export const publicUserSelect = {
  id: true,
  email: true,
  name: true,
} as const;

export class AuthRepository {
  constructor(private readonly db: DatabaseClient) {}

  // ? Includes passwordHash — only use for credential checks, never return it to the client
  findByEmailWithPassword(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email }, select: publicUserSelect });
  }

  findById(id: string) {
    return this.db.user.findUnique({ where: { id }, select: publicUserSelect });
  }

  create(data: { email: string; passwordHash: string; name?: string | undefined }) {
    return this.db.user.create({
      data: { email: data.email, passwordHash: data.passwordHash, name: data.name ?? null },
      select: publicUserSelect,
    });
  }
}
