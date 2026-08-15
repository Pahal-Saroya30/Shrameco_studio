'use client';

import React, { forwardRef } from 'react';
import { useBrand } from '@/context/BrandContext';
import { CardChassis } from './CardChassis';

interface TemplateProps {
	captionText: string;
	topic: string;
	platform: string;
	aspectRatio?: '4/5' | '1/1' | '16/9';
	variantStyle?: 'numbered' | 'cyber';
	aiImageUrl?: string;
	layoutStyle?: 'blended' | 'split' | 'full-bleed';
	textAlign?: 'left' | 'center' | 'right';
	fontSizeMode?: 'auto' | 'sm' | 'md' | 'lg';
	showGlow?: boolean;
	showGrid?: boolean;
	themeOverride?: 'light' | 'dark';
}

export const TipListTemplate = forwardRef<HTMLDivElement, TemplateProps>(
	(
		{
			captionText,
			topic,
			platform,
			aspectRatio = '4/5',
			variantStyle = 'numbered',
			aiImageUrl,
			layoutStyle,
			textAlign = 'left',
			fontSizeMode = 'auto',
			showGlow = false,
			showGrid = false,
			themeOverride,
		},
		ref
	) => {
		const brand = useBrand();

		let rawLines = (captionText || '')
			.split('\n')
			.map((l) => l.trim().replace(/^[-*•\d.]+\s*/, ''))
			.filter((l) => l.length > 0);

		// If input is a single continuous paragraph, split by sentence periods so multiple bullets appear
		if (rawLines.length === 1 && rawLines[0].length > 40) {
			const sentenceSplit = rawLines[0]
				.split(/(?<=\.)\s+/)
				.map((s) => s.trim())
				.filter((s) => s.length > 0);
			if (sentenceSplit.length > 1) {
				rawLines = sentenceSplit;
			}
		}

		const isLandscape = aspectRatio === '16/9';
		const maxItems = isLandscape ? 3 : 4;

		const listItems = rawLines.length > 0
			? rawLines.slice(0, maxItems)
			: [
				'Standardize core architecture early.',
				'Keep API contracts strictly backwards-compatible.',
				'Automate regression verification.',
				'Prioritize user latency & responsiveness.',
			].slice(0, maxItems);

		const resolvedTheme = variantStyle === 'cyber' ? (themeOverride || 'dark') : themeOverride;

		/* ── Variant 2: Card Steps (`cyber`) ── */
		if (variantStyle === 'cyber') {
			return (
				<CardChassis
					ref={ref}
					aspectRatio={aspectRatio}
					platform={platform}
					textAlign={textAlign}
					showGlow={showGlow}
					showGrid={showGrid}
					themeOverride={resolvedTheme}
					variantStyle={variantStyle}
					aiImageUrl={aiImageUrl}
					layoutStyle={layoutStyle}
					code="PLAY-04"
				>
					<div className="flex flex-col h-full justify-between">
						<div>
							<span className="bc-eyebrow">ACTION PLAYBOOK</span>
							<h2 className="bc-hero" style={{ fontSize: isLandscape ? '4.8cqw' : '7.8cqw' }}>
								{topic || 'Key Execution Steps'}
							</h2>
						</div>

						{/* Micro-Card Step Blocks */}
						<div className="space-y-[1.8cqw] my-auto">
							{listItems.map((line, idx) => (
								<div
									key={idx}
									className="p-[2.2cqw] border border-[var(--hairline)] rounded-lg bg-[var(--hairline)]/15 flex items-center gap-[2.5cqw] shadow-sm"
								>
									<span className="px-[2cqw] py-[0.8cqw] bg-[var(--signal)] text-[var(--cta-ink)] font-mono font-bold text-[2.6cqw] rounded flex-shrink-0">
										{String(idx + 1).padStart(2, '0')}
									</span>
									<span className="text-[2.9cqw] font-medium text-[var(--ink)] leading-snug">
										{line}
									</span>
								</div>
							))}
						</div>
					</div>
				</CardChassis>
			);
		}

		/* ── Variant 1: Simple List (`numbered`) ── */
		return (
			<CardChassis
				ref={ref}
				aspectRatio={aspectRatio}
				platform={platform}
				textAlign={textAlign}
				showGlow={showGlow}
				showGrid={showGrid}
				themeOverride={resolvedTheme}
				variantStyle={variantStyle}
				aiImageUrl={aiImageUrl}
				layoutStyle={layoutStyle}
				code="PLAY-04"
			>
				<div className="flex flex-col h-full justify-between">
					<div>
						<span className="bc-eyebrow">CHECKLIST</span>
						<h2 className="bc-hero" style={{ fontSize: isLandscape ? '4.8cqw' : '7.8cqw' }}>
							{topic || 'Key Takeaways'}
						</h2>
					</div>

					{/* Clean Monospace Line List */}
					<ul className="bc-tips my-auto">
						{listItems.map((line, idx) => (
							<li key={idx} className="bc-tip">
								<span className="bc-tip-idx font-bold text-[var(--signal)]">{String(idx + 1).padStart(2, '0')}</span>
								<span className="flex-1 font-medium text-[var(--ink)] text-[3.1cqw]">{line}</span>
							</li>
						))}
					</ul>
				</div>
			</CardChassis>
		);
	}
);

TipListTemplate.displayName = 'TipListTemplate';
