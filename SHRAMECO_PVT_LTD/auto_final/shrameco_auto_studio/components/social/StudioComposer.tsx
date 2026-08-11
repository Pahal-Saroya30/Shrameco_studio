'use client';

import { FacebookPostCardPreview } from '@/components/social/FacebookPostCardPreview';
import { FacebookLinkCardPreview } from '@/components/social/FacebookLinkCardPreview';
import { FacebookCarouselCardPreview } from '@/components/social/FacebookCarouselCardPreview';
import { FacebookVideoCardPreview } from '@/components/social/FacebookVideoCardPreview';
import { storeMediaBlob } from '@/lib/mediaStorage';

import React, { useState, useRef, useEffect, forwardRef } from 'react';

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
import { ReelPlayerTemplate } from '@/components/templates/ReelPlayerTemplate';
import { toPng } from 'html-to-image';
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
	Globe,
	Tag,
	CalendarDays,
	HelpCircle,
	Plus,
	Image as ImageIcon,
	Youtube,
	Facebook,
	Video,
	UploadCloud,
	AlertCircle,
	Film,
	X as CloseIcon,
	MoreVertical,
	Monitor,
	Smartphone,
	ChevronDown,
	Eye,
	History,
	Users,
} from 'lucide-react';
import Link from 'next/link';

interface PostVariation {
	id: string;
	title: string;
	caption: string;
	history?: string[];
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
		{ id: 'text', label: 'Text Post' },
		{ id: 'photo', label: 'Photo Post' },
		{ id: 'reel', label: 'Video Reel' },
		{ id: 'story', label: 'Story' },
		{ id: 'carousel', label: 'Carousel' },
		{ id: 'video', label: 'Standard Video' },
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
	onScreenText?: string[],
	ref?: any
) => {
	if (aspectRatio === '9/16') {
		return (
			<ReelPlayerTemplate
				ref={ref}
				captionText={captionText}
				topic={topic}
				platform={platform}
				aspectRatio="9/16"
				aiImageUrl={aiImageUrl}
				textAlign={textAlign}
				themeOverride={themeOverride}
				onScreenText={onScreenText}
			/>
		);
	}

	const mappedAspect = aspectRatio;
	
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
	onScreenText?: string[];
}>(({ templateId, variantStyle, captionText, topic, platform, aspectRatio, aiImageUrl, layoutStyle = 'blended', textAlign = 'left', themeOverride, onScreenText }, ref) => {
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
						{renderSpecificTemplate(templateId, captionText, topic, platform, aspectRatio, undefined, 'split', variantStyle, textAlign, themeOverride, onScreenText)}
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
					{renderSpecificTemplate(templateId, captionText, topic, platform, aspectRatio, undefined, 'split', variantStyle, textAlign, themeOverride, onScreenText)}
				</div>
			</div>
		);
	}

	return renderSpecificTemplate(templateId, captionText, topic, platform, aspectRatio, aiImageUrl || undefined, 'blended', variantStyle, textAlign, themeOverride, onScreenText, ref);
});
TemplateWrapper.displayName = 'TemplateWrapper';



