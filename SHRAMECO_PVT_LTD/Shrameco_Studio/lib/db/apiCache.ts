/**
 * Server-side in-memory API response cache with TTL support.
 * Prevents repeated expensive external API calls (YouTube, Instagram, LinkedIn)
 * within short page navigation windows.
 */

interface CacheEntry<T> {
	value: T;
	expiresAt: number;
}

class ApiCache {
	private store = new Map<string, CacheEntry<unknown>>();

	get<T>(key: string): T | null {
		const entry = this.store.get(key) as CacheEntry<T> | undefined;
		if (!entry) return null;
		if (Date.now() > entry.expiresAt) {
			this.store.delete(key);
			return null;
		}
		return entry.value;
	}

	set<T>(key: string, value: T, ttlMs: number): void {
		this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
	}

	clear(key: string): void {
		this.store.delete(key);
	}

	clearForUser(userId: string): void {
		this.store.forEach((_, key) => {
			if (key.startsWith(userId + ':')) {
				this.store.delete(key);
			}
		});
	}
}

// Singleton — shared across all API route handlers in the same server process
export const apiCache = new ApiCache();

export const CACHE_TTL = {
	INSIGHTS: 3 * 60 * 1000,  // 3 minutes
	ACCOUNTS: 5 * 60 * 1000,  // 5 minutes
	SCHEDULE: 60 * 1000,       // 1 minute
} as const;
