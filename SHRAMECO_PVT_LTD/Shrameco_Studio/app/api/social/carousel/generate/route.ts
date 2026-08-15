import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { BrandProfile } from '@/models/BrandProfile';
import { getAuthSession } from '@/lib/auth/jwt';
import { memoryStore } from '@/lib/db/memoryStore';
import { CAROUSEL_LENGTHS, type CarouselLength } from '@/lib/social/carousel';
import { createJob } from '@/lib/jobs/registry';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { topic, length } = await req.json();

		if (!topic || typeof topic !== 'string' || !topic.trim()) {
			return NextResponse.json({ error: 'Topic is required.' }, { status: 400 });
		}
		const carouselLength: CarouselLength = length && length in CAROUSEL_LENGTHS ? (length as CarouselLength) : 'medium';

		let brand: any = null;
		try {
			await dbConnect();
			brand = await BrandProfile.findOne({ userId: session.userId });
		} catch (dbErr) {
			console.warn('MongoDB connection failed; loading brand profile from memory store.');
		}
		if (!brand) {
			brand = memoryStore.getBrandProfile(session.userId);
		}

		const brandContext = {
			companyName: brand?.companyName || 'Our Brand',
			industry: brand?.industry || 'Tech',
			brandVoice: brand?.brandVoice || 'Professional, visionary, authoritative yet approachable.',
			contentPillars: brand?.contentPillars?.join(', ') || 'Innovation, Excellence',
			bannedTopics: brand?.bannedTopics?.join(', ') || 'None',
			bannedWords: brand?.bannedWords?.join(', ') || 'None',
			colorPalette: Array.isArray(brand?.colorPalette) ? brand.colorPalette : [],
		};

		// Enqueue a carousel-generation job
		const job = createJob(session.userId, 'carousel-generation', {
			userId: session.userId,
			topic: topic.trim(),
			length: carouselLength,
			brandContext,
		});

		// Run the job processor in the background (in-process worker; runs in all environments)
		const { runJobProcessor } = await import('@/lib/jobs/processors');
		// Run async without blocking the response
		runJobProcessor(job.id).catch((err) => console.error('Job processor error:', err));

		return NextResponse.json({ ok: true, jobId: job.id });
	} catch (error) {
		console.error('Error enqueueing carousel generation:', error);
		return NextResponse.json({ error: 'Failed to start carousel generation.' }, { status: 500 });
	}
}