export default function StudioComposer({ lockedPlatform }: { lockedPlatform?: 'instagram' | 'linkedin' | 'x' | 'facebook' | 'youtube' }) {
	const brand = useBrand();

	const [step, setStep] = useState<'connect' | 'compose'>(lockedPlatform ? 'compose' : 'connect');
	const [contentFormat, setContentFormat] = useState(lockedPlatform === 'youtube' ? 'video' : (lockedPlatform === 'facebook' ? 'text' : 'post'));
	const [topic, setTopic] = useState('Quarterly Product Roadmap & Strategy');
	const [platform, setPlatform] = useState<'instagram' | 'linkedin' | 'x' | 'facebook' | 'youtube'>(lockedPlatform || 'linkedin');
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

	const [isConnectMenuOpen, setIsConnectMenuOpen] = useState(false);
	const connectMenuRef = useRef<HTMLDivElement>(null);
	const previewPaneRef = useRef<HTMLDivElement>(null);

	const [facebookLinkUrl, setFacebookLinkUrl] = useState<string>('https://shrameco.com/automation');
	const [attachLinkInput, setAttachLinkInput] = useState<string>('');
	const [isCustomPromptOpen, setIsCustomPromptOpen] = useState<boolean>(false);
	const [linkOgData, setLinkOgData] = useState<{ title?: string; image?: string | null; domain?: string } | null>(null);
	const [isLoadingOgData, setIsLoadingOgData] = useState<boolean>(false);

	// Automatically fetch Open Graph metadata for Facebook Link post format
	useEffect(() => {
		if (contentFormat === 'link' && facebookLinkUrl.trim()) {
			let isMounted = true;
			setIsLoadingOgData(true);
			fetch(`/api/og-metadata?url=${encodeURIComponent(facebookLinkUrl.trim())}`)
				.then((res) => res.json())
				.then((data) => {
					if (isMounted) {
						setLinkOgData(data);
						setIsLoadingOgData(false);
					}
				})
				.catch((err) => {
					if (isMounted) {
						console.warn('OG metadata fetch warning:', err);
						setIsLoadingOgData(false);
					}
				});
			return () => {
				isMounted = false;
			};
		}
	}, [facebookLinkUrl, contentFormat]);

async function compressImageForStorage(dataUrl: string, maxWidth = 800, quality = 0.75): Promise<string> {
	return new Promise((resolve) => {
		if (typeof window === 'undefined' || !dataUrl.startsWith('data:image')) return resolve(dataUrl);
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			let width = img.width;
			let height = img.height;
			if (width > maxWidth) {
				height = Math.round((height * maxWidth) / width);
				width = maxWidth;
			}
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (ctx) {
				ctx.drawImage(img, 0, 0, width, height);
				resolve(canvas.toDataURL('image/jpeg', quality));
			} else {
				resolve(dataUrl);
			}
		};
		img.onerror = () => resolve(dataUrl);
		img.src = dataUrl;
	});
}

	// Facebook Carousel Multi-Image State & Handlers
	const [carouselPhotos, setCarouselPhotos] = useState<string[]>([]);
	const [carouselFileError, setCarouselFileError] = useState<string | null>(null);
	const [carouselDragIdx, setCarouselDragIdx] = useState<number | null>(null);
	const carouselFileInputRef = useRef<HTMLInputElement>(null);

	const handleCarouselSelect = (files: FileList | File[]) => {
		setCarouselFileError(null);
		const selectedArr = Array.from(files);

		if (carouselPhotos.length + selectedArr.length > 10) {
			setCarouselFileError('Facebook Carousels support a maximum of 10 photos.');
			return;
		}

		const validFiles = selectedArr.filter(
			(f) => f.type.includes('image') || /\.(jpg|jpeg|png|webp)$/i.test(f.name)
		);
		if (validFiles.length === 0) {
			setCarouselFileError('Please select valid image files (JPG or PNG).');
			return;
		}

		let processedCount = 0;
		const newPhotos: string[] = [];

		validFiles.forEach((file) => {
			const reader = new FileReader();
			reader.onload = () => {
				if (reader.result) {
					newPhotos.push(reader.result as string);
				}
				processedCount++;
				if (processedCount === validFiles.length) {
					setCarouselPhotos((prev) => [...prev, ...newPhotos].slice(0, 10));
					// Auto-trigger caption generation
					triggerAutoCaptionGen(`A Facebook Carousel post with ${newPhotos.length + carouselPhotos.length} photos about: ${topic}`);
				}
			};
			reader.readAsDataURL(file);
		});
	};

	const handleCarouselDragStart = (e: React.DragEvent, index: number) => {
		setCarouselDragIdx(index);
		e.dataTransfer.effectAllowed = 'move';
	};

	const handleCarouselDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};

	const handleCarouselDrop = (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault();
		if (carouselDragIdx === null || carouselDragIdx === dropIndex) return;
		setCarouselPhotos((prev) => {
			const updated = [...prev];
			const [moved] = updated.splice(carouselDragIdx, 1);
			updated.splice(dropIndex, 0, moved);
			return updated;
		});
		setCarouselDragIdx(null);
	};

	const moveCarouselPhoto = (index: number, direction: 'left' | 'right') => {
		const targetIndex = direction === 'left' ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= carouselPhotos.length) return;
		setCarouselPhotos((prev) => {
			const updated = [...prev];
			const temp = updated[index];
			updated[index] = updated[targetIndex];
			updated[targetIndex] = temp;
			return updated;
		});
	};

	const removeCarouselPhoto = (index: number) => {
		setCarouselPhotos((prev) => prev.filter((_, i) => i !== index));
	};

	// Facebook Standard Video State & Handlers
	const [standardVideoFile, setStandardVideoFile] = useState<File | null>(null);
	const [standardVideoUrl, setStandardVideoUrl] = useState<string | null>(null);
	const [standardVideoError, setStandardVideoError] = useState<string | null>(null);
	const standardVideoInputRef = useRef<HTMLInputElement>(null);

	const handleStandardVideoSelect = (file: File) => {
		setStandardVideoError(null);
		if (!file.type.startsWith('video/')) {
			setStandardVideoError('Please select a valid video file (MP4, MOV, or WEBM).');
			return;
		}
		setStandardVideoFile(file);
		const url = URL.createObjectURL(file);
		setStandardVideoUrl(url);

		const resolvedTopic = topic.trim() || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
		if (!topic.trim()) {
			setTopic(resolvedTopic);
		}
		// Auto-trigger caption generation
		triggerAutoCaptionGen(`A Facebook video post about: ${resolvedTopic}. Video attached: ${file.name}`);
	};

	// Automation-First AI Generation & Customization State
	const [aiGenerationMode, setAiGenerationMode] = useState<{ mode: 'llm' | 'offline_fallback'; modelName?: string } | null>(null);
	const [aiTone, setAiTone] = useState<string>('Auto');
	const [aiGoal, setAiGoal] = useState<string>('Awareness');
	const [isCustomizeOpen, setIsCustomizeOpen] = useState<boolean>(false);
	const [isAiAssistantPopoverOpen, setIsAiAssistantPopoverOpen] = useState<boolean>(false);
	const aiAssistantPopoverRef = useRef<HTMLDivElement>(null);
	const [aiGeneratedHashtags, setAiGeneratedHashtags] = useState<string[]>([]);
	const [reelStructuredData, setReelStructuredData] = useState<{
		hook: string;
		caption: string;
		hashtags: string[];
		onScreenText: string[];
	} | null>(null);

	// Facebook Reel Video Upload & Validation State
	const [reelVideoFile, setReelVideoFile] = useState<File | null>(null);

	// Facebook Live Preview Mode State (Desktop vs Mobile)
	const [fbPreviewMode, setFbPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

	// Facebook Photo Post Upload & AI Source State
	const [photoImageSource, setPhotoImageSource] = useState<'upload' | 'ai'>('upload');
	const [photoFile, setPhotoFile] = useState<File | null>(null);
	const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
	const [photoFileError, setPhotoFileError] = useState<string | null>(null);
	const photoFileInputRef = useRef<HTMLInputElement>(null);

	// Photo AI Image Generator State & Handler
	const [photoAiPrompt, setPhotoAiPrompt] = useState<string>('');
	const [photoAiProviderBadge, setPhotoAiProviderBadge] = useState<string | null>(null);

	const triggerPhotoAiGeneration = async () => {
		const targetPrompt = photoAiPrompt.trim() || `High-resolution photo about ${topic} for ${brand?.companyName || 'brand'}`;
		setVariations((prev) => prev.map((v, i) => (i === activeVarIdx ? { ...v, isGeneratingImage: true } : v)));
		try {
			const res = await fetch('/api/generate-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: targetPrompt }),
			});
			const data = await res.json();
			if (data.imageUrl) {
				setVariations((prev) => prev.map((v, i) => (i === activeVarIdx ? { ...v, imageUrl: data.imageUrl, isGeneratingImage: false } : v)));
				if (data.provider) {
					setPhotoAiProviderBadge(data.provider);
				}
				showNotification(`AI Image generated via ${data.provider || 'AI Provider'}!`);

				// Dynamically trigger matching caption generation based on the generated image context
				try {
					const captionRes = await fetch('/api/generate', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							topic: `A Facebook photo post about: ${topic}. The photo shows: ${targetPrompt}`,
							platform,
							format: 'photo',
							tone: aiTone !== 'Auto' ? aiTone : undefined,
							goal: aiGoal,
							count: 1,
							framework,
						}),
					});
					const captionData = await captionRes.json();
					if (captionData.variations && captionData.variations.length > 0) {
						const newCaption = captionData.variations[0];
						setVariations((prev) => prev.map((v, i) => (i === activeVarIdx ? {
							...v,
							caption: newCaption,
							history: v.caption?.trim() && v.caption !== newCaption ? [...(v.history || []), v.caption] : (v.history || []),
						} : v)));
						showNotification('Post caption updated to match the generated photo!');
					}
				} catch (captionErr) {
					console.error('Failed to auto-generate caption matching photo:', captionErr);
				}
			} else {
				showNotification('Failed to generate AI image.');
			}
		} catch (err) {
			console.error('Photo AI image generation error:', err);
			showNotification('Failed to generate AI image.');
		} finally {
			setVariations((prev) => prev.map((v, i) => (i === activeVarIdx ? { ...v, isGeneratingImage: false } : v)));
		}
	};

	// Helper to automatically trigger caption generation based on format and media context
	const triggerAutoCaptionGen = async (customCtx?: string) => {
		setIsGenerating(true);
		try {
			const res = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					topic: customCtx || `A Facebook ${contentFormat} post about: ${topic}`,
					platform,
					format: contentFormat,
					tone: aiTone !== 'Auto' ? aiTone : undefined,
					goal: aiGoal,
					count: 1,
					framework,
				}),
			});
			const data = await res.json();
			if (data.variations && data.variations.length > 0) {
				const newCap = data.variations[0];
				setVariations((prev) => prev.map((v, i) => i === activeVarIdx ? {
					...v,
					caption: newCap,
					history: v.caption?.trim() && v.caption !== newCap ? [...(v.history || []), v.caption] : (v.history || []),
				} : v));
				showNotification('Caption generated automatically for your media!');
			}
		} catch (err) {
			console.error('Auto caption generation error:', err);
		} finally {
			setIsGenerating(false);
		}
	};

	// Sync photoAiPrompt when topic changes
	useEffect(() => {
		if (topic) {
			setPhotoAiPrompt(`High-resolution photo of ${topic} for ${brand?.companyName || 'brand'}`);
		}
	}, [topic, brand?.companyName]);

	const handlePhotoSelect = (file: File) => {
		setPhotoFileError(null);
		
		// If it's a video file and the format is Reel or Story, handle it as a video upload!
		if (file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name)) {
			if (contentFormat === 'reel') {
				handleVideoSelect(file);
			} else {
				setPhotoFile(file);
				setPhotoPreviewUrl(URL.createObjectURL(file));
				triggerAutoCaptionGen(`A Facebook Story with video about: ${topic}. Video attached: ${file.name}`);
			}
			return;
		}

		const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
		if (!validTypes.includes(file.type) && !/\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
			setPhotoFileError('Invalid file format. Please upload a JPG or PNG image.');
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			setPhotoFileError('File size too large. Maximum allowed size is 10MB.');
			return;
		}
		setPhotoFile(file);
		const reader = new FileReader();
		reader.onload = () => {
			setPhotoPreviewUrl(reader.result as string);
		};
		reader.readAsDataURL(file);
		// Auto-trigger caption generation
		triggerAutoCaptionGen(`A Facebook photo post about: ${topic}. Photo attached: ${file.name}`);
	};
	const [activeStorySlideIdx, setActiveStorySlideIdx] = useState(0);
	useEffect(() => {
		if (activeStorySlideIdx >= carouselPhotos.length) {
			setActiveStorySlideIdx(0);
		}
	}, [carouselPhotos.length, activeStorySlideIdx]);

	const [reelVideoUrl, setReelVideoUrl] = useState<string | null>(null);
	const [reelVideoError, setReelVideoError] = useState<string | null>(null);
	const [reelCoverUrl, setReelCoverUrl] = useState<string | null>(null);
	const [reelVideoMeta, setReelVideoMeta] = useState<{ duration: number; width: number; height: number } | null>(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const videoFileInputRef = useRef<HTMLInputElement>(null);
	const coverFileInputRef = useRef<HTMLInputElement>(null);

	const platformMaxCaption: Record<string, number> = {
		x: 280,
		facebook: 2200,
		linkedin: 3000,
		instagram: 2200,
		youtube: 5000,
	};

	const [reelVideoDescription, setReelVideoDescription] = useState<string>('');

	const handleVideoSelect = (file: File) => {
		setReelVideoError(null);

		if (!file.type.includes('mp4') && !file.name.toLowerCase().endsWith('.mp4')) {
			setReelVideoError('Invalid video format: Facebook Reels require MP4 (.mp4) format.');
			return;
		}

		// Auto-prefill Campaign Topic from cleaned filename
		const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
		const cleanedFilename = nameWithoutExt
			.replace(/[-_]+/g, ' ')
			.replace(/[0-9]+/g, '')
			.replace(/\s+/g, ' ')
			.trim();
		if (cleanedFilename) {
			const formattedTopic = cleanedFilename
				.split(' ')
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
				.join(' ');
			setTopic(formattedTopic);
		}

		const objectUrl = URL.createObjectURL(file);
		setReelVideoUrl(objectUrl);
		setReelVideoFile(file);

		// Browser HTML5 video validation for 9:16 aspect ratio & 3–90s duration
		const tempVideo = document.createElement('video');
		tempVideo.preload = 'metadata';
		tempVideo.src = objectUrl;

		tempVideo.onloadedmetadata = () => {
			const duration = tempVideo.duration;
			const width = tempVideo.videoWidth;
			const height = tempVideo.videoHeight;
			const ratio = width / height;

			setReelVideoMeta({ duration, width, height });

			let errorMsg = '';
			if (duration < 3 || duration > 90) {
				errorMsg = `Reel duration must be between 3 and 90 seconds (uploaded: ${duration.toFixed(1)}s).`;
			} else if (height <= width || ratio < 0.45 || ratio > 0.65) {
				errorMsg = `Reel video must be 9:16 vertical aspect ratio (uploaded: ${width}x${height} landscape/square).`;
			}

			if (errorMsg) {
				setReelVideoError(errorMsg);
			} else {
				// Auto-extract first frame cover image to canvas
				tempVideo.currentTime = 0.5;
				// Auto-trigger caption generation
				const resolvedTopic = cleanedFilename || topic;
				triggerAutoCaptionGen(`A Facebook Reel post about: ${resolvedTopic}. Video attached: ${file.name}`);
			}
		};

		tempVideo.onseeked = () => {
			try {
				const canvas = document.createElement('canvas');
				canvas.width = tempVideo.videoWidth || 1080;
				canvas.height = tempVideo.videoHeight || 1920;
				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
					const coverData = canvas.toDataURL('image/jpeg', 0.85);
					setReelCoverUrl(coverData);
				}
			} catch (e) {
				console.warn('Cover frame extraction warning:', e);
			}
		};
	};

	const [variations, setVariations] = useState<PostVariation[]>([
		{
			id: '1',
			title: 'Option 1',
			caption: '',
			history: [],
			imageUrl: null,
			templateId: 'quote-card',
			aspectRatio: '4/5',
			layoutStyle: 'blended',
			textAlign: 'left',
			themeOverride: 'light',
			isGeneratingImage: false,
			imagePrompt: '',
		},
		{
			id: '2',
			title: 'Option 2',
			caption: '',
			history: [],
			imageUrl: null,
			templateId: 'announcement',
			aspectRatio: '4/5',
			layoutStyle: 'split',
			textAlign: 'left',
			themeOverride: 'dark',
			isGeneratingImage: false,
			imagePrompt: '',
		},
		{
			id: '3',
			title: 'Option 3',
			caption: '',
			history: [],
			imageUrl: null,
			templateId: 'tip-list',
			aspectRatio: '4/5',
			layoutStyle: 'full-bleed',
			textAlign: 'center',
			themeOverride: 'light',
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

	const handleFormatChange = (newFormat: string) => {
		setContentFormat(newFormat);
		setPhotoFile(null);
		setPhotoPreviewUrl(null);
		setPhotoFileError(null);
		setReelVideoFile(null);
		setReelVideoUrl(null);
		setReelVideoError(null);
		setReelCoverUrl(null);
		setStandardVideoFile(null);
		setStandardVideoUrl(null);
		setStandardVideoError(null);
		setCarouselPhotos([]);
		setCarouselFileError(null);
		setActiveStorySlideIdx(0);
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
			if (aiAssistantPopoverRef.current && !aiAssistantPopoverRef.current.contains(event.target as Node)) {
				setIsAiAssistantPopoverOpen(false);
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

	// Auto-construct prompt based on brand profile, clean topic, variation, and selected platform
	const constructPromptForVariation = (index: number) => {
		const company = brand?.companyName || 'aravalli travels';
		const industry = brand?.industry || 'Travel & Hospitality';
		const targetTopic = topic || 'Monsoon getaways in the Aravalli hills';
		const cleanTopic = targetTopic
			.replace(/^A ([\w\s\/]+) (script\/caption|caption|post) about:\s*/i, '')
			.replace(/^A \w+ script\/caption about:\s*/i, '')
			.replace(/^A \w+ caption about:\s*/i, '')
			.trim();

		const colors = brand?.colorPalette || [];
		const colorsText = colors.length > 0 ? `using a color palette of ${colors.join(', ')}` : 'using balanced natural atmospheric tones';
		const visualAngles = [
			`High resolution authentic editorial photography depicting: ${cleanTopic}. Capturing vivid environmental details, atmosphere, and authentic scenery of ${cleanTopic} for ${company} (${industry}). Style: Cinematic lighting, rich color grading, natural depth of field, 8k resolution, uncropped.`,
			`Breathtaking wide-angle photography illustrating: ${cleanTopic} with ${company} brand presence in the ${industry} domain. Style: High-impact editorial photography, golden hour natural light, dynamic perspective, pristine details, 8k resolution.`,
			`Close-up aesthetic visual photography showcasing key elements of: ${cleanTopic} for ${company}. ${colorsText}. Style: Professional commercial brand photography, soft background blur, clean focal balance, 8k resolution.`
		];

		return visualAngles[index % visualAngles.length];
	};

	// Dynamically generate brand-aligned hashtags whenever brand profile changes
	useEffect(() => {
		if (brand?.companyName && brand.companyName !== 'Acme Studio') {
			const cleanName = brand.companyName.replace(/[^a-zA-Z0-9]/g, '');
			const ind = (brand.industry || 'Business').replace(/[^a-zA-Z0-9]/g, '');
			setAiGeneratedHashtags([
				`#${cleanName}`,
				`#${ind}`,
				`#${cleanName}Updates`,
				`#${ind}Insights`,
			]);
		} else {
			setAiGeneratedHashtags([]);
		}
	}, [brand?.companyName, brand?.industry]);

	// Sync aspectRatio for variations whenever contentFormat changes
	useEffect(() => {
		if (['reel', 'story', 'short'].includes(contentFormat)) {
			setVariations((prev) => prev.map((v) => ({ ...v, aspectRatio: '9/16' as const })));
		} else {
			setVariations((prev) => prev.map((v) => ({ ...v, aspectRatio: '4/5' as const })));
		}
	}, [contentFormat]);

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

	// Sync active AI variation image to photoPreviewUrl when in Photo AI mode
	useEffect(() => {
		if (contentFormat === 'photo' && photoImageSource === 'ai') {
			const activeImg = variations[activeVarIdx]?.imageUrl;
			if (activeImg) {
				setPhotoPreviewUrl(activeImg);
			}
		}
	}, [contentFormat, photoImageSource, activeVarIdx, variations]);

	// Single trigger for text captions + concurrent image generation
	const handleGenerateCampaign = async () => {
		if (!topic.trim()) return;
		setIsGenerating(true);
		try {
			const visualCtx = contentFormat === 'reel' && reelVideoDescription.trim() ? ` (Visual clip description: ${reelVideoDescription.trim()})` : '';
			const generatedTopic = `A ${contentFormat} script/caption about: ${topic}${visualCtx}`;
			const res = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					topic: generatedTopic,
					platform,
					format: contentFormat,
					tone: aiTone !== 'Auto' ? aiTone : undefined,
					goal: aiGoal,
					count: 3,
					framework,
				}),
			});
			const data = await res.json();

			if (data.generationMode) {
				setAiGenerationMode({ mode: data.generationMode, modelName: data.modelName });
			}

			if (data.textData) {
				if (data.textData.hashtags) {
					setAiGeneratedHashtags(data.textData.hashtags);
				}
				setVariations((prev) =>
					prev.map((v, idx) => {
						const newCap = data.variations[idx] || (data.textData.caption + '\n\n' + data.textData.hashtags.join(' '));
						return {
							...v,
							caption: newCap,
							history: v.caption?.trim() && v.caption !== newCap ? [...(v.history || []), v.caption] : (v.history || []),
						};
					})
				);
				showNotification('Facebook Text post generated successfully with AI!');
			} else if (data.reelData) {
				setReelStructuredData(data.reelData);
				const hashtagsStr = data.reelData.hashtags ? '\n\n' + data.reelData.hashtags.join(' ') : '';
				setVariations((prev) =>
					prev.map((v, idx) => {
						const newCap = (idx === 0 ? data.reelData.caption : data.variations[idx] || data.reelData.caption) + hashtagsStr;
						return {
							...v,
							caption: newCap,
							history: v.caption?.trim() && v.caption !== newCap ? [...(v.history || []), v.caption] : (v.history || []),
						};
					})
				);
				showNotification('Reel script & timing beats generated successfully!');
			} else if (res.ok && data.variations && data.variations.length >= 3) {
				setVariations((prev) =>
					prev.map((v, idx) => {
						const newCap = data.variations[idx];
						return {
							...v,
							caption: newCap,
							history: v.caption?.trim() && v.caption !== newCap ? [...(v.history || []), v.caption] : (v.history || []),
						};
					})
				);
				showNotification('Captions generated successfully!');
			} else {
				throw new Error(data.error || 'Failed to generate campaign content');
			}

			// Trigger AI image generation only when Photo post is in 'ai' image mode
			if (contentFormat === 'photo' && photoImageSource === 'ai') {
				const imgUrl = await triggerImageGenerationForVariation(activeVarIdx, constructPromptForVariation(activeVarIdx));
				if (imgUrl) {
					setPhotoPreviewUrl(imgUrl);
				}
			}
		} catch (err: any) {
			showNotification(err.message || 'Campaign generation failed.');
		} finally {
			setIsGenerating(false);
		}
	};

	const [applyBrandGuidelines, setApplyBrandGuidelines] = useState<boolean>(true);
	const [visibility, setVisibility] = useState<string>('Public (Instant release)');
	const [category, setCategory] = useState<string>('Education & Tutorials');
	const [tags, setTags] = useState<string[]>(['#truck', '#loading', '#inventory', '#delivery', '#warehouse', '#efficiency', '#logistics', '#tips']);
	const [newTagInput, setNewTagInput] = useState<string>('');
	const [audienceKids, setAudienceKids] = useState<boolean>(false);
	const [transcodeProgress, setTranscodeProgress] = useState<number>(15);
	const [isRefiningCaption, setIsRefiningCaption] = useState<string | null>(null);
	const [customInstructionInput, setCustomInstructionInput] = useState<string>('');
	const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(true);

	useEffect(() => {
		if (publishedModal?.open) {
			setTranscodeProgress(15);
			const timer = setInterval(() => {
				setTranscodeProgress((prev) => {
					if (prev >= 100) {
						clearInterval(timer);
						return 100;
					}
					return prev + Math.floor(Math.random() * 15) + 5;
				});
			}, 600);
			return () => clearInterval(timer);
		}
	}, [publishedModal?.open]);

	const handleAddTag = () => {
		if (!newTagInput.trim()) return;
		const formatted = newTagInput.trim().startsWith('#') ? newTagInput.trim() : `#${newTagInput.trim()}`;
		if (!tags.includes(formatted)) {
			setTags([...tags, formatted]);
		}
		setNewTagInput('');
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setTags(tags.filter((t) => t !== tagToRemove));
	};

	const handleUndoCaption = (varIdx: number = activeVarIdx) => {
		const targetVar = variations[varIdx];
		if (!targetVar || !targetVar.history || targetVar.history.length === 0) return;
		const previousCaption = targetVar.history[targetVar.history.length - 1];
		const newHistory = targetVar.history.slice(0, -1);
		setVariations((prev) =>
			prev.map((v, i) => (i === varIdx ? { ...v, caption: previousCaption, history: newHistory } : v))
		);
		showNotification('Reverted to previous caption!');
	};

	const handleRefineCaption = async (action: string, customText?: string) => {
		const currentText = variations[activeVarIdx]?.caption?.trim();
		if (!currentText) {
			showNotification('Write or generate a caption first to refine.');
			return;
		}

		setIsRefiningCaption(action);

		if (action === 'add_hashtags' || action === 'hashtags') {
			const existingTags = aiGeneratedHashtags.length > 0 ? aiGeneratedHashtags : ['#BrandGrowth', `#${(brand?.companyName || 'Brand').replace(/\s+/g, '')}`];
			const newTags = existingTags.filter((tag) => !currentText.includes(tag));
			const updatedCaption = newTags.length > 0 ? `${currentText}\n\n${newTags.join(' ')}` : currentText;
			setVariations((prev) =>
				prev.map((v, i) =>
					i === activeVarIdx
						? { ...v, caption: updatedCaption, history: [...(v.history || []), currentText] }
						: v
				)
			);
			showNotification('Hashtags added to caption!');
			setIsRefiningCaption(null);
			return;
		}

		try {
			const res = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					topic: topic || 'Brand Updates',
					platform,
					format: contentFormat,
					tone: aiTone !== 'Auto' ? aiTone : undefined,
					goal: aiGoal,
					count: 1,
					currentCaption: currentText,
					refineAction: action,
					customInstruction: customText || customInstructionInput,
				}),
			});

			const data = await res.json();
			if (data.generationMode) {
				setAiGenerationMode({ mode: data.generationMode, modelName: data.modelName });
			}

			if (res.ok && (data.textData?.caption || data.generatedText || (data.variations && data.variations[0]))) {
				const refinedText = data.textData?.caption || data.generatedText || data.variations[0];
				setVariations((prev) =>
					prev.map((v, i) =>
						i === activeVarIdx
							? { ...v, caption: refinedText, history: [...(v.history || []), currentText] }
							: v
					)
				);
				showNotification('Caption refined successfully!');
				if (action === 'custom') setCustomInstructionInput('');
			} else {
				throw new Error(data.error || 'Failed to refine caption');
			}
		} catch (err: any) {
			showNotification(err.message || 'Caption refinement failed.');
		} finally {
			setIsRefiningCaption(null);
		}
	};

	const triggerImageGenerationForVariation = async (index: number, promptOverride?: string): Promise<string | undefined> => {
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
				if (contentFormat === 'photo' && photoImageSource === 'ai') {
					setPhotoPreviewUrl(data.imageUrl);
				}
				showNotification(`Image for Variation ${index + 1} generated!`);
				return data.imageUrl;
			} else {
				throw new Error(data.error || 'Failed to generate image');
			}
		} catch (err: any) {
			showNotification(`Variation ${index + 1} image failed: ${err.message}`);
			return undefined;
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

	const handlePublish = async (index: number, platform: string) => {
		const v = variations[index];

		// Pre-publish validation check with clean toast notifications
		const validationError = (() => {
			if (contentFormat === 'text' && !v.caption?.trim()) return 'Enter message text to publish';
			if (v.caption?.length > (platformMaxCaption[platform] || 2200)) return `Exceeds ${(platformMaxCaption[platform] || 2200).toLocaleString()} character limit`;
			if (platform === 'facebook' && (contentFormat === 'photo' || contentFormat === 'post') && !photoPreviewUrl && !v.imageUrl) return 'Photo post requires an image';
			if (platform === 'facebook' && contentFormat === 'story' && carouselPhotos.length === 0) return 'Story post requires at least 1 slide/image';
			if (platform === 'facebook' && contentFormat === 'carousel' && carouselPhotos.length < 2) return `Carousel post requires at least 2 photos`;
			if (platform === 'facebook' && contentFormat === 'video' && !standardVideoUrl) return 'Standard Video post requires a video file';
			if (platform === 'youtube' && contentFormat === 'video' && !standardVideoUrl) return 'Video post requires a video file';
			if (platform === 'youtube' && contentFormat === 'short' && !reelVideoUrl) return 'Shorts post requires a video file';
			return null;
		})();

		if (validationError) {
			showNotification(`⚠️ ${validationError}`);
			return;
		}

		setPublishing({ index, platform });
		setPublishMenuOpen(null);
		try {
			let finalImageUrl: string | undefined = undefined;
			if (contentFormat === 'photo' || contentFormat === 'post') {
				finalImageUrl = photoImageSource === 'upload' ? (photoPreviewUrl || undefined) : (v.imageUrl || photoPreviewUrl || undefined);
			} else if (contentFormat === 'reel') {
				finalImageUrl = reelCoverUrl || undefined;
			} else if (contentFormat === 'carousel' || contentFormat === 'story') {
				try {
					const compressedPhotos = await Promise.all(
						carouselPhotos.map((photo) => compressImageForStorage(photo, 800, 0.75))
					);
					sessionStorage.setItem('latest_published_carousel_images', JSON.stringify(compressedPhotos));
				} catch (e) {
					console.warn('Failed to store carousel photos in sessionStorage:', e);
				}
			} else if (contentFormat !== 'text' && contentFormat !== 'link') {
				const targetNode = variationRefs.current[index];
				if (targetNode) {
					try {
						finalImageUrl = await toPng(targetNode, { quality: 0.95, pixelRatio: 2, cacheBust: true });
					} catch (exportErr) {
						console.warn('Failed to capture template card as PNG:', exportErr);
					}
				}
				if (!finalImageUrl) {
					finalImageUrl = v.imageUrl || undefined;
				}
			}

			if (finalImageUrl && contentFormat !== 'carousel' && contentFormat !== 'reel' && contentFormat !== 'video' && contentFormat !== 'link') {
				try {
					sessionStorage.setItem('latest_published_image', finalImageUrl);
				} catch (e) {}
			} else if (contentFormat === 'carousel' || contentFormat === 'reel' || contentFormat === 'video' || contentFormat === 'text' || contentFormat === 'link') {
				try {
					sessionStorage.removeItem('latest_published_image');
				} catch (e) {}
			}

			let videoDataUrl: string | undefined = undefined;
			if ((contentFormat === 'reel' && reelVideoFile) || (contentFormat === 'video' && standardVideoFile)) {
				const vFile = contentFormat === 'reel' ? reelVideoFile : standardVideoFile;
				if (vFile) {
					try {
						await storeMediaBlob('latest_published_video_blob', vFile);
					} catch (e) {
						console.warn('Failed to store video in IndexedDB:', e);
					}
					try {
						videoDataUrl = await new Promise<string>((resolve, reject) => {
							const reader = new FileReader();
							reader.onload = () => resolve(reader.result as string);
							reader.onerror = (err) => reject(err);
							reader.readAsDataURL(vFile);
						});
					} catch (readErr) {
						console.error('Failed to read video file as base64:', readErr);
					}
				}
				const activeBlobUrl = (contentFormat === 'video' ? standardVideoUrl : reelVideoUrl);
				try {
					if (activeBlobUrl) {
						sessionStorage.setItem('latest_published_video', activeBlobUrl);
					}
				} catch (e) {}
			} else if (contentFormat !== 'reel' && contentFormat !== 'video') {
				try {
					sessionStorage.removeItem('latest_published_video');
				} catch (e) {}
			}

			// Store latest account and full caption in sessionStorage
			try {
				sessionStorage.setItem('latest_published_account', brand?.companyName || 'aravalli travels');
				sessionStorage.setItem('latest_published_caption', v.caption.trim());
			} catch (e) {}

			// Preserve full caption text for text, photo, and reel formats
			const postCaption = v.caption.trim();

			const res = await fetch('/api/social/publish', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					platform,
					contentFormat,
					caption: postCaption,
					imageUrl: (contentFormat === 'reel' || contentFormat === 'link' || contentFormat === 'carousel' || contentFormat === 'video' || contentFormat === 'story') ? undefined : finalImageUrl,
					linkUrl: contentFormat === 'link' ? facebookLinkUrl.trim() : undefined,
					carouselImages: (contentFormat === 'carousel' || contentFormat === 'story') ? carouselPhotos : undefined,
					videoDataUrl,
					coverDataUrl: reelCoverUrl || undefined,
					contentId: v.savedItemId || undefined,
				}),
			});
			const data = await res.json();
			if (res.ok) {
				const connAcc = connectedAccounts.find((a) => a.platform === platform);
				const accName = connAcc?.accountName || brand?.companyName || 'aravalli travels';
				const demoUrl = `/feed-preview?platform=${platform}&format=${contentFormat}&accountName=${encodeURIComponent(accName)}&caption=${encodeURIComponent(v.caption.trim())}${contentFormat === 'link' ? `&linkUrl=${encodeURIComponent(facebookLinkUrl.trim())}` : ''}`;
				setPublishedModal({
					open: true,
					platform,
					accountName: accName,
					caption: v.caption,
					imageUrl: finalImageUrl,
					postUrl: data.mode === 'demo' ? demoUrl : (data.postUrl || demoUrl),
					mode: data.mode || 'demo',
				});
				showNotification(data.message || `Published to ${PLATFORM_META[platform]?.label || platform}!`);
				fetchConnectedAccounts();
			} else {
				showNotification(data.error || `Failed to publish to ${platform}.`);
			}
		} catch (err) {
			console.error('Publish error:', err);
			showNotification(`Failed to publish to ${platform}.`);
		} finally {
			setPublishing(null);
		}
	};

	const activeVar = variations[activeVarIdx] || variations[0];
	const [aiMode, setAiMode] = useState(false);
	const [isDesignMenuOpen, setIsDesignMenuOpen] = useState(false);

	const capitalizedFormat = contentFormat.charAt(0).toUpperCase() + contentFormat.slice(1);

	return (
		<div className="flex flex-col h-full min-h-0 bg-slate-50 text-slate-900 overflow-hidden">
			{/* Floating toast notification */}
			{notification && (
				<div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-down">
					<div className="bg-white text-slate-900 px-6 py-3 rounded-xl shadow-lg flex items-center space-x-3 border border-slate-200">
						<CheckCircle className="w-5 h-5 text-emerald-500" />
						<span className="font-semibold text-sm">{notification}</span>
					</div>
				</div>
			)}



			{step === 'connect' ? (
				<div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 p-6 overflow-y-auto relative">
					{/* Soft glow background */}
					<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-[#1d4d4f]/10 blur-[100px] pointer-events-none rounded-full"></div>
					
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
								{ id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50', accent: '#1877F2' },
								{ id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600', bg: 'bg-red-50', accent: '#FF0000' },
							].map((plat) => {
								const connected = connectedAccounts.find(a => a.platform === plat.id);
								return (
									<div 
										key={plat.id} 
										className={`bg-white rounded-2xl p-5 flex flex-col justify-between transition-all relative overflow-hidden border border-slate-200 shadow-sm min-h-[155px] ${
											connected ? 'shadow-md border-slate-200' : 'hover:border-slate-300 hover:shadow-md'
										}`}
									>
										{connected && (
											<div className="absolute top-0 left-0 w-full h-[3.5px]" style={{ backgroundColor: plat.accent }} />
										)}
										
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-3.5 min-w-0">
												<div className={`w-11 h-11 rounded-xl flex items-center justify-center ${plat.bg} border border-slate-100 flex-shrink-0`}>
													<plat.icon className={`w-5 h-5 ${plat.color}`} />
												</div>
												<div className="min-w-0">
													<h3 className="font-bold text-slate-900 text-sm truncate">{plat.label}</h3>
													<p className={`text-xs font-semibold mt-0.5 ${connected ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
														{connected ? 'Connected' : 'Not connected'}
													</p>
												</div>
											</div>

											{connected && (
												<Link
													href={`/dashboard/${plat.id}`}
													onClick={() => {
														setPlatform(plat.id as any);
														setStep('compose');
													}}
													className="text-xs font-bold px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex items-center space-x-1 transition-colors shadow-2xs cursor-pointer flex-shrink-0"
												>
													<span>Studio</span>
													<ExternalLink className="w-3 h-3 text-slate-400" />
												</Link>
											)}
										</div>

										<div className="mt-4">
											{isConnecting === plat.id ? (
												<div className="w-full py-2.5 rounded-xl border border-slate-200 flex justify-center items-center bg-slate-50">
													<RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
												</div>
											) : connected ? (
												<button 
													onClick={() => handleDisconnect(plat.id)} 
													className="w-full bg-rose-50/70 hover:bg-rose-100 text-rose-600 font-bold border border-rose-100/80 py-2.5 rounded-xl transition-colors text-xs cursor-pointer shadow-2xs active:scale-[0.99]"
												>
													Disconnect
												</button>
											) : (
												<button 
													onClick={() => handleConnect(plat.id)} 
													className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm shadow-violet-500/20 text-xs cursor-pointer active:scale-[0.99]"
												>
													Connect
												</button>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			) : (
				<div className="flex-1 overflow-y-auto bg-[#EFF6F7] p-6 md:p-8 relative">
					<div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
						{/* Left Column: Composer */}
						<div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
							{/* Header Section */}
							{!lockedPlatform ? (
								<div className="flex items-center justify-between pb-4 border-b border-slate-100">
									<div className="flex items-center space-x-3.5">
										<div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm relative">
											<span className="font-bold text-slate-700 text-sm">S</span>
											<div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center border border-white">
												{platform === 'facebook' ? (
													<Facebook className="w-2.5 h-2.5 text-white" />
												) : (
													<Youtube className="w-2.5 h-2.5 text-white" />
												)}
											</div>
										</div>
										<div>
											<h1 className="text-lg font-bold text-slate-900 font-display tracking-tight">Create Post</h1>
											<p className="text-xs text-slate-400 font-semibold">Compose post variations for connected channels</p>
										</div>
									</div>

									<div className="relative" ref={connectMenuRef}>
										<button 
											onClick={() => setIsConnectMenuOpen(!isConnectMenuOpen)}
											className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
										>
											<Plus className="w-5 h-5" />
										</button>
										
										{isConnectMenuOpen && (
											<div className="absolute top-full mt-2 right-0 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-fade-in">
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
																className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors group cursor-pointer"
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
							) : (
								/* Premium Platform Header (Matching VLC Screenshot Layout) */
								<div className="flex flex-col md:flex-row md:items-start md:justify-between pb-5 border-b border-slate-200/60 gap-4">
									<div className="flex items-start space-x-3.5">
										{/* Big platform circular icon */}
										<div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-2xs ${
											platform === 'facebook' 
												? 'bg-blue-50 border-blue-100 text-blue-600' 
												: 'bg-red-50 border-red-100 text-red-600'
										}`}>
											{platform === 'facebook' ? (
												<Facebook className="w-6 h-6" />
											) : (
												<Youtube className="w-6 h-6" />
											)}
										</div>
										<div className="space-y-0.5">
											<h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
												{platform === 'facebook' ? 'Facebook Studio' : 'YouTube Studio'}
											</h1>
											<p className="text-xs font-semibold text-slate-450 leading-relaxed max-w-md">
												{platform === 'facebook' 
													? 'Generate high-quality captions, schedule text, photo, carousel or video posts, and track page insights.'
													: 'Generate SEO-optimized Titles/Tags, upload Shorts and videos, and scan files for copyright warnings.'
												}
											</p>
										</div>
									</div>

									{/* Connection Card (Right of Header) */}
									{(() => {
										const account = connectedAccounts.find(a => a.platform === platform && a.connected);
										const isPlatConnected = !!account;
										return (
											<div className="flex items-center space-x-3 bg-white border border-slate-200 rounded-2xl p-2.5 px-3.5 shadow-2xs min-w-[220px]">
												<div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-xs flex-shrink-0 ${
													platform === 'facebook' ? 'bg-blue-600' : 'bg-red-600'
												}`}>
													{(account?.accountName || 'S').charAt(0).toUpperCase()}
												</div>
												<div className="flex-1 min-w-0 pr-3 border-r border-slate-200/80">
													<h3 className="text-xs font-extrabold text-slate-900 truncate">{account?.accountName || (platform === 'facebook' ? 'Facebook Page' : 'Shui')}</h3>
													<div className="flex items-center space-x-1 mt-0.5">
														<span className={`w-1.5 h-1.5 rounded-full ${isPlatConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-350'}`}></span>
														<span className="text-[10px] text-slate-450 font-bold">{isPlatConnected ? 'Connected' : 'Disconnected'}</span>
													</div>
												</div>
												<div className="flex-shrink-0 pl-1">
													{isPlatConnected ? (
														<button 
															onClick={() => handleDisconnect(platform)} 
															className="text-xs font-extrabold text-slate-450 hover:text-red-650 transition-colors cursor-pointer"
														>
															Disconnect
														</button>
													) : (
														<button 
															onClick={() => handleConnect(platform)} 
															className="text-xs font-extrabold text-[#1d4d4f] hover:text-[#15383b] transition-colors cursor-pointer"
														>
															Connect
														</button>
													)}
												</div>
											</div>
										);
									})()}
								</div>
							)}

							{/* Select Format & Media Source Row */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
								{/* SELECT FORMAT */}
								<div className={`space-y-1.5 ${!['photo', 'post', 'reel', 'video', 'short', 'story'].includes(contentFormat) ? 'md:col-span-2' : ''}`}>
									<span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">SELECT FORMAT</span>
									<div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-1 flex flex-wrap justify-center gap-1 shadow-2xs min-h-[44px] items-center">
										{(platform === 'facebook' 
											? [
												{ id: 'text', label: 'Text', icon: AlignLeft },
												{ id: 'photo', label: 'Photo', icon: ImageIcon },
												{ id: 'reel', label: 'Reel', icon: Film },
												{ id: 'story', label: 'Story', icon: Smartphone },
												{ id: 'carousel', label: 'Carousel', icon: Layers },
												{ id: 'video', label: 'Video', icon: Video },
											]
											: [
												{ id: 'video', label: 'Video', icon: Video },
												{ id: 'short', label: 'Short', icon: Film },
											]
										).map((fmt) => {
											const isActive = contentFormat === fmt.id || (fmt.id === 'photo' && contentFormat === 'post');
											return (
												<button
													key={fmt.id}
													type="button"
													onClick={() => handleFormatChange(fmt.id)}
													className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 border ${
														isActive
															? 'bg-white text-[#1d4d4f] border-slate-200 shadow-2xs font-extrabold'
															: 'bg-transparent text-slate-450 border-transparent hover:text-slate-700 hover:bg-slate-100/50'
													}`}
												>
													<span>{fmt.label}</span>
												</button>
											);
										})}
									</div>
								</div>

								{/* MEDIA SOURCE */}
								{['photo', 'post', 'reel', 'video', 'short'].includes(contentFormat) && (
									<div className="space-y-1.5 relative">
										<div className="flex items-center justify-between">
											<span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">MEDIA SOURCE</span>
											{/* Clear/Remove button if media is attached */}
											{((contentFormat === 'reel' && reelVideoFile) || 
												((contentFormat === 'photo' || contentFormat === 'post' || contentFormat === 'story') && photoFile) || 
												(contentFormat === 'video' && standardVideoFile) ||
												(contentFormat === 'carousel' && carouselPhotos.length > 0)) && (
												<button 
													onClick={() => {
														if (contentFormat === 'reel') { setReelVideoFile(null); setReelVideoUrl(null); }
														else if (contentFormat === 'video') { setStandardVideoFile(null); setStandardVideoUrl(null); }
														else if (contentFormat === 'photo' || contentFormat === 'post' || contentFormat === 'story') { setPhotoFile(null); setPhotoPreviewUrl(null); }
														else if (contentFormat === 'carousel') { setCarouselPhotos([]); }
													}}
													className="text-[9px] font-black uppercase text-red-500 hover:text-red-700 flex items-center space-x-0.5 cursor-pointer bg-transparent border-none active:scale-95"
												>
													<Trash2 className="w-3.5 h-3.5" />
													<span>Remove</span>
												</button>
											)}
										</div>

										{/* If media is linked/attached, show the attached card just like the screenshot! */}
										{((contentFormat === 'reel' && reelVideoFile) || 
											((contentFormat === 'photo' || contentFormat === 'post' || contentFormat === 'story') && photoFile) || 
											(contentFormat === 'video' && standardVideoFile) ||
											(contentFormat === 'carousel' && carouselPhotos.length > 0)) ? (
											<div className="bg-white border border-slate-200 rounded-xl px-3.5 py-1.5 flex items-center justify-between shadow-2xs h-[42px] animate-scale-in">
												<div className="flex items-center space-x-2 min-w-0 flex-1">
													{contentFormat === 'reel' || contentFormat === 'video' ? (
														<Video className="w-4 h-4 text-slate-400 flex-shrink-0" />
													) : (
														<ImageIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
													)}
													<span className="text-xs font-semibold text-slate-700 truncate pr-2">
														{contentFormat === 'reel' ? reelVideoFile?.name :
														 contentFormat === 'video' ? standardVideoFile?.name :
														 contentFormat === 'carousel' ? `${carouselPhotos.length} images` :
														 photoFile?.name || 'Attached Media'}
													</span>
												</div>
												<span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg flex-shrink-0">
													Linked
												</span>
											</div>
										) : (
											/* Otherwise, show standard uploader picker buttons */
											<div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-1 flex items-center w-full gap-1 shadow-2xs min-h-[44px]">
												{[
													{ id: 'upload', label: 'Direct Upload', icon: UploadCloud },
													{ id: 'ai', label: 'Generate AI', icon: Sparkles },
												].map((src) => {
													const isActive = photoImageSource === src.id;
													return (
														<button
															key={src.id}
															type="button"
															onClick={() => setPhotoImageSource(src.id as any)}
															className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 border ${
																isActive
																	? 'bg-white text-[#1d4d4f] border-slate-200 shadow-2xs font-extrabold'
																	: 'bg-transparent text-slate-450 border-transparent hover:text-slate-700 hover:bg-slate-100/50'
															}`}
														>
															<span>{src.label}</span>
														</button>
													);
												})}
											</div>
										)}
									</div>
								)}
							</div>

							{/* Photo/Reel/Story Post Image Source Selector Panel */}
							{platform === 'facebook' && (contentFormat === 'photo' || contentFormat === 'post' || contentFormat === 'reel') && (
								<div className="bg-[#F5FAFB] border border-[#B8D4D8]/80 rounded-2xl p-4 space-y-3.5 shadow-2xs animate-fade-in mb-4">
									<div className="flex items-center justify-between">
										<label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
											{contentFormat === 'reel' ? (
												<Film className="w-4 h-4 text-blue-600" />
											) : (
												<ImageIcon className="w-4 h-4 text-blue-600" />
											)}
											<span>Attach {contentFormat === 'reel' ? 'Reel' : 'Media'}</span>
										</label>
										<span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
											{contentFormat === 'reel' ? 'Facebook Reel' : 'Facebook Photo Post'}
										</span>
									</div>
									{photoImageSource === 'upload' && (
										<div className="space-y-2">
											{photoFileError && (
												<div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-xl flex items-center space-x-2">
													<AlertCircle className="w-4 h-4 text-red-500" />
													<span className="font-semibold">{photoFileError}</span>
												</div>
											)}
											{reelVideoError && (
												<div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-xl flex items-center space-x-2">
													<AlertCircle className="w-4 h-4 text-red-500" />
													<span className="font-semibold">{reelVideoError}</span>
												</div>
											)}

											<div
												onDragOver={(e) => {
													e.preventDefault();
													setIsDragOver(true);
												}}
												onDragLeave={() => setIsDragOver(false)}
												onDrop={(e) => {
													e.preventDefault();
													setIsDragOver(false);
													if (e.dataTransfer.files && e.dataTransfer.files[0]) {
														handlePhotoSelect(e.dataTransfer.files[0]);
													}
												}}
												onClick={() => photoFileInputRef.current?.click()}
												className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
													isDragOver
														? 'border-[#1d4d4f] bg-[#E0EDEF]/30'
														: (photoPreviewUrl || reelVideoUrl)
														? 'border-emerald-300 bg-white'
														: 'border-slate-300 bg-white hover:bg-slate-50'
												}`}
											>
												<input
													type="file"
													ref={photoFileInputRef}
													accept={contentFormat === 'reel' ? "video/mp4" : "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"}
													className="hidden"
													onChange={(e) => e.target.files?.[0] && handlePhotoSelect(e.target.files[0])}
												/>

												{(photoPreviewUrl || reelVideoUrl) ? (
													<div className="w-full space-y-2">
														{((photoFile && photoFile.type.startsWith('video/')) || reelVideoUrl) ? (
															<video src={reelVideoUrl || photoPreviewUrl || undefined} className="w-full max-h-[220px] rounded-lg object-contain bg-slate-900 shadow-sm" controls />
														) : (
															<img src={photoPreviewUrl || undefined} alt="Uploaded Media" className="w-full max-h-[220px] rounded-lg object-contain bg-slate-900 shadow-sm" />
														)}
														<div className="flex items-center justify-between px-1">
															<span className="text-xs font-bold text-slate-700 truncate max-w-[240px]">{photoFile?.name || reelVideoFile?.name || 'Uploaded Media'}</span>
															<button
																type="button"
																onClick={(e) => {
																	e.stopPropagation();
																	setPhotoFile(null);
																	setPhotoPreviewUrl(null);
																	setReelVideoFile(null);
																	setReelVideoUrl(null);
																	setReelVideoMeta(null);
																	setReelCoverUrl(null);
																}}
																className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
															>
																<CloseIcon className="w-3.5 h-3.5" />
																<span>Remove</span>
															</button>
														</div>
													</div>
												) : (
													<div className="space-y-1.5 py-1">
														<UploadCloud className="w-8 h-8 text-[#1d4d4f] mx-auto" />
														<p className="text-xs font-bold text-slate-700">Drag & drop your media or <span className="text-[#1d4d4f] underline">browse</span></p>
														<p className="text-[10px] text-slate-400">Supports JPG, PNG or MP4 video</p>
													</div>
												)}
											</div>
										</div>
									)}

									{/* Option B: Generate with AI */}
									{photoImageSource === 'ai' && (
										<div className="space-y-3.5 pt-1">
											{/* Custom Image Prompt Input */}
											<div>
												<label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
													<span>Image Prompt</span>
													<span className="text-[10px] text-slate-400 font-normal">Editable</span>
												</label>
												<textarea
													rows={2}
													value={photoAiPrompt}
													onChange={(e) => setPhotoAiPrompt(e.target.value)}
													placeholder={topic ? `High-res photo of ${topic} for ${brand?.companyName || 'brand'}` : `Enter custom photo generation prompt...`}
													className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl p-2.5 shadow-2xs focus:border-[#1d4d4f] focus:outline-none resize-none"
												/>
											</div>

											{/* Active Provider Badge */}
											{photoAiProviderBadge && (
												<div className="flex items-center justify-between text-xs px-3 py-1.5 bg-[#E0EDEF] border border-[#B8D4D8]/80 rounded-xl text-[#1d4d4f] font-medium">
													<span className="flex items-center space-x-1.5">
														<Sparkles className="w-3.5 h-3.5 text-[#1d4d4f]" />
														<span>Provider: <strong>{photoAiProviderBadge}</strong></span>
													</span>
													<span className="text-[10px] text-[#1d4d4f] uppercase font-bold">Active</span>
												</div>
											)}

											{/* Image Display & Actions */}
											{activeVar.imageUrl ? (
												<div className="space-y-2">
													<img src={activeVar.imageUrl} alt="AI Generated Photo" className="w-full max-h-[220px] rounded-xl object-contain bg-slate-900 shadow-md" />
													<div className="flex items-center justify-between px-1">
														<span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
															<Sparkles className="w-3.5 h-3.5" />
															<span>Photo Ready</span>
														</span>
														<div className="flex items-center space-x-2">
															<button
																type="button"
																onClick={() => {
																	setVariations((prev) => prev.map((v, i) => (i === activeVarIdx ? { ...v, imageUrl: null } : v)));
																	setPhotoAiProviderBadge(null);
																}}
																className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
															>
																<CloseIcon className="w-3.5 h-3.5" />
																<span>Remove Photo</span>
															</button>
															<button
																type="button"
																disabled={activeVar.isGeneratingImage}
																onClick={triggerPhotoAiGeneration}
																className="px-3 py-1.5 bg-[#1d4d4f] hover:bg-[#15383b] text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
															>
																<RefreshCw className={`w-3.5 h-3.5 ${activeVar.isGeneratingImage ? 'animate-spin' : ''}`} />
																<span>{activeVar.isGeneratingImage ? 'Generating...' : 'Regenerate'}</span>
															</button>
														</div>
													</div>
												</div>
											) : (
												<button
													type="button"
													disabled={activeVar.isGeneratingImage}
													onClick={triggerPhotoAiGeneration}
													className="w-full py-2.5 bg-[#1d4d4f] hover:bg-[#15383b] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
												>
													<Sparkles className={`w-4 h-4 ${activeVar.isGeneratingImage ? 'animate-spin' : ''}`} />
													<span>{activeVar.isGeneratingImage ? 'Generating AI Photo...' : 'Generate Photo with AI'}</span>
												</button>
											)}
										</div>
									)}
								</div>
							)}

							{/* Facebook Carousel / Story Multi-Image Uploader Panel */}
							{platform === 'facebook' && (contentFormat === 'carousel' || contentFormat === 'story') && (
								<div className="bg-[#F5FAFB] border border-[#B8D4D8]/80 rounded-2xl p-5 space-y-4 shadow-2xs animate-fade-in mb-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2">
											<Layers className="w-5 h-5 text-[#1d4d4f]" />
											<div>
												<h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
													{contentFormat === 'story' ? 'Story Slides (1 to 10 Images/Slides)' : 'Carousel Photos (2 to 10 Images)'}
												</h3>
												<p className="text-[11px] text-slate-500 font-medium">
													{contentFormat === 'story' ? 'Upload photos for your sequential story slides.' : 'Users swipe through photos in order.'}
												</p>
											</div>
										</div>
										<span className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
											carouselPhotos.length >= (contentFormat === 'story' ? 1 : 2)
												? 'bg-emerald-50 text-emerald-700 border-emerald-200'
												: 'bg-amber-50 text-amber-800 border-amber-200'
										}`}>
											{carouselPhotos.length} / 10 {contentFormat === 'story' ? 'Slides' : 'Photos'}
										</span>
									</div>

									{carouselFileError && (
										<div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-xl font-semibold flex items-center space-x-2">
											<AlertCircle className="w-4 h-4 text-red-500" />
											<span>{carouselFileError}</span>
										</div>
									)}

									{/* Thumbnail Reorderable Row */}
									{carouselPhotos.length > 0 && (
										<div className="space-y-2">
											<label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
												Selected Order (Click arrows to reorder)
											</label>
											<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
												{carouselPhotos.map((photo, idx) => (
													<div 
														key={idx} 
														draggable
														onDragStart={(e) => handleCarouselDragStart(e, idx)}
														onDragOver={handleCarouselDragOver}
														onDrop={(e) => handleCarouselDrop(e, idx)}
														className={`relative group bg-slate-900 rounded-xl overflow-hidden border shadow-sm aspect-square cursor-grab active:cursor-grabbing transition-all ${
															carouselDragIdx === idx ? 'opacity-40 scale-95 ring-2 ring-[#1d4d4f]' : 'border-slate-200'
														}`}
													>
														<img src={photo} alt={`Carousel Photo ${idx + 1}`} className="w-full h-full object-cover select-none pointer-events-none" />
														
														{/* Order Badge */}
														<span className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-white/20">
															#{idx + 1}
														</span>

														{/* Quick Action Overlay */}
														<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
															{idx > 0 && (
																<button
																	type="button"
																	onClick={() => moveCarouselPhoto(idx, 'left')}
																	title="Move Left"
																	className="w-7 h-7 rounded-full bg-white/90 text-slate-900 flex items-center justify-center text-xs font-bold hover:bg-white transition-transform active:scale-95"
																>
																	←
																</button>
															)}
															{idx < carouselPhotos.length - 1 && (
																<button
																	type="button"
																	onClick={() => moveCarouselPhoto(idx, 'right')}
																	title="Move Right"
																	className="w-7 h-7 rounded-full bg-white/90 text-slate-900 flex items-center justify-center text-xs font-bold hover:bg-white transition-transform active:scale-95"
																>
																	→
																</button>
															)}
															<button
																type="button"
																onClick={() => removeCarouselPhoto(idx)}
																title="Remove Photo"
																className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold hover:bg-red-700 transition-transform active:scale-95"
															>
																✕
															</button>
														</div>
													</div>
												))}
											</div>
										</div>
									)}

									{/* Multi-Image File Dropzone */}
									{carouselPhotos.length < 10 && (
										<div
											onDragOver={(e) => {
												e.preventDefault();
												setIsDragOver(true);
											}}
											onDragLeave={() => setIsDragOver(false)}
											onDrop={(e) => {
												e.preventDefault();
												setIsDragOver(false);
												if (e.dataTransfer.files) {
													handleCarouselSelect(e.dataTransfer.files);
												}
											}}
											onClick={() => carouselFileInputRef.current?.click()}
											className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
												isDragOver ? 'border-[#1d4d4f] bg-[#E0EDEF]/30' : 'border-slate-300 bg-slate-50/60 hover:bg-[#E0EDEF]/20'
											}`}
										>
											<input
												type="file"
												ref={carouselFileInputRef}
												multiple
												accept="image/jpeg,image/png,image/webp"
												className="hidden"
												onChange={(e) => e.target.files && handleCarouselSelect(e.target.files)}
											/>
											<UploadCloud className="w-7 h-7 text-[#1d4d4f] mb-1.5" />
											<p className="text-xs font-bold text-slate-700">
												{carouselPhotos.length === 0
													? (contentFormat === 'story' ? 'Drag & drop 1 to 10 slides or browse' : 'Drag & drop 2 to 10 photos or browse')
													: (contentFormat === 'story' ? 'Add more slides to story' : 'Add more photos to carousel')}
											</p>
											<p className="text-[10px] text-slate-400">Supports JPG, PNG up to 10MB each</p>
										</div>
									)}
								</div>
							)}

							{/* Facebook Standard Video Uploader Panel */}
							{platform === 'facebook' && contentFormat === 'video' && (
								<div className="bg-[#F5FAFB] border border-[#B8D4D8]/80 rounded-2xl p-5 space-y-4 shadow-2xs animate-fade-in mb-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2">
											<Video className="w-5 h-5 text-[#1d4d4f]" />
											<div>
												<h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
													Facebook Video (16:9 Landscape or Square)
												</h3>
												<p className="text-[11px] text-slate-500 font-medium">
													Upload an MP4, MOV, or WEBM video for your page feed.
												</p>
											</div>
										</div>
										{standardVideoFile && (
											<span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
												Video Attached
											</span>
										)}
									</div>

									{standardVideoError && (
										<div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-xl font-semibold flex items-center space-x-2">
											<AlertCircle className="w-4 h-4 text-red-500" />
											<span>{standardVideoError}</span>
										</div>
									)}

									{standardVideoUrl ? (
										<div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-2">
													<Film className="w-4 h-4 text-[#1d4d4f]" />
													<span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
														{standardVideoFile?.name}
													</span>
													{standardVideoFile?.size && (
														<span className="text-[10px] text-slate-500 font-semibold">
															({(standardVideoFile.size / (1024 * 1024)).toFixed(1)} MB)
														</span>
													)}
												</div>
												<button
													type="button"
													onClick={() => {
														setStandardVideoFile(null);
														setStandardVideoUrl(null);
													}}
													className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
												>
													Remove Video
												</button>
											</div>

											<div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-300">
												<video
													src={standardVideoUrl}
													controls
													className="w-full h-full object-contain"
												/>
											</div>
										</div>
									) : (
										<div
											onDragOver={(e) => {
												e.preventDefault();
												setIsDragOver(true);
											}}
											onDragLeave={() => setIsDragOver(false)}
											onDrop={(e) => {
												e.preventDefault();
												setIsDragOver(false);
												if (e.dataTransfer.files?.[0]) {
													handleStandardVideoSelect(e.dataTransfer.files[0]);
												}
											}}
											onClick={() => standardVideoInputRef.current?.click()}
											className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
												isDragOver ? 'border-[#1d4d4f] bg-[#E0EDEF]/30' : 'border-slate-300 bg-slate-50/60 hover:bg-[#E0EDEF]/20'
											}`}
										>
											<input
												type="file"
												ref={standardVideoInputRef}
												accept="video/mp4,video/quicktime,video/webm"
												className="hidden"
												onChange={(e) => e.target.files?.[0] && handleStandardVideoSelect(e.target.files[0])}
											/>
											<UploadCloud className="w-8 h-8 text-[#1d4d4f] mb-2" />
											<p className="text-xs font-bold text-slate-700">Drag & drop your video file or click to browse</p>
											<p className="text-[11px] text-slate-400">Supports MP4, MOV, WEBM up to 500MB</p>
										</div>
									)}
								</div>
							)}

							{/* AI Generation Section — Compact Inline (Only for Text format on FB, or YouTube) */}
							{((platform === 'facebook' && contentFormat === 'text') || platform === 'youtube') && (
								<div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-2xs">
									<div className="flex items-center justify-between">
										<span className="text-[10px] font-black text-[#1d4d4f] uppercase tracking-wider flex items-center space-x-1.5">
											<Sparkles className="w-3.5 h-3.5 text-[#1d4d4f]" />
											<span>{platform === 'youtube' ? 'AI SEO BOOSTER' : 'AI POST GENERATOR'}</span>
										</span>
										<span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
											{platform === 'youtube' ? 'Generates high-SEO Title, Desc & Tags' : 'Generates engaging captions & hashtags'}
										</span>
									</div>

									<div className="flex items-center space-x-2">
										<input
											type="text"
											value={topic}
											onChange={(e) => setTopic(e.target.value)}
											placeholder={platform === 'youtube' ? "Describe your video topic (e.g. build ecommerce store in Nextjs)" : `What is this ${contentFormat} about?`}
											className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#1d4d4f] shadow-2xs font-medium"
										/>
										<button
											type="button"
											disabled={isGenerating || !topic.trim()}
											onClick={handleGenerateCampaign}
											className="px-5 py-2.5 bg-[#1B4B5A] hover:bg-[#143943] text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs disabled:opacity-50 cursor-pointer active:scale-95 flex-shrink-0"
										>
											{isGenerating ? (
												<RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
											) : (
												<Sparkles className="w-3.5 h-3.5 text-[#E0EDEF]" />
											)}
											<span>{platform === 'youtube' ? 'Boost' : 'Generate'}</span>
										</button>
									</div>
								</div>
							)}

							{/* Video/Post Title (Only for YouTube platform) */}
							{platform === 'youtube' && (
								<div className="space-y-1.5 animate-fade-in">
									<div className="flex items-center justify-between">
										<span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
											VIDEO TITLE
										</span>
										<span className="text-[10px] font-bold text-slate-400">
											{variations[activeVarIdx]?.title?.length || 0} / 100
										</span>
									</div>
									<input
										type="text"
										value={variations[activeVarIdx]?.title || ''}
										onChange={(e) => {
											const val = e.target.value;
											setVariations((prev) => prev.map((v, i) => i === activeVarIdx ? { ...v, title: val } : v));
										}}
										placeholder="e.g. build ecommerce store in Nextjs"
										maxLength={100}
										className="w-full bg-[#F5FAFB] border border-[#B8D4D8]/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#1d4d4f] focus:bg-white shadow-2xs font-medium transition-all"
									/>
								</div>
							)}

							{/* Generated Content Review & Editor Box */}
							<div className="space-y-1.5 flex flex-col flex-1">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2.5">
										<span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
											{platform === 'youtube' ? 'DESCRIPTION / CAPTION' : 'POST CAPTION'}
										</span>
										<div className="h-3 w-px bg-slate-200" />
										<label className="flex items-center space-x-1.5 text-[9px] font-black text-[#1d4d4f]/80 uppercase tracking-wider cursor-pointer hover:text-[#1d4d4f] transition-colors">
											<input 
												type="checkbox" 
												checked={applyBrandGuidelines} 
												onChange={(e) => setApplyBrandGuidelines(e.target.checked)}
												className="rounded border-slate-350 bg-white text-[#1d4d4f] focus:ring-[#1d4d4f]/20 w-3.5 h-3.5 cursor-pointer" 
											/>
											<span>Apply Brand Guidelines</span>
										</label>
									</div>
									<span className="text-[10px] font-bold text-slate-400">
										{activeVar.caption?.length || 0} / {platformMaxCaption[platform] || 2200}
									</span>
								</div>

								<div className="bg-[#F5FAFB] border border-[#B8D4D8]/80 focus-within:border-[#1d4d4f] focus-within:bg-white rounded-2xl flex flex-col flex-1 transition-all shadow-2xs relative overflow-hidden">
									{/* Textarea Container */}
									<div className="p-4 flex flex-col flex-1 relative">
										{isGenerating ? (
											<div className="flex-1 min-h-[180px] py-2 space-y-2.5 animate-pulse">
												<div className="h-4 bg-slate-200 rounded-md w-11/12"></div>
												<div className="h-4 bg-slate-200 rounded-md w-4/5"></div>
												<div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
												<div className="h-4 bg-slate-200 rounded-md w-1/2"></div>
											</div>
										) : (
											<textarea 
												className="bg-transparent border-none outline-none resize-none flex-1 text-slate-900 placeholder-slate-400 w-full min-h-[180px] text-sm font-medium leading-relaxed"
												placeholder={platform === 'youtube' ? "Tell viewers about your video, insert social links, timelines or site resources..." : `Start writing your ${capitalizedFormat} or type a topic above to generate with AI...`}
												value={activeVar.caption}
												maxLength={platformMaxCaption[platform] || 2200}
												onChange={(e) => {
													const newCaption = e.target.value;
													setVariations(prev => prev.map((v, i) => i === activeVarIdx ? { ...v, caption: newCaption } : v));
												}}
											/>
										)}

										{/* Character Count Indicator */}
										<div className="flex items-center justify-between text-xs font-medium text-slate-400 pt-2 border-t border-slate-100">
											<div className="flex items-center space-x-2">
												{aiGenerationMode?.mode === 'llm' && (
													<span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center space-x-1">
														<span>✨ Live AI</span>
														{aiGenerationMode.modelName && <span className="text-[10px] font-normal opacity-75">({aiGenerationMode.modelName})</span>}
													</span>
												)}
											</div>
										</div>


								</div>

								{/* Minimalist Action Toolbar Directly Below Textarea */}
								<div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 border-t border-slate-200/80 relative">
									{/* Left Side: Floating AI Assistant Popover Trigger */}
									<div className="flex items-center space-x-2 relative" ref={aiAssistantPopoverRef}>
										<button
											type="button"
											onClick={() => setIsAiAssistantPopoverOpen(!isAiAssistantPopoverOpen)}
											className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#1d4d4f] hover:bg-[#15383b] text-white shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
										>
											<Sparkles className="w-3.5 h-3.5 text-[#E0EDEF]" />
											<span>✨ AI Assistant</span>
											<ChevronDown className="w-3 h-3 text-[#E0EDEF] ml-0.5" />
										</button>

										{/* Floating Popover Menu (Matching Video Reference Screenshot) */}
										{isAiAssistantPopoverOpen && (
											<div className="absolute bottom-full mb-2 left-0 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in space-y-4">
												{/* REWRITE FOR */}
												<div className="space-y-2">
													<span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">REWRITE FOR</span>
													<div className="grid grid-cols-2 gap-1.5">
														{[
															{ id: 'voice_professional', label: 'Professional' },
															{ id: 'voice_viral', label: 'Viral' },
															{ id: 'voice_casual', label: 'Casual' },
														].map((p) => (
															<button
																key={p.id}
																type="button"
																disabled={!activeVar.caption?.trim() || isRefiningCaption !== null}
																onClick={() => {
																	handleRefineCaption(p.id);
																	setIsAiAssistantPopoverOpen(false);
																}}
																className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-[#E0EDEF] hover:text-[#1d4d4f] border border-slate-200 text-left transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
															>
																{p.label}
															</button>
														))}
													</div>
												</div>

												{/* QUICK FIX */}
												<div className="space-y-2 pt-2 border-t border-slate-100">
													<span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">QUICK FIX</span>
													<div className="flex flex-wrap gap-1.5">
														{[
															{ id: 'add_hashtags', label: 'Add Hashtags' },
															{ id: 'improve_grammar', label: 'Improve Grammar' },
															{ id: 'shorten', label: 'Shorten' },
															{ id: 'make_engaging', label: 'Make Engaging' },
														].map((fix) => (
															<button
																key={fix.id}
																type="button"
																disabled={!activeVar.caption?.trim() || isRefiningCaption !== null}
																onClick={() => {
																	handleRefineCaption(fix.id);
																	setIsAiAssistantPopoverOpen(false);
																}}
																className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-[#E0EDEF] hover:text-[#1d4d4f] border border-slate-200 transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
															>
																{fix.label}
															</button>
														))}
													</div>
												</div>

												{/* CUSTOM INSTRUCTION */}
												<div className="space-y-2 pt-2 border-t border-slate-100">
													<span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">CUSTOM INSTRUCTION</span>
													<div className="flex items-center space-x-1.5">
														<input
															type="text"
															value={customInstructionInput}
															onChange={(e) => setCustomInstructionInput(e.target.value)}
															placeholder="e.g. Make this sound like Satya Nadella..."
															className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-2.5 py-1.5 focus:bg-white focus:border-[#1d4d4f] focus:outline-none font-medium"
														/>
														<button
															type="button"
															disabled={!activeVar.caption?.trim() || !customInstructionInput.trim() || isRefiningCaption !== null}
															onClick={() => {
																handleRefineCaption('custom', customInstructionInput);
																setIsAiAssistantPopoverOpen(false);
															}}
															className="px-3 py-1.5 bg-[#1d4d4f] hover:bg-[#15383b] text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center space-x-1 active:scale-95"
														>
															<span>Apply</span>
														</button>
													</div>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Dynamic Brand Guidelines Details Panel (Visibility, Category, Tags) */}
						{applyBrandGuidelines && activeVar.caption && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in pt-1">
								{/* Column 1: Visibility & Category */}
								<div className="space-y-4">
									{/* Visibility Card */}
									<div className="space-y-1.5">
										<span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">VISIBILITY</span>
										<select
											value={visibility}
											onChange={(e) => setVisibility(e.target.value)}
											className="w-full bg-[#F5FAFB] border border-[#B8D4D8]/80 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 shadow-2xs focus:border-[#1d4d4f] focus:bg-white focus:outline-none font-semibold cursor-pointer transition-all"
										>
											<option value="Public (Instant release)">Public (Instant release)</option>
											<option value="Private">Private</option>
											<option value="Unlisted">Unlisted</option>
											<option value="Schedule">Schedule</option>
										</select>
									</div>

									{/* Category Card */}
									<div className="space-y-1.5">
										<span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">CATEGORY</span>
										<select
											value={category}
											onChange={(e) => setCategory(e.target.value)}
											className="w-full bg-[#F5FAFB] border border-[#B8D4D8]/80 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 shadow-2xs focus:border-[#1d4d4f] focus:bg-white focus:outline-none font-semibold cursor-pointer transition-all"
										>
											<option value="Education & Tutorials">Education & Tutorials</option>
											<option value="Technology">Technology</option>
											<option value="Entertainment">Entertainment</option>
											<option value="People & Blogs">People & Blogs</option>
											<option value="Gaming">Gaming</option>
											<option value="Howto & Style">Howto & Style</option>
											<option value="Music">Music</option>
											<option value="Sports">Sports</option>
										</select>
									</div>
								</div>

								{/* Column 2: Tags / Keywords */}
								<div className="space-y-1.5">
									<span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">TAGS / KEYWORDS</span>
									<div className="bg-[#F5FAFB] border border-[#B8D4D8]/80 rounded-2xl p-4 shadow-2xs flex flex-col space-y-3.5">
										{/* Tag Pills */}
										<div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
											{tags.map((tag) => (
												<span key={tag} className="text-[10px] font-bold text-slate-650 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg flex items-center space-x-1 animate-scale-in">
													<span>{tag}</span>
													<button
														type="button"
														onClick={() => handleRemoveTag(tag)}
														className="text-slate-400 hover:text-red-500 font-extrabold focus:outline-none ml-0.5"
													>
														×
													</button>
												</span>
											))}
											{tags.length === 0 && (
												<span className="text-[10px] text-slate-400 font-medium">No tags added yet.</span>
											)}
										</div>

										{/* Input Area */}
										<div className="flex items-center space-x-2 border-t border-slate-100 pt-2.5">
											<input
												type="text"
												value={newTagInput}
												onChange={(e) => setNewTagInput(e.target.value)}
												onKeyDown={(e) => {
													if (e.key === 'Enter') {
														e.preventDefault();
														handleAddTag();
													}
												}}
												placeholder="Add tags (press Enter)"
												className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-[11px] rounded-xl px-2.5 py-1.5 focus:bg-white focus:border-[#1d4d4f] focus:outline-none font-medium"
											/>
											<button
												type="button"
												onClick={handleAddTag}
												className="text-[11px] font-bold text-[#1d4d4f] hover:text-[#15383b] bg-[#E0EDEF] hover:bg-[#c9e1e4] px-3 py-1.5 rounded-xl border border-[#B8D4D8]/80 transition-colors active:scale-95 cursor-pointer"
											>
												+ Add
											</button>
										</div>
									</div>
								</div>
							</div>
						)}
						</div>

						{/* Right Column: Live Preview & Action Center */}
						<div ref={previewPaneRef} className="lg:col-span-5 space-y-6">
						{/* Card 1: Post Previews */}
						<div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm w-full flex flex-col items-center relative space-y-4">
							<div className="flex items-center justify-between w-full border-b border-slate-100 pb-3">
								<h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
									<Eye className="w-4 h-4 text-slate-450" />
									<span>Post Previews</span>
								</h3>
								<span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
									{PLATFORM_META[platform]?.label || platform}
								</span>
							</div>

							{/* Facebook Desktop / Mobile View Mode Toggle */}
							{platform === 'facebook' && (
								<div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-250/60 shadow-2xs z-20">
									<button
										type="button"
										onClick={() => setFbPreviewMode('desktop')}
										className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
											fbPreviewMode === 'desktop'
												? 'bg-white text-slate-900 shadow-sm border border-slate-200'
												: 'text-slate-500 hover:text-slate-800'
										}`}
									>
										<Monitor className="w-3.5 h-3.5" />
										<span>Desktop</span>
									</button>
									<button
										type="button"
										onClick={() => setFbPreviewMode('mobile')}
										className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
											fbPreviewMode === 'mobile'
												? 'bg-white text-slate-900 shadow-sm border border-slate-200'
												: 'text-slate-500 hover:text-slate-800'
										}`}
									>
										<Smartphone className="w-3.5 h-3.5" />
										<span>Mobile</span>
									</button>
								</div>
							)}

							<div className={`w-full flex justify-center ${
								platform === 'facebook' && fbPreviewMode === 'mobile' ? 'max-w-[360px]' : 'max-w-[500px]'
							} py-2 scale-[0.95] origin-center`}>
								{platform === 'facebook' && contentFormat === 'text' ? (
									<FacebookPostCardPreview
										companyName={brand?.companyName || 'aravalli travels'}
										captionText={activeVar.caption}
									>
										{null}
									</FacebookPostCardPreview>
								) : platform === 'facebook' && (contentFormat === 'post' || contentFormat === 'photo') ? (
									<FacebookPostCardPreview
										companyName={brand?.companyName || 'aravalli travels'}
										captionText={activeVar.caption}
									>
										{(() => {
											const activePhotoUrl = photoImageSource === 'upload' ? photoPreviewUrl : (activeVar.imageUrl || photoPreviewUrl);
											return activePhotoUrl ? (
												<img
													src={activePhotoUrl}
													alt="Facebook Photo Attachment"
													className="w-full h-auto object-cover max-h-[500px]"
												/>
											) : (
												<div className="w-full h-48 bg-slate-100 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium">
													{photoImageSource === 'upload' ? 'Upload a photo to see live preview' : 'Click "Generate Photo with AI" to see live preview'}
												</div>
											);
										})()}
									</FacebookPostCardPreview>
								) : platform === 'facebook' && contentFormat === 'reel' ? (
									/* Authentic Vertical 9:16 Facebook Reel Video Player */
									<div className="w-full max-w-[320px] aspect-[9/16] bg-slate-950 rounded-[28px] overflow-hidden shadow-2xl border border-slate-800/80 relative flex flex-col justify-between text-white animate-fade-in group">
										{reelVideoUrl ? (
											<video
												src={reelVideoUrl}
												controls
												autoPlay
												muted
												loop
												playsInline
												className="absolute inset-0 w-full h-full object-cover rounded-[28px]"
											/>
										) : (
											<div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center p-6 text-center space-y-2.5">
												<div className="w-12 h-12 rounded-full bg-[#1d4d4f]/10 border border-[#1d4d4f]/20 flex items-center justify-center text-[#1d4d4f]">
													<Film className="w-6 h-6" />
												</div>
												<div>
													<p className="text-xs font-bold text-slate-200">Upload a video to see your reel preview</p>
													<p className="text-[10px] text-slate-400 mt-0.5">Requires MP4 format (9:16 vertical)</p>
												</div>
											</div>
										)}

										{/* Dark Gradient Overlay */}
										<div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/85 pointer-events-none" />

										{/* Top Header Badge */}
										<div className="relative z-10 p-4 flex items-center justify-between pointer-events-none">
											<div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
												<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
												<span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-200">Reel Preview</span>
											</div>
										</div>

										{/* Bottom Overlay: Page Avatar + Name + Plain Text Caption */}
										<div className="relative z-10 p-4 space-y-2 pointer-events-none bg-gradient-to-t from-black/80 via-black/40 to-transparent">
											<div className="flex items-center space-x-2">
												<div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1877F2] to-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md border border-white/20">
													{(brand?.companyName || 'A').charAt(0).toUpperCase()}
												</div>
												<span className="font-bold text-xs text-white drop-shadow-md">{brand?.companyName || 'aravalli travels'}</span>
											</div>

											{activeVar.caption && (
												<p className="text-xs font-medium text-slate-100 line-clamp-3 leading-snug drop-shadow-md whitespace-pre-line">
													{activeVar.caption}
												</p>
											)}
										</div>
									</div>
								) : platform === 'facebook' && contentFormat === 'story' ? (
									/* Authentic Vertical 9:16 Facebook Story Preview Frame */
									<div 
										onClick={() => {
											if (carouselPhotos.length > 1) {
												setActiveStorySlideIdx((prev) => (prev + 1) % carouselPhotos.length);
											}
										}}
										className="w-full max-w-[300px] aspect-[9/16] bg-slate-950 rounded-[28px] overflow-hidden shadow-2xl border border-slate-800/85 relative flex flex-col justify-between text-white animate-fade-in group cursor-pointer"
									>
										{/* Top Multi-Segment Story Progress Bar */}
										<div className="absolute top-3.5 left-0 w-full px-3.5 flex space-x-1 z-30">
											{carouselPhotos.length > 0 ? (
												carouselPhotos.map((_, sIdx) => (
													<div 
														key={sIdx} 
														className={`h-0.5 flex-1 rounded-full transition-all duration-350 ${
															sIdx === activeStorySlideIdx ? 'bg-white' : sIdx < activeStorySlideIdx ? 'bg-white/80' : 'bg-white/30'
														}`}
													/>
												))
											) : (
												<>
													<div className="h-0.5 flex-1 bg-white rounded-full"></div>
													<div className="h-0.5 flex-1 bg-white/40 rounded-full"></div>
													<div className="h-0.5 flex-1 bg-white/40 rounded-full"></div>
												</>
											)}
										</div>

										{(() => {
											const activePhotoUrl = carouselPhotos[activeStorySlideIdx] || carouselPhotos[0];
											return activePhotoUrl ? (
												<img
													src={activePhotoUrl}
													alt={`Facebook Story Slide ${activeStorySlideIdx + 1}`}
													className="absolute inset-0 w-full h-full object-cover rounded-[28px]"
												/>
											) : (
												<div className="absolute inset-0 bg-gradient-to-tr from-blue-900 via-indigo-900 to-[#1d4d4f]/90 flex flex-col items-center justify-center p-6 text-center space-y-2.5">
													<div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/80">
														<Smartphone className="w-6 h-6" />
													</div>
													<div>
														<p className="text-xs font-bold text-slate-200">Attach media to see your story preview</p>
														<p className="text-[10px] text-slate-400 mt-0.5">Supports 9:16 vertical images</p>
													</div>
												</div>
											);
										})()}

										{/* Dark Gradient Top/Bottom Overlays */}
										<div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent pointer-events-none rounded-t-[28px]" />
										<div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/55 to-transparent pointer-events-none rounded-b-[28px]" />

										{/* Top Header Row (Avatar + Brand Name + Time) */}
										<div className="relative z-10 p-4 pt-6.5 flex items-center justify-between pointer-events-none">
											<div className="flex items-center space-x-2">
												<div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1877F2] to-blue-600 text-white font-extrabold text-xs flex items-center justify-center border border-white/20 shadow-sm">
													{(brand?.companyName || 'A').charAt(0).toUpperCase()}
												</div>
												<div className="flex flex-col">
													<span className="font-extrabold text-xs text-white drop-shadow-sm">{brand?.companyName || 'aravalli travels'}</span>
													<span className="text-[9px] font-semibold text-white/70 drop-shadow-sm">12h</span>
												</div>
											</div>
										</div>

										{/* Centered stylized Caption Text Overlay (mimicking User Sticker Additions) */}
										{activeVar.caption && (
											<div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none z-20">
												<div className="bg-black/65 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/10 max-w-[90%] text-center shadow-lg">
													<p className="text-[11px] font-extrabold text-white leading-relaxed whitespace-pre-line">
														{activeVar.caption}
													</p>
												</div>
											</div>
										)}
									</div>
								) : platform === 'facebook' && contentFormat === 'carousel' ? (
									<FacebookCarouselCardPreview
										companyName={brand?.companyName || 'aravalli travels'}
										captionText={activeVar.caption}
										images={carouselPhotos}
									/>
								) : platform === 'facebook' && contentFormat === 'video' ? (
									<FacebookVideoCardPreview
										companyName={brand?.companyName || 'aravalli travels'}
										captionText={activeVar.caption}
										videoUrl={standardVideoUrl}
									/>
								) : (
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
										onScreenText={reelStructuredData?.onScreenText}
									/>
								)}
							</div>
						</div>

						{/* Card 2: Publish Actions */}
						{(() => {
							return (
								<div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm w-full space-y-4">
									{/* Large action button */}
									<button 
										onClick={() => handlePublish(activeVarIdx, platform)}
										disabled={publishing?.index === activeVarIdx}
										className={`w-full py-3.5 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer ${
											publishing?.index === activeVarIdx
												? 'opacity-50 cursor-not-allowed shadow-none'
												: 'hover:opacity-95 active:scale-[0.99]'
										}`}
										style={{ 
											backgroundColor: PLATFORM_META[platform]?.accent || '#7c3aed',
											boxShadow: !(publishing?.index === activeVarIdx) ? `0 4px 14px 0 ${PLATFORM_META[platform]?.accent}30` : undefined 
										}}
									>
										{publishing?.index === activeVarIdx ? (
											<RefreshCw className="w-4 h-4 animate-spin text-white" />
										) : (
											<Send className="w-4 h-4 text-white" />
										)}
										<span className="uppercase tracking-wider">
											{publishing?.index === activeVarIdx ? 'Publishing...' : `Publish ${contentFormat === 'short' ? 'Shorts' : contentFormat}`}
										</span>
									</button>
								</div>
							);
						})()}

						{/* Card 3: Recent Uploads */}
						<div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm w-full space-y-3.5">
							<div className="flex items-center justify-between">
								<h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
									<History className="w-4 h-4 text-slate-450" />
									<span>Recent Uploads</span>
								</h3>
								<span className="text-[10px] text-slate-400 font-bold">12 logged</span>
							</div>
							
							<div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
								{savedItems
									.filter(item => item.platform === platform && (contentFormat === 'photo' ? (item.format === 'photo' || item.format === 'post') : item.format === contentFormat))
									.slice(0, 3)
									.map((item, idx) => (
										<div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/70 transition-colors">
											<div className="min-w-0 flex-1 pr-3">
												<h4 className="text-xs font-bold text-slate-800 truncate">{item.topic || item.generatedText || 'Untitled Content'}</h4>
												<div className="flex items-center space-x-2 mt-1">
													<span className="text-[9px] font-black uppercase bg-[#E0EDEF] text-[#1d4d4f] border border-[#B8D4D8]/80 px-1.5 py-0.2 rounded">
														{contentFormat.toUpperCase()}
													</span>
													<span className="text-[10px] text-slate-450 font-bold">
														{new Date(item.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
													</span>
												</div>
											</div>
											{item.postUrl && (
												<a href={item.postUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-450 hover:text-[#1d4d4f] hover:bg-[#E0EDEF]/70 transition-colors flex-shrink-0">
													<ExternalLink className="w-3.5 h-3.5" />
												</a>
											)}
										</div>
									))
								}
								{savedItems.filter(item => item.platform === platform && (contentFormat === 'photo' ? (item.format === 'photo' || item.format === 'post') : item.format === contentFormat)).length === 0 && (
									<p className="text-xs text-slate-450 font-semibold text-center py-4">No recent uploads for this channel yet.</p>
								)}
						</div>
						</div>

						{/* Card 4: Audience Settings (Only for YouTube COPPA) */}
						{platform === 'youtube' && applyBrandGuidelines && activeVar.caption && (
							<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs w-full space-y-3.5 animate-fade-in flex-shrink-0">
								<div className="flex items-center justify-between">
									<h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
										<Users className="w-4 h-4 text-slate-450" />
										<span>Audience Settings</span>
									</h3>
									<span className="text-[9px] font-black uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
										{platform === 'youtube' ? 'YOUTUBE COPPA' : 'AUDIENCE CONTROL'}
									</span>
								</div>
								
								<p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
									{platform === 'youtube' 
										? 'Is this video made for kids? Required by YouTube to comply with Child Online Privacy Protection Act.'
										: 'Who should be able to see this post in their feed? Recommended for maximum organic distribution.'
									}
								</p>

								<div className="grid grid-cols-2 gap-2 pt-1">
									<button
										type="button"
										onClick={() => setAudienceKids(true)}
										className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 cursor-pointer ${
											audienceKids === true
												? 'bg-slate-900 text-white border-slate-900 shadow-sm'
												: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
										}`}
									>
										<span>👶</span>
										<span>{platform === 'youtube' ? 'Yes, Made for Kids' : 'Restricted'}</span>
									</button>
									<button
										type="button"
										onClick={() => setAudienceKids(false)}
										className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 cursor-pointer ${
											audienceKids === false
												? 'bg-slate-900 text-white border-slate-900 shadow-sm'
												: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
										}`}
									>
										<span>🧑</span>
										<span>{platform === 'youtube' ? 'No, Adults Only' : 'Public / Open'}</span>
									</button>
								</div>
							</div>
						)}
						</div>
					</div>
				</div>
			)}
			
			{/* Published Modal */}
			{publishedModal?.open && (
				<div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
					{/* Toast Header Overlay */}
					<div className="mb-4 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 animate-bounce">
						<CheckCircle className="w-4 h-4 text-emerald-400" />
						<span className="text-xs font-black uppercase tracking-wider">Published successfully!</span>
					</div>

					{/* Main Modal Card */}
					<div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200/80 flex flex-col md:flex-row relative animate-scale-in">
						
						{/* Close button in top corner */}
						<button 
							onClick={() => setPublishedModal(null)} 
							className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-450 hover:text-slate-700 transition-colors z-20 cursor-pointer"
						>
							<CloseIcon className="w-5 h-5" />
						</button>

						{/* Left Column: Live Server Processing */}
						<div className="flex-1 p-8 border-r border-slate-100 flex flex-col justify-between space-y-6">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2.5">
										<RefreshCw className="w-5 h-5 text-[#1d4d4f] animate-spin" />
										<h3 className="text-base font-black text-slate-800 tracking-tight">Live Server Processing</h3>
									</div>
									<span className="text-[10px] font-black uppercase tracking-wider text-[#1d4d4f] bg-[#E0EDEF] border border-[#B8D4D8]/80 px-2.5 py-0.5 rounded-md">
										{transcodeProgress < 100 ? 'Scanning' : 'Complete'}
									</span>
								</div>

								<p className="text-xs font-medium text-slate-500 leading-relaxed">
									{platform === 'youtube' 
										? 'Google servers are transcoding video resolutions and running Content ID checks.'
										: 'Meta servers are processing media attachments and verifying platform policy compliance.'
									}
								</p>

								{/* ID Info block */}
								<div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
									<span className="text-xs font-bold text-slate-500">
										{platform === 'youtube' ? 'YouTube Video ID:' : 'Facebook Post ID:'}
									</span>
									<code className="text-xs font-black text-slate-805 bg-white border border-slate-200/65 px-2.5 py-1 rounded-lg">
										{platform === 'youtube' ? 'p5JPpoX8Yqk' : 'fb_post_890248234'}
									</code>
								</div>

								{/* Progress bar block */}
								<div className="space-y-2 pt-2">
									<div className="flex items-center justify-between text-xs font-bold text-slate-650">
										<span>{platform === 'youtube' ? 'RESOLUTION TRANSCODE PROGRESS' : 'MEDIA PROCESSING PROGRESS'}</span>
										<span>{transcodeProgress}%</span>
									</div>
									<div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/40">
										<div 
											className="bg-[#1d4d4f] h-full rounded-full transition-all duration-500"
											style={{ width: `${transcodeProgress}%` }}
										/>
									</div>
								</div>

								{/* Steps list */}
								<div className="space-y-3 pt-3 border-t border-slate-150/40">
									{/* Step 1 */}
									<div className="flex items-center justify-between text-xs font-medium">
										<span className="text-slate-600">{platform === 'youtube' ? 'Google Ingestion' : 'Meta Ingestion'}</span>
										<span className="text-emerald-600 font-bold flex items-center space-x-1">
											<CheckCircle className="w-3.5 h-3.5" />
											<span>Complete</span>
										</span>
									</div>
									{/* Step 2 */}
									<div className="flex items-center justify-between text-xs font-medium">
										<span className="text-slate-600">{platform === 'youtube' ? 'Copyright check' : 'Policy check'}</span>
										{transcodeProgress < 100 ? (
											<span className="text-amber-600 font-bold animate-pulse">Scanning...</span>
										) : (
											<span className="text-emerald-600 font-bold flex items-center space-x-1">
												<CheckCircle className="w-3.5 h-3.5" />
												<span>Clean</span>
											</span>
										)}
									</div>
									{/* Step 3 */}
									<div className="flex items-center justify-between text-xs font-medium">
										<span className="text-slate-600">{platform === 'youtube' ? 'Compliance Details' : 'Page Quality check'}</span>
										{transcodeProgress < 100 ? (
											<span className="text-slate-400 font-semibold">Checks queue in progress</span>
										) : (
											<span className="text-emerald-600 font-bold flex items-center space-x-1">
												<CheckCircle className="w-3.5 h-3.5" />
												<span>Clean</span>
											</span>
										)}
									</div>
								</div>
							</div>

							{/* Desktop notification checkbox footer */}
							<div className="border-t border-slate-100 pt-4">
								<label className="flex items-center space-x-2.5 text-xs font-bold text-slate-500 cursor-pointer hover:text-slate-800 transition-colors">
									<input type="checkbox" className="rounded border-slate-350 bg-white text-[#1d4d4f] focus:ring-[#1d4d4f]/20 w-4 h-4" />
									<span>Notify me on desktop when post goes live</span>
								</label>
							</div>
						</div>

						{/* Right Column: Previews and Link */}
						<div className="flex-1 p-8 bg-slate-50/50 flex flex-col justify-between space-y-6">
							<div className="space-y-4 text-center md:text-left">
								<div className="flex flex-col items-center justify-center pt-2">
									<div className="w-10 h-10 rounded-full bg-[#E0EDEF] border border-[#B8D4D8]/80 flex items-center justify-center mb-2">
										<RefreshCw className={`w-5 h-5 text-[#1d4d4f] ${transcodeProgress < 100 ? 'animate-spin' : ''}`} />
									</div>
									<h4 className="text-sm font-black text-slate-850">
										{transcodeProgress < 100 
											? (platform === 'youtube' ? 'Copyright Scanning...' : 'Processing Attachments...') 
											: 'Ready to View!'
										}
									</h4>
									<p className="text-[11px] text-slate-450 font-medium mt-0.5">
										{transcodeProgress < 100 
											? 'Checking assets for copyright and platform policy compliance.'
											: 'Assets validated successfully. Link is live.'
										}
									</p>
								</div>

								{/* Mini post preview card card */}
								<div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3 text-left">
									{(() => {
										if (contentFormat === 'carousel' || contentFormat === 'story') {
											const activePhotoUrl = carouselPhotos[0];
											return activePhotoUrl ? (
												<img 
													src={activePhotoUrl} 
													alt="Post Thumbnail" 
													className="w-full h-32 rounded-xl object-cover bg-slate-900 border border-slate-100" 
												/>
											) : (
												<div className="w-full h-32 bg-slate-100 border border-dashed border-slate-350 rounded-xl flex items-center justify-center text-slate-400 text-xs font-semibold">
													No Media Attached
												</div>
											);
										}
										if (contentFormat === 'reel') {
											return reelCoverUrl ? (
												<img 
													src={reelCoverUrl} 
													alt="Reel Cover Thumbnail" 
													className="w-full h-32 rounded-xl object-cover bg-slate-900 border border-slate-100" 
												/>
											) : reelVideoUrl ? (
												<video 
													src={reelVideoUrl} 
													className="w-full h-32 rounded-xl object-cover bg-slate-900 border border-slate-100 animate-fade-in" 
													muted 
													playsInline 
												/>
											) : (
												<div className="w-full h-32 bg-slate-100 border border-dashed border-slate-350 rounded-xl flex items-center justify-center text-slate-400 text-xs font-semibold">
													No Reel Attached
												</div>
											);
										}
										if (contentFormat === 'video' || contentFormat === 'short') {
											return standardVideoUrl ? (
												<video 
													src={standardVideoUrl} 
													className="w-full h-32 rounded-xl object-cover bg-slate-900 border border-slate-100 animate-fade-in" 
													muted 
													playsInline 
												/>
											) : (
												<div className="w-full h-32 bg-slate-100 border border-dashed border-slate-350 rounded-xl flex items-center justify-center text-slate-400 text-xs font-semibold">
													No Video Attached
												</div>
											);
										}
										const activePhotoUrl = photoImageSource === 'upload' ? photoPreviewUrl : (variations[activeVarIdx]?.imageUrl || photoPreviewUrl);
										return activePhotoUrl ? (
											<img 
												src={activePhotoUrl} 
												alt="Post Thumbnail" 
												className="w-full h-32 rounded-xl object-cover bg-slate-900 border border-slate-100" 
											/>
										) : (
											<div className="w-full h-32 bg-slate-100 border border-dashed border-slate-350 rounded-xl flex items-center justify-center text-slate-400 text-xs font-semibold">
												No Media Attached
											</div>
										);
									})()}

									{/* Title and caption text snippet */}
									<div className="space-y-1">
										<h5 className="text-xs font-extrabold text-slate-850 line-clamp-1">
											{variations[activeVarIdx]?.title || topic || 'Untitled Post'}
										</h5>
										<p className="text-[10px] text-slate-450 font-medium line-clamp-2 leading-relaxed">
											{variations[activeVarIdx]?.caption || 'No caption description entered.'}
										</p>
									</div>
								</div>
							</div>

							{/* Large CTA live link button */}
							<div className="w-full">
								{publishedModal.postUrl ? (
									<a
										href={publishedModal.postUrl}
										target={publishedModal.postUrl.startsWith('http') ? '_blank' : '_self'}
										rel="noopener noreferrer"
										className={`w-full py-3 px-4 font-extrabold text-xs text-white rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 ${
											transcodeProgress < 100
												? 'bg-slate-400 cursor-not-allowed opacity-75 shadow-none'
												: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10'
										}`}
										onClick={(e) => {
											if (transcodeProgress < 100) {
												e.preventDefault();
											}
										}}
									>
										<span>{transcodeProgress < 100 ? 'Processing Live Link...' : 'View Live Published Link'}</span>
										<ExternalLink className="w-4 h-4" />
									</a>
								) : (
									<button
										disabled
										className="w-full py-3 px-4 font-extrabold text-xs text-white bg-slate-400 rounded-xl flex items-center justify-center space-x-2 cursor-not-allowed"
									>
										<span>Preparing link...</span>
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
