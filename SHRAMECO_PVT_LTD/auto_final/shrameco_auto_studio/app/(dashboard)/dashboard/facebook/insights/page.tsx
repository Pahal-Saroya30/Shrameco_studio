'use client';

import React, { useState, useEffect } from 'react';
import { 
	Facebook, 
	ArrowUpRight, 
	ArrowDownRight, 
	Users, 
	ThumbsUp, 
	MessageSquare, 
	Share2, 
	Eye,
	BarChart3,
	Globe,
	Clock,
	ChevronDown,
	Activity,
	PieChart,
	Zap,
	ExternalLink,
	Calendar,
	MousePointerClick,
	X,
	Play,
	MoreHorizontal,
} from 'lucide-react';
import Link from 'next/link';

// ──────────────────────────────────────────────────
// Mock Data
// ──────────────────────────────────────────────────
const OVERVIEW_METRICS = [
	{ label: 'Page Reach', value: '12,480', change: '+18.4%', up: true, icon: Eye, desc: 'Unique accounts reached', color: 'text-blue-600 bg-blue-50 border-blue-100' },
	{ label: 'Post Engagement', value: '3,842', change: '+24.6%', up: true, icon: MousePointerClick, desc: 'Total interactions', color: 'text-violet-600 bg-violet-50 border-violet-100' },
	{ label: 'Page Followers', value: '2,156', change: '+5.2%', up: true, icon: Users, desc: 'Total page followers', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
	{ label: 'Link Clicks', value: '648', change: '-3.1%', up: false, icon: ExternalLink, desc: 'Clicks to external URLs', color: 'text-amber-600 bg-amber-50 border-amber-100' },
];

const REACH_DATA = [
	{ day: 'Aug 1', organic: 320, paid: 80 },
	{ day: 'Aug 2', organic: 280, paid: 120 },
	{ day: 'Aug 3', organic: 450, paid: 90 },
	{ day: 'Aug 4', organic: 380, paid: 150 },
	{ day: 'Aug 5', organic: 520, paid: 110 },
	{ day: 'Aug 6', organic: 410, paid: 200 },
	{ day: 'Aug 7', organic: 680, paid: 180 },
	{ day: 'Aug 8', organic: 590, paid: 220 },
	{ day: 'Aug 9', organic: 720, paid: 160 },
	{ day: 'Aug 10', organic: 840, paid: 240 },
	{ day: 'Aug 11', organic: 760, paid: 280 },
	{ day: 'Aug 12', organic: 920, paid: 310 },
	{ day: 'Aug 13', organic: 880, paid: 260 },
	{ day: 'Aug 14', organic: 1050, paid: 340 },
];

const ENGAGEMENT_DATA = [
	{ day: 'Aug 1', likes: 45, comments: 12, shares: 8 },
	{ day: 'Aug 2', likes: 38, comments: 8, shares: 5 },
	{ day: 'Aug 3', likes: 62, comments: 18, shares: 12 },
	{ day: 'Aug 4', likes: 54, comments: 14, shares: 9 },
	{ day: 'Aug 5', likes: 78, comments: 22, shares: 15 },
	{ day: 'Aug 6', likes: 65, comments: 16, shares: 11 },
	{ day: 'Aug 7', likes: 92, comments: 28, shares: 18 },
	{ day: 'Aug 8', likes: 85, comments: 24, shares: 14 },
	{ day: 'Aug 9', likes: 108, comments: 32, shares: 21 },
	{ day: 'Aug 10', likes: 120, comments: 36, shares: 24 },
	{ day: 'Aug 11', likes: 95, comments: 28, shares: 16 },
	{ day: 'Aug 12', likes: 135, comments: 42, shares: 28 },
	{ day: 'Aug 13', likes: 118, comments: 35, shares: 22 },
	{ day: 'Aug 14', likes: 142, comments: 48, shares: 32 },
];

const AUDIENCE_AGE = [
	{ range: '13-17', male: 2, female: 3 },
	{ range: '18-24', male: 18, female: 22 },
	{ range: '25-34', male: 28, female: 24 },
	{ range: '35-44', male: 14, female: 12 },
	{ range: '45-54', male: 8, female: 6 },
	{ range: '55-64', male: 4, female: 3 },
	{ range: '65+', male: 2, female: 1 },
];

const TOP_CITIES = [
	{ city: 'Mumbai', country: 'India', pct: 18.4 },
	{ city: 'Delhi NCR', country: 'India', pct: 14.2 },
	{ city: 'Bangalore', country: 'India', pct: 11.8 },
	{ city: 'Hyderabad', country: 'India', pct: 8.6 },
	{ city: 'Pune', country: 'India', pct: 7.2 },
	{ city: 'Chennai', country: 'India', pct: 5.4 },
];

const TOP_COUNTRIES = [
	{ country: 'India', flag: '🇮🇳', pct: 72.4 },
	{ country: 'United States', flag: '🇺🇸', pct: 8.6 },
	{ country: 'United Kingdom', flag: '🇬🇧', pct: 4.2 },
	{ country: 'Canada', flag: '🇨🇦', pct: 3.1 },
	{ country: 'Australia', flag: '🇦🇺', pct: 2.8 },
];

const CONTENT_TYPE_BREAKDOWN = [
	{ type: 'Photo Posts', count: 24, reach: '8.2K', engagement: '5.4%', color: 'bg-emerald-500' },
	{ type: 'Video / Reels', count: 12, reach: '14.6K', engagement: '8.2%', color: 'bg-violet-500' },
	{ type: 'Text Posts', count: 18, reach: '3.1K', engagement: '2.8%', color: 'bg-blue-500' },
	{ type: 'Carousel', count: 8, reach: '6.4K', engagement: '6.1%', color: 'bg-amber-500' },
	{ type: 'Stories', count: 32, reach: '4.8K', engagement: '3.2%', color: 'bg-pink-500' },
];

const TOP_POSTS = [
	{ caption: '🚀 Announcing Shrameco AI Studio — the ultimate automated content manager for brands...', type: 'Photo', likes: 284, comments: 42, shares: 18, reach: '4.2K', eng: '8.2%', date: 'Aug 10', time: '11:30 AM', thumbColor: 'from-violet-800 to-blue-900', hasVideo: false },
	{ caption: 'What tone describes your brand best? Let us know in the comments! 🎨', type: 'Text', likes: 156, comments: 68, shares: 8, reach: '3.1K', eng: '7.5%', date: 'Aug 8', time: '8:09 PM', thumbColor: 'from-slate-700 to-slate-900', hasVideo: false },
	{ caption: 'Behind the scenes: How we compile 3 structurally distinct caption variations with AI...', type: 'Reel', likes: 342, comments: 56, shares: 42, reach: '8.6K', eng: '5.1%', date: 'Aug 6', time: '6:00 PM', thumbColor: 'from-indigo-900 to-violet-900', hasVideo: true },
	{ caption: '📊 Monthly performance report — Our page growth strategy that actually works', type: 'Carousel', likes: 198, comments: 34, shares: 24, reach: '5.4K', eng: '4.7%', date: 'Aug 4', time: '12:30 PM', thumbColor: 'from-emerald-800 to-teal-900', hasVideo: false },
	{ caption: 'Quick tip: Use AI-generated captions as a starting point, then add your brand voice for best results...', type: 'Story', likes: 124, comments: 18, shares: 6, reach: '2.8K', eng: '5.3%', date: 'Aug 2', time: '9:15 AM', thumbColor: 'from-pink-800 to-rose-900', hasVideo: false },
];

type TopPost = typeof TOP_POSTS[number];

const BEST_POSTING_TIMES = [
	{ time: '9:00 AM', day: 'Monday', score: 92 },
	{ time: '12:30 PM', day: 'Wednesday', score: 88 },
	{ time: '6:00 PM', day: 'Friday', score: 85 },
	{ time: '10:00 AM', day: 'Saturday', score: 78 },
	{ time: '3:00 PM', day: 'Thursday', score: 74 },
];

// ──────────────────────────────────────────────────
// Chart Helper: SVG Bar Chart
// ──────────────────────────────────────────────────
function BarChartSVG({ data, colors, labels }: { data: number[][]; colors: string[]; labels: string[] }) {
	const maxVal = Math.max(...data.flat());
	const barCount = data[0].length;
	const groupWidth = 800 / barCount;
	const barWidth = groupWidth / (data.length + 1);
	
	return (
		<div className="w-full h-56 bg-slate-50/50 rounded-xl border border-slate-100 p-4 relative overflow-hidden">
			{/* Y-axis grid lines */}
			<div className="absolute inset-0 flex flex-col justify-between py-6 px-4 opacity-40">
				{[...Array(5)].map((_, i) => (
					<div key={i} className="w-full border-t border-slate-200/60 border-dashed"></div>
				))}
			</div>
			{/* Y-axis labels */}
			<div className="absolute left-2 top-4 bottom-8 flex flex-col justify-between text-[9px] font-bold text-slate-400">
				{[...Array(5)].map((_, i) => (
					<span key={i}>{Math.round(maxVal - (maxVal / 4) * i)}</span>
				))}
				<span>0</span>
			</div>
			
			<svg className="w-full h-full z-10 ml-4" viewBox={`0 0 800 200`} preserveAspectRatio="none">
				{data.map((series, si) => 
					series.map((val, i) => {
						const height = (val / maxVal) * 170;
						const x = i * groupWidth + si * barWidth + groupWidth * 0.15;
						return (
							<rect
								key={`${si}-${i}`}
								x={x}
								y={200 - height - 5}
								width={barWidth * 0.8}
								height={height}
								rx={4}
								fill={colors[si]}
								opacity={0.85}
							/>
						);
					})
				)}
			</svg>
			
			{/* X-axis labels */}
			<div className="absolute bottom-1 left-8 right-2 flex justify-between text-[9px] font-black text-slate-400 tracking-wider">
				{labels.map((l, i) => <span key={i}>{l}</span>)}
			</div>
		</div>
	);
}

// ──────────────────────────────────────────────────
// Chart Helper: SVG Line Area Chart
// ──────────────────────────────────────────────────
function AreaChartSVG({ points, color, gradientId }: { points: number[]; color: string; gradientId: string }) {
	const max = Math.max(...points);
	const w = 800;
	const h = 200;
	const step = w / (points.length - 1);
	
	const linePoints = points.map((p, i) => `${i * step},${h - (p / max) * 170 - 10}`).join(' ');
	const areaPath = `M 0,${h - (points[0] / max) * 170 - 10} ` + 
		points.map((p, i) => `L ${i * step},${h - (p / max) * 170 - 10}`).join(' ') +
		` L ${w},${h} L 0,${h} Z`;

	return (
		<>
			<defs>
				<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={color} stopOpacity="0.25" />
					<stop offset="100%" stopColor={color} stopOpacity="0" />
				</linearGradient>
			</defs>
			<path d={areaPath} fill={`url(#${gradientId})`} />
			<polyline
				points={linePoints}
				fill="none"
				stroke={color}
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			{/* Data point dots */}
			{points.map((p, i) => (
				<circle
					key={i}
					cx={i * step}
					cy={h - (p / max) * 170 - 10}
					r="4"
					fill="white"
					stroke={color}
					strokeWidth="2.5"
				/>
			))}
		</>
	);
}

// ──────────────────────────────────────────────────
// Horizontal Bar for demographics
// ──────────────────────────────────────────────────
function HorizontalBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
	const pct = (value / max) * 100;
	return (
		<div className="flex items-center space-x-3">
			<span className="text-[11px] font-bold text-slate-500 w-12 text-right">{label}</span>
			<div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden relative">
				<div 
					className={`h-full rounded-full transition-all duration-700 ${color}`} 
					style={{ width: `${pct}%` }}
				/>
			</div>
			<span className="text-[11px] font-black text-slate-700 w-8">{value}%</span>
		</div>
	);
}

