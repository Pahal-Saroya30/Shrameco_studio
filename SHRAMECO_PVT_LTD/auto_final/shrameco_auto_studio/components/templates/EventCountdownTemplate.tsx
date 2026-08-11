'use client';

import React, { forwardRef } from 'react';
import { useBrand } from '@/context/BrandContext';
import { ArrowUpRight, Calendar, MapPin, Clock } from 'lucide-react';
import { CardChassis } from './CardChassis';

interface TemplateProps {
	captionText: string;
	topic: string;
	platform: string;
	aspectRatio?: '4/5' | '1/1' | '16/9';
	variantStyle?: 'ticket' | 'calendar';
	aiImageUrl?: string;
	layoutStyle?: 'blended' | 'split' | 'full-bleed';
	customEventTime?: string;
	customEventLocation?: string;
	textAlign?: 'left' | 'center' | 'right';
	fontSizeMode?: 'auto' | 'sm' | 'md' | 'lg';
	showGlow?: boolean;
	showGrid?: boolean;
	themeOverride?: 'light' | 'dark';
}

export const EventCountdownTemplate = forwardRef<HTMLDivElement, TemplateProps>(
	(
		{
			captionText,
			topic,
			platform,
			aspectRatio = '4/5',
			variantStyle = 'ticket',
			aiImageUrl,
			layoutStyle,
			customEventTime,
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

		const eventTime = customEventTime?.trim() || 'OCT 24 • 10:00 AM EST';
		const eventLoc = customEventLocation?.trim() || 'Online + San Francisco';
		const titleText = topic?.trim() || 'Upcoming Event';

		const timeParts = eventTime.split('•');
		const dateStr = timeParts[0]?.trim() || 'OCT 24';
		const timeStr = timeParts[1]?.trim() || '10:00 AM EST';

		const isLandscape = aspectRatio === '16/9';
		const isSquare = aspectRatio === '1/1';

		/* ── Calendar (Compact Date Badge) variant ── */
		if (variantStyle === 'calendar') {
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
					code="EVNT-05"
				>
					<div className="flex flex-col h-full justify-between">
						{/* Top Header: Eyebrow + Prominent Date Block */}
						<div>
							<span className="bc-eyebrow">Live Event</span>

							{/* Date & Time Highlight Badge Block */}
							<div className="mt-[2cqw] p-[2cqw] border border-[var(--hairline)] rounded-lg bg-[var(--hairline)]/10 flex items-center justify-between gap-[2cqw]">
								<div className="flex items-center gap-[2cqw]">
									<div className="px-[2cqw] py-[1cqw] bg-[var(--signal)] text-[var(--cta-ink)] font-mono font-bold text-[2.6cqw] rounded uppercase tracking-wider">
										{dateStr}
									</div>
									<span className="font-mono text-[2.5cqw] text-[var(--ink)] font-medium flex items-center gap-[1cqw]">
										<Clock className="w-[2.5cqw] h-[2.5cqw] text-[var(--signal)]" />
										{timeStr}
									</span>
								</div>
							</div>
						</div>

						{/* Center: Title & Description */}
						<div className="my-auto">
							<h2 className="bc-hero" style={{ fontSize: isLandscape ? '4.8cqw' : isSquare ? '6.6cqw' : '7.8cqw' }}>
								{titleText}
							</h2>

							{captionText?.trim() && (
								<p className="bc-support" style={{ fontSize: isLandscape ? '2.5cqw' : isSquare ? '3.2cqw' : '3.8cqw' }}>
									{captionText.trim()}
								</p>
							)}
						</div>

						{/* Bottom: Location & Access Bar */}
						<div className="pt-[2cqw] border-t border-[var(--hairline)] flex items-center justify-between font-mono text-[2.5cqw] text-[var(--muted)]">
							<span className="flex items-center gap-[1cqw] font-semibold text-[var(--ink)]">
								<MapPin className="w-[2.5cqw] h-[2.5cqw] text-[var(--signal)]" />
								{eventLoc}
							</span>
							<span className="text-[var(--signal)] flex items-center gap-[0.5cqw] text-[2.4cqw] uppercase font-bold tracking-wider">
								Join Event <ArrowUpRight className="w-[2.5cqw] h-[2.5cqw]" />
							</span>
						</div>
					</div>
				</CardChassis>
			);
		}

		/* ── Standard Ticket Pass variant ── */
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
				code="EVNT-05"
			>
				<div className="flex flex-col h-full justify-between">
					<div>
						<span className="bc-eyebrow">Live Event</span>
						<h2 className="bc-hero" style={{ fontSize: isLandscape ? '5.2cqw' : isSquare ? '7.2cqw' : '8.6cqw' }}>
							{titleText}
						</h2>
					</div>

					<div className="bc-spec my-auto">
						<div className="bc-spec-row">
							<span className="bc-spec-k">Date</span>
							<span className="bc-spec-v">{dateStr}</span>
						</div>
						<div className="bc-spec-row">
							<span className="bc-spec-k">Time</span>
							<span className="bc-spec-v">{timeStr}</span>
						</div>
						<div className="bc-spec-row">
							<span className="bc-spec-k">Place</span>
							<span className="bc-spec-v">{eventLoc}</span>
						</div>
					</div>

					<span className="bc-cta">
						Save your seat <ArrowUpRight aria-hidden="true" />
					</span>
				</div>
			</CardChassis>
		);
	}
);

EventCountdownTemplate.displayName = 'EventCountdownTemplate';
