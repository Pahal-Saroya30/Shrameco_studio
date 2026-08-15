// Fallback in-memory store for when MongoDB service is not running locally
import { CarouselAsset } from '@/lib/social/carousel';

export interface MemoryUser {
	id: string;
	name?: string;
	email: string;
	passwordHash: string;
	companyName?: string;
	resetTokenHash?: string;
	resetTokenExpires?: Date;
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
	slogan?: string;
	cta?: string;
	socialHandle?: string;
	logoPosition?: string;
	updatedAt: Date;
}

export interface MemoryContentItem {
	_id: string;
	userId: string;
	topic: string;
	platform: 'instagram' | 'linkedin' | 'x' | 'facebook' | 'youtube';
	generatedText: string;
	templateId: string;
	renderedImageUrl?: string;
	status: 'draft' | 'final';
	createdAt: Date;
	updatedAt: Date;
}

export interface MemoryScheduledPost {
	_id: string;
	userId: string;
	platform: 'instagram' | 'linkedin' | 'x' | 'facebook' | 'youtube';
	caption: string;
	imageUrl?: string;
	format: string;
	status: 'queued' | 'sent' | 'failed' | 'draft';
	scheduledAt: Date;
	publishOption: 'next_available' | 'prioritize' | 'now' | 'custom';
	postUrl?: string;
	createdAt: Date;
	updatedAt: Date;
}

class MemoryStore {
	public users: MemoryUser[] = [];
	public brandProfiles: Map<string, MemoryBrandProfile> = new Map();
	public contentItems: MemoryContentItem[] = [];
	public scheduledPosts: MemoryScheduledPost[] = [];
	public carouselAssets: Map<string, CarouselAsset> = new Map();

	constructor() {
		this.seedMockData();
	}

	private seedMockData() {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(11, 30, 0, 0);

		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		yesterday.setHours(20, 34, 0, 0);

		this.scheduledPosts = [
			{
				_id: 'sched_mock_1',
				userId: 'bypass_user_123',
				platform: 'youtube',
				caption: 'Valorant clutches gone wild!\n\nUnbelievable valorant clutches you must see! Check out these crazy clips from last week\'s tournaments. Real skill or pure luck? You decide!\n\n#valorant #gaming #clutch',
				imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=640&auto=format&fit=crop',
				format: 'video',
				status: 'queued',
				scheduledAt: tomorrow,
				publishOption: 'custom',
				createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 mins ago
				updatedAt: new Date(),
			},
			{
				_id: 'sched_mock_2',
				userId: 'bypass_user_123',
				platform: 'youtube',
				caption: 'Valorant compilations\n\nDive into the chaotic world of Valorant with this side-splitting compilation of ragebaiting gone wrong... and sometimes surprisingly right! Watch as our skilled (and sometimes mischievous) players push the limits of their teammates\' patience, leading to...\n\n#automation #socialmedia #marketing',
				imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=640&auto=format&fit=crop',
				format: 'video',
				status: 'sent',
				scheduledAt: yesterday,
				publishOption: 'custom',
				postUrl: '/feed-preview?platform=youtube&accountName=Shui&caption=Valorant%20Ragebait',
				createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
				updatedAt: new Date(),
			}
		];

		this.socialAccounts = [
			{
				userId: 'bypass_user_123',
				platform: 'youtube',
				accountName: 'Shui',
				connected: true,
				accountId: 'UCkiy9fiA0HJC0R4KSaW68tg',
				avatarUrl: 'https://yt3.ggpht.com/ytc/AIdro_nuNlfceTDiBSTQUhxQ56YDJFbBu1DjRfTpJMFP6ck9D0x3tsglom8eMUA2blBLpRVU8w=s88-c-k-c0x00ffffff-no-rj'
			}
		];
	}

	getScheduledPosts(userId: string) {
		return this.scheduledPosts.filter((p) => p.userId === userId);
	}

