'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
	Linkedin,
	Upload,
	CheckCircle,
	AlertTriangle,
	Sparkles,
	RefreshCw,
	ExternalLink,
	BarChart3,
	Image as ImageIcon,
	Video,
	BookOpen,
	Plus,
	X,
	Check,
	Clock,
	AlertCircle,
	Download,
	Wand2,
	Play,
	Zap,
	Trash2,
	Layers,
	Eye,
	Globe,
	Lock,
	ShieldCheck,
	FileVideo,
	Star,
	ChevronLeft,
	ChevronRight,
	FileText,
	Send,
	MessageSquare,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface LinkedInAccount {
	accountId: string;
	accountName: string;
	connected: boolean;
}

interface PublishHistoryItem {
	id: string;
	caption: string;
	format: string;
	status: string;
	scheduledAt?: string;
	url?: string;
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
	useEffect(() => {
		const t = setTimeout(onClose, 5000);
		return () => clearTimeout(t);
	}, [onClose]);

	const isError = message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') || message.toLowerCase().includes('unable') || message.toLowerCase().includes('denied');
	return (
		<div className={`fixed bottom-5 right-5 z-[99999] flex items-center space-x-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold border animate-slide-up backdrop-blur-xl ${
			isError
				? 'bg-red-50 text-red-700 border-red-200 shadow-red-100'
				: 'bg-white text-slate-800 border-slate-200 shadow-slate-100'
		}`}>
			{isError ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" /> : <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
			<span>{message}</span>
			<button onClick={onClose} className="ml-2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
		</div>
	);
}

const getPublishOptionLabel = (option: string) => {
	switch (option) {
		case 'prioritize': return 'Prioritize';
		case 'next_available': return 'Next Available';
		case 'now': return 'Publish Now';
		default: return 'Custom';
	}
};

export default function LinkedInStudioPage() {
	const router = useRouter();
	const [connectedAccount, setConnectedAccount] = useState<LinkedInAccount | null>(null);
	const [isConnecting, setIsConnecting] = useState(false);
	const [notification, setNotification] = useState<string | null>(null);
	const [isLoadingHistory, setIsLoadingHistory] = useState(true);
	const [isLoadingAccount, setIsLoadingAccount] = useState(true);

	// Media format (POST = standard image/text, CAROUSEL = PDF slides, VIDEO = native video, ARTICLE = shared link article)
	const [mediaType, setMediaType] = useState<'POST' | 'CAROUSEL' | 'VIDEO' | 'ARTICLE'>('POST');

	// Media Input Modes: 'upload' (Direct computer upload) | 'ai' (AI generated)
	const [uploadMode, setUploadMode] = useState<'upload' | 'ai'>('upload');

	// Caption & hashtags
	const [caption, setCaption] = useState('');
	const [hashtags, setHashtags] = useState<string[]>(['professional', 'linkedintips', 'networking']);
	const [hashtagInput, setHashtagInput] = useState('');

	// Article fields
	const [articleLink, setArticleLink] = useState('');
	const [articleTitle, setArticleTitle] = useState('');
	const [articleDesc, setArticleDesc] = useState('');
	const [articleThumbnailUrl, setArticleThumbnailUrl] = useState('');

	// Toggle to include Brand Profile guidelines in AI Generation
	const [includeBrandProfile, setIncludeBrandProfile] = useState(true);

	// Desktop Notification Permission
	const [notifyOnComplete, setNotifyOnComplete] = useState(false);
	const notifyRef = useRef(notifyOnComplete);
	useEffect(() => {
		notifyRef.current = notifyOnComplete;
	}, [notifyOnComplete]);

	// Publishing & progress states
	const [isPublishing, setIsPublishing] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [publishedPostUrl, setPublishedPostUrl] = useState<string | null>(null);

	// AI generation states
	const [aiPrompt, setAiPrompt] = useState('');
	const [isBoosting, setIsBoosting] = useState(false);
	const [isGeneratingImage, setIsGeneratingImage] = useState(false);
	const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
	const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
	const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

	// Manual/uploaded file states
	const [uploadedImages, setUploadedImages] = useState<{ url: string; name: string }[]>([]);
	const [uploadedVideo, setUploadedVideo] = useState<{ url: string; name: string } | null>(null);
	const [uploadedPdf, setUploadedPdf] = useState<{ url: string; name: string } | null>(null);
	const [manualMediaUrl, setManualMediaUrl] = useState('');

	// Carousel Slide states for AI carousel generation
	const [carouselSlides, setCarouselSlides] = useState<{ imageUrl: string }[]>([]);
	const [isGeneratingCarousel, setIsGeneratingCarousel] = useState(false);

	// Scheduling Option States
	const [schedOption, setSchedOption] = useState<'next_available' | 'prioritize' | 'now' | 'custom'>('now');
	const [customSchedDate, setCustomSchedDate] = useState<string>(() => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(9, 0, 0, 0);
		return tomorrow.toISOString();
	});
	const [isSchedMenuOpen, setIsSchedMenuOpen] = useState(false);
	const schedMenuRef = useRef<HTMLDivElement>(null);
	const [schedMenuSubView, setSchedMenuSubView] = useState<'options' | 'calendar'>('options');
	
	// Calendar helpers
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

	// History State
	const [history, setHistory] = useState<PublishHistoryItem[]>([]);
	const [isRefreshingHistory, setIsRefreshingHistory] = useState(false);

	// Carousel Slide Indicator Dot Index
	const [activeSlideIdx, setActiveSlideIdx] = useState(0);

	const showToast = (msg: string) => setNotification(msg);

	// Close sched menu on click outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (schedMenuRef.current && !schedMenuRef.current.contains(event.target as Node)) {
				setIsSchedMenuOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Sync subview when closing
	useEffect(() => {
		if (!isSchedMenuOpen) setSchedMenuSubView('options');
	}, [isSchedMenuOpen]);

	// Load account and history
	useEffect(() => {
		async function fetchAccount() {
			try {
				const res = await fetch('/api/social/accounts');
				if (res.ok) {
					const data = await res.json();
					const li = (data.accounts || []).find((a: any) => a.platform === 'linkedin' && a.connected);
					if (li) setConnectedAccount({ accountId: li.accountId, accountName: li.accountName, connected: true });
				}
			} catch {} finally {
				setIsLoadingAccount(false);
			}
		}
		async function fetchHistory() {
			try {
				const res = await fetch('/api/social/schedule');
				if (res.ok) {
					const data = await res.json();
					const liHistory = (data.posts || []).filter((p: any) => p.platform === 'linkedin');
					setHistory(liHistory.map((p: any) => ({
						id: p._id,
						caption: p.caption,
						format: p.format === 'carousel' ? 'Carousel' : p.format === 'video' ? 'Video' : p.format === 'article' ? 'Article' : 'Post',
						status: p.status,
						scheduledAt: p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined,
						url: p.postUrl || undefined
					})));
				}
			} catch {} finally {
				setIsLoadingHistory(false);
			}
		}
		fetchAccount();
		fetchHistory();
	}, []);

