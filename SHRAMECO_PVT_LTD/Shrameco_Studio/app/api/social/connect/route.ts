import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/jwt';
import { linkedinService } from '@/lib/social/linkedin';
import { xService, generatePkceVerifier } from '@/lib/social/x';
import { instagramService } from '@/lib/social/instagram';
import { youtubeService } from '@/lib/social/youtube';
import { facebookService } from '@/lib/social/facebook';
import { createOAuthState, getRedirectUri, assertPlatformConfigured } from '@/lib/social/oauth';
import { memoryStore } from '@/lib/db/memoryStore';
import type { SocialPlatform } from '@/lib/social/types';

export const dynamic = 'force-dynamic';

const VALID_PLATFORMS: SocialPlatform[] = ['linkedin', 'instagram', 'x', 'facebook', 'youtube'];

const SERVICE_MAP: Record<SocialPlatform, { buildAuthorizeUrl: (i: { redirectUri: string; state: string; pkceVerifier?: string }) => Promise<{ url: string; pkceVerifier?: string; pkceChallenge?: string }> }> = {
	linkedin: linkedinService,
	instagram: instagramService,
	x: xService,
	facebook: facebookService,
	youtube: youtubeService,
};

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		const platform = body?.platform as SocialPlatform;
		const returnTo = body?.returnTo || '/dashboard';
		if (!VALID_PLATFORMS.includes(platform)) {
			return NextResponse.json({ error: 'Invalid platform.' }, { status: 400 });
		}

		try {
			assertPlatformConfigured(platform);
		} catch (configErr) {
			// Demo Mode fallback URL if platform API keys are not configured in .env.local
			memoryStore.upsertSocialAccount(session.userId, platform, `${platform.toUpperCase()} Demo User`);
			return NextResponse.json({
				url: `${returnTo}?connected=${platform}&demo=true`,
				demo: true,
			});
		}

		const pkceVerifier = platform === 'x' ? generatePkceVerifier() : undefined;
		const state = createOAuthState({
			userId: session.userId,
			platform,
			pkceVerifier,
			returnTo,
		});

		const redirectUri = getRedirectUri(platform, req.url);
		const auth = await SERVICE_MAP[platform].buildAuthorizeUrl({ redirectUri, state, pkceVerifier });

		return NextResponse.json({ url: auth.url });
	} catch (error) {
		console.error('Error initiating social connect:', error);
		return NextResponse.json({ error: (error as Error).message || 'Failed to initiate connection.' }, { status: 500 });
	}
}
