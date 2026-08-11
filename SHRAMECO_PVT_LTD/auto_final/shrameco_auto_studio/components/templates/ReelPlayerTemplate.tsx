'use client';

import React, { forwardRef, useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { Play, Music, Heart, MessageSquare, Share2, Volume2, Sparkles, CheckCircle2, MoreVertical } from 'lucide-react';

interface ReelTemplateProps {
	captionText: string;
	topic: string;
	platform: string;
	aspectRatio?: '4/5' | '1/1' | '16/9' | '9/16';
	variantStyle?: string;
	aiImageUrl?: string;
	layoutStyle?: 'blended' | 'split' | 'full-bleed';
	textAlign?: 'left' | 'center' | 'right';
	themeOverride?: 'light' | 'dark';
	onScreenText?: string[];
}

export const ReelPlayerTemplate = forwardRef<HTMLDivElement, ReelTemplateProps>(
	(
		{
			captionText,
			topic,
			platform = 'facebook',
			aspectRatio = '9/16',
			aiImageUrl,
			textAlign = 'left',
			onScreenText,
		},
		ref
	) => {
		const brand = useBrand();
		const primaryColor = brand.colorPalette[1] || '#1877F2';
		const company = brand.companyName || 'aravalli travels';
		const [activeBeat, setActiveBeat] = useState<'hook' | 'core' | 'cta'>('hook');

		const displayTopic = topic || 'Destination Spotlight & Travel Tips';
		const fullText = captionText?.trim() || `At ${company}, we turn dream travel visions into reality. Explore hidden gems and extraordinary destinations!`;

		// Split text cleanly into 3 Reel timing beats or use AI structured onScreenText
		const paragraphs = fullText.split(/\n\s*\n|\n/).filter(Boolean);
		const hookText = onScreenText?.[0] || paragraphs[0] || `Discover extraordinary journeys with ${company} ✈️`;
		const coreText = onScreenText?.[1] || paragraphs[1] || paragraphs[0] || `Uncover hidden gems, luxury overwater villas, and bespoke travel experiences tailored for you.`;
		const ctaText = onScreenText?.[2] || paragraphs[2] || `Where is your next dream destination? Comment below! 👇`;

		const currentBeatText = activeBeat === 'hook' ? hookText : activeBeat === 'core' ? coreText : ctaText;

		return (
			<div
				ref={ref}
				id="export-template-card"
				className="w-full aspect-[9/16] max-w-[420px] mx-auto rounded-3xl relative overflow-hidden shadow-2xl bg-slate-950 flex flex-col justify-between text-white border border-white/15 select-none transition-all duration-300 ease-out transform-gpu"
				style={{ fontFamily: brand.typography?.heading ? `'${brand.typography.heading}', sans-serif` : 'sans-serif' }}
			>
				{/* Background Media Graphic / AI Artwork */}
				{aiImageUrl ? (
					<img src={aiImageUrl} alt="Reel Artwork" className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-700 hover:scale-110" />
				) : (
					<div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#020617] flex items-center justify-center">
						<div className="text-center p-6 space-y-2">
							<Sparkles className="w-12 h-12 text-emerald-400 mx-auto animate-pulse" />
							<p className="text-xs font-black tracking-widest uppercase text-slate-300">9:16 Vertical Reel Studio</p>
						</div>
					</div>
				)}

				{/* Ambient Dark Gradient Overlays for Readability */}
				<div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/95 pointer-events-none" />

				{/* Top Story / Reel Video Playback Progress Bar & Beat Tabs */}
				<div className="relative z-20 pt-4 px-5 space-y-3">
					<div className="w-full h-1 bg-white/25 rounded-full overflow-hidden backdrop-blur-md flex">
						<div
							className={`h-full rounded-full transition-all duration-500 ${
								activeBeat === 'hook' ? 'w-1/3 bg-emerald-400' : activeBeat === 'core' ? 'w-2/3 bg-emerald-400' : 'w-full bg-emerald-400'
							}`}
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="flex space-x-1.5 bg-black/60 backdrop-blur-xl p-1 rounded-xl border border-white/15">
							{(['hook', 'core', 'cta'] as const).map((beat) => (
								<button
									key={beat}
									onClick={() => setActiveBeat(beat)}
									className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
										activeBeat === beat ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md' : 'text-slate-400 hover:text-white'
									}`}
								>
									{beat === 'hook' ? '0-3s Hook' : beat === 'core' ? '3-12s Story' : '12-15s CTA'}
								</button>
							))}
						</div>

						<div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider text-emerald-300">
							<Sparkles className="w-3 h-3 text-emerald-400" />
							<span>REEL</span>
						</div>
					</div>
				</div>

				{/* Brand Logo Watermark Header */}
				<div className="relative z-10 px-5 flex items-center justify-between">
					<div className="flex items-center space-x-2.5 bg-black/60 backdrop-blur-xl px-3.5 py-1.5 rounded-2xl border border-white/20 shadow-xl">
						{brand.logoUrl ? (
							<img src={brand.logoUrl} alt={company} className="h-4.5 w-auto object-contain rounded" />
						) : (
							<div
								className="w-5 h-5 rounded-md flex items-center justify-center text-white font-black text-[10px] shadow-sm"
								style={{ backgroundColor: primaryColor }}
							>
								{company.charAt(0)}
							</div>
						)}
						<span className="text-xs font-black tracking-tight text-white">{company}</span>
					</div>
				</div>

				{/* Center Topic & Motion Subtitle Box Overlay */}
				<div className="relative z-10 p-5 space-y-3.5 my-auto">
					<div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-[11px] font-black uppercase tracking-wider text-emerald-300 shadow-lg">
						<Sparkles className="w-3.5 h-3.5 text-emerald-400" />
						<span>{displayTopic}</span>
					</div>

					<div className="bg-[#0B0F19]/90 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/20 shadow-2xl space-y-2 transition-all duration-300">
						<p className="text-sm sm:text-base font-extrabold text-white leading-relaxed tracking-wide drop-shadow-lg">
							{currentBeatText}
						</p>
					</div>
				</div>

				{/* Bottom Bar: Audio Info Watermark */}
				<div className="relative z-10 p-5 pt-0 flex items-center justify-between text-xs text-slate-200 font-bold">
					<div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15">
						<Music className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
						<span className="truncate max-w-[240px] text-white">Original Audio • {company}</span>
					</div>
				</div>
			</div>
		);
	}
);

ReelPlayerTemplate.displayName = 'ReelPlayerTemplate';

