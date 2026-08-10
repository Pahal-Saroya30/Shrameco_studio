import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { SocialAccount } from '@/models/SocialAccount';
import { linkedinService } from '@/lib/social/linkedin';
import { xService } from '@/lib/social/x';
import { instagramService } from '@/lib/social/instagram';
import { facebookService } from '@/lib/social/facebook';
import { verifyOAuthState, getRedirectUri } from '@/lib/social/oauth';
import type { SocialPlatform } from '@/lib/social/types';

export const dynamic = 'force-dynamic';

const SERVICE_MAP: Record<SocialPlatform, { exchangeCode: (i: { code: string; redirectUri: string; pkceVerifier?: string }) => Promise<any> }> = {
	linkedin: linkedinService,
	instagram: instagramService,
	x: xService,
	facebook: facebookService,
	youtube: { exchangeCode: async () => { throw new Error('Not implemented'); } },
};

export async function GET(req: NextRequest) {
	try {
		const params = req.nextUrl.searchParams;
		const code = params.get('code');
		const stateParam = params.get('state');
		const error = params.get('error');

		if (error || !code || !stateParam) {
			console.warn('OAuth callback error:', error || 'missing code/state');
			return redirectWithError(req, error ? `Authorization failed: ${error}` : 'Invalid OAuth callback.');
		}

		const pending = verifyOAuthState(stateParam);
		if (!pending) {
			return redirectWithError(req, 'OAuth session expired or invalid. Please try connecting again.');
		}

		const redirectUri = getRedirectUri(pending.platform, req.url);
		const exchanged = await SERVICE_MAP[pending.platform].exchangeCode({
			code,
			redirectUri,
			pkceVerifier: pending.pkceVerifier,
		});

		const upsertData = {
			accountId: exchanged.accountId,
			accountName: exchanged.accountName,
			accessToken: exchanged.accessToken,
			refreshToken: exchanged.refreshToken,
			expiresAt: exchanged.expiresIn ? new Date(Date.now() + exchanged.expiresIn * 1000) : undefined,
			scopes: exchanged.scopes,
			connected: true,
		};

		try {
			await dbConnect();
			await SocialAccount.findOneAndUpdate(
				{ userId: pending.userId, platform: pending.platform },
				{ $set: upsertData, $setOnInsert: { userId: pending.userId } },
				{ upsert: true, new: true }
			);
		} catch (dbErr) {
			console.warn('MongoDB connection failed; skipping account save.');
		}

		const returnTo = pending.returnTo || '/dashboard';
		return NextResponse.redirect(new URL(`${returnTo}?connected=${pending.platform}`, req.url));
	} catch (err) {
		console.error('OAuth callback failed:', err);
		return redirectWithError(req, (err as Error).message || 'Failed to connect account.');
	}
}

function redirectWithError(req: NextRequest, message: string, returnTo: string = '/dashboard') {
	return NextResponse.redirect(new URL(`${returnTo}?social_error=` + encodeURIComponent(message), req.url));
}
