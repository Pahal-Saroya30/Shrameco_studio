import { dbConnect } from '@/lib/db/mongoose';
import { SocialAccount } from '@/models/SocialAccount';
import { memoryStore } from '@/lib/db/memoryStore';
import { apiCache, CACHE_TTL } from '@/lib/db/apiCache';

export async function getConnectedSocialAccount(userId: string, platform: string): Promise<any | null> {
	const cacheKey = `social_token:${userId}:${platform}`;
	const cachedAccount = apiCache.get<any>(cacheKey);
	if (cachedAccount) {
		return cachedAccount;
	}

	let account: any = null;
	try {
		await dbConnect();
		account = await SocialAccount.findOne({ userId, platform, connected: true }).lean();
	} catch (dbErr) {
		console.warn(`MongoDB connection failed in ${platform} account helper:`, dbErr);
	}

	if (!account) {
		const memAcc = memoryStore.socialAccounts.find(
			(a: any) => a.userId === userId && a.platform === platform && a.connected
		);
		if (memAcc) {
			account = {
				accessToken: memAcc.accessToken,
				accountId: memAcc.accountId,
				accountName: memAcc.accountName,
				avatarUrl: memAcc.avatarUrl,
			};
		}
	}

	if (account) {
		apiCache.set(cacheKey, account, CACHE_TTL.ACCOUNTS);
	}

	return account;
}

export function invalidateSocialAccountCache(userId: string, platform?: string): void {
	if (platform) {
		apiCache.clear(`social_token:${userId}:${platform}`);
	} else {
		['facebook', 'instagram', 'linkedin', 'youtube', 'x'].forEach((p) => {
			apiCache.clear(`social_token:${userId}:${p}`);
		});
	}
}
