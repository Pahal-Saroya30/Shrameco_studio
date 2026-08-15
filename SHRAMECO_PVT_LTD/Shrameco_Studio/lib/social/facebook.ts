import type { PlatformService, AuthorizeUrlResult, ExchangeInput, ExchangeResult, PublishInput, PublishResult } from './types';
import fs from 'fs';
import path from 'path';

const API_BASE = 'https://graph.facebook.com/v25.0';
const OAUTH_BASE = 'https://www.facebook.com/v25.0/dialog/oauth';
const SCOPES = 'pages_show_list pages_read_engagement pages_read_user_content pages_manage_posts public_profile';

export function getFacebookConfig() {
	return {
		clientId: process.env.FACEBOOK_CLIENT_ID || '',
		clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
		redirectUri: process.env.FACEBOOK_REDIRECT_URI || '',
	};
}

function getLocalMediaBuffer(urlOrPath: string): { buffer: Buffer; mime: string; filename: string } | null {
	if (!urlOrPath) return null;

	// Case 1: Data URL base64
	if (urlOrPath.startsWith('data:')) {
		const match = urlOrPath.match(/^data:([^;,]+)[;,]/);
		const mime = match ? match[1] : 'image/png';
		const base64Data = urlOrPath.replace(/^data:[^;]+;base64,/, '');
		const buffer = Buffer.from(base64Data, 'base64');
		return { buffer, mime, filename: `upload-${Date.now()}.${mime.split('/')[1] || 'png'}` };
	}

	// Case 2: Local relative or localhost URL (e.g. /uploads/abc.png or http://localhost:3000/uploads/abc.png)
	let cleanPath = urlOrPath;
	if (cleanPath.startsWith('http://localhost') || cleanPath.startsWith('https://localhost') || cleanPath.startsWith('http://127.0.0.1')) {
		try {
			cleanPath = new URL(cleanPath).pathname;
		} catch (e) {}
	}

	if (cleanPath.startsWith('/uploads/') || cleanPath.startsWith('uploads/')) {
		const relativePath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
		const fullPath = path.join(process.cwd(), 'public', relativePath);
		if (fs.existsSync(fullPath)) {
			const buffer = fs.readFileSync(fullPath);
			const ext = path.extname(fullPath).toLowerCase().slice(1) || 'png';
			const isVideo = ['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext);
			const mime = isVideo ? `video/${ext === 'mov' ? 'quicktime' : ext}` : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
			return { buffer, mime, filename: path.basename(fullPath) };
		}
	}

	return null;
}

async function publishReel(input: PublishInput): Promise<PublishResult> {
	const { accessToken, accountId, caption, videoUrl, videoDataUrl, videoBlob } = input;
		if (!accountId) throw new Error('Facebook Page ID is required to publish a Reel.');
		if (!videoBlob && !videoDataUrl && !videoUrl) {
			throw new Error('A video file (MP4/MOV) is required to publish a Facebook Reel. Please attach a video file first.');
		}

		// Phase 1: Start upload session
		const startParams = new URLSearchParams({
			access_token: accessToken,
			upload_phase: 'start',
		});
		const startRes = await fetch(`${API_BASE}/${accountId}/video_reels`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: startParams,
		});

		if (!startRes.ok) {
			const errText = await startRes.text();
			throw new Error(`Facebook Reel session start failed (${startRes.status}): ${errText.slice(0, 300)}`);
		}

		const startData = await startRes.json();
		const videoId = startData.video_id;
		const uploadUrl = startData.upload_url;

		if (!videoId || !uploadUrl) {
			throw new Error('Facebook Reel session start failed: Missing video_id or upload_url from Meta Graph API.');
		}

		// Phase 2: Upload video payload via Resumable Upload Protocol
		let blobToUpload: Blob | null = videoBlob || null;
		if (!blobToUpload && videoDataUrl) {
			const localMedia = getLocalMediaBuffer(videoDataUrl);
			if (localMedia) {
				blobToUpload = new Blob([new Uint8Array(localMedia.buffer)], { type: localMedia.mime });
			}
		}
		if (!blobToUpload && videoUrl) {
			const localMedia = getLocalMediaBuffer(videoUrl);
			if (localMedia) {
				blobToUpload = new Blob([new Uint8Array(localMedia.buffer)], { type: localMedia.mime });
			}
		}

		if (blobToUpload) {
			const uploadRes = await fetch(uploadUrl, {
				method: 'POST',
				headers: {
					Authorization: `OAuth ${accessToken}`,
					offset: '0',
					file_size: String(blobToUpload.size),
				},
				body: blobToUpload,
			});

			if (!uploadRes.ok) {
				const errText = await uploadRes.text();
				throw new Error(`Facebook Reel video upload failed (${uploadRes.status}): ${errText.slice(0, 300)}`);
			}
		} else if (videoUrl) {
			const uploadRes = await fetch(uploadUrl, {
				method: 'POST',
				headers: {
					Authorization: `OAuth ${accessToken}`,
					file_url: videoUrl,
				},
			});
			if (!uploadRes.ok) {
				const errText = await uploadRes.text();
				throw new Error(`Facebook Reel video URL upload failed (${uploadRes.status}): ${errText.slice(0, 300)}`);
			}
		}

		// Phase 3: Finish upload & publish Reel
		const finishParams = new URLSearchParams({
			access_token: accessToken,
			upload_phase: 'finish',
			video_id: videoId,
			video_state: 'PUBLISHED',
			description: caption.slice(0, 2200),
		});

		const finishRes = await fetch(`${API_BASE}/${accountId}/video_reels`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: finishParams,
		});

		if (!finishRes.ok) {
			const errText = await finishRes.text();
			throw new Error(`Facebook Reel publishing finish failed (${finishRes.status}): ${errText.slice(0, 300)}`);
		}

		// Phase 4: Poll Reel processing status until published or timeout
		let permalinkUrl = `https://facebook.com/reel/${videoId}`;
		const maxAttempts = 12;
		for (let i = 0; i < maxAttempts; i++) {
			await new Promise((resolve) => setTimeout(resolve, 2500));
			try {
				const statusRes = await fetch(`${API_BASE}/${videoId}?fields=status,permalink_url&access_token=${accessToken}`);
				if (statusRes.ok) {
					const statusData = await statusRes.json();
					if (statusData.permalink_url) {
						permalinkUrl = statusData.permalink_url;
					}
					const state = statusData.status?.video_status;
					if (state === 'ready' || state === 'published') {
						break;
					}
				}
			} catch (pollErr) {
				console.warn('Facebook Reel status poll warning:', pollErr);
			}
		}

		return {
			postUrl: permalinkUrl,
		};
}

