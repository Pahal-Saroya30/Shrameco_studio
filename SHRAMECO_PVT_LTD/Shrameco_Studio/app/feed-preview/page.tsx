'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
	ThumbsUp,
	MessageSquare,
	Repeat2,
	Send,
	Globe,
	MoreHorizontal,
	CheckCircle,
	ArrowLeft,
	Youtube,
	Instagram,
	Linkedin,
} from 'lucide-react';
import Link from 'next/link';

function FeedPreviewInner() {
	const searchParams = useSearchParams();
	const platform = (searchParams.get('platform') || 'linkedin').toLowerCase();
	const accountName = searchParams.get('accountName') || 'Demo User';
	const caption = searchParams.get('caption') || 'Excited to announce our latest milestone and product roadmap!';
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [redirecting, setRedirecting] = useState(platform === 'youtube' || platform === 'instagram' || platform === 'linkedin');

	useEffect(() => {
		const stored = sessionStorage.getItem('feed_preview_media');
		if (stored) {
			setImageUrl(stored);
		} else {
			setImageUrl(searchParams.get('imageUrl') || null);
		}

		if (platform === 'youtube' || platform === 'instagram' || platform === 'linkedin') {
			setRedirecting(true);
			const resolveAndRedirect = async () => {
				try {
					const res = await fetch(`/api/social/schedule?t=${Date.now()}`);
					if (res.ok) {
						const data = await res.json();
						const posts = data.posts || [];
						
						const cleanCaption = caption.toLowerCase().trim();
						const matchedPost = posts.find((p: any) => {
							if (p.platform !== platform || p.status !== 'sent') return false;
							const pCap = p.caption.toLowerCase().trim();
							return pCap.includes(cleanCaption) || cleanCaption.includes(pCap) || 
								pCap.split('\n')[0].includes(cleanCaption.split('\n')[0]);
						});

						if (matchedPost && matchedPost.postUrl && !matchedPost.postUrl.includes('/feed-preview')) {
							window.location.href = matchedPost.postUrl;
							return;
						}
					}
				} catch (err) {
					console.warn(`Failed to auto-redirect ${platform} preview link:`, err);
				}
				setRedirecting(false);
			};
			resolveAndRedirect();
		}
	}, [searchParams, platform, caption]);

	const [liked, setLiked] = useState(false);
	const [likesCount, setLikesCount] = useState(42);

	const handleLike = () => {
		if (liked) {
			setLiked(false);
			setLikesCount((prev) => prev - 1);
		} else {
			setLiked(true);
			setLikesCount((prev) => prev + 1);
		}
	};

	if (redirecting) {
		const isYt = platform === 'youtube';
		const isLi = platform === 'linkedin';
		return (
			<div className="min-h-screen bg-[#0B0F19] text-zinc-100 flex flex-col items-center justify-center font-sans">
				<div className={`w-16 h-16 rounded-3xl flex items-center justify-center border mb-4 animate-pulse ${
					isYt 
						? 'bg-red-500/10 text-red-500 border-red-500/20' 
						: isLi
						? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
						: 'bg-pink-500/10 text-pink-500 border-pink-500/20'
				}`}>
					{isYt ? <Youtube className="w-8 h-8" /> : isLi ? <Linkedin className="w-8 h-8 fill-current" /> : <Instagram className="w-8 h-8" />}
				</div>
				<h2 className="text-base font-extrabold tracking-tight">Redirecting to {isYt ? 'YouTube' : isLi ? 'LinkedIn' : 'Instagram'}...</h2>
				<p className="text-xs text-zinc-500 mt-1.5 font-semibold">Opening the live post on your feed</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#F3F2EF] font-sans text-slate-900 pb-16">
			{/* Top Navigation Bar */}
			<header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
				<div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<Link
							href="/dashboard"
							className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all"
						>
							<ArrowLeft className="w-3.5 h-3.5" />
							<span>Back to Studio</span>
						</Link>
						<div className="h-4 w-px bg-slate-300" />
						<div className="flex items-center space-x-2">
							<div className="w-8 h-8 rounded-lg bg-[#0A66C2] text-white font-bold flex items-center justify-center text-xs">
								in
							</div>
							<span className="font-extrabold text-sm text-slate-900 tracking-tight">Simulated LinkedIn Feed</span>
						</div>
					</div>

					<span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
						Live Demo Broadcast Preview
					</span>
				</div>
			</header>

			{/* Main Feed Container */}
			<main className="max-w-xl mx-auto mt-6 px-4 space-y-4">
				{/* Success Banner */}
				<div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
					<div className="flex items-center space-x-2.5">
						<CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
						<span className="font-semibold">This post was successfully broadcasted to your campaign feed!</span>
					</div>
				</div>

				{/* Social Post Feed Card */}
				<article className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden animate-fade-in">
					{/* Post Header */}
					<div className="p-4 flex items-start justify-between">
						<div className="flex items-center space-x-3">
							<div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#3D8090] text-white font-bold text-sm flex items-center justify-center shadow-md">
								{accountName.charAt(0).toUpperCase()}
							</div>
							<div>
								<div className="flex items-center space-x-1.5">
									<h4 className="font-bold text-sm text-slate-900 hover:text-[#0A66C2] cursor-pointer">
										{accountName}
									</h4>
									<span className="text-[10px] text-slate-400 font-normal">• 1st</span>
								</div>
								<p className="text-xs text-slate-500 line-clamp-1">Product Leadership & Strategy</p>
								<div className="flex items-center space-x-1 text-[11px] text-slate-400 mt-0.5">
									<span>Just now</span>
									<span>•</span>
									<Globe className="w-3 h-3 text-slate-400" />
								</div>
							</div>
						</div>

						<button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
							<MoreHorizontal className="w-5 h-5" />
						</button>
					</div>

					{/* Post Body Caption */}
					<div className="px-4 pb-3 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
						{caption}
					</div>

					{/* Attached Media Graphic */}
					{imageUrl && (
						<div className="w-full bg-slate-950 border-y border-slate-100 overflow-hidden">
							<img src={imageUrl} alt="Attached Social Media Graphic" className="w-full h-auto object-cover max-h-[580px]" />
						</div>
					)}

					{/* Engagement Stats Bar */}
					<div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
						<div className="flex items-center space-x-1.5">
							<div className="w-4 h-4 rounded-full bg-[#0A66C2] text-white flex items-center justify-center text-[8px]">
								👍
							</div>
							<span className="font-medium">{likesCount} likes</span>
						</div>
						<div className="flex items-center space-x-3 text-[11px]">
							<span>8 comments</span>
							<span>•</span>
							<span>3 reposts</span>
						</div>
					</div>

					{/* Action Buttons Bar */}
					<div className="px-2 py-1 flex items-center justify-between text-xs font-semibold text-slate-600">
						<button
							onClick={handleLike}
							className={`flex-1 py-2.5 rounded-xl inline-flex items-center justify-center space-x-1.5 transition-colors ${
								liked ? 'text-[#0A66C2] bg-blue-50' : 'hover:bg-slate-100'
							}`}
						>
							<ThumbsUp className={`w-4 h-4 ${liked ? 'fill-[#0A66C2]' : ''}`} />
							<span>Like</span>
						</button>

						<button className="flex-1 py-2.5 rounded-xl inline-flex items-center justify-center space-x-1.5 hover:bg-slate-100 transition-colors">
							<MessageSquare className="w-4 h-4" />
							<span>Comment</span>
						</button>

						<button className="flex-1 py-2.5 rounded-xl inline-flex items-center justify-center space-x-1.5 hover:bg-slate-100 transition-colors">
							<Repeat2 className="w-4 h-4" />
							<span>Repost</span>
						</button>

						<button className="flex-1 py-2.5 rounded-xl inline-flex items-center justify-center space-x-1.5 hover:bg-slate-100 transition-colors">
							<Send className="w-4 h-4" />
							<span>Send</span>
						</button>
					</div>
				</article>
			</main>
		</div>
	);
}

export default function FeedPreviewPage() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center text-xs text-slate-500 font-bold">Loading Feed Preview...</div>}>
			<FeedPreviewInner />
		</Suspense>
	);
}
