import type { PlatformService, AuthorizeUrlResult, ExchangeInput, ExchangeResult, PublishInput, PublishResult, LinkedInContentType, RefreshTokenInput, RefreshTokenResult } from './types';
import {
	buildCommentary,
	buildImageContent,
	buildPostsTextPayload,
	buildPostsDocumentPayload,
	buildUgqShareContent,
	buildArticleContent,
	buildVideoContent,
	LINKEDIN_VERSION,
	uploadLinkedInDocument,
	uploadLegacyLinkedInImage,
	uploadLinkedInImage,
	uploadLinkedInPdfBuffer,
	uploadLinkedInVideo,
} from '@/lib/renderers/linkedin';

export function formatLinkedInPostUrl(postId: string): string {
	if (!postId) return '';
	if (postId.startsWith('http')) return postId;
	const parts = postId.split(':');
	const numericId = parts[parts.length - 1];
	if (numericId && /^\d+$/.test(numericId)) {
		return `https://www.linkedin.com/feed/update/urn:li:activity:${numericId}`;
	}
	return `https://www.linkedin.com/feed/update/${postId}`;
}

const API_BASE = 'https://api.linkedin.com';
const OAUTH_BASE = 'https://www.linkedin.com/oauth/v2';
const SCOPES = process.env.LINKEDIN_SCOPES || 'openid profile email w_member_social';

export function getLinkedInConfig() {
	return {
		clientId: process.env.LINKEDIN_CLIENT_ID || '',
		clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
		redirectUri: process.env.LINKEDIN_REDIRECT_URI || '',
	};
}

