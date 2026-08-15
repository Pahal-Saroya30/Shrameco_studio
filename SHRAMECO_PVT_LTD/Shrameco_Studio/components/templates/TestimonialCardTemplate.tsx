'use client';

import React, { forwardRef } from 'react';
import { useBrand } from '@/context/BrandContext';
import { Star, Quote, CheckCircle } from 'lucide-react';

interface TemplateProps {
	captionText: string;
	topic: string;
	platform: string;
	aspectRatio?: '4/5' | '1/1' | '16/9';
	customAuthor?: string;
	customRole?: string;
}

export const TestimonialCardTemplate = forwardRef<HTMLDivElement, TemplateProps>(
	({ captionText, topic, platform, aspectRatio = '4/5', customAuthor, customRole }, ref) => {
		const brand = useBrand();

		const primaryColor = brand.colorPalette[1] || '#3D8090';
		const secondaryColor = brand.colorPalette[2] || '#B8D4D8';
		const headingFont = brand.typography.heading || 'Outfit';

		const aspectClass =
			aspectRatio === '1/1'
				? 'aspect-square'
				: aspectRatio === '16/9'
				? 'aspect-[16/9]'
				: 'aspect-[4/5]';

		const reviewerName = customAuthor?.trim() || 'Alex Morgan';
		const reviewerTitle = customRole?.trim() || 'Head of Product @ TechCorp';

		return (
			<div
				ref={ref}
				id="export-template-card"
				className={`w-full ${aspectClass} max-w-[520px] mx-auto rounded-3xl p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden shadow-2xl transition-all duration-300 bg-slate-950 text-white border border-slate-800/90`}
				style={{
					fontFamily: brand.typography.body,
				}}
			>
				{/* Ambient Background Radial Glow */}
				<div
					className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none"
					style={{ backgroundColor: primaryColor }}
				/>
				<div
					className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
					style={{ backgroundColor: secondaryColor }}
				/>

				{/* Header Section */}
				<div className="relative z-10 flex items-center justify-between border-b border-white/15 pb-4">
					<div className="flex items-center space-x-3">
						{brand.logoUrl ? (
							<img
								src={brand.logoUrl}
								alt={brand.companyName}
								className="h-8 w-auto max-w-[120px] object-contain rounded bg-white/10 p-1"
							/>
						) : (
							<div
								className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-md"
								style={{ backgroundColor: primaryColor }}
							>
								{brand.companyName.charAt(0)}
							</div>
						)}
						<div>
							<h3 className="font-extrabold text-xs text-white uppercase tracking-wider">
								{brand.companyName}
							</h3>
							<span className="text-[10px] text-slate-400 block font-mono">{topic || 'CUSTOMER TESTIMONIAL'}</span>
						</div>
					</div>

					{/* 5-Star Badge */}
					<div className="flex items-center space-x-1 bg-amber-400/15 border border-amber-400/35 px-3 py-1 rounded-full text-amber-400 shadow-sm backdrop-blur-md">
						{[...Array(5)].map((_, i) => (
							<Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
						))}
					</div>
				</div>

				{/* Center Section: Review Quote Box */}
				<div className="relative z-10 my-auto py-5 space-y-4">
					<div
						className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg border border-white/20"
						style={{ backgroundColor: primaryColor }}
					>
						<Quote className="w-6 h-6 text-white" />
					</div>

					<blockquote
						className="text-base sm:text-lg font-medium leading-relaxed text-slate-100 italic line-clamp-5 bg-white/5 border border-white/10 p-4 sm:p-5 rounded-2xl backdrop-blur-md shadow-inner"
						style={{ fontFamily: headingFont }}
					>
						"{captionText || 'This product completely transformed our workflow and accelerated our team speed.'}"
					</blockquote>
				</div>

				{/* Footer Section: Client Avatar & Title */}
				<div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between">
					<div className="flex items-center space-x-3.5">
						<div className="relative">
							<div
								className="w-11 h-11 rounded-full flex items-center justify-center font-black text-white shadow-md text-sm border-2 border-white/30"
								style={{ backgroundColor: primaryColor }}
							>
								{reviewerName.charAt(0)}
							</div>
							<div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-slate-950">
								<CheckCircle className="w-3 h-3 text-slate-950 fill-emerald-400" />
							</div>
						</div>
						<div>
							<h4 className="font-extrabold text-sm text-white leading-snug">{reviewerName}</h4>
							<span className="text-xs text-slate-400 block font-medium">{reviewerTitle}</span>
						</div>
					</div>

					<span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
						{platform}
					</span>
				</div>
			</div>
		);
	}
);

TestimonialCardTemplate.displayName = 'TestimonialCardTemplate';
