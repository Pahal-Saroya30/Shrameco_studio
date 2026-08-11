'use client';

import React, { useState } from 'react';
import { CheckCircle, MoreVertical, ThumbsUp, MessageSquare, Share2, Video } from 'lucide-react';

interface FacebookVideoCardPreviewProps {
	companyName: string;
	captionText: string;
	videoUrl?: string | null;
}

export function FacebookVideoCardPreview({
	companyName,
	captionText,
	videoUrl,
}: FacebookVideoCardPreviewProps) {
	const [liked, setLiked] = useState(false);
	const [likesCount, setLikesCount] = useState(128);

	const handleLike = () => {
		if (liked) {
			setLiked(false);
			setLikesCount((prev) => prev - 1);
		} else {
			setLiked(true);
			setLikesCount((prev) => prev + 1);
		}
	};

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

			{/* Facebook 16:9 / 1:1 Standard Video Player Container */}
			<div className="relative w-full aspect-video bg-slate-950 border-y border-slate-200 overflow-hidden group flex items-center justify-center">
				{videoUrl ? (
					<video
						key={videoUrl}
						src={videoUrl}
						controls
						muted
						playsInline
						className="w-full h-full object-contain bg-black"
					/>
				) : (
					<div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-2 text-slate-400">
						<div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-1">
							<Video className="w-6 h-6" />
						</div>
						<p className="text-xs font-bold text-slate-700">Upload a video to see live Facebook video preview</p>
						<p className="text-[11px] text-slate-400">Supports 16:9 landscape, 1:1 square, or any standard video format</p>
					</div>
				)}
			</div>

			{/* Facebook Engagement & Reactions Bar */}
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
