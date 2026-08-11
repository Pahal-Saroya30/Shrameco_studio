import jwt from 'jsonwebtoken';
import type { SocialPlatform } from './types';
import { getLinkedInConfig } from './linkedin';
import { getXConfig } from './x';
import { getInstagramConfig } from './instagram';
import { getFacebookConfig } from './facebook';

const OAUTH_STATE_TTL_SECONDS = 10 * 60; // 10 minutes

export interface OAuthStatePayload {
	userId: string;
	platform: SocialPlatform;
	pkceVerifier?: string;
	returnTo?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'shrameco_auto_studio_jwt_secret_key_2026_dev';

export function createOAuthState(payload: OAuthStatePayload): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: OAUTH_STATE_TTL_SECONDS });
}

export function verifyOAuthState(state: string): OAuthStatePayload | null {
	try {
		const payload = jwt.verify(state, JWT_SECRET) as OAuthStatePayload;
		if (!payload.userId || !payload.platform) return null;
		return payload;
	} catch {
		return null;
	}
}

export function getRedirectUri(platform: SocialPlatform, requestUrl: string): string {
	switch (platform) {
		case 'linkedin':
			if (process.env.LINKEDIN_REDIRECT_URI) return process.env.LINKEDIN_REDIRECT_URI;
			break;
		case 'x':
			if (process.env.X_REDIRECT_URI) return process.env.X_REDIRECT_URI;
			break;
		case 'instagram':
			if (process.env.INSTAGRAM_REDIRECT_URI) return process.env.INSTAGRAM_REDIRECT_URI;
			break;
		case 'youtube':
			if (process.env.YOUTUBE_REDIRECT_URI) return process.env.YOUTUBE_REDIRECT_URI;
			break;
		case 'facebook':
			if (process.env.FACEBOOK_REDIRECT_URI) return process.env.FACEBOOK_REDIRECT_URI;
			break;
	}
	return new URL(`/api/social/callback/${platform}`, requestUrl).toString();
}

export function assertPlatformConfigured(platform: SocialPlatform) {
	const configs: Record<string, boolean> = {
		linkedin: Boolean(getLinkedInConfig().clientId && getLinkedInConfig().clientSecret),
		x: Boolean(getXConfig().clientId && getXConfig().clientSecret),
		instagram: Boolean(getInstagramConfig().clientId && getInstagramConfig().clientSecret),
		facebook: Boolean(getFacebookConfig().clientId && getFacebookConfig().clientSecret),
		youtube: false,
	};
	if (!configs[platform as string]) {
		throw new Error(`${platform} app credentials are not configured on the server.`);
	}
}
