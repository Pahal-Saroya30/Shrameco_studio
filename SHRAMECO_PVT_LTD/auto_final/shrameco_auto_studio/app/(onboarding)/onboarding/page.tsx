'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { Navbar } from '@/components/ui/Navbar';
import {
	Building2,
	Palette,
	ShieldAlert,
	Upload,
	Plus,
	X,
	Check,
	ArrowRight,
	ArrowLeft,
	Sparkles,
	Sliders,
} from 'lucide-react';

interface BrandWizardForm {
	companyName: string;
	industry: string;
	brandVoice: string;
	tagline: string;
	outroLink: string;
	socialHandle: string;
	logoPosition: 'top-right' | 'top-left' | 'bottom-right' | 'hidden';
	contentPillars: string[];
	bannedTopics: string[];
	bannedWords: string[];
	logoUrl: string;
	colorPalette: string[];
	typography: {
		heading: string;
		body: string;
	};
}

const PRE_CURATED_THEMES = [
	{
		id: 'neon-tech',
		name: 'Neon Tech',
		icon: '⚡',
		colors: ['#6366F1', '#06B6D4', '#3B82F6'],
	},
	{
		id: 'sunset-rose',
		name: 'Sunset Rose',
		icon: '🌅',
		colors: ['#EC4899', '#F43F5E', '#E11D48'],
	},
	{
		id: 'royal-mint',
		name: 'Royal Mint',
		icon: '🌲',
		colors: ['#065F46', '#059669', '#10B981'],
	},
	{
		id: 'deep-slate',
		name: 'Deep Slate',
		icon: '🌊',
		colors: ['#0F172A', '#1E293B', '#38BDF8'],
	},
];

