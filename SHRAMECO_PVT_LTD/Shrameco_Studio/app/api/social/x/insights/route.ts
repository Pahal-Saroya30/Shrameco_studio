import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { SocialAccount } from '@/models/SocialAccount';
import { getAuthSession } from '@/lib/auth/jwt';
import { memoryStore } from '@/lib/db/memoryStore';
import { apiCache, CACHE_TTL } from '@/lib/db/apiCache';

export const dynamic = 'force-dynamic';

const X_API_BASE = 'https://api.twitter.com/2';

const fallbackData = {
	channelName: "x_demo_user",
	channelAvatar: "",
	followers: 4320,
	postsCount: 28,
	views: 94800,
	reactions: 5310,
	comments: 640,
	engagementRate: 6.28,
	posts: [
		{
			id: 'demo_x_1',
			title: 'Excited to announce our new automated posting scheduler is now live! 📅 #automation #saas',
			publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
			thumbnail: '',
			views: 12400,
			reactions: 680,
			comments: 84,
			engagementRate: 6.16,
			postUrl: 'https://x.com'
		},
		{
			id: 'demo_x_2',
			title: 'How we scaled our background task workers to process 1M social signals per second. 🛠️',
			publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
			thumbnail: '',
			views: 18900,
			reactions: 950,
			comments: 110,
			engagementRate: 5.61,
			postUrl: 'https://x.com'
		}
	]
};

interface XUser {
	id: string;
	username?: string;
	name?: string;
	public_metrics?: {
		followers_count?: number;
		tweet_count?: number;
	};
}

interface XTweet {
	id: string;
	text?: string;
	created_at?: string;
	public_metrics?: {
		impression_count?: number;
		like_count?: number;
		reply_count?: number;
		retweet_count?: number;
		quote_count?: number;
	};
	attachments?: { media_keys?: string[] };
}

async function fetchXInsights(accessToken: string, accountId?: string): Promise<any | null> {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${accessToken}`,
		'Content-Type': 'application/json',
	};

	// 1. Fetch the user's public metrics (followers, total tweets)
	let username = '';
	let followers = 0;
	let totalTweets = 0;
	let avatarUrl = '';
	if (accountId) {
		const userRes = await fetch(`${X_API_BASE}/users/${accountId}?user.fields=public_metrics,profile_image_url,username`, {
			headers,
		});
		if (!userRes.ok) return null;
		const userData = (await userRes.json()) as { data?: XUser };
		const user = userData.data;
		if (user) {
			username = user.username || '';
			followers = user.public_metrics?.followers_count || 0;
			totalTweets = user.public_metrics?.tweet_count || 0;
			avatarUrl = (user as any).profile_image_url || '';
		}
	}

	// 2. Fetch the user's recent tweets with public metrics
	const tweetsRes = await fetch(
		`${X_API_BASE}/users/${accountId}/tweets?max_results=10&tweet.fields=public_metrics,created_at`,
		{ headers }
	);
	if (!tweetsRes.ok) return null;
	const tweetsData = (await tweetsRes.json()) as { data?: XTweet[] };
	const tweets = tweetsData.data || [];
	if (tweets.length === 0) return null;

	// 3. Aggregate metrics
	let totalImpressions = 0;
	let totalReactions = 0;
	let totalComments = 0;

	const posts = tweets.map((tweet) => {
		const m = tweet.public_metrics || {};
		const impressions = m.impression_count || 0;
		const reactions = (m.like_count || 0) + (m.retweet_count || 0) + (m.quote_count || 0);
		const comments = m.reply_count || 0;
		totalImpressions += impressions;
		totalReactions += reactions;
		totalComments += comments;
		return {
			id: tweet.id,
			title: tweet.text || '',
			publishedAt: tweet.created_at || '',
			thumbnail: '',
			views: impressions,
			reactions,
			comments,
			engagementRate: impressions > 0 ? Number(((reactions + comments) / impressions * 100).toFixed(2)) : 0,
			postUrl: `https://x.com/${username || 'x'}/status/${tweet.id}`,
		};
	});

	const postsCount = Math.max(totalTweets, posts.length);
	const engagementRate =
		totalImpressions > 0 ? Number(((totalReactions + totalComments) / totalImpressions * 100).toFixed(2)) : 0;

	return {
		channelName: username || 'X Profile',
		channelAvatar: avatarUrl,
		followers,
		postsCount,
		views: totalImpressions,
		reactions: totalReactions,
		comments: totalComments,
		engagementRate,
		posts,
	};
}

export async function GET(req: NextRequest) {
	let userId = '';
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		userId = session.userId;

		const cached = apiCache.get<any>(userId + ':x_insights');
		if (cached) {
			return NextResponse.json({ insights: cached });
		}

		// Load credentials
		let account: any = null;
		try {
			await dbConnect();
			account = await SocialAccount.findOne({ userId: session.userId, platform: 'x', connected: true }).lean();
		} catch (dbErr) {
			console.warn('MongoDB connection failed in X insights API:', dbErr);
		}

		if (!account) {
			const memAcc = memoryStore.socialAccounts.find(
				(a: any) => a.userId === session.userId && a.platform === 'x' && a.connected
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

		if (!account) {
			apiCache.set(userId + ':x_insights', fallbackData, CACHE_TTL.INSIGHTS);
			return NextResponse.json({ insights: fallbackData });
		}

		// Try to fetch real metrics from X API v2. Falls back to the static placeholder
		// data when the account is a Buffer-only account or the API call fails.
		let insightsData: any = null;
		if (account.accessToken) {
			try {
				insightsData = await fetchXInsights(account.accessToken, account.accountId);
			} catch (err) {
				console.warn('X API insights fetch failed:', err);
			}
		}

		if (!insightsData) {
			insightsData = {
				channelName: account.accountName || 'X Profile',
				channelAvatar: account.avatarUrl || '',
				followers: 4320,
				postsCount: 28,
				views: 94800,
				reactions: 5310,
				comments: 640,
				engagementRate: 6.28,
				posts: fallbackData.posts.map(p => ({
					...p,
					postUrl: `https://publish.buffer.com/profile/${account.accountId}`
				}))
			};
		}

		apiCache.set(userId + ':x_insights', insightsData, CACHE_TTL.INSIGHTS);
		return NextResponse.json({ insights: insightsData });

	} catch (error: any) {
		console.error('Error loading live X insights:', error);
		if (userId) {
			apiCache.set(userId + ':x_insights', fallbackData, CACHE_TTL.INSIGHTS);
		}
		return NextResponse.json({ insights: fallbackData });
	}
}
