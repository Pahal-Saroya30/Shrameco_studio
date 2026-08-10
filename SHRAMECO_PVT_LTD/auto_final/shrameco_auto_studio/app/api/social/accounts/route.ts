import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { getAuthSession } from '@/lib/auth/jwt';
import { SocialAccount } from '@/models/SocialAccount';
import { memoryStore } from '@/lib/db/memoryStore';

export const dynamic = 'force-dynamic';

export async function GET() {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		let accounts: Array<Record<string, unknown>> = [];
		try {
			await dbConnect();
			const dbAccounts = await SocialAccount.find({ userId: session.userId, connected: true }).lean();
			accounts = dbAccounts.map((a) => ({
				platform: a.platform,
				accountName: a.accountName,
				scopes: a.scopes,
				connected: a.connected,
			}));
		} catch (dbErr) {
			console.warn('MongoDB connection failed; loading accounts from memoryStore.');
		}

		if (accounts.length === 0) {
			accounts = memoryStore.getSocialAccounts(session.userId);
		}

		return NextResponse.json({ accounts });
	} catch (error) {
		console.error('Error fetching social accounts:', error);
		return NextResponse.json({ error: 'Failed to fetch social accounts' }, { status: 500 });
	}
}
