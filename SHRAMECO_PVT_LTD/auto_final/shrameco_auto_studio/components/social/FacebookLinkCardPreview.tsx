'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, MoreVertical, ThumbsUp, MessageSquare, Share2, ExternalLink } from 'lucide-react';

interface FacebookLinkCardPreviewProps {
	companyName: string;
	captionText: string;
	destinationUrl: string;
	ogData?: {
		title?: string;
		image?: string | null;
		domain?: string;
	} | null;
	isLoadingOg?: boolean;
}

export function FacebookLinkCardPreview({
	companyName,
	captionText,
	destinationUrl,
	ogData: externalOgData,
	isLoadingOg: externalIsLoading,
}: FacebookLinkCardPreviewProps) {
	const [liked, setLiked] = useState(false);
	const [likesCount, setLikesCount] = useState(128);

	const [internalOgData, setInternalOgData] = useState<{ title?: string; image?: string | null; domain?: string } | null>(null);
	const [internalIsLoading, setInternalIsLoading] = useState(false);

	// Self-fetch Open Graph metadata if not provided by parent
	useEffect(() => {
		if (externalOgData !== undefined) return;

		let isMounted = true;
		if (destinationUrl && destinationUrl.trim()) {
			setInternalIsLoading(true);
			fetch(`/api/og-metadata?url=${encodeURIComponent(destinationUrl.trim())}`)
				.then((res) => res.json())
				.then((data) => {
					if (isMounted) {
						setInternalOgData(data);
						setInternalIsLoading(false);
					}
				})
				.catch((err) => {
					if (isMounted) {
						console.warn('FacebookLinkCardPreview fetch warning:', err);
						setInternalIsLoading(false);
					}
				});
		} else {
			setInternalOgData(null);
			setInternalIsLoading(false);
		}

		return () => {
			isMounted = false;
		};
	}, [destinationUrl, externalOgData]);

	const handleLike = () => {
		if (liked) {
			setLiked(false);
			setLikesCount((prev) => prev - 1);
		} else {
			setLiked(true);
			setLikesCount((prev) => prev + 1);
		}
	};

	const ogData = externalOgData !== undefined ? externalOgData : internalOgData;
	const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;

	// Derive display domain
	let domain = 'example.com';
	try {
		const parsed = new URL(/^https?:\/\//i.test(destinationUrl) ? destinationUrl : 'https://' + destinationUrl);
		domain = parsed.hostname.replace(/^www\./i, '');
	} catch (e) {}

	const displayDomain = (ogData?.domain || domain).toUpperCase();
	const displayTitle = ogData?.title || `${domain.charAt(0).toUpperCase() + domain.slice(1)} - Official Site`;

	return (
		<div className="w-full max-w-[500px] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden font-sans text-slate-900 animate-fade-in transition-all">
			{/* Facebook Post Header */}
			<div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white">
				<div className="flex items-center space-x-3">
					<div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1877F2] to-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md ring-2 ring-blue-100 flex-shrink-0">
						{(companyName || 'A').charAt(0).toUpperCase()}
					</div>
					<div>
						<div className="flex items-center space-x-1.5">
							<span className="font-bold text-sm text-slate-900">{companyName || 'aravalli travels'}</span>
							<CheckCircle className="w-4 h-4 fill-[#1877F2] text-white flex-shrink-0" />
						</div>
						<div className="flex items-center space-x-1 text-xs text-slate-400 font-medium">
							<span>Just now</span>
							<span>•</span>
							<span className="text-slate-500">🌐 Public</span>
							<span>•</span>
							<span className="text-[#1877F2] font-bold">Facebook</span>
						</div>
					</div>
				</div>

				<button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
					<MoreVertical className="w-4 h-4" />
				</button>
			</div>

			{/* Facebook Post Caption Text */}
			{captionText && (
				<div className="px-4 py-3 text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line bg-white">
					{captionText}
				</div>
			)}

			{/* Facebook Attached Link Preview Card */}
			<a
				href={/^https?:\/\//i.test(destinationUrl) ? destinationUrl : 'https://' + destinationUrl}
				target="_blank"
				rel="noopener noreferrer"
				className="block w-full border-y border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 transition-colors cursor-pointer group"
			>
				{isLoading ? (
					<div className="h-44 flex flex-col items-center justify-center space-y-2 bg-slate-100 border-b border-slate-200">
						<div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
						<span className="text-xs font-semibold text-slate-500">Fetching link preview metadata...</span>
					</div>
				) : ogData?.image ? (
					<div className="relative w-full h-48 sm:h-56 bg-slate-900 overflow-hidden">
						<img src={ogData.image} alt={displayTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
					</div>
				) : (
					/* Clean Professional Fallback Banner (No empty globe placeholder icon) */
					<div className="h-32 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 border-b border-slate-800 p-5 flex flex-col justify-between text-white relative overflow-hidden">
						<div className="absolute right-3 top-3 text-white/10 font-black text-6xl select-none pointer-events-none">
							🌐
						</div>
						<span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-400/30 w-fit">
							{displayDomain}
						</span>
						<h3 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug drop-shadow-md">
							{displayTitle}
						</h3>
					</div>
				)}

				{/* Link Meta Details Footer */}
				<div className="p-3.5 bg-[#F2F4F7] border-t border-slate-200/60 space-y-1">
					<div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate flex items-center space-x-1">
						<span>{displayDomain}</span>
						<ExternalLink className="w-3 h-3 text-slate-400" />
					</div>
					<h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
						{displayTitle}
					</h4>
				</div>
			</a>

			{/* Facebook Engagement Bar */}
			<div className="px-4 py-2.5 flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 bg-white">
				<div className="flex items-center space-x-1.5">
					<div className="flex -space-x-1">
						<span className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[10px] font-black shadow-sm ring-1 ring-white">👍</span>
						<span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black shadow-sm ring-1 ring-white">❤️</span>
					</div>
					<span className="font-semibold text-slate-700">{likesCount}</span>
				</div>
				<div className="flex items-center space-x-3 font-medium text-slate-500">
					<span>12 comments</span>
					<span>•</span>
					<span>5 shares</span>
				</div>
			</div>

			{/* Facebook Action Buttons */}
			<div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50 py-1">
				<button
					onClick={handleLike}
					className={`py-2 flex items-center justify-center space-x-2 text-xs font-bold transition-all hover:bg-slate-100 ${
						liked ? 'text-[#1877F2]' : 'text-slate-600 hover:text-slate-900'
					}`}
				>
					<ThumbsUp className={`w-4 h-4 ${liked ? 'fill-[#1877F2]' : ''}`} />
					<span>Like</span>
				</button>
				<button className="py-2 flex items-center justify-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-all hover:bg-slate-100">
					<MessageSquare className="w-4 h-4" />
					<span>Comment</span>
				</button>
				<button className="py-2 flex items-center justify-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-all hover:bg-slate-100">
					<Share2 className="w-4 h-4" />
					<span>Share</span>
				</button>
			</div>
		</div>
	);
}