	addScheduledPost(userId: string, item: Omit<MemoryScheduledPost, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) {
		const newPost: MemoryScheduledPost = {
			...item,
			_id: 'sched_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
			userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		this.scheduledPosts.push(newPost);
		this.scheduledPosts.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
		return newPost;
	}

	deleteScheduledPost(userId: string, id: string) {
		const index = this.scheduledPosts.findIndex((p) => p.userId === userId && p._id === id);
		if (index !== -1) {
			this.scheduledPosts.splice(index, 1);
			return true;
		}
		return false;
	}

	updateScheduledPostStatus(userId: string, id: string, status: 'queued' | 'sent' | 'failed' | 'draft', postUrl?: string) {
		const post = this.scheduledPosts.find((p) => p.userId === userId && p._id === id);
		if (post) {
			post.status = status;
			if (postUrl) post.postUrl = postUrl;
			post.updatedAt = new Date();
			return post;
		}
		return null;
	}

	findUserByEmail(email: string) {
		return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
	}

	createUser(email: string, passwordHash: string, companyName?: string, name?: string) {
		const user: MemoryUser = {
			id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
			name: name || '',
			email: email.toLowerCase().trim(),
			passwordHash,
			companyName,
			createdAt: new Date(),
		};
		this.users.push(user);
		return user;
	}

	getBrandProfile(userId: string) {
		let profile = this.brandProfiles.get(userId);
		if (!profile && process.env.NODE_ENV === 'development') {
			profile = {
				userId,
				companyName: 'Shrameco Auto Studio',
				industry: 'SaaS, Creator Marketing, AI Video Tools',
				brandVoice: 'Authoritative, witty, visionary, highly technical, concise, bold',
				contentPillars: ['Automation', 'Marketing', 'Speed', 'Productivity'],
				bannedTopics: [],
				bannedWords: [],
				logoUrl: '',
				colorPalette: ['#0B0F19', '#6366F1', '#10B981'],
				typography: { heading: 'Outfit', body: 'Inter' },
				slogan: 'Build in public, scale with speed',
				cta: 'shrameco.com/studio',
				socialHandle: '@shrameco_studio',
				updatedAt: new Date(),
			};
			this.brandProfiles.set(userId, profile);
		}
		return profile || null;
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
			slogan: data.slogan ?? existing?.slogan ?? '',
			cta: data.cta ?? existing?.cta ?? '',
			socialHandle: data.socialHandle ?? existing?.socialHandle ?? '',
			logoPosition: data.logoPosition ?? existing?.logoPosition ?? 'top-right',
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

	public socialAccounts: Array<{ 
		userId: string; 
		platform: string; 
		accountName: string; 
		connected: boolean;
		accountId?: string;
		accessToken?: string;
		refreshToken?: string;
		expiresAt?: Date;
		avatarUrl?: string;
	}> = [];

	getSocialAccounts(userId: string) {
		return this.socialAccounts.filter((a) => a.userId === userId && a.connected);
	}

	upsertSocialAccount(
		userId: string, 
		platform: string, 
		accountName: string, 
		accountId?: string, 
		accessToken?: string, 
		refreshToken?: string, 
		expiresAt?: Date,
		avatarUrl?: string
	) {
		const existing = this.socialAccounts.find((a) => a.userId === userId && a.platform === platform);
		if (existing) {
			existing.accountName = accountName;
			existing.connected = true;
			if (accountId) existing.accountId = accountId;
			if (accessToken) existing.accessToken = accessToken;
			if (refreshToken) existing.refreshToken = refreshToken;
			if (expiresAt) existing.expiresAt = expiresAt;
			if (avatarUrl) existing.avatarUrl = avatarUrl;
		} else {
			this.socialAccounts.push({ 
				userId, 
				platform, 
				accountName, 
				connected: true,
				accountId,
				accessToken,
				refreshToken,
				expiresAt,
				avatarUrl
			});
		}
	}

	deleteSocialAccount(userId: string, platform: string) {
		const index = this.socialAccounts.findIndex((a) => a.userId === userId && a.platform === platform);
		if (index !== -1) {
			this.socialAccounts.splice(index, 1);
		}
	}

	setCarouselAsset(userId: string, asset: CarouselAsset) {
		this.carouselAssets.set(userId, asset);
	}

	getCarouselAsset(userId: string): CarouselAsset | undefined {
		return this.carouselAssets.get(userId);
	}
}

// Global instance so data persists across Next.js dev API requests
const globalForMemory = global as unknown as { memoryStore: MemoryStore };
if (process.env.NODE_ENV === 'development') {
	const existingAccounts = globalForMemory.memoryStore?.socialAccounts || [];
	const existingScheduled = globalForMemory.memoryStore?.scheduledPosts || [];
	globalForMemory.memoryStore = new MemoryStore();
	globalForMemory.memoryStore.socialAccounts = existingAccounts;
	globalForMemory.memoryStore.scheduledPosts = existingScheduled;
} else if (!globalForMemory.memoryStore) {
	globalForMemory.memoryStore = new MemoryStore();
}
export const memoryStore = globalForMemory.memoryStore;

