'use client';

import React, { forwardRef } from 'react';
import { useBrand } from '@/context/BrandContext';

interface CardChassisProps {
	aspectRatio?: '4/5' | '1/1' | '16/9';
	platform: string;
	children: React.ReactNode;
	textAlign?: 'left' | 'center' | 'right';
	showGlow?: boolean;
	showGrid?: boolean;
	themeOverride?: 'light' | 'dark';
	variantStyle?: string;
	aiImageUrl?: string;
	layoutStyle?: 'blended' | 'split' | 'full-bleed';
	code: string;
}

const GRAIN_URI =
	"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const CHASSIS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

.bc-card {
	container-type: inline-size;
	position: relative;
	background: var(--paper);
	color: var(--ink);
	border: 1px solid var(--hairline);
	overflow: hidden;
	width: 100%;
	height: 100%;
	min-height: 100%;
	transition: box-shadow 0.3s ease, transform 0.3s ease;
}

/* dark textured background: grid + radial signal glow */
.bc-card[data-theme="dark"] {
	background:
		radial-gradient(120% 95% at 13% 9%, var(--glow), transparent 52%),
		repeating-linear-gradient(0deg, var(--grid) 0 1px, transparent 1px var(--grid-gap)),
		repeating-linear-gradient(90deg, var(--grid) 0 1px, transparent 1px var(--grid-gap)),
		var(--paper);
}

/* light textured background: optional subtle paper grid */
.bc-card[data-theme="light"] {
	background:
		repeating-linear-gradient(0deg, var(--grid, transparent) 0 1px, transparent 1px var(--grid-gap, 6.5cqw)),
		repeating-linear-gradient(90deg, var(--grid, transparent) 0 1px, transparent 1px var(--grid-gap, 6.5cqw)),
		var(--paper);
}

/* film grain overlay — tactile paper depth for both themes */
.bc-card::after {
	content: "";
	position: absolute;
	inset: 0;
	z-index: 1;
	background-image: ${GRAIN_URI};
	background-size: 200px 200px;
	pointer-events: none;
}
.bc-card[data-theme="dark"]::after {
	opacity: 0.2;
	mix-blend-mode: soft-light;
}
.bc-card[data-theme="light"]::after {
	opacity: 0.12;
	mix-blend-mode: multiply;
}

@media (hover: hover) {
	.bc-card:hover { transform: translateY(-3px); box-shadow: 0 22px 44px -22px rgba(0,0,0,0.3); }
	.bc-card[data-theme="dark"]:hover { box-shadow: 0 26px 50px -24px rgba(0,0,0,0.75); }
}

/* crop marks — thin, sleek precision ticks */
.bc-crop {
	position: absolute;
	width: 4.5cqw;
	height: 4.5cqw;
	pointer-events: none;
	transition: transform 0.3s ease;
	z-index: 20;
	opacity: 0.85;
}
.bc-crop--tl { top: 2.8cqw; left: 2.8cqw; border-top: 0.25cqw solid var(--signal); border-left: 0.25cqw solid var(--signal); }
.bc-crop--tr { top: 2.8cqw; right: 2.8cqw; border-top: 0.25cqw solid var(--signal); border-right: 0.25cqw solid var(--signal); }
.bc-crop--bl { bottom: 2.8cqw; left: 2.8cqw; border-bottom: 0.25cqw solid var(--signal); border-left: 0.25cqw solid var(--signal); }
.bc-crop--br { bottom: 2.8cqw; right: 2.8cqw; border-bottom: 0.25cqw solid var(--signal); border-right: 0.25cqw solid var(--signal); }

.bc-card:hover .bc-crop--tl { transform: translate(-0.6cqw, -0.6cqw); }
.bc-card:hover .bc-crop--tr { transform: translate(0.6cqw, -0.6cqw); }
.bc-card:hover .bc-crop--bl { transform: translate(-0.6cqw, 0.6cqw); }
.bc-card:hover .bc-crop--br { transform: translate(0.6cqw, 0.6cqw); }