	// Notification Permission Toggle
	const handleNotifyToggle = async (checked: boolean) => {
		setNotifyOnComplete(checked);
		if (checked && 'Notification' in window) {
			const permission = await Notification.requestPermission();
			if (permission !== 'granted') {
				setNotifyOnComplete(false);
				showToast('Desktop notification permission denied.');
			} else {
				showToast('You will be notified once the LinkedIn post goes live!');
			}
		}
	};

	// Connect / Disconnect
	const handleConnect = async () => {
		setIsConnecting(true);
		try {
			const res = await fetch('/api/social/connect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ platform: 'linkedin', returnTo: '/dashboard/linkedin' }),
			});
			const data = await res.json();
			if (data.url) {
				const popup = window.open(data.url, 'linkedin_oauth', 'width=600,height=700,left=200,top=100,resizable=yes,scrollbars=yes');
				if (!popup) { window.location.href = data.url; return; }
				const handler = (event: MessageEvent) => {
					if (event.data?.type === 'oauth-complete') { window.removeEventListener('message', handler); popup?.close(); window.location.reload(); }
				};
				window.addEventListener('message', handler);
			} else if (data.demo) {
				setConnectedAccount({ accountId: 'demo_linkedin', accountName: 'LinkedIn Demo', connected: true });
				showToast('Connected in Demo Mode!');
			} else {
				showToast(data.error || 'Failed to start connection.');
			}
		} catch { showToast('Failed to start connection.'); }
		finally { setIsConnecting(false); }
	};

	const handleDisconnect = async () => {
		try {
			await fetch('/api/social/disconnect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: 'linkedin' }) });
			setConnectedAccount(null);
			showToast('LinkedIn account disconnected.');
		} catch { showToast('Failed to disconnect.'); }
	};

	// ── Drag & Drop File Upload Uploader (Using react-dropzone) ──
	const onDropMedia = useCallback((acceptedFiles: File[]) => {
		if (mediaType === 'VIDEO') {
			const file = acceptedFiles.find(f => f.type.startsWith('video/'));
			if (!file) { showToast('Please select a video file (MP4, MOV, WebM).'); return; }
			const reader = new FileReader();
			reader.onload = () => {
				setUploadedVideo({ url: reader.result as string, name: file.name });
				showToast(`🎬 Linked video: ${file.name}`);
			};
			reader.readAsDataURL(file);
		} else if (mediaType === 'CAROUSEL') {
			const pdfFile = acceptedFiles.find(f => f.type === 'application/pdf');
			if (pdfFile) {
				const reader = new FileReader();
				reader.onload = () => {
					setUploadedPdf({ url: reader.result as string, name: pdfFile.name });
					setUploadedImages([]);
					showToast(`📄 Linked PDF Carousel: ${pdfFile.name}`);
				};
				reader.readAsDataURL(pdfFile);
			} else {
				const imgs = acceptedFiles.filter(f => f.type.startsWith('image/'));
				if (imgs.length === 0) { showToast('Please upload a PDF file or image files.'); return; }
				setUploadedPdf(null);
				imgs.forEach(file => {
					const reader = new FileReader();
					reader.onload = () => {
						setUploadedImages(prev => [...prev, { url: reader.result as string, name: file.name }]);
					};
					reader.readAsDataURL(file);
				});
				showToast(`🖼 Linked ${imgs.length} slide image(s).`);
			}
		} else {
			// POST or ARTICLE
			const imgs = acceptedFiles.filter(f => f.type.startsWith('image/'));
			if (imgs.length === 0) { showToast('Please upload image files only.'); return; }
			const file = imgs[0];
			const reader = new FileReader();
			reader.onload = () => {
				if (mediaType === 'ARTICLE') {
					setArticleThumbnailUrl(reader.result as string);
					showToast(`🖼 Linked article thumbnail: ${file.name}`);
				} else {
					setUploadedImages([{ url: reader.result as string, name: file.name }]);
					showToast(`🖼 Linked image: ${file.name}`);
				}
			};
			reader.readAsDataURL(file);
		}
	}, [mediaType]);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: onDropMedia,
		accept: mediaType === 'VIDEO'
			? { 'video/*': ['.mp4', '.mov', '.webm', '.mkv'] }
			: mediaType === 'CAROUSEL'
			? { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'application/pdf': ['.pdf'] }
			: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }
	});

	const removeUploadedImage = (idx: number) => setUploadedImages(prev => prev.filter((_, i) => i !== idx));
	const removeUploadedVideo = () => setUploadedVideo(null);
	const removeUploadedPdf = () => setUploadedPdf(null);

	// ── AI Caption ──
	const handleAiCaption = async () => {
		if (!aiPrompt.trim()) { showToast('Enter a topic/prompt first.'); return; }
		setIsBoosting(true);
		try {
			const res = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ topic: aiPrompt, platform: 'linkedin', count: 1, includeBrand: includeBrandProfile }),
			});
			const data = await res.json();
			const generated = data.generatedText || data.variations?.[0] || data.text;
			if (generated) {
				const lines = generated.split('\n');
				const hashtagLine = lines.find((l: string) => l.includes('#'));
				if (hashtagLine) {
					const tags = hashtagLine.match(/#(\w+)/g)?.map((t: string) => t.replace('#', '')) || [];
					if (tags.length > 0) setHashtags(tags.slice(0, 15));
				}
				const captionText = lines.filter((l: string) => !l.trim().match(/^(#\w+\s*)+$/)).join('\n').trim();
				setCaption(captionText || generated);
				showToast('✨ Caption generated!');
			} else {
				showToast(data.error || 'Caption generation failed.');
			}
		} catch (e) { showToast('Network error. Try again.'); }
		finally { setIsBoosting(false); }
	};

	// ── AI Image Generation ──
	const handleGenerateImage = async () => {
		if (!aiPrompt.trim()) { showToast('Enter a topic/prompt first.'); return; }
		setIsGeneratingImage(true);
		setGeneratedImageUrl(null);
		try {
			const res = await fetch('/api/generate-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: aiPrompt, width: 1080, height: 1080 }),
			});
			const data = await res.json();
			if (data.imageUrl) { setGeneratedImageUrl(data.imageUrl); showToast('✨ Image generated!'); }
			else showToast(data.error || 'Image generation failed.');
		} catch { showToast('Image generation failed.'); }
		finally { setIsGeneratingImage(false); }
	};

	// ── AI Video Generation (Fal.ai) ──
	const handleGenerateVideo = async () => {
		if (!aiPrompt.trim()) { showToast('Enter a topic/prompt first.'); return; }
		setIsGeneratingVideo(true);
		setGeneratedVideoUrl(null);
		showToast('🎬 Generating video with Fal.ai... may take 1–3 min');
		try {
			const res = await fetch('/api/generate-video', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: aiPrompt }),
			});
			const data = await res.json();
			if (data.videoUrl) { setGeneratedVideoUrl(data.videoUrl); showToast('🎬 Video generated!'); }
			else showToast(data.error || 'Video generation failed.');
		} catch { showToast('Video generation failed.'); }
		finally { setIsGeneratingVideo(false); }
	};

	// ── AI Carousel Slides Generation ──
	const handleGenerateCarousel = async () => {
		if (!aiPrompt.trim()) { showToast('Enter a topic/prompt first.'); return; }
		setIsGeneratingCarousel(true);
		setCarouselSlides([]);
		showToast('✨ Generating 3 carousel slides with FAL AI...');
		try {
			const promises = [1, 2, 3].map((num) => 
				fetch('/api/generate-image', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ prompt: `${aiPrompt} - slide page ${num} infographic style, clean modern graphics`, width: 1080, height: 1350 }),
				}).then(r => r.json())
			);
			
			const results = await Promise.all(promises);
			const slidesArr = results.filter(r => r.imageUrl).map(r => ({ imageUrl: r.imageUrl }));
			if (slidesArr.length > 0) {
				setCarouselSlides(slidesArr);
				setActiveSlideIdx(0);
				showToast(`✨ Generated ${slidesArr.length} slides!`);
			} else {
				showToast('Carousel generation failed.');
			}
		} catch { showToast('Carousel generation failed.'); }
		finally { setIsGeneratingCarousel(false); }
	};

	// ── Hashtag helpers ──
	const addHashtag = () => {
		const trimmed = hashtagInput.replace(/^#/, '').trim();
		if (trimmed && !hashtags.includes(trimmed)) setHashtags(prev => [...prev, trimmed]);
		setHashtagInput('');
	};
	const removeHashtag = (tag: string) => setHashtags(prev => prev.filter(t => t !== tag));

	// ── Publish / Schedule Post ──
	const handlePublishPost = async (overrideDate?: string) => {
		if (!connectedAccount) { showToast('Connect a LinkedIn profile first.'); return; }
		if (!caption.trim()) { showToast('Caption is required.'); return; }

		// Gather payloads depending on format
		const activeOption = overrideDate ? 'custom' : schedOption;
		const fullCaption = caption + (hashtags.length > 0 ? '\n\n' + hashtags.map(t => `#${t}`).join(' ') : '');

		let payload: any = {
			platform: 'linkedin',
			caption: fullCaption,
			linkedInContentType: mediaType.toLowerCase(),
		};

		if (mediaType === 'VIDEO') {
			const vUrl = uploadedVideo?.url || generatedVideoUrl || manualMediaUrl;
			if (!vUrl) { showToast('Please upload or generate a video first.'); return; }
			payload.videoDataUrl = vUrl;
			payload.videoName = uploadedVideo?.name || 'video.mp4';
		} else if (mediaType === 'CAROUSEL') {
			if (uploadMode === 'upload') {
				if (uploadedPdf) {
					payload.documentDataUrl = uploadedPdf.url;
					payload.documentName = uploadedPdf.name;
				} else if (uploadedImages.length > 0) {
					payload.slides = uploadedImages.map(img => ({ imageUrl: img.url }));
				} else {
					showToast('Please upload a PDF or slides images first.');
					return;
				}
			} else {
				// AI generated slides
				if (carouselSlides.length === 0) { showToast('Please generate AI slides first.'); return; }
				payload.slides = carouselSlides;
			}
		} else if (mediaType === 'ARTICLE') {
			if (!articleLink.trim()) { showToast('Article link is required.'); return; }
			payload.link = articleLink;
			payload.articleTitle = articleTitle || 'LinkedIn Shared Link';
			payload.articleDescription = articleDesc;
			if (articleThumbnailUrl) {
				payload.articleThumbnail = articleThumbnailUrl;
			}
		} else {
			// POST (standard image)
			const img = uploadedImages[0]?.url || generatedImageUrl || manualMediaUrl;
			if (img) payload.imageUrl = img;
		}

		setIsPublishing(true);
		setUploadProgress(0);
		setPublishedPostUrl(null);

		const progressInterval = setInterval(() => {
			setUploadProgress(prev => {
				if (prev >= 90) { clearInterval(progressInterval); return 90; }
				return prev + Math.floor(Math.random() * 15) + 5;
			});
		}, 250);

		try {
			let endpoint = '/api/social/publish';
			if (activeOption !== 'now') {
				endpoint = '/api/social/schedule';
				payload = {
					...payload,
					format: mediaType.toLowerCase(),
					publishOption: activeOption,
					customDate: activeOption === 'custom' ? (overrideDate || customSchedDate) : undefined,
				};
			}

			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			const data = await res.json();

			clearInterval(progressInterval);
			setUploadProgress(100);

			if (res.ok && data.ok) {
				if (activeOption !== 'now') {
					showToast(data.message || 'Scheduled successfully!');
					const newItem: PublishHistoryItem = {
						id: data.post?._id || 'sched-' + Date.now(),
						caption: fullCaption,
						format: mediaType === 'CAROUSEL' ? 'Carousel' : mediaType === 'VIDEO' ? 'Video' : mediaType === 'ARTICLE' ? 'Article' : 'Post',
						status: 'queued',
						scheduledAt: new Date(payload.customDate || Date.now() + 2 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
					};
					setHistory(prev => [newItem, ...prev]);
				} else {
					setPublishedPostUrl(data.postUrl || null);
					showToast('🎉 Published to LinkedIn successfully!');
					
					if (notifyRef.current && 'Notification' in window && Notification.permission === 'granted') {
						new Notification('Auto Studio: Published to LinkedIn! 🚀', {
							body: `Your LinkedIn update has been shared live.`,
						});
					}

					// Reset
					setCaption(''); setUploadedImages([]); setUploadedVideo(null); setUploadedPdf(null); setGeneratedImageUrl(null); setGeneratedVideoUrl(null); setManualMediaUrl(''); setCarouselSlides([]);
				}
			} else {
				showToast(data.error || 'Publish failed.');
			}
		} catch (err: any) {
			clearInterval(progressInterval);
			setUploadProgress(100);
			showToast(`Error: ${err.message || 'Server timeout'}`);
		} finally {
			setIsPublishing(false);
		}
	};

	const refreshHistory = async () => {
		setIsRefreshingHistory(true);
		try {
			const res = await fetch('/api/social/schedule');
			if (res.ok) {
				const data = await res.json();
				const liHistory = (data.posts || []).filter((p: any) => p.platform === 'linkedin');
				setHistory(liHistory.map((p: any) => ({
					id: p._id,
					caption: p.caption,
					format: p.format === 'carousel' ? 'Carousel' : p.format === 'video' ? 'Video' : p.format === 'article' ? 'Article' : 'Post',
					status: p.status,
					scheduledAt: p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined,
					url: p.postUrl || undefined
				})));
			}
		} catch {}
		setIsRefreshingHistory(false);
	};

	const getFinalMediaPreview = () => {
		if (mediaType === 'VIDEO') {
			return uploadedVideo?.url || generatedVideoUrl || manualMediaUrl;
		}
		if (mediaType === 'CAROUSEL') {
			if (uploadMode === 'upload') {
				if (uploadedPdf) return '/pdf-thumbnail-placeholder.png'; // simple placeholder
				return uploadedImages[activeSlideIdx]?.url || '';
			}
			return carouselSlides[activeSlideIdx]?.imageUrl || '';
		}
		if (mediaType === 'ARTICLE') {
			return articleThumbnailUrl;
		}
		// POST
		return uploadedImages[0]?.url || generatedImageUrl || manualMediaUrl;
	};

	const mediaTypeOptions = [
		{ id: 'POST' as const, label: 'Post', icon: <ImageIcon className="w-4 h-4" />, desc: 'Standard update' },
		{ id: 'CAROUSEL' as const, label: 'Carousel', icon: <BookOpen className="w-4 h-4" />, desc: 'PDF or multi-slide' },
		{ id: 'VIDEO' as const, label: 'Video', icon: <Video className="w-4 h-4" />, desc: 'Native video post' },
		{ id: 'ARTICLE' as const, label: 'Article', icon: <FileText className="w-4 h-4" />, desc: 'Newsletter link card' },
	];

	// Calendar date calculations
	const handlePrevMonth = () => {
		if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
		else setCalMonth(m => m - 1);
	};
	const handleNextMonth = () => {
		if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
		else setCalMonth(m => m + 1);
	};

	const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
	const firstDayIndex = new Date(calYear, calMonth, 1).getDay();

	const handleDateSelect = (day: number) => {
		const newDate = new Date(calYear, calMonth, day);
		setSelectedDate(newDate);
	};

	const handleSaveCustomDate = () => {
		const targetDate = new Date(selectedDate);
		targetDate.setHours(parseInt(timeHours), parseInt(timeMinutes), 0, 0);
		setCustomSchedDate(targetDate.toISOString());
		setSchedOption('custom');
		setIsSchedMenuOpen(false);
		showToast(`📅 Set custom scheduling time: ${targetDate.toLocaleString()}`);
	};

	return (
		<div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in pb-16 text-slate-800">
			{/* Toast Notifications */}
			{notification && <Toast message={notification} onClose={() => setNotification(null)} />}

			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex items-center space-x-3.5">
					<div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center text-blue-650">
						<Linkedin className="w-6 h-6 fill-current" />
					</div>
					<div>
						<h1 className="text-2xl font-black text-slate-900 tracking-tight">LinkedIn Studio</h1>
						<p className="text-xs font-semibold text-slate-500">Design, compose, schedule, and publish LinkedIn updates</p>
					</div>
				</div>
				<div className="flex items-center space-x-3">
					<Link href="/dashboard/insights?platform=linkedin" className="inline-flex items-center space-x-1.5 px-4 py-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-sm">
						<BarChart3 className="w-4 h-4 text-slate-500" />
						<span>View Insights</span>
					</Link>
					{connectedAccount ? (
						<div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-800">
							<CheckCircle className="w-4 h-4 text-emerald-600" />
							<span>Linked: {connectedAccount.accountName}</span>
							<button onClick={handleDisconnect} className="ml-2 text-emerald-700 hover:text-emerald-950 underline text-[10px]">Disconnect</button>
						</div>
					) : (
						<button onClick={handleConnect} disabled={isConnecting}
							className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50">
							{isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Linkedin className="w-3.5 h-3.5 fill-current" />}
							<span>Connect LinkedIn Account</span>
						</button>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Column 1: Editor & Inputs */}
				<div className="lg:col-span-7 space-y-6">
					
					{/* Content Format selector */}
					<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
						<h2 className="font-extrabold text-slate-900 text-sm">Select Content Format</h2>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
							{mediaTypeOptions.map((opt) => (
								<button key={opt.id} onClick={() => { setMediaType(opt.id); setUploadedImages([]); setUploadedVideo(null); setUploadedPdf(null); }}
									className={`p-3.5 border rounded-xl flex flex-col items-center text-center space-y-2 transition-all ${
										mediaType === opt.id 
											? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm' 
											: 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500'
									}`}>
									<div className={`p-2 rounded-lg ${mediaType === opt.id ? 'bg-blue-100 text-blue-650' : 'bg-slate-100 text-slate-500'}`}>
										{opt.icon}
									</div>
									<div>
										<p className="text-xs font-bold">{opt.label}</p>
										<p className="text-[9px] text-slate-400 mt-0.5">{opt.desc}</p>
									</div>
								</button>
							))}
						</div>
					</div>

					{/* Media Source Toggle: Upload vs AI generation */}
					<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
						<div className="flex items-center justify-between border-b border-slate-100 pb-3">
							<h2 className="font-extrabold text-slate-900 text-sm">Media Source</h2>
							<div className="flex space-x-1 p-0.5 bg-slate-100 rounded-lg">
								<button onClick={() => setUploadMode('upload')}
									className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${uploadMode === 'upload' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
									Manual Upload
								</button>
								<button onClick={() => setUploadMode('ai')}
									className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${uploadMode === 'ai' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
									AI Studio
								</button>
							</div>
						</div>

						{uploadMode === 'upload' ? (
							<div className="space-y-4">
								{/* Direct Dropzone Upload */}
								<div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
									isDragActive ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
								}`}>
									<input {...getInputProps()} />
									<Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
									<p className="text-xs font-bold text-slate-700">Drag & drop your files here</p>
									<p className="text-[10px] text-slate-400 mt-1">
										{mediaType === 'VIDEO' 
											? 'Supports MP4 or MOV native video files (Max 200MB)'
											: mediaType === 'CAROUSEL'
											? 'Upload a PDF Document or multiple Image slides'
											: 'Supports PNG, JPG, or WEBP images'}
									</p>
								</div>

								{/* Manual URL Input */}
								<div className="flex space-x-2">
									<input type="text" placeholder="Or enter manual media URL..." value={manualMediaUrl} onChange={(e) => setManualMediaUrl(e.target.value)}
										className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
									{manualMediaUrl && (
										<button onClick={() => setManualMediaUrl('')} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
											<X className="w-3.5 h-3.5" />
										</button>
									)}
								</div>

								{/* Upload list summaries */}
								{uploadedImages.length > 0 && (
									<div className="flex flex-wrap gap-2 pt-2">
										{uploadedImages.map((img, idx) => (
											<div key={idx} className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 group">
												<img src={img.url} alt={img.name} className="w-full h-full object-cover" />
												<button onClick={() => removeUploadedImage(idx)} className="absolute top-1 right-1 bg-slate-900/60 hover:bg-slate-900 text-white p-0.5 rounded-full">
													<X className="w-3 h-3" />
												</button>
											</div>
										))}
									</div>
								)}

								{uploadedVideo && (
									<div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
										<div className="flex items-center space-x-2">
											<FileVideo className="w-5 h-5 text-blue-600" />
											<span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{uploadedVideo.name}</span>
										</div>
										<button onClick={removeUploadedVideo} className="text-slate-400 hover:text-slate-600"><Trash2 className="w-4 h-4" /></button>
									</div>
								)}

								{uploadedPdf && (
									<div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
										<div className="flex items-center space-x-2">
											<FileText className="w-5 h-5 text-blue-600" />
											<span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{uploadedPdf.name}</span>
										</div>
										<button onClick={removeUploadedPdf} className="text-slate-400 hover:text-slate-600"><Trash2 className="w-4 h-4" /></button>
									</div>
								)}
							</div>
						) : (
							<div className="space-y-4">
								<div className="flex space-x-2">
									<input type="text" placeholder={mediaType === 'CAROUSEL' ? "Topic for slides (e.g. 5 tips for Next.js scaling)..." : "Describe the image or concept to generate..."} 
										value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
										onKeyDown={(e) => { if (e.key === 'Enter') { if (mediaType === 'CAROUSEL') handleGenerateCarousel(); else if (mediaType === 'VIDEO') handleGenerateVideo(); else handleGenerateImage(); } }}
										className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50" />
									
									{mediaType === 'CAROUSEL' ? (
										<button onClick={handleGenerateCarousel} disabled={isGeneratingCarousel || !aiPrompt.trim()}
											className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all disabled:opacity-50 active:scale-95">
											{isGeneratingCarousel ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
											<span>Generate Slides</span>
										</button>
									) : mediaType === 'VIDEO' ? (
										<button onClick={handleGenerateVideo} disabled={isGeneratingVideo || !aiPrompt.trim()}
											className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all disabled:opacity-50 active:scale-95">
											{isGeneratingVideo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
											<span>Generate Video</span>
										</button>
									) : (
										<button onClick={handleGenerateImage} disabled={isGeneratingImage || !aiPrompt.trim()}
											className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-700 hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all disabled:opacity-50 active:scale-95">
											{isGeneratingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
											<span>Generate Image</span>
										</button>
									)}
								</div>

								{/* Loading State: Generating Image */}
								{isGeneratingImage && (
									<div className="rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center h-32 animate-pulse">
										<Wand2 className="w-6 h-6 text-blue-400 animate-spin mb-1" />
										<p className="text-xs font-bold text-blue-600">Generating with Pollinations AI...</p>
									</div>
								)}

								{/* Loading State: Generating Video */}
								{isGeneratingVideo && (
									<div className="rounded-xl bg-cyan-50 border border-cyan-100 flex flex-col items-center justify-center h-32 animate-pulse">
										<Video className="w-6 h-6 text-cyan-400 animate-bounce mb-1" />
										<p className="text-xs font-bold text-cyan-600">Generating with Fal.ai Minimax...</p>
										<p className="text-[10px] text-cyan-500">Usually takes 1–3 minutes</p>
									</div>
								)}

								{/* Loading State: Generating Carousel */}
								{isGeneratingCarousel && (
									<div className="rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center h-32 animate-pulse">
										<Layers className="w-6 h-6 text-indigo-400 animate-bounce mb-1" />
										<p className="text-xs font-bold text-indigo-600">Generating 3 carousel slides...</p>
									</div>
								)}

								{/* AI Generated Carousel Slides Preview */}
								{carouselSlides.length > 0 && (
									<div className="space-y-2">
										<p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Generated Slides</p>
										<div className="flex space-x-2">
											{carouselSlides.map((slide, idx) => (
												<div key={idx} onClick={() => setActiveSlideIdx(idx)}
													className={`relative w-16 h-20 rounded-lg border overflow-hidden bg-slate-50 cursor-pointer transition-all ${activeSlideIdx === idx ? 'border-blue-600 ring-1 ring-blue-500' : 'border-slate-200'}`}>
													<img src={slide.imageUrl} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
													<div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded">p. {idx + 1}</div>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Standard single generated image */}
								{generatedImageUrl && !isGeneratingImage && mediaType !== 'CAROUSEL' && mediaType !== 'VIDEO' && (
									<div className="rounded-xl overflow-hidden border border-slate-200 relative group animate-fade-in">
										<img src={generatedImageUrl} alt="AI Generated" className="w-full max-h-60 object-cover" />
										<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
											<a href={generatedImageUrl} download="ai-generated.png" className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 shadow hover:text-black flex"><Download className="w-3.5 h-3.5" /></a>
										</div>
										<button onClick={() => setGeneratedImageUrl(null)} className="absolute top-2 left-2 bg-slate-900/60 hover:bg-slate-900 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all">
											<X className="w-3.5 h-3.5" />
										</button>
										<span className="absolute bottom-2 left-2 bg-white/90 text-[9px] font-black text-blue-700 border border-blue-100 px-2 py-0.5 rounded">✨ Pollinations AI</span>
									</div>
								)}

								{/* Standard generated video */}
								{generatedVideoUrl && !isGeneratingVideo && mediaType === 'VIDEO' && (
									<div className="rounded-xl overflow-hidden border border-slate-200 relative animate-fade-in">
										<video src={generatedVideoUrl} controls className="w-full max-h-60 object-cover" />
										<span className="absolute bottom-2 left-2 bg-white/90 text-[9px] font-black text-cyan-700 border border-cyan-100 px-2 py-0.5 rounded">🎬 Fal.ai Minimax</span>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Article details input (Article format only) */}
					{mediaType === 'ARTICLE' && (
						<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
							<h2 className="font-extrabold text-slate-900 text-sm">Article Link Configuration</h2>
							<div className="space-y-3">
								<div className="space-y-1">
									<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Article / Web Link</label>
									<input type="text" placeholder="https://example.com/my-article" value={articleLink} onChange={(e) => setArticleLink(e.target.value)}
										className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-1">
										<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Custom Title</label>
										<input type="text" placeholder="e.g. Scaling Next.js Apps" value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)}
											className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
									</div>
									<div className="space-y-1">
										<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description Snippet</label>
										<input type="text" placeholder="e.g. Tips and benchmarks..." value={articleDesc} onChange={(e) => setArticleDesc(e.target.value)}
											className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
									</div>
								</div>
								<div className="space-y-1">
									<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Or cover image URL</label>
									<input type="text" placeholder="https://example.com/cover.png" value={articleThumbnailUrl} onChange={(e) => setArticleThumbnailUrl(e.target.value)}
										className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
								</div>
							</div>
						</div>
					)}

					{/* Caption & Hashtag Input */}
					<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
						<h2 className="font-extrabold text-slate-900 text-sm">Caption & Metadata</h2>

						{/* AI Booster Prompt Input (Matches Instagram/YouTube styles) */}
						<div className="bg-slate-50 border border-violet-100 rounded-xl p-3.5 space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-xs font-bold text-violet-700 flex items-center space-x-1"><Sparkles className="w-3.5 h-3.5" /><span>AI SEO Copywriter</span></span>
								<span className="text-[10px] text-slate-400 font-semibold">Uses OpenRouter API</span>
							</div>

							<div className="flex gap-2">
								<input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiCaption()}
									placeholder="Describe your post topic or keywords..."
									className="flex-1 bg-white border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:border-violet-500 focus:outline-none" />
								<button onClick={handleAiCaption} disabled={isBoosting || !aiPrompt.trim()} className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1 hover:scale-105 active:scale-95 transition-all">
									{isBoosting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Sparkles className="w-3.5 h-3.5" /><span>Boost Caption</span></>}
								</button>
							</div>

							{/* Include Brand Profile Toggle */}
							<div className="flex items-center space-x-2 pt-1">
								<input type="checkbox" id="includeBrandProfile" checked={includeBrandProfile} onChange={e => setIncludeBrandProfile(e.target.checked)}
									className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-350 cursor-pointer" />
								<label htmlFor="includeBrandProfile" className="text-[10px] font-extrabold text-slate-500 tracking-wider cursor-pointer select-none">
									Apply Brand guidelines (Voice, Taglines, CTAs, handles)
								</label>
							</div>
						</div>

						<textarea placeholder="Write what is on your mind..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={5}
							className="w-full border border-slate-200 rounded-xl p-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
						<p className="text-[10px] font-bold text-slate-400 text-right">{caption.length} / 3,000</p>

						{/* Tags */}
						<div className="space-y-2 pt-2 border-t border-slate-100">
							<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hashtags</label>
							<div className="flex flex-wrap gap-1.5">
								{hashtags.map((tag) => (
									<span key={tag} className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-600 rounded-full transition-colors">
										<span>#{tag}</span>
										<button onClick={() => removeHashtag(tag)} className="text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
									</span>
								))}
							</div>
							<div className="flex space-x-2 pt-1.5">
								<input type="text" placeholder="Add hashtag..." value={hashtagInput} onChange={(e) => setHashtagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHashtag(); } }}
									className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
								<button onClick={addHashtag} className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold">Add</button>
							</div>
						</div>
					</div>

					{/* Publishing / Scheduling Controls */}
					<div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl space-y-5">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<h3 className="font-extrabold text-sm tracking-tight">Publisher Control Panel</h3>
								<p className="text-[10px] font-semibold text-slate-400">Specify publishing timeframe and settings</p>
							</div>
							<label className="flex items-center space-x-1.5 cursor-pointer text-xs font-semibold text-slate-300">
								<input type="checkbox" checked={notifyOnComplete} onChange={(e) => handleNotifyToggle(e.target.checked)}
									className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 h-3.5 w-3.5" />
								<span>Notify me on completion</span>
							</label>
						</div>

						{isPublishing && (
							<div className="space-y-2">
								<div className="flex items-center justify-between text-xs font-bold">
									<span>Uploading media to LinkedIn...</span>
									<span>{uploadProgress}%</span>
								</div>
								<div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
									<div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
								</div>
							</div>
						)}

						<div className="flex items-center space-x-3 pt-2">
							{/* Schedule dropdown block */}
							<div className="relative" ref={schedMenuRef}>
								<button onClick={() => setIsSchedMenuOpen(!isSchedMenuOpen)}
									className="h-10 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all">
									<Clock className="w-4 h-4 text-blue-400" />
									<span className="capitalize">{getPublishOptionLabel(schedOption)}</span>
									{schedOption === 'custom' && <span className="text-[10px] text-slate-400">({new Date(customSchedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})</span>}
								</button>

								{isSchedMenuOpen && (
									<div className="absolute bottom-full left-0 mb-2 w-80 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
										{schedMenuSubView === 'options' ? (
											<div className="p-4 space-y-3">
												<p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Publish Timing</p>
												<div className="space-y-1.5">
													{[
														{ id: 'now' as const, title: 'Publish Now', desc: 'Post immediately to your feed' },
														{ id: 'next_available' as const, title: 'Next Available Slot', desc: 'Queue for next empty scheduler time slot' },
														{ id: 'prioritize' as const, title: 'Prioritize Queue', desc: 'Place at front of upcoming posts queue' },
													].map(o => (
														<button key={o.id} onClick={() => { setSchedOption(o.id); setIsSchedMenuOpen(false); }}
															className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col ${
																schedOption === o.id ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold' : 'border-slate-100 hover:bg-slate-50 text-slate-600'
															}`}>
															<span>{o.title}</span>
															<span className="text-[9px] text-slate-400 font-normal mt-0.5">{o.desc}</span>
														</button>
													))}
													<button onClick={() => setSchedMenuSubView('calendar')}
														className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-xs text-slate-600 flex items-center justify-between">
														<span className="font-semibold text-slate-700">Set Custom Date & Time</span>
														<ChevronRight className="w-4 h-4 text-slate-400" />
													</button>
												</div>
											</div>
										) : (
											<div className="p-4 space-y-4">
												<div className="flex items-center justify-between border-b border-slate-100 pb-2">
													<button onClick={() => setSchedMenuSubView('options')} className="text-slate-400 hover:text-slate-600 p-1"><ChevronLeft className="w-4 h-4" /></button>
													<span className="text-xs font-bold text-slate-800">Custom Date & Time</span>
													<div className="w-6" />
												</div>

												{/* Calendar Grid */}
												<div className="space-y-3">
													<div className="flex items-center justify-between px-1">
														<span className="text-xs font-bold text-slate-700">{monthNames[calMonth]} {calYear}</span>
														<div className="flex space-x-1">
															<button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronLeft className="w-3.5 h-3.5" /></button>
															<button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronRight className="w-3.5 h-3.5" /></button>
														</div>
													</div>

													<div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
														{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d}>{d}</span>)}
													</div>

													<div className="grid grid-cols-7 gap-1">
														{Array(firstDayIndex).fill(null).map((_, idx) => <div key={`empty-${idx}`} />)}
														{Array(daysInMonth).fill(null).map((_, idx) => {
															const d = idx + 1;
															const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === calMonth && selectedDate.getFullYear() === calYear;
															return (
																<button key={d} onClick={() => handleDateSelect(d)}
																	className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center mx-auto transition-all ${
																		isSelected ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-150'
																	}`}>
																	{d}
																</button>
															);
														})}
													</div>
												</div>

												{/* Time select */}
												<div className="flex items-center justify-center space-x-2 pt-2 border-t border-slate-100">
													<div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1.5 text-xs font-bold">
														<input type="text" maxLength={2} value={timeHours} onChange={(e) => setTimeHours(e.target.value.replace(/[^0-9]/g, ''))} onBlur={() => { let num = parseInt(timeHours); if (isNaN(num) || num < 0 || num > 23) setTimeHours('13'); else setTimeHours(num.toString().padStart(2, '0')); }} className="bg-transparent w-8 text-center focus:outline-none" />
														<span>:</span>
														<input type="text" maxLength={2} value={timeMinutes} onChange={(e) => setTimeMinutes(e.target.value.replace(/[^0-9]/g, ''))} onBlur={() => { let num = parseInt(timeMinutes); if (isNaN(num) || num < 0 || num > 59) setTimeMinutes('00'); else setTimeMinutes(num.toString().padStart(2, '0')); }} className="bg-transparent w-8 text-center focus:outline-none" />
													</div>
													<button onClick={handleSaveCustomDate} className="px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded-lg text-xs font-bold shadow-md">
														Apply Time
													</button>
												</div>
											</div>
										)}
									</div>
								)}
							</div>

							<button onClick={() => handlePublishPost()} disabled={isPublishing || !caption.trim()}
								className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-95 disabled:opacity-50">
								{isPublishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
								<span>{schedOption === 'now' ? 'Publish Now' : 'Schedule Post'}</span>
							</button>
						</div>

						{publishedPostUrl && (
							<div className="bg-slate-800 border border-slate-700 rounded-xl p-3.5 flex items-center justify-between text-xs font-semibold animate-fade-in">
								<span className="text-slate-300">Your post is live!</span>
								<a href={publishedPostUrl} target="_blank" rel="noopener noreferrer"
									className="inline-flex items-center space-x-1 text-blue-450 hover:underline">
									<span>View Post</span>
									<ExternalLink className="w-3.5 h-3.5" />
								</a>
							</div>
						)}
					</div>
				</div>

				{/* Column 2: Live LinkedIn Post Mockup Preview */}
				<div className="lg:col-span-5 space-y-6">
					<div className="sticky top-8 space-y-4">
						<div className="flex items-center justify-between px-2">
							<p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Feed Preview Mockup</p>
							<div className="flex items-center space-x-1 text-[10px] text-slate-500 font-semibold">
								<Globe className="w-3 h-3 text-slate-400" />
								<span>Public View</span>
							</div>
						</div>

						{/* LinkedIn Post container */}
						<div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-slate-800 text-xs">
							{/* Header Row */}
							<div className="p-4 flex items-start justify-between">
								<div className="flex items-center space-x-2.5">
									<div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-650 font-bold text-sm">
										{connectedAccount ? connectedAccount.accountName.charAt(0).toUpperCase() : 'L'}
									</div>
									<div>
										<div className="flex items-center space-x-1">
											<p className="font-extrabold text-[13px] text-slate-900 hover:text-blue-650 hover:underline cursor-pointer">{connectedAccount?.accountName || 'Your Profile'}</p>
											<span className="text-[10px] text-slate-400 font-bold">· 1st</span>
										</div>
										<p className="text-[10px] text-slate-400 font-semibold truncate max-w-[180px]">Creator at Shrameco Auto Studio</p>
										<div className="flex items-center space-x-1 text-[9px] text-slate-400 font-semibold mt-0.5">
											<span>1h</span>
											<span>·</span>
											<Globe className="w-2.5 h-2.5" />
										</div>
									</div>
								</div>
								<button className="text-slate-400 hover:text-slate-600"><Plus className="w-4 h-4" /></button>
							</div>

							{/* Caption Body */}
							<div className="px-4 pb-3 pt-1 space-y-2 whitespace-pre-wrap break-words leading-relaxed text-[12px] text-slate-800">
								<p>{caption || 'No commentary entered yet. Type some text to generate preview...'}</p>
								{hashtags.length > 0 && (
									<p className="text-blue-650 font-bold hover:underline cursor-pointer">
										{hashtags.map(t => `#${t}`).join(' ')}
									</p>
								)}
							</div>

							{/* Media/Thumbnail segment */}
							{getFinalMediaPreview() ? (
								<div className="relative border-t border-b border-slate-100 bg-slate-50/50 flex items-center justify-center overflow-hidden">
									{mediaType === 'VIDEO' ? (
										<div className="relative w-full aspect-video flex items-center justify-center">
											<video src={getFinalMediaPreview()} controls={false} autoPlay muted loop playsInline className="w-full h-full object-cover" />
											<div className="absolute inset-0 bg-black/5 flex items-center justify-center">
												<div className="w-12 h-12 rounded-full bg-slate-900/80 text-white flex items-center justify-center shadow-lg"><Play className="w-5 h-5 fill-current ml-0.5" /></div>
											</div>
										</div>
									) : mediaType === 'CAROUSEL' ? (
										<div className="w-full aspect-square flex flex-col justify-between">
											{uploadedPdf ? (
												<div className="flex-1 w-full h-[360px] relative">
													<iframe src={uploadedPdf.url} className="w-full h-full border-0" title="PDF Document Preview" />
												</div>
											) : (
												<div className="flex-1 relative bg-slate-200">
													<img src={getFinalMediaPreview()} alt="Slide" className="w-full h-full object-cover" />
													{/* Arrows */}
													<button onClick={() => setActiveSlideIdx(prev => Math.max(0, prev - 1))}
														className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
													<button onClick={() => setActiveSlideIdx(prev => Math.min((uploadMode === 'upload' ? uploadedImages.length : carouselSlides.length) - 1, prev + 1))}
														className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"><ChevronRight className="w-4 h-4" /></button>
												</div>
											)}
											{/* Dot Indicators */}
											{!uploadedPdf && (
												<div className="bg-white p-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
													<span>Page {activeSlideIdx + 1} of {uploadMode === 'upload' ? uploadedImages.length : carouselSlides.length}</span>
													<div className="flex space-x-1">
														{Array(uploadMode === 'upload' ? uploadedImages.length : carouselSlides.length).fill(null).map((_, i) => (
															<div key={i} className={`w-1.5 h-1.5 rounded-full ${activeSlideIdx === i ? 'bg-blue-600' : 'bg-slate-300'}`} />
														))}
													</div>
												</div>
											)}
										</div>
									) : mediaType === 'ARTICLE' ? (
										<div className="w-full border border-slate-200 hover:bg-slate-50/50 cursor-pointer">
											{getFinalMediaPreview() && <img src={getFinalMediaPreview()} alt="Article Cover" className="w-full h-40 object-cover" />}
											<div className="p-3 space-y-1">
												<p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new URL(articleLink || 'https://linkedin.com').hostname}</p>
												<h4 className="font-bold text-slate-900 text-xs line-clamp-1">{articleTitle || 'Article Title'}</h4>
												<p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{articleDesc || 'Snippet description of the article...'}</p>
											</div>
										</div>
									) : (
										<img src={getFinalMediaPreview()} alt="Post Media" className="w-full h-auto object-cover max-h-[300px]" />
									)}
								</div>
							) : null}

							{/* Reactions Mock row */}
							<div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
								<div className="flex items-center space-x-1">
									<div className="flex -space-x-1">
										<div className="w-4.5 h-4.5 rounded-full bg-blue-500 flex items-center justify-center text-white border border-white text-[8px]">👍</div>
										<div className="w-4.5 h-4.5 rounded-full bg-red-500 flex items-center justify-center text-white border border-white text-[8px]">❤️</div>
									</div>
									<span>184 likes</span>
								</div>
								<span>· 28 comments</span>
							</div>

							{/* Action mock buttons */}
							<div className="px-2 py-1 flex justify-between text-slate-500 text-[11px] font-bold">
								{[
									{ label: 'Like', icon: '👍' },
									{ label: 'Comment', icon: '💬' },
									{ label: 'Repost', icon: '🔁' },
									{ label: 'Send', icon: '✉️' },
								].map(btn => (
									<button key={btn.label} className="flex-1 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-center space-x-1.5 transition-colors">
										<span>{btn.icon}</span>
										<span>{btn.label}</span>
									</button>
								))}
							</div>
						</div>

						{/* History panel */}
						<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
							<div className="flex items-center justify-between border-b border-slate-100 pb-3">
								<h3 className="font-extrabold text-slate-900 text-sm">Publish History</h3>
								<button onClick={refreshHistory} disabled={isRefreshingHistory}
									className="text-slate-400 hover:text-slate-600 transition-colors p-1">
									<RefreshCw className={`w-3.5 h-3.5 ${isRefreshingHistory ? 'animate-spin text-blue-600' : ''}`} />
								</button>
							</div>

							{isLoadingHistory ? (
								<div className="space-y-2.5">
									{[1, 2, 3].map((n) => (
										<div key={n} className="p-3 border border-slate-100 bg-slate-50/30 rounded-xl flex items-center justify-between animate-pulse">
											<div className="space-y-2 flex-1 pr-3">
												<div className="h-3 bg-slate-200 rounded w-3/4"></div>
												<div className="flex space-x-2">
													<div className="h-3.5 bg-slate-200 rounded w-12"></div>
													<div className="h-3.5 bg-slate-200 rounded w-16"></div>
												</div>
											</div>
											<div className="w-7 h-7 bg-slate-200 rounded-lg"></div>
										</div>
									))}
								</div>
							) : history.length === 0 ? (
								<div className="text-center py-6 text-slate-400">
									<Linkedin className="w-8 h-8 mx-auto mb-2 text-slate-350 fill-current" />
									<p className="text-[11px] font-semibold">No recent updates published.</p>
								</div>
							) : (
								<div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
									{history.map((post) => (
										<div key={post.id} className="p-3 border border-slate-100 hover:border-slate-200 bg-slate-50/50 rounded-xl flex items-start justify-between text-xs transition-all">
											<div className="space-y-1 pr-3 flex-1 min-w-0">
												<p className="text-slate-800 font-bold truncate">{post.caption}</p>
												<div className="flex items-center space-x-2 text-[10px] text-slate-500 font-semibold">
													<span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-extrabold uppercase">{post.format}</span>
													{post.status === 'sent' ? (
														<span className="text-emerald-600 flex items-center space-x-0.5">
															<CheckCircle className="w-3 h-3" />
															<span>Live</span>
														</span>
													) : post.status === 'failed' ? (
														<span className="text-red-600 flex items-center space-x-0.5">
															<AlertTriangle className="w-3 h-3" />
															<span>Failed</span>
														</span>
													) : (
														<span className="text-amber-600 flex items-center space-x-0.5">
															<Clock className="w-3 h-3" />
															<span>Queued ({post.scheduledAt})</span>
														</span>
													)}
												</div>
											</div>
											{post.url && (
												<a href={post.url} target="_blank" rel="noopener noreferrer" className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex-shrink-0 transition-colors">
													<ExternalLink className="w-3.5 h-3.5" />
												</a>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
