// Fallback in-memory store for when MongoDB service is not running locally

export interface MemoryUser {
	id: string;
	email: string;
	passwordHash: string;
	createdAt: Date;
}

export interface MemoryBrandProfile {
	userId: string;
	companyName: string;
	industry: string;
	brandVoice: string;
	contentPillars: string[];
	bannedTopics: string[];
	bannedWords: string[];
	logoUrl?: string;
	colorPalette: string[];
	typography: {
		heading: string;
		body: string;
	};
	updatedAt: Date;
}

export interface MemoryContentItem {
	_id: string;
	userId: string;
	topic: string;
	platform: 'instagram' | 'linkedin' | 'x';
	generatedText: string;
	templateId: string;
	renderedImageUrl?: string;
	status: 'draft' | 'final';
	createdAt: Date;
	updatedAt: Date;
}

class MemoryStore {
	public users: MemoryUser[] = [];
	public brandProfiles: Map<string, MemoryBrandProfile> = new Map();
	public contentItems: MemoryContentItem[] = [];

	findUserByEmail(email: string) {
		return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
	}

	createUser(email: string, passwordHash: string) {
		const user: MemoryUser = {
			id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
			email: email.toLowerCase().trim(),
			passwordHash,
			createdAt: new Date(),
		};
		this.users.push(user);
		return user;
	}

	getBrandProfile(userId: string) {
		return this.brandProfiles.get(userId) || null;
	}

	upsertBrandProfile(userId: string, data: Partial<MemoryBrandProfile>) {
		const existing = this.brandProfiles.get(userId);
		const profile: MemoryBrandProfile = {
			userId,
			companyName: data.companyName || existing?.companyName || 'Acme Studio',
			industry: data.industry || existing?.industry || 'Technology',
			brandVoice: data.brandVoice || existing?.brandVoice || 'Professional & Visionary',
			contentPillars: data.contentPillars || existing?.contentPillars || ['Innovation'],
			bannedTopics: data.bannedTopics || existing?.bannedTopics || [],
			bannedWords: data.bannedWords || existing?.bannedWords || [],
			logoUrl: data.logoUrl ?? existing?.logoUrl ?? '',
			colorPalette: data.colorPalette || existing?.colorPalette || ['#0B0F19', '#6366F1', '#10B981'],
			typography: data.typography || existing?.typography || { heading: 'Outfit', body: 'Inter' },
			updatedAt: new Date(),
		};
		this.brandProfiles.set(userId, profile);
		return profile;
	}

	addContentItem(userId: string, item: Omit<MemoryContentItem, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) {
		const newItem: MemoryContentItem = {
			...item,
			_id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
			userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		this.contentItems.unshift(newItem);
		return newItem;
	}

	getContentItems(userId: string) {
		return this.contentItems.filter((i) => i.userId === userId);
	}

	deleteContentItem(userId: string, itemId: string) {
		const index = this.contentItems.findIndex((i) => i.userId === userId && i._id === itemId);
		if (index !== -1) {
			this.contentItems.splice(index, 1);
			return true;
		}
		return false;
	}

	public socialAccounts: Array<{ userId: string; platform: string; accountName: string; connected: boolean; accessToken?: string; accountId?: string; scopes?: string[] }> = [];

	getSocialAccounts(userId: string) {
		return this.socialAccounts.filter((a) => a.userId === userId && a.connected);
	}

	upsertSocialAccount(userId: string, platform: string, accountName: string, accessToken?: string, accountId?: string, scopes?: string[]) {
		const existing = this.socialAccounts.find((a) => a.userId === userId && a.platform === platform);
		if (existing) {
			existing.accountName = accountName;
			existing.connected = true;
			if (accessToken) existing.accessToken = accessToken;
			if (accountId) existing.accountId = accountId;
			if (scopes) existing.scopes = scopes;
		} else {
			this.socialAccounts.push({ userId, platform, accountName, connected: true, accessToken, accountId, scopes });
		}
	}

	deleteSocialAccount(userId: string, platform: string) {
		const index = this.socialAccounts.findIndex((a) => a.userId === userId && a.platform === platform);
		if (index !== -1) {
			this.socialAccounts.splice(index, 1);
		}
	}
}

// Global instance so data persists across Next.js dev API requests
const globalForMemory = global as unknown as { memoryStore: MemoryStore };
if (!globalForMemory.memoryStore || typeof globalForMemory.memoryStore.upsertSocialAccount !== 'function') {
	globalForMemory.memoryStore = new MemoryStore();
}
export const memoryStore = globalForMemory.memoryStore;

