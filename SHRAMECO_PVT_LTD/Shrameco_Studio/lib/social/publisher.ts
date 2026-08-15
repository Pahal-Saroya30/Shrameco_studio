import type { PublishInput, PublishResult, SocialPlatform } from './types';
import { linkedinService } from './linkedin';
import { xService } from './x';
import { instagramService } from './instagram';
import { youtubeService } from './youtube';
import { facebookService } from './facebook';

const MAX_CAPTION: Record<SocialPlatform, number> = {
	linkedin: 3000,
	instagram: 2200,
	x: 280,
	facebook: 63206,
	youtube: 5000,
};

const IMAGE_REQUIRED: Record<SocialPlatform, boolean> = {
	linkedin: false,
	instagram: true,
	x: false,
	facebook: false,
	youtube: false,
};

const IMAGE_AS_DATA_URL: Record<SocialPlatform, boolean> = {
	linkedin: true,
	instagram: false,
	x: true,
	facebook: true,
	youtube: true,
};

const SERVICE_MAP: Record<SocialPlatform, { publish(input: PublishInput): Promise<PublishResult> }> = {
	linkedin: linkedinService,
	instagram: instagramService,
	x: xService,
	facebook: facebookService,
	youtube: youtubeService,
};

export async function publishToPlatform(
	platform: SocialPlatform,
	input: { 
		accessToken: string; 
		accountId?: string; 
		caption: string; 
		imageUrl?: string; 
		videoUrl?: string; 
		mediaType?: string; 
		contentFormat?: string;
		carouselImages?: string[];
		linkUrl?: string;
		scopes?: string[]; 
		visibility?: string; 
		categoryId?: string; 
		madeForKids?: boolean; 

		// LinkedIn-specific extensions
		slides?: { imageUrl?: string }[];
		size?: '4/5' | '1/1';
		link?: string;
		linkedInContentType?: string;
		documentDataUrl?: string;
		documentName?: string;
		articleTitle?: string;
		articleDescription?: string;
		articleThumbnail?: string;
		videoDataUrl?: string;
		videoName?: string;
		videoType?: string;
		videoTitle?: string;
	}
): Promise<PublishResult> {
	const caption = input.caption?.trim();
	if (!caption) throw new Error('Caption is required.');

	const maxLen = MAX_CAPTION[platform];
	if (caption.length > maxLen) {
		throw new Error(`Caption exceeds the ${maxLen}-character limit for ${platform}.`);
	}
	if (IMAGE_REQUIRED[platform] && !input.imageUrl && !input.videoUrl && !(input.slides && input.slides.length > 0)) {
		throw new Error('This platform requires an image or video to publish.');
	}

	let imageUrl: string | undefined = input.imageUrl;
	let videoUrl: string | undefined = input.videoUrl;

	// In some cases, client passes video url in imageUrl parameter
	if (input.mediaType === 'REEL' && imageUrl && !videoUrl) {
		videoUrl = imageUrl;
		imageUrl = undefined;
	}

	if (imageUrl && imageUrl.startsWith('/uploads/')) {
		if (platform === 'instagram' || (platform === 'x' && process.env.BUFFER_API_KEY)) {
			const publicHost = process.env.INSTAGRAM_REDIRECT_URI
				? new URL(process.env.INSTAGRAM_REDIRECT_URI).origin
				: process.env.LINKEDIN_REDIRECT_URI
				? new URL(process.env.LINKEDIN_REDIRECT_URI).origin
				: '';
			imageUrl = `${publicHost}${imageUrl}`;
		} else {
			try {
				const fs = require('fs');
				const path = require('path');
				const filePath = path.join(process.cwd(), 'public', imageUrl);
				if (fs.existsSync(filePath)) {
					const buffer = fs.readFileSync(filePath);
					const ext = path.extname(filePath).toLowerCase();
					let mime = 'image/png';
					if (ext === '.mp4') mime = 'video/mp4';
					else if (ext === '.mov') mime = 'video/quicktime';
					else if (ext === '.webm') mime = 'video/webm';
					else if (ext === '.mkv') mime = 'video/x-matroska';
					else if (ext === '.avi') mime = 'video/x-msvideo';
					else if (ext === '.jpeg' || ext === '.jpg') mime = 'image/jpeg';
					else if (ext === '.webp') mime = 'image/webp';
					
					imageUrl = `data:${mime};base64,${buffer.toString('base64')}`;
				}
			} catch (e) {
				console.error('Failed to read local uploaded file for publishing:', e);
			}
		}
	} else if (imageUrl && imageUrl.startsWith('http') && IMAGE_AS_DATA_URL[platform]) {
		imageUrl = await fetchToDataUrl(imageUrl);
	}

	if (videoUrl && videoUrl.startsWith('/uploads/')) {
		if (platform === 'instagram' || (platform === 'x' && process.env.BUFFER_API_KEY)) {
			const publicHost = process.env.INSTAGRAM_REDIRECT_URI
				? new URL(process.env.INSTAGRAM_REDIRECT_URI).origin
				: process.env.LINKEDIN_REDIRECT_URI
				? new URL(process.env.LINKEDIN_REDIRECT_URI).origin
				: '';
			videoUrl = `${publicHost}${videoUrl}`;
		}
	}

	return SERVICE_MAP[platform].publish({
		accessToken: input.accessToken,
		accountId: input.accountId,
		caption,
		imageUrl,
		videoUrl,
		mediaType: input.mediaType,
		scopes: input.scopes,
		visibility: input.visibility,
		categoryId: input.categoryId,
		madeForKids: input.madeForKids,

		// Forward LinkedIn-specific arguments
		slides: input.slides,
		size: input.size,
		link: input.link,
		linkedInContentType: input.linkedInContentType as any,
		documentDataUrl: input.documentDataUrl,
		documentName: input.documentName,
		articleTitle: input.articleTitle,
		articleDescription: input.articleDescription,
		articleThumbnail: input.articleThumbnail,
		videoDataUrl: input.videoDataUrl,
		videoName: input.videoName,
		videoType: input.videoType,
		videoTitle: input.videoTitle,

		// Forward Format Parameters
		contentFormat: input.contentFormat,
		carouselImages: input.carouselImages,
		linkUrl: input.linkUrl,
	});
}

async function fetchToDataUrl(url: string): Promise<string> {
	const res = await fetch(url);
	if (!res.ok) throw new Error('Failed to fetch the image for publishing.');
	const contentType = res.headers.get('content-type') || 'image/png';
	const buffer = Buffer.from(await res.arrayBuffer());
	return `data:${contentType};base64,${buffer.toString('base64')}`;
}
