import type { PublishInput, PublishResult, SocialPlatform } from './types';
import { linkedinService } from './linkedin';
import { xService } from './x';
import { instagramService } from './instagram';
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
	facebook: false,
	youtube: true,
};

const SERVICE_MAP: Record<SocialPlatform, { publish(input: PublishInput): Promise<PublishResult> }> = {
	linkedin: linkedinService,
	instagram: instagramService,
	x: xService,
	facebook: facebookService,
	youtube: { publish: async () => { throw new Error('Not implemented'); } },
};

export async function publishToPlatform(
	platform: SocialPlatform,
	input: {
		accessToken: string;
		accountId?: string;
		caption: string;
		imageUrl?: string;
		videoUrl?: string;
		videoDataUrl?: string;
		coverDataUrl?: string;
		videoBlob?: Blob;
		linkUrl?: string;
		carouselImages?: string[];
		contentFormat?: 'text' | 'photo' | 'reel' | 'carousel' | 'link' | 'video' | 'post' | 'story';
		scopes?: string[];
	}
): Promise<PublishResult> {
	const caption = input.caption?.trim();
	if (!caption) throw new Error('Caption is required.');

	const isReel = input.contentFormat === 'reel';
	const maxLen = isReel && platform === 'facebook' ? 2200 : MAX_CAPTION[platform];

	if (caption.length > maxLen) {
		throw new Error(`Caption exceeds the ${maxLen}-character limit for ${platform}${isReel ? ' Reel' : ''}.`);
	}
	if (IMAGE_REQUIRED[platform] && !isReel && !input.imageUrl) {
		throw new Error('This platform requires an image to publish.');
	}

	let imageUrl: string | undefined = input.imageUrl;
	if (imageUrl && imageUrl.startsWith('http') && IMAGE_AS_DATA_URL[platform]) {
		imageUrl = await fetchToDataUrl(imageUrl);
	}

	if (platform === 'facebook' && isReel && facebookService.publishReel) {
		return facebookService.publishReel({
			accessToken: input.accessToken,
			accountId: input.accountId,
			caption,
			videoUrl: input.videoUrl,
			videoDataUrl: input.videoDataUrl,
			coverDataUrl: input.coverDataUrl,
			videoBlob: input.videoBlob,
			contentFormat: 'reel',
			scopes: input.scopes,
		});
	}

	// Scaffolding for upcoming Facebook formats (Carousel, Link, Standard Video)
	if (platform === 'facebook' && ['carousel', 'link', 'video'].includes(input.contentFormat || '')) {
		if (input.contentFormat === 'link' && input.linkUrl) {
			// Link post fallback to Facebook feed post with message + link URL
			return SERVICE_MAP.facebook.publish({
				accessToken: input.accessToken,
				accountId: input.accountId,
				caption: `${caption}\n\n${input.linkUrl}`,
				contentFormat: input.contentFormat,
				scopes: input.scopes,
			});
		}
	}

	return SERVICE_MAP[platform].publish({
		accessToken: input.accessToken,
		accountId: input.accountId,
		caption,
		imageUrl,
		videoUrl: input.videoUrl,
		videoDataUrl: input.videoDataUrl,
		coverDataUrl: input.coverDataUrl,
		videoBlob: input.videoBlob,
		linkUrl: input.linkUrl,
		carouselImages: input.carouselImages,
		contentFormat: input.contentFormat,
		scopes: input.scopes,
	});
}

async function fetchToDataUrl(url: string): Promise<string> {
	const res = await fetch(url);
	if (!res.ok) throw new Error('Failed to fetch the image for publishing.');
	const contentType = res.headers.get('content-type') || 'image/png';
	const buffer = Buffer.from(await res.arrayBuffer());
	return `data:${contentType};base64,${buffer.toString('base64')}`;
}
