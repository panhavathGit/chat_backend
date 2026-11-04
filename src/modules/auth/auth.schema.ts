import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email().toLowerCase(),
  // * bcrypt ignores everything after 72 bytes, so longer passwords would be silently truncated
  password: z.string().min(8).max(72),
  name: z.string().trim().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1),
});
