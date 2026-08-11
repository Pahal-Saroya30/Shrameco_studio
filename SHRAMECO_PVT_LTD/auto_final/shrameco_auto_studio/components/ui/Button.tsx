'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
	variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
	isLoading?: boolean;
	icon?: React.ReactNode;
	className?: string;
}

export const Button: React.FC<ButtonProps> = ({
	children,
	variant = 'primary',
	isLoading = false,
	icon,
	className = '',
	disabled,
	...props
}) => {
	const baseStyles =
		'inline-flex items-center justify-center font-bold rounded-2xl px-5 py-2.5 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D8090]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#EFF6F7] disabled:opacity-50 disabled:cursor-not-allowed select-none tracking-wide';

	const variants = {
		primary:
			'bg-gradient-to-r from-[#214349] via-[#2D5F68] to-[#3D8090] hover:from-[#1A373D] hover:via-[#255057] hover:to-[#336C7A] text-white shadow-md shadow-[#2D5F68]/25 border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] active:scale-[0.98]',
		secondary:
			'bg-white/85 backdrop-blur-xl hover:bg-white text-[#23464C] border border-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#3D8090]/40 hover:text-[#163035] hover:shadow-md active:scale-[0.98]',
		ghost: 'hover:bg-[#3D8090]/12 text-[#546A76] hover:text-[#1A373D] active:scale-[0.98]',
		danger:
			'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white border border-rose-400/30 shadow-md shadow-rose-500/20 active:scale-[0.98]',
	};

	return (
		<motion.button
			whileHover={{ y: -1, scale: 1.01 }}
			whileTap={{ scale: 0.98 }}
			transition={{ type: 'spring', stiffness: 400, damping: 25 }}
			className={`${baseStyles} ${variants[variant]} ${className}`}
			disabled={disabled || isLoading}
			{...(props as any)}
		>
			{isLoading ? (
				<Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />
			) : icon ? (
				<span className="mr-2 flex items-center">{icon}</span>
			) : null}
			{children}
		</motion.button>
	);
};
