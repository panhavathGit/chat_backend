import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '@config/env.js';
import { ConflictError } from '@shared/errors/AppError.js';
import { authRepository } from './auth.repository.js';
import type { RegisterInput } from './auth.schema.js';

const BCRYPT_ROUNDS = 10;

// * Compared against when the email doesn't exist, so login takes the same time either way
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

export const authService = {
  async register(input: RegisterInput) {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('Email is already registered');

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await authRepository.create({ email: input.email, passwordHash, name: input.name });

    return { user, accessToken: authService.issueToken(user) };
  },

  async verifyCredentials(email: string, password: string): Promise<Express.User | null> {
    const user = await authRepository.findByEmailWithPassword(email.toLowerCase());
    const isValid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !isValid) return null;

    return { id: user.id, email: user.email, name: user.name };
  },

  issueToken(user: Express.User) {
    return jwt.sign({ sub: user.id }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: env.JWT_EXPIRES_IN as NonNullable<SignOptions['expiresIn']>,
    });
  },
};
