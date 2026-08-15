'use client';

import React, { forwardRef } from 'react';
import { useBrand } from '@/context/BrandContext';
import { CardChassis } from './CardChassis';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

interface TemplateProps {
	captionText: string;
	topic: string;
	platform: string;
	aspectRatio?: '4/5' | '1/1' | '16/9';
	variantStyle?: 'cyber' | 'saas';
	aiImageUrl?: string;
	layoutStyle?: 'blended' | 'split' | 'full-bleed';
	customStatValue?: string;
	customStatLabel?: string;
	textAlign?: 'left' | 'center' | 'right';
	fontSizeMode?: 'auto' | 'sm' | 'md' | 'lg';
	showGlow?: boolean;
	showGrid?: boolean;
	themeOverride?: 'light' | 'dark';
}

export const MetricStatTemplate = forwardRef<HTMLDivElement, TemplateProps>(
	(
		{
			captionText,
			topic,
			platform,
			aspectRatio = '4/5',
			variantStyle = 'saas',
			aiImageUrl,
			layoutStyle,
			customStatValue,
			customStatLabel,
			textAlign = 'left',
			fontSizeMode = 'auto',
			showGlow = false,
			showGrid = false,
			themeOverride,
		},
		ref
	) => {
		const brand = useBrand();

		const lines = (captionText || '').split('\n').filter((l) => l.trim().length > 0);
		
		// Extract clean stat metric (ignoring numbered list items like 1., 2.)
		let bigStat = customStatValue?.trim();
		let subLabel = customStatLabel?.trim();

		if (!bigStat) {
			// Find actual metric numbers like 99.9%, +24%, $150k, 3.2M, 10x
			const metricRegex = /(?:\$|\+|\b)(\d+(?:\.\d+)?\s*(?:%|M|k|B|x|\+))(?:[^\w\d]|$)/i;
			const match = captionText.match(metricRegex);
			if (match && match[1]) {
				bigStat = match[1].trim();
				const cleanedCaption = captionText.replace(/^[-*•\d.]+\s*/gm, '').trim();
				subLabel = cleanedCaption.length > 0 ? cleanedCaption : topic;
			} else {
				bigStat = '100%';
				const cleanedCaption = captionText.replace(/^[-*•\d.]+\s*/gm, '').trim();
				subLabel = cleanedCaption.length > 0 ? cleanedCaption : topic;
			}
		}

		if (!subLabel) {
			subLabel = topic || 'Key Performance Metric';
		}

		const isLandscape = aspectRatio === '16/9';
		const isSquare = aspectRatio === '1/1';

		const getStatSizeStyle = () => {
			const len = bigStat.length;
			if (isLandscape) {
				if (len > 10) return { fontSize: '7.5cqw' };
				if (len > 6) return { fontSize: '10cqw' };
				return { fontSize: '12.5cqw' };
			}
			if (isSquare) {
				if (len > 10) return { fontSize: '11cqw' };
				if (len > 6) return { fontSize: '15cqw' };
				return { fontSize: '19cqw' };
			}
			if (len > 10) return { fontSize: '13cqw' };
			if (len > 6) return { fontSize: '17cqw' };
			return { fontSize: '22cqw' };
		};

		const resolvedTheme = variantStyle === 'cyber' ? (themeOverride || 'dark') : themeOverride;

		/* ── Variant 2: Dark Theme (`cyber`) ── */
		if (variantStyle === 'cyber') {
			return (
				<CardChassis
					ref={ref}
					aspectRatio={aspectRatio}
					platform={platform}
					textAlign={textAlign}
					showGlow={showGlow}
					showGrid={showGrid}
					themeOverride={resolvedTheme || 'dark'}
					variantStyle={variantStyle}
					aiImageUrl={aiImageUrl}
					layoutStyle={layoutStyle}
					code="STAT-03"
				>
					<div className="flex flex-col h-full justify-between">
						<div className="flex items-center justify-between">
							<span className="bc-eyebrow">{topic || 'MILESTONE STAT'}</span>
							<span className="px-[2.5cqw] py-[0.8cqw] bg-[var(--signal)]/15 border border-[var(--signal)]/30 text-[var(--signal)] font-mono text-[2.2cqw] font-bold rounded uppercase tracking-wider">
								LIVE DATA
							</span>
						</div>

						<div className="my-auto">
							<p className="bc-stat text-[var(--signal)]" style={getStatSizeStyle()}>
								{bigStat}
							</p>
							<p className="bc-stat-sub text-[var(--ink)] font-semibold mt-[1cqw] line-clamp-2">
								{subLabel}
							</p>
						</div>

						{/* Signal readout equalizer */}
						<div className="pt-[2.5cqw] border-t border-[var(--hairline)] flex items-center justify-between">
							<div className="bc-readout">
								<span className="bc-bars" aria-hidden="true">
									<span style={{ height: '2.5cqw' }} />
									<span style={{ height: '4cqw' }} />
									<span className="active" style={{ height: '5.5cqw' }} />
									<span className="active" style={{ height: '7cqw' }} />
								</span>
								<span className="bc-delta font-mono font-bold text-[2.8cqw] text-[var(--signal)] flex items-center gap-[0.5cqw]">
									<TrendingUp className="w-[3cqw] h-[3cqw]" /> +24% vs Last Quarter
								</span>
							</div>

							<span className="font-mono text-[2.2cqw] text-[var(--muted)] uppercase tracking-widest">
								VERIFIED METRIC
							</span>
						</div>
					</div>
				</CardChassis>
			);
		}

		/* ── Variant 1: Light Theme (`saas`, default) ── */
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
				code="STAT-03"
			>
				<div className="flex flex-col h-full justify-between">
					<div className="flex items-center justify-between">
						<span className="bc-eyebrow">{topic || 'Growth Metric'}</span>
						<span className="font-mono text-[2.4cqw] text-[var(--muted)] uppercase tracking-wider font-semibold">
							{brand.companyName || 'STUDIO PERFORMANCE'}
						</span>
					</div>

					<div className="my-auto">
						<p className="bc-stat text-[var(--ink)]" style={getStatSizeStyle()}>
							{bigStat}
						</p>
						<p className="bc-stat-sub text-[var(--muted)] mt-[1cqw] line-clamp-2">
							{subLabel}
						</p>
					</div>

					<div className="pt-[2.5cqw] border-t border-[var(--hairline)] flex items-center justify-between font-mono">
						<div className="flex items-center gap-[1.5cqw]">
							<div className="w-[2cqw] h-[2cqw] rounded-full bg-[var(--signal)]" />
							<span className="text-[2.8cqw] font-bold uppercase tracking-wider text-[var(--ink)]">
								+18% MoM Growth
							</span>
						</div>
						<span className="text-[2.4cqw] text-[var(--signal-deep)] flex items-center gap-[0.5cqw] font-bold">
							View Report <ArrowUpRight className="w-[2.8cqw] h-[2.8cqw]" />
						</span>
					</div>
				</div>
			</CardChassis>
		);
	}
);

MetricStatTemplate.displayName = 'MetricStatTemplate';
