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
		{ id: 'link', label: 'Link Post' },
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

		if (!topic.trim()) {
			const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
			setTopic(rawName);
		}
	};

	// Automation-First AI Generation & Customization State
	const [aiGenerationMode, setAiGenerationMode] = useState<{ mode: 'llm' | 'offline_fallback'; modelName?: string } | null>(null);
	const [aiTone, setAiTone] = useState<string>('Auto');
	const [aiGoal, setAiGoal] = useState<string>('Awareness');
	const [isCustomizeOpen, setIsCustomizeOpen] = useState<boolean>(false);
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
	const [photoAiStyle, setPhotoAiStyle] = useState<'Photo-realistic' | 'Illustration' | 'Graphic' | 'Minimal'>('Photo-realistic');
	const [photoAiPrompt, setPhotoAiPrompt] = useState<string>('');
	const [photoAiProviderBadge, setPhotoAiProviderBadge] = useState<string | null>(null);

	const triggerPhotoAiGeneration = async () => {
		const targetPrompt = photoAiPrompt.trim() || `High-resolution photo about ${topic} for ${brand?.companyName || 'brand'}`;
		setVariations((prev) => prev.map((v, i) => (i === activeVarIdx ? { ...v, isGeneratingImage: true } : v)));
		try {
			const res = await fetch('/api/generate-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: targetPrompt, style: photoAiStyle }),
			});
			const data = await res.json();
			if (data.imageUrl) {
				setVariations((prev) => prev.map((v, i) => (i === activeVarIdx ? { ...v, imageUrl: data.imageUrl, isGeneratingImage: false } : v)));
				if (data.provider) {
					setPhotoAiProviderBadge(data.provider);
				}
				showNotification(`AI Image generated via ${data.provider || 'AI Provider'}!`);
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

	// Sync photoAiPrompt when topic or style changes
	useEffect(() => {
		if (topic) {
			setPhotoAiPrompt(`High-resolution ${photoAiStyle} photo of ${topic} for ${brand?.companyName || 'brand'}`);
		}
	}, [topic, photoAiStyle, brand?.companyName]);

	const handlePhotoSelect = (file: File) => {
		setPhotoFileError(null);
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
	};
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

	const [isRefiningCaption, setIsRefiningCaption] = useState<string | null>(null);
	const [customInstructionInput, setCustomInstructionInput] = useState<string>('');
	const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(true);

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
		setPublishing({ index, platform });
		setPublishMenuOpen(null);
		try {
			let finalImageUrl: string | undefined = undefined;
			if (contentFormat === 'photo' || contentFormat === 'post') {
				finalImageUrl = photoImageSource === 'upload' ? (photoPreviewUrl || undefined) : (v.imageUrl || photoPreviewUrl || undefined);
			} else if (contentFormat === 'reel') {
				finalImageUrl = reelCoverUrl || undefined;
			} else if (contentFormat === 'carousel') {
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
					imageUrl: (contentFormat === 'reel' || contentFormat === 'link' || contentFormat === 'carousel' || contentFormat === 'video') ? undefined : finalImageUrl,
					linkUrl: contentFormat === 'link' ? facebookLinkUrl.trim() : undefined,
					carouselImages: contentFormat === 'carousel' ? carouselPhotos : undefined,
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
							<button 
								onClick={() => previewPaneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
								className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
							>
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
										className={`bg-white rounded-2xl p-6 flex flex-col transition-all relative overflow-hidden border border-slate-200 group ${connected ? 'shadow-md hover:shadow-lg hover:-translate-y-0.5' : 'shadow-sm hover:shadow-md hover:border-violet-200'}`}
									>
										{connected && (
											<div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: plat.accent }} />
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
													<button onClick={() => handleDisconnect(plat.id)} className="w-full bg-slate-50 text-slate-600 font-medium border border-slate-200 py-2 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-sm">Disconnect</button>
												) : (
													<button onClick={() => handleConnect(plat.id)} className="w-full bg-violet-600 text-white font-medium py-2 rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-500/20 text-sm">Connect</button>
												)}
											</div>
										</div>

										{/* Platform Specific Formats - Shown when connected */}
										{connected && (
											<div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 animate-fade-in">
												{PLATFORM_FORMATS[plat.id]?.map((format) => (
													<button
														key={format.id}
														onClick={() => {
															setPlatform(plat.id as any);
															setContentFormat(format.id);
															setStep('compose');
														}}
														className="text-xs font-bold py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all flex items-center justify-center space-x-1 text-slate-700 border border-slate-200 shadow-2xs active:scale-95"
													>
														<Plus className="w-3.5 h-3.5 text-slate-400" />
														<span>{format.label}</span>
													</button>
												))}
											</div>
										)}
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
						<div className="p-5 flex-1 overflow-y-auto space-y-3">
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

							{/* Facebook Content-Format Selector Tabs */}
							{platform === 'facebook' && (
								<div className="bg-white border border-slate-200 rounded-2xl p-2 flex items-center justify-between space-x-1.5 shadow-sm mb-4">
									{[
										{ id: 'text', label: 'Text', icon: AlignLeft, badge: null },
										{ id: 'photo', label: 'Photo', icon: ImageIcon, badge: null },
										{ id: 'reel', label: 'Reel', icon: Film, badge: null },
										{ id: 'link', label: 'Link', icon: ExternalLink, badge: null },
										{ id: 'carousel', label: 'Carousel', icon: Layers, badge: null },
										{ id: 'video', label: 'Video', icon: Video, badge: null },
									].map((fmt) => {
										const isActive = contentFormat === fmt.id || (fmt.id === 'photo' && contentFormat === 'post');
										const isCurrentlyGenerating = isGenerating && isActive;
										return (
											<button
												key={fmt.id}
												type="button"
												role="tab"
												aria-selected={isActive}
												onClick={() => {
													setContentFormat(fmt.id);
													if (['carousel', 'video'].includes(fmt.id)) {
														showNotification(`Facebook ${fmt.label} format preview is ready.`);
													}
												}}
												className={`flex-1 py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 border ${
													isActive
														? isCurrentlyGenerating
															? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white border-violet-500 shadow-md ring-2 ring-violet-400/50 animate-pulse'
															: 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
														: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
												}`}
											>
												{isCurrentlyGenerating ? (
													<RefreshCw className="w-3.5 h-3.5 animate-spin" />
												) : (
													<fmt.icon className="w-3.5 h-3.5" />
												)}
												<span className="capitalize">{fmt.label}</span>
												{isCurrentlyGenerating ? (
													<span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-white/20 text-white animate-pulse">
														Generating
													</span>
												) : fmt.badge ? (
													<span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
														{fmt.badge}
													</span>
												) : null}
											</button>
										);
									})}
								</div>
							)}

							{/* Facebook Photo Post Image Source Selector Panel */}
							{platform === 'facebook' && (contentFormat === 'photo' || contentFormat === 'post') && (
								<div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-sm animate-fade-in mb-4">
									<div className="flex items-center justify-between">
										<label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
											<ImageIcon className="w-4 h-4 text-blue-600" />
											<span>1. Select Photo Image Source</span>
										</label>
										<span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
											Facebook Photo Post
										</span>
									</div>

									{/* Source Choice Tabs (Equal 2 Options) */}
									<div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/70 rounded-xl">
										<button
											type="button"
											onClick={() => setPhotoImageSource('upload')}
											className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
												photoImageSource === 'upload'
													? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
													: 'text-slate-600 hover:text-slate-900'
											}`}
										>
											<UploadCloud className="w-4 h-4 text-blue-600" />
											<span>Upload photo</span>
										</button>
										<button
											type="button"
											onClick={() => setPhotoImageSource('ai')}
											className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
												photoImageSource === 'ai'
													? 'bg-white text-violet-700 shadow-sm border border-slate-200/80'
													: 'text-slate-600 hover:text-slate-900'
											}`}
										>
											<Sparkles className="w-4 h-4 text-violet-600" />
											<span>Generate with AI</span>
										</button>
									</div>

									{/* Option A: Upload Photo (Default) */}
									{photoImageSource === 'upload' && (
										<div className="space-y-2">
											{photoFileError && (
												<div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-xl flex items-center space-x-2">
													<AlertCircle className="w-4 h-4 text-red-500" />
													<span className="font-semibold">{photoFileError}</span>
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
														? 'border-blue-500 bg-blue-50/50'
														: photoPreviewUrl
														? 'border-emerald-300 bg-white'
														: 'border-slate-300 bg-white hover:bg-slate-50'
												}`}
											>
												<input
													type="file"
													ref={photoFileInputRef}
													accept="image/jpeg,image/png,image/webp"
													className="hidden"
													onChange={(e) => e.target.files?.[0] && handlePhotoSelect(e.target.files[0])}
												/>

												{photoPreviewUrl ? (
													<div className="w-full space-y-2">
														<img src={photoPreviewUrl} alt="Uploaded Photo" className="w-full max-h-[220px] rounded-lg object-contain bg-slate-900 shadow-sm" />
														<div className="flex items-center justify-between px-1">
															<span className="text-xs font-bold text-slate-700 truncate max-w-[240px]">{photoFile?.name || 'Uploaded Photo'}</span>
															<button
																type="button"
																onClick={(e) => {
																	e.stopPropagation();
																	setPhotoFile(null);
																	setPhotoPreviewUrl(null);
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
														<UploadCloud className="w-8 h-8 text-blue-500 mx-auto" />
														<p className="text-xs font-bold text-slate-700">Drag & drop your photo or <span className="text-blue-600 underline">browse</span></p>
														<p className="text-[10px] text-slate-400">Supports JPG, PNG up to 10MB</p>
													</div>
												)}
											</div>
										</div>
									)}

									{/* Option B: Generate with AI */}
									{photoImageSource === 'ai' && (
										<div className="space-y-3.5 pt-1">
											{/* Style Selector Pills */}
											<div>
												<label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
													Image Style
												</label>
												<div className="grid grid-cols-4 gap-1.5">
													{[
														{ id: 'Photo-realistic', label: '📸 Realistic' },
														{ id: 'Illustration', label: '🎨 Art' },
														{ id: 'Graphic', label: '💻 Graphic' },
														{ id: 'Minimal', label: '✏️ Minimal' },
													].map((st) => (
														<button
															key={st.id}
															type="button"
															onClick={() => setPhotoAiStyle(st.id as any)}
															className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
																photoAiStyle === st.id
																	? 'bg-violet-600 text-white border-violet-600 shadow-xs'
																	: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
															}`}
														>
															{st.label}
														</button>
													))}
												</div>
											</div>

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
													placeholder={topic ? `High-res ${photoAiStyle} photo of ${topic} for ${brand?.companyName || 'brand'}` : `Enter custom photo generation prompt...`}
													className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl p-2.5 shadow-2xs focus:border-violet-500 focus:outline-none resize-none"
												/>
											</div>

											{/* Active Provider Badge */}
											{photoAiProviderBadge && (
												<div className="flex items-center justify-between text-xs px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-xl text-violet-800 font-medium">
													<span className="flex items-center space-x-1.5">
														<Sparkles className="w-3.5 h-3.5 text-violet-600" />
														<span>Provider: <strong>{photoAiProviderBadge}</strong></span>
													</span>
													<span className="text-[10px] text-violet-600 uppercase font-bold">Active</span>
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
																className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
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
													className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
												>
													<Sparkles className={`w-4 h-4 ${activeVar.isGeneratingImage ? 'animate-spin' : ''}`} />
													<span>{activeVar.isGeneratingImage ? 'Generating AI Photo...' : 'Generate Photo with AI'}</span>
												</button>
											)}
										</div>
									)}
								</div>
							)}

							{/* Facebook Link Format Destination URL Input */}
							{platform === 'facebook' && contentFormat === 'link' && (
								<div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm animate-fade-in mb-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2">
											<Globe className="w-4 h-4 text-[#1877F2]" />
											<span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
												Destination Link URL
											</span>
										</div>
										<span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1877F2] border border-blue-200/60">
											Link Card Preview
										</span>
									</div>
									<input
										type="url"
										value={facebookLinkUrl}
										onChange={(e) => setFacebookLinkUrl(e.target.value)}
										placeholder="https://shrameco.com/automation"
										className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#1877F2] shadow-2xs font-medium"
									/>
									<p className="text-[11px] text-slate-500 font-medium">
										Facebook automatically fetches the link card title, thumbnail image, and domain from this destination URL.
									</p>
								</div>
							)}

							{/* Facebook Carousel Multi-Image Uploader Panel */}
							{platform === 'facebook' && contentFormat === 'carousel' && (
								<div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm animate-fade-in mb-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2">
											<Layers className="w-5 h-5 text-blue-600" />
											<div>
												<h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
													Carousel Photos (2 to 10 Images)
												</h3>
												<p className="text-[11px] text-slate-500 font-medium">
													Users swipe through photos in order.
												</p>
											</div>
										</div>
										<span className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
											carouselPhotos.length >= 2
												? 'bg-emerald-50 text-emerald-700 border-emerald-200'
												: 'bg-amber-50 text-amber-800 border-amber-200'
										}`}>
											{carouselPhotos.length} / 10 Photos
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
															carouselDragIdx === idx ? 'opacity-40 scale-95 ring-2 ring-blue-500' : 'border-slate-200'
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
												isDragOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 bg-slate-50/60 hover:bg-blue-50/20'
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
											<UploadCloud className="w-7 h-7 text-blue-600 mb-1.5" />
											<p className="text-xs font-bold text-slate-700">
												{carouselPhotos.length === 0
													? 'Drag & drop 2 to 10 photos or browse'
													: 'Add more photos to carousel'}
											</p>
											<p className="text-[10px] text-slate-400">Supports JPG, PNG up to 10MB each</p>
										</div>
									)}
								</div>
							)}

							{/* Facebook Standard Video Uploader Panel */}
							{platform === 'facebook' && contentFormat === 'video' && (
								<div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm animate-fade-in mb-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2">
											<Video className="w-5 h-5 text-blue-600" />
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
													<Film className="w-4 h-4 text-blue-600" />
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
												isDragOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 bg-slate-50/60 hover:bg-blue-50/20'
											}`}
										>
											<input
												type="file"
												ref={standardVideoInputRef}
												accept="video/mp4,video/quicktime,video/webm"
												className="hidden"
												onChange={(e) => e.target.files?.[0] && handleStandardVideoSelect(e.target.files[0])}
											/>
											<UploadCloud className="w-8 h-8 text-blue-600 mb-2" />
											<p className="text-xs font-bold text-slate-700">Drag & drop your video file or click to browse</p>
											<p className="text-[11px] text-slate-400">Supports MP4, MOV, WEBM up to 500MB</p>
										</div>
									)}
								</div>
							)}

							{/* Facebook Reel Video Upload & Validation Panel */}
							{platform === 'facebook' && contentFormat === 'reel' && (
								<div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm animate-fade-in mb-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2">
											<Film className="w-4 h-4 text-violet-600" />
											<span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
												1. Facebook Reel Video
											</span>
										</div>
										<span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200/60">
											MP4 • 9:16 • 3–90s
										</span>
									</div>

									{/* Inline Error Message Badge */}
									{reelVideoError && (
										<div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start space-x-2 animate-fade-in" role="alert">
											<AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
											<span className="font-semibold">{reelVideoError}</span>
										</div>
									)}

									{/* Drag & Drop Video Dropzone */}
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
												handleVideoSelect(e.dataTransfer.files[0]);
											}
										}}
										onClick={() => videoFileInputRef.current?.click()}
										tabIndex={0}
										role="button"
										aria-label="Upload Facebook Reel Video"
										onKeyDown={(e) => e.key === 'Enter' && videoFileInputRef.current?.click()}
										className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
											isDragOver
												? 'border-violet-500 bg-violet-50/50'
												: reelVideoUrl
												? 'border-emerald-300 bg-white'
												: 'border-slate-200 bg-slate-50/60 hover:bg-violet-50/20 hover:border-violet-400'
										}`}
									>
										<input
											type="file"
											ref={videoFileInputRef}
											accept="video/mp4"
											className="hidden"
											onChange={(e) => e.target.files?.[0] && handleVideoSelect(e.target.files[0])}
										/>

										{reelVideoUrl ? (
											<div className="w-full space-y-3">
												<video src={reelVideoUrl} controls className="w-full max-h-[220px] rounded-xl object-contain bg-black shadow-md" />
												<div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
													{reelVideoMeta ? (
														<span>{reelVideoMeta.duration.toFixed(1)}s • {reelVideoMeta.width}x{reelVideoMeta.height}</span>
													) : <span />}
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															setReelVideoFile(null);
															setReelVideoUrl(null);
															setReelVideoMeta(null);
															setReelCoverUrl(null);
														}}
														className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
													>
														<CloseIcon className="w-3.5 h-3.5" />
														<span>Remove Video</span>
													</button>
												</div>
											</div>
										) : (
											<div className="space-y-2">
												<div className="w-10 h-10 rounded-full bg-violet-100/70 flex items-center justify-center mx-auto mb-1">
													<UploadCloud className="w-5 h-5 text-violet-600" />
												</div>
												<p className="text-xs font-bold text-slate-700">Drag & drop your Reel video or <span className="text-violet-600 underline">browse</span></p>
												<p className="text-[11px] text-slate-400">Requires MP4 format, 9:16 aspect ratio (3 to 90 seconds)</p>
											</div>
										)}
									</div>

									{/* Cover Image Selector */}
									{reelVideoUrl && (
										<div className="pt-2 border-t border-slate-200 flex items-center justify-between">
											<div className="flex items-center space-x-3">
												{reelCoverUrl ? (
													<img src={reelCoverUrl} alt="Cover Preview" className="w-12 h-16 rounded-lg object-cover border border-slate-200 shadow-sm" />
												) : (
													<div className="w-12 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-500 font-bold">Cover</div>
												)}
												<div>
													<p className="text-xs font-bold text-slate-800">Reel Cover Image</p>
													<p className="text-[11px] text-slate-500">First frame extracted automatically</p>
												</div>
											</div>
											<button
												type="button"
												onClick={() => coverFileInputRef.current?.click()}
												className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-xs"
											>
												Change Cover
											</button>
											<input
												type="file"
												ref={coverFileInputRef}
												accept="image/*"
												className="hidden"
												onChange={(e) => {
													const file = e.target.files?.[0];
													if (file) {
														const reader = new FileReader();
														reader.onload = () => setReelCoverUrl(reader.result as string);
														reader.readAsDataURL(file);
													}
												}}
											/>
										</div>
									)}

									{/* Optional Video Visual Context Input */}
									<div className="pt-2 border-t border-slate-200">
										<label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
											<span>What's happening in this clip?</span>
											<span className="text-[10px] text-slate-400 font-normal">Optional</span>
										</label>
										<input
											type="text"
											value={reelVideoDescription}
											onChange={(e) => setReelVideoDescription(e.target.value)}
											placeholder="e.g., Sunset stroll on water villa deck with tropical drinks..."
											className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl p-2.5 shadow-2xs focus:border-violet-500 focus:outline-none font-medium"
										/>
									</div>
								</div>
							)}

							{/* AI Generation Section — Compact Inline */}
							<div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-sm">
								{/* Topic Input Row */}
								<div className="flex items-center space-x-2">
									<div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white shadow-xs flex-shrink-0">
										<Sparkles className="w-3.5 h-3.5" />
									</div>
									<Input 
										value={topic} 
										onChange={(e) => setTopic(e.target.value)} 
										placeholder={`What is this ${capitalizedFormat} about?`}
										className="flex-1 bg-white border-slate-200 text-slate-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-medium text-xs py-2"
									/>
									<Button 
										onClick={handleGenerateCampaign}
										disabled={isGenerating || !topic.trim()}
										className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-extrabold border-none px-4 py-2 rounded-lg transition-all shadow-md shadow-indigo-500/20 flex items-center space-x-1.5 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex-shrink-0 text-xs"
									>
										{isGenerating ? (
											<RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
										) : (
											<Sparkles className="w-3.5 h-3.5 text-violet-200" />
										)}
										<span>{isGenerating ? 'Generating...' : 'Generate'}</span>
									</Button>
								</div>

								{/* Inline Tone + Goal selects */}
								{contentFormat !== 'link' && (
									<div className="flex items-center space-x-2">
										<select
											value={aiTone}
											onChange={(e) => setAiTone(e.target.value)}
											className="flex-1 bg-white border border-slate-200 text-slate-700 text-[11px] rounded-lg px-2.5 py-1.5 shadow-2xs focus:border-violet-500 focus:outline-none font-semibold"
										>
											<option value="Auto">Tone: Auto</option>
											<option value="Professional">Tone: Professional</option>
											<option value="Casual">Tone: Casual</option>
											<option value="Playful">Tone: Playful</option>
											<option value="Inspirational">Tone: Inspirational</option>
											<option value="Bold">Tone: Bold</option>
										</select>
										<select
											value={aiGoal}
											onChange={(e) => setAiGoal(e.target.value)}
											className="flex-1 bg-white border border-slate-200 text-slate-700 text-[11px] rounded-lg px-2.5 py-1.5 shadow-2xs focus:border-violet-500 focus:outline-none font-semibold"
										>
											<option value="Awareness">Goal: Awareness</option>
											<option value="Drive traffic">Goal: Drive traffic</option>
											<option value="Get follows">Goal: Get follows</option>
											<option value="Promote an offer">Goal: Promote offer</option>
										</select>
									</div>
								)}
							</div>

							{/* Generated Content Review & Editor Box */}
							<div className={`bg-white border rounded-2xl flex flex-col flex-1 transition-all shadow-sm relative overflow-hidden ${
								isGenerating ? 'border-violet-400 ring-2 ring-violet-500/20 shadow-violet-500/10' : 'border-slate-200 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/10'
							}`}>
								{/* ⚡ Sleek Integrated AI Assistant Refinement Toolbar Header */}
								{platform === 'facebook' && (
									<div className="bg-gradient-to-r from-violet-50/90 via-indigo-50/60 to-slate-50/90 border-b border-slate-200/80 px-3 py-2 flex flex-wrap items-center justify-between gap-1.5 z-10">
										<div className="flex items-center space-x-1.5">
											<div className="w-5 h-5 rounded-md bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-2xs">
												<Sparkles className="w-3 h-3" />
											</div>
											<span className="text-[11px] font-extrabold text-violet-950 uppercase tracking-wider">AI Assistant</span>
											
											{/* Persona Selector Dropdown */}
											<select
												disabled={!activeVar.caption?.trim() || isRefiningCaption !== null}
												onChange={(e) => {
													if (e.target.value) {
														handleRefineCaption(e.target.value);
														e.target.value = '';
													}
												}}
												className="bg-white border border-violet-200/90 text-slate-800 text-[11px] font-bold rounded-lg px-2 py-1 shadow-2xs focus:border-violet-500 focus:outline-none cursor-pointer disabled:opacity-50"
											>
												<option value="">🎭 Persona Rewrite... ▼</option>
												<option value="voice_professional">💼 Professional Voice</option>
												<option value="voice_casual">☕ Casual & Friendly</option>
												<option value="voice_founder">🚀 Founder Perspective</option>
												<option value="voice_viral">🔥 Viral Hook Style</option>
												<option value="voice_minimal">✨ Clean & Minimal</option>
											</select>
										</div>

										{/* Quick Fix Pill Buttons */}
										<div className="flex items-center space-x-1">
											{[
												{ id: 'add_hashtags', label: '+Hashtags', icon: '🏷️' },
												{ id: 'make_engaging', label: 'Engage', icon: '⚡' },
												{ id: 'shorten', label: 'Shorten', icon: '✂️' },
												{ id: 'expand', label: 'Expand', icon: '↔️' },
												{ id: 'generate_hook', label: 'Hook', icon: '🪝' },
												{ id: 'generate_cta', label: 'CTA', icon: '📢' },
											].map((fix) => (
												<button
													key={fix.id}
													type="button"
													disabled={!activeVar.caption?.trim() || isRefiningCaption !== null}
													onClick={() => handleRefineCaption(fix.id)}
													className="px-2 py-1 rounded-md text-[10px] font-bold bg-white hover:bg-violet-50 text-slate-700 hover:text-violet-700 border border-slate-200/90 hover:border-violet-200 shadow-2xs transition-all flex items-center space-x-1 active:scale-95 disabled:opacity-50 cursor-pointer"
													title={fix.label}
												>
													{isRefiningCaption === fix.id ? (
														<RefreshCw className="w-2.5 h-2.5 animate-spin text-violet-600" />
													) : (
														<span>{fix.icon}</span>
													)}
													<span>{fix.label}</span>
												</button>
											))}

											{/* Custom Prompt Toggle */}
											<button
												type="button"
												onClick={() => setIsCustomPromptOpen(!isCustomPromptOpen)}
												className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all border shadow-2xs flex items-center space-x-1 cursor-pointer ${
													isCustomPromptOpen ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-violet-700 border-violet-200 hover:bg-violet-50'
												}`}
												title="Custom prompt instruction"
											>
												<span>✏️ Custom</span>
											</button>

											{/* Revert / Undo Button */}
											{activeVar.history && activeVar.history.length > 0 && (
												<button
													type="button"
													onClick={() => handleUndoCaption(activeVarIdx)}
													className="px-2 py-1 rounded-md text-[10px] font-extrabold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs transition-all flex items-center space-x-1 active:scale-95 cursor-pointer animate-fade-in"
													title={`Revert to previous caption (${activeVar.history.length} versions in history)`}
												>
													<span>↩️ Revert</span>
													<span className="text-[9px] font-bold bg-amber-200/80 px-1 rounded-full text-amber-950">
														{activeVar.history.length}
													</span>
												</button>
											)}
										</div>
									</div>
								)}

								{/* Expandable Custom Instruction Input Row */}
								{platform === 'facebook' && isCustomPromptOpen && (
									<div className="bg-violet-50/80 border-b border-violet-100 px-3 py-2 flex items-center space-x-2 animate-fade-in">
										<input
											type="text"
											value={customInstructionInput}
											onChange={(e) => setCustomInstructionInput(e.target.value)}
											placeholder="Enter custom prompt instruction (e.g. make it sound confident & bold)..."
											className="flex-1 bg-white border border-violet-200 text-slate-900 text-xs rounded-lg px-2.5 py-1 focus:border-violet-500 focus:outline-none font-medium shadow-2xs"
										/>
										<button
											type="button"
											disabled={!activeVar.caption?.trim() || !customInstructionInput.trim() || isRefiningCaption !== null}
											onClick={() => {
												handleRefineCaption('custom', customInstructionInput);
												setIsCustomPromptOpen(false);
											}}
											className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-extrabold transition-all shadow-2xs disabled:opacity-50 cursor-pointer flex items-center space-x-1 active:scale-95"
										>
											{isRefiningCaption === 'custom' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>Apply</span>}
										</button>
									</div>
								)}

								<div className="p-4 flex flex-col flex-1">
									{/* Variation Switcher Tabs */}
									{contentFormat !== 'link' && (
										<div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200/80">
											<div className="flex items-center space-x-2">
												<span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">AI Variations:</span>
												{isGenerating ? (
													<span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full flex items-center space-x-1 animate-pulse">
														<Sparkles className="w-3 h-3 animate-spin" />
														<span>Crafting 3 options...</span>
													</span>
												) : aiGenerationMode ? (
													aiGenerationMode.mode === 'llm' ? (
														<span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs">
															<span>✨ Live AI</span>
															{aiGenerationMode.modelName && (
																<span className="text-[9px] font-semibold opacity-75">({aiGenerationMode.modelName})</span>
															)}
														</span>
													) : (
														<span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs">
															<span>⚡ Offline Demo Mode</span>
															<span className="text-[9px] font-normal text-amber-700">(Add OPENROUTER_API_KEY for Live LLM)</span>
														</span>
													)
												) : null}
											</div>
											<div className="flex items-center space-x-1.5">
												{activeVar.history && activeVar.history.length > 0 && (
													<button
														type="button"
														onClick={() => handleUndoCaption(activeVarIdx)}
														className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs transition-all flex items-center space-x-1 active:scale-95 cursor-pointer"
														title={`Revert to previous text (${activeVar.history.length} in history)`}
													>
														<span>↩️ Revert</span>
													</button>
												)}
												{variations.map((v, i) => (
													<button
														key={i}
														type="button"
														disabled={isGenerating}
														onClick={() => setActiveVarIdx(i)}
														className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
															activeVarIdx === i
																? 'bg-violet-600 text-white border-violet-600 shadow-sm scale-105'
																: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
														} ${isGenerating ? 'opacity-70 cursor-wait' : ''}`}
													>
														{isGenerating ? `Option ${i + 1} ✨` : `Option ${i + 1}`}
													</button>
												))}
											</div>
										</div>
									)}

									{isGenerating ? (
										<div className="flex-1 min-h-[120px] py-2 space-y-2.5 animate-pulse">
											<div className="h-4 bg-slate-200 rounded-md w-11/12"></div>
											<div className="h-4 bg-slate-200 rounded-md w-4/5"></div>
											<div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
											<div className="h-4 bg-slate-200 rounded-md w-1/2"></div>
										</div>
									) : (
										<textarea 
											className="bg-transparent border-none outline-none resize-none flex-1 text-slate-900 placeholder-slate-400 mb-4 w-full min-h-[100px]"
											placeholder={contentFormat === 'link' ? "Write a caption for your link..." : `Start writing your ${capitalizedFormat} or get inspired with Templates`}
											value={activeVar.caption}
											maxLength={platformMaxCaption[platform] || 2200}
											onChange={(e) => {
												const newCaption = e.target.value;
												setVariations(prev => prev.map((v, i) => i === activeVarIdx ? { ...v, caption: newCaption } : v));
											}}
										/>
									)}
									
									{!(platform === 'facebook' && ['text', 'photo', 'reel', 'video', 'link', 'carousel'].includes(contentFormat)) && (
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
									)}
									
									{/* Optional Link Attachment Bar (For non-link formats) */}
									{contentFormat !== 'link' && (
										<div className="flex items-center space-x-2 pt-2.5 border-t border-slate-200/80 mt-2">
											<div className="flex items-center space-x-1 text-slate-400 flex-shrink-0">
												<ExternalLink className="w-3.5 h-3.5 text-blue-600" />
												<span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Link:</span>
											</div>
											<input
												type="url"
												value={attachLinkInput}
												onChange={(e) => setAttachLinkInput(e.target.value)}
												placeholder="Attach URL (e.g. https://shrameco.com)..."
												className="flex-1 bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-2.5 py-1 focus:border-blue-500 focus:outline-none font-medium shadow-2xs"
											/>
											<button
												type="button"
												disabled={!attachLinkInput.trim()}
												onClick={() => {
													if (!attachLinkInput.trim()) return;
													const formattedUrl = attachLinkInput.trim().startsWith('http') ? attachLinkInput.trim() : `https://${attachLinkInput.trim()}`;
													if (!activeVar.caption.includes(formattedUrl)) {
														const newCaption = activeVar.caption ? `${activeVar.caption}\n\n👉 Learn more: ${formattedUrl}` : formattedUrl;
														setVariations((prev) => prev.map((v, i) => (i === activeVarIdx ? { ...v, caption: newCaption } : v)));
														setAttachLinkInput('');
														showNotification('Link appended to caption!');
													} else {
														showNotification('Link is already in caption.');
													}
												}}
												className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-extrabold transition-all shadow-2xs disabled:opacity-40 cursor-pointer flex-shrink-0 active:scale-95 flex items-center space-x-1"
											>
												<span>+ Add to Caption</span>
											</button>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Bottom Actions */}
						{(() => {
							const publishDisabledReason = (() => {
								if (!activeVar.caption?.trim()) return 'Enter message text to publish';
								if (activeVar.caption?.length > (platformMaxCaption[platform] || 2200)) return `Exceeds ${(platformMaxCaption[platform] || 2200).toLocaleString()} character limit`;
								if (platform === 'facebook' && (contentFormat === 'photo' || contentFormat === 'post') && !photoPreviewUrl && !activeVar.imageUrl) return 'Photo post requires an image';
								if (platform === 'facebook' && contentFormat === 'link' && !facebookLinkUrl.trim()) return 'Enter destination link URL to publish';
								if (platform === 'facebook' && contentFormat === 'carousel' && carouselPhotos.length < 2) return `Carousel post requires at least 2 photos (current: ${carouselPhotos.length}/10)`;
								if (platform === 'facebook' && contentFormat === 'video' && !standardVideoUrl) return 'Standard Video post requires a video file';
								return null;
							})();

							return (
								<div className="p-4 border-t border-slate-200 flex flex-col space-y-1.5 bg-slate-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<label className="flex items-center space-x-2 text-sm text-slate-500 cursor-pointer hover:text-slate-900 transition-colors">
												<input type="checkbox" className="rounded border-slate-300 bg-white text-emerald-500 focus:ring-emerald-500/20" />
												<span className="font-medium">Create Another</span>
											</label>
											<button 
												type="button"
												onClick={() => handleSaveForVariation(activeVarIdx, 'draft')}
												disabled={isSaving}
												className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
											>
												{isSaving ? 'Saving Draft...' : 'Save Draft'}
											</button>
										</div>

										<div className="flex items-center space-x-3">
											<div className="flex items-center">
												<button className="flex items-center space-x-1.5 px-4 py-2 border border-slate-200 rounded-l-lg bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm z-10">
													<CalendarDays className="w-4 h-4" />
													<span>Next Available</span>
												</button>
												<button 
													onClick={() => handlePublish(activeVarIdx, platform)}
													disabled={Boolean(publishDisabledReason) || publishing?.index === activeVarIdx}
													title={publishDisabledReason || `Schedule ${PLATFORM_META[platform]?.label} ${capitalizedFormat}`}
													className={`px-6 py-2 text-white text-sm font-bold rounded-r-lg transition-all shadow-sm -ml-[1px] relative z-20 ${
														publishDisabledReason || publishing?.index === activeVarIdx
															? 'opacity-50 cursor-not-allowed'
															: 'hover:opacity-90 active:scale-95'
													}`}
													style={{ backgroundColor: PLATFORM_META[platform]?.accent || '#0f172a' }}
												>
													{publishing?.index === activeVarIdx ? 'Publishing...' : `Schedule ${PLATFORM_META[platform]?.label} ${capitalizedFormat}`}
												</button>
											</div>
										</div>
									</div>

									{publishDisabledReason && (
										<div className="flex items-center justify-end text-[11px] font-semibold text-amber-700 space-x-1">
											<span>⚠️ {publishDisabledReason}</span>
										</div>
									)}
								</div>
							);
						})()}
					</div>

					{/* Right Panel: Live Preview */}
					<div ref={previewPaneRef} className="flex-1 bg-slate-100/50 p-8 flex flex-col items-center justify-center relative overflow-y-auto scroll-mt-6">
						<div className="absolute top-6 left-6 text-sm font-bold text-slate-600 flex items-center space-x-2.5">
							<span className="font-extrabold text-slate-900">Live Preview</span>
							<span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
								{PLATFORM_META[platform]?.label || 'Facebook'} {capitalizedFormat}
							</span>
							<span className="text-[11px] font-medium text-slate-400 hidden sm:flex items-center space-x-1">
								<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
								<span>Updates in real-time</span>
							</span>
						</div>

						{/* Facebook Desktop / Mobile View Mode Toggle */}
						{platform === 'facebook' && (
							<div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-xl border border-slate-300/80 shadow-2xs mb-4 z-20">
								<button
									type="button"
									onClick={() => setFbPreviewMode('desktop')}
									aria-label="Desktop Preview Mode"
									aria-pressed={fbPreviewMode === 'desktop'}
									className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
										fbPreviewMode === 'desktop'
											? 'bg-white text-slate-900 shadow-sm border border-slate-200'
											: 'text-slate-600 hover:text-slate-900'
									}`}
								>
									<Monitor className="w-3.5 h-3.5" />
									<span>Desktop</span>
								</button>
								<button
									type="button"
									onClick={() => setFbPreviewMode('mobile')}
									aria-label="Mobile Preview Mode"
									aria-pressed={fbPreviewMode === 'mobile'}
									className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
										fbPreviewMode === 'mobile'
											? 'bg-white text-slate-900 shadow-sm border border-slate-200'
											: 'text-slate-600 hover:text-slate-900'
									}`}
								>
									<Smartphone className="w-3.5 h-3.5" />
									<span>Mobile</span>
								</button>
							</div>
						)}

						<div className={`w-full transition-all duration-300 flex justify-center ${
							platform === 'facebook' && fbPreviewMode === 'mobile' ? 'max-w-[360px]' : 'max-w-[500px]'
						} scale-[0.95] origin-center hover:scale-[1.02]`}>
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
											<div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
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
							) : platform === 'facebook' && contentFormat === 'link' ? (
								<FacebookLinkCardPreview
									companyName={brand?.companyName || 'aravalli travels'}
									captionText={activeVar.caption}
									destinationUrl={facebookLinkUrl}
									ogData={linkOgData}
									isLoadingOg={isLoadingOgData}
								/>
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
							<h3 className="text-xl font-bold text-slate-900 mb-1">
								{publishedModal.mode === 'demo' ? 'Published (Demo Mode)' : 'Successfully Published!'}
							</h3>
							<p className="text-sm text-slate-500 mb-6">
								Your {contentFormat} has been published to <span className="font-semibold text-slate-800 capitalize">{publishedModal.platform}</span> ({publishedModal.accountName}).
							</p>
							<div className="w-full space-y-2">
								{publishedModal.postUrl && (
									<a
										href={publishedModal.postUrl}
										target={publishedModal.postUrl.startsWith('http') ? '_blank' : '_self'}
										rel="noopener noreferrer"
										className="w-full py-3 px-4 font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-sm"
									>
										<span>View Published Post / Preview</span>
										<ExternalLink className="w-4 h-4" />
									</a>
								)}
								<button
									onClick={() => setPublishedModal(null)}
									className="w-full py-2.5 font-bold text-sm text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
								>
									Close
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
