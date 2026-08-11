'use client';

import React, { forwardRef } from 'react';
import { useBrand } from '@/context/BrandContext';
import { CardChassis } from './CardChassis';

interface TemplateProps {
	captionText: string;
	topic: string;
	platform: string;
	aspectRatio?: '4/5' | '1/1' | '16/9';
	variantStyle?: 'glass' | 'split' | 'typography';
	aiImageUrl?: string;
	layoutStyle?: 'blended' | 'split' | 'full-bleed';
	customAuthor?: string;
	customRole?: string;
	customSubtitle?: string;
	textAlign?: 'left' | 'center' | 'right';
	fontSizeMode?: 'auto' | 'sm' | 'md' | 'lg';
	showGlow?: boolean;
	showGrid?: boolean;
	themeOverride?: 'light' | 'dark';
}

export const QuoteCardTemplate = forwardRef<HTMLDivElement, TemplateProps>(
	(
		{
			captionText,
			topic,
			platform,
			aspectRatio = '4/5',
			variantStyle = 'glass',
			aiImageUrl,
			layoutStyle,
			customAuthor,
			customRole,
			customSubtitle,
			textAlign = 'left',
			fontSizeMode = 'auto',
			showGlow = false,
			showGrid = false,
			themeOverride,
		},
		ref
	) => {
		const brand = useBrand();
		const primaryColor = brand.colorPalette[1] || '#ff4a1c';

		const authorName = customAuthor?.trim() || `${brand.companyName} Team`;
		const authorRole = customRole?.trim() || brand.industry || 'Thought Leadership';
		const quoteText = captionText?.trim() || 'Great products are born from ruthless prioritization and deep empathy for users.';

		const isLandscape = aspectRatio === '16/9';
		const isSquare = aspectRatio === '1/1';

		const getQuoteSizeStyle = () => {
			if (fontSizeMode === 'sm') return { fontSize: isLandscape ? '3.2cqw' : isSquare ? '4.2cqw' : '5cqw' };
			if (fontSizeMode === 'md') return { fontSize: isLandscape ? '4cqw' : isSquare ? '5.4cqw' : '6.4cqw' };
			if (fontSizeMode === 'lg') return { fontSize: isLandscape ? '5cqw' : isSquare ? '6.6cqw' : '7.8cqw' };
			const len = quoteText.length;
			if (len > 220) return { fontSize: isLandscape ? '2.8cqw' : isSquare ? '3.8cqw' : '4.6cqw' };
			if (len > 140) return { fontSize: isLandscape ? '3.4cqw' : isSquare ? '4.6cqw' : '5.4cqw' };
			return { fontSize: isLandscape ? '3.8cqw' : isSquare ? '5.4cqw' : '6.4cqw' };
		};

		const initials = authorName
			.split(' ')
			.map((n) => n[0])
			.join('')
			.substring(0, 2)
			.toUpperCase();

		/* ── Variant 3: Bold Text (`typography`) ── */
		if (variantStyle === 'typography') {
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
					code="QUOT-02"
				>
					<div className="flex flex-col h-full justify-between">
						<span className="bc-eyebrow">{topic || 'PERSPECTIVE'}</span>

						<div className="my-auto">
							<blockquote
								className="bc-quote"
								style={{
									...getQuoteSizeStyle(),
									fontWeight: 700,
									textTransform: 'uppercase' as const,
									letterSpacing: '-0.03em',
									lineHeight: 1.1,
								}}
							>
								"{quoteText}"
							</blockquote>
						</div>

						<div className="pt-[2.5cqw] border-t border-[var(--hairline)] flex items-center justify-between font-mono">
							<div>
								<div className="text-[3.2cqw] font-bold tracking-wide uppercase text-[var(--ink)]">{authorName}</div>
								<div className="text-[2.5cqw] text-[var(--muted)] tracking-wider mt-[0.2cqw]">{authorRole}</div>
							</div>
							<div className="w-[6.5cqw] h-[6.5cqw] rounded-full bg-[var(--signal)] text-[var(--cta-ink)] flex items-center justify-center font-bold text-[2.8cqw]">
								{initials}
							</div>
						</div>
					</div>
				</CardChassis>
			);
		}

		/* ── Variant 2: Color Bar (`split`) ── */
		if (variantStyle === 'split') {
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
					code="QUOT-02"
				>
					<div className="flex flex-col h-full justify-between">
						<span className="bc-eyebrow">{topic || 'Customer Story'}</span>

						<div className="my-auto relative" style={{ paddingLeft: '4.5cqw' }}>
							{/* Glowing vertical signal bar */}
							<div
								className="absolute left-0 top-0 bottom-0 rounded-full"
								style={{ width: '0.8cqw', backgroundColor: primaryColor, boxShadow: `0 0 10px ${primaryColor}66` }}
							/>
							<blockquote className="bc-quote" style={getQuoteSizeStyle()}>
								{quoteText}
							</blockquote>
						</div>

						<div className="pt-[2.5cqw] border-t border-[var(--hairline)] flex items-center gap-[3cqw]">
							<div className="w-[7.5cqw] h-[7.5cqw] rounded-lg bg-[var(--hairline)]/30 border border-[var(--hairline)] text-[var(--ink)] flex items-center justify-center font-mono font-bold text-[3cqw]">
								{initials}
							</div>
							<div className="font-mono">
								<div className="text-[3.2cqw] font-bold uppercase tracking-wider text-[var(--ink)]">{authorName}</div>
								<div className="text-[2.5cqw] text-[var(--muted)] tracking-wider mt-[0.3cqw]">{authorRole}</div>
							</div>
						</div>
					</div>
				</CardChassis>
			);
		}

		/* ── Variant 1: Classic Quote (`glass`, default) ── */
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
				code="QUOT-02"
			>
				<div className="flex flex-col h-full justify-between">
					<div>
						<span className="bc-eyebrow">{topic || 'Customer Voice'}</span>
						<div className="bc-quotemark" aria-hidden="true">&ldquo;</div>
					</div>

					<blockquote className="bc-quote" style={getQuoteSizeStyle()}>
						{quoteText}
					</blockquote>

					<div className="pt-[2.5cqw] border-t border-[var(--hairline)] flex items-center justify-between">
						<div className="font-mono">
							<div className="text-[3.4cqw] font-bold uppercase tracking-wider text-[var(--ink)]">{authorName}</div>
							<div className="text-[2.5cqw] text-[var(--muted)] tracking-wider mt-[0.3cqw]">{authorRole}</div>
						</div>
						<div className="px-[2.5cqw] py-[1cqw] rounded bg-[var(--signal)]/15 border border-[var(--signal)]/30 text-[var(--signal)] font-mono text-[2.4cqw] font-bold uppercase tracking-widest">
							VERIFIED
						</div>
					</div>
				</div>
			</CardChassis>
		);
	}
);

QuoteCardTemplate.displayName = 'QuoteCardTemplate';
