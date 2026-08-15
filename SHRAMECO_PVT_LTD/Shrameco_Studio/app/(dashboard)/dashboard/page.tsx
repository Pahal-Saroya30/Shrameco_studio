'use client';

import React, { useState, useEffect } from 'react';
import {
	Moon,
	MessageCircle,
	CheckCircle2,
	Code2,
	CalendarDays,
	MessageSquare,
	HelpCircle,
	Cloud,
	Plus,
	Twitter,
	Linkedin,
	Instagram,
	Youtube,
	Facebook,
	Check,
	ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';

export default function DashboardHome() {
	const brandContext = useBrand();
	const currentDate = new Date().toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});

	const [posts, setPosts] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
	const userName = brandContext.userName || '';

	const loadPosts = async (showLoading = true) => {
		try {
			if (showLoading) setIsLoading(true);
			const res = await fetch(`/api/social/schedule?enrichStats=true&t=${Date.now()}`);
			const data = await res.json();
			if (res.ok && data.posts) {
				setPosts(data.posts);
			}
		} catch (err) {
			console.error('Failed to load posts:', err);
		} finally {
			if (showLoading) setIsLoading(false);
		}
	};

	useEffect(() => {
		loadPosts(true);

		// Fetch connected social channels to display in metrics and track platform counts
		const fetchAccounts = async () => {
			try {
				const res = await fetch('/api/social/accounts');
				if (res.ok) {
					const data = await res.json();
					const connected = (data.accounts || [])
						.filter((a: any) => a.connected)
						.map((a: any) => a.platform);
					setConnectedPlatforms(connected);
				}
			} catch (err) {
				console.error('Failed to fetch accounts:', err);
			}
		};
		fetchAccounts();

		// Automatic refresh when a post is successfully published/updated (silent re-fetch)
		const handleSilentRefresh = () => {
			loadPosts(false);
			fetchAccounts();
		};
		window.addEventListener('shrameco_post_published', handleSilentRefresh);
		return () => {
			window.removeEventListener('shrameco_post_published', handleSilentRefresh);
		};
	}, []);

	const queuedPosts = posts.filter((p) => p.status === 'queued');
	const sentPosts = posts.filter((p) => p.status === 'sent');

	// Aggregate real-time statistics across all connected channels (YouTube, Instagram, etc)
	const totalViews = sentPosts.reduce((sum, p) => {
		const ytViews = p.youtubeStats?.views || 0;
		const igViews = p.instagramStats?.views || 0;
		return sum + ytViews + igViews;
	}, 0);

	const totalLikes = sentPosts.reduce((sum, p) => {
		const ytLikes = p.youtubeStats?.likes || 0;
		const igLikes = p.instagramStats?.likes || 0;
		return sum + ytLikes + igLikes;
	}, 0);

	const totalComments = sentPosts.reduce((sum, p) => {
		const ytComments = p.youtubeStats?.comments || 0;
		const igComments = p.instagramStats?.comments || 0;
		return sum + ytComments + igComments;
	}, 0);

	// Calculate current daily post streak (consecutive days of posting)
	const calculateStreak = () => {
		if (sentPosts.length === 0) return 0;
		const postDates = sentPosts.map(p => {
			const d = new Date(p.scheduledAt);
			return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
		});
		
		let streakCount = 0;
		let checkDate = new Date();
		checkDate.setHours(0, 0, 0, 0);

		// If no posts today or yesterday, streak is 0
		const todayStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
		const yesterday = new Date(checkDate);
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

		const hasPostRecently = postDates.includes(todayStr) || postDates.includes(yesterdayStr);
		if (!hasPostRecently) return 0;

		while (true) {
			const targetStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
			if (postDates.includes(targetStr)) {
				streakCount++;
			} else {
				// Allow gap on today if yesterday had a post, but not on older dates
				const todayObj = new Date();
				todayObj.setHours(0, 0, 0, 0);
				if (checkDate.getTime() !== todayObj.getTime()) {
					break;
				}
			}
			checkDate.setDate(checkDate.getDate() - 1);
		}
		return streakCount;
	};

	const streak = calculateStreak();

	const getPlatformsText = () => {
		if (connectedPlatforms.length === 0) return 'no channels connected';
		const capitalized = connectedPlatforms.map(p => p === 'youtube' ? 'YouTube' : p === 'x' ? 'X' : p.charAt(0).toUpperCase() + p.slice(1));
		if (capitalized.length === 1) return capitalized[0];
		if (capitalized.length === 2) return `${capitalized[0]} & ${capitalized[1]}`;
		return capitalized.slice(0, -1).join(', ') + ' & ' + capitalized[capitalized.length - 1];
	};

	const getPlatformIcon = (platform: string) => {
		switch (platform?.toLowerCase()) {
			case 'twitter':
			case 'x':
				return <Twitter className="w-3.5 h-3.5 text-white" />;
			case 'linkedin':
				return <Linkedin className="w-3.5 h-3.5 text-white" />;
			case 'instagram':
				return <Instagram className="w-3.5 h-3.5 text-white" />;
			case 'youtube':
				return <Youtube className="w-3.5 h-3.5 text-white" />;
			case 'facebook':
				return <Facebook className="w-3.5 h-3.5 text-white" />;
			default:
				return <Check className="w-3.5 h-3.5 text-white" />;
		}
	};

	const getPlatformColor = (platform: string) => {
		switch (platform?.toLowerCase()) {
			case 'twitter':
			case 'x':
				return 'bg-slate-900';
			case 'linkedin':
				return 'bg-blue-600';
			case 'instagram':
				return 'bg-pink-600';
			case 'youtube':
				return 'bg-red-650';
			case 'facebook':
				return 'bg-blue-800';
			default:
				return 'bg-slate-500';
		}
	};

	return (
		<div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
			{/* Header Row */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
						<Moon className="w-6 h-6 text-amber-500 fill-amber-500" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Good Evening, {userName || 'User'}!</h1>
						<p className="text-sm font-medium text-slate-500">{currentDate}</p>
					</div>
				</div>
				<div className="flex items-center space-x-3">
					<button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
						<MessageCircle className="w-5 h-5" />
					</button>
					<button className="w-10 h-10 rounded-full border border-slate-200 bg-[#E5F5EC] flex items-center justify-center text-[#1E7D51] hover:bg-[#D1EBDD] transition-colors">
						<Cloud className="w-5 h-5" />
					</button>
				</div>
			</div>

			{/* Metrics Banner */}
			<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
				<div className="flex-1 flex items-center space-x-4 border-r border-slate-100 px-4">
					<div className="w-12 h-12 rounded-full border-2 border-indigo-100 flex items-center justify-center bg-indigo-50 flex-shrink-0">
						<span className="text-lg font-bold text-indigo-600">
							{streak > 0 ? `🔥${streak}` : '0'}
						</span>
					</div>
					<div>
						<div className="flex items-center space-x-1">
							<h3 className="font-bold text-slate-800 text-sm">Post Streak</h3>
							<div className="group relative">
								<HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
								<div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
									Your daily publishing streak and total reach (views) across connected accounts.
								</div>
							</div>
						</div>
						<p className="text-xs text-slate-500 mt-0.5">
							{totalViews.toLocaleString()} views on {getPlatformsText()}
						</p>
					</div>
				</div>

				<div className="flex-1 flex items-center space-x-4 border-r border-slate-100 px-8">
					<div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
						<span className="text-lg font-bold text-slate-700">{queuedPosts.length}</span>
					</div>
					<div>
						<div className="flex items-center space-x-1">
							<h3 className="font-bold text-slate-800 text-sm">Posting Goals</h3>
							<div className="group relative">
								<HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
								<div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
									Number of posts currently in your publication queue and total likes.
								</div>
							</div>
						</div>
						<p className="text-xs text-slate-500 mt-0.5">
							{totalLikes.toLocaleString()} likes on {getPlatformsText()}
						</p>
					</div>
				</div>

				<div className="flex-1 flex items-center space-x-4 px-8">
					<div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
						<span className="text-lg font-bold text-slate-700">{totalComments}</span>
					</div>
					<div>
						<div className="flex items-center space-x-1">
							<h3 className="font-bold text-slate-800 text-sm">Comment Score</h3>
							<div className="group relative">
								<HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
								<div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
									Total comments received across your channels.
								</div>
							</div>
						</div>
						<p className="text-xs text-slate-500 mt-0.5">
							{totalComments} comments on {getPlatformsText()}
						</p>
					</div>
				</div>
			</div>

			{/* First Steps Section */}
			<div>
				<h2 className="text-sm font-bold text-slate-800 mb-4 px-2">First Steps</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{/* Card 1 */}
					<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
						<div className="flex items-start justify-between mb-2">
							<h3 className="font-bold text-slate-800 text-sm">1. Connect a channel</h3>
							<CheckCircle2 className="w-4 h-4 text-emerald-500" />
						</div>
						<p className="text-xs text-slate-500 mb-6 flex-1">
							Personalize your profile to make the most out of Studio.
						</p>
						<Link href="/dashboard/youtube" className="self-start inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors">
							<Plus className="w-3.5 h-3.5" />
							<span>Manage Channels</span>
						</Link>
					</div>

					{/* Card 2 */}
					<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
						<div className="flex items-start justify-between mb-2">
							<h3 className="font-bold text-slate-800 text-sm">2. Create a post</h3>
							<CheckCircle2 className={`w-4 h-4 ${posts.length > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
						</div>
						<p className="text-xs text-slate-500 mb-6 flex-1">
							Schedule your first post in just a few clicks.
						</p>
						<Link href="/dashboard/create" className="self-start inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
							<span>Create Post</span>
						</Link>
					</div>

					{/* Card 3 */}
					<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
						<div className="flex items-start justify-between mb-2">
							<h3 className="font-bold text-slate-800 text-sm">3. Schedule video</h3>
							<CheckCircle2 className={`w-4 h-4 ${queuedPosts.length > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
						</div>
						<p className="text-xs text-slate-500 mb-6 flex-1">
							Manage your publication queue and organize weekly video slots.
						</p>
						<Link href="/dashboard/publish" className="self-start inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors">
							<CalendarDays className="w-3.5 h-3.5" />
							<span>Go to Calendar</span>
						</Link>
					</div>
				</div>
			</div>

			{/* Activity Split Section */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Up Next (Queued) */}
				<div>
					<div className="flex items-center justify-between mb-4 px-2">
						<h2 className="text-sm font-bold text-slate-800">Up Next</h2>
						<span className="text-xs text-slate-400 font-semibold">{queuedPosts.length} posts scheduled</span>
					</div>
					{queuedPosts.length > 0 ? (
						<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 max-h-[400px] overflow-y-auto">
							{queuedPosts.map((post) => {
								const isVideo = post.platform === 'youtube' || post.format === 'video' || post.format === 'short';
								let titleText = '';
								let descText = post.caption;
								let tagsText = '';

								if (isVideo && post.caption.includes('\n\n')) {
									const parts = post.caption.split('\n\n');
									titleText = parts[0] || '';
									descText = parts[1] || '';
									tagsText = parts.slice(2).join('\n\n') || '';
								}

								return (
									<div key={post._id} className="flex items-start space-x-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
										<div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getPlatformColor(post.platform)}`}>
											{getPlatformIcon(post.platform)}
										</div>
										<div className="flex-1 min-w-0">
											{titleText && (
												<p className="text-xs font-black text-slate-900 line-clamp-1 mb-0.5">{titleText}</p>
											)}
											<p className="text-[11px] font-semibold text-slate-600 line-clamp-2 leading-relaxed">{descText}</p>
											{tagsText && (
												<p className="text-[10px] font-bold text-indigo-500 mt-1 line-clamp-1">{tagsText}</p>
											)}
											<p className="text-[10px] text-indigo-600 font-bold mt-1.5 flex items-center space-x-1">
												<span>⏰</span>
												<span>
													{new Date(post.scheduledAt).toLocaleString('en-US', {
														month: 'short',
														day: 'numeric',
														hour: '2-digit',
														minute: '2-digit',
														hour12: false,
													})}
												</span>
											</p>
										</div>
										<span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 rounded border border-amber-200 uppercase tracking-wider">
											Queued
										</span>
									</div>
								);
							})}
						</div>
					) : (
						<div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm flex flex-col items-center justify-center text-center h-[280px]">
							<div className="w-14 h-14 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center mb-4">
								<CalendarDays className="w-6 h-6 text-slate-400" />
							</div>
							<p className="text-sm font-bold text-slate-800 mb-1">No posts scheduled yet.</p>
							<p className="text-xs text-slate-500 mb-6">You'll see upcoming posts here.</p>
							<Link href="/dashboard/create" className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors">
								<Plus className="w-3.5 h-3.5" />
								<span>Create Post</span>
							</Link>
						</div>
					)}
				</div>

				{/* Recently Published (Sent) */}
				<div>
					<div className="flex items-center justify-between mb-4 px-2">
						<h2 className="text-sm font-bold text-slate-800">Recently Published</h2>
						<span className="text-xs text-slate-400 font-semibold">{sentPosts.length} posts sent</span>
					</div>
					{sentPosts.length > 0 ? (
						<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 max-h-[400px] overflow-y-auto">
							{sentPosts.map((post) => {
								const isVideo = post.platform === 'youtube' || post.format === 'video' || post.format === 'short';
								let titleText = '';
								let descText = post.caption;
								let tagsText = '';

								if (isVideo && post.caption.includes('\n\n')) {
									const parts = post.caption.split('\n\n');
									titleText = parts[0] || '';
									descText = parts[1] || '';
									tagsText = parts.slice(2).join('\n\n') || '';
								}

								return (
									<div key={post._id} className="flex items-start space-x-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
										<div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getPlatformColor(post.platform)}`}>
											{getPlatformIcon(post.platform)}
										</div>
										<div className="flex-1 min-w-0">
											{titleText && (
												<p className="text-xs font-black text-slate-900 line-clamp-1 mb-0.5">{titleText}</p>
											)}
											<p className="text-[11px] font-semibold text-slate-600 line-clamp-2 leading-relaxed">{descText}</p>
											{tagsText && (
												<p className="text-[10px] font-bold text-indigo-500 mt-1 line-clamp-1">{tagsText}</p>
											)}
											<p className="text-[10px] text-slate-400 font-medium mt-1.5 flex items-center space-x-1">
												<span>✓ Sent on</span>
												<span>
													{new Date(post.scheduledAt).toLocaleString('en-US', {
														month: 'short',
														day: 'numeric',
														hour: '2-digit',
														minute: '2-digit',
														hour12: false,
													})}
												</span>
											</p>
										</div>
										<div className="flex items-center space-x-2 flex-shrink-0">
											{post.postUrl && (
												<a
													href={post.postUrl}
													className="p-1 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors"
													title="View Post"
												>
													<ExternalLink className="w-3.5 h-3.5" />
												</a>
											)}
											<span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-200 uppercase tracking-wider flex items-center space-x-0.5">
												<span>✓</span>
												<span>Sent</span>
											</span>
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm flex flex-col items-center justify-center text-center h-[280px]">
							<div className="w-14 h-14 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center mb-4">
								<MessageSquare className="w-6 h-6 text-slate-400" />
							</div>
							<p className="text-sm font-bold text-slate-800 mb-1">No posts sent yet.</p>
							<p className="text-xs text-slate-500">Your published content queue will be archived here.</p>
						</div>
					)}
				</div>
			</div>

			{/* Templates Footer (mocking the bottom section of Buffer's UI) */}
			<div className="pt-4">
				<h2 className="text-sm font-bold text-slate-800 mb-4 px-2">Templates</h2>
				<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-center h-[120px]">
					<p className="text-xs text-slate-400 font-medium">Template gallery coming soon.</p>
				</div>
			</div>
			
			<div className="fixed bottom-6 right-6">
				<button className="w-10 h-10 rounded-full bg-slate-800 text-white shadow-lg flex items-center justify-center hover:bg-slate-700 transition-colors">
					<HelpCircle className="w-5 h-5" />
				</button>
			</div>
		</div>
	);
}
