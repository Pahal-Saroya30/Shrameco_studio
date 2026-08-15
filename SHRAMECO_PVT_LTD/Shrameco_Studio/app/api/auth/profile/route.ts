import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/jwt';
import { dbConnect } from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { memoryStore } from '@/lib/db/memoryStore';

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { name, email } = await req.json();
		if (!email || typeof email !== 'string') {
			return NextResponse.json({ error: 'Email is required' }, { status: 400 });
		}

		const cleanEmail = email.toLowerCase().trim();

		try {
			await dbConnect();
			
			// Check if email is already taken by another user
			const existingUser = await User.findOne({ email: cleanEmail, _id: { $ne: session.userId } });
			if (existingUser) {
				return NextResponse.json({ error: 'Email is already taken by another account.' }, { status: 400 });
			}

			await User.updateOne(
				{ _id: session.userId },
				{ $set: { name: name || '', email: cleanEmail } }
			);
		} catch (dbErr) {
			console.warn('MongoDB update failed; using memory fallback:', dbErr);
			
			const existingMemUser = memoryStore.users.find(u => u.email.toLowerCase() === cleanEmail && u.id !== session.userId);
			if (existingMemUser) {
				return NextResponse.json({ error: 'Email is already taken by another account.' }, { status: 400 });
			}

			const memUser = memoryStore.users.find(u => u.id === session.userId);
			if (memUser) {
				memUser.name = name || '';
				memUser.email = cleanEmail;
			}
		}

		return NextResponse.json({ ok: true, name, email });
	} catch (error) {
		console.error('Update profile error:', error);
		return NextResponse.json({ error: 'Failed to update profile details.' }, { status: 500 });
	}
}
