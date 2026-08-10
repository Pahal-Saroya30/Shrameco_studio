'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
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
	Type,
} from 'lucide-react';

interface BrandWizardForm {
	companyName: string;
	industry: string;
	brandVoice: string;
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
			contentPillars: ['Product Updates', 'Industry Insights', 'Customer Stories'],
			bannedTopics: ['Politics', 'Unverified Claims'],
			bannedWords: ['Cheap', 'Guaranteed', 'Hype'],
			logoUrl: '',
			colorPalette: ['#1C2427', '#3D8090', '#B8D4D8', '#6B7F8A', '#2D5F68'],
			typography: {
				heading: 'Outfit',
				body: 'Inter',
			},
		},
	});

	const contentPillars = watch('contentPillars');
	const bannedTopics = watch('bannedTopics');
	const bannedWords = watch('bannedWords');
	const colorPalette = watch('colorPalette');
	const logoUrl = watch('logoUrl');
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
					if (p.contentPillars) setValue('contentPillars', p.contentPillars);
					if (p.bannedTopics) setValue('bannedTopics', p.bannedTopics);
					if (p.bannedWords) setValue('bannedWords', p.bannedWords);
					if (p.logoUrl) setValue('logoUrl', p.logoUrl);
					if (p.colorPalette) setValue('colorPalette', p.colorPalette);
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
		if (!colorPalette.includes(colorInput)) {
			setValue('colorPalette', [...colorPalette, colorInput]);
		}
	};

	const removeColor = (colorToRemove: string) => {
		if (colorPalette.length <= 1) return;
		setValue(
			'colorPalette',
			colorPalette.filter((c) => c !== colorToRemove)
		);
	};

	// When step changes to 3, enable submit after a 500ms safety delay to prevent double-click accidental submits
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
		// Strictly guard: only save & redirect if on Step 3 AND cooldown has elapsed
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
					<div className="w-10 h-10 border-4 border-[#3D8090]/30 border-t-[#3D8090] rounded-full animate-spin" />
					<p className="text-slate-600 text-sm font-medium">Loading Brand Studio Profile...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#EFF6F7] flex flex-col font-sans selection:bg-[#3D8090]/20 selection:text-[#2D5F68]">
			<Navbar />

			<main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
				{/* Step Indicator Progress Bar */}
				<div className="mb-8 p-6 bg-white/80 backdrop-blur-xl border border-white/90 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
					<div className="flex items-center justify-between mb-3.5">
						<div>
							<h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
								Brand Profile Setup
							</h1>
							<p className="text-slate-600 text-xs sm:text-sm mt-1">
								Configure your brand guidelines so AI content matches your exact voice & rules.
							</p>
						</div>
						<div className="text-right">
							<span className="inline-flex items-center px-3 py-1 rounded-full bg-[#3D8090]/15 text-[#3D8090] text-xs font-extrabold font-mono">
								Step {step} of 3
							</span>
						</div>
					</div>

					<div className="w-full bg-[#E2EFF1] rounded-full h-2.5 overflow-hidden border border-[#B8D4D8]/50 p-0.5 shadow-inner-soft">
						<div
							className="bg-gradient-to-r from-[#214349] via-[#2D5F68] to-[#3D8090] h-full rounded-full transition-all duration-500 ease-out shadow-sm"
							style={{ width: `${(step / 3) * 100}%` }}
						/>
					</div>

					<div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs font-extrabold">
						<button
							type="button"
							onClick={() => handleStepChange(1)}
							className={`py-2.5 px-2.5 rounded-2xl transition-all ${
								step === 1
									? 'bg-gradient-to-r from-[#214349] via-[#2D5F68] to-[#3D8090] text-white shadow-md shadow-[#2D5F68]/20'
									: step > 1
									? 'bg-white/90 text-[#3D8090] border border-[#3D8090]/30 hover:bg-[#3D8090]/10'
									: 'bg-white/70 text-slate-500 border border-[#B8D4D8]/60 hover:bg-white'
							}`}
						>
							1. Voice & Identity
						</button>
						<button
							type="button"
							onClick={() => handleStepChange(2)}
							className={`py-2.5 px-2.5 rounded-2xl transition-all ${
								step === 2
									? 'bg-gradient-to-r from-[#214349] via-[#2D5F68] to-[#3D8090] text-white shadow-md shadow-[#2D5F68]/20'
									: step > 2
									? 'bg-white/90 text-[#3D8090] border border-[#3D8090]/30 hover:bg-[#3D8090]/10'
									: 'bg-white/70 text-slate-500 border border-[#B8D4D8]/60 hover:bg-white'
							}`}
						>
							2. Guardrails & Pillars
						</button>
						<button
							type="button"
							onClick={() => handleStepChange(3)}
							className={`py-2.5 px-2.5 rounded-2xl transition-all ${
								step === 3
									? 'bg-gradient-to-r from-[#214349] via-[#2D5F68] to-[#3D8090] text-white shadow-md shadow-[#2D5F68]/20'
									: 'bg-white/70 text-slate-500 border border-[#B8D4D8]/60 hover:bg-white'
							}`}
						>
							3. Visual Brand
						</button>
					</div>
				</div>

				<GlassCard glow className="p-6 sm:p-8">
					{error && (
						<div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium">
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
						{/* STEP 1: Voice & Identity */}
						{step === 1 && (
							<div className="space-y-6 animate-fadeIn">
								<div className="flex items-center space-x-3 pb-3 border-b border-[#B8D4D8]/40">
									<Building2 className="w-5 h-5 text-[#3D8090]" />
									<h2 className="text-lg font-bold text-slate-900">Company Identity & Voice</h2>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<Input
										label="Company / Brand Name"
										placeholder="e.g. Acme Tech Solutions"
										error={errors.companyName?.message}
										{...register('companyName', { required: 'Company name is required' })}
									/>

									<Input
										label="Industry / Domain"
										placeholder="e.g. SaaS, Fintech, AI Developer Tools"
										error={errors.industry?.message}
										{...register('industry', { required: 'Industry is required' })}
									/>
								</div>

								<div className="space-y-2">
									<label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
										Brand Voice & Personality
									</label>
									<textarea
										rows={4}
										className="w-full bg-[#F5FAFB]/90 border border-[#B8D4D8]/80 text-slate-900 placeholder-slate-400 rounded-2xl p-4 text-sm focus:border-[#3D8090] focus:ring-2 focus:ring-[#3D8090]/20 focus:bg-white transition-all shadow-inner-soft"
										placeholder="Describe your brand tone (e.g., Authoritative yet approachable, witty, visionary, highly technical, concise, bold)."
										{...register('brandVoice', { required: 'Brand voice description is required' })}
									/>
									{errors.brandVoice && (
										<p className="text-xs text-rose-500 font-bold">
											{errors.brandVoice.message}
										</p>
									)}
								</div>
							</div>
						)}

						{/* STEP 2: Content Pillars & Banned Topics/Words */}
						{step === 2 && (
							<div className="space-y-6 animate-fadeIn">
								<div className="flex items-center space-x-3 pb-3 border-b border-[#B8D4D8]/40">
									<ShieldAlert className="w-5 h-5 text-[#3D8090]" />
									<h2 className="text-lg font-bold text-slate-900">Content Pillars & Safety Rules</h2>
								</div>

								{/* Content Pillars */}
								<div className="space-y-2">
									<label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
										Content Pillars (Core Themes)
									</label>
									<div className="flex space-x-2">
										<Input
											placeholder="Add a pillar (e.g., Thought Leadership, Tutorials)"
											value={pillarInput}
											onChange={(e) => setPillarInput(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													addTag('contentPillars', pillarInput, setPillarInput);
												}
											}}
										/>
										<Button
											type="button"
											variant="secondary"
											onClick={() => addTag('contentPillars', pillarInput, setPillarInput)}
											icon={<Plus className="w-4 h-4" />}
										>
											Add
										</Button>
									</div>
									<div className="flex flex-wrap gap-2 pt-2">
										{contentPillars.map((tag) => (
											<span
												key={tag}
												className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#3D8090]/15 border border-[#3D8090]/35 text-[#2D5F68] text-xs font-bold shadow-sm"
											>
												{tag}
												<button
													type="button"
													onClick={() => removeTag('contentPillars', tag)}
													className="ml-2 hover:text-rose-600 transition-colors p-0.5"
												>
													<X className="w-3.5 h-3.5" />
												</button>
											</span>
										))}
									</div>
								</div>

								{/* Banned Topics */}
								<div className="space-y-2 pt-2 border-t border-[#B8D4D8]/30">
									<label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
										Banned Topics (Never Mention)
									</label>
									<div className="flex space-x-2">
										<Input
											placeholder="Add banned topic (e.g., Competitor Names, Controversial Politics)"
											value={bannedTopicInput}
											onChange={(e) => setBannedTopicInput(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													addTag('bannedTopics', bannedTopicInput, setBannedTopicInput);
												}
											}}
										/>
										<Button
											type="button"
											variant="secondary"
											onClick={() => addTag('bannedTopics', bannedTopicInput, setBannedTopicInput)}
											icon={<Plus className="w-4 h-4" />}
										>
											Add
										</Button>
									</div>
									<div className="flex flex-wrap gap-2 pt-2">
										{bannedTopics.map((tag) => (
											<span
												key={tag}
												className="inline-flex items-center px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 text-xs font-bold"
											>
												{tag}
												<button
													type="button"
													onClick={() => removeTag('bannedTopics', tag)}
													className="ml-2 hover:text-rose-600 transition-colors"
												>
													<X className="w-3.5 h-3.5" />
												</button>
											</span>
										))}
									</div>
								</div>

								{/* Banned Words */}
								<div className="space-y-2 pt-2 border-t border-[#B8D4D8]/30">
									<label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
										Banned Words (Restricted Vocabulary)
									</label>
									<div className="flex space-x-2">
										<Input
											placeholder="Add banned word (e.g., cheap, guaranteed, viral)"
											value={bannedWordInput}
											onChange={(e) => setBannedWordInput(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													addTag('bannedWords', bannedWordInput, setBannedWordInput);
												}
											}}
										/>
										<Button
											type="button"
											variant="secondary"
											onClick={() => addTag('bannedWords', bannedWordInput, setBannedWordInput)}
											icon={<Plus className="w-4 h-4" />}
										>
											Add
										</Button>
									</div>
									<div className="flex flex-wrap gap-2 pt-2">
										{bannedWords.map((tag) => (
											<span
												key={tag}
												className="inline-flex items-center px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 text-xs font-bold"
											>
												{tag}
												<button
													type="button"
													onClick={() => removeTag('bannedWords', tag)}
													className="ml-2 hover:text-rose-600 transition-colors"
												>
													<X className="w-3.5 h-3.5" />
												</button>
											</span>
										))}
									</div>
								</div>
							</div>
						)}

						{/* STEP 3: Visual Identity */}
						{step === 3 && (
							<div className="space-y-6 animate-fadeIn">
								<div className="flex items-center space-x-3 pb-3 border-b border-[#B8D4D8]/40">
									<Palette className="w-5 h-5 text-[#3D8090]" />
									<h2 className="text-lg font-bold text-slate-900">Visual Identity Tokens</h2>
								</div>

								{/* Logo Upload */}
								<div className="space-y-2">
									<label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
										Brand Logo Asset
									</label>
									<div
										{...getRootProps()}
										className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
											isDragActive
												? 'border-[#3D8090] bg-[#3D8090]/10'
												: 'border-[#B8D4D8]/70 hover:border-[#3D8090]/50 bg-[#F5FAFB]'
										}`}
									>
										<input {...getInputProps()} />
										{logoUrl ? (
											<div className="flex flex-col items-center space-y-3">
												<img
													src={logoUrl}
													alt="Brand Logo Preview"
													className="h-16 object-contain max-w-full rounded-xl bg-white p-2 border border-[#B8D4D8]/60 shadow-sm"
												/>
												<p className="text-xs text-[#3D8090] font-bold">
													Click or drag to replace logo
												</p>
											</div>
										) : (
											<div className="flex flex-col items-center space-y-2">
												<Upload className="w-8 h-8 text-[#3D8090]" />
												<p className="text-sm font-bold text-slate-900">
													Drag & drop your PNG/SVG logo here
												</p>
												<p className="text-xs text-slate-500">
													Transparent background recommended (max 5MB)
												</p>
											</div>
										)}
									</div>
								</div>

								{/* Hex Color Palette Picker */}
								<div className="space-y-3 pt-2 border-t border-[#B8D4D8]/30">
									<label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
										Color Palette (Hex Codes)
									</label>
									<div className="flex items-center space-x-3">
										<input
											type="color"
											value={colorInput}
											onChange={(e) => setColorInput(e.target.value)}
											className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border-0"
										/>
										<Input
											value={colorInput}
											onChange={(e) => setColorInput(e.target.value)}
											placeholder="#3D8090"
											className="w-36 uppercase font-mono"
										/>
										<Button type="button" variant="secondary" onClick={addColor} icon={<Plus className="w-4 h-4" />}>
											Add Hex
										</Button>
									</div>

									<div className="flex flex-wrap gap-3 pt-2">
										{colorPalette.map((color) => (
											<div
												key={color}
												className="flex items-center space-x-2 bg-white border border-[#B8D4D8]/70 rounded-2xl p-1.5 pr-3 shadow-sm"
											>
												<div
													className="w-6 h-6 rounded-xl border border-slate-900/10 shadow-inner"
													style={{ backgroundColor: color }}
												/>
												<span className="font-mono text-xs uppercase text-slate-900 font-bold">{color}</span>
												<button
													type="button"
													onClick={() => removeColor(color)}
													className="text-slate-400 hover:text-rose-600 transition-colors ml-1"
												>
													<X className="w-3.5 h-3.5" />
												</button>
											</div>
										))}
									</div>
								</div>

								{/* Typography Selection */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#B8D4D8]/30">
									<div className="space-y-2">
										<label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
											Heading Font Family
										</label>
										<select
											className="w-full bg-[#F5FAFB] border border-[#B8D4D8]/80 text-slate-900 font-bold rounded-2xl px-4 py-2.5 text-sm focus:border-[#3D8090] focus:ring-2 focus:ring-[#3D8090]/20 focus:bg-white transition-all shadow-inner-soft"
											value={typography.heading}
											onChange={(e) =>
												setValue('typography', { ...typography, heading: e.target.value })
											}
										>
											<option value="Outfit">Outfit (Futuristic Display)</option>
											<option value="Inter">Inter (Clean Modern Sans)</option>
											<option value="Roboto">Roboto (Technical Sans)</option>
										</select>
									</div>

									<div className="space-y-2">
										<label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
											Body Font Family
										</label>
										<select
											className="w-full bg-[#F5FAFB] border border-[#B8D4D8]/80 text-slate-900 font-bold rounded-2xl px-4 py-2.5 text-sm focus:border-[#3D8090] focus:ring-2 focus:ring-[#3D8090]/20 focus:bg-white transition-all shadow-inner-soft"
											value={typography.body}
											onChange={(e) =>
												setValue('typography', { ...typography, body: e.target.value })
											}
										>
											<option value="Inter">Inter (High-Density Reading)</option>
											<option value="Outfit">Outfit (Modern Sans)</option>
											<option value="Roboto">Roboto (Neutral)</option>
										</select>
									</div>
								</div>
							</div>
						)}

						{/* Form Navigation Controls */}
						<div className="flex items-center justify-between pt-6 border-t border-[#B8D4D8]/30">
							{step > 1 ? (
								<Button
									type="button"
									variant="secondary"
									onClick={() => handleStepChange(step - 1)}
									icon={<ArrowLeft className="w-4 h-4" />}
								>
									Previous
								</Button>
							) : (
								<div />
							)}

							{step < 3 ? (
								<Button
									type="button"
									variant="primary"
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
									icon={<ArrowRight className="w-4 h-4 ml-1" />}
								>
									Next Step
								</Button>
							) : (
								<Button
									type="submit"
									variant="primary"
									disabled={!canSubmitStep3 || isSaving}
									isLoading={isSaving}
									className="px-6 bg-gradient-to-r from-[#2D5F68] to-[#3D8090] shadow-[#3D8090]/25"
									icon={<Sparkles className="w-4 h-4 mr-1" />}
								>
									Save Brand Profile
								</Button>
							)}
						</div>
					</form>
				</GlassCard>
			</main>
		</div>
	);
}