export default function OnboardingPage() {
	const router = useRouter();
	const [step, setStep] = useState(1);
	const [canSubmitStep3, setCanSubmitStep3] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Tag inputs state
	const [pillarInput, setPillarInput] = useState('');
	const [bannedTopicInput, setBannedTopicInput] = useState('');
	const [bannedWordInput, setBannedWordInput] = useState('');
	const [colorInput, setColorInput] = useState('#6366F1');

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<BrandWizardForm>({
		defaultValues: {
			companyName: '',
			industry: '',
			brandVoice: '',
			tagline: '',
			outroLink: '',
			socialHandle: '',
			logoPosition: 'top-left',
			contentPillars: ['Product Updates', 'Industry Insights', 'Customer Stories'],
			bannedTopics: ['Politics', 'Unverified Claims'],
			bannedWords: ['Cheap', 'Guaranteed', 'Hype'],
			logoUrl: '',
			colorPalette: ['#1E293B', '#3B82F6'],
			typography: {
				heading: 'Outfit (Futuristic Display)',
				body: 'Inter (High-Density Reading)',
			},
		},
	});

	const contentPillars = watch('contentPillars') || [];
	const bannedTopics = watch('bannedTopics') || [];
	const bannedWords = watch('bannedWords') || [];
	const colorPalette = watch('colorPalette') || [];
	const logoUrl = watch('logoUrl');
	const logoPosition = watch('logoPosition') || 'top-left';
	const typography = watch('typography');

	// Prefill profile if existing
	useEffect(() => {
		async function fetchBrandProfile() {
			try {
				const res = await fetch('/api/brand');
				const data = await res.json();
				if (res.ok && data.profile) {
					const p = data.profile;
					setValue('companyName', p.companyName || '');
					setValue('industry', p.industry || '');
					setValue('brandVoice', p.brandVoice || '');
					setValue('tagline', p.tagline || '');
					setValue('outroLink', p.outroLink || '');
					setValue('socialHandle', p.socialHandle || '');
					setValue('logoPosition', p.logoPosition || 'top-left');
					if (p.contentPillars && p.contentPillars.length > 0) setValue('contentPillars', p.contentPillars);
					if (p.bannedTopics && p.bannedTopics.length > 0) setValue('bannedTopics', p.bannedTopics);
					if (p.bannedWords && p.bannedWords.length > 0) setValue('bannedWords', p.bannedWords);
					if (p.logoUrl) setValue('logoUrl', p.logoUrl);
					if (p.colorPalette && p.colorPalette.length > 0) setValue('colorPalette', p.colorPalette);
					if (p.typography) setValue('typography', p.typography);
				}
			} catch (err) {
				console.error('Failed to load profile:', err);
			} finally {
				setIsLoading(false);
			}
		}
		fetchBrandProfile();
	}, [setValue]);

	// Dropzone handler for Logo Upload
	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			const file = acceptedFiles[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = () => {
					setValue('logoUrl', reader.result as string);
				};
				reader.readAsDataURL(file);
			}
		},
		[setValue]
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.webp'] },
		maxFiles: 1,
	});

	// Tag helper functions
	const addTag = (
		field: 'contentPillars' | 'bannedTopics' | 'bannedWords',
		value: string,
		setInput: (v: string) => void
	) => {
		const trimmed = value.trim();
		if (!trimmed) return;
		const current = watch(field) || [];
		if (!current.includes(trimmed)) {
			setValue(field, [...current, trimmed]);
		}
		setInput('');
	};

	const removeTag = (
		field: 'contentPillars' | 'bannedTopics' | 'bannedWords',
		tagToRemove: string
	) => {
		const current = watch(field) || [];
		setValue(
			field,
			current.filter((tag) => tag !== tagToRemove)
		);
	};

	const addColor = () => {
		const hex = colorInput.trim().toUpperCase();
		if (!hex) return;
		const formatted = hex.startsWith('#') ? hex : `#${hex}`;
		if (!colorPalette.includes(formatted)) {
			setValue('colorPalette', [...colorPalette, formatted]);
		}
	};

	const removeColor = (colorToRemove: string) => {
		if (colorPalette.length <= 1) return;
		setValue(
			'colorPalette',
			colorPalette.filter((c) => c !== colorToRemove)
		);
	};

	const selectPreCuratedTheme = (themeColors: string[]) => {
		setValue('colorPalette', themeColors);
	};

	// When step changes to 3, enable submit after a 500ms safety delay
	useEffect(() => {
		if (step === 3) {
			setCanSubmitStep3(false);
			const timer = setTimeout(() => setCanSubmitStep3(true), 500);
			return () => clearTimeout(timer);
		} else {
			setCanSubmitStep3(false);
		}
	}, [step]);

	const handleStepChange = (newStep: number) => {
		setError(null);
		setStep(newStep);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const handleFinalSubmit = async (data: BrandWizardForm) => {
		if (step !== 3 || !canSubmitStep3) return;

		setIsSaving(true);
		setError(null);
		try {
			const res = await fetch('/api/brand', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			const result = await res.json();
			if (!res.ok) {
				throw new Error(result.error || 'Failed to save brand profile');
			}
			router.push('/dashboard');
			router.refresh();
		} catch (err: any) {
			setError(err.message || 'Error saving profile.');
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#EFF6F7] text-slate-800 flex items-center justify-center font-sans">
				<div className="flex flex-col items-center space-y-4">
					<div className="w-10 h-10 border-4 border-[#1d4d4f]/30 border-t-[#1d4d4f] rounded-full animate-spin" />
					<p className="text-slate-600 text-sm font-medium">Loading Brand Profile...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#EFF6F7] flex flex-col font-sans">
			<Navbar />

			<main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
				{/* Top Card: Step Indicator Progress Bar */}
				<div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm">
					<div className="flex items-center justify-between mb-3.5">
						<div>
							<h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
								Brand Profile Setup
							</h1>
							<p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
								Configure your brand guidelines so AI content matches your exact voice & rules.
							</p>
						</div>
						<div className="text-right flex-shrink-0">
							<span className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#E0EDEF] text-[#1d4d4f] text-xs font-black">
								Step {step} of 3
							</span>
						</div>
					</div>

					{/* Thin progress line */}
					<div className="w-full bg-[#E2EFF1] rounded-full h-1.5 overflow-hidden my-3">
						<div
							className="bg-[#1d4d4f] h-full rounded-full transition-all duration-500 ease-out"
							style={{ width: `${(step / 3) * 100}%` }}
						/>
					</div>

					{/* 3 Step Pill Buttons */}
					<div className="grid grid-cols-3 gap-3 mt-4 text-center text-xs font-bold">
						<button
							type="button"
							onClick={() => handleStepChange(1)}
							className={`py-3 px-3 rounded-2xl transition-all cursor-pointer ${
								step === 1
									? 'bg-[#1d4d4f] text-white shadow-sm font-black'
									: 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
							}`}
						>
							1. Voice & Identity
						</button>
						<button
							type="button"
							onClick={() => handleStepChange(2)}
							className={`py-3 px-3 rounded-2xl transition-all cursor-pointer ${
								step === 2
									? 'bg-[#1d4d4f] text-white shadow-sm font-black'
									: 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
							}`}
						>
							2. Guardrails & Pillars
						</button>
						<button
							type="button"
							onClick={() => handleStepChange(3)}
							className={`py-3 px-3 rounded-2xl transition-all cursor-pointer ${
								step === 3
									? 'bg-[#1d4d4f] text-white shadow-sm font-black'
									: 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
							}`}
						>
							3. Visual Brand
						</button>
					</div>
				</div>

				{/* Main Form Card */}
				<div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
					{error && (
						<div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold">
							{error}
						</div>
					)}

					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (step === 3 && canSubmitStep3) {
								handleSubmit(handleFinalSubmit)(e);
							} else {
								if (step === 1) {
									const cName = watch('companyName');
									const ind = watch('industry');
									const bVoice = watch('brandVoice');
									if (!cName || !ind || !bVoice) {
										setError('Please complete all required fields in Step 1 before proceeding.');
										return;
									}
									handleStepChange(2);
								} else if (step === 2) {
									handleStepChange(3);
								}
							}
						}}
						className="space-y-6"
					>
						{/* STEP 1: Company Identity & Voice */}
						{step === 1 && (
							<div className="space-y-6 animate-fade-in">
								<div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
									<Building2 className="w-5 h-5 text-[#1d4d4f]" />
									<h2 className="text-base font-black text-slate-900">Company Identity & Voice</h2>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
											COMPANY / BRAND NAME
										</label>
										<input
											type="text"
											placeholder="e.g. Shrameco"
											className="w-full bg-[#F5FAFB] border border-[#B8D4D8]/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-semibold placeholder-slate-400 focus:bg-white focus:border-[#1d4d4f] focus:outline-none transition-all"
											{...register('companyName', { required: 'Company name is required' })}
										/>
										{errors.companyName && (
											<p className="text-xs text-rose-500 font-bold">{errors.companyName.message}</p>
										)}
									</div>

									<div className="space-y-1.5">
										<label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
											INDUSTRY / DOMAIN
										</label>
										<input
											type="text"
											placeholder="e.g. It industry"
											className="w-full bg-[#F5FAFB] border border-[#B8D4D8]/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-semibold placeholder-slate-400 focus:bg-white focus:border-[#1d4d4f] focus:outline-none transition-all"
											{...register('industry', { required: 'Industry is required' })}
										/>
										{errors.industry && (
											<p className="text-xs text-rose-500 font-bold">{errors.industry.message}</p>
										)}
									</div>
								</div>

								<div className="space-y-1.5">
									<label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
										BRAND VOICE & PERSONALITY
									</label>
									<textarea
										rows={4}
										className="w-full bg-[#F5FAFB] border border-[#B8D4D8]/80 rounded-2xl p-4 text-sm text-slate-900 font-semibold placeholder-slate-400 focus:bg-white focus:border-[#1d4d4f] focus:outline-none transition-all"
										placeholder="Describe your brand voice (e.g. Clear and energetic, authoritative yet friendly, witty, direct)."
										{...register('brandVoice', { required: 'Brand voice description is required' })}
									/>
									{errors.brandVoice && (
										<p className="text-xs text-rose-500 font-bold">{errors.brandVoice.message}</p>
									)}
								</div>

								{/* Marketing & Outro Context Section */}
								<div className="pt-4 border-t border-slate-100 space-y-4">
									<h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
										MARKETING & OUTRO CONTEXT
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div className="space-y-1.5">
											<label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
												BRAND TAGLINE / SLOGAN
											</label>
											<input
												type="text"
												placeholder="Build in public, grow in seconds"
												className="w-full bg-[#F5FAFB] border border-[#B8D4D8]/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:bg-white focus:border-[#1d4d4f] focus:outline-none transition-all"
												{...register('tagline')}
											/>
										</div>

										<div className="space-y-1.5">
											<label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
												DEFAULT OUTRO LINK / CTA
											</label>
											<input
												type="text"
												placeholder="e.g. acme.com/try"
												className="w-full bg-[#F5FAFB] border border-[#B8D4D8]/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:bg-white focus:border-[#1d4d4f] focus:outline-none transition-all"
												{...register('outroLink')}
											/>
										</div>

										<div className="space-y-1.5">
											<label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
												DEFAULT SOCIAL HANDLE / WATERMARK
											</label>
											<input
												type="text"
												placeholder="@shrameco"
												className="w-full bg-[#F5FAFB] border border-[#B8D4D8]/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:bg-white focus:border-[#1d4d4f] focus:outline-none transition-all"
												{...register('socialHandle')}
											/>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* STEP 2: Content Pillars & Guardrails */}
						{step === 2 && (
							<div className="space-y-6 animate-fade-in">
								<div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
									<ShieldAlert className="w-5 h-5 text-[#1d4d4f]" />
									<h2 className="text-base font-black text-slate-900">Guardrails & Pillars</h2>
								</div>

								{/* Content Pillars */}
								<div className="space-y-2">
									<label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
										CONTENT PILLARS (CORE THEMES)
									</label>
									<div className="flex space-x-2">
										<input
											type="text"
											placeholder="Add a pillar (e.g. Product Updates, Industry Insights)"
											value={pillarInput}
											onChange={(e) => setPillarInput(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													addTag('contentPillars', pillarInput, setPillarInput);
												}
											}}
											className="flex-1 bg-[#F5FAFB] border border-[#B8D4D8]/80 rounded-xl px-4 py-2 text-sm text-slate-900 font-semibold placeholder-slate-400 focus:bg-white focus:border-[#1d4d4f] focus:outline-none"
										/>
										<button
											type="button"
											onClick={() => addTag('contentPillars', pillarInput, setPillarInput)}
											className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
										>
											<Plus className="w-3.5 h-3.5" />
											<span>Add</span>
										</button>
									</div>
									<div className="flex flex-wrap gap-2 pt-2">
										{contentPillars.map((tag) => (
											<span
												key={tag}
												className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#E0EDEF] border border-[#B8D4D8] text-[#1d4d4f] text-xs font-bold"
											>
												{tag}
												<button
													type="button"
													onClick={() => removeTag('contentPillars', tag)}
													className="ml-2 hover:text-rose-600 transition-colors"
												>
													<X className="w-3 h-3" />
												</button>
											</span>
										))}
									</div>
								</div>

								{/* Banned Topics */}
								<div className="space-y-2 pt-4 border-t border-slate-100">
									<label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
										BANNED TOPICS (NEVER MENTION)
									</label>
									<div className="flex space-x-2">
										<input
											type="text"
											placeholder="Add banned topic (e.g. Politics, Unverified Claims)"
											value={bannedTopicInput}
											onChange={(e) => setBannedTopicInput(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													addTag('bannedTopics', bannedTopicInput, setBannedTopicInput);
												}
											}}
											className="flex-1 bg-[#F5FAFB] border border-[#B8D4D8]/80 rounded-xl px-4 py-2 text-sm text-slate-900 font-semibold placeholder-slate-400 focus:bg-white focus:border-[#1d4d4f] focus:outline-none"
										/>
										<button
											type="button"
											onClick={() => addTag('bannedTopics', bannedTopicInput, setBannedTopicInput)}
											className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
										>
											<Plus className="w-3.5 h-3.5" />
											<span>Add</span>
										</button>
									</div>
									<div className="flex flex-wrap gap-2 pt-2">
										{bannedTopics.map((tag) => (
											<span
												key={tag}
												className="inline-flex items-center px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold"
											>
												{tag}
												<button
													type="button"
													onClick={() => removeTag('bannedTopics', tag)}
													className="ml-2 hover:text-rose-900 transition-colors"
												>
													<X className="w-3 h-3" />
												</button>
											</span>
										))}
									</div>
								</div>

								{/* Banned Words */}
								<div className="space-y-2 pt-4 border-t border-slate-100">
									<label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
										BANNED WORDS (RESTRICTED VOCABULARY)
									</label>
									<div className="flex space-x-2">
										<input
											type="text"
											placeholder="Add banned word (e.g. cheap, guaranteed, viral)"
											value={bannedWordInput}
											onChange={(e) => setBannedWordInput(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													addTag('bannedWords', bannedWordInput, setBannedWordInput);
												}
											}}
											className="flex-1 bg-[#F5FAFB] border border-[#B8D4D8]/80 rounded-xl px-4 py-2 text-sm text-slate-900 font-semibold placeholder-slate-400 focus:bg-white focus:border-[#1d4d4f] focus:outline-none"
										/>
										<button
											type="button"
											onClick={() => addTag('bannedWords', bannedWordInput, setBannedWordInput)}
											className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
										>
											<Plus className="w-3.5 h-3.5" />
											<span>Add</span>
										</button>
									</div>
									<div className="flex flex-wrap gap-2 pt-2">
										{bannedWords.map((tag) => (
											<span
												key={tag}
												className="inline-flex items-center px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold"
											>
												{tag}
												<button
													type="button"
													onClick={() => removeTag('bannedWords', tag)}
													className="ml-2 hover:text-amber-950 transition-colors"
												>
													<X className="w-3 h-3" />
												</button>
											</span>
										))}
									</div>
								</div>
							</div>
						)}

						{/* STEP 3: Visual Brand */}
						{step === 3 && (
							<div className="space-y-6 animate-fade-in">
								<div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
									<Palette className="w-5 h-5 text-[#1d4d4f]" />
									<h2 className="text-base font-black text-slate-900">Visual Identity Tokens</h2>
								</div>

								{/* Logo Upload */}
								<div className="space-y-2">
									<label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
										BRAND LOGO ASSET
									</label>
									<div
										{...getRootProps()}
										className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
											isDragActive
												? 'border-[#1d4d4f] bg-[#E0EDEF]'
												: 'border-[#B8D4D8]/80 hover:border-[#1d4d4f]/60 bg-[#F5FAFB]'
										}`}
									>
										<input {...getInputProps()} />
										{logoUrl ? (
											<div className="flex flex-col items-center space-y-2">
												<img
													src={logoUrl}
													alt="Brand Logo Preview"
													className="h-14 object-contain max-w-full rounded-xl bg-white p-2 border border-slate-200 shadow-2xs"
												/>
												<p className="text-xs text-[#1d4d4f] font-bold">
													Click or drag to replace logo
												</p>
											</div>
										) : (
											<div className="flex flex-col items-center space-y-2">
												<div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-2xs">
													<Upload className="w-5 h-5 text-[#1d4d4f]" />
												</div>
												<p className="text-xs text-slate-600 font-bold">
													Click or drag to replace logo
												</p>
											</div>
										)}
									</div>
								</div>

								{/* Logo Position In Video Canvas */}
								<div className="space-y-2 pt-2">
									<label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
										LOGO POSITION IN VIDEO CANVAS
									</label>
									<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
										{[
											{ id: 'top-right', label: 'Top Right', icon: '↗' },
											{ id: 'top-left', label: 'Top Left', icon: '↖' },
											{ id: 'bottom-right', label: 'Bottom Right', icon: '↘' },
											{ id: 'hidden', label: 'Hidden', icon: '🚫' },
										].map((pos) => {
											const isActive = logoPosition === pos.id;
											return (
												<button
													key={pos.id}
													type="button"
													onClick={() => setValue('logoPosition', pos.id as any)}
													className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 ${
														isActive
															? 'bg-[#1d4d4f] text-white border-[#1d4d4f] shadow-sm font-black'
															: 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
													}`}
												>
													<span>{pos.icon}</span>
													<span>{pos.label}</span>
												</button>
											);
										})}
									</div>
								</div>

								{/* Color Palette (Hex Codes) */}
								<div className="space-y-2 pt-4 border-t border-slate-100">
									<label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
										COLOR PALETTE (HEX CODES)
									</label>
									<div className="flex items-center space-x-3">
										<div className="flex-1 flex items-center space-x-2 bg-[#F5FAFB] border border-[#B8D4D8]/80 rounded-xl px-3 py-1.5">
											<input
												type="color"
												value={colorInput}
												onChange={(e) => setColorInput(e.target.value)}
												className="w-6 h-6 rounded-lg bg-transparent cursor-pointer border-0"
											/>
											<input
												type="text"
												value={colorInput}
												onChange={(e) => setColorInput(e.target.value)}
												placeholder="#6366F1"
												className="w-full bg-transparent text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none"
											/>
										</div>
										<button
											type="button"
											onClick={addColor}
											className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl shadow-2xs flex items-center space-x-1.5 cursor-pointer"
										>
											<Plus className="w-3.5 h-3.5" />
											<span>Add Hex</span>
										</button>
									</div>

									{/* Quick Pre-curated Color Themes */}
									<div className="pt-2">
										<label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">
											QUICK PRE-CURATED COLOR THEMES
										</label>
										<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
											{PRE_CURATED_THEMES.map((theme) => (
												<div
													key={theme.id}
													onClick={() => selectPreCuratedTheme(theme.colors)}
													className="bg-white border border-slate-200 rounded-xl p-2.5 cursor-pointer hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col space-y-2"
												>
													<div className="flex items-center space-x-1">
														<span className="text-xs">{theme.icon}</span>
														<span className="text-[11px] font-bold text-slate-800 truncate">{theme.name}</span>
													</div>
													<div className="flex items-center space-x-1.5">
														{theme.colors.map((c, ci) => (
															<span
																key={ci}
																className="w-3.5 h-3.5 rounded-full border border-slate-900/10 shadow-2xs"
																style={{ backgroundColor: c }}
															/>
														))}
													</div>
												</div>
											))}
										</div>
									</div>

									{/* Active Color Chips */}
									<div className="flex flex-wrap gap-2 pt-2">
										{colorPalette.map((color) => (
											<span
												key={color}
												className="inline-flex items-center space-x-2 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800 shadow-2xs"
											>
												<span
													className="w-3.5 h-3.5 rounded-full border border-slate-900/10"
													style={{ backgroundColor: color }}
												/>
												<span>{color}</span>
												<button
													type="button"
													onClick={() => removeColor(color)}
													className="text-slate-400 hover:text-rose-600 transition-colors ml-1"
												>
													<X className="w-3 h-3" />
												</button>
											</span>
										))}
									</div>
								</div>

								{/* Typography Selection */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
									<div className="space-y-1.5">
										<label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
											HEADING FONT FAMILY
										</label>
										<select
											className="w-full bg-[#F5FAFB] border border-[#B8D4D8]/80 text-slate-900 font-bold rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:border-[#1d4d4f] focus:outline-none transition-all cursor-pointer"
											value={typography.heading}
											onChange={(e) =>
												setValue('typography', { ...typography, heading: e.target.value })
											}
										>
											<option value="Outfit (Futuristic Display)">Outfit (Futuristic Display)</option>
											<option value="Inter (Clean Modern Sans)">Inter (Clean Modern Sans)</option>
											<option value="Roboto (Technical Sans)">Roboto (Technical Sans)</option>
										</select>
									</div>

									<div className="space-y-1.5">
										<label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
											BODY FONT FAMILY
										</label>
										<select
											className="w-full bg-[#F5FAFB] border border-[#B8D4D8]/80 text-slate-900 font-bold rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:border-[#1d4d4f] focus:outline-none transition-all cursor-pointer"
											value={typography.body}
											onChange={(e) =>
												setValue('typography', { ...typography, body: e.target.value })
											}
										>
											<option value="Inter (High-Density Reading)">Inter (High-Density Reading)</option>
											<option value="Outfit (Modern Sans)">Outfit (Modern Sans)</option>
											<option value="Roboto (Neutral)">Roboto (Neutral)</option>
										</select>
									</div>
								</div>
							</div>
						)}

						{/* Form Navigation Controls */}
						<div className="flex items-center justify-between pt-6 border-t border-slate-100">
							{step > 1 ? (
								<button
									type="button"
									onClick={() => handleStepChange(step - 1)}
									className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs flex items-center space-x-1.5 cursor-pointer transition-colors"
								>
									<ArrowLeft className="w-4 h-4" />
									<span>Previous</span>
								</button>
							) : (
								<div />
							)}

							{step < 3 ? (
								<button
									type="button"
									onClick={() => {
										if (step === 1) {
											const cName = watch('companyName');
											const ind = watch('industry');
											const bVoice = watch('brandVoice');
											if (!cName || !ind || !bVoice) {
												setError('Please complete all required fields in Step 1 before proceeding.');
												return;
											}
											handleStepChange(2);
										} else if (step === 2) {
											handleStepChange(3);
										}
									}}
									className="px-6 py-2.5 bg-[#1d4d4f] hover:bg-[#15383b] text-white text-xs font-black rounded-xl shadow-sm flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95"
								>
									<span>Next Step</span>
									<ArrowRight className="w-4 h-4" />
								</button>
							) : (
								<button
									type="submit"
									disabled={!canSubmitStep3 || isSaving}
									className="px-6 py-2.5 bg-[#1d4d4f] hover:bg-[#15383b] text-white text-xs font-black rounded-xl shadow-sm flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
								>
									<Sparkles className="w-4 h-4" />
									<span>{isSaving ? 'Saving...' : 'Save Brand Profile'}</span>
								</button>
							)}
						</div>
					</form>
				</div>
			</main>
		</div>
	);
}
