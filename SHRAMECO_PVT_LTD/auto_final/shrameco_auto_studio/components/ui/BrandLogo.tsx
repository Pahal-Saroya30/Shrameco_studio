'use client';

import React from 'react';

interface BrandLogoProps {
	size?: number;
	showText?: boolean;
	className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
	size = 40,
	showText = true,
	className = '',
}) => {
	return (
		<div className={`flex items-center space-x-3 select-none ${className}`}>
			{/* Brand Logo Symbol */}
			<div
				className="relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-[#2D5F68] via-[#3D8090] to-[#6B7F8A] shadow-md shadow-[#3D8090]/25 transition-transform duration-200 group-hover:scale-105"
				style={{ width: size, height: size, padding: size * 0.05 }}
			>
				<svg
					width={size * 0.65}
					height={size * 0.65}
					viewBox="0 0 48 48"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					{/* Main central sparkle */}
					<path
						d="M24 4 L28.5 19.5 L44 24 L28.5 28.5 L24 44 L19.5 28.5 L4 24 L19.5 19.5 Z"
						fill="#FFFFFF"
					/>
					{/* Accent secondary sparkle */}
					<path
						d="M36 8 L38 14 L44 16 L38 18 L36 24 L34 18 L28 16 L34 14 Z"
						fill="#B8D4D8"
						opacity="0.85"
					/>
				</svg>
			</div>

			{showText && (
				<span className="font-display font-bold text-lg text-[#283033] tracking-tight">
					Brand<span className="text-[#3D8090]">Studio</span>
				</span>
			)}
		</div>
	);
};
