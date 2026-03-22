import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: () => null,
});

redis.on('error', () => {});

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const val = await redis.get(key);
      return val ? (JSON.parse(val) as T) : null;
    } catch { return null; }
  },
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const s = JSON.stringify(value);
      if (ttlSeconds) await redis.setex(key, ttlSeconds, s);
      else await redis.set(key, s);
    } catch {}
  },
  async del(...keys: string[]): Promise<void> {
    try { if (keys.length) await redis.del(...keys); } catch {}
  },
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length) await redis.del(...keys);
    } catch {}
  },
};

export const cacheKeys = {
  course:         (id: string)               => `course:${id}`,
  courseBySlug:   (slug: string)             => `course:slug:${slug}`,
  courseList:     (cursor?: string)          => `courses:list:${cursor ?? 'first'}`,
  userProfile:    (id: string)               => `user:${id}`,
  enrollment:     (uid: string, cid: string) => `enrollment:${uid}:${cid}`,
  courseProgress: (uid: string, cid: string) => `progress:course:${uid}:${cid}`,
  leaderboard:    (courseId: string)         => `leaderboard:${courseId}`,
  dashboardStats: ()                         => 'admin:stats',
};