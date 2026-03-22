import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../../db';
import { users } from '../../db/schema';
import { cache, cacheKeys } from '../../lib/redis';
import { Errors } from '../../lib/errors';
import { emailQueue } from '../../workers/queues';

export class UserService {
  async getProfile(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { passwordHash: false },
    });
    if (!user) throw Errors.notFound('User');
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; bio?: string; title?: string }) {
    const [updated] = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role, plan: users.plan, xp: users.xp, streak: users.streak });

    await cache.del(cacheKeys.userProfile(userId));
    return updated;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user?.passwordHash) throw Errors.unauthorized();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw Errors.validation('Current password is incorrect');

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Queue notification email
    await emailQueue.add('send', {
      to:      user.email,
      subject: 'Your LearnHub password was changed',
      html:    `<p>Hi ${user.name},</p><p>Your password was just changed. If this wasn't you, contact support immediately.</p>`,
    });
  }

  async awardXp(userId: string, amount: number) {
    await db.update(users)
      .set({ xp: db.$count(users, eq(users.id, userId)) })
      .where(eq(users.id, userId));
    // Simpler approach:
    await db.execute(
      `UPDATE users SET xp = xp + ${amount} WHERE id = '${userId}'`
    );
    await cache.del(cacheKeys.userProfile(userId));
  }
}
