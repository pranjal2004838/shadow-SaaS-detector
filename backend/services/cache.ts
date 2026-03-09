// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private ttl: number; // milliseconds

  constructor(ttlSeconds: number = 300) {
    // Default 5 minutes
    this.ttl = ttlSeconds * 1000;
  }

  set(key: string, data: T): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + this.ttl,
    });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    // Clean expired entries
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
    return this.store.size;
  }
}

// Global cache instances
export const riskAssessmentCache = new Cache(300); // 5 minutes
export const consolidationCache = new Cache(300); // 5 minutes
export const complianceReportCache = new Cache(600); // 10 minutes

export { Cache };
