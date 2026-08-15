import path from 'path';

export function sanitizeUserFolder(userId: string): string {
	return userId.replace(/[^a-zA-Z0-9_-]/g, '') || 'user';
}

export function getUserUploadsDir(userId: string): string {
	return path.join(process.cwd(), 'public', 'uploads', sanitizeUserFolder(userId));
}

export function getUserUploadsUrl(userId: string, filename: string): string {
	return `/uploads/${sanitizeUserFolder(userId)}/${filename}`;
}
