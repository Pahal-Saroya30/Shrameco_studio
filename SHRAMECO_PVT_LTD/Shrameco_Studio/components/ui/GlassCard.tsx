'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
	className?: string;
	glow?: boolean;
	animate?: boolean;
	hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
	children,
	className = '',
	glow = false,
	animate = true,
	hoverEffect = false,
	...props
}) => {
	const baseClass = `relative bg-white/75 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-3xl p-6 sm:p-7 transition-all duration-300 ${
		glow
			? 'ring-1 ring-[#3D8090]/25 shadow-teal-glow/50 border-[#3D8090]/35'
			: 'hover:border-white'
	} ${hoverEffect ? 'hover:shadow-[0_12px_40px_rgba(0,0,0,0.07)] hover:-translate-y-1' : ''} ${className}`;

	const content = (
		<div className={baseClass} {...props}>
			{glow && (
				<div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-[#3D8090]/15 via-transparent to-[#B8D4D8]/20 opacity-80 blur-md pointer-events-none" />
			)}
			<div className="relative z-10">{children}</div>
		</div>
	);

	if (!animate) return content;

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
		>
			{content}
		</motion.div>
	);
};
