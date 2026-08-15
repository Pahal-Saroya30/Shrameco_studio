import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { SocialAccount } from '@/models/SocialAccount';
import { linkedinService } from '@/lib/social/linkedin';
import { xService } from '@/lib/social/x';
import { instagramService } from '@/lib/social/instagram';
import { youtubeService } from '@/lib/social/youtube';
import { facebookService } from '@/lib/social/facebook';
import { verifyOAuthState, getRedirectUri } from '@/lib/social/oauth';
import { memoryStore } from '@/lib/db/memoryStore';
import type { SocialPlatform } from '@/lib/social/types';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function logToFile(msg: string) {
	try {
		const logPath = path.join(process.cwd(), 'server_debug.log');
		fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
	} catch (e) {
		console.error('logToFile failed:', e);
	}
}

const SERVICE_MAP: Record<SocialPlatform, { exchangeCode: (i: { code: string; redirectUri: string; pkceVerifier?: string }) => Promise<any> }> = {
	linkedin: linkedinService,
	instagram: instagramService,
	x: xService,
	facebook: facebookService,
	youtube: youtubeService,
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
			avatarUrl: exchanged.avatarUrl || '',
		};

		// Always persist to memoryStore fallback so it remains connected in local dev without MongoDB
		memoryStore.upsertSocialAccount(
			pending.userId, 
			pending.platform, 
			exchanged.accountName,
			exchanged.accountId,
			exchanged.accessToken,
			exchanged.refreshToken,
			exchanged.expiresIn ? new Date(Date.now() + exchanged.expiresIn * 1000) : undefined,
			exchanged.avatarUrl || ''
		);

		logToFile(`[Callback API] Upserted memoryStore social account for ${pending.platform}. userId: ${pending.userId}, accountName: ${exchanged.accountName}, hasAccessToken: ${!!exchanged.accessToken}`);

		try {
			await dbConnect();
			await SocialAccount.findOneAndUpdate(
				{ userId: pending.userId, platform: pending.platform },
				{ $set: upsertData, $setOnInsert: { userId: pending.userId } },
				{ upsert: true, new: true }
			);
			logToFile(`[Callback API] MongoDB document updated/inserted.`);
		} catch (dbErr) {
			logToFile(`[Callback API] MongoDB save bypassed (using memoryStore).`);
			console.warn('MongoDB connection failed; relying on memoryStore fallback.');
		}

		const returnTo = pending.returnTo || '/dashboard';
		const redirectUrl = new URL(`${returnTo}?connected=${pending.platform}`, req.url);
		if (redirectUrl.hostname === 'localhost' || redirectUrl.hostname === '127.0.0.1') {
			redirectUrl.protocol = 'http:';
		}
		return NextResponse.redirect(redirectUrl);
	} catch (err) {
		logToFile(`[Callback API] OAuth callback failed: ${(err as Error).message}`);
		console.error('OAuth callback failed:', err);
		return redirectWithError(req, (err as Error).message || 'Failed to connect account.');
	}
}

function redirectWithError(req: NextRequest, message: string, returnTo: string = '/dashboard') {
	const redirectUrl = new URL(`${returnTo}?social_error=` + encodeURIComponent(message), req.url);
	if (redirectUrl.hostname === 'localhost' || redirectUrl.hostname === '127.0.0.1') {
		redirectUrl.protocol = 'http:';
	}
	return NextResponse.redirect(redirectUrl);
}
