import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { getAuthSession } from '@/lib/auth/jwt';
import { SocialAccount } from '@/models/SocialAccount';
import { publishToPlatform } from '@/lib/social/publisher';
import { memoryStore } from '@/lib/db/memoryStore';
import type { SocialPlatform } from '@/lib/social/types';

export const dynamic = 'force-dynamic';

const VALID_PLATFORMS: SocialPlatform[] = ['linkedin', 'instagram', 'x', 'facebook', 'youtube'];

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		console.log('[DEBUG] Publish API payload:', {
			platform: body?.platform,
			contentFormat: body?.contentFormat,
			imageUrl: body?.imageUrl ? `${body.imageUrl.slice(0, 50)}...` : null,
			carouselImagesLength: body?.carouselImages?.length,
			carouselImagesType: typeof body?.carouselImages,
			hasCarouselImages: Array.isArray(body?.carouselImages),
		});
		const platform = body?.platform as SocialPlatform;
		const caption = typeof body?.caption === 'string' ? body.caption : '';
		const imageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl : '';
		const videoUrl = typeof body?.videoUrl === 'string' ? body.videoUrl : '';
		const videoDataUrl = typeof body?.videoDataUrl === 'string' ? body.videoDataUrl : '';
		const coverDataUrl = typeof body?.coverDataUrl === 'string' ? body.coverDataUrl : '';
		const linkUrl = typeof body?.linkUrl === 'string' ? body.linkUrl : (typeof body?.destinationUrl === 'string' ? body.destinationUrl : '');
		const carouselImages = Array.isArray(body?.carouselImages) ? body.carouselImages : [];
		const contentFormat = body?.contentFormat as 'post' | 'reel' | 'story' | 'link' | 'carousel' | undefined;

		if (!VALID_PLATFORMS.includes(platform)) {
			return NextResponse.json({ error: 'Invalid platform.' }, { status: 400 });
		}
		if (!caption.trim()) {
			return NextResponse.json({ error: 'Caption is required.' }, { status: 400 });
		}

		let record: { platform: SocialPlatform; accessToken: string; accountId?: string; scopes?: string[] } | null = null;
		try {
			await dbConnect();
			const dbAccount = await SocialAccount.findOne({ userId: session.userId, platform, connected: true }).lean();
			if (dbAccount) {
				record = {
					platform: dbAccount.platform,
					accessToken: dbAccount.accessToken,
					accountId: dbAccount.accountId,
					scopes: dbAccount.scopes,
				};
			}
		} catch (dbErr) {
			console.warn('MongoDB connection failed; checking memoryStore.');
		}

		if (!record) {
			const memAccounts = memoryStore.getSocialAccounts(session.userId);
			const memAcc = memAccounts.find((a: any) => a.platform === platform && a.connected);
			if (memAcc && memAcc.accessToken) {
				record = {
					platform: memAcc.platform as SocialPlatform,
					accessToken: memAcc.accessToken,
					accountId: memAcc.accountId,
					scopes: memAcc.scopes,
				};
			}
		}

		if (record) {
			try {
				const result = await publishToPlatform(platform, {
					accessToken: record.accessToken,
					accountId: record.accountId,
					caption,
					imageUrl,
					videoUrl,
					videoDataUrl,
					coverDataUrl,
					linkUrl,
					carouselImages,
					contentFormat,
					scopes: record.scopes,
				});
				return NextResponse.json({ ok: true, postUrl: result.postUrl || null, mode: 'live' });
			} catch (pubErr: any) {
				console.error('[Facebook Graph API Error]:', pubErr?.message);
				let cleanErrMsg = pubErr?.message || 'Meta Graph API publish failed.';
				try {
					const jsonMatch = cleanErrMsg.match(/\{[\s\S]*\}/);
					if (jsonMatch) {
						const parsedMeta = JSON.parse(jsonMatch[0]);
						const metaObj = parsedMeta.error || parsedMeta;
						cleanErrMsg = metaObj.error_user_msg || metaObj.error_user_title || metaObj.message || cleanErrMsg;
					}
				} catch (e) {}
				return NextResponse.json(
					{ error: cleanErrMsg },
					{ status: 400 }
				);
			}
		}

		// Fallback Demo Publish Response pointing to simulated live feed preview
		const isDataUrl = imageUrl.startsWith('data:');
		const queryImageUrl = isDataUrl ? '' : encodeURIComponent(imageUrl);
		const formatParam = contentFormat ? `&format=${contentFormat}` : '';
		const demoFeedUrl = `/feed-preview?platform=${platform}${formatParam}&accountName=${encodeURIComponent(platform.toUpperCase() + ' Demo User')}&caption=${encodeURIComponent(caption.slice(0, 500))}${queryImageUrl ? `&imageUrl=${queryImageUrl}` : ''}`;

		return NextResponse.json({
			ok: true,
			postUrl: demoFeedUrl,
			mode: 'demo',
			message: `Successfully published to ${platform.toUpperCase()} (Demo Mode)!`,
		});
	} catch (error) {
		console.error('Error publishing content:', error);
		return NextResponse.json({ error: (error as Error).message || 'Failed to publish content.' }, { status: 500 });
	}
}
