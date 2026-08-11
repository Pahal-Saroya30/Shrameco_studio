import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret_development_only_32char';
export const AUTH_COOKIE_NAME = 'auth_token';

export interface TokenPayload {
	userId: string;
	email: string;
}

export function signJwtToken(payload: TokenPayload): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): TokenPayload | null {
	try {
		return jwt.verify(token, JWT_SECRET) as TokenPayload;
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
