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
		if (!clientId) throw new Error('INSTAGRAM_CLIENT_ID is not configured.');

		const params = new URLSearchParams({
			client_id: clientId,
			redirect_uri: redirectUri,
			state,
			response_type: 'code',
			scope: SCOPES,
		});
		return { url: `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}` };
	},

	async exchangeCode({ code, redirectUri }: ExchangeInput): Promise<ExchangeResult> {
		const { clientId, clientSecret } = getInstagramConfig();
		if (!clientId || !clientSecret) throw new Error('Instagram app credentials are not configured.');

		const tokenRes = await fetch(
			`${GRAPH_BASE}/${GRAPH_VERSION}/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}&code=${code}`
		);
		if (!tokenRes.ok) {
			const body = await tokenRes.text();
			throw new Error(`Instagram token exchange failed (${tokenRes.status}): ${body.slice(0, 300)}`);
		}
		const tokenData = await tokenRes.json();

		const longLived = await fetch(
			`${GRAPH_BASE}/${GRAPH_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${tokenData.access_token}`
		);
		let accessToken = tokenData.access_token;
		let expiresIn: number | undefined = tokenData.expires_in;
		if (longLived.ok) {
			const llData = await longLived.json();
			if (llData.access_token) {
				accessToken = llData.access_token;
				expiresIn = llData.expires_in;
			}
		}

		const pagesRes = await fetch(
			`${GRAPH_BASE}/${GRAPH_VERSION}/me/accounts?fields=name,id,instagram_business_account{id,username}&access_token=${accessToken}`
		);
		if (!pagesRes.ok) throw new Error('Instagram profile lookup failed.');
		const pages = await pagesRes.json();
		const page = (pages.data || []).find((p: { instagram_business_account?: { id: string; username?: string } }) => p.instagram_business_account);

		if (!page || !page.instagram_business_account) {
			throw new Error(
				'No Instagram Business/Creator account is linked to your Facebook Pages. Connect an Instagram Professional account to a Facebook Page, then retry.'
			);
		}

		return {
			accessToken,
			expiresIn,
			accountId: page.instagram_business_account.id,
			accountName: page.instagram_business_account.username || page.name,
			scopes: SCOPES.split(','),
		};
	},

	async publish({ accessToken, accountId, caption, imageUrl }: PublishInput): Promise<PublishResult> {
		if (!imageUrl) throw new Error('Instagram posts require an image.');
		if (imageUrl.startsWith('data:')) {
			throw new Error(
				'Instagram requires a publicly accessible image URL. Your image is stored as a data URL; upload it to public hosting and retry.'
			);
		}
		if (!accountId) throw new Error('Instagram account is not linked. Reconnect your account.');

		const containerRes = await fetch(`${GRAPH_BASE}/${GRAPH_VERSION}/${accountId}/media`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				image_url: imageUrl,
				caption: caption.slice(0, 2200),
				access_token: accessToken,
			}),
		});
		if (!containerRes.ok) {
			const err = await containerRes.text();
			throw new Error(`Instagram media container creation failed (${containerRes.status}): ${err.slice(0, 300)}`);
		}
		const container = await containerRes.json();

		const publishRes = await fetch(`${GRAPH_BASE}/${GRAPH_VERSION}/${accountId}/media_publish`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
		});
		if (!publishRes.ok) {
			const err = await publishRes.text();
			throw new Error(`Instagram publish failed (${publishRes.status}): ${err.slice(0, 300)}`);
		}
		const publishData = await publishRes.json();

		return {
			postUrl: publishData.id ? `https://www.instagram.com/p/${publishData.id}/` : undefined,
		};
	},
};
