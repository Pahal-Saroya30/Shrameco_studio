import type { PlatformService, AuthorizeUrlResult, ExchangeInput, ExchangeResult, PublishInput, PublishResult } from './types';

const API_BASE = 'https://api.linkedin.com';
const OAUTH_BASE = 'https://www.linkedin.com/oauth/v2';
const SCOPES = 'openid profile email w_member_social';

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

	async publish({ accessToken, caption, imageUrl }: PublishInput): Promise<PublishResult> {
		const headers: Record<string, string> = {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
			'X-Restli-Protocol-Version': '2.0.0',
		};

		const meRes = await fetch(`${API_BASE}/v2/userinfo`, { headers: { Authorization: `Bearer ${accessToken}` } });
		if (!meRes.ok) throw new Error('Unable to verify LinkedIn identity.');
		const me = await meRes.json();
		const personId = me.sub;
		const author = `urn:li:person:${personId}`;

		let media: unknown[] = [];
		let shareMediaCategory = 'NONE';

		if (imageUrl) {
			const asset = await uploadLinkedInImage(accessToken, author, imageUrl);
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
				specificContent: {
					'com.linkedin.ugc.ShareContent': {
						shareCommentary: { text: caption },
						shareMediaCategory,
						media,
					},
				},
				visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
			}),
		});

		if (!postRes.ok) {
			const body = await postRes.text();
			throw new Error(`LinkedIn post failed (${postRes.status}): ${body.slice(0, 300)}`);
		}

		const postData = await postRes.json();
		return { postUrl: postData.id ? `https://www.linkedin.com/feed/update/${postData.id}` : undefined };
	},
};

async function uploadLinkedInImage(accessToken: string, author: string, imageUrl: string) {
	const registerRes = await fetch(`${API_BASE}/v2/assets?action=registerUpload`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
			'X-Restli-Protocol-Version': '2.0.0',
		},
		body: JSON.stringify({
			registerUploadRequest: {
				recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
				owner: author,
				serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
			},
		}),
	});
	if (!registerRes.ok) {
		const body = await registerRes.text();
		throw new Error(`LinkedIn upload registration failed (${registerRes.status}): ${body.slice(0, 300)}`);
	}
	const registerData = await registerRes.json();
	const mechanism = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'];
	const uploadUrl: string = mechanism.uploadUrl;
	const asset: string = registerData.value.asset;

	const buffer = imageUrlToBuffer(imageUrl);
	const uploadRes = await fetch(uploadUrl, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/octet-stream' },
		body: new Uint8Array(buffer),
	});
	if (!uploadRes.ok) {
		throw new Error(`LinkedIn image upload failed (${uploadRes.status}).`);
	}

	return { asset };
}

function imageUrlToBuffer(url: string): Buffer {
	if (url.startsWith('data:')) {
		const match = url.match(/^data:[^;]+;base64,(.*)$/);
		if (!match) throw new Error('Invalid base64 data URL format.');
		return Buffer.from(match[1], 'base64');
	}
	throw new Error('Image URL must be base64 data URL for LinkedIn upload.');
}