export const linkedinService: PlatformService = {
	async buildAuthorizeUrl({ redirectUri, state }): Promise<AuthorizeUrlResult> {
		const { clientId } = getLinkedInConfig();
		if (!clientId) throw new Error('LINKEDIN_CLIENT_ID is not configured.');

		const params = new URLSearchParams({
			response_type: 'code',
			client_id: clientId,
			redirect_uri: redirectUri,
			scope: SCOPES,
			state,
		});
		return { url: `${OAUTH_BASE}/authorization?${params.toString()}` };
	},

	async exchangeCode({ code, redirectUri }: ExchangeInput): Promise<ExchangeResult> {
		const { clientId, clientSecret } = getLinkedInConfig();
		if (!clientId || !clientSecret) throw new Error('LinkedIn app credentials are not configured.');

		const tokenRes = await fetch(`${OAUTH_BASE}/accessToken`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				code,
				redirect_uri: redirectUri,
				client_id: clientId,
				client_secret: clientSecret,
			}),
		});
		if (!tokenRes.ok) {
			const body = await tokenRes.text();
			throw new Error(`LinkedIn token exchange failed (${tokenRes.status}): ${body.slice(0, 300)}`);
		}
		const tokenData = await tokenRes.json();

		const meRes = await fetch(`${API_BASE}/v2/userinfo`, {
			headers: { Authorization: `Bearer ${tokenData.access_token}` },
		});
		if (!meRes.ok) {
			throw new Error(`LinkedIn profile fetch failed (${meRes.status}).`);
		}
		const me = await meRes.json();
		const accountName = me.name || me.email || 'LinkedIn user';

		return {
			accessToken: tokenData.access_token,
			refreshToken: tokenData.refresh_token,
			expiresIn: tokenData.expires_in,
			accountId: me.sub,
			accountName,
			scopes: (tokenData.scope || SCOPES).split(/\s+/).filter(Boolean),
		};
	},

	async refreshToken({ refreshToken, clientId, clientSecret }: RefreshTokenInput): Promise<RefreshTokenResult> {
		if (!refreshToken) throw new Error('Refresh token is required.');
		if (!clientId || !clientSecret) throw new Error('LinkedIn app credentials are not configured.');

		const tokenRes = await fetch(`${OAUTH_BASE}/accessToken`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'refresh_token',
				refresh_token: refreshToken,
				client_id: clientId,
				client_secret: clientSecret,
			}),
		});
		if (!tokenRes.ok) {
			const body = await tokenRes.text();
			throw new Error(`LinkedIn token refresh failed (${tokenRes.status}): ${body.slice(0, 300)}`);
		}
		const tokenData = await tokenRes.json();

		return {
			accessToken: tokenData.access_token,
			refreshToken: tokenData.refresh_token || refreshToken,
			expiresIn: tokenData.expires_in,
		};
	},

	async publish({ accessToken, accountId, caption, imageUrl, linkedInContentType = 'post', slides, size, link, documentDataUrl, documentName, articleTitle, articleDescription, articleThumbnail, videoDataUrl, videoName, videoType, videoTitle }: PublishInput): Promise<PublishResult> {
		const headers: Record<string, string> = {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
			'X-Restli-Protocol-Version': '2.0.0',
		};

		let author: string;
		if (accountId) {
			author = `urn:li:person:${accountId}`;
		} else {
			const meRes = await fetch(`${API_BASE}/v2/userinfo`, { headers: { Authorization: `Bearer ${accessToken}` } });
			if (!meRes.ok) throw new Error('Unable to verify LinkedIn identity.');
			const me = await meRes.json();
			author = `urn:li:person:${me.sub}`;
		}

		if (linkedInContentType === 'carousel') {
			try {
				return await publishCarouselDocument({ accessToken, author, caption, slides, size, headers, link, documentDataUrl, documentName });
			} catch (carouselErr: any) {
				console.warn('LinkedIn document carousel publishing failed; falling back to legacy multi-image post:', carouselErr);
				
				// Fallback to legacy ugcPosts API with multiple images if slides are available!
				if (slides && slides.length > 0) {
					const media: unknown[] = [];
					
					// Upload each slide image
					for (let i = 0; i < slides.length; i++) {
						const slide = slides[i];
						if (slide.imageUrl) {
							try {
								const asset = await uploadLegacyLinkedInImage(accessToken, author, slide.imageUrl);
								media.push({
									status: 'READY',
									description: { text: `Slide ${i + 1}` },
									media: asset.asset,
									title: { text: `Slide ${i + 1}` },
								});
							} catch (uploadErr) {
								console.error(`Failed to upload slide image ${i + 1}:`, uploadErr);
							}
						}
					}
					
					if (media.length > 0) {
						const postRes = await fetch(`${API_BASE}/v2/ugcPosts`, {
							method: 'POST',
							headers: {
								Authorization: `Bearer ${accessToken}`,
								'Content-Type': 'application/json',
								'X-Restli-Protocol-Version': '2.0.0',
							},
							body: JSON.stringify({
								author,
								lifecycleState: 'PUBLISHED',
								specificContent: buildUgqShareContent(buildCommentary(caption, link), media, 'IMAGE'),
								visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
							}),
						});

						if (postRes.ok) {
							const postData = await postRes.json();
							const postId = postData.id;
							const postUrl = postId ? `https://www.linkedin.com/feed/update/${postId}` : '';

							return {
								platform: 'linkedin',
								postId: postId || '',
								postUrl: postUrl || '',
								publishedAt: new Date().toISOString(),
								rawResponse: postData,
							};
						} else {
							const body = await postRes.text();
							throw new Error(`LinkedIn fallback multi-image post failed (${postRes.status}): ${body}`);
						}
					}
				}
				
				// Re-throw the original error if we couldn't do legacy fallback
				throw carouselErr;
			}
		}

		if (linkedInContentType === 'video') {
			return publishVideo({ accessToken, author, caption, headers, link, videoDataUrl, videoName, videoType, videoTitle });
		}

		const useLegacy = process.env.LINKEDIN_LEGACY_UGC === '1';

		if (useLegacy) {
			let media: unknown[] = [];
			let shareMediaCategory = 'NONE';

			if (imageUrl) {
				const asset = await uploadLegacyLinkedInImage(accessToken, author, imageUrl);
				media = [
					{
						status: 'READY',
						description: { text: caption.slice(0, 200) },
						media: asset.asset,
						title: { text: caption.slice(0, 100) || 'Image' },
					},
				];
				shareMediaCategory = 'IMAGE';
			}

			const postRes = await fetch(`${API_BASE}/v2/ugcPosts`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					author,
					lifecycleState: 'PUBLISHED',
					specificContent: buildUgqShareContent(buildCommentary(caption, link), media, shareMediaCategory),
					visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
				}),
			});

			if (!postRes.ok) {
				const body = await postRes.text();
				throw new Error(`LinkedIn post failed (${postRes.status}): ${body.slice(0, 300)}`);
			}

			const postData = await postRes.json();
			const postId = postData.id;
			const postUrl = formatLinkedInPostUrl(postId);

			return {
				platform: 'linkedin',
				postId: postId || '',
				postUrl: postUrl,
				publishedAt: new Date().toISOString(),
				rawResponse: postData,
			};
		}

		// Posts API path (default)
		try {
			let imageUrn: string | undefined;

			if (imageUrl) {
				const uploaded = await uploadLinkedInImage(accessToken, author, imageUrl);
				imageUrn = uploaded.imageUrn;
			}

			const postsHeaders: Record<string, string> = {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
				'Linkedin-Version': process.env.LINKEDIN_VERSION || LINKEDIN_VERSION,
			};

			let content: any = imageUrn ? buildImageContent(imageUrn) : undefined;
			if (linkedInContentType === 'article' && link) {
				let articleThumbnailUrn: string | undefined;
				if (articleThumbnail) {
					const uploaded = await uploadLinkedInImage(accessToken, author, articleThumbnail);
					articleThumbnailUrn = uploaded.imageUrn;
				}
				content = buildArticleContent(link, articleTitle, articleDescription, articleThumbnailUrn);
			}
			const commentary = linkedInContentType === 'article' ? caption : buildCommentary(caption, link);
			const payload = buildPostsTextPayload(author, commentary, content);

			const postRes = await fetch(`${API_BASE}/rest/posts`, {
				method: 'POST',
				headers: postsHeaders,
				body: JSON.stringify(payload),
			});

			if (postRes.ok) {
				const postId = postRes.headers.get('x-restli-id') || '';
				const postUrl = formatLinkedInPostUrl(postId);

				return {
					platform: 'linkedin',
					postId,
					postUrl,
					publishedAt: new Date().toISOString(),
					rawResponse: {},
				};
			} else {
				const body = await postRes.text();
				console.warn(`LinkedIn Posts API failed (${postRes.status}): ${body}. Trying legacy fallback...`);
			}
		} catch (e) {
			console.warn('LinkedIn Posts API failed; trying legacy ugcPosts fallback:', e);
		}

		// Fallback to legacy ugcPosts API
		let media: unknown[] = [];
		let shareMediaCategory = 'NONE';

		if (imageUrl) {
			const asset = await uploadLegacyLinkedInImage(accessToken, author, imageUrl);
			media = [
				{
					status: 'READY',
					description: { text: caption.slice(0, 200) },
					media: asset.asset,
					title: { text: caption.slice(0, 100) || 'Image' },
				},
			];
			shareMediaCategory = 'IMAGE';
		}

		const postRes = await fetch(`${API_BASE}/v2/ugcPosts`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
				'X-Restli-Protocol-Version': '2.0.0',
			},
			body: JSON.stringify({
				author,
				lifecycleState: 'PUBLISHED',
				specificContent: buildUgqShareContent(buildCommentary(caption, link), media, shareMediaCategory),
				visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
			}),
		});

		if (!postRes.ok) {
			const body = await postRes.text();
			throw new Error(`LinkedIn post failed (${postRes.status}): ${body.slice(0, 300)}`);
		}

		const postData = await postRes.json();
		const postId = postData.id;
		const postUrl = formatLinkedInPostUrl(postId);

		return {
			platform: 'linkedin',
			postId: postId || '',
			postUrl: postUrl,
			publishedAt: new Date().toISOString(),
			rawResponse: postData,
		};
	},
};

