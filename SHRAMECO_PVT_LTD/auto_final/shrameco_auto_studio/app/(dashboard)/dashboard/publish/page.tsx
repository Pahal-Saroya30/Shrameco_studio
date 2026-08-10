'use client';

import React from 'react';
import Link from 'next/link';
import {
	List,
	CalendarDays,
	Plus,
	Tag,
	Globe,
	Settings,
	HelpCircle,
	Zap
} from 'lucide-react';

export default function PublishQueuePage() {
	return (
		<div className="p-8 max-w-5xl mx-auto min-h-screen text-slate-900">
			{/* Top Header */}
			<div className="flex items-center justify-between mb-8">
				<div className="flex items-center space-x-3">
					<div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center">
						<span className="font-bold text-slate-600 text-lg">S</span>
					</div>
					<div>
						<div className="flex items-center space-x-2">
							<h1 className="text-2xl font-bold tracking-tight text-slate-900">Shrameco</h1>
							<Tag className="w-4 h-4 text-slate-400" />
							<Settings className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
						</div>
						<p className="text-sm font-medium text-slate-500 flex items-center mt-1">
							<Zap className="w-3.5 h-3.5 mr-1 text-emerald-500" />
							Set a posting goal
						</p>
					</div>
				</div>

				<div className="flex items-center space-x-4">
					<div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-1 bg-white shadow-sm">
						<button className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 rounded-md text-sm font-semibold">
							<List className="w-4 h-4" />
							<span>List</span>
						</button>
						<button className="flex items-center space-x-1.5 px-3 py-1.5 text-slate-500 hover:text-slate-800 rounded-md text-sm font-semibold transition-colors">
							<CalendarDays className="w-4 h-4" />
							<span>Calendar</span>
						</button>
					</div>
					<Link href="/dashboard/create" className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center space-x-1.5 transition-colors shadow-sm">
						<Plus className="w-4 h-4" />
						<span>New Post</span>
					</Link>
				</div>
			</div>

			{/* Sub-navigation & Filters */}
			<div className="flex items-center justify-between border-b border-slate-200 mb-8 pb-3">
				<div className="flex items-center space-x-6">
					<button className="text-slate-900 font-bold text-sm border-b-2 border-slate-900 pb-3 -mb-[14px]">
						Queue <span className="ml-1.5 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">0</span>
					</button>
					<button className="text-slate-500 hover:text-slate-800 font-semibold text-sm transition-colors">
						Drafts <span className="ml-1.5 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">0</span>
					</button>
					<button className="text-slate-500 hover:text-slate-800 font-semibold text-sm transition-colors flex items-center">
						Approvals <Zap className="w-3 h-3 ml-1 text-purple-500" />
					</button>
					<button className="text-slate-500 hover:text-slate-800 font-semibold text-sm transition-colors">
						Sent <span className="ml-1.5 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">1</span>
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
			<div className="space-y-12">
				{/* Day 1 */}
				<div>
					<h2 className="text-lg font-bold text-slate-800 mb-6">Tomorrow, <span className="font-medium text-slate-500">6 August</span></h2>
					<div className="space-y-4">
						{['8:31 AM', '9:46 AM', '10:33 AM', '11:49 AM'].map((time) => (
							<div key={time} className="flex items-center group">
								<div className="w-24 text-sm font-bold text-slate-500">{time}</div>
								<Link href="/dashboard/create" className="flex-1 bg-white border border-dashed border-slate-300 hover:border-slate-400 rounded-xl h-14 flex items-center px-4 cursor-pointer transition-all group-hover:bg-slate-50">
									<div className="flex items-center space-x-2 text-slate-400 group-hover:text-slate-600 font-bold text-sm">
										<Plus className="w-4 h-4" />
										<span>New</span>
									</div>
								</Link>
							</div>
						))}
					</div>
				</div>

				{/* Day 2 */}
				<div>
					<h2 className="text-lg font-bold text-slate-800 mb-6">Friday, <span className="font-medium text-slate-500">7 August</span></h2>
					<div className="space-y-4">
						{['8:53 AM', '9:38 AM', '10:22 AM'].map((time) => (
							<div key={time} className="flex items-center group">
								<div className="w-24 text-sm font-bold text-slate-500">{time}</div>
								<Link href="/dashboard/create" className="flex-1 bg-white border border-dashed border-slate-300 hover:border-slate-400 rounded-xl h-14 flex items-center px-4 cursor-pointer transition-all group-hover:bg-slate-50">
									<div className="flex items-center space-x-2 text-slate-400 group-hover:text-slate-600 font-bold text-sm">
										<Plus className="w-4 h-4" />
										<span>New</span>
									</div>
								</Link>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Floating Help Button */}
			<div className="fixed bottom-6 right-6">
				<button className="w-10 h-10 rounded-full bg-slate-800 text-white shadow-lg flex items-center justify-center hover:bg-slate-700 transition-colors">
					<HelpCircle className="w-5 h-5" />
				</button>
			</div>
		</div>
	);
}
