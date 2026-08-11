'use client';

import React, { forwardRef } from 'react';
import { useBrand } from '@/context/BrandContext';
import { ArrowUpRight } from 'lucide-react';

interface TemplateProps {
	captionText: string;
	topic: string;
	platform: string;
	aspectRatio?: '4/5' | '1/1' | '16/9';
	customSubtitle?: string;
}

export const MinimalSplitTemplate = forwardRef<HTMLDivElement, TemplateProps>(
	({ captionText, topic, platform, aspectRatio = '4/5', customSubtitle }, ref) => {
		const brand = useBrand();

		const primaryColor = brand.colorPalette[1] || '#3D8090';
		const headingFont = brand.typography.heading || 'Outfit';

		const aspectClass =
			aspectRatio === '1/1'
				? 'aspect-square'
				: aspectRatio === '16/9'
				? 'aspect-[16/9]'
				: 'aspect-[4/5]';

		return (
			<div
				ref={ref}
				id="export-template-card"
				className={`w-full ${aspectClass} max-w-[520px] mx-auto rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 bg-white text-slate-900 border border-slate-200`}
				style={{
					fontFamily: brand.typography.body,
				}}
			>
				{/* Top Half: Brand Primary Color Header Block */}
				<div
					className="p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden text-white"
					style={{ backgroundColor: primaryColor }}
				>
					<div className="relative z-10 flex items-center justify-between">
						<div className="flex items-center space-x-3">
							{brand.logoUrl ? (
								<img
									src={brand.logoUrl}
									alt={brand.companyName}
									className="h-8 w-auto max-w-[120px] object-contain rounded bg-white/20 p-1"
								/>
							) : (
								<div className="w-8 h-8 rounded-xl bg-white text-slate-900 font-extrabold flex items-center justify-center text-sm shadow-md">
									{brand.companyName.charAt(0)}
								</div>
							)}
							<span className="font-extrabold text-sm tracking-tight text-white">
								{brand.companyName}
							</span>
						</div>

						<span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full text-white backdrop-blur-md border border-white/20">
							{platform}
						</span>
					</div>

					<div className="relative z-10 mt-6 space-y-2">
						{customSubtitle && (
							<span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/80 block">
								{customSubtitle}
							</span>
						)}
						<h1
							className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight text-white"
							style={{ fontFamily: headingFont }}
						>
							{topic}
						</h1>
					</div>
				</div>

				{/* Bottom Half: Clean White Content Area */}
				<div className="p-7 sm:p-9 flex-1 flex flex-col justify-between bg-slate-50 text-slate-800">
					<p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal line-clamp-6">
						{captionText}
					</p>

					<div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
						<span className="font-bold text-slate-700 font-mono text-[11px] uppercase">
							{brand.industry}
						</span>

						<div
							className="flex items-center space-x-1 font-bold px-3 py-1.5 rounded-xl text-white text-xs shadow-md"
							style={{ backgroundColor: primaryColor }}
						>
							<span>Read More</span>
							<ArrowUpRight className="w-3.5 h-3.5" />
						</div>
					</div>
				</div>
			</div>
		);
	}
);

MinimalSplitTemplate.displayName = 'MinimalSplitTemplate';
