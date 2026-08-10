'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ArrowRight } from 'lucide-react';

interface LoginFormInputs {
	email: string;
	password: string;
}

export default function LoginPage() {
	const router = useRouter();
	const [serverError, setServerError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormInputs>();

	const onSubmit = async (data: LoginFormInputs) => {
		setIsLoading(true);
		setServerError(null);

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});

			const json = await res.json();

			if (!res.ok) {
				throw new Error(json.error || 'Failed to sign in');
			}

			router.push('/dashboard');
			router.refresh();
		} catch (err: any) {
			setServerError(err.message || 'An unexpected error occurred. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-radial-glow relative overflow-hidden">
			{/* Multi-orb ambient background mesh */}
			<div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#3D8090]/15 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
			<div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-[#B8D4D8]/30 rounded-full blur-3xl pointer-events-none" />

			<div className="w-full max-w-md relative z-10">
				<div className="text-center mb-8 flex flex-col items-center">
					<div className="mb-4">
						<BrandLogo size={68} showText={false} />
					</div>
					<h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
						Welcome Back
					</h1>
					<p className="text-slate-600 text-sm mt-1.5 font-medium">
						Sign in to access your Brand Content Studio
					</p>
				</div>

				<GlassCard glow className="p-8 shadow-glass-lg">
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
						{serverError && (
							<div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
								{serverError}
							</div>
						)}

						<div className="relative">
							<Input
								label="Email Address"
								type="email"
								placeholder="you@company.com"
								error={errors.email?.message}
								{...register('email', {
									required: 'Email address is required',
									pattern: {
										value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
										message: 'Invalid email address format',
									},
								})}
							/>
						</div>

						<div className="relative">
							<Input
								label="Password"
								type="password"
								placeholder="••••••••"
								error={errors.password?.message}
								{...register('password', {
									required: 'Password is required',
									minLength: {
										value: 6,
										message: 'Password must be at least 6 characters',
									},
								})}
							/>
						</div>

						<Button
							type="submit"
							variant="primary"
							isLoading={isLoading}
							className="w-full py-3 mt-2 text-sm font-semibold"
							icon={<ArrowRight className="w-4 h-4" />}
						>
							Sign In
						</Button>
					</form>

					<div className="mt-6 text-center pt-6 border-t border-[#B8D4D8]/40">
						<p className="text-sm text-[#6B7F8A]">
							Don't have an account?{' '}
							<Link
								href="/signup"
								className="text-[#3D8090] hover:text-[#2D5F68] font-bold hover:underline"
							>
								Create an account
							</Link>
						</p>
					</div>
				</GlassCard>
			</div>
		</div>
	);
}