interface CarouselPublishParams {
	accessToken: string;
	author: string;
	caption: string;
	slides?: { imageUrl?: string }[];
	size?: '4/5' | '1/1';
	headers: Record<string, string>;
	link?: string;
	documentDataUrl?: string;
	documentName?: string;
}

async function publishCarouselDocument({ accessToken, author, caption, slides = [], size, headers, link, documentDataUrl, documentName }: CarouselPublishParams): Promise<PublishResult> {
	const { documentUrn, pageCount } = documentDataUrl
		? await uploadLinkedInPdfBuffer(accessToken, author, documentDataUrl)
		: await uploadLinkedInDocument(accessToken, author, slides, size || '4/5');

	const documentTitle = documentName?.trim() || 'Carousel.pdf';

	const postsHeaders: Record<string, string> = {
		...headers,
		'Linkedin-Version': process.env.LINKEDIN_VERSION || LINKEDIN_VERSION,
	};
	const postRes = await fetch(`${API_BASE}/rest/posts`, {
		method: 'POST',
		headers: postsHeaders,
		body: JSON.stringify(buildPostsDocumentPayload(author, buildCommentary(caption, link), documentUrn, documentTitle)),
	});
	if (!postRes.ok) {
		const body = await postRes.text();
		throw new Error(`LinkedIn document post failed (${postRes.status}): ${body.slice(0, 300)}`);
	}

	const postId = postRes.headers.get('x-restli-id') || '';
	const postUrl = formatLinkedInPostUrl(postId);

	return {
		platform: 'linkedin',
		postId,
		postUrl: postUrl,
		publishedAt: new Date().toISOString(),
		analytics: { impressions: 0 },
		rawResponse: { documentPages: pageCount },
	};
}

