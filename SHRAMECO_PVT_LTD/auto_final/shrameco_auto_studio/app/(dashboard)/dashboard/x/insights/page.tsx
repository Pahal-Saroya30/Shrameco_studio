'use client';

import React, { useState, useEffect } from 'react';
import { 
	Twitter, 
	ArrowUpRight, 
	ArrowDownRight, 
	BarChart3,
} from 'lucide-react';
import Link from 'next/link';

export default function XInsights() {
	const [accountName, setAccountName] = useState<string>('Test01');

	useEffect(() => {
		const fetchAccount = async () => {
			try {
				const res = await fetch('/api/social/accounts');
				const data = await res.json();
				if (res.ok && data.accounts) {
					const xAccount = data.accounts.find((a: any) => a.platform === 'x' && a.connected);
					if (xAccount) {
						setAccountName(xAccount.accountName);
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
					<div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center shadow-xs">
						<BarChart3 className="w-6 h-6 text-slate-800" />
					</div>
					<div>
						<h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
							<span>X Insights</span>
							<span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/50">Metrics</span>
						</h1>
						<p className="text-xs font-bold text-slate-400">Detailed performance analysis and audience demographics for {accountName}</p>
					</div>
				</div>

				<div className="flex items-center space-x-2">
					<Link 
						href="/dashboard/x" 
						className="px-4 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs"
					>
						<Twitter className="w-4 h-4 text-slate-900" />
						<span>Back to Studio</span>
					</Link>
				</div>
			</div>

			{/* Core Metric Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{[
					{ label: 'Weekly Impressions', value: '18.2K', change: '+32.4%', up: true, desc: 'Total Tweet impressions' },
					{ label: 'Engagement Rate', value: '3.8%', change: '+0.4%', up: true, desc: 'Likes, Retweets, replies & link clicks' },
					{ label: 'Profile Visits', value: '820', change: '-1.2%', up: false, desc: 'Visits to profile page' },
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
						<h3 className="text-sm font-bold text-slate-800">Impressions & Engagements Trends</h3>
						<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Performance over the past 30 days</p>
					</div>
					<div className="flex items-center space-x-4">
						<div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
							<span className="w-3 h-3 rounded-full bg-slate-800 block"></span>
							<span>Impressions</span>
						</div>
						<div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
							<span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
							<span>Engagements</span>
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
							<linearGradient id="slateGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#1f2937" stopOpacity="0.2"/>
								<stop offset="100%" stopColor="#1f2937" stopOpacity="0"/>
							</linearGradient>
							<linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
								<stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
							</linearGradient>
						</defs>
						{/* Area under lines */}
						<path d="M 0 120 Q 150 50, 300 90 T 600 20 T 800 10 L 800 200 L 0 200 Z" fill="url(#slateGradient)" />
						<path d="M 0 150 Q 150 110, 300 130 T 600 60 T 800 40 L 800 200 L 0 200 Z" fill="url(#emeraldGradient)" />
						{/* Graph Lines */}
						<path d="M 0 120 Q 150 50, 300 90 T 600 20 T 800 10" fill="none" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
						<path d="M 0 150 Q 150 110, 300 130 T 600 60 T 800 40" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
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

			{/* Top Performing Posts Table */}
			<div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
				<div>
					<h3 className="text-sm font-bold text-slate-800">Top Performing Tweets</h3>
					<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Tweets ranked by highest engagement rate</p>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs font-semibold text-slate-600">
						<thead>
							<tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black tracking-wider uppercase">
								<th className="pb-3">Tweet Text</th>
								<th className="pb-3 text-center">Likes</th>
								<th className="pb-3 text-center">Retweets</th>
								<th className="pb-3 text-center">Replies</th>
								<th className="pb-3 text-right">Engagement</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-50">
							{[
								{ caption: '🚀 Introducing Shui Studio: an automated brand content composer that creates 3 variations for connected channels concurrently!', likes: 112, comments: 24, replies: 14, eng: '6.4%' },
								{ caption: 'Automation isn\'t about replacing brand voice. It\'s about freeing up creative bandwidth to scale operations.', likes: 64, comments: 16, replies: 8, eng: '5.1%' },
								{ caption: 'What is your single biggest bottleneck when scaling organic social traffic?', likes: 45, comments: 28, replies: 21, eng: '4.8%' },
							].map((post, i) => (
								<tr key={i} className="hover:bg-slate-50/50 transition-colors">
									<td className="py-3.5 max-w-sm truncate text-slate-800 font-bold">{post.caption}</td>
									<td className="py-3.5 text-center font-bold text-slate-900">{post.likes}</td>
									<td className="py-3.5 text-center font-bold text-slate-900">{post.comments}</td>
									<td className="py-3.5 text-center font-bold text-slate-900">{post.replies}</td>
									<td className="py-3.5 text-right font-black text-slate-900">{post.eng}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
