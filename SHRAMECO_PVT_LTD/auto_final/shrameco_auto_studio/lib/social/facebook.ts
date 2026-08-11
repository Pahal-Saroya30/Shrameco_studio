import type { PlatformService, AuthorizeUrlResult, ExchangeInput, ExchangeResult, PublishInput, PublishResult } from './types';

const API_BASE = 'https://graph.facebook.com/v25.0';
const OAUTH_BASE = 'https://www.facebook.com/v25.0/dialog/oauth';
const SCOPES = 'pages_show_list pages_manage_posts pages_read_engagement public_profile';

export function getFacebookConfig() {
	return {
		clientId: process.env.FACEBOOK_CLIENT_ID || '',
		clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
		redirectUri: process.env.FACEBOOK_REDIRECT_URI || '',
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
			client_secret: clientSecret,
			redirect_uri: redirectUri,
			code,
		});
		const tokenRes = await fetch(`${API_BASE}/oauth/access_token?${tokenParams.toString()}`);
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
		if (!pagesRes.ok) {
			throw new Error(`Failed to fetch Facebook Pages (${pagesRes.status}).`);
		}
		const pagesData = await pagesRes.json();
		const pages = pagesData.data || [];

		if (pages.length === 0) {
			throw new Error('No Facebook Page found under this account. Please create a Facebook Page first.');
		}

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
	},

	async publishReel(input: PublishInput): Promise<PublishResult> {
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
			const base64Data = videoDataUrl.replace(/^data:[^;]+;base64,/, '');
			const buffer = Buffer.from(base64Data, 'base64');
			const match = videoDataUrl.match(/^data:([^;,]+)[;,]/);
			const mime = match ? match[1] : 'video/mp4';
			blobToUpload = new Blob([buffer], { type: mime });
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
		const maxAttempts = 10;
		for (let i = 0; i < maxAttempts; i++) {
			await new Promise((resolve) => setTimeout(resolve, 2000));
			try {
				const statusRes = await fetch(`${API_BASE}/${videoId}?fields=status&access_token=${accessToken}`);
				if (statusRes.ok) {
					const statusData = await statusRes.json();
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
			postUrl: `https://facebook.com/reel/${videoId}`,
		};
	},

	async publish(input: PublishInput): Promise<PublishResult> {
		if (input.contentFormat === 'reel') {
			return this.publishReel!(input);
		}

		const { accessToken, accountId, caption, imageUrl } = input;
		if (!accountId) throw new Error('Facebook Page ID is required to publish.');

		// Facebook Story Publishing Flow (/{page-id}/photo_stories)
		if (input.contentFormat === 'story') {
			if (!accountId) throw new Error('Facebook Page ID is required to publish a Story.');

			const slides = input.carouselImages && input.carouselImages.length > 0
				? input.carouselImages
				: (imageUrl ? [imageUrl] : []);

			if (slides.length === 0) {
				throw new Error('A Story post requires at least one image slide.');
			}

			// Upload each slide as a photo to /{page-id}/photo_stories
			const storyEndpoint = `${API_BASE}/${accountId}/photo_stories`;

			for (const imgUrl of slides) {
				let storyRes: Response;

				if (imgUrl.startsWith('data:')) {
					const formData = new FormData();
					formData.append('access_token', accessToken);
					const match = imgUrl.match(/^data:([^;,]+)[;,]/);
					const mime = match ? match[1] : 'image/jpeg';
					const base64Data = imgUrl.replace(/^data:[^;]+;base64,/, '');
					const buffer = Buffer.from(base64Data, 'base64');
					const blob = new Blob([buffer], { type: mime });
					formData.append('source', blob, `story-${Date.now()}.jpg`);
					storyRes = await fetch(storyEndpoint, { method: 'POST', body: formData });
				} else {
					const bodyParams = new URLSearchParams({
						access_token: accessToken,
						url: imgUrl,
					});
					storyRes = await fetch(storyEndpoint, {
						method: 'POST',
						headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
						body: bodyParams,
					});
				}

				if (!storyRes.ok) {
					const err = await storyRes.text();
					throw new Error(`Facebook Story slide upload failed (${storyRes.status}): ${err.slice(0, 300)}`);
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

				if (imgUrl.startsWith('data:')) {
					const formData = new FormData();
					formData.append('access_token', accessToken);
					formData.append('published', 'false');

					const match = imgUrl.match(/^data:([^;,]+)[;,]/);
					const mime = match ? match[1] : 'image/png';
					const base64Data = imgUrl.replace(/^data:[^;]+;base64,/, '');
					const buffer = Buffer.from(base64Data, 'base64');
					const blob = new Blob([buffer], { type: mime });

					formData.append('source', blob, `carousel-${Date.now()}.png`);

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
			const videoEndpoint = `${API_BASE}/${accountId}/videos`;
			const formData = new FormData();
			formData.append('access_token', accessToken);
			formData.append('description', caption);

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

			return {
				postUrl: postId ? `https://facebook.com/${postId}` : `https://facebook.com/${accountId}`,
			};
		}

		let endpoint = `${API_BASE}/${accountId}/feed`;

		if (imageUrl) {
			endpoint = `${API_BASE}/${accountId}/photos`;

			if (imageUrl.startsWith('data:')) {
				// Base64 Data URL upload via FormData 'source' parameter
				const formData = new FormData();
				formData.append('access_token', accessToken);
				formData.append('caption', caption);

				const match = imageUrl.match(/^data:([^;,]+)[;,]/);
				const mime = match ? match[1] : 'image/png';
				const base64Data = imageUrl.replace(/^data:[^;]+;base64,/, '');
				const buffer = Buffer.from(base64Data, 'base64');
				const blob = new Blob([buffer], { type: mime });

				formData.append('source', blob, `brand-poster-${Date.now()}.png`);

				const postRes = await fetch(endpoint, {
					method: 'POST',
					body: formData,
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
};
