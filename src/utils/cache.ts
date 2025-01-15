async function setCacheWithTTL(key: string, value: any, ttlSeconds: number = 300) {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
} 