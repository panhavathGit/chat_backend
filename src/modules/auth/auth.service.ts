import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '@config/env.js';
import { ConflictError } from '@shared/errors/AppError.js';
import type { AuthRepository } from './auth.repository.js';

const BCRYPT_ROUNDS = 10;

// * Compared against when the email doesn't exist, so login takes the same time either way
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async register(input: any) {
    const existing = await this.authRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('Email is already registered');

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await this.authRepository.create({ email: input.email, passwordHash, name: input.name });

    return { user, accessToken: this.issueToken(user) };
  }

  async verifyCredentials(email: string, password: string): Promise<Express.User | null> {
    const user = await this.authRepository.findByEmailWithPassword(email.toLowerCase());
    const isValid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !isValid) return null;

    return { id: user.id, email: user.email, name: user.name };
  }

  findUserById(id: string): Promise<Express.User | null> {
    return this.authRepository.findById(id);
  }

  issueToken(user: Express.User) {
    return jwt.sign({ sub: user.id }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: env.JWT_EXPIRES_IN as NonNullable<SignOptions['expiresIn']>,
    });
  }
}
