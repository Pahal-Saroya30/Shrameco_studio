import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getAuthSession } from '@/lib/auth/jwt';
import { getUserUploadsDir, getUserUploadsUrl } from '@/lib/files/userUploads';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov', '.webm']);
const ALLOWED_MIME_TYPES = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'video/mp4',
	'video/quicktime',
	'video/webm',
]);

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const formData = await req.formData();
		const files = formData.getAll('files') as File[];
		if (!files || files.length === 0) {
			return NextResponse.json({ error: 'No files provided.' }, { status: 400 });
		}

		const uploadUrls: string[] = [];
		const publicUploadsDir = getUserUploadsDir(session.userId);

		// Ensure directory exists
		try {
			await fs.mkdir(publicUploadsDir, { recursive: true });
		} catch (dirErr) {
			// directory may already exist
		}

		for (const file of files) {
			const buffer = Buffer.from(await file.arrayBuffer());

			// Size validation
			if (buffer.length > MAX_FILE_SIZE) {
				return NextResponse.json(
					{ error: `File "${file.name}" exceeds the 50 MB size limit.` },
					{ status: 400 }
				);
			}

			const originalName = file.name || 'file';
			const ext = (path.extname(originalName) || '').toLowerCase();

			// Extension + MIME type validation
			const mimeType = (file.type || '').toLowerCase();
			if (!ALLOWED_EXTENSIONS.has(ext)) {
				return NextResponse.json(
					{ error: `File "${originalName}" has a disallowed file type.` },
					{ status: 400 }
				);
			}
			if (!ALLOWED_MIME_TYPES.has(mimeType)) {
				return NextResponse.json(
					{ error: `File "${originalName}" has a disallowed MIME type.` },
					{ status: 400 }
				);
			}

			const uniqueName = `upload_${Date.now()}_${Math.floor(Math.random() * 1000000)}${ext}`;
			const filePath = path.join(publicUploadsDir, uniqueName);

			await fs.writeFile(filePath, buffer);
			uploadUrls.push(getUserUploadsUrl(session.userId, uniqueName));
		}

		return NextResponse.json({ urls: uploadUrls });
	} catch (error) {
		console.error('Upload API Error:', error);
		return NextResponse.json({ error: 'Failed to upload files.' }, { status: 500 });
	}
}
