import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/jwt';
import { getUserUploadsDir, getUserUploadsUrl } from '@/lib/files/userUploads';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { prompt } = await req.json();
		if (!prompt || !prompt.trim()) {
			return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
		}

		const falApiKey = process.env.FAL_AI_API_KEY;
		if (!falApiKey) {
			return NextResponse.json({ error: 'FAL_AI_API_KEY not configured' }, { status: 500 });
		}

		console.log('[generate-video] Calling fal.ai REST API with prompt:', prompt.slice(0, 80));

		// Submit to the queue
		const submitRes = await fetch('https://queue.fal.run/fal-ai/minimax-video', {
			method: 'POST',
			headers: {
				Authorization: `Key ${falApiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				prompt,
				aspect_ratio: '9:16',
				duration: 6,
			}),
		});

		if (!submitRes.ok) {
			const err = await submitRes.text();
			throw new Error(`fal.ai submit failed (${submitRes.status}): ${err.slice(0, 200)}`);
		}

		const submitData = await submitRes.json();
		const requestId = submitData.request_id;
		console.log('[generate-video] Queued with request_id:', requestId);

		// Poll until status is COMPLETED
		const MAX_POLLS = 40;
		let resultData: any = null;

		for (let i = 0; i < MAX_POLLS; i++) {
			await new Promise((r) => setTimeout(r, 3000));

			const statusRes = await fetch(
				`https://queue.fal.run/fal-ai/minimax-video/requests/${requestId}/status`,
				{ headers: { Authorization: `Key ${falApiKey}` } }
			);

			if (!statusRes.ok) continue;
			const statusData = await statusRes.json();
			console.log('[generate-video] Poll', i + 1, '- status:', statusData.status);

			if (statusData.status === 'COMPLETED') {
				// Fetch the result
				const resultRes = await fetch(
					`https://queue.fal.run/fal-ai/minimax-video/requests/${requestId}`,
					{ headers: { Authorization: `Key ${falApiKey}` } }
				);
				if (resultRes.ok) {
					resultData = await resultRes.json();
				}
				break;
			}

			if (statusData.status === 'FAILED') {
				throw new Error('fal.ai video generation failed on their servers.');
			}
		}

		if (!resultData) {
			throw new Error('Video generation timed out. Please try again.');
		}

		const falVideoUrl = resultData?.video?.url;
		if (!falVideoUrl) {
			console.error('[generate-video] Unexpected result:', JSON.stringify(resultData).slice(0, 300));
			throw new Error('No video URL returned from fal.ai');
		}

		console.log('[generate-video] fal.ai video ready:', falVideoUrl);

		// Download and save locally so we have a stable public ngrok URL for Instagram
		const videoRes = await fetch(falVideoUrl);
		if (!videoRes.ok) throw new Error(`Failed to download fal.ai video: ${videoRes.status}`);

		const buffer = Buffer.from(await videoRes.arrayBuffer());
		const fs = require('fs');
		const path = require('path');
		const crypto = require('crypto');

		const filename = `reel-${crypto.randomUUID()}.mp4`;
		const uploadDir = getUserUploadsDir(session.userId);
		if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
		fs.writeFileSync(path.join(uploadDir, filename), buffer);

		const publicHost = process.env.INSTAGRAM_REDIRECT_URI
			? new URL(process.env.INSTAGRAM_REDIRECT_URI).origin
			: `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get('host')}`;

		const publicVideoUrl = `${publicHost}${getUserUploadsUrl(session.userId, filename)}`;
		console.log('[generate-video] Saved to:', publicVideoUrl);

		return NextResponse.json({ videoUrl: publicVideoUrl, provider: 'fal-ai' });
	} catch (error: any) {
		console.error('Video generation error:', error);
		return NextResponse.json({ error: error?.message || 'Failed to generate video' }, { status: 500 });
	}
}
