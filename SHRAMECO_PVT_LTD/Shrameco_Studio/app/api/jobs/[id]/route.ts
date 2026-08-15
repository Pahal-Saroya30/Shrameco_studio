import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/jobs/registry';
import { getAuthSession } from '@/lib/auth/jwt';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const session = await getAuthSession();
	if (!session) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = await params;
	const job = getJob(id);
	if (!job || job.ownerId !== session.userId) {
		return NextResponse.json({ error: 'Job not found' }, { status: 404 });
	}
	return NextResponse.json(job);
}
