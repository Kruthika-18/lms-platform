import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { eq, and, isNull, lt } from 'drizzle-orm';
import { db } from '../../db';
import { users, refreshTokens } from '../../db/schema';
import { redis } from '../../lib/redis';
import { AppError, Errors } from '../../lib/errors';
import type { FastifyInstance } from 'fastify';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY  = process.env.JWT_ACCESS_EXPIRY  ?? '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY ?? '7d';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class AuthService {
  constructor(private fastify: FastifyInstance) {}

  async register(email: string, password: string, name: string) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });
    if (existing) throw Errors.conflict('Email already registered');

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [user] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      name,
    }).returning();

    return user;
  }

  async login(email: string, password: string) {
    const user = await db.query.users.findFirst({
      where: and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)),
    });
    if (!user || !user.passwordHash) throw Errors.unauthorized();

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw Errors.unauthorized();

    // Update last active
    await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));

    return user;
  }

  async issueTokens(userId: string) {
    const accessToken = this.fastify.jwt.sign(
      { sub: userId },
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );

    // Refresh token: random opaque token stored as hash
    const rawRefreshToken = nanoid(64);
    const tokenHash = await bcrypt.hash(rawRefreshToken, 10);
    const familyId = nanoid(32);

    await db.insert(refreshTokens).values({
      userId,
      tokenHash,
      familyId,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });

    return { accessToken, rawRefreshToken };
  }

  async rotateRefreshToken(rawToken: string) {
    // Find matching token by checking all non-revoked tokens for this hash
    // (we store bcrypt hashes so we must check all non-expired tokens)
    const now = new Date();
    const candidates = await db.query.refreshTokens.findMany({
      where: and(isNull(refreshTokens.revokedAt), lt(now, refreshTokens.expiresAt)),
    });

    let matched: typeof candidates[0] | undefined;
    for (const candidate of candidates) {
      const ok = await bcrypt.compare(rawToken, candidate.tokenHash);
      if (ok) { matched = candidate; break; }
    }

    if (!matched) throw Errors.unauthorized();

    // Check for reuse attack — if token already replaced, revoke entire family
    if (matched.replacedBy) {
      await db.update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.familyId, matched.familyId));
      throw Errors.unauthorized();
    }

    // Issue new pair
    const newRaw = nanoid(64);
    const newHash = await bcrypt.hash(newRaw, 10);

    // Rotate: mark old as replaced, insert new
    await db.transaction(async (tx) => {
      const [newToken] = await tx.insert(refreshTokens).values({
        userId:    matched!.userId,
        tokenHash: newHash,
        familyId:  matched!.familyId,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      }).returning();

      await tx.update(refreshTokens)
        .set({ replacedBy: newToken.id })
        .where(eq(refreshTokens.id, matched!.id));
    });

    const accessToken = this.fastify.jwt.sign(
      { sub: matched.userId },
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );

    return { accessToken, rawRefreshToken: newRaw };
  }

  async revokeRefreshToken(rawToken: string) {
    const candidates = await db.query.refreshTokens.findMany({
      where: isNull(refreshTokens.revokedAt),
    });
    for (const candidate of candidates) {
      const ok = await bcrypt.compare(rawToken, candidate.tokenHash);
      if (ok) {
        await db.update(refreshTokens)
          .set({ revokedAt: new Date() })
          .where(eq(refreshTokens.id, candidate.id));
        return;
      }
    }
  }

  async revokeAllUserTokens(userId: string) {
    await db.update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
    // Also blacklist access tokens via Redis (set with remaining TTL)
    await redis.setex(`blacklist:user:${userId}`, 60 * 15, '1');
  }
}
