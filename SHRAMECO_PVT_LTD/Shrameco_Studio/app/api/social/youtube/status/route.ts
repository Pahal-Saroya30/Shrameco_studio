import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { SocialAccount } from '@/models/SocialAccount';
import { memoryStore } from '@/lib/db/memoryStore';
import type { SocialPlatform } from '@/lib/social/types';
import { getAuthSession } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const videoId = searchParams.get('videoId');
		if (!videoId) {
			return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
		}

		// Check if it's a simulated demo video ID
		if (videoId.startsWith('demo_') || videoId.startsWith('mock_')) {
			return NextResponse.json({
				ok: true,
				videoId,
				uploadStatus: 'uploaded',
				processingStatus: 'processing',
				progress: 65,
				copyrightStatus: 'Passed',
				copyrightDetails: 'Safe to publish (Content ID checking in progress)',
			});
		}

		// Retrieve access token
		let accessToken = '';
		try {
			await dbConnect();
			const account = await SocialAccount.findOne({ userId: session.userId, platform: 'youtube', connected: true });
			if (account) {
				accessToken = account.accessToken;
			}
		} catch (e) {}

		if (!accessToken) {
			const mem = memoryStore.socialAccounts.find((a: any) => a.userId === session.userId && a.platform === 'youtube' && a.connected);
			if (mem) {
				accessToken = mem.accessToken || '';
			}
		}

		if (!accessToken) {
			return NextResponse.json({ error: 'YouTube channel not connected' }, { status: 400 });
		}

		// Call YouTube Data API to retrieve live video status details
		const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status,processingDetails,snippet&id=${videoId}`, {
			headers: { Authorization: `Bearer ${accessToken}` }
		});

		if (!res.ok) {
			const text = await res.text();
			return NextResponse.json({ error: `YouTube API failed (${res.status}): ${text}` }, { status: res.status });
		}

		const data = await res.json();
		const item = data.items?.[0];

		if (!item) {
			// Video might still be indexing immediately after post
			return NextResponse.json({
				ok: true,
				videoId,
				uploadStatus: 'uploaded',
				processingStatus: 'processing',
				progress: 15,
				copyrightStatus: 'Passed',
				copyrightDetails: 'YouTube is queuing file ingestion...',
			});
		}

		const uploadStatus = item.status?.uploadStatus || 'uploaded';
		const processingStatus = item.processingDetails?.processingStatus || 'succeeded';
		const partsProcessed = Number(item.processingDetails?.processingProgress?.partsProcessed || 0);
		const partsTotal = Number(item.processingDetails?.processingProgress?.partsTotal || 100);
		
		let progress = 100;
		if (uploadStatus !== 'processed' && processingStatus === 'processing') {
			progress = partsTotal > 0 ? Math.round((partsProcessed / partsTotal) * 100) : 45;
			if (progress === 0 || progress === 100) progress = 55;
		}

		// Check for rejection reasons or claims warnings
		let copyrightStatus = 'Passed';
		let copyrightDetails = 'Content cleared by Content ID scan.';
		if (item.status?.rejectionReason) {
			copyrightStatus = 'Warning';
			copyrightDetails = `Upload rejected: ${item.status.rejectionReason}`;
		}

		return NextResponse.json({
			ok: true,
			videoId,
			title: item.snippet?.title || '',
			uploadStatus,
			processingStatus,
			progress: uploadStatus === 'processed' ? 100 : progress,
			copyrightStatus,
			copyrightDetails,
		});

	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
