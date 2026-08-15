import type { PlatformService, AuthorizeUrlResult, ExchangeInput, ExchangeResult, PublishInput, PublishResult } from './types';

const GRAPH_BASE = 'https://graph.facebook.com';
const GRAPH_VERSION = 'v25.0';
const SCOPES = 'instagram_basic,instagram_content_publish,pages_show_list';

export function getInstagramConfig() {
	return {
		clientId: process.env.INSTAGRAM_CLIENT_ID || '',
		clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
		redirectUri: process.env.INSTAGRAM_REDIRECT_URI || '',
	};
}

export const instagramService: PlatformService = {
	async buildAuthorizeUrl({ redirectUri, state }): Promise<AuthorizeUrlResult> {
		const { clientId } = getInstagramConfig();
		const actualClientId = clientId || '1531617227440535'; 

		const params = new URLSearchParams({
			client_id: actualClientId,
			redirect_uri: redirectUri,
			state,
			response_type: 'code',
			scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights',
			auth_type: 'reauthenticate',
		});
		return { url: `https://api.instagram.com/oauth/authorize?${params.toString()}` };
	},

	async getInsights(accountId: string, accessToken: string) {
		const IG_API = `https://graph.instagram.com/v20.0`;

		try {
			// Get followers count
			const userRes = await fetch(`${IG_API}/${accountId}?fields=followers_count&access_token=${accessToken}`);
			const userData = userRes.ok ? await userRes.json() : { followers_count: null };

			// Get insights (impressions, reach, profile_views)
			const insightsRes = await fetch(`${IG_API}/${accountId}/insights?metric=impressions,reach,profile_views&metric_type=total_value&period=day&access_token=${accessToken}`);
			const insightsData = insightsRes.ok ? await insightsRes.json() : { data: [] };

			const metrics: Record<string, number> = {};
			if (insightsData.data && Array.isArray(insightsData.data)) {
				for (const item of insightsData.data) {
					metrics[item.name] = item.total_value?.value || 0;
				}
			}

			// Fetch Recent Media (Posts and Reels)
			const mediaRes = await fetch(`${IG_API}/${accountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=20&access_token=${accessToken}`);
			const mediaData = mediaRes.ok ? await mediaRes.json() : { data: [] };

			// Fetch Stories
			const storiesRes = await fetch(`${IG_API}/${accountId}/stories?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=10&access_token=${accessToken}`);
			const storiesData = storiesRes.ok ? await storiesRes.json() : { data: [] };

			// Combine and standardize
			const allMedia: any[] = [];
			const processMedia = (items: any[], typeOverride?: string) => {
				if (!items || !Array.isArray(items)) return;
				items.forEach((item: any) => {
					let type = typeOverride || item.media_type; // 'IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'STORY'
					if (type === 'VIDEO') type = 'REEL';
					if (type === 'CAROUSEL_ALBUM') type = 'POST';
					if (type === 'IMAGE') type = 'POST';
					
					allMedia.push({
						id: item.id,
						type: type,
						title: item.caption ? item.caption.slice(0, 40) + '...' : 'No caption',
						date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
						likes: item.like_count || 0,
						comments: item.comments_count || 0,
						views: 0,
						thumbnail: item.thumbnail_url || item.media_url,
						permalink: item.permalink,
						timestamp: new Date(item.timestamp).getTime(),
					});
				});
			};

			processMedia(mediaData.data);
			processMedia(storiesData.data, 'STORY');
			
			// Sort by newest
			allMedia.sort((a, b) => b.timestamp - a.timestamp);

			// Fetch exact views (impressions/plays) for each media in parallel
			const metricsPromises = allMedia.map(async (media) => {
				try {
					let metricToFetch = 'impressions';
					if (media.type === 'REEL') metricToFetch = 'plays';
					
					const res = await fetch(`${IG_API}/${media.id}/insights?metric=${metricToFetch}&access_token=${accessToken}`);
					if (res.ok) {
						const data = await res.json();
						if (data.data && data.data.length > 0) {
							media.views = data.data[0].values[0].value;
						}
					}
				} catch (err) {
					// silently fail and leave views as 0 if specific insight fails
				}
				return media;
			});

			await Promise.all(metricsPromises);

			return {
				followers: userData.followers_count,
				impressions: metrics.impressions,
				reach: metrics.reach,
				profileViews: metrics.profile_views,
				media: allMedia,
			};
		} catch (error) {
			console.error('Failed to fetch Instagram insights:', error);
			throw error;
		}
	},

	async exchangeCode({ code, redirectUri }: ExchangeInput): Promise<ExchangeResult> {
		const { clientId, clientSecret } = getInstagramConfig();
		if (!clientId || !clientSecret) throw new Error('Instagram app credentials are not configured.');

		// Step 1: Exchange code for short-lived token using api.instagram.com
		const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
			method: 'POST',
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: 'authorization_code',
				redirect_uri: redirectUri,
				code,
			}),
		});

		if (!tokenRes.ok) {
			const body = await tokenRes.text();
			throw new Error(`Instagram token exchange failed (${tokenRes.status}): ${body.slice(0, 300)}`);
		}
		const tokenData = await tokenRes.json();
		const userId = tokenData.user_id;
		if (!userId) {
			throw new Error('No user_id found in Instagram token exchange response.');
		}

		// Step 2: Exchange short-lived for long-lived token using graph.instagram.com
		let accessToken = tokenData.access_token;
		let expiresIn: number | undefined = tokenData.expires_in;
		const longLivedRes = await fetch(
			`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${tokenData.access_token}`
		);
		if (longLivedRes.ok) {
			const llData = await longLivedRes.json();
			if (llData.access_token) {
				accessToken = llData.access_token;
				expiresIn = llData.expires_in;
			}
		} else {
			console.warn('Long-lived token exchange failed, using short-lived token.');
		}

		// Step 3: Get Instagram user profile using /me (not /{userId}) — required by Instagram Basic Display API
		let profile: { id?: string; username?: string } = {};
		try {
			const profileRes = await fetch(
				`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
			);
			if (!profileRes.ok) {
				const err = await profileRes.text();
				console.warn(`Instagram profile lookup failed (${profileRes.status}): ${err.slice(0, 300)}. Falling back to demo profile.`);
				profile = {
					id: String(userId || 'demo_ig_account_id'),
					username: 'instagram_demo_user',
				};
			} else {
				profile = await profileRes.json();
			}
		} catch (fetchErr: any) {
			console.warn('Instagram profile lookup network failure. Falling back to demo profile:', fetchErr.message);
			profile = {
				id: String(userId || 'demo_ig_account_id'),
				username: 'instagram_demo_user',
			};
		}

		return {
			accessToken,
			expiresIn,
			accountId: profile.id || String(userId || 'demo_ig_account_id'),
			accountName: profile.username || 'instagram_demo_user',
			scopes: SCOPES.split(','),
		};
	},

	async publish({ accessToken, accountId, caption, imageUrl, videoUrl, mediaType = 'POST' }: PublishInput): Promise<PublishResult> {
		if (!accountId) throw new Error('Instagram account is not linked. Reconnect your account.');

		const IG_API = `https://graph.instagram.com/${GRAPH_VERSION}`;

		const payload: any = {
			access_token: accessToken,
		};

		// Instagram stories do not support captions. Passing caption on STORIES type fails the Graph API.
		if (mediaType !== 'STORY') {
			payload.caption = caption.slice(0, 2200);
		}

		if (mediaType === 'REEL') {
			if (!videoUrl) throw new Error('Instagram Reels require a video URL.');
			payload.media_type = 'REELS';
			payload.video_url = videoUrl;
		} else if (mediaType === 'STORY') {
			payload.media_type = 'STORIES';
			if (videoUrl) {
				payload.video_url = videoUrl;
			} else if (imageUrl) {
				payload.image_url = imageUrl;
			} else {
				throw new Error(
					'Instagram Stories require a background image or video. ' +
					'Text-only stories are not supported by the Instagram API — please switch to "Image + Text" or "Video" type.'
				);
			}
		} else {
			if (!imageUrl) throw new Error('Instagram posts require an image.');
			payload.image_url = imageUrl;
		}

		if (payload.image_url && payload.image_url.startsWith('data:')) {
			throw new Error('Instagram requires a publicly accessible URL. Your image is stored as a data URL; upload it to public hosting and retry.');
		}
		if (payload.video_url && payload.video_url.startsWith('data:')) {
			throw new Error('Instagram requires a publicly accessible URL. Your video is stored as a data URL; upload it to public hosting and retry.');
		}

		// Step 1: Create the media container
		const containerRes = await fetch(`${IG_API}/${accountId}/media`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		if (!containerRes.ok) {
			const err = await containerRes.text();
			throw new Error(`Instagram media container creation failed (${containerRes.status}): ${err.slice(0, 300)}`);
		}
		const container = await containerRes.json();
		const containerId = container.id;

		// Step 2: Poll until container status is FINISHED (Instagram requires this before publish)
		const MAX_POLLS = mediaType === 'STORY' || mediaType === 'REEL' ? 60 : 15;
		const POLL_INTERVAL_MS = 3000;
		let lastStatus = '';
		for (let i = 0; i < MAX_POLLS; i++) {
			await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
			const statusRes = await fetch(
				`${IG_API}/${containerId}?fields=status_code,status&access_token=${accessToken}`
			);
			if (!statusRes.ok) break; 
			const statusData = await statusRes.json();
			lastStatus = statusData.status_code || '';
			if (lastStatus === 'FINISHED') break;
			if (lastStatus === 'ERROR' || lastStatus === 'EXPIRED') {
				const detail = statusData.status || '';
				if (mediaType === 'STORY') {
					throw new Error(
						`Instagram Story publishing failed (status: ${lastStatus}). ` +
						`This can happen if: (1) The image URL is not publicly accessible to Instagram servers, ` +
						`(2) Your Instagram account needs "instagram_business_content_publish" permission, ` +
						`or (3) Your account is not a Business/Creator account. ` +
						`Detail: ${detail}`
					);
				}
				throw new Error(`Instagram media processing failed with status: ${lastStatus}. ${detail}`);
			}
		}

		// Step 3: Publish the container with a retry mechanism for transient processing delays
		let publishRes;
		let publishErrText = '';
		let publishData;
		let success = false;

		for (let attempt = 1; attempt <= 12; attempt++) {
			publishRes = await fetch(`${IG_API}/${accountId}/media_publish`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
			});
			
			if (publishRes.ok) {
				publishData = await publishRes.json();
				success = true;
				break;
			}
			
			publishErrText = await publishRes.text();
			
			if (publishErrText.includes('2207027') || publishErrText.includes('Media ID is not available') || publishErrText.includes('9007')) {
				console.warn(`Attempt ${attempt} to publish failed: Media still processing. Retrying in 10s...`);
				await new Promise((r) => setTimeout(r, 10000));
			} else {
				break; 
			}
		}

		if (!success) {
			throw new Error(`Instagram publish failed (${publishRes?.status}): ${publishErrText.slice(0, 300)}`);
		}

		return {
			postUrl: publishData?.id ? `https://www.instagram.com/p/${publishData.id}/` : undefined,
		};
	},
};
