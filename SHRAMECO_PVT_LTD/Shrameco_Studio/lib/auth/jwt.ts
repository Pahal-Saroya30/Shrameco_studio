import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const FALLBACK_SECRET = 'fallback_jwt_secret_development_only_32char';
export const AUTH_COOKIE_NAME = 'auth_token';

export function getJwtSecret(): string {
	const secret = process.env.JWT_SECRET;
	if (!secret || secret === FALLBACK_SECRET || secret.length < 32) {
		if (process.env.NODE_ENV === 'production') {
			throw new Error('JWT_SECRET must be set to a strong, unique value (>= 32 chars) in production.');
		}
		return FALLBACK_SECRET;
	}
	return secret;
}

export interface TokenPayload {
	userId: string;
	email: string;
}

export function signJwtToken(payload: TokenPayload): string {
	return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): TokenPayload | null {
	try {
		return jwt.verify(token, getJwtSecret()) as TokenPayload;
	} catch {
		return null;
	}
}

export async function getAuthSession(): Promise<TokenPayload | null> {
	const cookieStore = cookies();
	const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
	if (!token) return null;
	return verifyJwtToken(token);
}
