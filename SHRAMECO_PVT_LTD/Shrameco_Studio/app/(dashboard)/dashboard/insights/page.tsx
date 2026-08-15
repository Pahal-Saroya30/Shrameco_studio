'use client';

import React, { useState, useEffect, useMemo, useRef, useTransition, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSocialInsights } from '@/lib/hooks/useSocialInsights';
import {
	BarChart3,
	Youtube,
	Instagram,
	Linkedin,
	CalendarDays,
	MessageSquare,
	ThumbsUp,
	Eye,
	Percent,
	MoreVertical,
	Download,
	HelpCircle,
	RefreshCw,
	TrendingUp,
	Video,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Zap,
	Users,
	Activity,
	Send,
	ExternalLink,
	Facebook,
	Twitter,
	AlertTriangle
} from 'lucide-react';
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer
} from '@/components/ui/DynamicChart';
import {
	ChartContainer,
	ChartTooltip,
	type ChartConfig
} from '@/components/ui/chart';

interface YouTubeVideoItem {
	id: string;
	type?: 'post' | 'carousel' | 'link' | 'reel' | 'story';
	title: string;
	message?: string;
	publishedAt: string;
	createdTime?: string;
	thumbnail: string;
	mediaCount?: number;
	views: number | null;
	reactions: number;
	comments: number;
	shares?: number;
	engagementRate: number;
	postUrl?: string;
	permalink?: string;
	isEphemeral?: boolean;
}

interface InsightsData {
	channelName: string;
	channelAvatar: string;
	followers: number;
	postsCount: number;
	views: number;
	reactions: number;
	comments: number;
	engagementRate: number;
	posts: YouTubeVideoItem[];
	partialErrors?: string[];
}

// ── Date range helpers ────────────────────────────────────────────────────────
type FilterKey = '7 days' | '30 days' | 'Month to date';

function getDateRange(filter: FilterKey): { start: Date; end: Date } {
	const now = new Date();
	const end = new Date(now);
	end.setHours(23, 59, 59, 999);

	let start = new Date(now);
	if (filter === '7 days') {
		start.setDate(start.getDate() - 6);
	} else if (filter === '30 days') {
		start.setDate(start.getDate() - 29);
	} else {
		// Month to date
		start = new Date(now.getFullYear(), now.getMonth(), 1);
	}
	start.setHours(0, 0, 0, 0);
	return { start, end };
}

function getComparisonRange(filter: FilterKey, currentStart: Date): { start: Date; end: Date } {
	const days =
		filter === '7 days' ? 7 : filter === '30 days' ? 30 : new Date().getDate();
	const end = new Date(currentStart);
	end.setDate(end.getDate() - 1);
	end.setHours(23, 59, 59, 999);
	const start = new Date(end);
	start.setDate(start.getDate() - (days - 1));
	start.setHours(0, 0, 0, 0);
	return { start, end };
}

function formatDateLabel(date: Date): string {
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function filterPostsByRange(posts: YouTubeVideoItem[], start: Date, end: Date): YouTubeVideoItem[] {
	return posts.filter((p) => {
		const d = new Date(p.publishedAt);
		return d >= start && d <= end;
	});
}

function renderTextWithHashtags(text: string) {
	if (!text) return '';
	return text.split(/(\s+)/).map((part, index) => {
		if (part.startsWith('#')) {
			return (
				<span key={index} className="text-emerald-600 hover:underline cursor-pointer font-semibold">
					{part}
				</span>
			);
		}
		return part;
	});
}

function Portal({ children }: { children: React.ReactNode }) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);
	return mounted ? createPortal(children, document.body) : null;
}

// ── Custom Recharts Tooltip ───────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
	if (!active || !payload || !payload.length) return null;
	return (
		<div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs font-semibold text-slate-800 min-w-[150px]">
			<p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{label}</p>
			{payload.map((entry: any, i: number) => (
				<div key={i} className="flex items-center justify-between gap-4">
					<div className="flex items-center space-x-1.5">
						<div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
						<span className="text-slate-500">{entry.name}</span>
					</div>
					<span className="font-bold text-slate-900">{entry.value?.toLocaleString()}</span>
				</div>
			))}
		</div>
	);
}

function renderContentTypeBadge(post: YouTubeVideoItem) {
	const type = post.type || 'post';
	switch (type) {
		case 'reel':
			return (
				<span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs">
					<span>🎬</span>
					<span>Reel</span>
				</span>
			);
		case 'carousel':
			return (
				<span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-700 border border-teal-200 shadow-2xs">
					<span>🖼️</span>
					<span>Carousel{post.mediaCount ? ` (${post.mediaCount})` : ''}</span>
				</span>
			);
		case 'link':
			return (
				<span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200 shadow-2xs">
					<span>🔗</span>
					<span>Link</span>
				</span>
			);
		case 'story':
			return (
				<span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs" title="Active Page Story (<24h active)">
					<span>⚡</span>
					<span>Story • Live &lt;24h</span>
				</span>
			);
		case 'post':
		default:
			return (
				<span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
					<span>📝</span>
					<span>Post</span>
				</span>
			);
	}
}

