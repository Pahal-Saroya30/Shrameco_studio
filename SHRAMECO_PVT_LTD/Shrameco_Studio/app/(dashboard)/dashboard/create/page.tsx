'use client';

import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BrandProvider, useBrand } from '@/context/BrandContext';
import { QuoteCardTemplate } from '@/components/templates/QuoteCardTemplate';
import { AnnouncementTemplate } from '@/components/templates/AnnouncementTemplate';
import { TipListTemplate } from '@/components/templates/TipListTemplate';
import { MetricStatTemplate } from '@/components/templates/MetricStatTemplate';
import { EventCountdownTemplate } from '@/components/templates/EventCountdownTemplate';
import { HiringPosterTemplate } from '@/components/templates/HiringPosterTemplate';
import {
	Sparkles,
	Download,
	Copy,
	Check,
	Save,
	Layout,
	RefreshCw,
	Instagram,
	Linkedin,
	Twitter,
	CheckCircle,
	Sliders,
	Maximize2,
	Layers,
	Zap,
	Trash2,
	Send,
	ExternalLink,
	Power,
	AlignLeft,
	AlignCenter,
	AlignRight,
	Moon,
	Sun,
	Tag,
	CalendarDays,
	HelpCircle,
	Plus,
	Image as ImageIcon,
	Youtube,
	Facebook,
	Star,
	Clock,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface PostVariation {
	id: string;
	title: string;
	caption: string;
	imageUrl: string | null;
	templateId: 'quote-card' | 'announcement' | 'tip-list' | 'metric-stat' | 'event-countdown' | 'hiring-poster';
	variantStyle?: string;
	aspectRatio: '4/5' | '1/1' | '16/9' | '9/16';
	layoutStyle: 'blended' | 'split' | 'full-bleed';
	textAlign?: 'left' | 'center' | 'right';
	themeOverride?: 'light' | 'dark';
	isGeneratingImage: boolean;
	imagePrompt: string;
	savedItemId?: string;
}

interface SocialAccountMeta {
	platform: 'linkedin' | 'instagram' | 'x' | 'facebook' | 'youtube';
	accountName: string;
	scopes: string[];
	connected: boolean;
}

const PLATFORM_META: Record<string, { label: string; icon: any; accent: string }> = {
	linkedin: { label: 'LinkedIn', icon: Linkedin, accent: '#0A66C2' },
	instagram: { label: 'Instagram', icon: Instagram, accent: '#E1306C' },
	x: { label: 'X', icon: Twitter, accent: '#111827' },
	facebook: { label: 'Facebook', icon: Facebook, accent: '#1877F2' },
	youtube: { label: 'YouTube', icon: Youtube, accent: '#FF0000' },
};

const PLATFORM_FORMATS: Record<string, Array<{ id: string; label: string }>> = {
	linkedin: [
		{ id: 'post', label: 'Image Post' },
		{ id: 'article', label: 'Article' },
		{ id: 'text', label: 'Text Only' },
	],
	instagram: [
		{ id: 'post', label: 'Post' },
		{ id: 'reel', label: 'Reel' },
		{ id: 'story', label: 'Story' },
	],
	x: [
		{ id: 'post', label: 'Standard Tweet' },
		{ id: 'thread', label: 'Thread' },
	],
	facebook: [
		{ id: 'post', label: 'Post' },
		{ id: 'story', label: 'Story' },
		{ id: 'reel', label: 'Reel' },
	],
	youtube: [
		{ id: 'short', label: 'Short' },
		{ id: 'video', label: 'Video Title/Desc' },
	],
};

const VARIANT_OPTIONS: Record<string, Array<{ id: string; name: string }>> = {
	'quote-card': [
		{ id: 'glass', name: 'Classic Quote' },
		{ id: 'split', name: 'Color Bar' },
		{ id: 'typography', name: 'Bold Text' },
	],
	'announcement': [
		{ id: 'glass', name: 'Bold Header' },
		{ id: 'editorial', name: 'Minimal' },
	],
	'tip-list': [
		{ id: 'numbered', name: 'Simple List' },
		{ id: 'cyber', name: 'Card Steps' },
	],
	'metric-stat': [
		{ id: 'saas', name: 'Light Theme' },
		{ id: 'cyber', name: 'Dark Theme' },
	],
	'event-countdown': [
		{ id: 'ticket', name: 'Full Pass' },
		{ id: 'calendar', name: 'Compact Date' },
	],
	'hiring-poster': [
		{ id: 'badge', name: 'Job Badge' },
		{ id: 'split', name: 'Grid Table' },
	],
};

// Helper to render the specific template card internally
const renderSpecificTemplate = (
	templateId: string,
	captionText: string,
	topic: string,
	platform: string,
	aspectRatio: '4/5' | '1/1' | '16/9' | '9/16',
	aiImageUrl: string | undefined,
	layoutStyle: 'blended' | 'split' | 'full-bleed',
	variantStyle?: string,
	textAlign?: 'left' | 'center' | 'right',
	themeOverride?: 'light' | 'dark',
	ref?: any
) => {
	// Re-map 9/16 to 4/5 internally for templates if they don't explicitly support 9/16 yet, 
	// but the outer wrapper will handle the aspect ratio bounding box.
	const mappedAspect = aspectRatio === '9/16' ? '4/5' : aspectRatio;
	
	if (templateId === 'quote-card') {
		return <QuoteCardTemplate ref={ref} captionText={captionText} topic={topic} platform={platform} aspectRatio={mappedAspect} variantStyle={(variantStyle as any) || 'glass'} aiImageUrl={aiImageUrl} layoutStyle={layoutStyle} textAlign={textAlign} themeOverride={themeOverride} />;
	}
	if (templateId === 'announcement') {
		return <AnnouncementTemplate ref={ref} captionText={captionText} topic={topic} platform={platform} aspectRatio={mappedAspect} variantStyle={(variantStyle as any) || 'glass'} aiImageUrl={aiImageUrl} layoutStyle={layoutStyle} textAlign={textAlign} themeOverride={themeOverride} />;
	}
	if (templateId === 'tip-list') {
		return <TipListTemplate ref={ref} captionText={captionText} topic={topic} platform={platform} aspectRatio={mappedAspect} variantStyle={(variantStyle as any) || 'numbered'} aiImageUrl={aiImageUrl} layoutStyle={layoutStyle} textAlign={textAlign} themeOverride={themeOverride} />;
	}
	if (templateId === 'metric-stat') {
		return <MetricStatTemplate ref={ref} captionText={captionText} topic={topic} platform={platform} aspectRatio={mappedAspect} variantStyle={(variantStyle as any) || 'saas'} aiImageUrl={aiImageUrl} layoutStyle={layoutStyle} textAlign={textAlign} themeOverride={themeOverride} />;
	}
	if (templateId === 'hiring-poster') {
		return <HiringPosterTemplate ref={ref} captionText={captionText} topic={topic} platform={platform} aspectRatio={mappedAspect} variantStyle={(variantStyle as any) || 'badge'} aiImageUrl={aiImageUrl} layoutStyle={layoutStyle} textAlign={textAlign} themeOverride={themeOverride} />;
	}
	return <EventCountdownTemplate ref={ref} captionText={captionText} topic={topic} platform={platform} aspectRatio={mappedAspect} variantStyle={(variantStyle as any) || 'ticket'} aiImageUrl={aiImageUrl} layoutStyle={layoutStyle} textAlign={textAlign} themeOverride={themeOverride} />;
};

// Forward ref wrapper that handles composite graphic layout configurations (Blended, Split, Full-bleed)
const TemplateWrapper = forwardRef<HTMLDivElement, {
	templateId: string;
	variantStyle?: string;
	captionText: string;
	topic: string;
	platform: string;
	aspectRatio: '4/5' | '1/1' | '16/9' | '9/16';
	aiImageUrl?: string;
	layoutStyle?: 'blended' | 'split' | 'full-bleed';
	textAlign?: 'left' | 'center' | 'right';
	themeOverride?: 'light' | 'dark';
}>(({ templateId, variantStyle, captionText, topic, platform, aspectRatio, aiImageUrl, layoutStyle = 'blended', textAlign = 'left', themeOverride }, ref) => {
	const brand = useBrand();

	const aspectClass =
		aspectRatio === '1/1'
			? 'aspect-square'
			: aspectRatio === '16/9'
			? 'aspect-[16/9]'
			: aspectRatio === '9/16'
			? 'aspect-[9/16]'
			: 'aspect-[4/5]';

	if (layoutStyle === 'full-bleed') {
		return (
			<div
				ref={ref}
				id="export-template-card"
				className={`w-full ${aspectClass} max-w-[520px] mx-auto rounded-3xl relative overflow-hidden shadow-2xl bg-[#0B0F19]`}
			>
				{aiImageUrl ? (
					<img src={aiImageUrl} alt="AI Artwork" className="w-full h-full object-cover" />
				) : (
					<div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs p-8 text-center bg-slate-900 border border-dashed border-slate-700">
						<span>No image generated yet. Click "Regen Image" to generate.</span>
					</div>
				)}
				<div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md py-1.5 px-3.5 rounded-xl border border-white/10 flex items-center space-x-2">
					{brand.logoUrl ? (
						<img src={brand.logoUrl} alt={brand.companyName} className="h-5 w-auto object-contain rounded" />
					) : (
						<div className="w-5 h-5 rounded-md bg-[#3D8090] flex items-center justify-center text-white font-extrabold text-[10px]">
							{brand.companyName.charAt(0)}
						</div>
					)}
					<span className="text-[10px] font-extrabold tracking-tight text-white">{brand.companyName}</span>
				</div>
			</div>
		);
	}

	if (layoutStyle === 'split') {
		if (aspectRatio === '16/9') {
			return (
				<div ref={ref} id="export-template-card" className="w-full aspect-[16/9] max-w-[520px] mx-auto rounded-3xl overflow-hidden shadow-2xl bg-[#0B0F19] flex border border-white/10">
					<div className="w-[42%] h-full relative bg-slate-950">
						{aiImageUrl ? <img src={aiImageUrl} alt="AI Graphic" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px] text-center p-2">No Image</div>}
					</div>
					<div className="w-[58%] h-full">
						{renderSpecificTemplate(templateId, captionText, topic, platform, aspectRatio, undefined, 'split', variantStyle, textAlign, themeOverride)}
					</div>
				</div>
			);
		}

		return (
			<div ref={ref} id="export-template-card" className={`w-full ${aspectClass} max-w-[520px] mx-auto rounded-3xl overflow-hidden shadow-2xl bg-[#0B0F19] flex flex-col border border-white/10`}>
				<div className="h-[28%] w-full relative bg-slate-950 flex-shrink-0">
					{aiImageUrl ? <img src={aiImageUrl} alt="AI Graphic" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px] text-center">No Image</div>}
				</div>
				<div className="flex-1 w-full overflow-hidden flex flex-col justify-between">
					{renderSpecificTemplate(templateId, captionText, topic, platform, aspectRatio, undefined, 'split', variantStyle, textAlign, themeOverride)}
				</div>
			</div>
		);
	}

	return renderSpecificTemplate(templateId, captionText, topic, platform, aspectRatio, aiImageUrl || undefined, 'blended', variantStyle, textAlign, themeOverride, ref);
});
TemplateWrapper.displayName = 'TemplateWrapper';

export default function DashboardPage() {
	return (
		<BrandProvider>
			<DashboardInner />
		</BrandProvider>
	);
}

function DashboardInner() {
	const brand = useBrand();

	const [step, setStep] = useState<'connect' | 'compose'>('connect');
	const [contentFormat, setContentFormat] = useState('post');
	const [topic, setTopic] = useState('Quarterly Product Roadmap & Strategy');
	const [platform, setPlatform] = useState<'instagram' | 'linkedin' | 'x' | 'facebook' | 'youtube'>('linkedin');
	const [framework, setFramework] = useState<'pas' | 'aida' | 'bab' | 'none'>('pas');
	const [isGenerating, setIsGenerating] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [savedItems, setSavedItems] = useState<any[]>([]);
	const [notification, setNotification] = useState<string | null>(null);
	const [activeVarIdx, setActiveVarIdx] = useState<number>(0);
	const [connectedAccounts, setConnectedAccounts] = useState<SocialAccountMeta[]>([]);
	const [isConnecting, setIsConnecting] = useState<string | null>(null);
	const [publishMenuOpen, setPublishMenuOpen] = useState<number | null>(null);
	const [publishing, setPublishing] = useState<{ index: number; platform: string } | null>(null);
	const [publishedModal, setPublishedModal] = useState<{
		open: boolean;
		platform: string;
		accountName: string;
		caption: string;
		imageUrl?: string | null;
		postUrl?: string;
		mode?: string;
	} | null>(null);

	const [schedOption, setSchedOption] = useState<'next_available' | 'prioritize' | 'now' | 'custom'>('next_available');
	const [customSchedDate, setCustomSchedDate] = useState<string>(() => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(9, 0, 0, 0);
		return tomorrow.toISOString();
	});
	const [isSchedMenuOpen, setIsSchedMenuOpen] = useState(false);
	const schedMenuRef = useRef<HTMLDivElement>(null);
	const [schedMenuSubView, setSchedMenuSubView] = useState<'options' | 'calendar'>('options');
	const [calMonth, setCalMonth] = useState<number>(() => new Date().getMonth());
	const [calYear, setCalYear] = useState<number>(() => new Date().getFullYear());
	const [selectedDate, setSelectedDate] = useState<Date>(() => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(9, 0, 0, 0);
		return tomorrow;
	});
	const [timeHours, setTimeHours] = useState<string>('09');
	const [timeMinutes, setTimeMinutes] = useState<string>('00');
	const [timeAmpm, setTimeAmpm] = useState<'AM' | 'PM'>('AM');
	const [isMounted, setIsMounted] = useState(false);
	const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
	const [activeTimeSlot, setActiveTimeSlot] = useState<string | null>(null);

	useEffect(() => {
		if (!isSchedMenuOpen) {
			setSchedMenuSubView('options');
		}
	}, [isSchedMenuOpen]);

	const [isConnectMenuOpen, setIsConnectMenuOpen] = useState(false);
	const connectMenuRef = useRef<HTMLDivElement>(null);

	const [variations, setVariations] = useState<PostVariation[]>([
		{
			id: '1',
			title: 'Authority Hook',
			caption: 'At our core, we believe great products are born from ruthless prioritization and deep empathy for users.\n\nHere are 3 key takeaways from our latest strategy update:\n1. Execution speed beats perfection.\n2. Standardize core architecture early.\n3. Keep user feedback in the loop.',
			imageUrl: null,
			templateId: 'quote-card',
			aspectRatio: '4/5',
			layoutStyle: 'blended',
			isGeneratingImage: false,
			imagePrompt: '',
		},
		{
			id: '2',
			title: 'Conversational Story',
			caption: 'We are officially announcing the kickoff of our next-gen product architecture. 🚀\n\nOur team is working on standardizing database adapters, adding strict validation middleware, and securing external integrations. Stay tuned for a launch demo!',
			imageUrl: null,
			templateId: 'announcement',
			aspectRatio: '4/5',
			layoutStyle: 'split',
			isGeneratingImage: false,
			imagePrompt: '',
		},
		{
			id: '3',
			title: 'Actionable Tips',
			caption: 'Here are 3 tips to accelerate development cycles:\n• Define concrete specs before writing code.\n• Run localized automation test scripts before merging.\n• Build custom mocks for flaky third-party APIs.',
			imageUrl: null,
			templateId: 'tip-list',
			aspectRatio: '4/5',
			layoutStyle: 'blended',
			isGeneratingImage: false,
			imagePrompt: '',
		},
	]);

	const variationRefs = useRef<(HTMLDivElement | null)[]>([]);
	const studioSectionRef = useRef<HTMLDivElement | null>(null);

	// Load recent saved items
	const fetchSavedItems = async () => {
		try {
			const res = await fetch('/api/content');
			const data = await res.json();
			if (res.ok && data.items) {
				setSavedItems(data.items);
			}
		} catch (err) {
			console.error('Failed to load content history:', err);
		}
	};

	// Load connected social accounts
	const fetchConnectedAccounts = async () => {
		try {
			const res = await fetch('/api/social/accounts');
			const data = await res.json();
			if (res.ok && data.accounts) {
				setConnectedAccounts(data.accounts);
			}
		} catch (err) {
			console.error('Failed to load social accounts:', err);
		}
	};

	useEffect(() => {
		setIsMounted(true);
		fetchSavedItems();
		fetchConnectedAccounts();

		const params = new URLSearchParams(window.location.search);
		const connectedPlatform = params.get('connected');
		const socialError = params.get('social_error');
		if (connectedPlatform) {
			showNotification(`${connectedPlatform} account connected successfully!`);
		} else if (socialError) {
			showNotification(decodeURIComponent(socialError));
		}
		if (connectedPlatform || socialError) {
			window.history.replaceState({}, '', window.location.pathname);
		}
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (connectMenuRef.current && !connectMenuRef.current.contains(event.target as Node)) {
				setIsConnectMenuOpen(false);
			}
			if (schedMenuRef.current && !schedMenuRef.current.contains(event.target as Node)) {
				setIsSchedMenuOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Force aspect ratio when format changes
	useEffect(() => {
		if (['reel', 'story', 'short'].includes(contentFormat)) {
			setVariations(prev => prev.map(v => ({ ...v, aspectRatio: '9/16' as any })));
		}
	}, [contentFormat]);

	// Auto-construct prompt based on brand profile, topic, variation, and selected platform
	const constructPromptForVariation = (index: number) => {
		const company = brand?.companyName || 'Our Brand';
		const industry = brand?.industry || 'Technology';
		const colors = brand?.colorPalette || [];
		const colorsText = colors.length > 0 ? `using a color palette of ${colors.join(', ')}` : 'using balanced professional corporate tones';
		const targetTopic = topic || 'Innovation';
		const pillars = 'Innovation, Excellence';
		
		let platformStyle = '';
		const formatText = ['reel', 'short'].includes(contentFormat) ? 'vertical video background cover' : contentFormat === 'story' ? 'vertical story graphic' : 'illustration';

		if (platform === 'linkedin') {
			platformStyle = `A premium, high-end corporate flat-vector digital ${formatText} for LinkedIn, representing "${targetTopic}" within the ${industry} sector for ${company}. Focus theme: ${pillars}. Style: Ultra-minimalist modern executive presentation aesthetic, clean geometric lines, sharp vectors, high contrast, option ${index + 1}. Color scheme: ${colorsText}. Composition: Clean abstract conceptual layout with generous empty negative space around the center to allow readable text overlays. Zero realistic clutter, professional, 8k resolution graphic design.`;
		} else if (platform === 'instagram') {
			platformStyle = `A highly vibrant, modern, and creative digital art ${formatText} for Instagram, visually expressing the concept: "${targetTopic}" for the brand ${company} in the ${industry} space. Style: Trendy graphic design aesthetic, soft volumetric lighting, colorful dynamic gradients, organic flowing shapes, glassmorphism elements, option ${index + 1}. Color scheme: ${colorsText}. Composition: Beautiful balanced abstract background design, ideal for card overlay backdrop, stylish depth of field, high-fidelity render.`;
		} else { 
			platformStyle = `A sleek, tech-focused futuristic flat-vector art ${formatText} for ${PLATFORM_META[platform]?.label || platform}, illustrating the concept: "${targetTopic}" for ${company} (${industry}). Style: Modern tech developer branding, high-impact dark mode, clean cybernetic accent details, geometric abstract charts, option ${index + 1}. Color scheme: ${colorsText}. Composition: High-contrast minimalist technical layout, spacious margins, clean iconographic focus, digital graphic style.`;
		}
		return platformStyle;
	};

	// Reset prompt values whenever topic, format or platform changes
	useEffect(() => {
		if (topic && brand?.companyName) {
			setVariations((prev) =>
				prev.map((v, idx) => ({
					...v,
					imagePrompt: constructPromptForVariation(idx),
				}))
			);
		}
	}, [topic, platform, contentFormat, brand?.companyName]);

	// Single trigger for text captions + concurrent image generation
	const handleGenerateCampaign = async () => {
		if (!topic.trim()) return;
		setIsGenerating(true);
		try {
			// Prepend format to topic so the AI knows what to generate
			const generatedTopic = `A ${contentFormat} script/caption about: ${topic}`;
			const res = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ topic: generatedTopic, platform, count: 3, framework }),
			});
			const data = await res.json();
			if (res.ok && data.variations && data.variations.length >= 3) {
				setVariations((prev) =>
					prev.map((v, idx) => ({
						...v,
						caption: data.variations[idx],
					}))
				);
				showNotification('Captions generated successfully! Launching image generation...');

				// Automatically trigger image generation for all 3 variations in parallel
				await Promise.all([
					triggerImageGenerationForVariation(0, constructPromptForVariation(0)),
					triggerImageGenerationForVariation(1, constructPromptForVariation(1)),
					triggerImageGenerationForVariation(2, constructPromptForVariation(2)),
				]);
			} else {
				throw new Error(data.error || 'Failed to generate campaign content');
			}
		} catch (err: any) {
			showNotification(err.message || 'Campaign generation failed.');
		} finally {
			setIsGenerating(false);
		}
	};

	const triggerImageGenerationForVariation = async (index: number, promptOverride?: string) => {
		const targetPrompt = promptOverride || variations[index].imagePrompt || constructPromptForVariation(index);

		setVariations((prev) =>
			prev.map((v, idx) => (idx === index ? { ...v, isGeneratingImage: true, imagePrompt: targetPrompt } : v))
		);

		try {
			const res = await fetch('/api/generate-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: targetPrompt }),
			});
			const data = await res.json();
			if (res.ok && data.imageUrl) {
				setVariations((prev) =>
					prev.map((v, idx) => (idx === index ? { ...v, imageUrl: data.imageUrl } : v))
				);
				showNotification(`Image for Variation ${index + 1} generated!`);
			} else {
				throw new Error(data.error || 'Failed to generate image');
			}
		} catch (err: any) {
			showNotification(`Variation ${index + 1} image failed: ${err.message}`);
		} finally {
			setVariations((prev) =>
				prev.map((v, idx) => (idx === index ? { ...v, isGeneratingImage: false } : v))
			);
		}
	};

	const handleDownloadPngForVariation = async (index: number) => {
		const targetNode = variationRefs.current[index];
		if (!targetNode) { showNotification('Preview not ready yet.'); return; }
		setIsDownloading(true);
		try {
			const { toPng } = await import('html-to-image');
			const dataUrl = await toPng(targetNode, {
				quality: 0.95,
				pixelRatio: 2,
				cacheBust: true,
			});
			const link = document.createElement('a');
			link.download = `brand-studio-${platform}-${variations[index].templateId}-var${index + 1}-${Date.now()}.png`;
			link.href = dataUrl;
			link.click();
			showNotification(`Variation ${index + 1} exported successfully!`);
		} catch (err) {
			console.error('PNG export error:', err);
			showNotification('Failed to export image.');
		} finally {
			setIsDownloading(false);
		}
	};

	const handleSaveForVariation = async (index: number, status: 'draft' | 'final') => {
		setIsSaving(true);
		const v = variations[index];
		try {
			const res = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					topic,
					platform,
					generatedText: v.caption,
					templateId: v.templateId,
					renderedImageUrl: v.imageUrl || undefined,
					status,
				}),
			});
			if (res.ok) {
				const data = await res.json();
				const savedId = data?.item?._id;
				if (savedId) {
					setVariations((prev) =>
						prev.map((item, idx) => (idx === index ? { ...item, savedItemId: savedId } : item))
					);
				}
				showNotification(`Variation ${index + 1} saved as ${status}!`);
				fetchSavedItems();
			} else {
				throw new Error('Save failed');
			}
		} catch (err) {
			showNotification('Error saving post.');
		} finally {
			setIsSaving(false);
		}
	};

	const handleLoadItem = (item: any) => {
		const loadedVars: PostVariation[] = [
			{
				id: '1',
				title: 'Authority Hook',
				caption: item.generatedText,
				imageUrl: item.renderedImageUrl || null,
				templateId: (item.templateId as any) || 'quote-card',
				aspectRatio: '4/5',
				layoutStyle: 'blended',
				isGeneratingImage: false,
				imagePrompt: constructPromptForVariation(0),
				savedItemId: item._id,
			},
			{
				id: '2',
				title: 'Conversational Story',
				caption: '',
				imageUrl: null,
				templateId: 'announcement',
				aspectRatio: '4/5',
				layoutStyle: 'split',
				isGeneratingImage: false,
				imagePrompt: constructPromptForVariation(1),
			},
			{
				id: '3',
				title: 'Actionable Tips',
				caption: '',
				imageUrl: null,
				templateId: 'tip-list',
				aspectRatio: '4/5',
				layoutStyle: 'blended',
				isGeneratingImage: false,
				imagePrompt: constructPromptForVariation(2),
			},
		];
		setVariations(loadedVars);
		setTopic(item.topic);
		setPlatform(item.platform);
		setActiveVarIdx(0);
		studioSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const handleDeleteItem = async (id: string) => {
		try {
			const res = await fetch('/api/content', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id }),
			});
			if (res.ok) {
				setSavedItems((prev) => prev.filter((item) => item._id !== id));
				showNotification('Draft deleted successfully!');
			} else {
				throw new Error('Delete failed');
			}
		} catch (err) {
			showNotification('Error deleting draft.');
		}
	};

	const showNotification = (msg: string) => {
		setNotification(msg);
		setTimeout(() => setNotification(null), 3000);
	};

	const handleConnect = async (platform: string) => {
		setIsConnecting(platform);
		try {
			const res = await fetch('/api/social/connect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ platform, returnTo: window.location.pathname }),
			});
			const data = await res.json();
			if (res.ok && data.url) {
				window.location.href = data.url;
			} else {
				showNotification(data.error || 'Failed to start connection.');
			}
		} catch (err) {
			console.error('Connect error:', err);
			showNotification('Failed to start connection.');
		} finally {
			setIsConnecting(null);
		}
	};

	const handleDisconnect = async (platform: string) => {
		try {
			const res = await fetch('/api/social/disconnect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ platform }),
			});
			if (res.ok) {
				setConnectedAccounts((prev) => prev.filter((a) => a.platform !== platform));
				showNotification(`${PLATFORM_META[platform]?.label || platform} disconnected.`);
			} else {
				showNotification('Failed to disconnect account.');
			}
		} catch (err) {
			console.error('Disconnect error:', err);
			showNotification('Failed to disconnect account.');
		}
	};

	const handlePublish = async (index: number, platform: string, overrideDate?: string) => {
		const v = variations[index];
		setPublishing({ index, platform });
		setPublishMenuOpen(null);
		try {
			const activeOption = overrideDate ? 'custom' : schedOption;
			const res = await fetch('/api/social/schedule', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					platform,
					caption: v.caption,
					imageUrl: v.imageUrl || undefined,
					format: contentFormat,
					publishOption: activeOption,
					customDate: activeOption === 'custom' ? (overrideDate || customSchedDate) : undefined,
				}),
			});
			const data = await res.json();
			if (res.ok) {
				const connAcc = connectedAccounts.find((a) => a.platform === platform);
				if (schedOption === 'now') {
					setPublishedModal({
						open: true,
						platform,
						accountName: connAcc?.accountName || `${platform.toUpperCase()} Demo User`,
						caption: v.caption,
						imageUrl: v.imageUrl,
						postUrl: data.post?.postUrl || `https://${platform}.com/share/demo-${Date.now()}`,
						mode: data.post?.postUrl ? 'live' : 'demo',
					});
				}
				showNotification(data.message || `Post scheduled successfully!`);
				fetchConnectedAccounts();
			} else {
				showNotification(data.error || `Failed to schedule post.`);
			}
		} catch (err) {
			console.error('Publish/Schedule error:', err);
			showNotification(`Failed to schedule post.`);
		} finally {
			setPublishing(null);
		}
	};

	const activeVar = variations[activeVarIdx] || variations[0];
	const [aiMode, setAiMode] = useState(false);
	const [isDesignMenuOpen, setIsDesignMenuOpen] = useState(false);

	const capitalizedFormat = contentFormat.charAt(0).toUpperCase() + contentFormat.slice(1);

	return (
		<div className="flex flex-col min-h-[calc(100vh-2rem)] bg-slate-50 text-slate-900">
			{/* Floating toast notification */}
			{notification && (
				<div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-down">
					<div className="bg-white text-slate-900 px-6 py-3 rounded-xl shadow-lg flex items-center space-x-3 border border-slate-200">
						<CheckCircle className="w-5 h-5 text-emerald-500" />
						<span className="font-semibold text-sm">{notification}</span>
					</div>
				</div>
			)}

			{/* Top Header */}
			<div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shadow-sm z-20 relative">
				<div className="flex items-center space-x-4">
					<h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
						{step === 'compose' ? (
							<>
								{React.createElement(PLATFORM_META[platform]?.icon || Twitter, { 
									className: 'w-6 h-6', 
									style: { color: PLATFORM_META[platform]?.accent } 
								})}
								<span>Create {PLATFORM_META[platform]?.label} {capitalizedFormat}</span>
							</>
						) : (
							<span>Create Post</span>
						)}
					</h1>
					{step === 'compose' && (
						<button 
							onClick={() => setStep('connect')}
							className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-colors"
							style={{ color: PLATFORM_META[platform]?.accent }}
						>
							<span>Change Format</span>
						</button>
					)}
				</div>
				<div className="flex items-center space-x-3 text-sm font-semibold">
					{step === 'compose' && (
						<>
							<div className="relative">
								<button 
									onClick={() => setIsDesignMenuOpen(!isDesignMenuOpen)}
									className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${isDesignMenuOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
								>
									<Layout className="w-4 h-4" />
									<span>Templates</span>
								</button>
								
								{isDesignMenuOpen && (
									<div className="absolute top-full mt-2 right-0 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 animate-fade-in">
										<h3 className="text-sm font-bold text-slate-900 mb-3">Design Options</h3>
										<div className="space-y-4">
											<div>
												<label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Template Type</label>
												<select 
													className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3 py-2 focus:border-emerald-500 focus:outline-none shadow-sm"
													value={activeVar.templateId}
													onChange={(e) => {
														setVariations(prev => prev.map((v, i) => i === activeVarIdx ? { ...v, templateId: e.target.value as PostVariation['templateId'] } : v));
													}}
												>
													<option value="quote-card">Quote Card</option>
													<option value="announcement">Announcement</option>
													<option value="tip-list">Tip List</option>
													<option value="metric-stat">Metric Stat</option>
													<option value="event-countdown">Event</option>
													<option value="hiring-poster">Hiring Poster</option>
												</select>
											</div>
											<div>
												<label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Aspect Ratio</label>
												<div className="flex space-x-2">
													{['4/5', '1/1', '16/9', '9/16'].map(ratio => (
														<button
															key={ratio}
															onClick={() => setVariations(prev => prev.map((v, i) => i === activeVarIdx ? { ...v, aspectRatio: ratio as any } : v))}
															className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm ${activeVar.aspectRatio === ratio ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
														>
															{ratio}
														</button>
													))}
												</div>
											</div>
											<div>
												<label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Theme Mode</label>
												<div className="flex space-x-2">
													<button
														onClick={() => setVariations(prev => prev.map((v, i) => i === activeVarIdx ? { ...v, themeOverride: 'light' } : v))}
														className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center space-x-1 ${activeVar.themeOverride === 'light' ? 'bg-slate-200 text-slate-900' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
													>
														<Sun className="w-3.5 h-3.5" />
														<span>Light</span>
													</button>
													<button
														onClick={() => setVariations(prev => prev.map((v, i) => i === activeVarIdx ? { ...v, themeOverride: 'dark' } : v))}
														className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center space-x-1 ${activeVar.themeOverride === 'dark' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
													>
														<Moon className="w-3.5 h-3.5" />
														<span>Dark</span>
													</button>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>
							<button 
								onClick={() => setAiMode(!aiMode)} 
								className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${aiMode ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-900'}`}
							>
								<Sparkles className="w-4 h-4" />
								<span>AI Assistant</span>
							</button>
							<button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors shadow-sm">
								<Maximize2 className="w-4 h-4" />
								<span>Preview</span>
							</button>
						</>
					)}
				</div>
			</div>

			{step === 'connect' ? (
				<div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 p-6 overflow-y-auto relative">
					{/* Soft glow background */}
					<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-violet-500/10 blur-[100px] pointer-events-none rounded-full"></div>
					
					<div className="max-w-4xl w-full relative z-10">
						<div className="text-center mb-12">
							<h2 className="text-3xl font-semibold text-slate-900 mb-3 tracking-tight">Select a Platform</h2>
							<p className="text-slate-500 text-base">Connect a platform to start automating your content.</p>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
							{[
								{ id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', bg: 'bg-blue-50', accent: '#0A66C2' },
								{ id: 'x', label: 'X (Twitter)', icon: Twitter, color: 'text-slate-900', bg: 'bg-slate-100', accent: '#111827' },
								{ id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50', accent: '#E1306C' },
								{ id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-700', bg: 'bg-blue-50', accent: '#1877F2' },
								{ id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600', bg: 'bg-red-50', accent: '#FF0000' },
							].map((plat) => {
								const connected = connectedAccounts.find(a => a.platform === plat.id);
								return (
									<div 
										key={plat.id} 
										onClick={() => {
											if (!connected && isConnecting !== plat.id) {
												handleConnect(plat.id);
											}
										}}
										className={`bg-white rounded-2xl p-6 flex flex-col transition-all relative overflow-hidden border border-slate-200 group ${
											connected 
												? 'shadow-md hover:shadow-lg hover:-translate-y-0.5' 
												: 'shadow-sm hover:shadow-md hover:border-violet-200 cursor-pointer hover:bg-slate-50/20 active:scale-[0.99]'
										}`}
									>
										{connected && (
											<div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: plat.accent }} />
										)}
										{connected && (
											<Link
												href={plat.id === 'youtube' ? '/dashboard/youtube' : '/dashboard/publish'}
												onClick={(e) => e.stopPropagation()}
												className={`absolute top-4 right-4 flex items-center space-x-1 text-[10px] font-extrabold py-1 px-2.5 rounded-full transition-all border hover:scale-105 active:scale-95 shadow-xs z-20 ${
													plat.id === 'youtube'
														? 'bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 border-red-100'
														: plat.id === 'linkedin'
														? 'bg-blue-50 hover:bg-blue-100 text-blue-650 hover:text-blue-700 border-blue-100'
														: plat.id === 'instagram'
														? 'bg-pink-50 hover:bg-pink-100 text-pink-650 hover:text-pink-700 border-pink-100'
														: plat.id === 'x'
														? 'bg-slate-50 hover:bg-slate-100 text-slate-750 hover:text-slate-900 border-slate-200'
														: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-650 hover:text-indigo-700 border-indigo-100'
												}`}
											>
												<span>{plat.id === 'youtube' ? 'Studio' : 'Publish'}</span>
												<ExternalLink className="w-3.5 h-3.5" />
											</Link>
										)}
										<div className="flex flex-col h-full justify-between space-y-6">
											<div className="flex items-center space-x-4">
												<div className={`w-12 h-12 rounded-xl flex items-center justify-center ${plat.bg} ring-1 ring-slate-900/5 group-hover:scale-105 transition-transform`}>
													<plat.icon className={`w-6 h-6 ${plat.color}`} />
												</div>
												<div>
													<h3 className="font-semibold text-slate-900">{plat.label}</h3>
													<p className="text-xs font-medium mt-0.5" style={{ color: connected ? '#059669' : '#64748B' }}>
														{connected ? 'Connected' : 'Not connected'}
													</p>
												</div>
											</div>
											<div className="flex flex-col space-y-3">
												{isConnecting === plat.id ? (
													<div className="w-full py-2.5 rounded-xl border border-slate-200 flex justify-center items-center bg-slate-50">
														<RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
													</div>
												) : connected ? (
													<button 
														onClick={(e) => {
															e.stopPropagation();
															handleDisconnect(plat.id);
														}} 
														className="w-full bg-slate-50 text-slate-600 font-medium border border-slate-200 py-2 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-sm"
													>
														Disconnect
													</button>
												) : (
													<button 
														onClick={(e) => {
															e.stopPropagation();
															handleConnect(plat.id);
														}} 
														className="w-full bg-violet-600 text-white font-medium py-2 rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-500/20 text-sm"
													>
														Connect
													</button>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			) : (
				<div className="flex flex-1 overflow-hidden relative bg-slate-100">
					{/* Left Panel: Composer */}
					<div className="flex-1 flex flex-col max-w-[600px] border-r border-slate-200 bg-white relative z-10 shadow-2xl">
						<div className="p-6 flex-1 overflow-y-auto space-y-6">
							<div className="flex items-center space-x-2">
								<div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm relative">
									<span className="font-bold text-slate-700 text-sm">S</span>
									<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center border border-white">
										<Twitter className="w-2.5 h-2.5 text-white" />
									</div>
								</div>
								<div className="relative" ref={connectMenuRef}>
									<button 
										onClick={() => setIsConnectMenuOpen(!isConnectMenuOpen)}
										className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
									>
										<Plus className="w-5 h-5" />
									</button>
									
									{isConnectMenuOpen && (
										<div className="absolute top-full mt-2 left-0 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-fade-in">
											<h3 className="text-xs font-bold text-slate-500 mb-2 px-2 uppercase tracking-wider">Connect Platform</h3>
											<div className="space-y-1">
												{[
													{ id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'hover:text-blue-500' },
													{ id: 'x', label: 'X (Twitter)', icon: Twitter, color: 'hover:text-slate-900' },
													{ id: 'instagram', label: 'Instagram', icon: Instagram, color: 'hover:text-pink-500' },
													{ id: 'facebook', label: 'Facebook', icon: Facebook, color: 'hover:text-blue-600' },
													{ id: 'youtube', label: 'YouTube', icon: Youtube, color: 'hover:text-red-500' },
												].map((plat) => {
													const connected = connectedAccounts.find(a => a.platform === plat.id);
													return (
														<button
															key={plat.id}
															onClick={() => {
																if (!connected) handleConnect(plat.id);
																setIsConnectMenuOpen(false);
															}}
															className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors group"
														>
															<div className="flex items-center space-x-3">
																<plat.icon className={`w-4 h-4 text-slate-400 transition-colors ${!connected && plat.color}`} />
																<span className="font-semibold">{plat.label}</span>
															</div>
															{isConnecting === plat.id ? (
																<RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
															) : connected ? (
																<CheckCircle className="w-4 h-4 text-emerald-500" />
															) : (
																<Plus className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
															)}
														</button>
													);
												})}
											</div>
										</div>
									)}
								</div>
							</div>

							<div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col flex-1 focus-within:border-slate-300 transition-colors shadow-inner">
								<textarea 
									className="bg-transparent border-none outline-none resize-none flex-1 text-slate-900 placeholder-slate-400 mb-4 w-full min-h-[120px]"
									placeholder={`Start writing your ${capitalizedFormat} or get inspired with Templates`}
									value={activeVar.caption}
									onChange={(e) => {
										const newCaption = e.target.value;
										setVariations(prev => prev.map((v, i) => i === activeVarIdx ? { ...v, caption: newCaption } : v));
									}}
								/>
								
								<div 
									className="border border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 transition-colors mb-4 w-full max-w-[240px] bg-white"
									onClick={() => !activeVar.imageUrl && triggerImageGenerationForVariation(activeVarIdx)}
								>
									{activeVar.imageUrl ? (
										<img src={activeVar.imageUrl} alt="Generated" className="w-full h-auto rounded-lg mb-2 object-cover shadow-sm" />
									) : (
										<ImageIcon className="w-6 h-6 text-slate-400 mb-2" />
									)}
									<p className="text-xs text-slate-500 font-medium">
										{activeVar.isGeneratingImage ? "Generating AI Image..." : (activeVar.imageUrl ? "Image Ready" : "Drag & drop or select a file")}
									</p>
								</div>
								
								<div className="flex items-center justify-between border-t border-slate-200 pt-3">
									<div className="flex items-center space-x-2 text-slate-500">
										<button className="p-1.5 hover:text-slate-900 rounded-md hover:bg-slate-200 transition-colors"><Plus className="w-4 h-4" /></button>
										<button className="p-1.5 hover:text-slate-900 rounded-md hover:bg-slate-200 transition-colors"><ImageIcon className="w-4 h-4" /></button>
										<button className="p-1.5 hover:text-slate-900 rounded-md hover:bg-slate-200 transition-colors"><span className="text-sm font-bold">#</span></button>
										<button className="p-1.5 hover:text-slate-900 rounded-md hover:bg-slate-200 transition-colors"><ExternalLink className="w-4 h-4" /></button>
									</div>
									<div className="flex items-center space-x-3">
										<span className="text-xs text-slate-500 font-medium">{activeVar.caption.length} / 280</span>
										<button className="text-sm font-bold flex items-center space-x-1 text-slate-500 hover:text-slate-900 transition-colors">
											<Plus className="w-4 h-4" />
											<span>Start Thread</span>
										</button>
									</div>
								</div>
							</div>

							{/* AI Integration Section */}
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-2">
									<span className="text-sm font-semibold text-slate-500">AI-Generated</span>
									<button 
										onClick={() => setAiMode(!aiMode)}
										className={`w-9 h-5 rounded-full relative transition-colors shadow-inner ${aiMode ? 'bg-emerald-500' : 'bg-slate-300'}`}
									>
										<div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] shadow-sm transition-transform ${aiMode ? 'translate-x-4.5 left-4' : 'translate-x-0 left-[3px]'}`} />
									</button>
								</div>
							</div>

							{aiMode && (
								<div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-fade-in shadow-sm">
									<div>
										<label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Topic</label>
										<Input 
											value={topic} 
											onChange={(e) => setTopic(e.target.value)} 
											placeholder={`What is this ${capitalizedFormat} about?`}
											className="bg-white border-slate-200 text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
										/>
									</div>
									<div className="flex space-x-4">
										<div className="flex-1">
											<label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Platform Tone</label>
											<select 
												value={platform} 
												onChange={(e) => setPlatform(e.target.value as any)}
												className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:outline-none"
											>
												<option value="linkedin">LinkedIn (Professional)</option>
												<option value="x">Twitter / X (Punchy)</option>
												<option value="instagram">Instagram (Visual)</option>
												<option value="facebook">Facebook (Social)</option>
												<option value="youtube">YouTube (Engaging)</option>
											</select>
										</div>
										<div className="flex-1">
											<label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Variations</label>
											<select 
												onChange={(e) => setActiveVarIdx(Number(e.target.value))}
												value={activeVarIdx}
												className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 shadow-sm focus:border-emerald-500 focus:outline-none"
											>
												{variations.map((v, i) => (
													<option key={i} value={i}>Variation {i + 1}</option>
												))}
											</select>
										</div>
									</div>
									<Button 
										onClick={handleGenerateCampaign} 
										disabled={isGenerating || !topic.trim()}
										className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold border-none py-6 rounded-xl transition-colors shadow-md"
									>
										{isGenerating ? (
											<div className="flex items-center space-x-2">
												<RefreshCw className="w-5 h-5 animate-spin" />
												<span>Generating Magic...</span>
											</div>
										) : (
											<div className="flex items-center space-x-2">
												<Sparkles className="w-5 h-5" />
												<span>Generate with AI</span>
											</div>
										)}
									</Button>
								</div>
							)}
						</div>

						{/* Bottom Actions */}
						<div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
							<div className="flex items-center space-x-4">
								<label className="flex items-center space-x-2 text-sm text-slate-500 cursor-pointer hover:text-slate-900 transition-colors">
									<input type="checkbox" className="rounded border-slate-300 bg-white text-emerald-500 focus:ring-emerald-500/20" />
									<span className="font-medium">Create Another</span>
								</label>
								<button className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Save Draft</button>
							</div>
							<div className="flex items-center relative" ref={schedMenuRef}>
								{/* Next Available Button with Tooltip */}
								<div className="relative group/tooltip">
									{/* Tooltip Popup on Hover */}
									<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-md pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50">
										When to Post
									</div>

									<button 
										onClick={() => setIsSchedMenuOpen(!isSchedMenuOpen)}
										className="flex items-center space-x-1.5 px-4 py-2 border border-slate-200 rounded-l-lg bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm z-10"
									>
										<CalendarDays className="w-4 h-4 text-slate-400" />
										<span>{
											schedOption === 'next_available' ? 'Next Available'
											: schedOption === 'prioritize' ? 'Prioritize'
											: schedOption === 'now' ? 'Now'
											: 'Set Date & Time'
										}</span>
									</button>
								</div>

								{/* Dropdown Options List */}
								{isSchedMenuOpen && (
									<div className="absolute bottom-full left-0 mb-3 w-80 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-4 z-[99] text-xs text-slate-100 animate-scale-in">
										{schedMenuSubView === 'options' ? (
											<div className="space-y-2">
												{/* Next Available option */}
												<button
													onClick={() => { setSchedOption('next_available'); setIsSchedMenuOpen(false); }}
													className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left border ${
														schedOption === 'next_available'
															? 'bg-emerald-950/40 text-emerald-100 border-emerald-700/40'
															: 'hover:bg-neutral-800 border-transparent'
													}`}
												>
													<div className="flex items-start space-x-3">
														{schedOption === 'next_available' ? (
															<Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
														) : (
															<div className="w-4 h-4 flex-shrink-0" />
														)}
														<div>
															<p className="font-extrabold text-sm text-slate-100">Next Available</p>
															<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Use the next available posting slot in your queue.</p>
														</div>
													</div>
													<div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 ml-1">
														<Star className="w-3 h-3 text-amber-500 fill-amber-400" />
													</div>
												</button>

												{/* Prioritize option */}
												<button
													onClick={() => { setSchedOption('prioritize'); setIsSchedMenuOpen(false); }}
													className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left border ${
														schedOption === 'prioritize'
															? 'bg-emerald-950/40 text-emerald-100 border-emerald-700/40'
															: 'hover:bg-neutral-800 border-transparent'
													}`}
												>
													<div className="flex items-start space-x-3">
														{schedOption === 'prioritize' ? (
															<Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
														) : (
															<div className="w-4 h-4 flex-shrink-0" />
														)}
														<div>
															<p className="font-extrabold text-sm text-slate-100">Prioritize</p>
															<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Bump your post to the top of the queue.</p>
														</div>
													</div>
												</button>

												{/* Now option */}
												<button
													onClick={() => { setSchedOption('now'); setIsSchedMenuOpen(false); }}
													className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left border ${
														schedOption === 'now'
															? 'bg-emerald-950/40 text-emerald-100 border-emerald-700/40'
															: 'hover:bg-neutral-800 border-transparent'
													}`}
												>
													<div className="flex items-start space-x-3">
														{schedOption === 'now' ? (
															<Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
														) : (
															<div className="w-4 h-4 flex-shrink-0" />
														)}
														<div>
															<p className="font-extrabold text-sm text-slate-100">Now</p>
															<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Publish your post right away.</p>
														</div>
													</div>
												</button>

												{/* Set Date and Time option */}
												<button
													onClick={() => {
														setIsSchedMenuOpen(false);
														setIsCalendlyOpen(true);
													}}
													className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left border ${
														schedOption === 'custom'
															? 'bg-emerald-950/40 text-emerald-100 border-emerald-700/40'
															: 'hover:bg-neutral-800 border-transparent'
													}`}
												>
													<div className="flex items-start space-x-3">
														{schedOption === 'custom' ? (
															<Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
														) : (
															<div className="w-4 h-4 flex-shrink-0" />
														)}
														<div>
															<p className="font-extrabold text-sm text-slate-100">Set Date and Time</p>
															<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Choose a specific time to post, or use our recommendation.</p>
														</div>
													</div>
												</button>

												{/* Customize button */}
												<button className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-sm">
													<span>Customize for each network</span>
													<span>→</span>
												</button>
											</div>
										) : (
											<div>
												{/* Calendar Month Header */}
												<div className="flex items-center justify-between pb-3 border-b border-neutral-850">
													<span className="font-extrabold text-sm text-slate-100">
														{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][calMonth]} {calYear}
													</span>
													<div className="flex items-center space-x-2">
														<button
															onClick={(e) => {
																e.stopPropagation();
																if (calMonth === 0) {
																	setCalMonth(11);
																	setCalYear((y) => y - 1);
																} else {
																	setCalMonth((m) => m - 1);
																}
															}}
															className="p-1 hover:bg-neutral-800 rounded text-slate-400 hover:text-white"
														>
															<ChevronLeft className="w-4 h-4" />
														</button>
														<button
															onClick={(e) => {
																e.stopPropagation();
																if (calMonth === 11) {
																	setCalMonth(0);
																	setCalYear((y) => y + 1);
																} else {
																	setCalMonth((m) => m + 1);
																}
															}}
															className="p-1 hover:bg-neutral-800 rounded text-slate-400 hover:text-white"
														>
															<ChevronRight className="w-4 h-4" />
														</button>
													</div>
												</div>

												{/* Days Grid */}
												<div className="grid grid-cols-7 gap-y-2 gap-x-1 justify-items-center font-bold mt-4 text-[10px]">
													{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
														<span key={d} className="text-slate-500 font-extrabold pb-2">{d}</span>
													))}

													{/* Leading Days */}
													{Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => {
														const prevMonthDays = new Date(calYear, calMonth, 0).getDate();
														const day = prevMonthDays - new Date(calYear, calMonth, 1).getDay() + 1 + i;
														return (
															<span key={`prev-${i}`} className="h-8 w-8 flex items-center justify-center text-neutral-700 select-none cursor-not-allowed">{day}</span>
														);
													})}

													{/* Month Days */}
													{Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
														const day = i + 1;
														const todayObj = new Date();
														const isToday = todayObj.getDate() === day && todayObj.getMonth() === calMonth && todayObj.getFullYear() === calYear;
														const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === calMonth && selectedDate.getFullYear() === calYear;

														return (
															<button
																key={`day-${day}`}
																onClick={(e) => {
																	e.stopPropagation();
																	setSelectedDate(new Date(calYear, calMonth, day));
																}}
																className={`h-8 w-8 flex items-center justify-center rounded-full text-center font-black focus:outline-none transition-all ${
																	isSelected
																		? 'bg-neutral-800 text-white border border-neutral-750'
																		: isToday
																		? 'bg-emerald-500 text-emerald-950 font-black'
																		: 'text-slate-200 hover:bg-neutral-850'
																}`}
															>
																{day}
															</button>
														);
													})}

													{/* Trailing Days */}
													{Array.from({
														length: 42 - (new Date(calYear, calMonth, 1).getDay() + new Date(calYear, calMonth + 1, 0).getDate())
													}).map((_, i) => {
														return (
															<span key={`next-${i}`} className="h-8 w-8 flex items-center justify-center text-neutral-700 select-none cursor-not-allowed">{i + 1}</span>
														);
													})}
												</div>

												{/* Time Input Section */}
												<div className="border-t border-neutral-850 mt-4 pt-4">
													<p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Time</p>
													<div className="flex items-center justify-between border border-emerald-500 bg-emerald-950/20 text-emerald-400 px-3 py-2.5 rounded-xl text-xs font-semibold w-full mt-2 focus-within:ring-1 focus-within:ring-emerald-500">
														<div className="flex items-center space-x-1.5">
															<Clock className="w-4 h-4 text-emerald-500 mr-1.5 flex-shrink-0" />
															<input
																type="text"
																pattern="[0-9]*"
																inputMode="numeric"
																maxLength={2}
																value={timeHours}
																onChange={(e) => {
																	const val = e.target.value.replace(/[^0-9]/g, '');
																	setTimeHours(val);
																}}
																onBlur={() => {
																	let num = parseInt(timeHours);
																	if (isNaN(num) || num < 1 || num > 12) setTimeHours('09');
																	else setTimeHours(num.toString().padStart(2, '0'));
																}}
																className="bg-neutral-800/80 border border-emerald-500/25 text-emerald-400 rounded-lg px-2 py-1 w-11 text-center focus:outline-none focus:border-emerald-500 text-xs font-bold p-0.5"
															/>
															<span className="text-emerald-500/60 font-bold">:</span>
															<input
																type="text"
																pattern="[0-9]*"
																inputMode="numeric"
																maxLength={2}
																value={timeMinutes}
																onChange={(e) => {
																	const val = e.target.value.replace(/[^0-9]/g, '');
																	setTimeMinutes(val);
																}}
																onBlur={() => {
																	let num = parseInt(timeMinutes);
																	if (isNaN(num) || num < 0 || num > 59) setTimeMinutes('00');
																	else setTimeMinutes(num.toString().padStart(2, '0'));
																}}
																className="bg-neutral-800/80 border border-emerald-500/25 text-emerald-400 rounded-lg px-2 py-1 w-11 text-center focus:outline-none focus:border-emerald-500 text-xs font-bold p-0.5"
															/>
															<button
																onClick={(e) => {
																	e.stopPropagation();
																	setTimeAmpm(prev => prev === 'AM' ? 'PM' : 'AM');
																}}
																className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-2.5 py-1 rounded-lg text-xs transition-colors ml-1"
															>
																{timeAmpm}
															</button>
														</div>
														<span className="text-[10px] uppercase font-black text-emerald-500/80 tracking-wider">Asia/Kolkata</span>
													</div>
												</div>

												{/* Calendar Footer Buttons */}
												<div className="border-t border-neutral-850 mt-4 pt-3 flex items-center justify-between">
													<button
														onClick={(e) => {
															e.stopPropagation();
															setSchedMenuSubView('options');
														}}
														className="flex items-center space-x-1 px-1 py-1 hover:text-white text-slate-400 transition-colors font-extrabold text-[11px]"
													>
														<span>←</span>
														<span>More Posting Actions</span>
													</button>
													<button
														onClick={(e) => {
															e.stopPropagation();
															// Construct final custom sched date
															const finalDate = new Date(selectedDate.getTime());
															let hr = parseInt(timeHours || '9');
															const mins = parseInt(timeMinutes || '0');
															if (timeAmpm === 'PM' && hr < 12) hr += 12;
															if (timeAmpm === 'AM' && hr === 12) hr = 0;
															finalDate.setHours(hr, mins, 0, 0);

															setCustomSchedDate(finalDate.toISOString());
															setSchedOption('custom');
															setIsSchedMenuOpen(false);
														}}
														className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg transition-colors text-[11px]"
													>
														<span>✓</span>
														<span>Done</span>
													</button>
												</div>
											</div>
										)}
									</div>
								)}

								<button 
									onClick={() => handlePublish(activeVarIdx, platform)}
									className="px-6 py-2 text-white hover:opacity-90 text-sm font-bold rounded-r-lg transition-colors shadow-sm -ml-[1px] relative z-20"
									style={{ backgroundColor: PLATFORM_META[platform]?.accent || '#0f172a' }}
								>
									{publishing?.index === activeVarIdx ? 'Scheduling...' : `Schedule ${PLATFORM_META[platform]?.label} Post`}
								</button>
							</div>
						</div>
					</div>

					{/* Right Panel: Preview */}
					<div className="flex-1 bg-slate-100/50 p-8 flex flex-col items-center justify-center relative overflow-y-auto">
						<div className="absolute top-6 left-6 text-sm font-bold text-slate-500 flex items-center space-x-2">
							<span>{PLATFORM_META[platform]?.label || 'Twitter / X'} {capitalizedFormat} Preview</span>
							<HelpCircle className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
						</div>

						<div className="w-full max-w-[500px] scale-[0.95] origin-center shadow-2xl rounded-3xl transition-transform hover:scale-[1.02] duration-300">
							<TemplateWrapper
								ref={(el) => {
									if (variationRefs.current) {
										variationRefs.current[activeVarIdx] = el;
									}
								}}
								templateId={activeVar.templateId}
								captionText={activeVar.caption}
								topic={topic}
								platform={platform}
								aspectRatio={activeVar.aspectRatio}
								variantStyle={activeVar.variantStyle}
								aiImageUrl={activeVar.imageUrl || undefined}
								layoutStyle={activeVar.layoutStyle}
								textAlign={activeVar.textAlign}
								themeOverride={activeVar.themeOverride}
							/>
						</div>
						<p className="text-slate-400 text-sm mt-10 font-medium">See your {contentFormat}'s preview here</p>
						
					</div>
				</div>
			)}
			
			{/* Published Modal */}
			{publishedModal?.open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
					<div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200">
						<div className="p-6 flex flex-col items-center text-center">
							<div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
								<CheckCircle className="w-8 h-8" />
							</div>
							<h3 className="text-xl font-bold text-slate-900 mb-2">Successfully Scheduled!</h3>
							<p className="text-sm text-slate-500 mb-6">
								Your {contentFormat} is queued for {publishedModal.platform} on {publishedModal.accountName}.
							</p>
							<Button
								variant="secondary"
								onClick={() => setPublishedModal(null)}
								className="w-full py-3 font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 border-none rounded-xl"
							>
								Got it
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Calendly style Scheduling Modal */}
			{isMounted && isCalendlyOpen && createPortal(
				<div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in" onClick={() => setIsCalendlyOpen(false)}>
					<div 
						className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-200 animate-scale-in text-slate-800 h-[600px]" 
						onClick={(e) => e.stopPropagation()}
					>
						{/* Left Panel: Event Info */}
						<div className="w-full md:w-1/3 border-r border-slate-100 p-8 flex flex-col justify-between bg-slate-50/50">
							<div className="space-y-6">
								<div>
									<p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shrameco Studio</p>
									<h2 className="text-2xl font-extrabold text-slate-900 mt-2">Schedule Post</h2>
								</div>
								
								<div className="space-y-4">
									<div className="flex items-center space-x-3 text-slate-600 font-semibold text-sm">
										<Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
										<span>Timezone: Asia/Kolkata</span>
									</div>
									<div className="flex items-center space-x-3 text-slate-600 font-semibold text-sm">
										<CalendarDays className="w-5 h-5 text-slate-400 flex-shrink-0" />
										<span>Custom Date & Time</span>
									</div>
								</div>
							</div>
							
							<div className="flex space-x-4 text-xs font-bold text-slate-400">
								<span className="hover:text-slate-600 transition-colors cursor-pointer">Cookie settings</span>
								<span className="hover:text-slate-600 transition-colors cursor-pointer">Privacy Policy</span>
							</div>
						</div>

						{/* Right Panel: Calendar & Slots */}
						<div className="flex-1 flex flex-col p-8 bg-white overflow-hidden">
							<div className="flex justify-between items-center mb-6">
								<h3 className="text-xl font-bold text-slate-900">Select a Date & Time</h3>
								<button 
									onClick={() => setIsCalendlyOpen(false)}
									className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 font-extrabold"
								>
									<span className="text-sm">✕</span>
								</button>
							</div>

							<div className="flex-1 flex flex-row space-x-6 overflow-hidden">
								{/* Calendar Block (left side of right panel) */}
								<div className="flex-1 flex flex-col min-w-[280px]">
									{/* Month Navigation */}
									<div className="flex items-center justify-between mb-4 px-2">
										<span className="font-extrabold text-sm text-slate-800">
											{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][calMonth]} {calYear}
										</span>
										<div className="flex items-center space-x-2">
											<button
												onClick={() => {
													if (calMonth === 0) {
														setCalMonth(11);
														setCalYear((y) => y - 1);
													} else {
														setCalMonth((m) => m - 1);
													}
												}}
												className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
											>
												<ChevronLeft className="w-4 h-4" />
											</button>
											<button
												onClick={() => {
													if (calMonth === 11) {
														setCalMonth(0);
														setCalYear((y) => y + 1);
													} else {
														setCalMonth((m) => m + 1);
													}
												}}
												className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
											>
												<ChevronRight className="w-4 h-4" />
											</button>
										</div>
									</div>

									{/* Weekdays Row (Starts Monday!) */}
									<div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-400 mb-2">
										{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName) => (
											<span key={dayName} className="font-extrabold">{dayName}</span>
										))}
									</div>

									{/* Days Grid */}
									<div className="grid grid-cols-7 gap-2 justify-items-center font-bold text-xs flex-1">
										{/* Leading Days */}
										{(() => {
											let firstDayIndex = new Date(calYear, calMonth, 1).getDay();
											let leadingDaysCount = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
											
											const prevMonthDays = new Date(calYear, calMonth, 0).getDate();
											return Array.from({ length: leadingDaysCount }).map((_, i) => {
												const day = prevMonthDays - leadingDaysCount + 1 + i;
												return (
													<span key={`prev-${i}`} className="h-9 w-9 flex items-center justify-center text-slate-200 select-none">{day}</span>
												);
											});
										})()}

										{/* Month Days */}
										{Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
											const day = i + 1;
											const todayObj = new Date();
											const isToday = todayObj.getDate() === day && todayObj.getMonth() === calMonth && todayObj.getFullYear() === calYear;
											const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === calMonth && selectedDate.getFullYear() === calYear;

											return (
												<button
													key={`day-${day}`}
													onClick={() => {
														setSelectedDate(new Date(calYear, calMonth, day));
														setActiveTimeSlot(null);
													}}
													className={`h-9 w-9 flex flex-col items-center justify-center rounded-full text-center font-black focus:outline-none transition-all relative ${
														isSelected
															? 'bg-blue-600 text-white shadow-md'
															: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
													}`}
												>
													<span>{day}</span>
													{isToday && (
														<span className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-600'}`} />
													)}
												</button>
											);
										})}

										{/* Trailing Days */}
										{(() => {
											let firstDayIndex = new Date(calYear, calMonth, 1).getDay();
											let leadingDaysCount = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
											let monthDaysCount = new Date(calYear, calMonth + 1, 0).getDate();
											let totalGridCells = 42;
											let trailingDaysCount = totalGridCells - (leadingDaysCount + monthDaysCount);
											
											return Array.from({ length: trailingDaysCount }).map((_, i) => (
												<span key={`next-${i}`} className="h-9 w-9 flex items-center justify-center text-slate-200 select-none">{i + 1}</span>
											));
										})()}
									</div>

									{/* Footer Timezone */}
									<div className="mt-4 pt-4 border-t border-slate-100 flex items-center space-x-2 text-xs font-semibold text-slate-600">
										<span>🌐</span>
										<span>India Standard Time (Asia/Kolkata)</span>
									</div>
								</div>

								{/* Time Slots Column (right side of right panel) */}
								<div className="w-[320px] border-l border-slate-100 pl-6 flex flex-col overflow-y-auto">
									<h4 className="font-bold text-slate-700 text-sm mb-4">
										{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
									</h4>
									
									{/* Keyboard Custom Time Entry */}
									<div className="mb-4 pb-4 border-b border-slate-100 space-y-2">
										<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Custom Time Entry</span>
										<div className="flex items-center space-x-1.5">
											<input
												type="text"
												pattern="[0-9]*"
												inputMode="numeric"
												maxLength={2}
												placeholder="09"
												value={timeHours}
												onChange={(e) => {
													const val = e.target.value.replace(/[^0-9]/g, '');
													setTimeHours(val);
												}}
												onBlur={() => {
													let num = parseInt(timeHours);
													if (isNaN(num) || num < 1 || num > 12) setTimeHours('09');
													else setTimeHours(num.toString().padStart(2, '0'));
												}}
												className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1.5 w-12 text-center focus:outline-none focus:border-blue-500 text-xs font-bold"
											/>
											<span className="text-slate-400 font-bold">:</span>
											<input
												type="text"
												pattern="[0-9]*"
												inputMode="numeric"
												maxLength={2}
												placeholder="00"
												value={timeMinutes}
												onChange={(e) => {
													const val = e.target.value.replace(/[^0-9]/g, '');
													setTimeMinutes(val);
												}}
												onBlur={() => {
													let num = parseInt(timeMinutes);
													if (isNaN(num) || num < 0 || num > 59) setTimeMinutes('00');
													else setTimeMinutes(num.toString().padStart(2, '0'));
												}}
												className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1.5 w-12 text-center focus:outline-none focus:border-blue-500 text-xs font-bold"
											/>
											<button
												onClick={(e) => {
													e.stopPropagation();
													setTimeAmpm(prev => prev === 'AM' ? 'PM' : 'AM');
												}}
												className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold px-3 py-1.5 rounded-lg text-xs transition-colors"
											>
												{timeAmpm}
											</button>
											<button
												onClick={() => {
													let hr = parseInt(timeHours || '9');
													const mins = parseInt(timeMinutes || '0');
													if (timeAmpm === 'PM' && hr < 12) hr += 12;
													if (timeAmpm === 'AM' && hr === 12) hr = 0;
													
													const finalDate = new Date(selectedDate.getTime());
																	finalDate.setHours(hr, mins, 0, 0);

													setCustomSchedDate(finalDate.toISOString());
													setSchedOption('custom');
													setIsCalendlyOpen(false);
													handlePublish(activeVarIdx, platform, finalDate.toISOString());
												}}
												className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-1.5 px-2.5 rounded-lg text-xs transition-colors text-center shadow-xs"
											>
												Publish
											</button>
										</div>
									</div>

									<div className="space-y-2 pr-2">
										{[
											'09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', 
											'11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', 
											'01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', 
											'03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', 
											'05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', 
											'07:00 PM'
										].map((slot) => {
											const isActive = activeTimeSlot === slot;
											return (
												<div key={slot} className="flex items-center space-x-2">
													{isActive ? (
														<>
															<button 
																className="flex-1 bg-slate-100 text-slate-500 border border-slate-200 font-bold py-3 text-center rounded-xl text-sm transition-all cursor-default"
																disabled
															>
																{slot}
															</button>
															<button 
																onClick={() => {
																	const [timePart, ampmPart] = slot.split(' ');
																	let [hStr, mStr] = timePart.split(':');
																	let hr = parseInt(hStr);
																	const mins = parseInt(mStr);
																	if (ampmPart === 'PM' && hr < 12) hr += 12;
																	if (ampmPart === 'AM' && hr === 12) hr = 0;
																	
																	const finalDate = new Date(selectedDate.getTime());
																	finalDate.setHours(hr, mins, 0, 0);

																	setCustomSchedDate(finalDate.toISOString());
																	setSchedOption('custom');
																	setIsCalendlyOpen(false);
																	handlePublish(activeVarIdx, platform, finalDate.toISOString());
																}}
																className="flex-1 bg-blue-600 hover:bg-blue-750 text-white font-extrabold py-3 text-center rounded-xl text-sm transition-colors shadow-md shadow-blue-500/20"
															>
																Publish
															</button>
														</>
													) : (
														<button 
															onClick={() => setActiveTimeSlot(slot)}
															className="w-full border border-blue-500 hover:border-blue-600 text-blue-600 hover:bg-blue-50/30 font-extrabold py-3 text-center rounded-xl text-sm transition-all"
														>
															{slot}
														</button>
													)}
												</div>
											);
										})}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>,
				document.body
			)}
		</div>
	);
}
