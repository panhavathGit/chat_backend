import { prisma } from '@config/database.js';

export const publicUserSelect = {
  id: true,
  email: true,
  name: true,
} as const;

export const authRepository = {
  // ? Includes passwordHash — only use for credential checks, never return it to the client
  findByEmailWithPassword(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email }, select: publicUserSelect });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  },

  create(data: { email: string; passwordHash: string; name?: string | undefined }) {
    return prisma.user.create({
      data: { email: data.email, passwordHash: data.passwordHash, name: data.name ?? null },
      select: publicUserSelect,
    });
  },
};
