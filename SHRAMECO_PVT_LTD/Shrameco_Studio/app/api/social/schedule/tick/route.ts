import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { ScheduledVideo } from '@/models/ScheduledVideo';
import { SocialAccount } from '@/models/SocialAccount';
import { publishToPlatform } from '@/lib/social/publisher';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
	try {
		// Guard: requires a valid cron secret header. This route publishes for ALL users.
		const cronSecret = process.env.CRON_SECRET;
		if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await dbConnect();
		const now = new Date();
		
		// Find all queued videos whose scheduled time has passed
		const dueVideos = await ScheduledVideo.find({
			status: 'queued',
			scheduledAt: { $lte: now }
		});

		let publishedCount = 0;

		for (const video of dueVideos) {
			const platform = video.platform || 'youtube';
			console.log(`[Scheduler Tick] Processing video: ${video._id} for platform: ${platform}`);
			
			// Lock immediately
			video.status = 'sent';
			const previewUrl = `/feed-preview?platform=${platform}&accountName=${encodeURIComponent(platform.toUpperCase() + ' User')}&caption=${encodeURIComponent(video.caption.slice(0, 100))}`;
			video.postUrl = previewUrl;
			await video.save();

			try {
				const socialRecord = await SocialAccount.findOne({
					userId: video.userId,
					platform: platform,
					connected: true
				}).lean();

				if (socialRecord && socialRecord.accessToken) {
					let token = socialRecord.accessToken;
					
					// Token refresh check (only for youtube)
					if (platform === 'youtube') {
						const isExpired = socialRecord.expiresAt && new Date() > new Date(socialRecord.expiresAt);
						if (isExpired && socialRecord.refreshToken) {
							try {
								const clientId = process.env.YOUTUBE_CLIENT_ID || '';
								const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || '';
								const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
									method: 'POST',
									headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
									body: new URLSearchParams({
										client_id: clientId,
										client_secret: clientSecret,
										refresh_token: socialRecord.refreshToken,
										grant_type: 'refresh_token',
									}),
								});

								if (refreshRes.ok) {
									const refreshData = await refreshRes.json();
									token = refreshData.access_token;
									const newExpiresAt = new Date(Date.now() + (refreshData.expires_in || 3500) * 1000);
									await SocialAccount.updateOne(
										{ _id: socialRecord._id },
										{ $set: { accessToken: token, expiresAt: newExpiresAt } }
									);
								}
							} catch (tokenErr) {
								console.error('[Scheduler Tick] Failed to refresh token:', tokenErr);
							}
						}
					}

					const mediaType = 
						video.format === 'reel' ? 'REEL' :
						video.format === 'story' ? 'STORY' :
						'POST';

					const result = await publishToPlatform(platform, {
						accessToken: token,
						accountId: socialRecord.accountId,
						caption: video.caption,
						imageUrl: video.imageUrl || undefined,
						mediaType: platform === 'instagram' ? mediaType : undefined,
						scopes: socialRecord.scopes,
					});

					if (result.postUrl) {
						video.postUrl = result.postUrl;
						video.status = 'sent';
						await video.save();
						publishedCount++;
					} else {
						await video.save();
					}
				} else {
					video.status = 'failed';
					await video.save();
				}
			} catch (publishErr) {
				console.error(`[Scheduler Tick] Failed to publish:`, publishErr);
				video.status = 'failed';
				await video.save();
			}
		}

		return NextResponse.json({ ok: true, processed: dueVideos.length, published: publishedCount });
	} catch (error) {
		console.error('[Scheduler Tick] Tick handler failed:', error);
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