interface VideoPublishParams {
	accessToken: string;
	author: string;
	caption: string;
	headers: Record<string, string>;
	link?: string;
	videoDataUrl?: string;
	videoName?: string;
	videoType?: string;
	videoTitle?: string;
}

async function publishVideo({ accessToken, author, caption, headers, link, videoDataUrl, videoName, videoType, videoTitle }: VideoPublishParams): Promise<PublishResult> {
	if (!videoDataUrl) {
		throw new Error('A video post needs a video file.');
	}

	const { videoUrn } = await uploadLinkedInVideo(accessToken, author, videoDataUrl, videoType);

	const postsHeaders: Record<string, string> = {
		...headers,
		'Linkedin-Version': process.env.LINKEDIN_VERSION || LINKEDIN_VERSION,
	};
	const mediaTitle = videoTitle?.trim() || videoName?.replace(/\.[^.]+$/, '') || 'Video';
	const postRes = await fetch(`${API_BASE}/rest/posts`, {
		method: 'POST',
		headers: postsHeaders,
		body: JSON.stringify(buildPostsTextPayload(author, buildCommentary(caption, link), buildVideoContent(videoUrn, mediaTitle))),
	});
	if (!postRes.ok) {
		const body = await postRes.text();
		throw new Error(`LinkedIn video post failed (${postRes.status}): ${body.slice(0, 300)}`);
	}

	const postId = postRes.headers.get('x-restli-id') || '';
	const postUrl = formatLinkedInPostUrl(postId);

	return {
		platform: 'linkedin',
		postId,
		postUrl: postUrl,
		publishedAt: new Date().toISOString(),
		analytics: { impressions: 0 },
		rawResponse: { videoUrn },
	};
}
