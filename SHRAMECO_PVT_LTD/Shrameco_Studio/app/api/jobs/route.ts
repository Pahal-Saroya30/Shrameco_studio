import { NextRequest, NextResponse } from 'next/server';
import { createJob, JobType } from '@/lib/jobs/registry';
import { getAuthSession } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		const { type, payload } = body as { type: JobType; payload: unknown };

		if (!type) {
			return NextResponse.json({ error: 'Job type is required' }, { status: 400 });
		}

		const job = createJob(session.userId, type, payload);
		return NextResponse.json({ jobId: job.id, status: job.status }, { status: 201 });
	} catch (e) {
		return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
	}
}