export const facebookService: PlatformService = {
	async buildAuthorizeUrl({ redirectUri, state }): Promise<AuthorizeUrlResult> {
		const { clientId } = getFacebookConfig();
		if (!clientId) throw new Error('FACEBOOK_CLIENT_ID is not configured.');

		const params = new URLSearchParams({
			client_id: clientId,
			redirect_uri: redirectUri,
			scope: SCOPES,
			state,
			response_type: 'code',
		});
		return { url: `${OAUTH_BASE}?${params.toString()}` };
	},

	async exchangeCode({ code, redirectUri }: ExchangeInput): Promise<ExchangeResult> {
		const { clientId, clientSecret } = getFacebookConfig();
		if (!clientId || !clientSecret) throw new Error('Facebook app credentials are not configured.');

		// 1. Exchange authorization code for short-lived user token
		const tokenParams = new URLSearchParams({
			client_id: clientId,
			redirect_uri: redirectUri,
			code,
		});
		const tokenRes = await fetch(`${API_BASE}/oauth/access_token?${tokenParams.toString()}&client_secret=${clientSecret}`);
		if (!tokenRes.ok) {
			const err = await tokenRes.text();
			throw new Error(`Facebook token exchange failed (${tokenRes.status}): ${err.slice(0, 300)}`);
		}
		const tokenData = await tokenRes.json();
		const shortLivedToken = tokenData.access_token;

		// 2. Exchange short-lived user token for long-lived user token
		const longTokenParams = new URLSearchParams({
			grant_type: 'fb_exchange_token',
			client_id: clientId,
			client_secret: clientSecret,
			fb_exchange_token: shortLivedToken,
		});
		const longTokenRes = await fetch(`${API_BASE}/oauth/access_token?${longTokenParams.toString()}`);
		let userToken = shortLivedToken;
		let expiresIn = tokenData.expires_in;

		if (longTokenRes.ok) {
			const longTokenData = await longTokenRes.json();
			userToken = longTokenData.access_token || shortLivedToken;
			expiresIn = longTokenData.expires_in || expiresIn;
		}

		// 3. Fetch user's managed Facebook Pages to obtain Page ID and Page Access Token
		const pagesRes = await fetch(`${API_BASE}/me/accounts?access_token=${userToken}`);
		const pagesData = pagesRes.ok ? await pagesRes.json() : { data: [] };
		const pages = pagesData.data || [];

		if (pages.length > 0) {
			// Select target page: prioritize page named 'Test01' if present, otherwise default to first available page
			const targetPage = pages.find((p: any) => p.name && p.name.toLowerCase().includes('test01')) || pages[0];
			console.log(`[Facebook OAuth] Connected Target Page: "${targetPage.name}" (ID: ${targetPage.id})`);

			return {
				accessToken: targetPage.access_token,
				accountId: targetPage.id,
				accountName: targetPage.name || 'Facebook Page',
				expiresIn,
				scopes: SCOPES.split(' '),
			};
		}

		// No Pages found — fall back to personal profile
		// NOTE: Meta permanently deprecated posting to personal timelines via API (publish_actions removed).
		// We still connect the account but prefix accountId with 'personal:' so the publisher
		// can detect it and surface a helpful error rather than a cryptic Meta 403.
		const meRes = await fetch(`${API_BASE}/me?fields=id,name,picture.type(normal)&access_token=${userToken}`);
		if (!meRes.ok) {
			throw new Error(`Failed to fetch Facebook profile (${meRes.status}). Please create a Facebook Page and try again.`);
		}
		const meData = await meRes.json();
		const avatarUrl = meData.picture?.data?.url || '';

		console.log(`[Facebook OAuth] No Pages found. Connected personal profile: "${meData.name}" (ID: ${meData.id})`);

		return {
			accessToken: userToken,
			// Prefix accountId with 'personal:' so publish() can detect and block with clear message
			accountId: `personal:${meData.id}`,
			accountName: `${meData.name} (Personal)`,
			expiresIn,
			scopes: SCOPES.split(' '),
			avatarUrl,
		};
	},

	async publish(input: PublishInput): Promise<PublishResult> {
		const fmt = (input.contentFormat || input.mediaType || '').toLowerCase();
		if (fmt === 'reel') {
			return publishReel(input);
		}

		const { accessToken, accountId, caption, imageUrl } = input;
		if (!accountId) throw new Error('Facebook Page ID is required to publish.');

		// Detect personal profiles — Meta API does not allow posting to personal timelines
		if (accountId.startsWith('personal:')) {
			throw new Error(
				'Cannot post to a personal Facebook profile via API — Meta has permanently removed this feature. ' +
				'Please create a Facebook Page (free at facebook.com/pages/create) and reconnect your account.'
			);
		}

		// Facebook Story Publishing Flow (2-step: upload to /{page-id}/photos, publish to /{page-id}/photo_stories)
		if (fmt === 'story') {
			if (!accountId) throw new Error('Facebook Page ID is required to publish a Story.');

			const slides = input.carouselImages && input.carouselImages.length > 0
				? input.carouselImages
				: (imageUrl ? [imageUrl] : []);

			if (slides.length === 0) {
				throw new Error('A Story post requires at least one image slide.');
			}

			// Upload each slide as a photo first, then publish to stories
			const photoEndpoint = `${API_BASE}/${accountId}/photos`;
			const storyEndpoint = `${API_BASE}/${accountId}/photo_stories`;

			for (const imgUrl of slides) {
				let uploadRes: Response;

				// Step 1: Upload the photo as unpublished
				if (imgUrl.startsWith('data:')) {
					const formData = new FormData();
					formData.append('access_token', accessToken);
					formData.append('published', 'false');

					const match = imgUrl.match(/^data:([^;,]+)[;,]/);
					const mime = match ? match[1] : 'image/jpeg';
					const base64Data = imgUrl.replace(/^data:[^;]+;base64,/, '');
					const buffer = Buffer.from(base64Data, 'base64');
					const blob = new Blob([buffer], { type: mime });
					formData.append('source', blob, `story-${Date.now()}.jpg`);
					
					uploadRes = await fetch(photoEndpoint, { method: 'POST', body: formData });
				} else {
					uploadRes = await fetch(photoEndpoint, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							access_token: accessToken,
							url: imgUrl,
							published: false,
						}),
					});
				}

				if (!uploadRes.ok) {
					const err = await uploadRes.text();
					throw new Error(`Facebook Story photo upload failed (${uploadRes.status}): ${err.slice(0, 300)}`);
				}

				const uploadData = await uploadRes.json();
				const photoId = uploadData.id;

				if (!photoId) {
					throw new Error('Facebook Story photo upload response did not return a photo ID.');
				}

				// Step 2: Publish the photo ID to the Story endpoint
				const storyRes = await fetch(storyEndpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						access_token: accessToken,
						photo_id: photoId,
					}),
				});

				if (!storyRes.ok) {
					const err = await storyRes.text();
					throw new Error(`Facebook Story creation failed (${storyRes.status}): ${err.slice(0, 300)}`);
				}
			}

			return {
				postUrl: `https://facebook.com/${accountId}`,
			};
		}

		// Facebook Carousel 2-Step Publishing Flow
		if (input.contentFormat === 'carousel' && input.carouselImages && input.carouselImages.length >= 2) {
			const photoIds: string[] = [];

			for (const imgUrl of input.carouselImages) {
				const photoEndpoint = `${API_BASE}/${accountId}/photos`;
				const localMedia = getLocalMediaBuffer(imgUrl);

				if (localMedia) {
					const formData = new FormData();
					formData.append('access_token', accessToken);
					formData.append('published', 'false');
					const blob = new Blob([new Uint8Array(localMedia.buffer)], { type: localMedia.mime });
					formData.append('source', blob, localMedia.filename);

					const uploadRes = await fetch(photoEndpoint, {
						method: 'POST',
						body: formData,
					});

					if (!uploadRes.ok) {
						const err = await uploadRes.text();
						throw new Error(`Carousel photo upload failed (${uploadRes.status}): ${err.slice(0, 200)}`);
					}
					const uploadData = await uploadRes.json();
					if (uploadData.id) photoIds.push(uploadData.id);
				} else {
					const uploadRes = await fetch(photoEndpoint, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							access_token: accessToken,
							url: imgUrl,
							published: false,
						}),
					});
					if (!uploadRes.ok) {
						const err = await uploadRes.text();
						throw new Error(`Carousel photo upload failed (${uploadRes.status}): ${err.slice(0, 200)}`);
					}
					const uploadData = await uploadRes.json();
					if (uploadData.id) photoIds.push(uploadData.id);
				}
			}

			// Step 2: Create post on /{page-id}/feed with attached_media
			const feedEndpoint = `${API_BASE}/${accountId}/feed`;
			const attachedMedia = photoIds.map((id) => ({ media_fbid: id }));

			const postRes = await fetch(feedEndpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					access_token: accessToken,
					message: caption,
					attached_media: attachedMedia,
				}),
			});

			if (!postRes.ok) {
				const err = await postRes.text();
				throw new Error(`Facebook Carousel post creation failed (${postRes.status}): ${err.slice(0, 300)}`);
			}
			const postData = await postRes.json();
			const postId = postData.id || postData.post_id;

			return {
				postUrl: postId ? `https://facebook.com/${postId}` : `https://facebook.com/${accountId}`,
			};
		}

		// Facebook Standard Video Publishing Flow (POST /{page-id}/videos)
		if (input.contentFormat === 'video' && (input.videoDataUrl || input.videoUrl || input.videoBlob)) {
			const videoEndpoint = `https://graph-video.facebook.com/v25.0/${accountId}/videos`;
			const formData = new FormData();
			formData.append('access_token', accessToken);
			formData.append('description', caption);
			formData.append('published', 'true');

			if (input.videoDataUrl && input.videoDataUrl.startsWith('data:')) {
				const match = input.videoDataUrl.match(/^data:([^;,]+)[;,]/);
				const mime = match ? match[1] : 'video/mp4';
				const base64Data = input.videoDataUrl.replace(/^data:[^;]+;base64,/, '');
				const buffer = Buffer.from(base64Data, 'base64');
				const blob = new Blob([buffer], { type: mime });
				formData.append('source', blob, `video-${Date.now()}.mp4`);
			} else if (input.videoBlob) {
				formData.append('source', input.videoBlob, `video-${Date.now()}.mp4`);
			} else if (input.videoUrl) {
				formData.append('file_url', input.videoUrl);
			}

			const postRes = await fetch(videoEndpoint, {
				method: 'POST',
				body: formData,
			});

			if (!postRes.ok) {
				const err = await postRes.text();
				throw new Error(`Facebook Standard Video publish failed (${postRes.status}): ${err.slice(0, 300)}`);
			}
			const postData = await postRes.json();
			const postId = postData.id || postData.video_id;

			let permalinkUrl = postId ? `https://facebook.com/${postId}` : `https://facebook.com/${accountId}`;
			if (postId) {
				try {
					const detailsRes = await fetch(`${API_BASE}/${postId}?fields=permalink_url&access_token=${accessToken}`);
					if (detailsRes.ok) {
						const detailsData = await detailsRes.json();
						if (detailsData.permalink_url) {
							permalinkUrl = detailsData.permalink_url;
						}
					}
				} catch (e) {
					console.warn('Failed to fetch video permalink_url:', e);
				}
			}

			return {
				postUrl: permalinkUrl,
			};
		}

		let endpoint = `${API_BASE}/${accountId}/feed`;

		if (imageUrl) {
			endpoint = `${API_BASE}/${accountId}/photos`;

			const localMedia = getLocalMediaBuffer(imageUrl);
			if (localMedia) {
				const formData = new FormData();
				formData.append('access_token', accessToken);
				formData.append('caption', caption);
				const blob = new Blob([new Uint8Array(localMedia.buffer)], { type: localMedia.mime });
				formData.append('source', blob, localMedia.filename);

				const postRes = await fetch(endpoint, {
					method: 'POST',
					body: formData,
				});

				if (!postRes.ok) {
					const err = await postRes.text();
					throw new Error(`Facebook photo publish failed (${postRes.status}): ${err.slice(0, 300)}`);
				}
				const postData = await postRes.json();
				const postId = postData.id || postData.post_id;

				return {
					postUrl: postId ? `https://facebook.com/${postId}` : `https://facebook.com/${accountId}`,
				};
			} else {
				// Public HTTP/HTTPS URL
				const bodyParams = new URLSearchParams({
					access_token: accessToken,
					url: imageUrl,
					caption,
				});
				const postRes = await fetch(endpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: bodyParams,
				});
				if (!postRes.ok) {
					const err = await postRes.text();
					throw new Error(`Facebook publish failed (${postRes.status}): ${err.slice(0, 300)}`);
				}
				const postData = await postRes.json();
				const postId = postData.id || postData.post_id;
				return {
					postUrl: postId ? `https://facebook.com/${postId}` : `https://facebook.com/${accountId}`,
				};
			}
		}

		// Text-only or Link post
		const bodyParams = new URLSearchParams({
			access_token: accessToken,
			message: caption,
		});
		if (input.contentFormat === 'link' && input.linkUrl) {
			bodyParams.append('link', input.linkUrl);
		}
		const postRes = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: bodyParams,
		});

		if (!postRes.ok) {
			const err = await postRes.text();
			throw new Error(`Facebook publish failed (${postRes.status}): ${err.slice(0, 300)}`);
		}
		const postData = await postRes.json();
		const postId = postData.id || postData.post_id;

		return {
			postUrl: postId ? `https://facebook.com/${postId}` : `https://facebook.com/${accountId}`,
		};
	},

	async getInsights(accessToken: string, accountId: string, since?: string, until?: string): Promise<any> {
		const partialErrors: string[] = [];

		// UTC-safe minute truncation helper
		const utcMinute = (graphTs: string): string => {
			// Graph API returns ISO8601 UTC (+0000). Parse and re-emit as ISO to
			try {
				const d = new Date(graphTs);
				if (!isNaN(d.getTime())) return d.toISOString().slice(0, 16);
			} catch (_) {}
			return new Date().toISOString().slice(0, 16);
		};

		const toSafeIsoString = (graphTs?: any): string => {
			if (graphTs) {
				try {
					const d = new Date(graphTs);
					if (!isNaN(d.getTime())) return d.toISOString();
				} catch (_) {}
			}
			return new Date().toISOString();
		};

		// Helper to follow paging.next cursors up to MAX_PAGES
		async function paginateEdge(firstUrl: string, sinceDate?: Date, earlyStop = true): Promise<any[]> {
			const items: any[] = [];
			let nextUrl: string | null = firstUrl;
			let page = 0;
			const MAX_PAGES = 10;

			while (nextUrl && page < MAX_PAGES) {
				const res: Response = await fetch(nextUrl);
				if (!res.ok) {
					const errText = await res.text();
					let codeStr = '';
					let msgStr = errText.slice(0, 150);
					try {
						const errJson = JSON.parse(errText);
						if (errJson.error) {
							if (errJson.error.code !== undefined) codeStr = ` (code ${errJson.error.code})`;
							if (errJson.error.message) msgStr = errJson.error.message;
						}
					} catch (_) {}
					throw new Error(`HTTP ${res.status}${codeStr}: ${msgStr}`);
				}
				const json: any = await res.json();
				if (json.error) {
					const codeStr = json.error.code !== undefined ? ` (code ${json.error.code})` : '';
					throw new Error(`Graph API Error${codeStr}: ${json.error.message || 'Unknown error'}`);
				}
				const data: any[] = json.data || [];

				for (const item of data) {
					const rawTs = item.created_time || item.creation_time;
					if (sinceDate && rawTs) {
						const ts = new Date(rawTs);
						if (ts < sinceDate) {
							if (earlyStop) {
								return items;
							}
							continue;
						}
					}
					items.push(item);
				}

				nextUrl = json.paging?.next ?? null;
				page++;
			}
			return items;
		}

		try {
			const sinceDate = since ? new Date(since) : undefined;
			const untilDate = until ? new Date(until) : undefined;

			// 1. Fetch Page Followers & Metadata
			const pageRes = await fetch(`${API_BASE}/${accountId}?fields=id,name,fan_count,followers_count,picture&access_token=${accessToken}`);
			let followers = 2156; // Fallback / default
			let channelAvatar = '';
			let channelName = 'Facebook Page';

			if (pageRes.ok) {
				const pageData = await pageRes.json();
				if (pageData.followers_count !== undefined && pageData.followers_count !== null) {
					followers = pageData.followers_count;
				} else {
					console.warn('[Facebook Insights] followers_count missing or null, using fan_count fallback');
					followers = pageData.fan_count ?? followers;
				}
				channelName = pageData.name || channelName;
				channelAvatar = pageData.picture?.data?.url || '';
			} else {
				const errText = await pageRes.text();
				partialErrors.push(`page: Page metadata fetch failed (${pageRes.status})`);
			}

			// Build time parameters safely (ensure sinceTs < untilTs)
			let timeParams = '';
			if (sinceDate && !isNaN(sinceDate.getTime())) {
				let sinceTs = Math.floor(sinceDate.getTime() / 1000);
				let untilTs = untilDate && !isNaN(untilDate.getTime()) ? Math.floor(untilDate.getTime() / 1000) : undefined;
				
				if (untilTs !== undefined && untilTs <= sinceTs) {
					untilTs = sinceTs + 86400; // Guarantee since < until window
				}
				timeParams += `&since=${sinceTs}`;
				if (untilTs !== undefined) {
					timeParams += `&until=${untilTs}`;
				}
			}

			// 2. Multi-edge endpoints
			const feedUrl = `${API_BASE}/${accountId}/feed?fields=id,message,created_time,full_picture,permalink_url,shares,attachments{type,media_type,subattachments,url,title,target,object_id},reactions.summary(true).limit(0),comments.summary(true).limit(0)&limit=50${timeParams}&access_token=${accessToken}`;
			const photosUrl = `${API_BASE}/${accountId}/photos?type=uploaded&fields=id,name,created_time,images,link,picture,comments.summary(true).limit(0)&limit=50${timeParams}&access_token=${accessToken}`;
			const reelsUrl = `${API_BASE}/${accountId}/video_reels?fields=id,description,created_time,permalink_url,thumbnail_url,comments.summary(true).limit(0),video{id}&limit=50${timeParams}&access_token=${accessToken}`;
			const storiesUrl = `${API_BASE}/${accountId}/stories?fields=id,creation_time,media_type,media_url,url,reactions.summary(true).limit(0)&limit=50&access_token=${accessToken}`;

			const [feedRes, photosRes, reelsRes, storiesRes] = await Promise.allSettled([
				paginateEdge(feedUrl, sinceDate, true),
				paginateEdge(photosUrl, sinceDate, true),
				paginateEdge(reelsUrl, sinceDate, false),
				paginateEdge(storiesUrl, sinceDate, true),
			]);

			const itemMap = new Map<string, any>();

			const addItem = (item: any) => {
				const existing = itemMap.get(item.id);
				if (!existing) {
					itemMap.set(item.id, item);
				} else {
					if (item.type !== 'post' && existing.type === 'post') {
						existing.type = item.type;
					}
					if (item.views !== null && existing.views === null) {
						existing.views = item.views;
					}
					if (item.isEphemeral) {
						existing.isEphemeral = true;
					}
					if (item.thumbnail && !existing.thumbnail) {
						existing.thumbnail = item.thumbnail;
					}
				}
			};

			const feedPhotoNodeIds = new Set<string>();
			const feedTimestampMinutes = new Set<string>();

			// Process Feed Edge
			if (feedRes.status === 'fulfilled') {
				for (const item of feedRes.value) {
					if (item.created_time) {
						feedTimestampMinutes.add(utcMinute(item.created_time));
					}
					const targetId = item.attachments?.data?.[0]?.target?.id ?? item.attachments?.data?.[0]?.object_id;
					if (targetId) {
						feedPhotoNodeIds.add(String(targetId));
					}

					const attachments = item.attachments?.data || [];
					const firstAttach = attachments[0];
					const subattachments = firstAttach?.subattachments?.data || [];

					let type: 'post' | 'carousel' | 'link' | 'reel' | 'story' = 'post';
					let mediaCount: number | undefined = undefined;

					if (subattachments.length > 1 || firstAttach?.type === 'album' || firstAttach?.media_type === 'album') {
						type = 'carousel';
						mediaCount = subattachments.length || 2;
					} else if (firstAttach?.type === 'share' || firstAttach?.url || item.message?.includes('http')) {
						type = 'link';
					}

					const reactions = item.reactions?.summary?.total_count || 0;
					const comments = item.comments?.summary?.total_count || 0;
					const shares = item.shares?.count || 0;

					addItem({
						id: item.id,
						type,
						title: item.message ? (item.message.length > 80 ? item.message.slice(0, 80) + '...' : item.message) : 'Facebook Post',
						message: item.message || '',
						publishedAt: toSafeIsoString(item.created_time),
						createdTime: toSafeIsoString(item.created_time),
						postUrl: item.permalink_url || `https://facebook.com/${item.id}`,
						permalink: item.permalink_url || `https://facebook.com/${item.id}`,
						thumbnail: item.full_picture || '',
						mediaCount,
						views: null,
						reactions,
						comments,
						shares,
						engagementRate: 0,
					});
				}
			} else {
				console.warn('[Facebook Insights] Feed edge error:', feedRes.reason);
				partialErrors.push('feed: Feed posts edge failed to load');
			}

			// Process Photos Edge (with cross-edge deduplication against Feed)
			if (photosRes.status === 'fulfilled') {
				for (const item of photosRes.value) {
					const isDuplicate = (feedPhotoNodeIds.size > 0 && feedPhotoNodeIds.has(String(item.id)))
						|| (item.created_time ? feedTimestampMinutes.has(utcMinute(item.created_time)) : false);
					
					if (isDuplicate) continue;

					const reactions = item.reactions?.summary?.total_count || 0;
					const comments = item.comments?.summary?.total_count || 0;
					const thumb = item.picture || item.images?.[0]?.source || '';

					addItem({
						id: item.id,
						type: 'post',
						title: item.name ? (item.name.length > 80 ? item.name.slice(0, 80) + '...' : item.name) : 'Photo Post',
						message: item.name || '',
						publishedAt: toSafeIsoString(item.created_time),
						createdTime: toSafeIsoString(item.created_time),
						postUrl: item.link || `https://facebook.com/${item.id}`,
						permalink: item.link || `https://facebook.com/${item.id}`,
						thumbnail: thumb,
						views: null,
						reactions,
						comments,
						shares: 0,
						engagementRate: 0,
					});
				}
			} else {
				console.warn('[Facebook Insights] Photos edge error:', photosRes.reason);
				partialErrors.push('photos: Uploaded photos edge failed to load');
			}

			// Process Reels Edge (defensive best-effort view counts)
			if (reelsRes.status === 'fulfilled') {
				const reels = reelsRes.value;
				const reelViewsList = await Promise.allSettled(
					reels.map((r: any) => {
						const videoId = r.video?.id || r.id;
						return fetch(`${API_BASE}/${videoId}?fields=views,play_count&access_token=${accessToken}`)
							.then(async (res) => (res.ok ? res.json() : null))
							.catch(() => null);
					})
				);

				reels.forEach((item: any, idx: number) => {
					const vRes = reelViewsList[idx];
					const vData = vRes.status === 'fulfilled' ? vRes.value : null;
					const rawViews = vData?.views ?? vData?.play_count ?? item.views ?? item.video?.views ?? item.video?.play_count;
					const numericViews = typeof rawViews === 'number' ? rawViews : null;

					const reactions = item.reactions?.summary?.total_count || 0;
					const comments = item.comments?.summary?.total_count || 0;

					addItem({
						id: item.id,
						type: 'reel',
						title: item.description ? (item.description.length > 80 ? item.description.slice(0, 80) + '...' : item.description) : 'Facebook Reel',
						message: item.description || '',
						publishedAt: toSafeIsoString(item.created_time),
						createdTime: toSafeIsoString(item.created_time),
						postUrl: item.permalink_url || `https://facebook.com/reel/${item.id}`,
						permalink: item.permalink_url || `https://facebook.com/reel/${item.id}`,
						thumbnail: item.thumbnail_url || '',
						views: numericViews,
						reactions,
						comments,
						shares: 0,
						engagementRate: 0,
					});
				});
			} else {
				console.warn('[Facebook Insights] Reels edge error:', reelsRes.reason);
				partialErrors.push('reels: Reels edge failed to load');
			}

			// Process Stories Edge
			if (storiesRes.status === 'fulfilled') {
				for (const item of storiesRes.value) {
					const reactions = item.reactions?.summary?.total_count || 0;
					addItem({
						id: item.id,
						type: 'story',
						title: 'Facebook Story (Live <24h)',
						message: 'Active Page Story',
						publishedAt: toSafeIsoString(item.creation_time),
						createdTime: toSafeIsoString(item.creation_time),
						postUrl: item.url || `https://facebook.com/${accountId}`,
						permalink: item.url || `https://facebook.com/${accountId}`,
						thumbnail: item.media_url || '',
						views: null,
						reactions,
						comments: 0,
						shares: 0,
						engagementRate: 0,
						isEphemeral: true,
					});
				}
			} else {
				console.warn('[Facebook Insights] Stories edge warning:', storiesRes.reason);
			}

			const allPosts = Array.from(itemMap.values()).sort(
				(a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
			);

			// Calculate canonical engagement rate: (reactions + comments + shares) / followers * 100
			const totalLikes = allPosts.reduce((sum, p) => sum + p.reactions, 0);
			const totalComments = allPosts.reduce((sum, p) => sum + p.comments, 0);
			const totalShares = allPosts.reduce((sum, p) => sum + (p.shares || 0), 0);
			const totalViews = allPosts.reduce((sum, p) => sum + (p.views || 0), 0);

			allPosts.forEach((p) => {
				const engSum = p.reactions + p.comments + (p.shares || 0);
				p.engagementRate = followers > 0 ? parseFloat(((engSum / followers) * 100).toFixed(2)) : 0;
			});

			const avgEngagementRate = followers > 0
				? parseFloat((((totalLikes + totalComments + totalShares) / followers) * 100).toFixed(2))
				: 0;

			return {
				channelName,
				channelAvatar,
				followers,
				media: allPosts,
				totalViews,
				totalLikes,
				totalComments,
				avgEngagementRate,
				partialErrors,
			};
		} catch (err: any) {
			console.error('Error in Facebook getInsights:', err);
			throw err;
		}
	}
};
