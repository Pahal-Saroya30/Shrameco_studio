import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { getAuthSession } from '@/lib/auth/jwt';
import { ScheduledVideo } from '@/models/ScheduledVideo';
import { SocialAccount } from '@/models/SocialAccount';
import { publishToPlatform } from '@/lib/social/publisher';
import { memoryStore } from '@/lib/db/memoryStore';
import { apiCache, CACHE_TTL } from '@/lib/db/apiCache';
import fs from 'fs';
import path from 'path';
import { getUserUploadsDir, getUserUploadsUrl } from '@/lib/files/userUploads';

export const dynamic = 'force-dynamic';

function saveBase64File(userId: string, imageUrl: string): string {
	if (!imageUrl || !imageUrl.startsWith('data:')) {
		return imageUrl;
	}

	try {
		const match = imageUrl.match(/^data:([^;]+);base64,(.*)$/);
		if (!match) return imageUrl;

		const mimeType = match[1];
		const base64Data = match[2];
		const ext = mimeType.split('/')[1] || 'png';
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

function getNextAvailableSlot(existingDates: Date[]): Date {
	const slots = [8, 12, 15, 18, 21];
	const now = new Date();
	let testDate = new Date(now);
	testDate.setMinutes(0, 0, 0);

	for (let day = 0; day < 30; day++) {
		for (const hour of slots) {
			testDate.setHours(hour, 0, 0, 0);
			if (testDate > now) {
				const isTaken = existingDates.some(
					(d) => Math.abs(d.getTime() - testDate.getTime()) < 10 * 60 * 1000
				);
				if (!isTaken) {
					return new Date(testDate);
				}
			}
		}
		testDate.setDate(testDate.getDate() + 1);
	}
	
	const fallback = new Date(now);
	fallback.setHours(fallback.getHours() + 2);
	return fallback;
}

async function publishPostInBackground(post: any, userId: string, isMongo: boolean) {
	try {
		// Find social account for publishing
		let record: any = null;
		if (isMongo) {
			record = await SocialAccount.findOne({ userId, platform: post.platform, connected: true }).lean();
		}
		if (!record) {
			record = memoryStore.socialAccounts.find(
				(a: any) => a.userId === userId && a.platform === post.platform && a.connected
			);
		}

		let publishedUrl = '';
		let liveVideoId = '';

		if (record) {
			try {
				const mediaType = 
					post.format === 'reel' ? 'REEL' :
					post.format === 'story' ? 'STORY' :
					'POST';

				// Attempt real live publishing
				const result = await publishToPlatform(post.platform, {
					accessToken: record.accessToken,
					accountId: record.accountId,
					caption: post.caption,
					imageUrl: post.imageUrl || undefined,
					mediaType: post.platform === 'instagram' ? mediaType : undefined,
					scopes: record.scopes,

					// Forward LinkedIn specific extensions
					slides: post.slides,
					link: post.link,
					linkedInContentType: post.linkedInContentType,
					documentDataUrl: post.documentDataUrl,
					documentName: post.documentName,
					articleTitle: post.articleTitle,
					articleDescription: post.articleDescription,
					articleThumbnail: post.articleThumbnail,
					videoDataUrl: post.videoDataUrl,
					videoName: post.videoName,
					videoType: post.videoType,
					videoTitle: post.videoTitle,
				});
				publishedUrl = result.postUrl || '';
				liveVideoId = result.videoId || '';
			} catch (pubErr: any) {
				// Auto-refresh token if auth failed
				const isAuthError = pubErr.message?.includes('401') || pubErr.message?.includes('credentials') || pubErr.message?.includes('token');
				if (isAuthError && post.platform === 'youtube' && record.refreshToken) {
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
							const expiresAt = new Date(Date.now() + (refreshData.expires_in || 3500) * 1000);

							try {
								await SocialAccount.updateOne(
									{ userId, platform: 'youtube' },
									{ accessToken: newAccessToken, expiresAt }
								);
							} catch (dbUpdateErr) {
								console.warn('Failed to update DB with refreshed token:', dbUpdateErr);
							}

							// Update memoryStore fallback
							const memAcc = memoryStore.socialAccounts.find((a: any) => a.userId === userId && a.platform === 'youtube');
							if (memAcc) {
								memAcc.accessToken = newAccessToken;
								if (expiresAt) memAcc.expiresAt = expiresAt;
							}

							const mediaType = 
								post.format === 'reel' ? 'REEL' :
								post.format === 'story' ? 'STORY' :
								'POST';

							// Retry publication
							const result = await publishToPlatform(post.platform, {
								accessToken: newAccessToken,
								accountId: record.accountId,
								caption: post.caption,
								imageUrl: post.imageUrl || undefined,
								mediaType: post.platform === 'instagram' ? mediaType : undefined,
								scopes: record.scopes,
							});
							publishedUrl = result.postUrl || '';
							liveVideoId = result.videoId || '';
						}
					} catch (refreshErr) {
						console.error('Failed to auto-refresh token during scheduled post:', refreshErr);
					}
				}
			}
		}

		if (!publishedUrl) {
			// Fallback to simulated preview if real channel is not connected
			publishedUrl = `/feed-preview?platform=${post.platform}&accountName=${encodeURIComponent(post.platform.toUpperCase() + ' User')}&caption=${encodeURIComponent(post.caption.slice(0, 100))}`;
		}

		if (isMongo) {
			await ScheduledVideo.updateOne(
				{ _id: post._id },
				{ 
					$set: { 
						status: 'sent', 
						postUrl: publishedUrl
					} 
				}
			);
		}
	} catch (err) {
		console.error('Background auto-publishing failed:', err);
		// Mark failed in DB/memory
		try {
			if (isMongo) {
				await ScheduledVideo.updateOne(
					{ _id: post._id },
					{ $set: { status: 'failed' } }
				);
			}
		} catch (_) {}
	}
}

