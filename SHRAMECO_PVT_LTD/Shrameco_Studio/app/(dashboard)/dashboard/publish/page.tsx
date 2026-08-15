'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
	List,
	CalendarDays,
	Plus,
	Tag,
	Globe,
	Settings,
	HelpCircle,
	Zap,
	Trash2,
	Youtube,
	Linkedin,
	Twitter,
	Facebook,
	Instagram,
	ExternalLink,
	Sparkles,
	Clock,
	Pin,
	MoreVertical,
	Send,
	Edit2,
	Copy,
	Maximize2,
	FileText,
	MessageSquare,
	LayoutGrid,
} from 'lucide-react';

interface ScheduledItem {
	_id: string;
	platform: 'instagram' | 'linkedin' | 'x' | 'facebook' | 'youtube';
	caption: string;
	imageUrl?: string;
	format: string;
	status: 'queued' | 'sent' | 'failed' | 'draft';
	scheduledAt: string;
	publishOption: string;
	postUrl?: string;
	accountName?: string;
	createdAt?: string;
	youtubeStats?: {
		views: number;
		likes: number;
		comments: number;
	};
	documentName?: string;
}

const PLATFORM_META: Record<string, { label: string; icon: any; color: string; accent: string }> = {
	youtube: { label: 'YouTube', icon: Youtube, color: 'text-red-600', accent: '#FF0000' },
	linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', accent: '#0A66C2' },
	x: { label: 'X', icon: Twitter, color: 'text-slate-900', accent: '#111827' },
	facebook: { label: 'Facebook', icon: Facebook, color: 'text-blue-600', accent: '#1877F2' },
	instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-600', accent: '#E1306C' },
};

const getPublishOptionLabel = (option: string) => {
	switch (option) {
		case 'prioritize': return 'Prioritize';
		case 'next_available': return 'Next Available';
		case 'now': return 'Publish Now';
		default: return 'Custom';
	}
};

const SLOT_HOURS = [
	{ label: '08:30', hour: 8, minute: 30 },
	{ label: '11:30', hour: 11, minute: 30 },
	{ hour: 14, minute: 30, label: '14:30' },
	{ hour: 17, minute: 30, label: '17:30' },
];

