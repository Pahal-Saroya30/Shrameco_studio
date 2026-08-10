import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { getAuthSession } from '@/lib/auth/jwt';
import { SocialAccount } from '@/models/SocialAccount';
import { memoryStore } from '@/lib/db/memoryStore';
import type { SocialPlatform } from '@/lib/social/types';

export const dynamic = 'force-dynamic';

const VALID_PLATFORMS: SocialPlatform[] = ['linkedin', 'instagram', 'x', 'facebook', 'youtube'];

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		const platform = body?.platform as SocialPlatform;
		if (!VALID_PLATFORMS.includes(platform)) {
			return NextResponse.json({ error: 'Invalid platform.' }, { status: 400 });
		}

		try {
			await dbConnect();
			await SocialAccount.updateOne({ userId: session.userId, platform }, { $set: { connected: false } });
		} catch (dbErr) {
			console.warn('MongoDB connection failed; deleting from memoryStore.');
		}
		memoryStore.deleteSocialAccount(session.userId, platform);

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error('Error disconnecting social account:', error);
		return NextResponse.json({ error: 'Failed to disconnect account.' }, { status: 500 });
	}
}