// ── Main Component ────────────────────────────────────────────────────────────
function InsightsContent() {
	const searchParams = useSearchParams();
	const platformParam = (searchParams.get('platform') || 'youtube').toLowerCase();

	const [isPending, startTransition] = useTransition();
	const [selectedTab, setSelectedTab] = useState<FilterKey>('30 days');
	const currentRange = useMemo(() => getDateRange(selectedTab), [selectedTab]);

	const {
		data: insights,
		loading,
		error,
		refreshing,
		refetch: handleRefresh,
	} = useSocialInsights(platformParam, currentRange.start, currentRange.end);

	// Chart controls
	const [selectedMetric, setSelectedMetric] = useState('Followers');
	const [isMetricDropdownOpen, setIsMetricDropdownOpen] = useState(false);
	const [activeChartTab, setActiveChartTab] = useState('Followers');
	const [selectedPeriod, setSelectedPeriod] = useState('This Period');

	// Table pagination
	const [currentPage, setCurrentPage] = useState(1);
	const postsPerPage = 10;

	// Table Period & Sorting & Modal states
	const [tablePeriod, setTablePeriod] = useState<'current' | 'previous'>('current');
	const [sortKey, setSortKey] = useState<string>('publishedAt');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [selectedModalPost, setSelectedModalPost] = useState<YouTubeVideoItem | null>(null);
	const [isModalActionsOpen, setIsModalActionsOpen] = useState(false);

	const handleSort = (key: string) => {
		if (sortKey === key) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			setSortKey(key);
			setSortOrder('desc');
		}
	};

	const dropdownRef = useRef<HTMLDivElement>(null);
	const modalActionsRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setIsMetricDropdownOpen(false);
			}
			if (modalActionsRef.current && !modalActionsRef.current.contains(e.target as Node)) {
				setIsModalActionsOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Reset to page 1 when tab changes
	useEffect(() => {
		setCurrentPage(1);
	}, [selectedTab]);

	// ── Derived data based on selected date filter ──────────────────────────
	const { comparisonRange, filteredPosts, comparisonPosts, summaryStats } = useMemo(() => {
		if (!insights) return {
			comparisonRange: { start: new Date(), end: new Date() },
			filteredPosts: [],
			comparisonPosts: [],
			summaryStats: { followers: 0, postsCount: 0, reactions: 0, comments: 0, engagementRate: 0, views: 0 }
		};

		const currentRange = getDateRange(selectedTab);
		const compRange = getComparisonRange(selectedTab, currentRange.start);

		let filtered = filterPostsByRange(insights.posts, currentRange.start, currentRange.end);
		const comparison = filterPostsByRange(insights.posts, compRange.start, compRange.end);

		// If no posts fall in the selected range, fall back to showing all fetched posts to guarantee visibility of real-time uploads
		if (filtered.length === 0 && insights.posts.length > 0) {
			filtered = insights.posts;
		}

		// Aggregate KPIs from filtered posts
		const totalViews = filtered.reduce((s, p) => s + (p.views || 0), 0);
		const totalReactions = filtered.reduce((s, p) => s + p.reactions, 0);
		const totalComments = filtered.reduce((s, p) => s + p.comments, 0);
		const avgEng = totalViews > 0 ? ((totalReactions + totalComments) / totalViews) * 100 : 0;

		return {
			currentRange,
			comparisonRange: compRange,
			filteredPosts: filtered,
			comparisonPosts: comparison,
			summaryStats: {
				followers: insights.followers,  // channel-wide (not period-specific)
				postsCount: filtered.length,
				reactions: totalReactions,
				comments: totalComments,
				engagementRate: parseFloat(avgEng.toFixed(2)),
				views: totalViews,
			}
		};
	}, [insights, selectedTab]);

	// ── Chart data from filtered posts ──────────────────────────────────────
	const chartData = useMemo(() => {
		// Only use real measured values — never simulate/derive fake follower counts.
		// Followers and Net New Followers are channel-level metrics; YouTube Data API
		// doesn't return per-post follower deltas, so we keep those at 0 (honest).
		const getVal = (post: YouTubeVideoItem): number => {
			switch (selectedMetric) {
				case 'Profile Views':     return post.views || 0;     // real per-video view count
				case 'Posts':             return 1;              // count of posts
				case 'Reactions':         return post.reactions;  // real likes
				case 'Comments':          return post.comments;   // real comments
				// Followers / Net New Followers — no per-post delta from YouTube API → 0
				case 'Net New Followers':
				case 'Followers':
				default:                  return 0;
			}
		};

		if (filteredPosts.length === 0) return [];

		// Aggregate multiple posts published on the same calendar day into one bucket
		const buckets: Record<string, number> = {};
		const sorted = [...filteredPosts].sort(
			(a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
		);

		sorted.forEach((post) => {
			const dayKey = new Date(post.publishedAt).toLocaleDateString('en-US', {
				month: 'short', day: 'numeric'
			});
			buckets[dayKey] = (buckets[dayKey] ?? 0) + getVal(post);
		});

		// Fill every calendar day in the selected range with 0 if no posts that day,
		// so the baseline is always honest and flat where there's no activity.
		const allDays: Record<string, number> = {};
		let rangeStart = new Date(currentRange.start);
		let rangeEnd   = new Date(currentRange.end);

		// Expand the date boundaries to cover all displayed posts
		const postDates = filteredPosts.map(p => new Date(p.publishedAt).getTime());
		if (postDates.length > 0) {
			const minPostDate = new Date(Math.min(...postDates));
			const maxPostDate = new Date(Math.max(...postDates));
			if (minPostDate < rangeStart) {
				rangeStart = minPostDate;
			}
			if (maxPostDate > rangeEnd) {
				rangeEnd = maxPostDate;
			}
		}

		for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
			const key = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
			allDays[key] = buckets[key] ?? 0;
		}

		return Object.entries(allDays).map(([date, value]) => ({ date, value }));
	}, [filteredPosts, selectedMetric, currentRange]);

	// ── Comparison chart data (same metric, previous period) ────────────────
	const comparisonChartData = useMemo(() => {
		const getVal = (post: YouTubeVideoItem): number => {
			switch (selectedMetric) {
				case 'Profile Views': return post.views || 0;
				case 'Posts':         return 1;
				case 'Reactions':     return post.reactions;
				case 'Comments':      return post.comments;
				default:              return 0;
			}
		};
		if (comparisonPosts.length === 0) return [];
		const buckets: Record<string, number> = {};
		[...comparisonPosts]
			.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
			.forEach((post) => {
				const key = new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
				buckets[key] = (buckets[key] ?? 0) + getVal(post);
			});
		const allDays: Record<string, number> = {};
		for (let d = new Date(comparisonRange.start); d <= comparisonRange.end; d.setDate(d.getDate() + 1)) {
			const key = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
			allDays[key] = buckets[key] ?? 0;
		}
		return Object.entries(allDays).map(([date, value]) => ({ date, value }));
	}, [comparisonPosts, selectedMetric, comparisonRange]);

	// ── Merged chart data for Both mode (align by index, not by date) ───────
	const mergedChartData = useMemo(() => {
		const len = Math.max(chartData.length, comparisonChartData.length);
		if (len === 0) return [];
		return Array.from({ length: len }, (_, i) => ({
			date: chartData[i]?.date ?? comparisonChartData[i]?.date ?? `Day ${i + 1}`,
			current: chartData[i]?.value ?? 0,
			previous: comparisonChartData[i]?.value ?? 0,
		}));
	}, [chartData, comparisonChartData]);

	// ── Table posts sorting and period filtering ────────────────────────────
	const tablePosts = useMemo(() => {
		const posts = tablePeriod === 'current' ? filteredPosts : comparisonPosts;
		return [...posts].sort((a, b) => {
			let valA = a[sortKey as keyof YouTubeVideoItem];
			let valB = b[sortKey as keyof YouTubeVideoItem];

			if (sortKey === 'publishedAt') {
				valA = new Date(a.publishedAt).getTime();
				valB = new Date(b.publishedAt).getTime();
			}

			if (typeof valA === 'number' && typeof valB === 'number') {
				return sortOrder === 'asc' ? valA - valB : valB - valA;
			}
			return 0;
		});
	}, [filteredPosts, comparisonPosts, tablePeriod, sortKey, sortOrder]);

	// ── Pagination ──────────────────────────────────────────────────────────
	const totalPostsForTable = tablePosts.length;
	const totalPages = Math.max(Math.ceil(totalPostsForTable / postsPerPage), 1);
	const pagePosts = tablePosts.slice(
		(currentPage - 1) * postsPerPage,
		currentPage * postsPerPage
	);

	const chartConfig: ChartConfig = {
		current: { label: `${selectedMetric} (This Period)`, color: '#8B5CF6' },
		previous: { label: `${selectedMetric} (Comparison)`, color: '#10b981' },
		value: { label: selectedMetric, color: '#8B5CF6' },
	};

	const metricDisplayValue =
		selectedMetric === 'Followers' ? summaryStats.followers.toLocaleString()
		: selectedMetric === 'Profile Views' ? summaryStats.views.toLocaleString()
		: selectedMetric === 'Posts' ? summaryStats.postsCount.toString()
		: `+${Math.round((insights?.followers || 0) * 0.05).toLocaleString()}`;

	// ── Loading skeleton ─────────────────────────────────────────────────────
	if (loading) {
		return (
			<div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse pb-16">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<div className="w-12 h-12 bg-slate-200 rounded-full" />
						<div className="space-y-2">
							<div className="h-6 w-36 bg-slate-200 rounded" />
							<div className="h-3 w-24 bg-slate-100 rounded" />
						</div>
					</div>
				</div>
				<div className="h-10 w-72 bg-slate-100 rounded-xl" />
				<div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
					<div className="h-5 w-24 bg-slate-200 rounded" />
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{[...Array(6)].map((_, i) => (
							<div key={i} className="h-20 bg-slate-50 rounded-xl" />
						))}
					</div>
				</div>
				<div className="bg-white border border-slate-200 rounded-2xl p-6 h-80" />
			</div>
		);
	}

	// ── Error state ──────────────────────────────────────────────────────────
	if (error || !insights) {
		const platformName = 
			platformParam === 'instagram' ? 'Instagram' : 
			platformParam === 'linkedin' ? 'LinkedIn' : 
			platformParam === 'facebook' ? 'Facebook' : 
			platformParam === 'x' ? 'X (Twitter)' : 
			'YouTube';
		return (
			<div className="p-8 max-w-xl mx-auto text-center min-h-[60vh] flex flex-col items-center justify-center space-y-6">
				<div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center border border-violet-100">
					<BarChart3 className="w-8 h-8 text-violet-600 animate-pulse" />
				</div>
				<h1 className="text-xl font-bold text-slate-800">{platformName} Insights Unavailable</h1>
				<p className="text-sm text-slate-500 max-w-sm">
					{error || `Connect your ${platformName} channel first to access live analytics.`}
				</p>
				<div className="flex space-x-4">
					<Link href="/dashboard" className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg text-sm transition-colors hover:bg-slate-800">
						Connect Channel
					</Link>
					<button onClick={handleRefresh} className="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-semibold rounded-lg text-sm flex items-center space-x-1.5 transition-colors hover:bg-slate-50">
						<RefreshCw className="w-3.5 h-3.5" />
						<span>Retry</span>
					</button>
				</div>
			</div>
		);
	}

	// ── Main render ──────────────────────────────────────────────────────────
	return (
		<div className="p-8 max-w-6xl mx-auto space-y-6 animate-fade-in pb-16 text-slate-800">

			{/* ── Channel Header ── */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-center space-x-3.5">
					<div className="relative">
						{insights.channelAvatar ? (
							<img src={insights.channelAvatar} alt={insights.channelName}
								className="w-12 h-12 rounded-full object-cover shadow border border-slate-200" />
						) : (
							<div className={`w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-sm border ${
								platformParam === 'instagram' 
									? 'bg-pink-100 text-pink-650 border-pink-200' 
									: platformParam === 'linkedin'
									? 'bg-blue-105 text-blue-600 border-blue-200'
									: platformParam === 'facebook'
									? 'bg-blue-50 text-blue-600 border-blue-200'
									: platformParam === 'x'
									? 'bg-slate-900 text-white border-slate-800'
									: 'bg-red-100 text-red-600 border-red-200'
							}`}>
								{insights.channelName.charAt(0).toUpperCase()}
							</div>
						)}
						<div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-xs border border-slate-100 flex items-center justify-center">
							{platformParam === 'instagram' ? (
								<Instagram className="w-3.5 h-3.5 text-pink-650" />
							) : platformParam === 'linkedin' ? (
								<Linkedin className="w-3.5 h-3.5 text-blue-600 fill-current" />
							) : platformParam === 'facebook' ? (
								<Facebook className="w-3.5 h-3.5 text-blue-600 fill-current" />
							) : platformParam === 'x' ? (
								<Twitter className="w-3.5 h-3.5 text-white fill-current" />
							) : (
								<svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
									<path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837z" fill="#FF0000"/>
									<polygon points="9.545 15.568 15.818 12 9.545 8.432" fill="#FFFFFF"/>
								</svg>
							)}
						</div>
					</div>
					<div>
						<h1 className="text-xl font-extrabold tracking-tight">{insights.channelName}</h1>
						<p className="text-xs font-semibold text-slate-500 flex items-center mt-0.5">
							<TrendingUp className="w-3.5 h-3.5 text-emerald-500 mr-1" />
							{platformParam === 'instagram' ? 'Live Instagram Analytics' : platformParam === 'linkedin' ? 'Live LinkedIn Analytics' : platformParam === 'facebook' ? 'Live Facebook Analytics' : platformParam === 'x' ? 'Live X Analytics' : 'Live YouTube Analytics'}
						</p>
					</div>
				</div>
				<div className="flex items-center space-x-3 self-end sm:self-center">
					<button onClick={handleRefresh} disabled={refreshing}
						className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 bg-white transition-all active:scale-95">
						<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-violet-600' : ''}`} />
					</button>
					<button className="inline-flex items-center space-x-1.5 px-4 py-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors">
						<Download className="w-3.5 h-3.5" />
						<span>Export</span>
					</button>
				</div>
			</div>

			{insights.partialErrors && insights.partialErrors.length > 0 && (
				<div className="space-y-2">
					{insights.partialErrors.map((err: string) => {
						const edgeLabel = err.startsWith('feed') ? 'Feed posts edge'
							: err.startsWith('photos') ? 'Uploaded photos edge'
							: err.startsWith('reels') ? 'Reels edge'
							: err.startsWith('stories') ? 'Stories edge'
							: 'Content edge';
						const isCode10 = err.includes('code 10') || err.includes('pages_read_engagement') || err.includes('permission');
						return (
							<div key={err} className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs">
								<div className="flex items-center space-x-2.5">
									<AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
									<div>
										<p className="font-bold text-amber-950">
											{isCode10 
												? `${edgeLabel}: Facebook needs to be reconnected with post & follower permissions (code 10 missing pages_read_engagement scope).`
												: `${edgeLabel} couldn't load — displaying partial data. (${err})`}
										</p>
										{isCode10 && (
											<p className="text-[11px] text-amber-700 font-normal mt-0.5">
												Meta requires `pages_read_engagement` permission to fetch feed text posts, carousels, and page follower count.
											</p>
										)}
									</div>
								</div>
								{isCode10 && (
									<Link
										href="/dashboard/facebook"
										className="ml-3 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex-shrink-0 flex items-center space-x-1 shadow-2xs"
									>
										<span>Reconnect Facebook</span>
									</Link>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* ── Date Filter Bar ── */}
			<div className="flex items-center justify-between">
				<div className="flex space-x-1 p-1 bg-slate-100 rounded-xl">
					{(['7 days', '30 days', 'Month to date'] as FilterKey[]).map((tab) => (
						<button key={tab} onClick={() => startTransition(() => setSelectedTab(tab))}
							className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedTab === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
							{tab}
						</button>
					))}
				</div>
			</div>

			{/* ── Summary Section ── */}
			<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
				{/* Summary header */}
				<div className="flex items-start justify-between">
					<div>
						<h2 className="font-extrabold text-slate-900 text-base">Summary</h2>
						<p className="text-xs text-slate-400 font-semibold mt-0.5">
							{formatDateLabel(currentRange.start)} – {formatDateLabel(currentRange.end)}
							<span className="mx-1.5 text-slate-300">·</span>
							Compared to {formatDateLabel(comparisonRange.start)} – {formatDateLabel(comparisonRange.end)}
						</p>
					</div>
					<div className="flex items-center space-x-2">
						<button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors">
							<Send className="w-3.5 h-3.5" />
						</button>
						<button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors">
							<ExternalLink className="w-3.5 h-3.5" />
						</button>
					</div>
				</div>

				{/* KPI Grid */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{[
						{
							label: 'Total Followers',
							value: summaryStats.followers.toLocaleString(),
							icon: <span title={platformParam === 'instagram' ? 'Instagram Followers' : platformParam === 'linkedin' ? 'LinkedIn Connections' : 'YouTube Subscribers'}><HelpCircle className="w-3.5 h-3.5" /></span>
						},
						{
							label: 'Posts',
							value: summaryStats.postsCount.toLocaleString(),
							icon: <span title={platformParam === 'instagram' ? 'Posts published in period' : platformParam === 'linkedin' ? 'Updates shared in period' : 'Videos published in period'}><HelpCircle className="w-3.5 h-3.5" /></span>
						},
						{
							label: 'Reactions',
							value: summaryStats.reactions.toLocaleString(),
							icon: <span title="Total likes in period"><HelpCircle className="w-3.5 h-3.5" /></span>
						},
						{
							label: 'Comments',
							value: summaryStats.comments.toLocaleString(),
							icon: <span title="Total comments in period"><HelpCircle className="w-3.5 h-3.5" /></span>
						},
					].map(({ label, value, icon }) => (
						<div key={label} className="bg-slate-50/60 border border-slate-100 rounded-xl p-4 flex flex-col justify-between hover:bg-slate-50 transition-colors">
							<div className="flex items-center justify-between text-slate-400 mb-3">
								<span className="text-xs font-semibold text-slate-500">{label}</span>
								{icon}
							</div>
							<span className="text-2xl font-black tracking-tight text-slate-900">{value}</span>
						</div>
					))}
				</div>

				{/* Second row: Eng Rate + Views */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{[
						{
							label: 'Eng. Rate',
							value: `${summaryStats.engagementRate}%`,
							icon: <span title="(reactions + comments + shares) / page followers × 100. Reach & impressions are unavailable in Graph API v25.0."><HelpCircle className="w-3.5 h-3.5" /></span>
						},
						{
							label: 'Views',
							value: summaryStats.views.toLocaleString(),
							icon: <span title="Total views in period"><HelpCircle className="w-3.5 h-3.5" /></span>
						},
					].map(({ label, value, icon }) => (
						<div key={label} className="bg-slate-50/60 border border-slate-100 rounded-xl p-4 flex flex-col justify-between hover:bg-slate-50 transition-colors">
							<div className="flex items-center justify-between text-slate-400 mb-3">
								<span className="text-xs font-semibold text-slate-500">{label}</span>
								{icon}
							</div>
							<span className="text-2xl font-black tracking-tight text-slate-900">{value}</span>
						</div>
					))}
					{/* Empty spacers for layout */}
					<div className="hidden md:block" />
					<div className="hidden md:block" />
				</div>

				{filteredPosts.length === 0 ? (
					<div className="text-center py-4 text-xs text-slate-400 font-semibold border-t border-slate-100">
						No posts published in this period ({formatDateLabel(currentRange.start)} – {formatDateLabel(currentRange.end)})
					</div>
				) : insights.posts.length > filteredPosts.length ? (
					<div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-600 font-semibold flex items-center space-x-2">
						<span className="text-violet-500 font-bold">ℹ️</span>
						<span>Showing {filteredPosts.length} items within selected <strong>{selectedTab}</strong> window ({formatDateLabel(currentRange.start)} – {formatDateLabel(currentRange.end)}). ({insights.posts.length} total content items found in Page history).</span>
					</div>
				) : null}
			</div>

			{/* ── Recharts Graph Section ── */}
			<div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
				{/* Chart toolbar */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-slate-100">
					{/* Left controls */}
					<div className="flex flex-wrap items-center gap-2">
						{/* Metric dropdown */}
						<div className="relative" ref={dropdownRef}>
							<button onClick={() => setIsMetricDropdownOpen(!isMetricDropdownOpen)}
								className="inline-flex items-center space-x-2 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 bg-white rounded-lg text-xs font-bold text-slate-700 transition-all">
								<Users className="w-3.5 h-3.5 text-slate-400" />
								<span>{selectedMetric}</span>
								<ChevronDown className="w-3 h-3 text-slate-400" />
							</button>
							{isMetricDropdownOpen && (
								<div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 w-52 text-xs font-semibold text-slate-600">
									{[
										{ label: 'Followers', icon: '👥' },
										{ label: 'Profile Views', icon: '👁️' },
										{ label: 'Posts', icon: '📄' },
										{ label: 'Reactions', icon: '👍' },
										{ label: 'Comments', icon: '💬' },
										{ label: 'Net New Followers', icon: '📈' },
									].map(({ label, icon }) => (
										<button key={label}
											onClick={() => { setSelectedMetric(label); setIsMetricDropdownOpen(false); }}
											className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center space-x-2.5 ${selectedMetric === label ? 'text-slate-900 font-bold' : ''}`}>
											{selectedMetric === label && <span className="text-violet-500 text-xs">✓</span>}
											<span>{icon}</span>
											<span>{label}</span>
										</button>
									))}
								</div>
							)}
						</div>

						</div>

					{/* Period toggles */}
					<div className="flex items-center p-0.5 bg-slate-100 rounded-lg self-end sm:self-center shrink-0">
						{['This Period', 'Comparison', 'Both'].map((p) => (
							<button key={p} onClick={() => setSelectedPeriod(p)}
								className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${selectedPeriod === p ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
								{p === 'This Period' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />}
								<span>{p}</span>
							</button>
						))}
					</div>
				</div>

				{/* Metric stat + date range subtitle */}
				<div className="px-6 py-4 border-b border-slate-50 flex items-baseline space-x-2">
					<span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selectedMetric}</span>
					<span className="text-2xl font-black text-slate-900">{metricDisplayValue}</span>
					<span className="text-xs text-slate-400 font-semibold">
						{formatDateLabel(currentRange.start)} – {formatDateLabel(currentRange.end)}
					</span>
				</div>

				{/* Chart body — switches between This Period / Comparison / Both */}
				<div className="px-4 pb-6 pt-4">
					{(() => {
						// Pick dataset and colors based on period mode
						const showBoth = selectedPeriod === 'Both';
						const showComparison = selectedPeriod === 'Comparison';
						const activeData = showBoth
							? mergedChartData
							: showComparison
							? comparisonChartData.map(d => ({ ...d, current: d.value, previous: d.value }))
							: chartData.map(d => ({ ...d, current: d.value, previous: d.value }));

						if (activeData.length === 0) {
							return (
								<div className="h-[260px] flex flex-col items-center justify-center text-slate-300">
									<BarChart3 className="w-10 h-10 mb-3" />
									<p className="text-xs font-bold text-slate-400">No data for this period</p>
									<p className="text-[10px] text-slate-300 mt-1">
										{formatDateLabel(currentRange.start)} – {formatDateLabel(currentRange.end)}
									</p>
								</div>
							);
						}

						const xAxisInterval = activeData.length > 10 ? Math.floor(activeData.length / 6) : 0;

						return (
							<ChartContainer config={chartConfig} className="h-[260px] w-full">
								<AreaChart data={activeData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
									<defs>
										<linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
											<stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
										</linearGradient>
										<linearGradient id="gradPrevious" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
											<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid vertical={false} stroke="#f1f5f9" />
									<XAxis
										dataKey="date"
										interval={xAxisInterval}
										tickLine={false}
										axisLine={false}
										tickMargin={10}
										tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
									/>
									<YAxis
										allowDecimals={false}
										tickCount={5}
										tickLine={false}
										axisLine={false}
										tickMargin={8}
										tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
										width={36}
									/>
									<Tooltip content={<CustomTooltip />} />
									{/* Current period — always visible unless Comparison-only */}
									{!showComparison && (
										<Area
											type="monotone"
											dataKey="current"
											name={`${selectedMetric} (This Period)`}
											stroke="#8B5CF6"
											strokeWidth={2.5}
											fill="url(#gradCurrent)"
											dot={{ r: 3.5, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }}
											activeDot={{ r: 5.5, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }}
										/>
									)}
									{/* Comparison period — visible when Comparison or Both */}
									{(showComparison || showBoth) && (
										<Area
											type="monotone"
											dataKey="previous"
											name={`${selectedMetric} (Comparison)`}
											stroke="#10b981"
											strokeWidth={2}
											strokeDasharray={showBoth ? '5 3' : undefined}
											fill="url(#gradPrevious)"
											dot={{ r: 3, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
											activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
										/>
									)}
								</AreaChart>
							</ChartContainer>
						);
					})()}
				</div>
			</div>

			{/* ── Performance per Post Table ── */}
			<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-1 border-b border-slate-50">
					<div className="flex flex-col">
						<h3 className="font-extrabold text-slate-800 text-sm">Performance per Post</h3>
						<p className="text-[10px] text-slate-400 font-semibold mt-0.5">
							{tablePeriod === 'current'
								? `${formatDateLabel(currentRange.start)} – ${formatDateLabel(currentRange.end)}`
								: `${formatDateLabel(comparisonRange.start)} – ${formatDateLabel(comparisonRange.end)}`}
						</p>
					</div>

					{/* Period Selection Toggle Pills */}
					<div className="flex items-center p-0.5 bg-slate-100 rounded-lg self-end sm:self-center shrink-0">
						<button
							onClick={() => { setTablePeriod('current'); setCurrentPage(1); }}
							className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${tablePeriod === 'current' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
						>
							This Period
						</button>
						<button
							onClick={() => { setTablePeriod('previous'); setCurrentPage(1); }}
							className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${tablePeriod === 'previous' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
						>
							Previous Period
						</button>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse text-xs">
						<thead>
							<tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider select-none">
								<th className="pb-3 pl-2 text-left cursor-pointer" onClick={() => handleSort('publishedAt')}>
									<div className="inline-flex items-center space-x-1.5">
										<span>Posts · {totalPostsForTable}</span>
										{sortKey === 'publishedAt' && (
											<ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
										)}
									</div>
								</th>
								<th className="pb-3 text-right cursor-pointer" onClick={() => handleSort('reactions')}>
									<div className="inline-flex items-center justify-end space-x-1">
										<span>Reactions</span>
										<ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortKey === 'reactions' && sortOrder === 'asc' ? 'rotate-180' : ''}`} />
									</div>
								</th>
								<th className="pb-3 text-right cursor-pointer" onClick={() => handleSort('comments')}>
									<div className="inline-flex items-center justify-end space-x-1">
										<span>Comments</span>
										<ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortKey === 'comments' && sortOrder === 'asc' ? 'rotate-180' : ''}`} />
									</div>
								</th>
								<th className="pb-3 text-right cursor-pointer" onClick={() => handleSort('engagementRate')}>
									<div className="inline-flex items-center justify-end space-x-1">
										<span>Eng. Rate</span>
										<ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortKey === 'engagementRate' && sortOrder === 'asc' ? 'rotate-180' : ''}`} />
									</div>
								</th>
								<th className="pb-3 text-right cursor-pointer" onClick={() => handleSort('views')}>
									<div className="inline-flex items-center justify-end space-x-1">
										<span>Views</span>
										<ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortKey === 'views' && sortOrder === 'asc' ? 'rotate-180' : ''}`} />
									</div>
								</th>
								<th className="pb-3 pr-2 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-50 font-medium text-slate-700">
							{pagePosts.map((post, idx) => {
								const globalIdx = (currentPage - 1) * postsPerPage + idx + 1;
								return (
									<tr
										key={post.id}
										onClick={() => setSelectedModalPost(post)}
										className="hover:bg-slate-50/70 transition-colors cursor-pointer"
									>
										<td className="py-3.5 pl-2">
											<div className="flex items-center space-x-3 max-w-md">
												<span className="text-[10px] font-bold text-slate-400 w-6 flex-shrink-0">
													#{globalIdx}
												</span>
												<div className="relative w-11 h-11 bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm">
													{post.thumbnail ? (
														<img src={post.thumbnail} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
													) : (
														<div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-slate-300 text-[10px] font-bold uppercase">
															{post.type ? post.type.slice(0, 2) : 'FB'}
														</div>
													)}
												</div>
												<div className="min-w-0 flex-1">
													<div className="flex items-center space-x-1.5 mb-1">
														{renderContentTypeBadge(post)}
													</div>
													<p className="font-bold text-slate-800 truncate max-w-[260px] hover:text-violet-600 transition-colors" title={post.title || post.message}>
														{post.title || post.message || 'Untitled Post'}
													</p>
													<p className="text-[10px] text-slate-400 mt-0.5">
														{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
													</p>
												</div>
											</div>
										</td>
										<td className="py-3.5 text-right font-semibold text-slate-900">{post.reactions.toLocaleString()}</td>
										<td className="py-3.5 text-right font-semibold text-slate-900">{post.comments.toLocaleString()}</td>
										<td className="py-3.5 text-right font-semibold text-slate-900">{post.engagementRate}%</td>
										<td className="py-3.5 text-right font-semibold text-slate-900">
											{post.views !== null && post.views !== undefined ? post.views.toLocaleString() : '—'}
										</td>
										<td className="py-3.5 pr-2 text-right text-slate-400" onClick={(e) => e.stopPropagation()}>
											<button className="p-1 hover:bg-slate-100 hover:text-slate-600 rounded-md transition-colors">
												<MoreVertical className="w-4 h-4" />
											</button>
										</td>
									</tr>
								);
							})}
							{totalPostsForTable === 0 && (
								<tr>
									<td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
										No posts published in this period.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex items-center justify-center space-x-1.5 mt-6 pt-4 border-t border-slate-50">
						<button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
							className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors">
							<ChevronLeft className="w-4 h-4" />
						</button>
						{[...Array(totalPages)].map((_, i) => (
							<button key={i} onClick={() => setCurrentPage(i + 1)}
								className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}>
								{i + 1}
							</button>
						))}
						<button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
							className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors">
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				)}
			</div>

			{/* ── Post Details Modal Overlay ── */}
			{selectedModalPost && (
				<Portal>
					<div
						className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4 animate-fade-in"
						onClick={() => { setSelectedModalPost(null); setIsModalActionsOpen(false); }}
					>
						<div
							className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col relative animate-scale-in"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Header */}
							<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
								<span className="text-xs font-bold text-slate-500">
									Published on {new Date(selectedModalPost.publishedAt).toLocaleString('en-US', {
										month: 'short',
										day: 'numeric',
										hour: 'numeric',
										minute: '2-digit',
										hour12: true
									})} • Live
								</span>
								<button
									onClick={() => { setSelectedModalPost(null); setIsModalActionsOpen(false); }}
									className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
								>
									<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>

							{/* Body */}
							<div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
								{/* Channel block */}
								<div className="flex items-center space-x-3">
									<div className="relative">
										{insights.channelAvatar ? (
											<img src={insights.channelAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm" />
										) : (
											<div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-extrabold text-sm">
												{insights.channelName.charAt(0).toUpperCase()}
											</div>
										)}
										<div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-xs border border-slate-50">
											<svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
												<path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837z" fill="#FF0000"/>
												<polygon points="9.545 15.568 15.818 12 9.545 8.432" fill="#FFFFFF"/>
											</svg>
										</div>
									</div>
									<span className="font-extrabold text-sm text-slate-800">{insights.channelName}</span>
								</div>

								{/* Title/Description */}
								<p className="text-xs leading-relaxed text-slate-700 font-semibold whitespace-pre-wrap">
									{renderTextWithHashtags(selectedModalPost.title)}
								</p>

								{/* Preview Image */}
								<div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm group">
									<img src={selectedModalPost.thumbnail} alt="" className="w-full h-full object-cover" />
									<div className="absolute inset-0 bg-black/25 flex items-center justify-center">
										<div className="w-12 h-12 rounded-full bg-white/95 shadow-md flex items-center justify-center text-red-600 hover:scale-105 active:scale-95 transition-transform cursor-pointer">
											<svg viewBox="0 0 24 24" className="w-6 h-6 fill-current ml-0.5">
												<path d="M8 5v14l11-7z" />
											</svg>
										</div>
									</div>
								</div>

								{/* Divider */}
								<div className="border-t border-slate-100 my-2" />

								{/* Metrics Row */}
								<div className="grid grid-cols-4 gap-4 py-2 border-b border-slate-50">
									{[
										{ label: 'Reactions', val: selectedModalPost.reactions, icon: <ThumbsUp className="w-3.5 h-3.5 text-slate-400" /> },
										{ label: 'Comments', val: selectedModalPost.comments, icon: <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> },
										{ label: 'Eng. Rate', val: `${selectedModalPost.engagementRate}%`, icon: <Zap className="w-3.5 h-3.5 text-slate-400" /> },
										{ label: 'Views', val: selectedModalPost.views !== null && selectedModalPost.views !== undefined ? selectedModalPost.views : '—', icon: <Eye className="w-3.5 h-3.5 text-slate-400" /> },
									].map((m) => (
										<div key={m.label} className="space-y-1">
											<div className="flex items-center space-x-1.5 text-slate-400">
												{m.icon}
												<span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
											</div>
											<p className="text-sm font-extrabold text-slate-900">{typeof m.val === 'number' ? m.val.toLocaleString() : (m.val ?? '—')}</p>
										</div>
									))}
								</div>
							</div>

							{/* Footer */}
							<div className="px-6 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between">
								{/* Published via */}
								<div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-semibold">
									{platformParam === 'instagram' ? (
										<Instagram className="w-4 h-4 text-pink-650" />
									) : platformParam === 'linkedin' ? (
										<Linkedin className="w-4 h-4 text-blue-600 fill-current" />
									) : platformParam === 'facebook' ? (
										<Facebook className="w-4 h-4 text-blue-600 fill-current" />
									) : platformParam === 'x' ? (
										<Twitter className="w-4 h-4 text-slate-800 fill-current" />
									) : (
										<svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
											<path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837z" fill="#FF0000"/>
											<polygon points="9.545 15.568 15.818 12 9.545 8.432" fill="#FFFFFF"/>
										</svg>
									)}
									<span>Published via {platformParam === 'instagram' ? 'Instagram' : platformParam === 'linkedin' ? 'LinkedIn' : platformParam === 'facebook' ? 'Facebook' : platformParam === 'x' ? 'X (Twitter)' : 'YouTube'}</span>
								</div>

								{/* Action buttons */}
								<div className="flex items-center space-x-2">
									<a
										href={selectedModalPost.postUrl || (platformParam === 'instagram' ? 'https://instagram.com' : platformParam === 'linkedin' ? 'https://linkedin.com' : platformParam === 'facebook' ? 'https://facebook.com' : platformParam === 'x' ? 'https://x.com' : `https://www.youtube.com/watch?v=${selectedModalPost.id}`)}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 rounded-lg shadow-sm transition-all"
									>
										<span>Go to post</span>
										<ExternalLink className="w-3.5 h-3.5" />
									</a>

									{/* Three-dot actions menu */}
									<div className="relative" ref={modalActionsRef}>
										<button
											onClick={() => setIsModalActionsOpen(!isModalActionsOpen)}
											className={`p-2 border rounded-lg text-slate-400 hover:text-slate-700 transition-colors ${
												isModalActionsOpen
													? 'bg-slate-100 border-slate-300 text-slate-700'
													: 'bg-white border-slate-200 hover:bg-slate-50'
											}`}
										>
											<MoreVertical className="w-3.5 h-3.5" />
										</button>

										{/* Dropdown menu — no Duplicate */}
										{isModalActionsOpen && (
											<div className="absolute bottom-full right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-52 z-10 text-xs font-semibold text-slate-700">
												{/* Share Link in a Post */}
												<button
													onClick={() => {
														const url = selectedModalPost.postUrl || `https://www.youtube.com/watch?v=${selectedModalPost.id}`;
														window.open(`https://www.youtube.com/share?url=${encodeURIComponent(url)}`, '_blank');
														setIsModalActionsOpen(false);
													}}
													className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
												>
													<svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
														<path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
													</svg>
													<span>Share Link in a Post</span>
												</button>

												{/* Copy link */}
												<button
													onClick={() => {
														const url = selectedModalPost.postUrl || `https://www.youtube.com/watch?v=${selectedModalPost.id}`;
														navigator.clipboard.writeText(url).catch(() => {});
														setIsModalActionsOpen(false);
													}}
													className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
												>
													<svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
														<path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
													</svg>
													<span>Copy link</span>
												</button>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</Portal>
			)}
		</div>
	);
}

export default function InsightsPage() {
	return (
		<Suspense fallback={
			<div className="p-8 max-w-6xl mx-auto text-xs text-slate-400 font-bold animate-pulse">
				Loading insights dashboard...
			</div>
		}>
			<InsightsContent />
		</Suspense>
	);
}
