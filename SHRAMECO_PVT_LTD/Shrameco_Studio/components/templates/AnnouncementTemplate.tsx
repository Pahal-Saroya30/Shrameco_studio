'use client';

import React, { forwardRef } from 'react';
import { useBrand } from '@/context/BrandContext';
import { CardChassis } from './CardChassis';

interface TemplateProps {
	captionText: string;
	topic: string;
	platform: string;
	aspectRatio?: '4/5' | '1/1' | '16/9';
	variantStyle?: 'glass' | 'editorial';
	aiImageUrl?: string;
	layoutStyle?: 'blended' | 'split' | 'full-bleed';
	customPosterTitle?: string;
	customSubtitle?: string;
	textAlign?: 'left' | 'center' | 'right';
	fontSizeMode?: 'auto' | 'sm' | 'md' | 'lg';
	showGlow?: boolean;
	showGrid?: boolean;
	themeOverride?: 'light' | 'dark';
}

export const AnnouncementTemplate = forwardRef<HTMLDivElement, TemplateProps>(
	(
		{
			captionText,
			topic,
			platform,
			aspectRatio = '4/5',
			variantStyle = 'glass',
			aiImageUrl,
			layoutStyle,
			customPosterTitle,
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

		let headerTitle = customPosterTitle?.trim();
		let bodyText = captionText?.trim() || '';

		if (!headerTitle) {
			const rawLines = bodyText.split('\n').map((l) => l.trim()).filter(Boolean);
			if (rawLines.length > 1) {
				headerTitle = rawLines[0].replace(/^[*#]+\s*/, '');
				bodyText = rawLines.slice(1).join('\n');
			} else {
				headerTitle = topic || 'Product Update';
			}
		}

		const subtitleText = customSubtitle?.trim() || 'Product Update';

		const isLandscape = aspectRatio === '16/9';
		const isSquare = aspectRatio === '1/1';

		// Sizing helpers
		const getTitleSizeStyle = () => {
			if (fontSizeMode === 'sm') return { fontSize: isLandscape ? '4.2cqw' : isSquare ? '5.6cqw' : '6.5cqw' };
			if (fontSizeMode === 'md') return { fontSize: isLandscape ? '5.2cqw' : isSquare ? '6.8cqw' : '7.8cqw' };
			if (fontSizeMode === 'lg') return { fontSize: isLandscape ? '6.2cqw' : isSquare ? '8.2cqw' : '9.2cqw' };

			const len = headerTitle.length;
			if (len > 30) return { fontSize: isLandscape ? '4cqw' : isSquare ? '5.2cqw' : '6.2cqw' };
			if (len > 20) return { fontSize: isLandscape ? '4.8cqw' : isSquare ? '6.2cqw' : '7.2cqw' };
			if (len > 10) return { fontSize: isLandscape ? '5.5cqw' : isSquare ? '7.4cqw' : '8.4cqw' };
			return { fontSize: isLandscape ? '6.8cqw' : isSquare ? '9.2cqw' : '10.5cqw' };
		};

		const getBodySizeStyle = () => {
			if (fontSizeMode === 'sm') return { fontSize: isLandscape ? '2.3cqw' : isSquare ? '3.0cqw' : '3.4cqw' };
			if (fontSizeMode === 'md') return { fontSize: isLandscape ? '2.8cqw' : isSquare ? '3.6cqw' : '4.1cqw' };
			if (fontSizeMode === 'lg') return { fontSize: isLandscape ? '3.4cqw' : isSquare ? '4.4cqw' : '5.1cqw' };
			const len = bodyText.length;
			if (len > 220) return { fontSize: isLandscape ? '2.2cqw' : isSquare ? '2.8cqw' : '3.2cqw' };
			if (len > 140) return { fontSize: isLandscape ? '2.5cqw' : isSquare ? '3.2cqw' : '3.6cqw' };
			return { fontSize: isLandscape ? '2.8cqw' : isSquare ? '3.6cqw' : '4.1cqw' };
		};

		/* ── Editorial variant ── */
		if (variantStyle === 'editorial') {
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
					code="ANNC-01"
				>
					<div className="flex flex-col h-full justify-between">
						<div className="my-auto space-y-[3cqw]">
							<span className="bc-eyebrow">{subtitleText}</span>

							<h2 className="bc-hero" style={{ fontSize: '8.6cqw' }}>
								{headerTitle}
							</h2>

							{bodyText && (
								<p className="bc-support" style={getBodySizeStyle()}>
									{bodyText}
								</p>
							)}
						</div>
					</div>
				</CardChassis>
			);
		}

		/* ── Display Hero variant (default "glass") ── */
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
				code="ANNC-01"
			>
				<div className="flex flex-col h-full justify-between">
					<div className="my-auto space-y-[3cqw]">
						<span className="bc-eyebrow">{subtitleText}</span>

						<h2 className="bc-hero bc-hero--display" style={getTitleSizeStyle()}>
							{headerTitle}<span className="bc-accent">.</span>
						</h2>

						{bodyText && (
							<p className="bc-support" style={getBodySizeStyle()}>
								{bodyText}
							</p>
						)}
					</div>
				</div>
			</CardChassis>
		);
	}
);

AnnouncementTemplate.displayName = 'AnnouncementTemplate';
