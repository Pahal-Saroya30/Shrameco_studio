'use client';

import React, { useState } from 'react';
import { CheckCircle, MoreVertical, ThumbsUp, MessageSquare, Share2, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface FacebookCarouselCardPreviewProps {
	companyName: string;
	captionText: string;
	images: string[];
}

export function FacebookCarouselCardPreview({
	companyName,
	captionText,
	images,
}: FacebookCarouselCardPreviewProps) {
	const [liked, setLiked] = useState(false);
	const [likesCount, setLikesCount] = useState(128);
	const [currentIndex, setCurrentIndex] = useState(0);

	const handleLike = () => {
		if (liked) {
			setLiked(false);
			setLikesCount((prev) => prev - 1);
		} else {
			setLiked(true);
			setLikesCount((prev) => prev + 1);
		}
	};

	const handlePrev = (e: React.MouseEvent) => {
		e.stopPropagation();
		setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
	};

	const handleNext = (e: React.MouseEvent) => {
		e.stopPropagation();
		setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
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

			{/* Facebook Interactive Carousel Image Container */}
			<div className="relative w-full aspect-[4/5] sm:aspect-square bg-slate-100 border-y border-slate-200 overflow-hidden group">
				{images && images.length > 0 ? (
					<>
						<img
							src={images[currentIndex] || images[0]}
							alt={`Carousel Slide ${currentIndex + 1}`}
							className="w-full h-full object-cover transition-all duration-300"
						/>

						{/* Left Navigation Arrow */}
						{images.length > 1 && (
							<button
								type="button"
								onClick={handlePrev}
								aria-label="Previous Carousel Slide"
								className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-lg cursor-pointer hover:scale-110 active:scale-95"
							>
								<ChevronLeft className="w-5 h-5" />
							</button>
						)}

						{/* Right Navigation Arrow */}
						{images.length > 1 && (
							<button
								type="button"
								onClick={handleNext}
								aria-label="Next Carousel Slide"
								className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-lg cursor-pointer hover:scale-110 active:scale-95"
							>
								<ChevronRight className="w-5 h-5" />
							</button>
						)}

						{/* Slide Counter Pill */}
						{images.length > 1 && (
							<div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/20 shadow-md">
								{currentIndex + 1} / {images.length}
							</div>
						)}

						{/* Pagination Indicator Dots */}
						{images.length > 1 && (
							<div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
								{images.map((_, idx) => (
									<button
										key={idx}
										type="button"
										onClick={() => setCurrentIndex(idx)}
										className={`h-2 rounded-full transition-all cursor-pointer ${
											currentIndex === idx ? 'w-5 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
										}`}
										aria-label={`Go to slide ${idx + 1}`}
									/>
								))}
							</div>
						)}
					</>
				) : (
					<div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-2 text-slate-400">
						<Layers className="w-10 h-10 text-slate-300" />
						<p className="text-xs font-bold text-slate-600">Upload at least 2 photos to see carousel preview</p>
						<p className="text-[11px] text-slate-400">Users can swipe through 2 to 10 attached photos</p>
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
