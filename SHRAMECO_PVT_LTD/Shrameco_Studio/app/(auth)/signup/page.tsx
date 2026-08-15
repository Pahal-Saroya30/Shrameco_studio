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

interface SignupFormInputs {
	name: string;
	email: string;
	password: string;
	companyName: string;
}

export default function SignupPage() {
	const router = useRouter();
	const [serverError, setServerError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignupFormInputs>();

	const onSubmit = async (data: SignupFormInputs) => {
		setIsLoading(true);
		setServerError(null);

		try {
			const res = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});

			const json = await res.json();

			if (!res.ok) {
				throw new Error(json.error || 'Failed to create account');
			}

			router.push('/onboarding');
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
						Create Your Studio
					</h1>
					<p className="text-slate-600 text-sm mt-1.5 font-medium">
						Build brand-aligned social media content in seconds
					</p>
				</div>

				<GlassCard glow className="p-8 shadow-glass-lg">
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
						{serverError && (
							<div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
								{serverError}
							</div>
						)}

						<Input
							label="Full Name"
							type="text"
							placeholder="John Doe"
							error={errors.name?.message}
							{...register('name', {
								required: 'Full name is required',
								minLength: {
									value: 2,
									message: 'Name must be at least 2 characters',
								},
							})}
						/>

						<Input
							label="Company / Brand Name"
							type="text"
							placeholder="Acme Studio"
							error={errors.companyName?.message}
							{...register('companyName', {
								required: 'Company name is required',
								minLength: {
									value: 2,
									message: 'Company name must be at least 2 characters',
								},
							})}
						/>

						<Input
							id="email"
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

						<div className="relative">
							<Input
								label="Password"
								type="password"
								placeholder="Minimum 6 characters"
								error={errors.password?.message}
								{...register('password', {
									required: 'Password is required',
									minLength: {
										value: 6,
										message: 'Password must be at least 6 characters',
									},
								})}
							/>
							<div className="flex justify-end mt-1.5">
								<button
									type="button"
									onClick={async () => {
										const emailVal = (document.getElementById('email') as HTMLInputElement)?.value;
										if (!emailVal) {
											alert('Please enter your email address first.');
											return;
										}
										try {
											const res = await fetch('/api/auth/forgot-password', {
												method: 'POST',
												headers: { 'Content-Type': 'application/json' },
												body: JSON.stringify({ email: emailVal }),
											});
											const data = await res.json();
											alert(data.message || data.error);
										} catch (err) {
											alert('Network error.');
										}
									}}
									className="text-xs font-bold text-[#3D8090] hover:text-[#2D5F68] hover:underline"
								>
									Forgot Password?
								</button>
							</div>
						</div>

						<Button
							type="submit"
							variant="primary"
							isLoading={isLoading}
							className="w-full py-3 mt-2 text-sm font-semibold"
							icon={<ArrowRight className="w-4 h-4" />}
						>
							Get Started Free
						</Button>
					</form>

					<div className="mt-6 text-center pt-6 border-t border-[#B8D4D8]/40">
						<p className="text-sm text-[#6B7F8A]">
							Already have an account?{' '}
							<Link
								href="/login"
								className="text-[#3D8090] hover:text-[#2D5F68] font-bold hover:underline"
							>
								Sign in
							</Link>
						</p>
					</div>
				</GlassCard>
			</div>
		</div>
	);
}
