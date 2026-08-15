import crypto from 'crypto';
import type { PlatformService, AuthorizeUrlResult, ExchangeInput, ExchangeResult, PublishInput, PublishResult } from './types';

const API_BASE = 'https://api.twitter.com/2';
const UPLOAD_BASE = 'https://api.x.com';
const SCOPES = 'tweet.read tweet.write users.read offline.access media.write';

export function getXConfig() {
	return {
		clientId: process.env.X_CLIENT_ID || '',
		clientSecret: process.env.X_CLIENT_SECRET || '',
		redirectUri: process.env.X_REDIRECT_URI || '',
	};
}

function generateCodeVerifier(): { verifier: string; challenge: string } {
	const verifier = crypto.randomBytes(32).toString('base64url');
	const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
	return { verifier, challenge };
}

export function generatePkceVerifier(): string {
	return crypto.randomBytes(32).toString('base64url');
}

export const xService: PlatformService = {
	async buildAuthorizeUrl({ redirectUri, state, pkceVerifier }): Promise<AuthorizeUrlResult> {
		if (process.env.BUFFER_API_KEY) {
			const callbackUrl = new URL(redirectUri);
			callbackUrl.searchParams.set('code', 'buffer_bypass');
			callbackUrl.searchParams.set('state', state);
			return { url: callbackUrl.toString() };
		}

		const { clientId } = getXConfig();
		if (!clientId) throw new Error('X_CLIENT_ID is not configured.');

		const { verifier, challenge } = pkceVerifier
			? { verifier: pkceVerifier, challenge: crypto.createHash('sha256').update(pkceVerifier).digest('base64url') }
			: generateCodeVerifier();
		const params = new URLSearchParams({
			response_type: 'code',
			client_id: clientId,
			redirect_uri: redirectUri,
			scope: SCOPES,
			state,
			code_challenge: challenge,
			code_challenge_method: 'S256',
		});
		return { url: `https://twitter.com/i/oauth2/authorize?${params.toString()}`, pkceVerifier: verifier, pkceChallenge: challenge };
	},

	async exchangeCode({ code, redirectUri, pkceVerifier }: ExchangeInput): Promise<ExchangeResult> {
		if (process.env.BUFFER_API_KEY) {
			const token = process.env.BUFFER_API_KEY;
			
			// 1. Fetch organization ID
			const orgRes = await fetch('https://api.buffer.com', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					query: `query { account { organizations { id } } }`
				})
			});
			if (!orgRes.ok) throw new Error('Failed to query Buffer organizations.');
			const orgData = await orgRes.json();
			const orgId = orgData.data?.account?.organizations?.[0]?.id;
			if (!orgId) throw new Error('No organization found in your Buffer account.');

			// 2. Fetch channels
			const chanRes = await fetch('https://api.buffer.com', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					query: `
						query {
							channels(input: { organizationId: "${orgId}" }) {
								id
								name
								service
							}
						}
					`
				})
			});
			if (!chanRes.ok) throw new Error('Failed to query Buffer channels.');
			const chanData = await chanRes.json();
			const twitterChan = (chanData.data?.channels || []).find((c: any) => c.service === 'twitter');
			if (!twitterChan) {
				throw new Error('No connected X (Twitter) channel found in your Buffer account. Please connect X in Buffer first!');
			}

			return {
				accessToken: token,
				accountId: twitterChan.id,
				accountName: twitterChan.name || 'X Profile',
				expiresIn: 3600 * 24 * 365,
				scopes: ['tweet.read', 'tweet.write'],
			};
		}

		const { clientId, clientSecret } = getXConfig();
		if (!clientId || !clientSecret) throw new Error('X app credentials are not configured.');
		if (!pkceVerifier) throw new Error('Missing PKCE verifier for X OAuth exchange.');

		const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
		const tokenRes = await fetch(`${API_BASE}/oauth2/token`, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${basic}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				code,
				redirect_uri: redirectUri,
				code_verifier: pkceVerifier,
			}),
		});
		if (!tokenRes.ok) {
			const body = await tokenRes.text();
			throw new Error(`X token exchange failed (${tokenRes.status}): ${body.slice(0, 300)}`);
		}
		const tokenData = await tokenRes.json();

		const meRes = await fetch(`${API_BASE}/users/me`, {
			headers: { Authorization: `Bearer ${tokenData.access_token}` },
		});
		if (!meRes.ok) throw new Error(`X profile fetch failed (${meRes.status}).`);
		const me = await meRes.json();

		return {
			accessToken: tokenData.access_token,
			refreshToken: tokenData.refresh_token,
			expiresIn: tokenData.expires_in,
			accountId: me.data?.id,
			accountName: me.data?.username || me.data?.name || 'X user',
			scopes: (tokenData.scope || SCOPES).split(/\s+/).filter(Boolean),
		};
	},

	async publish(input: PublishInput): Promise<PublishResult> {
		if (process.env.BUFFER_API_KEY) {
			const token = process.env.BUFFER_API_KEY;
			const channelId = input.accountId;
			if (!channelId) throw new Error('Buffer Channel ID is required to publish.');

			let assetsClause = '';
			if (input.imageUrl) {
				assetsClause = `, assets: [{ image: { url: "${input.imageUrl}" } }]`;
			} else if (input.videoUrl) {
				assetsClause = `, assets: [{ video: { url: "${input.videoUrl}" } }]`;
			}

			const query = `
				mutation {
					createPost(
						input: {
							text: "${input.caption.replace(/"/g, '\\"')}",
							channelId: "${channelId}",
							schedulingType: automatic,
							mode: shareNow
							${assetsClause}
						}
					) {
						... on PostActionSuccess {
							post {
								id
								text
							}
						}
						... on MutationError {
							errors {
								message
							}
						}
					}
				}
			`;

			const res = await fetch('https://api.buffer.com', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ query })
			});

			if (!res.ok) {
				const body = await res.text();
				throw new Error(`Buffer post creation failed: ${body.slice(0, 300)}`);
			}

			const data = await res.json();
			const errors = data.errors || data.data?.createPost?.errors;
			if (errors && errors.length > 0) {
				throw new Error(errors[0].message || 'Buffer API returned an error.');
			}

			const postId = data.data?.createPost?.post?.id;
			return {
				postUrl: postId ? `https://publish.buffer.com/profile/${channelId}` : 'https://publish.buffer.com',
				postId
			};
		}

		const { accessToken, caption, imageUrl } = input;
		const headers: Record<string, string> = {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
		};

		const body: Record<string, unknown> = { text: caption };
		if (imageUrl) {
			const mime = imageUrl.match(/^data:([^;,]+)[;,]/)?.[1] || 'image/png';
			const buffer = imageUrlToBuffer(imageUrl);
			const mediaRes = await fetch(`${UPLOAD_BASE}/2/media/upload`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					media: buffer.toString('base64'),
					media_category: 'tweet_image',
					media_type: mime,
				}),
			});
			if (!mediaRes.ok) {
				const err = await mediaRes.text();
				throw new Error(
					`X media upload failed (${mediaRes.status}): ${err.slice(0, 300)}.`
				);
			}
			const mediaData = await mediaRes.json();
			body.media = { media_ids: [mediaData.data?.id] };
		}

		const postRes = await fetch(`${API_BASE}/tweets`, {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});
		if (!postRes.ok) {
			const err = await postRes.text();
			throw new Error(`X post failed (${postRes.status}): ${err.slice(0, 300)}`);
		}
		const postData = await postRes.json();
		return {
			postUrl: postData.data?.id ? `https://x.com/i/web/status/${postData.data.id}` : undefined,
		};
	},
};

function imageUrlToBuffer(url: string): Buffer {
	if (url.startsWith('data:')) {
		const match = url.match(/^data:[^;]+;base64,(.*)$/);
		if (!match) throw new Error('Invalid base64 data URL format.');
		return Buffer.from(match[1], 'base64');
	}
	throw new Error('Image URL must be base64 data URL for X upload.');
}
