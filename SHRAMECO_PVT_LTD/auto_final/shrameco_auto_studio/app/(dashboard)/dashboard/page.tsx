'use client';

import React from 'react';
import {
	Moon,
	MessageCircle,
	CheckCircle2,
	Code2,
	CalendarDays,
	MessageSquare,
	HelpCircle,
	Cloud,
	Plus
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardHome() {
	const currentDate = new Date().toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});

	return (
		<div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
			{/* Header Row */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
						<Moon className="w-6 h-6 text-amber-500 fill-amber-500" />
					</div>
					<div>
						<h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">Good Evening, shravan3333m!</h1>
						<p className="text-sm font-semibold text-slate-400">{currentDate}</p>
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
					<div className="w-12 h-12 rounded-full border-2 border-indigo-100 flex items-center justify-center bg-indigo-50">
						<span className="text-lg font-bold text-indigo-600">1</span>
					</div>
					<div>
						<div className="flex items-center space-x-1">
							<h3 className="font-bold text-slate-800 text-sm">Week Streak</h3>
							<HelpCircle className="w-3.5 h-3.5 text-slate-400" />
						</div>
						<p className="text-xs text-slate-500 mt-0.5">Streak hit, well done!</p>
					</div>
				</div>

				<div className="flex-1 flex items-center space-x-4 border-r border-slate-100 px-8">
					<div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
						<span className="text-lg font-bold text-slate-400">0</span>
					</div>
					<div>
						<div className="flex items-center space-x-1">
							<h3 className="font-bold text-slate-800 text-sm">Posting Goals</h3>
							<HelpCircle className="w-3.5 h-3.5 text-slate-400" />
						</div>
						<p className="text-xs text-slate-500 mt-0.5">No goals yet</p>
					</div>
				</div>

				<div className="flex-1 flex items-center space-x-4 px-8">
					<div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
						<span className="text-lg font-bold text-slate-400">0</span>
					</div>
					<div>
						<div className="flex items-center space-x-1">
							<h3 className="font-bold text-slate-800 text-sm">Comment Score</h3>
							<HelpCircle className="w-3.5 h-3.5 text-slate-400" />
						</div>
						<p className="text-xs text-slate-500 mt-0.5">Same as last week</p>
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
							<CheckCircle2 className="w-4 h-4 text-slate-300" />
						</div>
						<p className="text-xs text-slate-500 mb-6 flex-1">
							Personalize your profile to make the most out of Studio.
						</p>
						<button className="self-start inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors">
							<Plus className="w-3.5 h-3.5" />
							<span>Connect Channel</span>
						</button>
					</div>

					{/* Card 2 */}
					<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
						<div className="flex items-start justify-between mb-2">
							<h3 className="font-bold text-slate-800 text-sm">2. Create a post</h3>
							<CheckCircle2 className="w-4 h-4 text-slate-300" />
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
							<h3 className="font-bold text-slate-800 text-sm">3. Explore Studio API</h3>
							<CheckCircle2 className="w-4 h-4 text-slate-300" />
						</div>
						<p className="text-xs text-slate-500 mb-6 flex-1">
							Connect to your agents, automation tools, and more.
						</p>
						<button className="self-start inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors">
							<Code2 className="w-3.5 h-3.5" />
							<span>Get Started</span>
						</button>
					</div>
				</div>
			</div>

			{/* Activity Split Section */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Up Next */}
				<div>
					<div className="flex items-center justify-between mb-4 px-2">
						<h2 className="text-sm font-bold text-slate-800">Up Next</h2>
						<span className="text-xs text-slate-400 font-medium">0 posts scheduled</span>
					</div>
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
				</div>

				{/* Comments */}
				<div>
					<div className="flex items-center justify-between mb-4 px-2">
						<h2 className="text-sm font-bold text-slate-800">Comments</h2>
						<span className="text-xs text-slate-400 font-medium">0 unanswered</span>
					</div>
					<div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm flex flex-col items-center justify-center text-center h-[280px]">
						<div className="w-14 h-14 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center mb-4">
							<MessageSquare className="w-6 h-6 text-slate-400" />
						</div>
						<p className="text-sm font-bold text-slate-800 mb-1">No comments yet.</p>
						<p className="text-xs text-slate-500">You'll see the latest comments here.</p>
					</div>
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
