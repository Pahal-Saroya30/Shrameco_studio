import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/jwt';
import { dbConnect } from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { memoryStore } from '@/lib/db/memoryStore';

export const dynamic = 'force-dynamic';

export async function GET() {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		
		let displayName = '';
		let companyName = '';
		
		try {
			await dbConnect();
			const u = await User.findById(session.userId).lean();
			if (u) {
				displayName = u.name || '';
				companyName = u.companyName || '';
			}
		} catch (dbErr) {
			const memUser = memoryStore.users.find(x => x.id === session.userId);
			if (memUser) {
				displayName = memUser.name || '';
				companyName = memUser.companyName || '';
			}
		}

		if (!displayName) {
			const namePart = session.email.split('@')[0];
			displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
		}

		return NextResponse.json({ email: session.email, name: displayName, companyName });
	} catch (error) {
		return NextResponse.json({ error: 'Failed to fetch user session' }, { status: 500 });
	}
}
