import { db } from '../db';
import { users } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { cache, cacheKeys } from '../lib/redis';

export const XP_VALUES = {
  lessonComplete:  10,
  quizPass:        25,
  courseComplete: 200,
  dailyLogin:       5,
  streakWeek:     100,
} as const;

export type XPEvent = keyof typeof XP_VALUES;

export async function awardXp(userId: string, event: XPEvent): Promise<number> {
  const amount = XP_VALUES[event];

  // Atomic increment
  await db.execute(sql`
    UPDATE users
    SET xp = xp + ${amount}, updated_at = NOW()
    WHERE id = ${userId}
  `);

  // Invalidate cache
  await cache.del(cacheKeys.userProfile(userId));

  // Return new XP total
  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { xp: true },
  });

  return row?.xp ?? 0;
}

export async function updateStreak(userId: string): Promise<number> {
  // Check if user already has an activity today
  const today = new Date().toISOString().split('T')[0];
  const lastActiveKey = `streak:last:${userId}`;
  const lastActive = await cache.get<string>(lastActiveKey);

  if (lastActive === today) {
    // Already counted today
    const row = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { streak: true } });
    return row?.streak ?? 0;
  }

  // Increment streak
  const result = await db.execute(sql`
    UPDATE users
    SET
      streak = CASE
        WHEN last_active_at >= NOW() - INTERVAL '2 days' THEN streak + 1
        ELSE 1
      END,
      last_active_at = NOW(),
      updated_at = NOW()
    WHERE id = ${userId}
    RETURNING streak
  `);

  const newStreak = (result.rows[0] as any)?.streak ?? 1;

  // Cache today's activity (expires at midnight)
  const secondsUntilMidnight = 86400 - (Date.now() / 1000 % 86400);
  await cache.set(lastActiveKey, today, Math.round(secondsUntilMidnight));
  await cache.del(cacheKeys.userProfile(userId));

  // Award streak bonuses
  if (newStreak === 7)  await awardXp(userId, 'streakWeek');
  if (newStreak === 30) await awardXp(userId, 'streakWeek'); // same bonus at 30

  return newStreak;
}
