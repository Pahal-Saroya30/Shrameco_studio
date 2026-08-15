import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/jwt';
import { getUserUploadsDir, getUserUploadsUrl } from '@/lib/files/userUploads';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { prompt, width, height } = await req.json();
		if (!prompt || !prompt.trim()) {
			return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
		}

		const seed = Math.floor(Math.random() * 1000000);
		const w = width || 1080;
		const h = height || 1350;
		const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&seed=${seed}`;

		// Fetch the image from pollinations to host it locally (bypasses CORS on the client-side canvas)
		const response = await fetch(pollinationsUrl);
		if (!response.ok) {
			throw new Error(`Failed to fetch image from Pollinations: ${response.status}`);
		}

		const buffer = Buffer.from(await response.arrayBuffer());
		const fs = require('fs');
		const path = require('path');
		const crypto = require('crypto');

		const filename = `${crypto.randomUUID()}.png`;
		const uploadDir = getUserUploadsDir(session.userId);
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}
		fs.writeFileSync(path.join(uploadDir, filename), buffer);

		const publicHost = process.env.INSTAGRAM_REDIRECT_URI
			? new URL(process.env.INSTAGRAM_REDIRECT_URI).origin
			: `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get('host')}`;

		const imageUrl = `${publicHost}${getUserUploadsUrl(session.userId, filename)}`;

		return NextResponse.json({
			imageUrl,
			provider: 'pollinations',
		});
	} catch (error: any) {
		console.error('Image generation error:', error);
		return NextResponse.json({ error: error?.message || 'Failed to generate image' }, { status: 500 });
	}
}
