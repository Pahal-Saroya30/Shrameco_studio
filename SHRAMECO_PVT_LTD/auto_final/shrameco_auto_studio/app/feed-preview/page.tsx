'use client';

import React, { useState, Suspense } from 'react';
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
	Play,
	Music,
	Heart,
	Share2,
	Volume2,
} from 'lucide-react';
import Link from 'next/link';
import { FacebookPostCardPreview } from '@/components/social/FacebookPostCardPreview';
import { FacebookLinkCardPreview } from '@/components/social/FacebookLinkCardPreview';
import { FacebookCarouselCardPreview } from '@/components/social/FacebookCarouselCardPreview';
import { FacebookVideoCardPreview } from '@/components/social/FacebookVideoCardPreview';
import { getMediaBlob } from '@/lib/mediaStorage';

function FeedPreviewInner() {
	const searchParams = useSearchParams();
	const platform = (searchParams.get('platform') || 'facebook').toLowerCase();
	const format = (searchParams.get('format') || searchParams.get('contentFormat') || 'post').toLowerCase();
	const [sessionImage, setSessionImage] = React.useState<string | null>(null);
	const [sessionVideo, setSessionVideo] = React.useState<string | null>(null);
	const [sessionAccount, setSessionAccount] = React.useState<string | null>(null);
	const [sessionCaption, setSessionCaption] = React.useState<string | null>(null);
	const [sessionCarouselImages, setSessionCarouselImages] = React.useState<string[]>([]);
	const [isPlaying, setIsPlaying] = React.useState(true);

	React.useEffect(() => {
		try {
			const storedImg = sessionStorage.getItem('latest_published_image');
			if (storedImg) setSessionImage(storedImg);
			const storedVid = sessionStorage.getItem('latest_published_video');
			if (storedVid) setSessionVideo(storedVid);
			const storedAcc = sessionStorage.getItem('latest_published_account');
			if (storedAcc) setSessionAccount(storedAcc);
			const storedCap = sessionStorage.getItem('latest_published_caption');
			if (storedCap) setSessionCaption(storedCap);
			const storedCarousel = sessionStorage.getItem('latest_published_carousel_images');
			if (storedCarousel) {
				try {
					setSessionCarouselImages(JSON.parse(storedCarousel));
				} catch (e) {}
			}
		} catch (e) {}

		// Load cross-tab video Blob from IndexedDB
		getMediaBlob('latest_published_video_blob').then((blob) => {
			if (blob) {
				const blobUrl = URL.createObjectURL(blob);
				setSessionVideo(blobUrl);
			}
		});
	}, []);

	const rawAccName = searchParams.get('accountName');
	const accountName = rawAccName && !rawAccName.toLowerCase().includes('demo user') ? rawAccName : (sessionAccount || 'aravalli travels');
	const captionParam = searchParams.get('caption');
	const caption = sessionCaption || captionParam || 'Excited to announce our latest milestone!';

	const imageUrl = searchParams.get('imageUrl') || sessionImage || null;
	const videoUrl = searchParams.get('videoUrl') || sessionVideo || null;

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

	const platformMeta: Record<string, { label: string; accent: string; initial: string }> = {
		facebook: { label: 'Facebook', accent: '#1877F2', initial: 'fb' },
		instagram: { label: 'Instagram', accent: '#E1306C', initial: 'ig' },
		x: { label: 'X (Twitter)', accent: '#111827', initial: 'x' },
		linkedin: { label: 'LinkedIn', accent: '#0A66C2', initial: 'in' },
	};
	const currentMeta = platformMeta[platform] || { label: platform.toUpperCase(), accent: '#0A66C2', initial: platform.charAt(0) };

	return (
		<div className="min-h-screen bg-[#F3F2EF] font-sans text-slate-900 pb-16">
			{/* Top Navigation Bar */}
			<header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
				<div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<Link
							href="/dashboard/create"
							className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all"
						>
							<ArrowLeft className="w-3.5 h-3.5" />
							<span>Back to Studio</span>
						</Link>
						<div className="h-4 w-px bg-slate-300" />
						<div className="flex items-center space-x-2">
							<div
								className="w-8 h-8 rounded-lg text-white font-extrabold flex items-center justify-center text-xs shadow-sm"
								style={{ backgroundColor: currentMeta.accent }}
							>
								{currentMeta.initial}
							</div>
							<span className="font-extrabold text-sm text-slate-900 tracking-tight">
								Simulated {currentMeta.label} Feed
							</span>
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
						<span className="font-semibold">
							This {format === 'reel' ? 'Reel' : 'post'} was successfully broadcasted to your {currentMeta.label} feed!
						</span>
					</div>
				</div>

				{format === 'reel' || format === 'story' ? (
					/* Mobile 9:16 Vertical Reel Player Card */
					<div className="relative w-full aspect-[9/16] max-w-[390px] mx-auto bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between text-white animate-fade-in group">
						{/* Background Media / Reel Video Player */}
						{videoUrl ? (
							<video
								src={videoUrl}
								controls
								autoPlay
								muted
								loop
								playsInline
								onError={(e) => {
									const target = e.currentTarget;
									if (!target.dataset.fallback) {
										target.dataset.fallback = 'true';
										target.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
										target.load();
										target.play().catch(() => {});
									}
								}}
								className="absolute inset-0 w-full h-full object-cover"
							/>
						) : imageUrl ? (
							<img src={imageUrl} alt="Reel Graphic" className="absolute inset-0 w-full h-full object-cover" />
						) : (
							<div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black flex items-center justify-center">
								<span className="text-xs text-slate-500 font-bold">9:16 Reel Media Preview</span>
							</div>
						)}

						{/* Dark Gradient Overlay */}
						<div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

						{/* Top Header Bar */}
						<div className="relative z-10 p-4 flex items-center justify-between pointer-events-none">
							<div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
								<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
								<span className="text-[11px] font-bold tracking-wider uppercase">Reel • {currentMeta.label}</span>
							</div>
							<div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10">
								<Volume2 className="w-4 h-4 text-white" />
							</div>
						</div>

						{/* Bottom Overlay Info & Right Floating Actions */}
						<div className="relative z-10 p-4 flex items-end justify-between pointer-events-none">
							{/* Left Account & Caption Details */}
							<div className="flex-1 pr-4 space-y-2">
								<div className="flex items-center space-x-2.5">
									<div
										className="w-9 h-9 rounded-full text-white font-extrabold text-xs flex items-center justify-center shadow-lg ring-2 ring-white/30"
										style={{ backgroundColor: currentMeta.accent }}
									>
										{accountName.charAt(0).toUpperCase()}
									</div>
									<span className="font-bold text-sm text-white drop-shadow-md">{accountName}</span>
									<button className="text-[10px] font-extrabold bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded-full text-white backdrop-blur-md border border-white/20">
										Follow
									</button>
								</div>

								{caption && (
									<p className="text-xs font-semibold text-slate-100 line-clamp-3 leading-snug drop-shadow-md whitespace-pre-line">
										{caption}
									</p>
								)}
							</div>

							{/* Right Floating Engagement Buttons */}
							<div className="flex flex-col items-center space-y-4 text-white pb-1">
								<button onClick={handleLike} className="flex flex-col items-center space-y-1 group/like">
									<div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-transform group-hover/like:scale-110 ${liked ? 'bg-red-500/20 border-red-500/40 text-red-500' : 'bg-black/40 border-white/10 text-white'}`}>
										<Heart className={`w-5 h-5 ${liked ? 'fill-red-500' : ''}`} />
									</div>
									<span className="text-[10px] font-bold">{likesCount}</span>
								</button>

								<div className="flex flex-col items-center space-y-1">
									<div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center">
										<MessageSquare className="w-5 h-5 text-white" />
									</div>
									<span className="text-[10px] font-bold">24</span>
								</div>

								<div className="flex flex-col items-center space-y-1">
									<div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center">
										<Share2 className="w-5 h-5 text-white" />
									</div>
									<span className="text-[10px] font-bold">Share</span>
								</div>
							</div>
						</div>
					</div>
				) : format === 'link' ? (
					<div className="flex justify-center">
						<FacebookLinkCardPreview
							companyName={accountName}
							captionText={caption}
							destinationUrl={searchParams.get('linkUrl') || 'https://shrameco.com'}
						/>
					</div>
				) : format === 'carousel' ? (
					<div className="flex justify-center">
						<FacebookCarouselCardPreview
							companyName={accountName}
							captionText={caption}
							images={sessionCarouselImages.length > 0 ? sessionCarouselImages : (sessionImage ? [sessionImage] : [])}
						/>
					</div>
				) : format === 'video' ? (
					<div className="flex justify-center">
						<FacebookVideoCardPreview
							companyName={accountName}
							captionText={caption}
							videoUrl={videoUrl}
						/>
					</div>
				) : (
					/* Social Post Feed Card (Identical component to Studio Preview) */
					<div className="flex justify-center">
						<FacebookPostCardPreview
							companyName={accountName}
							captionText={caption}
						>
							{imageUrl && format !== 'text' ? (
								<img
									src={imageUrl}
									alt="Attached Photo"
									className="w-full h-auto object-cover max-h-[700px]"
								/>
							) : null}
						</FacebookPostCardPreview>
					</div>
				)}
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
