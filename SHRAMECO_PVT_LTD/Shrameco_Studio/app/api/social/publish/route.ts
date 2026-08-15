import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { getAuthSession } from '@/lib/auth/jwt';
import { SocialAccount } from '@/models/SocialAccount';
import { ScheduledVideo } from '@/models/ScheduledVideo';
import { publishToPlatform } from '@/lib/social/publisher';
import { memoryStore } from '@/lib/db/memoryStore';
import type { SocialPlatform } from '@/lib/social/types';
import fs from 'fs';
import path from 'path';
import { getUserUploadsDir, getUserUploadsUrl } from '@/lib/files/userUploads';

export const dynamic = 'force-dynamic';

const VALID_PLATFORMS: SocialPlatform[] = ['linkedin', 'instagram', 'x', 'facebook', 'youtube'];

function logToFile(msg: string) {
	try {
		const logPath = path.join(process.cwd(), 'server_debug.log');
		fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
	} catch (e) {
		console.error('logToFile failed:', e);
	}
}

function saveBase64File(userId: string, imageUrl: string): string {
	if (!imageUrl || !imageUrl.startsWith('data:')) {
		return imageUrl;
	}
	try {
		const match = imageUrl.match(/^data:([^;]+);base64,(.*)$/);
		if (!match) return imageUrl;

		const mimeType = match[1];
		const base64Data = match[2];
		const ext = mimeType.split('/')[1]?.split('+')[0] || 'png';
		const filename = `upload_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
		
		const dirPath = getUserUploadsDir(userId);
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, { recursive: true });
		}
		
		const filePath = path.join(dirPath, filename);
		fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
		
		return getUserUploadsUrl(userId, filename);
	} catch (e) {
		console.error('Failed to save base64 file:', e);
		return imageUrl;
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			logToFile('[Publish API] Rejecting with 401: Unauthorized');
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		const platform = body?.platform as SocialPlatform;
		const caption = typeof body?.caption === 'string' ? body.caption : '';
		const imageUrl = saveBase64File(session.userId, typeof body?.imageUrl === 'string' ? body.imageUrl : '');
		const videoUrl = saveBase64File(session.userId, typeof body?.videoUrl === 'string' ? body.videoUrl : '');
		const mediaType = typeof body?.mediaType === 'string' ? body.mediaType : undefined;
		const visibility = typeof body?.visibility === 'string' ? body.visibility : undefined;
		const categoryId = typeof body?.categoryId === 'string' ? body.categoryId : undefined;
		const madeForKids = body?.madeForKids === true || body?.madeForKids === 'true';

		if (!VALID_PLATFORMS.includes(platform)) {
			return NextResponse.json({ error: 'Invalid platform.' }, { status: 400 });
		}
		if (!caption.trim()) {
			return NextResponse.json({ error: 'Caption is required.' }, { status: 400 });
		}

		logToFile(`[Publish API] session userId: ${session.userId}, platform: ${platform}`);

		let record: { userId?: string; platform: SocialPlatform; accessToken: string; refreshToken?: string; accountId?: string; scopes?: string[] } | null = null;
		try {
			await dbConnect();
			const dbAccount = await SocialAccount.findOne({ userId: session.userId, platform, connected: true }).lean();
			if (dbAccount) {
				logToFile(`[Publish API] Found MongoDB account: ${dbAccount.accountName}`);
				record = {
					userId: dbAccount.userId.toString(),
					platform: dbAccount.platform,
					accessToken: dbAccount.accessToken,
					refreshToken: dbAccount.refreshToken,
					accountId: dbAccount.accountId,
					scopes: dbAccount.scopes,
				};
			}
		} catch (dbErr) {
			console.warn('MongoDB connection failed; attempting fallback.');
		}

		// MemoryStore fallback for local environments without MongoDB
		if (!record) {
			const memAcc = memoryStore.socialAccounts.find((a: any) => a.userId === session.userId && a.platform === platform && a.connected);
			if (memAcc && memAcc.accessToken) {
				logToFile(`[Publish API] Found memoryStore fallback account: ${memAcc.accountName}`);
				record = {
					userId: memAcc.userId,
					platform: memAcc.platform as SocialPlatform,
					accessToken: memAcc.accessToken,
					refreshToken: memAcc.refreshToken,
					accountId: memAcc.accountId,
					scopes: [],
				};
			}
		}

		if (record) {
			try {
				// Parse LinkedIn-specific extensions from body
				const slides = body?.slides;
				const size = body?.size;
				const link = body?.link;
				const linkedInContentType = body?.linkedInContentType;
				const documentDataUrl = body?.documentDataUrl;
				const documentName = body?.documentName;
				const articleTitle = body?.articleTitle;
				const articleDescription = body?.articleDescription;
				const articleThumbnail = body?.articleThumbnail;
				const videoDataUrl = body?.videoDataUrl;
				const videoName = body?.videoName;
				const videoType = body?.videoType;
				const videoTitle = body?.videoTitle;

				const result = await publishToPlatform(platform, {
					accessToken: record.accessToken,
					accountId: record.accountId,
					caption,
					imageUrl,
					videoUrl,
					mediaType,
					scopes: record.scopes,
					visibility,
					categoryId,
					madeForKids,

					// Forward LinkedIn extensions
					slides,
					size,
					link,
					linkedInContentType,
					documentDataUrl,
					documentName,
					articleTitle,
					articleDescription,
					articleThumbnail,
					videoDataUrl,
					videoName,
					videoType,
					videoTitle,
				});

				// Create history log in DB
				try {
					await dbConnect();
					const formatVal = 
						linkedInContentType === 'carousel' ? 'carousel' :
						linkedInContentType === 'article' ? 'article' :
						linkedInContentType === 'video' ? 'video' :
						mediaType === 'REEL' ? 'reel' :
						mediaType === 'STORY' ? 'story' :
						platform === 'youtube' ? (mediaType === 'short' || caption.length < 100 ? 'short' : 'video') :
						'post';

					await ScheduledVideo.create({
						userId: session.userId,
						platform,
						caption,
						imageUrl: imageUrl || videoUrl || undefined,
						format: formatVal,
						status: 'sent',
						scheduledAt: new Date(),
						publishOption: 'now',
						postUrl: result.postUrl || undefined,

						// Save LinkedIn extensions
						slides,
						link,
						linkedInContentType,
						documentDataUrl,
						documentName,
						articleTitle,
						articleDescription,
						articleThumbnail,
						videoDataUrl,
						videoName,
						videoType,
						videoTitle,
					});
				} catch (dbErr) {
					console.error('[Publish API] Failed to log live publish to history:', dbErr);
				}

				return NextResponse.json({ ok: true, postUrl: result.postUrl || null, videoId: result.videoId || null, mode: 'live' });
			} catch (pubErr: any) {
				const isAuthError = pubErr.message?.includes('401') || pubErr.message?.includes('credentials') || pubErr.message?.includes('token');

				if (isAuthError && platform === 'youtube' && record.refreshToken) {
					logToFile(`[Publish API] Auth error detected. Attempting to refresh YouTube access token using refresh token...`);
					try {
						const clientId = process.env.YOUTUBE_CLIENT_ID || '';
						const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || '';

						const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
							method: 'POST',
							headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
							body: new URLSearchParams({
								client_id: clientId,
								client_secret: clientSecret,
								refresh_token: record.refreshToken,
								grant_type: 'refresh_token',
							}),
						});

						if (refreshRes.ok) {
							const refreshData = await refreshRes.json();
							const newAccessToken = refreshData.access_token;
							const expiresIn = refreshData.expires_in;
							const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined;

							logToFile(`[Publish API] YouTube token refreshed successfully. Updating DB and MemoryStore.`);

							// Update MongoDB
							try {
								await dbConnect();
								const updateUserId = record.userId || session.userId;
								await SocialAccount.updateOne(
									{ userId: updateUserId, platform: 'youtube' },
									{ accessToken: newAccessToken, expiresAt }
								);
							} catch (dbUpdateErr) {
								console.warn('Failed to update DB with refreshed token:', dbUpdateErr);
							}

							// Update MemoryStore fallback
							const memAcc = memoryStore.socialAccounts.find((a: any) => a.userId === session.userId && a.platform === 'youtube');
							if (memAcc) {
								memAcc.accessToken = newAccessToken;
								if (expiresAt) memAcc.expiresAt = expiresAt;
							}

							logToFile(`[Publish API] Retrying upload with refreshed access token...`);
							const result = await publishToPlatform(platform, {
								accessToken: newAccessToken,
								accountId: record.accountId,
								caption,
								imageUrl,
								videoUrl,
								mediaType,
								scopes: record.scopes,
								visibility,
								categoryId,
								madeForKids,
							});

							// Create history log in DB for refreshed token retry
							try {
								await dbConnect();
								const formatVal = 
									mediaType === 'REEL' ? 'reel' :
									mediaType === 'STORY' ? 'story' :
									platform === 'youtube' ? (mediaType === 'short' || caption.length < 100 ? 'short' : 'video') :
									'post';

								await ScheduledVideo.create({
									userId: session.userId,
									platform,
									caption,
									imageUrl: imageUrl || videoUrl || undefined,
									format: formatVal,
									status: 'sent',
									scheduledAt: new Date(),
									publishOption: 'now',
									postUrl: result.postUrl || undefined,
								});
							} catch (dbErr) {
								console.error('[Publish API] Failed to log live publish refresh-retry to history:', dbErr);
							}

							return NextResponse.json({ ok: true, postUrl: result.postUrl || null, videoId: result.videoId || null, mode: 'live' });
						} else {
							const errBody = await refreshRes.text();
							logToFile(`[Publish API] YouTube token refresh failed: ${errBody}`);
						}
					} catch (refreshErr) {
						console.error('[Publish API] Failed to auto-refresh YouTube token:', refreshErr);
					}
				}

				logToFile(`[Publish API] Live API publishing failed for ${platform}: ${pubErr.message || pubErr}`);
				console.error(`Live API publishing failed for ${platform}:`, pubErr);
				return NextResponse.json({ error: `Upload failed: ${pubErr.message || 'API error'}` }, { status: 500 });
			}
		}

		logToFile(`[Publish API] No connection record found for platform: ${platform}. Falling back to demo.`);
		console.warn('[Publish API] No connection record found for platform:', platform, '. Falling back to demo.');

		// Fallback Demo Publish Response pointing to simulated live feed preview
		const demoFeedUrl = `/feed-preview?platform=${platform}&accountName=${encodeURIComponent(platform.toUpperCase() + ' Demo User')}&caption=${encodeURIComponent(caption.slice(0, 500))}`;

		// Create history log in DB for demo mode publish
		try {
			await dbConnect();
			const formatVal = 
				mediaType === 'REEL' ? 'reel' :
				mediaType === 'STORY' ? 'story' :
				platform === 'youtube' ? (mediaType === 'short' || caption.length < 100 ? 'short' : 'video') :
				'post';

			await ScheduledVideo.create({
				userId: session.userId,
				platform,
				caption,
				imageUrl: imageUrl || videoUrl || undefined,
				format: formatVal,
				status: 'sent',
				scheduledAt: new Date(),
				publishOption: 'now',
				postUrl: demoFeedUrl,
			});
		} catch (dbErr) {
			console.error('[Publish API] Failed to log demo publish to history:', dbErr);
		}

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