.bc-inner {
	position: absolute;
	inset: 0;
	z-index: 2;
	padding: var(--pad);
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

/* brand row */
.bc-brandrow { display: flex; align-items: center; gap: var(--s2); position: relative; z-index: 10; color: var(--ink); }
.bc-mark { width: 8.5cqw; height: 8.5cqw; background: var(--signal); display: grid; place-items: center; flex: none; border-radius: 2px; }
.bc-card[data-theme="dark"] .bc-mark { box-shadow: 0 0 7cqw -1cqw var(--signal); }
.bc-mark svg { width: 54%; height: 54%; }
.bc-wordmark { font-size: 4.6cqw; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); }

/* content region */
.bc-content { flex: 1; display: flex; flex-direction: column; margin-top: var(--s4); position: relative; z-index: 10; color: var(--ink); }

/* coded footer */
.bc-footer {
	display: flex; align-items: center; gap: var(--s2); padding-top: var(--s3);
	font-family: var(--mono); font-size: var(--t-mono); letter-spacing: 0.1em; color: var(--muted);
	position: relative; z-index: 10;
}
.bc-footer-rule { flex: 1; height: 1px; background: var(--hairline); }
.bc-footer-code { color: var(--signal-deep); }

/* shared primitives */
.bc-eyebrow {
	display: inline-flex; align-items: center; gap: var(--s1);
	font-family: var(--mono); font-size: var(--t-mono); font-weight: 500;
	letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted);
}
.bc-eyebrow::before { content: ""; width: 2cqw; height: 2cqw; background: var(--signal); flex: none; border-radius: 1px; }

.bc-hero { font-size: var(--t-title); font-weight: 700; line-height: 1.06; letter-spacing: -0.03em; margin: var(--s2) 0 0; color: var(--ink); overflow-wrap: break-word; word-break: break-word; }
.bc-hero--display { font-size: var(--t-display); line-height: 1.0; letter-spacing: -0.04em; font-weight: 700; color: var(--ink); overflow-wrap: break-word; word-break: break-word; }
.bc-accent { color: var(--signal); }

.bc-support { font-size: var(--t-body); line-height: 1.45; letter-spacing: -0.01em; color: var(--muted); margin: var(--s3) 0 0; }

