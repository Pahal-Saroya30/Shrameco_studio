'use client';

import React, { forwardRef } from 'react';
import { useBrand } from '@/context/BrandContext';
import { CardChassis } from './CardChassis';

interface TemplateProps {
	captionText: string;
	topic: string;
	platform: string;
	aspectRatio?: '4/5' | '1/1' | '16/9';
	customPosterTitle?: string;
	customSubtitle?: string;
	textAlign?: 'left' | 'center' | 'right';
	fontSizeMode?: 'auto' | 'sm' | 'md' | 'lg';
	showGlow?: boolean;
	showGrid?: boolean;
	themeOverride?: 'light' | 'dark';
}

export const GrungePosterTemplate = forwardRef<HTMLDivElement, TemplateProps>(
	(
		{
			captionText,
			topic,
			platform,
			aspectRatio = '4/5',
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

		const headerTitle = customPosterTitle?.trim() || topic;
		const subtitleText = customSubtitle?.trim() || 'Product Update';
		const bodyText = captionText?.trim() || '';

		const textAlignClass =
			textAlign === 'center'
				? 'text-center'
				: textAlign === 'right'
				? 'text-right'
				: 'text-left';

		const flexAlignClass =
			textAlign === 'center'
				? 'items-center justify-center'
				: textAlign === 'right'
				? 'items-end justify-end'
				: 'items-start justify-start';

		// Sizing helpers
		const getTitleSizeStyle = () => {
			const len = headerTitle.length;
			if (len > 25) return { fontSize: '7.5cqw' };
			if (len > 15) return { fontSize: '9.5cqw' };
			return { fontSize: '12.5cqw' }; // default t-display
		};

		const getBodySizeStyle = () => {
			if (fontSizeMode === 'sm') return { fontSize: '3.4cqw' };
			if (fontSizeMode === 'md') return { fontSize: '4.1cqw' };
			if (fontSizeMode === 'lg') return { fontSize: '5.1cqw' };
			const len = bodyText.length;
			if (len > 220) return { fontSize: '3.2cqw' };
			if (len > 140) return { fontSize: '3.6cqw' };
			return { fontSize: '4.1cqw' }; // default t-body
		};

		return (
			<CardChassis
				ref={ref}
				aspectRatio={aspectRatio}
				platform={platform}
				textAlign={textAlign}
				showGlow={showGlow}
				showGrid={showGrid}
				themeOverride={themeOverride}
				variantStyle="grunge"
				code="ANNC-01"
			>
				<div className="flex flex-col h-full justify-between">
					<div className={`my-auto space-y-3.5 flex flex-col ${flexAlignClass}`}>
						<span className="bc-eyebrow">{subtitleText}</span>
						
						<h2 
							className={`bc-hero bc-hero--display w-full ${textAlignClass}`}
							style={getTitleSizeStyle()}
						>
							{headerTitle}<span className="bc-accent">.</span>
						</h2>
						
						{bodyText && (
							<p 
								className={`bc-support w-full ${textAlignClass}`}
								style={getBodySizeStyle()}
							>
								{bodyText}
							</p>
						)}
					</div>
				</div>
			</CardChassis>
		);
	}
);

GrungePosterTemplate.displayName = 'GrungePosterTemplate';