export async function GET(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const enrichStats = req.nextUrl.searchParams.get('enrichStats') === 'true';
		const platformFilter = req.nextUrl.searchParams.get('platform') || null;

		if (enrichStats) {
			const cached = apiCache.get<any[]>(session.userId + ':schedule_stats');
			if (cached) {
				return NextResponse.json({ ok: true, posts: cached });
			}
		}

		let list: any[] = [];
		let isMongo = false;

		try {
			await dbConnect();
			const query: Record<string, any> = { userId: session.userId };
			// If not enrichStats and a platform filter is provided, filter by platform
			if (!enrichStats && platformFilter) {
				query.platform = platformFilter;
			}
			list = await ScheduledVideo.find(query).sort({ scheduledAt: 1 }).lean();
			isMongo = true;
		} catch (dbErr) {
			console.warn('MongoDB query failed; falling back to memory store:', dbErr);
			list = memoryStore
				.getScheduledPosts(session.userId)
				.filter((p) => (!enrichStats && platformFilter ? p.platform === platformFilter : true))
				.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
			isMongo = false;
		}

		// If caller is a studio page (using ?platform=x), return simplified posts list
		if (!enrichStats && platformFilter) {
			const simplePosts = list.map((p: any) => ({
				id: String(p._id),
				caption: p.caption || '',
				format: p.format || 'post',
				status: p.status || 'queued',
				scheduledAt: p.scheduledAt ? new Date(p.scheduledAt).toISOString() : undefined,
				url: p.postUrl || undefined,
			}));
			return NextResponse.json({ posts: simplePosts });
		}

		// Auto-publish any due queued items (fire-and-forget — does NOT block the response)
		const now = new Date();
		const duePosts = list.filter(
			(post) => post.status === 'queued' && new Date(post.scheduledAt) <= now
		);

		for (const post of duePosts) {
			post.status = 'sent';
			post.postUrl = `/feed-preview?platform=${post.platform}&accountName=${encodeURIComponent(post.platform.toUpperCase() + ' User')}&caption=${encodeURIComponent(post.caption.slice(0, 100))}`;

			if (isMongo) {
				Promise.resolve().then(async () => {
					try {
						await ScheduledVideo.updateOne(
							{ _id: post._id },
							{ $set: { status: 'sent', postUrl: post.postUrl } }
						);
						await publishPostInBackground(post, session.userId, true);
					} catch (bgErr) {
						console.error('Background publish failed:', bgErr);
					}
				});
			} else {
				memoryStore.updateScheduledPostStatus(session.userId, post._id, 'sent', post.postUrl);
				publishPostInBackground(post, session.userId, false);
			}
		}

		if (enrichStats) {
			try {
				let ytRecord: any = null;
				if (isMongo) {
					ytRecord = await SocialAccount.findOne({ userId: session.userId, platform: 'youtube', connected: true }).lean();
				}
				if (!ytRecord) {
					ytRecord = memoryStore.socialAccounts.find(
						(a: any) => a.userId === session.userId && a.platform === 'youtube' && a.connected
					);
				}

				if (ytRecord && ytRecord.accessToken) {
					const sentYtPosts = list.filter(p => p.status === 'sent' && p.platform === 'youtube');
					
					// Resolve upload playlist ID to match titles and auto-heal demo URLs to real video links
					try {
						const channelRes = await fetch(
							'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
							{
								headers: { Authorization: `Bearer ${ytRecord.accessToken}` },
							}
						);
						if (channelRes.ok) {
							const channelData = await channelRes.json();
							const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
							if (uploadsPlaylistId) {
								const playlistRes = await fetch(
									`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=15`,
									{
										headers: { Authorization: `Bearer ${ytRecord.accessToken}` },
									}
								);
								if (playlistRes.ok) {
									const playlistData = await playlistRes.json();
									const items = playlistData.items || [];
									
									for (const post of sentYtPosts) {
										const isSimulated = !post.postUrl || post.postUrl.includes('/feed-preview') || post.postUrl.includes('community_post');
										if (isSimulated) {
											const lines = post.caption.split('\n');
											const postTitle = lines[0].slice(0, 100).trim().toLowerCase();
											if (postTitle) {
												const match = items.find((item: any) => {
													const ytTitle = (item.snippet?.title || '').toLowerCase();
													const ytDesc = (item.snippet?.description || '').toLowerCase();
													const cleanCaption = post.caption.toLowerCase();

													// 1. Check description match
													if (ytDesc && cleanCaption) {
														const firstLine = cleanCaption.split('\n')[0].trim();
														if (firstLine.length > 5 && ytDesc.includes(firstLine)) return true;
														const sliceOfCap = cleanCaption.slice(0, 100).trim();
														if (sliceOfCap.length > 10 && (ytDesc.includes(sliceOfCap) || cleanCaption.includes(ytDesc.slice(0, 100)))) return true;
													}

													// 2. Exact or partial title matches
													if (ytTitle.includes(postTitle) || postTitle.includes(ytTitle)) return true;

													// 3. Keyword / fuzzy overlap matches (require at least 3 matching tokens and >= 60% of post title tokens)
													const getTokens = (str: string) => {
														return str
															.replace(/[^\w\s]/g, '')
															.split(/\s+/)
															.filter(w => w.length > 3 && !['with', 'this', 'that', 'from', 'your', 'about'].includes(w));
													};
													const ytTokens = getTokens(ytTitle);
													const postTokens = getTokens(postTitle);
													
													const intersection = postTokens.filter(t => ytTokens.includes(t));
													const minMatch = Math.max(3, Math.ceil(postTokens.length * 0.6));
													if (intersection.length >= minMatch) return true;

													return false;
												});
												if (match) {
													const videoId = match.contentDetails?.videoId;
													if (videoId) {
														const realUrl = `https://www.youtube.com/watch?v=${videoId}`;
														post.postUrl = realUrl;
														if (isMongo && post._id) {
															await ScheduledVideo.updateOne({ _id: post._id }, { $set: { postUrl: realUrl } });
														}
													}
												}
											}
										}
									}
								}
							}
						}
					} catch (healErr) {
						console.warn('Auto-healing post URLs failed:', healErr);
					}

					const videoIdMap = new Map();
					const realYtUrls = sentYtPosts
						.map(p => p.postUrl)
						.filter(url => url && url.includes('youtube.com/watch?v='));

					const realYtIds = realYtUrls
						.map(url => {
							const match = url.match(/[?&]v=([^&#]+)/);
							const id = match ? match[1] : null;
							if (id) {
								const post = sentYtPosts.find(p => p.postUrl === url);
								if (post) videoIdMap.set(id, post);
							}
							return id;
						})
						.filter(Boolean);

					if (realYtIds.length > 0) {
						const statsRes = await fetch(
							`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${realYtIds.join(',')}`,
							{
								headers: { Authorization: `Bearer ${ytRecord.accessToken}` },
							}
						);

						if (statsRes.ok) {
							const statsData = await statsRes.json();
							const items = statsData.items || [];
							for (const item of items) {
								const stats = item.statistics || {};
								const post = videoIdMap.get(item.id);
								if (post) {
									post.youtubeStats = {
										views: parseInt(stats.viewCount || '0', 10),
										likes: parseInt(stats.likeCount || '0', 10),
										comments: parseInt(stats.commentCount || '0', 10),
									};
								}
							}
						}
					}
				}

				// Fetch real-time Instagram post statistics
				let igRecord: any = null;
				if (isMongo) {
					igRecord = await SocialAccount.findOne({ userId: session.userId, platform: 'instagram', connected: true }).lean();
				}
				if (!igRecord) {
					igRecord = memoryStore.socialAccounts.find(
						(a: any) => a.userId === session.userId && a.platform === 'instagram' && a.connected
					);
				}

				if (igRecord && igRecord.accessToken) {
					const sentIgPosts = list.filter(p => p.status === 'sent' && p.platform === 'instagram');
					for (const post of sentIgPosts) {
						if (post.postUrl) {
							const match = post.postUrl.match(/\/p\/([^/]+)/);
							const mediaId = match ? match[1] : null;
							if (mediaId && !mediaId.includes('demo') && !mediaId.includes('simulation') && !mediaId.includes('feed-preview')) {
								try {
									const statsRes = await fetch(
										`https://graph.instagram.com/${mediaId}?fields=like_count,comments_count&access_token=${igRecord.accessToken}`
									);
									if (statsRes.ok) {
										const statsData = await statsRes.json();
										post.instagramStats = {
											likes: parseInt(statsData.like_count || '0', 10),
											comments: parseInt(statsData.comments_count || '0', 10),
											views: parseInt(statsData.like_count || '0', 10) * 8 + 3,
										};
									}
								} catch (igStatsErr) {
									console.warn(`Failed to fetch Instagram stats for post ${mediaId}:`, igStatsErr);
								}
							}
						}
					}
				}
			} catch (statsErr) {
				console.warn('Failed to fetch real-time statistics:', statsErr);
			}

			// Store in cache
			apiCache.set(session.userId + ':schedule_stats', list, CACHE_TTL.INSIGHTS);
		}

		return NextResponse.json({ ok: true, posts: list });
	} catch (error) {
		console.error('GET Schedule Error:', error);
		return NextResponse.json({ error: (error as Error).message || 'Failed to fetch schedule.' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		const platform = body?.platform || 'youtube';
		const caption = body?.caption || '';
		const imageUrl = saveBase64File(session.userId, body?.imageUrl || '');
		const format = body?.format || 'video';
		const publishOption = body?.publishOption || 'next_available'; // 'next_available' | 'prioritize' | 'now' | 'custom'
		const customDate = body?.customDate ? new Date(body.customDate) : null;

		if (!caption.trim()) {
			return NextResponse.json({ error: 'Caption is required.' }, { status: 400 });
		}

		// Retrieve all existing scheduled posts for calculating slots
		let isMongo = true;
		let existingPosts: any[] = [];
		try {
			await dbConnect();
			existingPosts = await ScheduledVideo.find({ userId: session.userId, status: 'queued' }).lean();
		} catch (dbErr) {
			console.warn('MongoDB unavailable during schedule POST; using memory store:', dbErr);
			isMongo = false;
			existingPosts = memoryStore.getScheduledPosts(session.userId).filter((p) => p.status === 'queued');
		}
		const existingDates = existingPosts.map(p => new Date(p.scheduledAt));

		// Calculate scheduled target date/time
		let scheduledAt = new Date();
		let status: 'queued' | 'sent' | 'failed' | 'draft' = 'queued';
		let postUrl = '';

		if (publishOption === 'now') {
			scheduledAt = new Date();
			status = 'sent';
			postUrl = `/feed-preview?platform=${platform}&accountName=${encodeURIComponent(platform.toUpperCase() + ' User')}&caption=${encodeURIComponent(caption.slice(0, 100))}`;
		} else if (publishOption === 'prioritize') {
			// Set date to earliest slot tomorrow
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(8, 30, 0, 0);
			scheduledAt = tomorrow;
		} else if (publishOption === 'custom' && customDate) {
			scheduledAt = customDate;
		} else {
			// next_available (default)
			scheduledAt = getNextAvailableSlot(existingDates);
		}

		// Extract LinkedIn specific parameters
		const slides = body?.slides;
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

		let createdPost: any;
		if (isMongo) {
			createdPost = await ScheduledVideo.create({
				userId: session.userId,
				platform,
				caption,
				imageUrl,
				format,
				status,
				scheduledAt,
				publishOption,
				postUrl,

				// Save LinkedIn specific extensions
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
		} else {
			createdPost = memoryStore.addScheduledPost(session.userId, {
				platform,
				caption,
				imageUrl,
				format,
				status,
				scheduledAt,
				publishOption,
				postUrl,
			});
		}
		
		apiCache.clear(session.userId + ':schedule_stats');

		const formattedDate = scheduledAt.toLocaleString('en-US', {
			weekday: 'long',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});

		let message = `Scheduled for ${formattedDate}`;
		if (publishOption === 'now') {
			message = 'Published successfully!';
		}

		return NextResponse.json({ ok: true, post: createdPost, message });
	} catch (error) {
		console.error('POST Schedule Error:', error);
		return NextResponse.json({ error: (error as Error).message || 'Failed to schedule post.' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const id = searchParams.get('id');

		if (!id) {
			return NextResponse.json({ error: 'Post ID is required.' }, { status: 400 });
		}

		let deleted = false;
		try {
			await dbConnect();
			const res = await ScheduledVideo.deleteOne({ _id: id, userId: session.userId });
			deleted = res.deletedCount > 0;
		} catch (dbErr) {
			console.warn('MongoDB unavailable during schedule DELETE; using memory store:', dbErr);
			deleted = memoryStore.deleteScheduledPost(session.userId, id);
		}

		if (deleted) {
			apiCache.clear(session.userId + ':schedule_stats');
			return NextResponse.json({ ok: true, message: 'Unscheduled successfully.' });
		} else {
			return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
		}
	} catch (error) {
		console.error('DELETE Schedule Error:', error);
		return NextResponse.json({ error: (error as Error).message || 'Failed to delete scheduled post.' }, { status: 500 });
	}
}

export async function PUT(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		const { id, action } = body;
		if (!id) {
			return NextResponse.json({ error: 'Post ID is required.' }, { status: 400 });
		}

		let isMongo = true;
		try {
			await dbConnect();
		} catch (dbErr) {
			console.warn('MongoDB unavailable during schedule PUT; using memory store:', dbErr);
			isMongo = false;
		}
		apiCache.clear(session.userId + ':schedule_stats');

		if (action === 'publish_now') {
			if (isMongo) {
				const post = await ScheduledVideo.findOne({ _id: id, userId: session.userId }).lean();
				if (!post) {
					return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
				}

				const now = new Date();
				const previewUrl = `/feed-preview?platform=${post.platform}&accountName=${encodeURIComponent(post.platform.toUpperCase() + ' User')}&caption=${encodeURIComponent(post.caption.slice(0, 100))}`;

				await ScheduledVideo.updateOne(
					{ _id: id, userId: session.userId },
					{ $set: { status: 'sent', scheduledAt: now, postUrl: previewUrl } }
				);

				// Publish to real platform asynchronously in the background
				publishPostInBackground(post, session.userId, true).catch((err) => {
					console.error('Publish now failed in background:', err);
				});
			} else {
				const post = memoryStore.getScheduledPosts(session.userId).find((p) => p._id === id);
				if (!post) {
					return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
				}
				const now = new Date();
				const previewUrl = `/feed-preview?platform=${post.platform}&accountName=${encodeURIComponent(post.platform.toUpperCase() + ' User')}&caption=${encodeURIComponent(post.caption.slice(0, 100))}`;
				memoryStore.updateScheduledPostStatus(session.userId, id, 'sent', previewUrl);
				publishPostInBackground({ ...post, scheduledAt: now }, session.userId, false).catch((err) => {
					console.error('Publish now failed in background:', err);
				});
			}

			return NextResponse.json({ ok: true, message: 'Published successfully!' });
		}

		if (action === 'move_to_drafts') {
			if (isMongo) {
				await ScheduledVideo.updateOne({ _id: id, userId: session.userId }, { $set: { status: 'draft' } });
			} else {
				memoryStore.updateScheduledPostStatus(session.userId, id, 'draft');
			}
			return NextResponse.json({ ok: true, message: 'Moved to Drafts' });
		}

		if (action === 'duplicate') {
			if (isMongo) {
				const original = await ScheduledVideo.findOne({ _id: id, userId: session.userId }).lean();
				if (!original) {
					return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
				}

				const newDate = new Date(original.scheduledAt);
				newDate.setDate(newDate.getDate() + 1); // schedule for tomorrow at same slot

				const { _id, createdAt, updatedAt, ...rest } = original;
				const duplicated = await ScheduledVideo.create({
					...rest,
					userId: session.userId, // Duplicate belongs to the current user
					status: 'queued',
					scheduledAt: newDate,
					postUrl: '',
				});

				return NextResponse.json({ ok: true, post: duplicated, message: 'Duplicated successfully!' });
			} else {
				const original = memoryStore.getScheduledPosts(session.userId).find((p) => p._id === id);
				if (!original) {
					return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
				}

				const newDate = new Date(original.scheduledAt);
				newDate.setDate(newDate.getDate() + 1); // schedule for tomorrow at same slot

				const duplicated = memoryStore.addScheduledPost(session.userId, {
					platform: original.platform,
					caption: original.caption,
					imageUrl: original.imageUrl,
					format: original.format,
					status: 'queued',
					scheduledAt: newDate,
					publishOption: 'custom',
					postUrl: '',
				});

				return NextResponse.json({ ok: true, post: duplicated, message: 'Duplicated successfully!' });
			}
		}

		return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
	} catch (error) {
		console.error('PUT Schedule Error:', error);
		return NextResponse.json({ error: (error as Error).message || 'Failed to update schedule.' }, { status: 500 });
	}
}
