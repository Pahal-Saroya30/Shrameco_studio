import { dbConnect } from '@/lib/db/mongoose';
import { ScheduledVideo } from '@/models/ScheduledVideo';
import { SocialAccount } from '@/models/SocialAccount';
import { publishToPlatform } from '@/lib/social/publisher';

declare global {
	var backgroundSchedulerStarted: boolean | undefined;
}

let isRunning = false;

export function startBackgroundScheduler() {
	if (global.backgroundSchedulerStarted) {
		return;
	}
	global.backgroundSchedulerStarted = true;

	console.log('Background video scheduler worker successfully initialized.');

	setInterval(async () => {
		if (isRunning) return;
		isRunning = true;

		try {
			await dbConnect();
			const now = new Date();
			
			// Find all queued videos whose scheduled time has passed
			const dueVideos = await ScheduledVideo.find({
				status: 'queued',
				scheduledAt: { $lte: now }
			});

			for (const video of dueVideos) {
				console.log(`[Scheduler] Processing scheduled publish: ${video._id} (platform: ${video.platform}, scheduled at ${video.scheduledAt})`);
				
				// Transition to 'sent' immediately to prevent race conditions or duplicate publishing
				video.status = 'sent';
				const previewUrl = `/feed-preview?platform=${video.platform}&accountName=${encodeURIComponent(video.platform.toUpperCase() + ' User')}&caption=${encodeURIComponent(video.caption.slice(0, 100))}`;
				video.postUrl = previewUrl;
				await video.save();

				try {
					// Load credentials for the target platform
					const account = await SocialAccount.findOne({
						userId: video.userId,
						platform: video.platform,
						connected: true
					}).lean();

					if (account && account.accessToken) {
						let token = account.accessToken;

						// Refresh token if expired and refreshToken is present
						const isExpired = account.expiresAt && new Date() > new Date(account.expiresAt);
						if (isExpired && account.refreshToken) {
							console.log(`[Scheduler] Refreshing expired token for user ${video.userId} on ${video.platform}`);
							try {
								if (video.platform === 'youtube') {
									const clientId = process.env.YOUTUBE_CLIENT_ID || '';
									const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || '';
									const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
										method: 'POST',
										headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
										body: new URLSearchParams({
											client_id: clientId,
											client_secret: clientSecret,
											refresh_token: account.refreshToken,
											grant_type: 'refresh_token',
										}),
									});

									if (refreshRes.ok) {
										const refreshData = await refreshRes.json();
										token = refreshData.access_token;
										const newExpiresAt = new Date(Date.now() + (refreshData.expires_in || 3500) * 1000);
										
										await SocialAccount.updateOne(
											{ _id: account._id },
											{ $set: { accessToken: token, expiresAt: newExpiresAt } }
										);
									}
								} else if (video.platform === 'linkedin') {
									const clientId = process.env.LINKEDIN_CLIENT_ID || '';
									const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
									const refreshRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
										method: 'POST',
										headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
										body: new URLSearchParams({
											grant_type: 'refresh_token',
											refresh_token: account.refreshToken,
											client_id: clientId,
											client_secret: clientSecret,
										}),
									});

									if (refreshRes.ok) {
										const refreshData = await refreshRes.json();
										token = refreshData.access_token;
										const newExpiresAt = new Date(Date.now() + (refreshData.expires_in || 3500) * 1000);
										
										await SocialAccount.updateOne(
											{ _id: account._id },
											{ $set: { accessToken: token, expiresAt: newExpiresAt } }
										);
									}
								}
							} catch (tokenErr) {
								console.error('[Scheduler] Failed to refresh token:', tokenErr);
							}
						}

						const mediaType = 
							video.format === 'reel' ? 'REEL' :
							video.format === 'story' ? 'STORY' :
							'POST';

						const result = await publishToPlatform(video.platform, {
							accessToken: token,
							accountId: account.accountId,
							caption: video.caption,
							imageUrl: video.imageUrl || undefined,
							mediaType: video.platform === 'instagram' ? mediaType : undefined,
							scopes: account.scopes,

							// LinkedIn specific extensions
							slides: video.slides,
							link: video.link,
							linkedInContentType: video.linkedInContentType,
							documentDataUrl: video.documentDataUrl,
							documentName: video.documentName,
							articleTitle: video.articleTitle,
							articleDescription: video.articleDescription,
							articleThumbnail: video.articleThumbnail,
							videoDataUrl: video.videoDataUrl,
							videoName: video.videoName,
							videoType: video.videoType,
							videoTitle: video.videoTitle,
						});

						if (result.postUrl) {
							video.postUrl = result.postUrl;
							video.status = 'sent';
							await video.save();
							console.log(`[Scheduler] Post ${video._id} successfully published to ${video.platform}: ${result.postUrl}`);
						} else {
							await video.save();
						}
					} else {
						console.warn(`[Scheduler] No connected account found for user ${video.userId} on platform ${video.platform}. Post status updated to failed.`);
						video.status = 'failed';
						await video.save();
					}
				} catch (publishErr) {
					console.error(`[Scheduler] Failed to publish post ${video._id} on ${video.platform}:`, publishErr);
					video.status = 'failed';
					await video.save();
				}
			}
		} catch (err) {
			console.error('[Scheduler] Error in background scheduler tick:', err);
		} finally {
			isRunning = false;
		}
	}, 30000); // Check every 30 seconds
}
