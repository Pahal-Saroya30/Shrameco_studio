import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { SocialAccount } from '@/models/SocialAccount';
import { getAuthSession } from '@/lib/auth/jwt';
import { memoryStore } from '@/lib/db/memoryStore';
import { facebookService } from '@/lib/social/facebook';
import { apiCache, CACHE_TTL } from '@/lib/db/apiCache';
import { getConnectedSocialAccount } from '@/lib/db/socialAccountHelper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	const searchParams = req.nextUrl.searchParams;
	const since = searchParams.get('since') || undefined;
	const until = searchParams.get('until') || undefined;

	const fallbackData = {
		channelName: "Facebook Test Page",
		channelAvatar: "",
		followers: 2156,
		postsCount: 5,
		views: 12480,
		reactions: 885,
		comments: 156,
		engagementRate: 8.34,
		posts: [
			{
				id: 'demo_fb_1',
				type: 'post',
				title: 'Announcing Shrameco AI Studio — the ultimate automated content manager for brands... 🚀',
				message: 'Announcing Shrameco AI Studio — the ultimate automated content manager for brands...',
				publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
				createdTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
				thumbnail: '',
				views: null,
				reactions: 284,
				comments: 42,
				shares: 12,
				engagementRate: 8.2,
				postUrl: 'https://facebook.com',
				permalink: 'https://facebook.com',
			},
			{
				id: 'demo_fb_2',
				type: 'reel',
				title: 'What tone describes your brand best? Watch our video reel! 🎨',
				message: 'What tone describes your brand best? Watch our video reel!',
				publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
				createdTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
				thumbnail: '',
				views: 3100,
				reactions: 156,
				comments: 68,
				shares: 8,
				engagementRate: 7.5,
				postUrl: 'https://facebook.com',
				permalink: 'https://facebook.com',
			},
			{
				id: 'demo_fb_3',
				type: 'carousel',
				title: 'Behind the scenes: 3 distinct caption variations with AI...',
				message: 'Behind the scenes: 3 distinct caption variations with AI...',
				publishedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
				createdTime: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
				thumbnail: '',
				mediaCount: 3,
				views: null,
				reactions: 342,
				comments: 56,
				shares: 15,
				engagementRate: 5.1,
				postUrl: 'https://facebook.com',
				permalink: 'https://facebook.com',
			}
		],
		partialErrors: [],
	};

	let userId = '';
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		userId = session.userId;

		const cacheKey = `${userId}:facebook_insights:${since || ''}:${until || ''}`;
		const cached = apiCache.get<any>(cacheKey);
		if (cached) {
			return NextResponse.json({ insights: cached, partialErrors: cached.partialErrors || [] });
		}

		// Load credentials with short-lived TTL memory cache
		const account = await getConnectedSocialAccount(session.userId, 'facebook');

		if (!account || !account.accessToken || account.accountId === 'demo_fb_account_id') {
			apiCache.set(cacheKey, fallbackData, CACHE_TTL.INSIGHTS);
			return NextResponse.json({ insights: fallbackData, partialErrors: [] });
		}

		try {
			const rawInsights = await facebookService.getInsights!(account.accessToken, account.accountId, since, until);
			
			const mappedPosts = (rawInsights.media || []).map((item: any) => {
				return {
					id: item.id,
					type: item.type || 'post',
					title: item.title || item.message || 'Untitled Post',
					message: item.message || '',
					publishedAt: item.publishedAt || item.createdTime || new Date().toISOString(),
					createdTime: item.createdTime || item.publishedAt || new Date().toISOString(),
					thumbnail: item.thumbnail || '',
					mediaCount: item.mediaCount,
					views: item.views !== undefined ? item.views : null,
					reactions: item.reactions || 0,
					comments: item.comments || 0,
					shares: item.shares || 0,
					engagementRate: parseFloat((item.engagementRate || 0).toFixed(2)),
					postUrl: item.permalink || item.postUrl || '',
					permalink: item.permalink || item.postUrl || '',
					isEphemeral: Boolean(item.isEphemeral),
				};
			});

			const insightsData = {
				channelName: account.accountName || rawInsights.channelName || 'Facebook Page',
				channelAvatar: account.avatarUrl || rawInsights.channelAvatar || '',
				followers: rawInsights.followers || 0,
				postsCount: mappedPosts.length,
				views: rawInsights.totalViews || 0,
				reactions: rawInsights.totalLikes || 0,
				comments: rawInsights.totalComments || 0,
				engagementRate: rawInsights.avgEngagementRate || 0,
				posts: mappedPosts,
				partialErrors: rawInsights.partialErrors || [],
			};

			apiCache.set(cacheKey, insightsData, CACHE_TTL.INSIGHTS);
			return NextResponse.json({ insights: insightsData, partialErrors: insightsData.partialErrors });
		} catch (apiErr) {
			console.error('Failed to fetch real-time Facebook insights from API:', apiErr);
			apiCache.set(cacheKey, fallbackData, CACHE_TTL.INSIGHTS);
			return NextResponse.json({ insights: fallbackData, partialErrors: ['Failed to fetch live Graph API data'] });
		}
	} catch (error: any) {
		console.error('Error loading live Facebook insights:', error);
		return NextResponse.json({ insights: fallbackData, partialErrors: ['Internal server error'] });
	}
}

