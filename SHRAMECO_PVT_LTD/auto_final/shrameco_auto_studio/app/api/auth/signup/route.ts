import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { signJwtToken, AUTH_COOKIE_NAME } from '@/lib/auth/jwt';
import { memoryStore } from '@/lib/db/memoryStore';

export async function POST(req: NextRequest) {
	try {
		const { email, password } = await req.json();

		if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
			return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
		}

		if (password.length < 6) {
			return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
		}

		const cleanEmail = email.toLowerCase().trim();
		let userId: string;

		try {
			await dbConnect();
			const existingUser = await User.findOne({ email: cleanEmail });
			if (existingUser) {
				return NextResponse.json({ error: 'User already exists with this email.' }, { status: 400 });
			}

			const salt = await bcrypt.genSalt(10);
			const passwordHash = await bcrypt.hash(password, salt);

			const newUser = await User.create({
				email: cleanEmail,
				passwordHash,
			});

			userId = newUser._id.toString();
		} catch (dbErr) {
			console.warn('MongoDB connection failed; falling back to in-memory store:', dbErr);
			const existingMemUser = memoryStore.findUserByEmail(cleanEmail);
			if (existingMemUser) {
				return NextResponse.json({ error: 'User already exists with this email.' }, { status: 400 });
			}

			const salt = await bcrypt.genSalt(10);
			const passwordHash = await bcrypt.hash(password, salt);
			const memUser = memoryStore.createUser(cleanEmail, passwordHash);
			userId = memUser.id;
		}

		const token = signJwtToken({
			userId,
			email: cleanEmail,
		});

		const response = NextResponse.json({
			message: 'Signup successful',
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
		console.error('Signup error:', error);
		return NextResponse.json({ error: 'Internal server error during signup.' }, { status: 500 });
	}
}
