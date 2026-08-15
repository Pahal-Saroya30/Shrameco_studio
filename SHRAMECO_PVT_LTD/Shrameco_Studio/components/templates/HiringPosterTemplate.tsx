'use client';

import React, { forwardRef } from 'react';
import { useBrand } from '@/context/BrandContext';
import { ArrowUpRight } from 'lucide-react';
import { CardChassis } from './CardChassis';

interface TemplateProps {
	captionText: string;
	topic: string;
	platform: string;
	aspectRatio?: '4/5' | '1/1' | '16/9';
	variantStyle?: 'badge' | 'split';
	aiImageUrl?: string;
	layoutStyle?: 'blended' | 'split' | 'full-bleed';
	customRole?: string;
	customEventLocation?: string;
	textAlign?: 'left' | 'center' | 'right';
	fontSizeMode?: 'auto' | 'sm' | 'md' | 'lg';
	showGlow?: boolean;
	showGrid?: boolean;
	themeOverride?: 'light' | 'dark';
}

export const HiringPosterTemplate = forwardRef<HTMLDivElement, TemplateProps>(
	(
		{
			captionText,
			topic,
			platform,
			aspectRatio = '4/5',
			variantStyle = 'badge',
			aiImageUrl,
			layoutStyle,
			customRole,
			customEventLocation,
			textAlign = 'left',
			fontSizeMode = 'auto',
			showGlow = false,
			showGrid = false,
			themeOverride,
		},
		ref
	) => {
		const brand = useBrand();

		// Clean title selection
		const isTopicRole = topic && topic.length < 35 && !topic.toLowerCase().includes('roadmap') && !topic.toLowerCase().includes('strategy');
		const jobRole = customRole?.trim() || (isTopicRole ? topic : 'Senior Product Designer');
		const location = customEventLocation?.trim() || 'Remote · US / EU';

		const roleType = 'Full-time · Senior';
		const compVal = '$150k – $185k + Equity';

		// Extract clean bullet items (< 55 chars)
		const customBullets = (captionText || '')
			.split('\n')
			.map((l) => l.trim().replace(/^[-*•\d.]+\s*/, ''))
			.filter((l) => l.length > 0 && l.length <= 55);

		const perksList = customBullets.length >= 2
			? customBullets.slice(0, 3)
			: [
				'Competitive Equity & 401(k)',
				'Flexible Hours & Unlimited PTO',
				'$3,000 Annual Learning Stipend',
			];

		const isLandscape = aspectRatio === '16/9';
		const isSquare = aspectRatio === '1/1';

		/* ── Variant 2: Recruitment Grid (`split`) ── */
		if (variantStyle === 'split') {
			return (
				<CardChassis
					ref={ref}
					aspectRatio={aspectRatio}
					platform={platform}
					textAlign={textAlign}
					showGlow={showGlow}
					showGrid={showGrid}
					themeOverride={themeOverride || 'dark'}
					variantStyle={variantStyle}
					aiImageUrl={aiImageUrl}
					layoutStyle={layoutStyle}
					code="ROLE-06"
				>
					<div className="flex flex-col h-full justify-between">
						{/* Header */}
						<div>
							<span className="bc-eyebrow">Career Opportunity</span>
							<h2 className="bc-hero" style={{ fontSize: isLandscape ? '4.5cqw' : isSquare ? '6.5cqw' : '7.8cqw' }}>
								{jobRole}
							</h2>
						</div>

						{/* Clean 4-Cell Spec Grid */}
						<div className="grid grid-cols-2 gap-[1.5cqw] my-auto">
							<div className="p-[2cqw] border border-[var(--hairline)] rounded font-mono">
								<span className="text-[2cqw] uppercase tracking-wider text-[var(--muted)] block mb-[0.2cqw]">Location</span>
								<span className="text-[2.6cqw] font-semibold text-[var(--ink)] block truncate">{location}</span>
							</div>
							<div className="p-[2cqw] border border-[var(--hairline)] rounded font-mono">
								<span className="text-[2cqw] uppercase tracking-wider text-[var(--muted)] block mb-[0.2cqw]">Type</span>
								<span className="text-[2.6cqw] font-semibold text-[var(--ink)] block truncate">{roleType}</span>
							</div>
							<div className="p-[2cqw] border border-[var(--hairline)] rounded font-mono">
								<span className="text-[2cqw] uppercase tracking-wider text-[var(--muted)] block mb-[0.2cqw]">Comp</span>
								<span className="text-[2.6cqw] font-semibold text-[var(--ink)] block truncate">{compVal}</span>
							</div>
							<div className="p-[2cqw] border border-[var(--hairline)] rounded font-mono">
								<span className="text-[2cqw] uppercase tracking-wider text-[var(--muted)] block mb-[0.2cqw]">Team</span>
								<span className="text-[2.6cqw] font-semibold text-[var(--ink)] block truncate">{brand.industry || 'Product & Design'}</span>
							</div>
						</div>

						{/* CTA */}
						<span className="bc-cta w-full justify-between">
							<span>Apply For Role</span>
							<ArrowUpRight aria-hidden="true" />
						</span>
					</div>
				</CardChassis>
			);
		}

		/* ── Variant 1: Spotlight Card (`badge`) ── */
		return (
			<CardChassis
				ref={ref}
				aspectRatio={aspectRatio}
				platform={platform}
				textAlign={textAlign}
				showGlow={showGlow}
				showGrid={showGrid}
				themeOverride={themeOverride}
				variantStyle={variantStyle}
				aiImageUrl={aiImageUrl}
				layoutStyle={layoutStyle}
				code="ROLE-06"
			>
				<div className="flex flex-col h-full justify-between">
					{/* Top Header */}
					<div>
						<span className="bc-eyebrow">We Are Hiring</span>
						<h2 className="bc-hero" style={{ fontSize: isLandscape ? '4.8cqw' : isSquare ? '6.8cqw' : '8cqw' }}>
							{jobRole}
						</h2>

						{/* Clean Monospace Meta Pills (No Emojis) */}
						<div className="flex flex-wrap gap-[1.5cqw] mt-[2.5cqw]">
							<span className="px-[2.5cqw] py-[1cqw] border border-[var(--hairline)] rounded font-mono text-[2.8cqw] text-[var(--ink)] font-medium">
								{location}
							</span>
							<span className="px-[2.5cqw] py-[1cqw] border border-[var(--hairline)] rounded font-mono text-[2.8cqw] text-[var(--ink)] font-medium">
								{roleType}
							</span>
							<span className="px-[2.5cqw] py-[1cqw] border border-[var(--hairline)] rounded font-mono text-[2.8cqw] text-[var(--signal-deep)] font-bold">
								{compVal}
							</span>
						</div>
					</div>

					{/* Center: Key Role Perks */}
					<div className="my-auto border-t border-b border-[var(--hairline)] py-[3cqw]">
						<span className="font-mono text-[2.6cqw] uppercase tracking-wider text-[var(--muted)] font-bold block mb-[1.5cqw]">
							Overview
						</span>
						<ul className="space-y-[1.8cqw]">
							{perksList.map((perk, idx) => (
								<li key={idx} className="flex items-center gap-[2cqw] font-mono text-[3cqw] text-[var(--ink)]">
									<span className="w-[1.4cqw] h-[1.4cqw] rounded-full bg-[var(--signal)] flex-shrink-0" />
									<span>{perk}</span>
								</li>
							))}
						</ul>
					</div>

					{/* Bottom CTA */}
					<span className="bc-cta">
						Join The Team <ArrowUpRight aria-hidden="true" />
					</span>
				</div>
			</CardChassis>
		);
	}
);

HiringPosterTemplate.displayName = 'HiringPosterTemplate';