/* spec table */
.bc-spec { display: flex; flex-direction: column; margin-top: var(--s3); }
.bc-spec-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--s2); padding: 2.8cqw 0; border-bottom: 1px solid var(--hairline); font-family: var(--mono); }
.bc-spec-row:first-child { border-top: 1px solid var(--hairline); }
.bc-spec-k { font-size: var(--t-mono); letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
.bc-spec-v { font-size: var(--t-meta); color: var(--ink); font-variant-numeric: tabular-nums; text-align: right; }

/* CTA — dark mode gets signal glow */
.bc-cta {
	align-self: flex-start; display: inline-flex; align-items: center; gap: var(--s1);
	margin-top: var(--s4); padding: 3.4cqw 5cqw; background: var(--signal); color: var(--cta-ink);
	font-family: var(--mono); font-size: 3.4cqw; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase;
}
.bc-card[data-theme="dark"] .bc-cta { box-shadow: 0 0 9cqw -3cqw var(--signal); }
.bc-cta svg { width: 4cqw; height: 4cqw; }

/* quote */
.bc-quotemark { font-family: var(--display); font-size: 20cqw; line-height: 0.6; font-weight: 700; color: var(--signal); margin-top: 4cqw; height: 8cqw; }
.bc-quote { font-size: var(--t-quote); font-weight: 500; line-height: 1.22; letter-spacing: -0.02em; margin: var(--s2) 0 0; }
.bc-attrib { margin-top: var(--s4); font-family: var(--mono); }
.bc-attrib-name { font-size: 3.6cqw; letter-spacing: 0.06em; text-transform: uppercase; }
.bc-attrib-role { font-size: var(--t-mono); color: var(--muted); margin-top: 1cqw; letter-spacing: 0.08em; }

/* stat */
.bc-stat { font-family: var(--display); font-size: var(--t-stat); font-weight: 700; line-height: 0.86; letter-spacing: -0.05em; font-variant-numeric: tabular-nums; margin: var(--s2) 0 0; }
.bc-stat-sub { font-family: var(--mono); font-size: var(--t-mono); letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin: var(--s2) 0 0; }
.bc-readout { display: flex; align-items: flex-end; gap: var(--s2); margin-top: var(--s4); }
.bc-bars { display: flex; align-items: flex-end; gap: 1cqw; height: 8cqw; }
.bc-bars span { width: 1.8cqw; background: var(--muted); }
.bc-bars span.active { background: var(--signal); }
.bc-card[data-theme="dark"] .bc-bars span.active { box-shadow: 0 0 3cqw -0.5cqw var(--signal); }
.bc-delta { font-family: var(--mono); font-size: var(--t-mono); font-weight: 500; letter-spacing: 0.08em; color: var(--signal-deep); }

/* tips */
.bc-tips { list-style: none; margin: var(--s3) 0 0; padding: 0; display: flex; flex-direction: column; gap: 0; }
.bc-tip { display: flex; align-items: baseline; gap: var(--s2); padding: 3.2cqw 0; border-top: 1px solid var(--hairline); font-size: var(--t-body); line-height: 1.25; letter-spacing: -0.01em; }
.bc-tips li:last-child { border-bottom: 1px solid var(--hairline); }
.bc-tip-idx { font-family: var(--mono); font-size: 3cqw; color: var(--signal-deep); flex: none; letter-spacing: 0.06em; }

/* aspect ratio modifications */
.ratio-4-5 { aspect-ratio: 4 / 5; }
.ratio-1-1 {
	aspect-ratio: 1 / 1;
	--pad: 6.5cqw;
	--s1: 1.5cqw;
	--s2: 2.2cqw;
	--s3: 3.2cqw;
	--s4: 4.2cqw;
	--t-mono: 2.5cqw;
	--t-body: 3.5cqw;
	--t-meta: 3.3cqw;
	--t-quote: 5.4cqw;
	--t-title: 7.2cqw;
	--t-display: 10cqw;
	--t-stat: 22cqw;
}
.ratio-1-1 .bc-mark { width: 7.5cqw; height: 7.5cqw; }
.ratio-1-1 .bc-wordmark { font-size: 4cqw; }
.ratio-1-1 .bc-crop { width: 3.8cqw; height: 3.8cqw; }
.ratio-1-1 .bc-spec-row { padding: 2cqw 0; }
.ratio-1-1 .bc-tip { padding: 2cqw 0; }
.ratio-1-1 .bc-cta { padding: 2.8cqw 4.2cqw; font-size: 2.8cqw; margin-top: 2.8cqw; }
.ratio-1-1 .bc-quotemark { font-size: 14cqw; height: 6cqw; margin-top: 1.5cqw; }
.ratio-1-1 .bc-content { margin-top: 3cqw; }
.ratio-1-1 .bc-footer { padding-top: 2.2cqw; }
.ratio-16-9 {
	aspect-ratio: 16 / 9;
	--pad: 4cqw;
	--s1: 1cqw;
	--s2: 1.6cqw;
	--s3: 2.2cqw;
	--s4: 3cqw;
	--t-mono: 2.1cqw;
	--t-body: 2.6cqw;
	--t-meta: 2.5cqw;
	--t-quote: 4.1cqw;
	--t-title: 4.8cqw;
	--t-display: 6.2cqw;
	--t-stat: 13cqw;
}
.ratio-16-9 .bc-mark { width: 5.5cqw; height: 5.5cqw; }
.ratio-16-9 .bc-wordmark { font-size: 3.4cqw; }
.ratio-16-9 .bc-crop { width: 3cqw; height: 3cqw; }
.ratio-16-9 .bc-crop--tl { top: 1.5cqw; left: 1.5cqw; }
.ratio-16-9 .bc-crop--tr { top: 1.5cqw; right: 1.5cqw; }
.ratio-16-9 .bc-crop--bl { bottom: 1.5cqw; left: 1.5cqw; }
.ratio-16-9 .bc-crop--br { bottom: 1.5cqw; right: 1.5cqw; }
.ratio-16-9 .bc-spec-row { padding: 1.2cqw 0; }
.ratio-16-9 .bc-tip { padding: 1.2cqw 0; }
.ratio-16-9 .bc-cta { padding: 2cqw 3.4cqw; font-size: 2.4cqw; margin-top: 1.8cqw; }
.ratio-16-9 .bc-quotemark { font-size: 11cqw; height: 4.5cqw; margin-top: 0.5cqw; }
.ratio-16-9 .bc-content { margin-top: 1.8cqw; }
.ratio-16-9 .bc-footer { padding-top: 1.5cqw; }

@media (prefers-reduced-motion: reduce) {
	.bc-card, .bc-crop { transition: none; }
	.bc-card:hover { transform: none; }
	.bc-card:hover .bc-crop { transform: none; }
}
`;

export const CardChassis = forwardRef<HTMLDivElement, CardChassisProps>(
	(
		{
			aspectRatio = '4/5',
			platform,
			children,
			textAlign = 'left',
			showGlow = false,
			showGrid = false,
			themeOverride,
			variantStyle,
			aiImageUrl,
			layoutStyle,
			code,
		},
		ref
	) => {
		const brand = useBrand();

		const primaryColor = brand.colorPalette[1] || '#ff4a1c';
		const secondaryColor = brand.colorPalette[2] || '#B8D4D8';
		const headingFont = brand.typography.heading || 'Space Grotesk';
		const bodyFont = brand.typography.body || 'Inter';

		// Resolve light/dark themes
		const isDarkTheme =
			themeOverride === 'dark' ||
			(themeOverride !== 'light' &&
				(variantStyle === 'glass' ||
					variantStyle === 'cyber' ||
					variantStyle === 'ticket' ||
					variantStyle === 'badge' ||
					variantStyle === 'grunge'));

		const ratioClass =
			layoutStyle === 'split'
				? 'h-full w-full'
				: aspectRatio === '1/1'
				? 'ratio-1-1'
				: aspectRatio === '16/9'
				? 'ratio-16-9'
				: 'ratio-4-5';

		const companyDomain = brand.companyName
			? `${brand.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
			: 'beacon.co';

		const alignClass =
			textAlign === 'center'
				? 'text-center items-center justify-center'
				: textAlign === 'right'
				? 'text-right items-end justify-end'
				: 'text-left items-start justify-start';

		// Dynamic style tokens
		const dynamicVars: Record<string, string> = {
			'--signal': primaryColor,
			'--signal-deep': isDarkTheme ? `${primaryColor}cc` : primaryColor,
			'--display': `"${headingFont}", "Space Grotesk", system-ui, sans-serif`,
			'--mono': '"IBM Plex Mono", ui-monospace, monospace',
			// Theme palette
			'--paper': isDarkTheme ? '#0a0908' : '#fdfcf9',
			'--ink': isDarkTheme ? '#ffffff' : '#17140f',
			'--muted': isDarkTheme ? '#a09a90' : '#78736a',
			'--hairline': isDarkTheme ? 'rgba(255, 255, 255, 0.12)' : '#e2ddd1',
			'--cta-ink': isDarkTheme ? '#0a0908' : '#141210',
			// Texture tokens
			...(isDarkTheme ? {
				'--grid': 'rgba(255, 255, 255, 0.028)',
				'--glow': `${primaryColor}29`,
				'--grid-gap': '6.5cqw',
			} : showGrid ? {
				'--grid': 'rgba(23, 20, 15, 0.04)',
				'--grid-gap': '6.5cqw',
			} : {}),
			// Spacing
			'--s1': '2cqw',
			'--s2': '3cqw',
			'--s3': '4cqw',
			'--s4': '5.5cqw',
			'--pad': '8.5cqw',
			// Typography
			'--t-mono': '2.9cqw',
			'--t-body': '4.1cqw',
			'--t-meta': '3.9cqw',
			'--t-quote': '6.6cqw',
			'--t-title': '8.6cqw',
			'--t-display': '12.5cqw',
			'--t-stat': '30cqw',
			// Split layout optimizations to guarantee zero content clipping
			...(layoutStyle === 'split' ? {
				'--pad': '4.5cqw',
				'--s1': '1.2cqw',
				'--s2': '1.8cqw',
				'--s3': '2.4cqw',
				'--s4': '3.2cqw',
				'--t-mono': '2.3cqw',
				'--t-body': '3.2cqw',
				'--t-meta': '3.0cqw',
				'--t-quote': '4.8cqw',
				'--t-title': '6.2cqw',
				'--t-display': '7.5cqw',
				'--t-stat': '16cqw',
			} : {}),
			'font-family': 'var(--display)',
		};

		// SVG fill color — dark on light paper, light on dark paper
		const markFill = isDarkTheme ? '#0e0c0a' : '#fff';

		return (
			<div
				ref={ref}
				id="export-template-card"
				className={`bc-card ${ratioClass}`}
				style={dynamicVars}
				data-theme={isDarkTheme ? 'dark' : 'light'}
			>
				<style dangerouslySetInnerHTML={{ __html: CHASSIS_CSS }} />

				{/* Blended AI Image Backdrop Layer */}
				{aiImageUrl && (
					<div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
						<img src={aiImageUrl} alt="Artwork Backdrop" className="w-full h-full object-cover opacity-45 filter brightness-105 contrast-110" />
						<div className={`absolute inset-0 ${isDarkTheme ? 'bg-gradient-to-b from-[#0a0908]/75 via-[#0a0908]/60 to-[#0a0908]/85' : 'bg-gradient-to-b from-[#fdfcf9]/80 via-[#fdfcf9]/65 to-[#fdfcf9]/85'}`} />
					</div>
				)}

				{/* Corner Crop Marks */}
				<span className="bc-crop bc-crop--tl" aria-hidden="true" />
				<span className="bc-crop bc-crop--tr" aria-hidden="true" />
				<span className="bc-crop bc-crop--bl" aria-hidden="true" />
				<span className="bc-crop bc-crop--br" aria-hidden="true" />

				{/* Chassis Inner Container */}
				<div className={`bc-inner ${alignClass}`}>
					{/* Brand Row */}
					<div className="bc-brandrow">
						<span className="bc-mark" aria-hidden="true">
							{brand.logoUrl ? (
								<img
									src={brand.logoUrl}
									alt={brand.companyName}
									className="w-[54%] h-[54%] object-contain"
								/>
							) : (
								<svg viewBox="0 0 24 24" fill={markFill}>
									<rect x="3" y="15" width="4" height="6" />
									<rect x="10" y="9" width="4" height="12" />
									<rect x="17" y="3" width="4" height="18" />
								</svg>
							)}
						</span>
						<span className="bc-wordmark">
							{brand.companyName}
						</span>
					</div>

					{/* Children Content slot */}
					<div className="bc-content w-full h-full flex flex-col justify-between">
						{children}
					</div>

					{/* Coded Footer */}
					<div className="bc-footer w-full">
						<span>{companyDomain}</span>
						<span className="bc-footer-rule" aria-hidden="true" />
						<span className="bc-footer-code">{code}</span>
					</div>
				</div>
			</div>
		);
	}
);

CardChassis.displayName = 'CardChassis';
