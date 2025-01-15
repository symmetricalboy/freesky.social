// For now, we can just make this a no-op function
async function setCacheWithTTL(key: string, value: any, ttlSeconds: number = 300) {
  // No-op - caching disabled
  return;
} 