'use client';

import React, { useState, useEffect } from 'react';
import { 
	Youtube, 
	Sparkles, 
	ArrowUpRight, 
	ArrowDownRight, 
	TrendingUp, 
	Users, 
	Play, 
	ThumbsUp, 
	HelpCircle,
	CalendarDays,
	BarChart3,
	RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

export default function YoutubeInsights() {
	const [accountName, setAccountName] = useState<string>('Shui');

	useEffect(() => {
		const fetchAccount = async () => {
			try {
				const res = await fetch('/api/social/accounts');
				const data = await res.json();
				if (res.ok && data.accounts) {
					const ytAccount = data.accounts.find((a: any) => a.platform === 'youtube' && a.connected);
					if (ytAccount) {
						setAccountName(ytAccount.accountName);
					}
				}
			} catch (err) {
				console.error(err);
			}
		};
		fetchAccount();
	}, []);

	return (
		<div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
			{/* Top Header Row */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3.5">
					<div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center shadow-xs">
						<BarChart3 className="w-6 h-6 text-indigo-600" />
					</div>
					<div>
						<h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
							<span>YouTube Insights</span>
							<span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-violet-100/80 text-violet-700 border border-violet-200/50">Metrics</span>
						</h1>
						<p className="text-xs font-bold text-slate-400">Detailed performance analysis and audience demographics for {accountName}</p>
					</div>
				</div>

				<div className="flex items-center space-x-2">
					<Link 
						href="/dashboard/youtube" 
						className="px-4 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs"
					>
						<Youtube className="w-4 h-4 text-red-600" />
						<span>Back to Studio</span>
					</Link>
				</div>
			</div>

			{/* Core Metric Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{[
					{ label: 'Weekly Views', value: '42.8K', change: '+24.6%', up: true, desc: 'Total plays across channel' },
					{ label: 'Watch Time (Hours)', value: '1.4K', change: '+18.2%', up: true, desc: 'Accumulated viewer duration' },
					{ label: 'Subscribers Net', value: '+142', change: '-2.1%', up: false, desc: 'New net audience' },
				].map((metric, i) => (
					<div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
						<div className="flex items-center justify-between mb-2">
							<span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{metric.label}</span>
							<span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center space-x-0.5 border ${
								metric.up 
									? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
									: 'bg-rose-50 border-rose-200 text-rose-700'
							}`}>
								{metric.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
								<span>{metric.change}</span>
							</span>
						</div>
						<h3 className="text-3xl font-black text-slate-900 tracking-tight">{metric.value}</h3>
						<p className="text-[11px] font-semibold text-slate-400 mt-2">{metric.desc}</p>
					</div>
				))}
			</div>

			{/* Performance Chart Mock (Aesthetically Stunning SVG) */}
			<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-sm font-bold text-slate-800">Views & Subscribers Trends</h3>
						<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Performance over the past 30 days</p>
					</div>
					<div className="flex items-center space-x-4">
						<div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
							<span className="w-3 h-3 rounded-full bg-violet-500 block"></span>
							<span>Views</span>
						</div>
						<div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
							<span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
							<span>Subscribers</span>
						</div>
					</div>
				</div>

				<div className="w-full h-64 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
					{/* Grid Lines */}
					<div className="absolute inset-0 flex flex-col justify-between py-8 px-4 opacity-50">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="w-full border-t border-slate-200/60 border-dashed"></div>
						))}
					</div>

					{/* SVG Line Graph */}
					<svg className="w-full h-full z-10" viewBox="0 0 800 200" preserveAspectRatio="none">
						<defs>
							<linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2"/>
								<stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/>
							</linearGradient>
							<linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
								<stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
							</linearGradient>
						</defs>
						{/* Area under lines */}
						<path d="M 0 150 Q 150 80, 300 120 T 600 50 T 800 30 L 800 200 L 0 200 Z" fill="url(#violetGradient)" />
						<path d="M 0 180 Q 150 140, 300 160 T 600 90 T 800 70 L 800 200 L 0 200 Z" fill="url(#emeraldGradient)" />
						{/* Graph Lines */}
						<path d="M 0 150 Q 150 80, 300 120 T 600 50 T 800 30" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
						<path d="M 0 180 Q 150 140, 300 160 T 600 90 T 800 70" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
					</svg>

					{/* X Axis Labels */}
					<div className="absolute bottom-1.5 left-0 w-full flex justify-between px-6 text-[10px] font-black text-slate-400 tracking-wider">
						<span>JUL 15</span>
						<span>JUL 22</span>
						<span>JUL 29</span>
						<span>AUG 05</span>
						<span>AUG 11</span>
					</div>
				</div>
			</div>

			{/* Top Performing Videos Table */}
			<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
				<div>
					<h3 className="text-sm font-bold text-slate-800">Top Videos</h3>
					<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Videos ranked by highest views</p>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs font-semibold text-slate-600">
						<thead>
							<tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black tracking-wider uppercase">
								<th className="pb-3">Video Title</th>
								<th className="pb-3 text-center">Views</th>
								<th className="pb-3 text-center">Likes</th>
								<th className="pb-3 text-center">Comments</th>
								<th className="pb-3 text-right">Engagement</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-50">
							{[
								{ title: 'AI Studio Launch Walkthrough', views: '28.4K', likes: 1240, comments: 198, eng: '14.2%' },
								{ title: 'Facebook Automated Publishing Tutorial', views: '11.2K', likes: 890, comments: 112, eng: '9.8%' },
								{ title: 'NextJS Design Aesthetics Tips', views: '4.8K', likes: 320, comments: 45, eng: '8.1%' },
							].map((post, i) => (
								<tr key={i} className="hover:bg-slate-50/50 transition-colors">
									<td className="py-3.5 max-w-sm truncate text-slate-800 font-bold">{post.title}</td>
									<td className="py-3.5 text-center font-bold text-slate-900">{post.views}</td>
									<td className="py-3.5 text-center font-bold text-slate-900">{post.likes}</td>
									<td className="py-3.5 text-center font-bold text-slate-900">{post.comments}</td>
									<td className="py-3.5 text-right font-black text-violet-600">{post.eng}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
