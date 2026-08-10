import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { signJwtToken, AUTH_COOKIE_NAME } from '@/lib/auth/jwt';
import { memoryStore } from '@/lib/db/memoryStore';

export async function POST(req: NextRequest) {
	try {
		const { email, password } = await req.json();

		if (!email || !password) {
			return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
		}

		const cleanEmail = email.toLowerCase().trim();
		const userId = 'bypass_user_123'; // Mock user ID

		const token = signJwtToken({
			userId,
			email: cleanEmail,
		});

		const response = NextResponse.json({
			message: 'Login successful',
			user: { id: userId, email: cleanEmail },
		});

		response.cookies.set(AUTH_COOKIE_NAME, token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
			maxAge: 7 * 24 * 60 * 60,
		});

		return response;
	} catch (error) {
		console.error('Login error:', error);
		return NextResponse.json({ error: 'Internal server error during login.' }, { status: 500 });
	}
}
