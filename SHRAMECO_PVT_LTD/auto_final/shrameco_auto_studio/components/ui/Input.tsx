'use client';

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, helperText, className = '', id, ...props }, ref) => {
		const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

		return (
			<div className="w-full space-y-1.5">
				{label && (
					<label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-[#6B7F8A]">
						{label}
					</label>
				)}
				<input
					id={inputId}
					ref={ref}
					className={`w-full bg-[#F5FAFB]/90 backdrop-blur-md border border-[#B8D4D8]/80 text-[#1E3A40] placeholder-[#6B7F8A] rounded-2xl px-4.5 py-3 text-sm transition-all duration-200 focus:border-[#3D8090] focus:ring-2 focus:ring-[#3D8090]/25 focus:bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] font-medium ${
						error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''
					} ${className}`}
					{...props}
				/>
				{error ? (
					<p className="text-xs text-rose-500 font-medium">{error}</p>
				) : helperText ? (
					<p className="text-xs text-[#6B7F8A]">{helperText}</p>
				) : null}
			</div>
		);
	}
);

Input.displayName = 'Input';
