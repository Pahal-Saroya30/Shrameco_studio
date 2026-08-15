import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { dbConnect } from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { memoryStore } from '@/lib/db/memoryStore';

export const dynamic = 'force-dynamic';

const RESET_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export async function POST(req: NextRequest) {
	try {
		const { email } = await req.json();
		if (!email || typeof email !== 'string') {
			return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
		}

		const cleanEmail = email.toLowerCase().trim();

		// Always return the same message regardless of whether the user exists
		// (prevents account enumeration).
		const successMessage = `Password reset instructions have been sent to ${cleanEmail}.`;

		// Look up the user
		let dbUser: { _id: unknown } | null = null;
		try {
			await dbConnect();
			dbUser = await User.findOne({ email: cleanEmail }).select('_id').lean();
		} catch (dbErr) {
			console.warn('MongoDB connection failed during forgot-password:', dbErr);
		}

		const memUser = memoryStore.findUserByEmail(cleanEmail);

		// Generate a short-lived reset token and store its hash.
		const rawToken = randomBytes(32).toString('base64url');
		const tokenHash = hashToken(rawToken);
		const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_SECONDS * 1000);

		if (dbUser) {
			try {
				await User.updateOne(
					{ _id: dbUser._id },
					{ $set: { resetTokenHash: tokenHash, resetTokenExpires: expiresAt } }
				);
			} catch (dbErr) {
				console.warn('Failed to store reset token in MongoDB:', dbErr);
			}
		}

		if (memUser) {
			memUser.resetTokenHash = tokenHash;
			memUser.resetTokenExpires = expiresAt;
		}

		// Dev-only: log the reset link so it can be used without an email provider.
		const resetLink = `/reset-password?token=${rawToken}&email=${encodeURIComponent(cleanEmail)}`;
		if (process.env.NODE_ENV !== 'production') {
			console.log(`[Forgot Password] Reset link for ${cleanEmail}: http://localhost:3000${resetLink}`);
		} else {
			// Production: no email provider configured yet — do not log the raw token.
			console.log(`[Forgot Password] Reset requested for ${cleanEmail}`);
		}

		return NextResponse.json({ message: successMessage });
	} catch (err) {
		console.error('Forgot-password error:', err);
		return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
	}
}
