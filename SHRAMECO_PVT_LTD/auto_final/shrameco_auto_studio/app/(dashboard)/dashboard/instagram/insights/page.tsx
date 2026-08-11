'use client';

import React, { useState, useEffect } from 'react';
import { 
	Instagram, 
	ArrowUpRight, 
	ArrowDownRight, 
	BarChart3,
	Heart,
	MessageCircle,
	Bookmark,
} from 'lucide-react';
import Link from 'next/link';

export default function InstagramInsights() {
	const [accountName, setAccountName] = useState<string>('Test01');

	useEffect(() => {
		const fetchAccount = async () => {
			try {
				const res = await fetch('/api/social/accounts');
				const data = await res.json();
				if (res.ok && data.accounts) {
					const instAccount = data.accounts.find((a: any) => a.platform === 'instagram' && a.connected);
					if (instAccount) {
						setAccountName(instAccount.accountName);
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
					<div className="w-12 h-12 bg-pink-50 border border-pink-100 rounded-2xl flex items-center justify-center shadow-xs">
						<BarChart3 className="w-6 h-6 text-pink-600" />
					</div>
					<div>
						<h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
							<span>Instagram Insights</span>
							<span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-pink-100/80 text-pink-700 border border-pink-200/50">Metrics</span>
						</h1>
						<p className="text-xs font-bold text-slate-400">Detailed performance analysis and audience demographics for {accountName}</p>
					</div>
				</div>

				<div className="flex items-center space-x-2">
					<Link 
						href="/dashboard/instagram" 
						className="px-4 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs"
					>
						<Instagram className="w-4 h-4 text-pink-600" />
						<span>Back to Studio</span>
					</Link>
				</div>
			</div>

			{/* Core Metric Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{[
					{ label: 'Weekly Impressions', value: '8,420', change: '+15.2%', up: true, desc: 'Total content views' },
					{ label: 'Engagement Rate', value: '5.2%', change: '+1.1%', up: true, desc: 'Likes, comments & saves' },
					{ label: 'Net Followers', value: '+34', change: '-2.4%', up: false, desc: 'New net followers' },
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
						<h3 className="text-sm font-bold text-slate-800">Impressions & Likes Trends</h3>
						<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Performance over the past 30 days</p>
					</div>
					<div className="flex items-center space-x-4">
						<div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
							<span className="w-3 h-3 rounded-full bg-pink-500 block"></span>
							<span>Impressions</span>
						</div>
						<div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
							<span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
							<span>Likes</span>
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
							<linearGradient id="pinkGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#ec4899" stopOpacity="0.2"/>
								<stop offset="100%" stopColor="#ec4899" stopOpacity="0"/>
							</linearGradient>
							<linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
								<stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
							</linearGradient>
						</defs>
						{/* Area under lines */}
						<path d="M 0 140 Q 150 70, 300 110 T 600 40 T 800 20 L 800 200 L 0 200 Z" fill="url(#pinkGradient)" />
						<path d="M 0 170 Q 150 130, 300 150 T 600 80 T 800 60 L 800 200 L 0 200 Z" fill="url(#emeraldGradient)" />
						{/* Graph Lines */}
						<path d="M 0 140 Q 150 70, 300 110 T 600 40 T 800 20" fill="none" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />
						<path d="M 0 170 Q 150 130, 300 150 T 600 80 T 800 60" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
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
					<h3 className="text-sm font-bold text-slate-800">Top Performing Posts</h3>
					<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Posts ranked by highest engagement rate</p>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs font-semibold text-slate-600">
						<thead>
							<tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black tracking-wider uppercase">
								<th className="pb-3">Post Caption</th>
								<th className="pb-3 text-center">Likes</th>
								<th className="pb-3 text-center">Comments</th>
								<th className="pb-3 text-center">Saves</th>
								<th className="pb-3 text-right">Engagement</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-50">
							{[
								{ caption: '📸 Check out our latest travel collection and start exploring...', likes: 142, comments: 24, saves: 18, eng: '8.4%' },
								{ caption: 'Find your perfect vacation spot with our custom planner!', likes: 98, comments: 16, saves: 11, eng: '6.9%' },
								{ caption: 'Sunrise hikes are worth every early morning wake-up call.', likes: 112, comments: 8, saves: 5, eng: '5.8%' },
							].map((post, i) => (
								<tr key={i} className="hover:bg-slate-50/50 transition-colors">
									<td className="py-3.5 max-w-sm truncate text-slate-800 font-bold">{post.caption}</td>
									<td className="py-3.5 text-center font-bold text-slate-900">{post.likes}</td>
									<td className="py-3.5 text-center font-bold text-slate-900">{post.comments}</td>
									<td className="py-3.5 text-center font-bold text-slate-900">{post.saves}</td>
									<td className="py-3.5 text-right font-black text-pink-600">{post.eng}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
