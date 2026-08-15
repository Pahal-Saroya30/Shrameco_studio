import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { ScheduledVideo } from '@/models/ScheduledVideo';
import { getAuthSession } from '@/lib/auth/jwt';
import { memoryStore } from '@/lib/db/memoryStore';
import { SocialAccount } from '@/models/SocialAccount';
import { fetchLinkedInFollowerCount, fetchLinkedInCreatorPostAnalytics } from '@/lib/social/linkedinAnalytics';
import { apiCache, CACHE_TTL } from '@/lib/db/apiCache';
import { getConnectedSocialAccount } from '@/lib/db/socialAccountHelper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	const fallbackData = {
		channelName: "linkedin_demo_user",
		channelAvatar: "",
		followers: 1240,
		postsCount: 5,
		views: 18400,
		reactions: 520,
		comments: 80,
		engagementRate: 3.26,
		posts: [
			{
				id: 'demo_li_1',
				title: 'Excited to share that our new AI Content Assistant is now live! 🤖✨',
				publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
				thumbnail: '',
				views: 8400,
				reactions: 320,
				comments: 45,
				engagementRate: 4.35,
				postUrl: 'https://linkedin.com'
			},
			{
				id: 'demo_li_2',
				title: 'How generative AI is redefining the workflow of modern creator studios.',
				publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
				thumbnail: '',
				views: 10000,
				reactions: 200,
				comments: 35,
				engagementRate: 2.35,
				postUrl: 'https://linkedin.com'
			}
		]
	};

	let userId = '';
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		userId = session.userId;

		const cached = apiCache.get<any>(userId + ':linkedin_insights');
		if (cached) {
			return NextResponse.json({ insights: cached });
		}

		// Step 1: Check if a LinkedIn account is connected (with short-lived TTL memory cache)
		const connectedAccount = await getConnectedSocialAccount(session.userId, 'linkedin');

		if (!connectedAccount || !connectedAccount.accessToken || connectedAccount.accountId === 'demo_li_account_id') {
			apiCache.set(userId + ':linkedin_insights', fallbackData, CACHE_TTL.INSIGHTS);
			return NextResponse.json({ insights: fallbackData });
		}

		// Step 2: Validate OAuth Scopes
		const scopes = connectedAccount.scopes || [];
		const hasPostAnalyticsScope = scopes.includes('r_member_postAnalytics');

		if (!hasPostAnalyticsScope) {
			apiCache.set(userId + ':linkedin_insights', fallbackData, CACHE_TTL.INSIGHTS);
			return NextResponse.json({ insights: fallbackData });
		}

		// Step 3: Fetch LinkedIn API analytics
		try {
			const decryptedToken = connectedAccount.accessToken;

			const followerCount = await fetchLinkedInFollowerCount(decryptedToken);
			
			// Compute 30 days date range
			const endTimeMs = Date.now();
			const startTimeMs = endTimeMs - 30 * 24 * 60 * 60 * 1000;

			// Fetch aggregate stats from LinkedIn Creator API
			const postStats = await fetchLinkedInCreatorPostAnalytics(decryptedToken, [], startTimeMs, endTimeMs);

			// Step 4: Fetch sent posts from database
			let publishedItems: any[] = [];
			try {
				await dbConnect();
				publishedItems = await ScheduledVideo.find({ 
					userId: session.userId, 
					platform: 'linkedin',
					status: 'sent'
				}).lean();
			} catch (_) {}

			// Map API stats back to the user's published posts
			const mappedPosts = publishedItems.map(item => {
				// Extract post ID / URN from the postUrl
				const match = (item.postUrl || '').match(/\/update\/([^/?]+)/);
				const urn = match ? `urn:li:share:${match[1]}` : item.postUrl;

				const stats = postStats.find(s => s.entity === urn) || {
					impressions: 0,
					reactions: 0,
					comments: 0,
					shares: 0,
					views: 0,
					engagementRate: 0
				};

				return {
					id: item._id ? item._id.toString() : item.id,
					title: item.caption || 'Untitled LinkedIn Post',
					publishedAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
					thumbnail: item.imageUrl || '',
					views: stats.impressions || stats.views || 0,
					reactions: stats.reactions || 0,
					comments: stats.comments || 0,
					engagementRate: stats.engagementRate || 0,
					postUrl: item.postUrl || '',
				};
			}).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

			// Sum up stats across posts
			let totalViews = 0;
			let totalReactions = 0;
			let totalComments = 0;

			mappedPosts.forEach(p => {
				totalViews += p.views;
				totalReactions += p.reactions;
				totalComments += p.comments;
			});

			const avgEngagementRate = totalViews > 0 ? ((totalReactions + totalComments) / totalViews) * 100 : 0;

			const insightsData = {
				channelName: connectedAccount.accountName || 'LinkedIn Member Profile',
				channelAvatar: '',
				followers: followerCount || 0,
				postsCount: mappedPosts.length,
				views: totalViews,
				reactions: totalReactions,
				comments: totalComments,
				engagementRate: parseFloat(avgEngagementRate.toFixed(2)),
				posts: mappedPosts,
			};

			apiCache.set(userId + ':linkedin_insights', insightsData, CACHE_TTL.INSIGHTS);
			return NextResponse.json({ insights: insightsData });
		} catch (apiErr) {
			console.error('Failed to fetch real-time LinkedIn insights:', apiErr);
			apiCache.set(userId + ':linkedin_insights', fallbackData, CACHE_TTL.INSIGHTS);
			return NextResponse.json({ insights: fallbackData });
		}
	} catch (error) {
		console.error('Error loading live LinkedIn insights:', error);
		if (userId) {
			apiCache.set(userId + ':linkedin_insights', fallbackData, CACHE_TTL.INSIGHTS);
		}
		return NextResponse.json({ insights: fallbackData });
	}
}