export default function PublishQueuePage() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<'queue' | 'drafts' | 'sent'>('queue');
	const [posts, setPosts] = useState<ScheduledItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
	
	const [currentWeekStart, setCurrentWeekStart] = useState(() => {
		const d = new Date();
		const day = d.getDay(); // 0 is Sunday
		const diff = d.getDate() - day;
		return new Date(new Date(d.setDate(diff)).setHours(0, 0, 0, 0));
	});

	const getWeekDays = () => {
		const days = [];
		for (let i = 0; i < 7; i++) {
			const d = new Date(currentWeekStart);
			d.setDate(d.getDate() + i);
			days.push(d);
		}
		return days;
	};

	const handlePrevWeek = () => {
		setCurrentWeekStart((prev) => {
			const d = new Date(prev);
			d.setDate(d.getDate() - 7);
			return d;
		});
	};

	const handleNextWeek = () => {
		setCurrentWeekStart((prev) => {
			const d = new Date(prev);
			d.setDate(d.getDate() + 7);
			return d;
		});
	};

	const handleToday = () => {
		const d = new Date();
		const day = d.getDay();
		const diff = d.getDate() - day;
		setCurrentWeekStart(new Date(new Date(d.setDate(diff)).setHours(0, 0, 0, 0)));
	};

	const fetchQueue = async (showLoading = true) => {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);
		try {
			if (showLoading) setLoading(true);
			const res = await fetch(`/api/social/schedule?enrichStats=true&t=${Date.now()}`, { signal: controller.signal });
			if (res.ok) {
				const data = await res.json();
				setPosts(data.posts || []);
			}
		} catch (err: any) {
			if (err?.name !== 'AbortError') {
				console.error('Failed to load schedule queue:', err);
			}
		} finally {
			clearTimeout(timeoutId);
			if (showLoading) setLoading(false);
		}
	};

	useEffect(() => {
		fetchQueue(true);

		const handleSilentRefresh = () => fetchQueue(false);
		window.addEventListener('shrameco_post_published', handleSilentRefresh);

		const handleWindowClick = () => setActiveDropdownId(null);
		window.addEventListener('click', handleWindowClick);

		return () => {
			window.removeEventListener('shrameco_post_published', handleSilentRefresh);
			window.removeEventListener('click', handleWindowClick);
		};
	}, []);

	const handleDelete = async (id: string) => {
		if (!confirm('Are you sure you want to remove this post?')) return;
		try {
			setDeletingId(id);
			const res = await fetch(`/api/social/schedule?id=${id}`, {
				method: 'DELETE',
			});
			if (res.ok) {
				setPosts((prev) => prev.filter((p) => p._id !== id));
			}
		} catch (err) {
			console.error('Delete post failed:', err);
		} finally {
			setDeletingId(null);
		}
	};

	const handleAction = async (id: string, action: string) => {
		try {
			const res = await fetch('/api/social/schedule', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, action }),
			});
			if (res.ok) {
				fetchQueue(false);
			} else {
				const data = await res.json();
				alert(data.error || `Failed to perform action: ${action}`);
			}
		} catch (err) {
			console.error(`Action ${action} failed:`, err);
		} finally {
			setActiveDropdownId(null);
		}
	};

	const timeAgo = (dateStr: string) => {
		const now = Date.now();
		const created = dateStr ? new Date(dateStr).getTime() : now;
		const diffMs = now - created;
		const diffMins = Math.floor(diffMs / 60000);
		if (diffMins < 1) return 'You created this just now';
		if (diffMins < 60) return `You created this ${diffMins} minutes ago`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `You created this ${diffHours} hours ago`;
		const diffDays = Math.floor(diffHours / 24);
		return `You created this ${diffDays} days ago`;
	};

	const filteredPosts = posts.filter((p) => {
		if (activeTab === 'queue') return p.status === 'queued';
		if (activeTab === 'sent') return p.status === 'sent';
		return p.status === 'draft';
	});

	const queueCount = posts.filter((p) => p.status === 'queued').length;
	const draftCount = posts.filter((p) => p.status === 'draft').length;
	const sentCount = posts.filter((p) => p.status === 'sent').length;

	const groupPostsByDay = () => {
		const groups: Record<string, { date: Date; items: ScheduledItem[] }> = {};
		filteredPosts.forEach((post) => {
			const d = new Date(post.scheduledAt);
			const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });
			if (!groups[dateStr]) {
				groups[dateStr] = { date: d, items: [] };
			}
			groups[dateStr].items.push(post);
		});
		return Object.entries(groups).sort((a, b) => a[1].date.getTime() - b[1].date.getTime());
	};

	const groupedDays = groupPostsByDay();

	return (
		<div className="p-8 max-w-5xl mx-auto min-h-screen text-slate-800 dark:text-zinc-100">
			{/* Top Header */}
			<div className="flex items-center justify-between mb-8">
				<div className="flex items-center space-x-3">
					<div className="w-12 h-12 rounded-xl bg-violet-650 border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-center text-white select-none bg-gradient-to-tr from-violet-600 to-indigo-650">
						<LayoutGrid className="w-5 h-5 text-white" />
					</div>
					<div>
						<div className="flex items-center space-x-2">
							<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">All Channels</h1>
							<Tag className="w-4 h-4 text-slate-400" />
							<Settings className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-655" />
						</div>
						<p className="text-sm font-semibold text-slate-500 flex items-center mt-1">
							<Zap className="w-3.5 h-3.5 mr-1 text-emerald-500" />
							Set a posting goal
						</p>
					</div>
				</div>

				<div className="flex items-center space-x-4">
					<div className="flex items-center space-x-1 border border-slate-200 dark:border-zinc-800 rounded-lg p-1 bg-white dark:bg-zinc-900 shadow-sm">
						<button
							onClick={() => setViewMode('list')}
							className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${
								viewMode === 'list' ? 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
							}`}
						>
							<List className="w-4 h-4" />
							<span>List</span>
						</button>
						<button
							onClick={() => setViewMode('calendar')}
							className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${
								viewMode === 'calendar' ? 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
							}`}
						>
							<CalendarDays className="w-4 h-4" />
							<span>Calendar</span>
						</button>
					</div>
					<Link href="/dashboard/facebook" className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center space-x-1.5 transition-colors shadow-sm shadow-violet-500/10">
						<Plus className="w-4 h-4" />
						<span>New Post</span>
					</Link>
				</div>
			</div>

			{/* Main Content Area */}
			{viewMode === 'calendar' ? (
				<div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden animate-fade-in text-slate-800">
					{/* Calendar Navigation Row */}
					<div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-5">
						<div className="flex items-center space-x-3">
							<button onClick={handlePrevWeek} className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-colors cursor-pointer font-bold text-sm">
								&larr;
							</button>
							<button onClick={handleNextWeek} className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-colors cursor-pointer font-bold text-sm">
								&rarr;
							</button>
							<span className="text-base font-extrabold text-slate-800 px-1 select-none">
								{currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
							</span>
							<button onClick={handleToday} className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer">
								Today
							</button>
						</div>
					</div>

					{/* Weekly Grid */}
					<div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
						<div className="min-w-[980px] grid grid-cols-8 divide-x divide-slate-100">
							{/* Time Label Column Header */}
							<div className="p-4 bg-slate-50/70 border-b border-slate-150 text-xs font-black text-slate-400 text-center select-none">
								Time
							</div>
							{/* Day Headers */}
							{getWeekDays().map((day) => {
								const isToday = new Date().toDateString() === day.toDateString();
								return (
									<div
										key={day.toDateString()}
										className={`p-4 bg-slate-50/70 border-b border-slate-150 text-center flex flex-col items-center justify-center relative ${
											isToday ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-violet-600' : ''
										}`}
									>
										<span className={`text-[10px] uppercase tracking-wider font-extrabold ${isToday ? 'text-violet-600' : 'text-slate-400'}`}>
											{day.toLocaleDateString('en-US', { weekday: 'short' })}
										</span>
										<span className={`text-base font-black mt-0.5 ${isToday ? 'text-violet-600' : 'text-slate-700'}`}>
											{day.getDate()}
										</span>
									</div>
								);
							})}

							{/* Hour Rows */}
							{[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map((hour) => {
								const displayHour = `${hour.toString().padStart(2, '0')}:00`;
								return (
									<React.Fragment key={hour}>
										{/* Time Label */}
										<div className="p-3 border-t border-slate-100 bg-slate-50/20 text-[10px] font-bold text-slate-400 text-center flex items-center justify-center select-none">
											{displayHour}
										</div>
										{/* Days cells */}
										{getWeekDays().map((day) => {
											const cellPosts = posts.filter((post) => {
												const d = new Date(post.scheduledAt);
												if (d.toDateString() !== day.toDateString()) return false;
												const h = d.getHours();
												return h >= hour && h < hour + 2;
											});

											return (
												<div
													key={day.toDateString() + '_' + hour}
													className="p-2.5 border-t border-slate-100 bg-transparent hover:bg-slate-50/40 relative min-h-[140px] flex flex-col gap-2 group/cell transition-colors"
												>
													{cellPosts.map((post) => {
														const postTime = new Date(post.scheduledAt).toLocaleTimeString('en-US', {
															hour: '2-digit',
															minute: '2-digit',
															hour12: false,
														});
														const isVideo = post.platform === 'youtube' || post.format === 'video' || post.format === 'short';
														let titleText = '';
														let descText = post.caption;
														if (isVideo && post.caption.includes('\n\n')) {
															const parts = post.caption.split('\n\n');
															titleText = parts[0] || '';
															descText = parts[1] || '';
														}

														return (
															<div
																key={post._id}
																onClick={() => {
																	if (isVideo) {
																		router.push(`/dashboard/youtube?title=${encodeURIComponent(titleText || post.caption)}&description=${encodeURIComponent(descText)}`);
																	} else {
																		router.push(`/dashboard/create?id=${post._id}`);
																	}
																}}
																className="p-2.5 bg-white border border-slate-200 hover:border-violet-400 hover:shadow-md rounded-xl flex flex-col gap-2 shadow-xs transition-all cursor-pointer active:scale-98 select-none"
																title="Click to edit post"
															>
																{/* Top Row: Time, Platform Icon & Status */}
																<div className="flex items-center justify-between gap-1.5">
																	<div className="flex items-center space-x-1">
																		<div className="w-4 h-4 rounded bg-red-650 flex items-center justify-center text-white flex-shrink-0">
																			<Youtube className="w-2.5 h-2.5" />
																		</div>
																		<span className="text-[9px] font-black text-slate-500">{postTime}</span>
																	</div>
																	<span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
																		post.status === 'sent' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' : 'bg-amber-50 text-amber-600 border border-amber-200/50'
																	}`}>
																		{post.status}
																	</span>
																</div>

																{/* Middle Row: Content & Media Preview */}
																<div className="flex items-start gap-2 justify-between">
																	<div className="flex-1 min-w-0">
																		<p className="text-[10px] font-bold text-slate-800 line-clamp-2 leading-snug">
																			{titleText || post.caption}
																		</p>
																		<p className="text-[9px] font-semibold text-slate-450 line-clamp-1 mt-0.5">
																			{descText}
																		</p>
																	</div>

																	{post.imageUrl && (
																		<div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-155 bg-slate-50 flex-shrink-0 relative flex items-center justify-center">
																			{isVideo || post.imageUrl.startsWith('data:video/') || post.imageUrl.endsWith('.mp4') || post.imageUrl.endsWith('.mov') || post.imageUrl.endsWith('.webm') ? (
																				<>
																					<video src={post.imageUrl} className="w-full h-full object-cover" muted />
																					<span className="absolute text-[8px] text-white/95 drop-shadow-md select-none">▶</span>
																				</>
																			) : post.imageUrl === '/pdf-thumbnail-placeholder.png' ? (
																				<div className="w-full h-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-blue-500" title="PDF Carousel Document">
																					<FileText className="w-4 h-4" />
																				</div>
																			) : (
																				<img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
																			)}
																		</div>
																	)}
																</div>
															</div>
														);
													})}

													{/* Hover Add Slot Button */}
													<button
														onClick={() => {
															const dateParam = day.toISOString().split('T')[0];
															const timeParam = `${String(hour).padStart(2, '0')}:00`;
															router.push(`/dashboard/create?date=${dateParam}&time=${timeParam}`);
														}}
														className="absolute right-2.5 bottom-2.5 w-6.5 h-6.5 rounded-full bg-violet-600 hover:bg-violet-750 text-white flex items-center justify-center shadow-md font-black text-xs opacity-0 group-hover/cell:opacity-100 transition-all duration-150 cursor-pointer active:scale-90"
														title="Add post in this slot"
													>
														+
													</button>
												</div>
											);
										})}
									</React.Fragment>
								);
							})}
						</div>
					</div>
				</div>
			) : (
				<>
					{/* Tabs & Filters */}
					<div className="flex items-center justify-between border-b border-slate-200 mb-8 pb-3">
						<div className="flex items-center space-x-6">
							<button
								onClick={() => setActiveTab('queue')}
								className={`text-sm pb-3 -mb-[14px] transition-all border-b-2 font-bold cursor-pointer ${
									activeTab === 'queue' ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-700'
								}`}
							>
								Queue <span className="ml-1.5 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{loading ? '...' : queueCount}</span>
							</button>
							<button
								onClick={() => setActiveTab('drafts')}
								className={`text-sm pb-3 -mb-[14px] transition-all border-b-2 font-bold cursor-pointer ${
									activeTab === 'drafts' ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-700'
								}`}
							>
								Drafts <span className="ml-1.5 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{loading ? '...' : draftCount}</span>
							</button>
							<button
								onClick={() => setActiveTab('sent')}
								className={`text-sm pb-3 -mb-[14px] transition-all border-b-2 font-bold cursor-pointer ${
									activeTab === 'sent' ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-700'
								}`}
							>
								Sent <span className="ml-1.5 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{loading ? '...' : sentCount}</span>
							</button>
						</div>
						<div className="flex items-center space-x-4 text-sm font-semibold text-slate-700">
							<button className="flex items-center space-x-1.5 hover:text-slate-900 transition-colors">
								<Tag className="w-4 h-4" />
								<span>Tags</span>
							</button>
							<button className="flex items-center space-x-1.5 hover:text-slate-900 transition-colors">
								<Globe className="w-4 h-4" />
								<span>Kolkata</span>
							</button>
						</div>
					</div>

					{/* Timeline */}
					<div className="space-y-12 pb-24">
						{loading ? (
							<div className="space-y-5">
								{[...Array(3)].map((_, i) => (
									<div key={i} className="flex items-start gap-4 animate-pulse">
										<div className="w-24 flex-shrink-0 mt-2 space-y-1.5">
											<div className="h-4 w-16 bg-slate-200 rounded" />
											<div className="h-3 w-20 bg-slate-100 rounded" />
										</div>
										<div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
											<div className="flex items-center space-x-3">
												<div className="w-9 h-9 rounded-full bg-slate-200" />
												<div className="h-3 w-28 bg-slate-200 rounded" />
											</div>
											<div className="flex items-start justify-between gap-4">
												<div className="flex-1 space-y-2">
													<div className="h-3 w-48 bg-slate-200 rounded" />
													<div className="h-3 w-full bg-slate-100 rounded" />
												</div>
												<div className="w-36 h-20 bg-slate-100 rounded-xl flex-shrink-0" />
											</div>
										</div>
									</div>
								))}
							</div>
						) : filteredPosts.length === 0 ? (
							<div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
								<div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-650 border border-violet-100 mb-4">
									<Sparkles className="w-8 h-8" />
								</div>
								<h3 className="font-extrabold text-slate-800 text-lg">No posts in this queue</h3>
								<p className="text-slate-400 text-xs mt-1 max-w-xs font-semibold">Your schedule is empty. Generate content with AI to fill your pipeline.</p>
								<Link href="/dashboard/facebook" className="mt-5 inline-flex items-center space-x-2 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md">
									<Plus className="w-4 h-4" />
									<span>Compose Post</span>
								</Link>
							</div>
						) : (
							groupedDays.map(([dayLabel, dayGroup]) => {
								return (
									<div key={dayLabel}>
										<h2 className="text-sm font-extrabold text-slate-900 mb-6 flex items-center select-none">
											<Clock className="w-4 h-4 text-slate-400 mr-2" />
											<span>{dayLabel}</span>
										</h2>
										<div className="space-y-5">
											{dayGroup.items.map((post) => {
												const postTime = new Date(post.scheduledAt).toLocaleTimeString('en-US', {
													hour: '2-digit',
													minute: '2-digit',
													hour12: false,
												});
												const Meta = PLATFORM_META[post.platform];
												const PlatformIcon = Meta?.icon || Globe;

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
													<div key={post._id} className="flex items-start group gap-4">
														{/* Left Time */}
														<div className="w-24 text-left mt-2 flex-shrink-0 select-none">
															<div className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">{postTime}</div>
															<div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-1">
																<Pin className="w-3 h-3 text-slate-400 rotate-45 flex-shrink-0" />
																<span>{getPublishOptionLabel(post.publishOption)}</span>
															</div>
														</div>

														{/* Card Body Container */}
														<div className="flex-1 flex flex-col gap-0">
															<div className={`bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-xs flex gap-5 hover:shadow-md transition-shadow relative overflow-hidden ${
																activeTab === 'sent' ? 'rounded-t-2xl border-b-0' : 'rounded-2xl'
															}`}>
																{/* Profile Avatar */}
																<div className="relative w-9 h-9 flex-shrink-0">
																	<div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-750 flex items-center justify-center text-slate-450 dark:text-zinc-400 select-none">
																		{post.accountName ? post.accountName.slice(0, 2).toUpperCase() : 'YT'}
																	</div>
																	<div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 flex items-center justify-center shadow-xs">
																		<PlatformIcon className="w-2.5 h-2.5" style={{ color: Meta?.accent }} />
																	</div>
																</div>

																{/* Details */}
																<div className="flex-1 min-w-0">
																	{titleText && (
																		<h4 className="text-xs font-black text-slate-900 dark:text-zinc-100 line-clamp-1 mb-1">{titleText}</h4>
																	)}
																	<p className="text-xs font-semibold text-slate-650 dark:text-zinc-350 line-clamp-3 leading-relaxed whitespace-pre-wrap">
																		{descText}
																	</p>
																	{tagsText && (
																		<p className="text-[10px] font-bold text-indigo-500 mt-2">{tagsText}</p>
																	)}

																	{/* Image/Video Preview */}
																	{post.imageUrl && (
																		<div className="mt-3.5 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 max-w-sm aspect-video relative flex items-center justify-center">
																			{isVideo || post.imageUrl.startsWith('data:video/') || post.imageUrl.endsWith('.mp4') || post.imageUrl.endsWith('.mov') || post.imageUrl.endsWith('.webm') ? (
																				<>
																					<video src={post.imageUrl} className="w-full h-full object-cover" muted />
																					<div className="absolute inset-0 bg-black/10 flex items-center justify-center">
																						<div className="w-9 h-9 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center shadow-md">
																							<span className="text-slate-800 dark:text-zinc-200 text-xs pl-0.5 select-none">▶</span>
																						</div>
																					</div>
																				</>
																			) : post.imageUrl === '/pdf-thumbnail-placeholder.png' ? (
																				<div className="w-full h-full bg-slate-100 dark:bg-zinc-900 flex flex-col items-center justify-center p-6 text-center rounded-xl space-y-1.5">
																					<FileText className="w-10 h-10 text-blue-500" />
																					<span className="text-xs font-bold text-slate-800 dark:text-zinc-200">PDF Carousel Document</span>
																					{post.documentName && <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate max-w-xs">{post.documentName}</span>}
																				</div>
																			) : (
																				<img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
																			)}
																		</div>
																	)}
																</div>

																{/* Actions Column */}
																<div className="flex items-center space-x-2 flex-shrink-0 self-start">
																	{activeTab === 'queue' && (
																		<button
																			onClick={() => handleAction(post._id, 'publish_now')}
																			className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 border border-violet-100 flex items-center space-x-1"
																		>
																			<Send className="w-3.5 h-3.5" />
																			<span>Publish Now</span>
																		</button>
																	)}

																	{activeTab !== 'sent' && (
																		<button
																			onClick={() => {
																				if (isVideo) {
																					router.push(`/dashboard/youtube?title=${encodeURIComponent(titleText || post.caption)}&description=${encodeURIComponent(descText)}`);
																				} else {
																					router.push(`/dashboard/create?id=${post._id}`);
																				}
																			}}
																			className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-850 border border-slate-200 dark:border-zinc-700 hover:border-slate-350 dark:hover:border-zinc-650 text-slate-500 dark:text-zinc-400 hover:text-slate-750 dark:hover:text-zinc-200 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center shadow-xs"
																			title="Edit Post"
																		>
																			<Edit2 className="w-3.5 h-3.5" />
																		</button>
																	)}

																	{/* Three-dots Menu */}
																	<div className="relative">
																		<button
																			onClick={(e) => {
																				e.stopPropagation();
																				setActiveDropdownId(activeDropdownId === post._id ? null : post._id);
																			}}
																			className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-850 border border-slate-200 dark:border-zinc-700 hover:border-slate-350 dark:hover:border-zinc-650 text-slate-500 dark:text-zinc-400 hover:text-slate-750 dark:hover:text-zinc-200 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center shadow-xs"
																		>
																			<MoreVertical className="w-3.5 h-3.5" />
																		</button>

																		{activeDropdownId === post._id && (
																			<div
																				onClick={(e) => e.stopPropagation()}
																				className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-zinc-950 border border-slate-205 dark:border-zinc-800 rounded-xl shadow-xl py-1.5 z-20 text-xs font-bold text-slate-700 dark:text-zinc-250 animate-fade-in"
																			>
																				<button
																					onClick={() => handleAction(post._id, 'move_to_drafts')}
																					className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-55 dark:hover:bg-zinc-800 text-left transition-colors font-bold text-slate-700 dark:text-zinc-300"
																				>
																					<FileText className="w-3.5 h-3.5 text-slate-400" />
																					<span>Move to Drafts</span>
																				</button>
																				<button
																					onClick={() => handleAction(post._id, 'duplicate')}
																					className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-55 dark:hover:bg-zinc-800 text-left transition-colors font-bold text-slate-700 dark:text-zinc-300"
																				>
																					<Copy className="w-3.5 h-3.5 text-slate-400" />
																					<span>Duplicate</span>
																				</button>
																				<button
																					onClick={() => {
																						const isSimulated = !post.postUrl || post.postUrl.includes('community_post');
																						const link = isSimulated
																							? `${window.location.origin}/feed-preview?platform=${post.platform}&caption=${encodeURIComponent(post.caption.slice(0, 100))}`
																							: (post.postUrl || '');
																						navigator.clipboard.writeText(link);
																						alert('Link copied to clipboard!');
																						setActiveDropdownId(null);
																					}}
																					className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-55 dark:hover:bg-zinc-800 text-left transition-colors font-bold text-slate-700 dark:text-zinc-300"
																				>
																					<Copy className="w-3.5 h-3.5 text-slate-400" />
																					<span>Copy Link</span>
																				</button>
																				<div className="border-t border-slate-100 dark:border-zinc-800 my-1" />
																				<button
																					onClick={() => {
																						handleDelete(post._id);
																						setActiveDropdownId(null);
																					}}
																					className="w-full flex items-center space-x-2.5 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-left text-red-500 dark:text-red-400 transition-colors font-bold"
																				>
																					<Trash2 className="w-3.5 h-3.5 text-slate-450" />
																					<span>Delete</span>
																				</button>
																			</div>
																		)}
																	</div>
																</div>
															</div>

															{/* Sent tab stats below card */}
															{activeTab === 'sent' && (
																<div className="flex-1 flex flex-col gap-0 -mt-2">
																	<div className="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 border-t-0 rounded-b-2xl px-5 py-3">
																		<div className="flex items-center gap-6 mb-3">
																			<div className="flex flex-col">
																				<span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
																					<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
																					Reactions
																				</span>
																				<span className="text-sm font-extrabold text-slate-800 dark:text-zinc-100">{post.youtubeStats?.likes ?? 0}</span>
																			</div>
																			<div className="flex flex-col">
																				<span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
																					<MessageSquare className="w-3 h-3" />
																					Comments
																				</span>
																				<span className="text-sm font-extrabold text-slate-800 dark:text-zinc-100">{post.youtubeStats?.comments ?? 0}</span>
																			</div>
																			<div className="flex flex-col">
																				<span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
																					<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
																					Eng. Rate
																				</span>
																				<span className="text-sm font-extrabold text-slate-800 dark:text-zinc-100">
																					{post.youtubeStats?.views
																						? `${(((post.youtubeStats?.likes || 0) + (post.youtubeStats?.comments || 0)) / post.youtubeStats.views * 100).toFixed(1)}%`
																						: '–'}
																				</span>
																			</div>
																			<div className="flex flex-col">
																				<span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
																					<ExternalLink className="w-3 h-3" />
																					Views
																				</span>
																				<span className="text-sm font-extrabold text-slate-800 dark:text-zinc-100">{post.youtubeStats?.views ?? 0}</span>
																			</div>
																		</div>
																		<div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-3">
																			<span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 select-none">
																				Published via
																				<PlatformIcon className="w-3.5 h-3.5 inline" style={{ color: Meta?.accent }} />
																				{Meta?.label || post.platform}
																			</span>
																			<div className="flex items-center gap-2">
																				{(() => {
																					const isSimulated = !post.postUrl || post.postUrl.includes('community_post');
																					const targetUrl = isSimulated
																						? `/feed-preview?platform=${post.platform}&caption=${encodeURIComponent(post.caption.slice(0, 100))}`
																						: post.postUrl;
																					return targetUrl ? (
																						<a
																							href={targetUrl}
																							target="_blank"
																							rel="noopener noreferrer"
																							className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-zinc-200 transition-all cursor-pointer"
																						>
																							<ExternalLink className="w-3.5 h-3.5" />
																							<span>Go to post</span>
																						</a>
																					) : (
																						<span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold select-none">No link yet</span>
																					);
																				})()}
																				<div className="relative">
																					<button
																						onClick={(e) => {
																							e.stopPropagation();
																							setActiveDropdownId(activeDropdownId === `stats_${post._id}` ? null : `stats_${post._id}`);
																						}}
																						className="p-1.5 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl text-slate-400 dark:text-zinc-500 transition-all flex items-center justify-center cursor-pointer"
																					>
																						<MoreVertical className="w-3.5 h-3.5" />
																					</button>
																					
																					{activeDropdownId === `stats_${post._id}` && (
																						<div
																							onClick={(e) => e.stopPropagation()}
																							className="absolute bottom-full right-0 mb-2 w-40 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl py-1.5 z-20 text-xs font-bold text-slate-700 dark:text-zinc-250 animate-fade-in"
																						>
																							<button
																								onClick={() => {
																									const isSimulated = !post.postUrl || post.postUrl.includes('community_post');
																									const link = isSimulated
																										? `${window.location.origin}/feed-preview?platform=${post.platform}&caption=${encodeURIComponent(post.caption.slice(0, 100))}`
																										: (post.postUrl || '');
																									navigator.clipboard.writeText(link);
																									alert('Link copied to clipboard!');
																									setActiveDropdownId(null);
																								}}
																								className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-55 dark:hover:bg-zinc-800 text-left transition-colors font-bold text-slate-700 dark:text-zinc-300"
																							>
																								<Copy className="w-3.5 h-3.5 text-slate-400" />
																								<span>Copy Link</span>
																							</button>
																							<button
																								onClick={() => {
																									handleDelete(post._id);
																									setActiveDropdownId(null);
																								}}
																								className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-left text-red-500 dark:text-red-400 transition-colors font-bold"
																							>
																								<Trash2 className="w-3.5 h-3.5 text-slate-400" />
																								<span>Delete</span>
																							</button>
																						</div>
																					)}
																				</div>
																			</div>
																		</div>
																	</div>
																</div>
															)}
														</div>

														{/* External message bubble */}
														<button className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-slate-650 dark:hover:text-zinc-350 transition-all flex items-center justify-center flex-shrink-0 active:scale-95 shadow-xs">
															<MessageSquare className="w-4 h-4" />
														</button>
													</div>
												);
											})}

											{/* Available scheduling slots */}
											{activeTab === 'queue' && SLOT_HOURS.map((slot) => {
												const slotHour = slot.hour;
												const isBooked = dayGroup.items.some((item) => {
													const itemHour = new Date(item.scheduledAt).getHours();
													return itemHour === slotHour;
												});

												if (isBooked) return null;

												return (
													<div key={slot.label} className="flex items-center group select-none">
														<div className="w-24 text-xs font-bold text-slate-400">{slot.label}</div>
														<Link
															href="/dashboard/create"
															className="flex-1 bg-white dark:bg-zinc-900 border border-dashed border-slate-205 hover:border-slate-350 rounded-2xl h-14 flex items-center px-4 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-zinc-800/40"
														>
															<div className="flex items-center space-x-2 text-slate-400 group-hover:text-slate-600 font-extrabold text-xs">
																<Plus className="w-4 h-4" />
																<span>New Slot</span>
															</div>
														</Link>
													</div>
												);
											})}
										</div>
									</div>
								);
							})
						)}
					</div>
				</>
			)}
		</div>
	);
}