// ──────────────────────────────────────────────────
// Post Preview Modal
// ──────────────────────────────────────────────────
function PostPreviewModal({ post, accountName, onClose }: { post: TopPost; accountName: string; onClose: () => void }) {
	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

			{/* Modal card */}
			<div
				className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden animate-fade-in"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
					<div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500">
						<span>Published on {post.date}, {post.time}</span>
						<span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
						<span className="text-emerald-600 font-bold">• Live</span>
					</div>
					<button
						onClick={onClose}
						className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Content */}
				<div className="px-5 pt-4 pb-2 space-y-3">
					{/* Author row */}
					<div className="flex items-center space-x-2.5">
						<div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-xs flex-shrink-0">
							{accountName.charAt(0).toUpperCase()}
						</div>
						<div>
							<p className="text-sm font-bold text-slate-900">{accountName}</p>
							<p className="text-[11px] text-slate-400 font-semibold">{post.date} · {post.time}</p>
						</div>
					</div>

					{/* Caption */}
					<p className="text-sm text-slate-800 leading-relaxed">{post.caption}</p>

					{/* Media Thumbnail */}
					<div className={`w-full h-52 rounded-xl bg-gradient-to-br ${post.thumbColor} relative overflow-hidden flex items-center justify-center shadow-inner`}>
						{/* Decorative grid overlay */}
						<div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
						{/* Play button */}
						<div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
							<Play className="w-6 h-6 text-slate-800 ml-0.5" fill="currentColor" />
						</div>
						{/* Format badge top-right */}
						<div className="absolute top-3 right-3">
							<span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border backdrop-blur-sm ${
								post.type === 'Photo' ? 'bg-emerald-900/60 border-emerald-600/40 text-emerald-200' :
								post.type === 'Reel' ? 'bg-pink-900/60 border-pink-600/40 text-pink-200' :
								post.type === 'Carousel' ? 'bg-amber-900/60 border-amber-600/40 text-amber-200' :
								post.type === 'Story' ? 'bg-violet-900/60 border-violet-600/40 text-violet-200' :
								'bg-blue-900/60 border-blue-600/40 text-blue-200'
							}`}>{post.type}</span>
						</div>
					</div>

					{/* Engagement mini stats */}
					<div className="flex items-center space-x-4 pt-1">
						<div className="flex items-center space-x-1 text-xs font-bold text-slate-500">
							<span>👍</span><span>{post.likes}</span>
						</div>
						<div className="flex items-center space-x-1 text-xs font-bold text-slate-500">
							<span>💬</span><span>{post.comments}</span>
						</div>
						<div className="flex items-center space-x-1 text-xs font-bold text-slate-500">
							<span>↗</span><span>{post.shares}</span>
						</div>
						<div className="ml-auto text-xs font-black text-violet-600">{post.eng} engagement</div>
					</div>
				</div>

				{/* Footer */}
				<div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
					<div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500">
						<Facebook className="w-3.5 h-3.5 text-blue-600" />
						<span>Published via Facebook</span>
					</div>
					<div className="flex items-center space-x-2">
						<button className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer">
							<span>Go to post</span>
							<ExternalLink className="w-3.5 h-3.5" />
						</button>
						<button className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors cursor-pointer">
							<MoreHorizontal className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

// ──────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────
export default function FacebookInsights() {
	const [accountName, setAccountName] = useState<string>('Test01');
	const [activeTab, setActiveTab] = useState<'overview' | 'reach' | 'engagement' | 'audience' | 'content'>('overview');
	const [timeRange, setTimeRange] = useState('Last 28 days');
	const [selectedPost, setSelectedPost] = useState<TopPost | null>(null);

	useEffect(() => {
		const fetchAccount = async () => {
			try {
				const res = await fetch('/api/social/accounts');
				const data = await res.json();
				if (res.ok && data.accounts) {
					const fbAccount = data.accounts.find((a: any) => a.platform === 'facebook' && a.connected);
					if (fbAccount) {
						setAccountName(fbAccount.accountName);
					}
				}
			} catch (err) {
				console.error(err);
			}
		};
		fetchAccount();
	}, []);

	const tabs = [
		{ id: 'overview' as const, label: 'Overview', icon: BarChart3 },
		{ id: 'reach' as const, label: 'Reach', icon: Eye },
		{ id: 'engagement' as const, label: 'Engagement', icon: Activity },
		{ id: 'audience' as const, label: 'Audience', icon: Users },
		{ id: 'content' as const, label: 'Content', icon: PieChart },
	];

	return (
		<>
		<div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6 animate-fade-in pb-16">
			{/* ── Header ── */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div className="flex items-center space-x-3.5">
					<div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center shadow-xs">
						<Facebook className="w-6 h-6 text-blue-600" />
					</div>
					<div>
						<h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
							<span>Page Insights</span>
							<span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100/80 text-blue-700 border border-blue-200/50">Facebook</span>
						</h1>
						<p className="text-xs font-bold text-slate-400">Performance analytics for <span className="text-slate-600">{accountName}</span> · Updated just now</p>
					</div>
				</div>

				<div className="flex items-center space-x-2">
					{/* Time range selector */}
					<button className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer">
						<Calendar className="w-3.5 h-3.5 text-slate-400" />
						<span>{timeRange}</span>
						<ChevronDown className="w-3.5 h-3.5 text-slate-400" />
					</button>
					<Link 
						href="/dashboard/facebook" 
						className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
					>
						<Facebook className="w-3.5 h-3.5" />
						<span>Back to Studio</span>
					</Link>
				</div>
			</div>

			{/* ── Navigation Tabs ── */}
			<div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xs">
				<div className="flex space-x-1">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
								activeTab === tab.id
									? 'bg-slate-900 text-white shadow-sm'
									: 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
							}`}
						>
							<tab.icon className="w-3.5 h-3.5" />
							<span>{tab.label}</span>
						</button>
					))}
				</div>
			</div>

			{/* ══════════════════════════════════════════════ */}
			{/*  TAB: OVERVIEW                                */}
			{/* ══════════════════════════════════════════════ */}
			{activeTab === 'overview' && (
				<div className="space-y-6 animate-fade-in">
					{/* KPI Cards */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{OVERVIEW_METRICS.map((metric, i) => (
							<div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
								<div className="flex items-center justify-between mb-3">
									<div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${metric.color}`}>
										<metric.icon className="w-4.5 h-4.5" />
									</div>
									<span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center space-x-0.5 border ${
										metric.up 
											? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
											: 'bg-rose-50 border-rose-200 text-rose-700'
									}`}>
										{metric.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
										<span>{metric.change}</span>
									</span>
								</div>
								<h3 className="text-2xl font-black text-slate-900 tracking-tight">{metric.value}</h3>
								<p className="text-[10px] font-semibold text-slate-400 mt-1.5 uppercase tracking-wider">{metric.label}</p>
							</div>
						))}
					</div>

					{/* Overview Reach Chart */}
					<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-sm font-bold text-slate-800">Reach Overview</h3>
								<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Organic vs Paid reach over time</p>
							</div>
							<div className="flex items-center space-x-4">
								<div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
									<span className="w-3 h-3 rounded-sm bg-blue-500 block"></span>
									<span>Organic</span>
								</div>
								<div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
									<span className="w-3 h-3 rounded-sm bg-violet-400 block"></span>
									<span>Paid</span>
								</div>
							</div>
						</div>
						<BarChartSVG 
							data={[
								REACH_DATA.map(d => d.organic),
								REACH_DATA.map(d => d.paid),
							]}
							colors={['#3b82f6', '#a78bfa']}
							labels={REACH_DATA.filter((_, i) => i % 2 === 0).map(d => d.day.replace('Aug ', 'AUG '))}
						/>
					</div>

					{/* Quick Stats Row */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Best Posting Times */}
						<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
							<div className="flex items-center space-x-2">
								<Clock className="w-4 h-4 text-amber-500" />
								<h3 className="text-sm font-bold text-slate-800">Best Times to Post</h3>
							</div>
							<div className="space-y-2">
								{BEST_POSTING_TIMES.map((t, i) => (
									<div key={i} className="flex items-center justify-between py-1.5">
										<div className="flex items-center space-x-3">
											<span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
												i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
											}`}>{i + 1}</span>
											<div>
												<span className="text-xs font-bold text-slate-800">{t.day}</span>
												<span className="text-[11px] text-slate-400 font-semibold ml-1.5">{t.time}</span>
											</div>
										</div>
										<div className="flex items-center space-x-2">
											<div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
												<div className="h-full bg-amber-400 rounded-full" style={{ width: `${t.score}%` }} />
											</div>
											<span className="text-[10px] font-black text-slate-500 w-7">{t.score}%</span>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Content Type Breakdown */}
						<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
							<div className="flex items-center space-x-2">
								<PieChart className="w-4 h-4 text-violet-500" />
								<h3 className="text-sm font-bold text-slate-800">Content Breakdown</h3>
							</div>
							<div className="space-y-2.5">
								{CONTENT_TYPE_BREAKDOWN.map((ct, i) => (
									<div key={i} className="flex items-center justify-between">
										<div className="flex items-center space-x-2.5 flex-1 min-w-0">
											<div className={`w-2.5 h-2.5 rounded-full ${ct.color} flex-shrink-0`} />
											<span className="text-xs font-bold text-slate-700 truncate">{ct.type}</span>
										</div>
										<div className="flex items-center space-x-4">
											<span className="text-[10px] font-semibold text-slate-400 w-14 text-right">{ct.reach} reach</span>
											<span className="text-[11px] font-black text-slate-800 w-10 text-right">{ct.engagement}</span>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ══════════════════════════════════════════════ */}
			{/*  TAB: REACH                                   */}
			{/* ══════════════════════════════════════════════ */}
			{activeTab === 'reach' && (
				<div className="space-y-6 animate-fade-in">
					{/* Reach summary cards */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						{[
							{ label: 'Total Reach', value: '12,480', change: '+18.4%', up: true },
							{ label: 'Organic Reach', value: '9,240', change: '+22.1%', up: true },
							{ label: 'Paid Reach', value: '3,240', change: '-2.8%', up: false },
						].map((m, i) => (
							<div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
								<span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{m.label}</span>
								<div className="flex items-end justify-between mt-2">
									<h3 className="text-3xl font-black text-slate-900 tracking-tight">{m.value}</h3>
									<span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center space-x-0.5 border ${
										m.up ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
									}`}>
										{m.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
										<span>{m.change}</span>
									</span>
								</div>
							</div>
						))}
					</div>

					{/* Reach line chart */}
					<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-sm font-bold text-slate-800">Daily Reach Trend</h3>
								<p className="text-[11px] text-slate-400 font-semibold mt-0.5">People who saw any content from your page</p>
							</div>
							<div className="flex items-center space-x-4">
								<div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
									<span className="w-3 h-3 rounded-full bg-blue-500 block"></span>
									<span>Organic</span>
								</div>
								<div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
									<span className="w-3 h-3 rounded-full bg-violet-400 block"></span>
									<span>Paid</span>
								</div>
							</div>
						</div>
						<div className="w-full h-64 bg-slate-50/50 rounded-xl border border-slate-100 p-4 relative overflow-hidden">
							<div className="absolute inset-0 flex flex-col justify-between py-8 px-4 opacity-40">
								{[...Array(5)].map((_, i) => (
									<div key={i} className="w-full border-t border-slate-200/60 border-dashed"></div>
								))}
							</div>
							<svg className="w-full h-full z-10" viewBox="0 0 800 200" preserveAspectRatio="none">
								<AreaChartSVG points={REACH_DATA.map(d => d.organic)} color="#3b82f6" gradientId="reachOrganicG" />
								<AreaChartSVG points={REACH_DATA.map(d => d.paid)} color="#a78bfa" gradientId="reachPaidG" />
							</svg>
							<div className="absolute bottom-1.5 left-4 right-4 flex justify-between text-[9px] font-black text-slate-400 tracking-wider">
								{REACH_DATA.filter((_, i) => i % 2 === 0).map((d, i) => <span key={i}>{d.day.toUpperCase()}</span>)}
							</div>
						</div>
					</div>

					{/* Reach bar chart */}
					<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
						<div>
							<h3 className="text-sm font-bold text-slate-800">Reach by Day</h3>
							<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Side-by-side comparison of organic vs paid reach</p>
						</div>
						<BarChartSVG 
							data={[
								REACH_DATA.map(d => d.organic),
								REACH_DATA.map(d => d.paid),
							]}
							colors={['#3b82f6', '#a78bfa']}
							labels={REACH_DATA.filter((_, i) => i % 2 === 0).map(d => d.day.replace('Aug ', 'AUG '))}
						/>
					</div>
				</div>
			)}

			{/* ══════════════════════════════════════════════ */}
			{/*  TAB: ENGAGEMENT                              */}
			{/* ══════════════════════════════════════════════ */}
			{activeTab === 'engagement' && (
				<div className="space-y-6 animate-fade-in">
					{/* Engagement summary cards */}
					<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
						{[
							{ label: 'Total Engagements', value: '3,842', change: '+24.6%', up: true, icon: Zap },
							{ label: 'Reactions', value: '1,237', change: '+18.2%', up: true, icon: ThumbsUp },
							{ label: 'Comments', value: '363', change: '+32.4%', up: true, icon: MessageSquare },
							{ label: 'Shares', value: '224', change: '+8.1%', up: true, icon: Share2 },
						].map((m, i) => (
							<div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
								<div className="flex items-center justify-between mb-2">
									<m.icon className="w-4 h-4 text-slate-400" />
									<span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center space-x-0.5 border ${
										m.up ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
									}`}>
										{m.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
										<span>{m.change}</span>
									</span>
								</div>
								<h3 className="text-2xl font-black text-slate-900 tracking-tight">{m.value}</h3>
								<p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{m.label}</p>
							</div>
						))}
					</div>

					{/* Engagement line chart */}
					<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-sm font-bold text-slate-800">Engagement Breakdown</h3>
								<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Likes, Comments, and Shares over time</p>
							</div>
							<div className="flex items-center space-x-4">
								<div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
									<span className="w-3 h-3 rounded-full bg-blue-500 block"></span>
									<span>Likes</span>
								</div>
								<div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
									<span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
									<span>Comments</span>
								</div>
								<div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
									<span className="w-3 h-3 rounded-full bg-amber-500 block"></span>
									<span>Shares</span>
								</div>
							</div>
						</div>
						<div className="w-full h-64 bg-slate-50/50 rounded-xl border border-slate-100 p-4 relative overflow-hidden">
							<div className="absolute inset-0 flex flex-col justify-between py-8 px-4 opacity-40">
								{[...Array(5)].map((_, i) => (
									<div key={i} className="w-full border-t border-slate-200/60 border-dashed"></div>
								))}
							</div>
							<svg className="w-full h-full z-10" viewBox="0 0 800 200" preserveAspectRatio="none">
								<AreaChartSVG points={ENGAGEMENT_DATA.map(d => d.likes)} color="#3b82f6" gradientId="engLikesG" />
								<AreaChartSVG points={ENGAGEMENT_DATA.map(d => d.comments)} color="#10b981" gradientId="engCommentsG" />
								<AreaChartSVG points={ENGAGEMENT_DATA.map(d => d.shares)} color="#f59e0b" gradientId="engSharesG" />
							</svg>
							<div className="absolute bottom-1.5 left-4 right-4 flex justify-between text-[9px] font-black text-slate-400 tracking-wider">
								{ENGAGEMENT_DATA.filter((_, i) => i % 2 === 0).map((d, i) => <span key={i}>{d.day.toUpperCase()}</span>)}
							</div>
						</div>
					</div>

					{/* Engagement bar chart */}
					<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
						<div>
							<h3 className="text-sm font-bold text-slate-800">Daily Engagement Stacks</h3>
							<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Grouped comparison per day</p>
						</div>
						<BarChartSVG
							data={[
								ENGAGEMENT_DATA.map(d => d.likes),
								ENGAGEMENT_DATA.map(d => d.comments),
								ENGAGEMENT_DATA.map(d => d.shares),
							]}
							colors={['#3b82f6', '#10b981', '#f59e0b']}
							labels={ENGAGEMENT_DATA.filter((_, i) => i % 2 === 0).map(d => d.day.replace('Aug ', 'AUG '))}
						/>
					</div>
				</div>
			)}

			{/* ══════════════════════════════════════════════ */}
			{/*  TAB: AUDIENCE                                */}
			{/* ══════════════════════════════════════════════ */}
			{activeTab === 'audience' && (
				<div className="space-y-6 animate-fade-in">
					{/* Audience summary */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						{[
							{ label: 'Total Followers', value: '2,156', change: '+5.2%', up: true },
							{ label: 'New Followers (28d)', value: '+112', change: '+14.3%', up: true },
							{ label: 'Unfollows (28d)', value: '-18', change: '-42%', up: true },
						].map((m, i) => (
							<div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
								<span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{m.label}</span>
								<div className="flex items-end justify-between mt-2">
									<h3 className="text-3xl font-black text-slate-900 tracking-tight">{m.value}</h3>
									<span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center space-x-0.5 border ${
										m.up ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
									}`}>
										{m.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
										<span>{m.change}</span>
									</span>
								</div>
							</div>
						))}
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						{/* Age & Gender Distribution */}
						<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
							<div>
								<h3 className="text-sm font-bold text-slate-800">Age & Gender Distribution</h3>
								<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Breakdown of your audience demographics</p>
							</div>
							<div className="space-y-3.5 pt-2">
								{/* Legend */}
								<div className="flex items-center space-x-4 mb-1">
									<div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
										<span className="w-3 h-3 rounded-sm bg-blue-500 block"></span>
										<span>Male</span>
									</div>
									<div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
										<span className="w-3 h-3 rounded-sm bg-pink-400 block"></span>
										<span>Female</span>
									</div>
								</div>
								{AUDIENCE_AGE.map((age, i) => {
									const maxVal = Math.max(...AUDIENCE_AGE.flatMap(a => [a.male, a.female]));
									return (
										<div key={i} className="space-y-1">
											<span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{age.range}</span>
											<div className="flex items-center space-x-2">
												<div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden flex">
													<div className="h-full bg-blue-500 rounded-l-full transition-all duration-700" style={{ width: `${(age.male / maxVal) * 100}%` }} />
													<div className="h-full bg-pink-400 rounded-r-full transition-all duration-700" style={{ width: `${(age.female / maxVal) * 100}%` }} />
												</div>
												<span className="text-[10px] font-bold text-slate-500 w-16 text-right">{age.male + age.female}%</span>
											</div>
										</div>
									);
								})}
							</div>
						</div>

						{/* Top Locations */}
						<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
							<div>
								<h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
									<Globe className="w-4 h-4 text-blue-500" />
									<span>Top Locations</span>
								</h3>
								<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Where your followers are located</p>
							</div>

							{/* Countries */}
							<div className="space-y-2">
								<span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Countries</span>
								{TOP_COUNTRIES.map((c, i) => (
									<div key={i} className="flex items-center justify-between py-1">
										<div className="flex items-center space-x-2.5">
											<span className="text-base">{c.flag}</span>
											<span className="text-xs font-bold text-slate-700">{c.country}</span>
										</div>
										<div className="flex items-center space-x-2">
											<div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
												<div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.pct}%` }} />
											</div>
											<span className="text-[10px] font-black text-slate-600 w-10 text-right">{c.pct}%</span>
										</div>
									</div>
								))}
							</div>

							{/* Divider */}
							<div className="border-t border-slate-100" />

							{/* Cities */}
							<div className="space-y-2">
								<span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Top Cities</span>
								{TOP_CITIES.map((c, i) => (
									<div key={i} className="flex items-center justify-between py-1">
										<div className="flex items-center space-x-2.5">
											<span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black ${
												i < 3 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
											}`}>{i + 1}</span>
											<span className="text-xs font-bold text-slate-700">{c.city}</span>
										</div>
										<div className="flex items-center space-x-2">
											<div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
												<div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(c.pct / TOP_CITIES[0].pct) * 100}%` }} />
											</div>
											<span className="text-[10px] font-black text-slate-600 w-10 text-right">{c.pct}%</span>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Active Hours Heatmap */}
					<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
						<div>
							<h3 className="text-sm font-bold text-slate-800">When Your Followers Are Online</h3>
							<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Activity heatmap showing peak engagement windows</p>
						</div>
						<div className="overflow-x-auto">
							<div className="min-w-[640px]">
								<div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1">
									{/* Header row */}
									<div />
									{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
										<div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-wider pb-1">{d}</div>
									))}
									{/* Time rows */}
									{['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'].map((time, ti) => (
										<React.Fragment key={time}>
											<div className="text-[10px] font-bold text-slate-400 text-right pr-2 flex items-center justify-end">{time}</div>
											{[...Array(7)].map((_, di) => {
												// Generate pseudo-random heat values
												const seed = (ti * 7 + di + 3) * 17 % 100;
												const heat = seed > 70 ? 'bg-blue-500' : seed > 50 ? 'bg-blue-400' : seed > 30 ? 'bg-blue-200' : 'bg-blue-100';
												return (
													<div key={di} className={`h-8 rounded-lg ${heat} transition-colors`} />
												);
											})}
										</React.Fragment>
									))}
								</div>
								{/* Legend */}
								<div className="flex items-center justify-end space-x-1.5 mt-3">
									<span className="text-[9px] font-bold text-slate-400">Less</span>
									{['bg-blue-100', 'bg-blue-200', 'bg-blue-400', 'bg-blue-500'].map((c, i) => (
										<div key={i} className={`w-4 h-4 rounded ${c}`} />
									))}
									<span className="text-[9px] font-bold text-slate-400">More</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ══════════════════════════════════════════════ */}
			{/*  TAB: CONTENT                                 */}
			{/* ══════════════════════════════════════════════ */}
			{activeTab === 'content' && (
				<div className="space-y-6 animate-fade-in">
					{/* Content type cards */}
					<div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
						{CONTENT_TYPE_BREAKDOWN.map((ct, i) => (
							<div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs text-center">
								<div className={`w-3 h-3 rounded-full ${ct.color} mx-auto mb-2`} />
								<h4 className="text-lg font-black text-slate-900">{ct.count}</h4>
								<p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{ct.type}</p>
								<p className="text-[11px] font-black text-violet-600 mt-1">{ct.engagement} eng.</p>
							</div>
						))}
					</div>

					{/* Content reach comparison bar chart */}
					<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
						<div>
							<h3 className="text-sm font-bold text-slate-800">Reach by Content Type</h3>
							<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Average reach per format category</p>
						</div>
						<div className="space-y-3">
							{CONTENT_TYPE_BREAKDOWN.sort((a, b) => parseFloat(b.reach) - parseFloat(a.reach)).map((ct, i) => {
								const reachNum = parseFloat(ct.reach.replace('K', ''));
								const maxReach = Math.max(...CONTENT_TYPE_BREAKDOWN.map(c => parseFloat(c.reach.replace('K', ''))));
								return (
									<div key={i} className="flex items-center space-x-3">
										<span className="text-xs font-bold text-slate-600 w-28 text-right truncate">{ct.type}</span>
										<div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden relative">
											<div 
												className={`h-full rounded-lg ${ct.color} transition-all duration-700`} 
												style={{ width: `${(reachNum / maxReach) * 100}%` }}
											/>
											<span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-black text-slate-600">{ct.reach}</span>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Top Performing Posts Table */}
					<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-sm font-bold text-slate-800">Top Performing Posts</h3>
								<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Posts ranked by highest engagement rate</p>
							</div>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs font-semibold text-slate-600">
								<thead>
									<tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black tracking-wider uppercase">
										<th className="pb-3 w-8">#</th>
										<th className="pb-3">Post Caption</th>
										<th className="pb-3 text-center">Type</th>
										<th className="pb-3 text-center">Reach</th>
										<th className="pb-3 text-center">Likes</th>
										<th className="pb-3 text-center">Comments</th>
										<th className="pb-3 text-center">Shares</th>
										<th className="pb-3 text-right">Eng. Rate</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-50">
									{TOP_POSTS.map((post, i) => (
										<tr key={i} onClick={() => setSelectedPost(post)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
											<td className="py-3.5">
												<span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black ${
													i < 3 ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'
												}`}>{i + 1}</span>
											</td>
											<td className="py-3.5 max-w-[280px] truncate text-slate-800 font-bold">{post.caption}</td>
											<td className="py-3.5 text-center">
												<span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
													post.type === 'Photo' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
													post.type === 'Reel' ? 'bg-pink-50 border-pink-100 text-pink-700' :
													post.type === 'Carousel' ? 'bg-amber-50 border-amber-100 text-amber-700' :
													post.type === 'Story' ? 'bg-violet-50 border-violet-100 text-violet-700' :
													'bg-blue-50 border-blue-100 text-blue-700'
												}`}>{post.type}</span>
											</td>
											<td className="py-3.5 text-center font-bold text-slate-900">{post.reach}</td>
											<td className="py-3.5 text-center font-bold text-slate-900">{post.likes}</td>
											<td className="py-3.5 text-center font-bold text-slate-900">{post.comments}</td>
											<td className="py-3.5 text-center font-bold text-slate-900">{post.shares}</td>
											<td className="py-3.5 text-right font-black text-violet-600">{post.eng}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}
		</div>

		{/* Post Preview Modal */}
		{selectedPost && (
			<PostPreviewModal
				post={selectedPost}
				accountName={accountName}
				onClose={() => setSelectedPost(null)}
			/>
		)}
		</>
	);
}
