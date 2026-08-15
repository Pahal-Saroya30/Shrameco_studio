'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
	Facebook,
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
	ThumbsUp,
	Share2,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface FacebookAccount {
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

export default function FacebookStudioPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [connectedAccount, setConnectedAccount] = useState<FacebookAccount | null>(null);
	const [isConnecting, setIsConnecting] = useState(false);
	const [notification, setNotification] = useState<string | null>(null);
	const [isLoadingHistory, setIsLoadingHistory] = useState(true);
	const [isLoadingAccount, setIsLoadingAccount] = useState(true);

	// Media format (POST = standard post/carousel, REEL = video reel, STORY = image story, LINK = destination link)
	const [mediaType, setMediaType] = useState<'POST' | 'REEL' | 'STORY' | 'LINK'>('POST');

	// Media Input Modes: 'upload' (Direct computer upload) | 'ai' (AI generated)
	const [uploadMode, setUploadMode] = useState<'upload' | 'ai'>('upload');

	// Caption & hashtags
	const [caption, setCaption] = useState('');
	const [hashtags, setHashtags] = useState<string[]>(['marketing', 'business', 'community']);
	const [hashtagInput, setHashtagInput] = useState('');

	// Destination Link fields
	const [destinationUrl, setDestinationUrl] = useState('');
	const [ogTitle, setOgTitle] = useState('');
	const [ogDesc, setOgDesc] = useState('');
	const [ogThumbnailUrl, setOgThumbnailUrl] = useState('');

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

	// AI Generation states (Image/Video/Carousel)
	const [aiPrompt, setAiPrompt] = useState('');
	const [isBoosting, setIsBoosting] = useState(false);
	const [isGeneratingImage, setIsGeneratingImage] = useState(false);
	const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
	const [isGeneratingCarousel, setIsGeneratingCarousel] = useState(false);
	const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
	const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
	const [carouselSlides, setCarouselSlides] = useState<{ imageUrl: string }[]>([]);
	const [activeSlideIdx, setActiveSlideIdx] = useState(0);

	// Manual media URL
	const [manualMediaUrl, setManualMediaUrl] = useState('');

	// Local uploaded files
	const [uploadedImages, setUploadedImages] = useState<{ file: File; url: string; name: string }[]>([]);
	const [uploadedVideo, setUploadedVideo] = useState<{ file: File; url: string; name: string } | null>(null);

	// History
	const [history, setHistory] = useState<PublishHistoryItem[]>([]);
	const [isRefreshingHistory, setIsRefreshingHistory] = useState(false);

	// Custom schedule picker states
	const [schedOption, setSchedOption] = useState<'next_available' | 'prioritize' | 'now' | 'custom'>('next_available');
	const [isSchedMenuOpen, setIsSchedMenuOpen] = useState(false);
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
	const [customSchedDate, setCustomSchedDate] = useState<string | null>(null);

	const schedMenuRef = useRef<HTMLDivElement>(null);

	const showToast = (msg: string) => {
		setNotification(msg);
	};

	// Dropzone configs
	const onDrop = useCallback((acceptedFiles: File[]) => {
		if (acceptedFiles.length === 0) return;

		if (mediaType === 'REEL') {
			const file = acceptedFiles[0];
			if (!file.type.startsWith('video/')) {
				showToast('Please upload a video file for Reels.');
				return;
			}
			const url = URL.createObjectURL(file);
			setUploadedVideo({ file, url, name: file.name });
			setUploadedImages([]);
			showToast(`🎬 Attached video: ${file.name}`);
		} else {
			// POST or STORY
			const imageFiles = acceptedFiles.filter(f => f.type.startsWith('image/'));
			if (imageFiles.length === 0) {
				showToast('Please upload image files.');
				return;
			}

			const newImages = imageFiles.map(file => ({
				file,
				url: URL.createObjectURL(file),
				name: file.name
			}));

			if (mediaType === 'STORY') {
				setUploadedImages([newImages[0]]); // Story takes 1 image
				showToast(`📸 Attached story slide: ${imageFiles[0].name}`);
			} else {
				setUploadedImages(prev => [...prev, ...newImages]);
				showToast(`📸 Attached ${imageFiles.length} image(s)`);
			}
			setUploadedVideo(null);
		}
	}, [mediaType]);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: mediaType === 'REEL'
			? { 'video/*': ['.mp4', '.mov', '.webm', '.mkv', '.avi'] }
			: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
		multiple: mediaType === 'POST'
	});

	const removeUploadedImage = (idx: number) => {
		setUploadedImages(prev => {
			const copy = [...prev];
			URL.revokeObjectURL(copy[idx].url);
			copy.splice(idx, 1);
			return copy;
		});
	};

	// Connect / Disconnect
	const handleConnect = async () => {
		setIsConnecting(true);
		try {
			const res = await fetch('/api/social/connect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ platform: 'facebook', returnTo: window.location.pathname }),
			});
			const data = await res.json();
			if (res.ok && data.url) {
				if (data.demo) {
					// Demo mode: credentials not configured correctly, connect with mock account
					setConnectedAccount({ accountId: 'fb_demo_page_id', accountName: 'Facebook Demo Page', connected: true });
					showToast('Connected in Demo Mode.');
				} else {
					router.push(data.url);
				}
			} else {
				showToast(data.error || 'Failed to initiate Facebook login.');
			}
		} catch {
			showToast('Failed to connect Facebook account.');
		} finally {
			setIsConnecting(false);
		}
	};

	const handleDisconnect = async () => {
		try {
			const res = await fetch('/api/social/disconnect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ platform: 'facebook' }),
			});
			if (res.ok) {
				setConnectedAccount(null);
				showToast('Disconnected Facebook account.');
			}
		} catch {
			showToast('Failed to disconnect.');
		}
	};

	// Close schedule menu on click outside
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
					const fb = (data.accounts || []).find((a: any) => a.platform === 'facebook' && a.connected);
					if (fb) setConnectedAccount({ accountId: fb.accountId, accountName: fb.accountName, connected: true });
				}
			} catch {} finally {
				setIsLoadingAccount(false);
			}
		}
		async function fetchHistory() {
			try {
				const res = await fetch('/api/social/schedule?platform=facebook');
				if (res.ok) {
					const data = await res.json();
					setHistory((data.posts || []).map((p: any) => ({
						id: p.id,
						caption: p.caption,
						format: p.format === 'reel' ? 'Reel' : p.format === 'story' ? 'Story' : p.format === 'link' ? 'Link' : 'Post',
						status: p.status,
						scheduledAt: p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined,
						url: p.url || undefined
					})));
				}
			} catch {} finally {
				setIsLoadingHistory(false);
			}
		}
		fetchAccount();
		fetchHistory();
	}, []);

	// Handle OAuth redirect feedback from URL params (success/error)
	useEffect(() => {
		const connected = searchParams.get('connected');
		const socialError = searchParams.get('social_error');
		if (connected === 'facebook') {
			showToast('✅ Facebook page connected successfully!');
		} else if (socialError) {
			// Show the specific error so user knows what went wrong
			if (socialError.includes('client secret') || socialError.includes('Error validating')) {
				showToast('❌ Facebook app secret is invalid. Please update FACEBOOK_CLIENT_SECRET in .env.local');
			} else {
				showToast(`❌ ${decodeURIComponent(socialError)}`);
			}
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
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
				showToast('You will be notified once the Facebook post goes live!');
			}
		}
	};

	// ── AI Copywriter Caption ──
	const handleAiCaption = async () => {
		if (!aiPrompt.trim()) { showToast('Please enter post topic prompt.'); return; }
		setIsBoosting(true);
		try {
			const res = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ topic: aiPrompt, prompt: aiPrompt, platform: 'facebook', includeBrand: includeBrandProfile }),
			});
			const data = await res.json();
			if (res.ok && (data.caption || data.generatedText)) {
				const generatedText = data.caption || data.generatedText;
				setCaption(generatedText);
				if (data.hashtags && data.hashtags.length > 0) {
					setHashtags(data.hashtags);
				}
				showToast('✨ Caption generated!');
			} else {
				showToast(data.error || 'Failed to generate caption.');
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
		showToast('🎬 Requesting AI video generation...');
		try {
			const res = await fetch('/api/generate-video', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: aiPrompt }),
			});
			const data = await res.json();
			if (res.ok && data.videoUrl) {
				setGeneratedVideoUrl(data.videoUrl);
				showToast('🎬 Video generated successfully!');
			} else {
				const errMsg = data.error || 'Video generation failed.';
				if (errMsg.includes('Exhausted balance') || errMsg.includes('locked')) {
					showToast('❌ Fal.ai balance exhausted. Please top up Fal.ai account or attach a video file.');
				} else {
					showToast(`❌ ${errMsg}`);
				}
			}
		} catch { showToast('Network error during video generation.'); }
		finally { setIsGeneratingVideo(false); }
	};

	// ── AI Carousel Slides Generation ──
	const handleGenerateCarousel = async () => {
		if (!aiPrompt.trim()) { showToast('Enter a topic/prompt first.'); return; }
		setIsGeneratingCarousel(true);
		setCarouselSlides([]);
		showToast('✨ Generating 3 AI carousel slides...');
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

	// ── Fetch Link OG Metadata ──
	const handleFetchLinkOg = async () => {
		if (!destinationUrl.trim()) return;
		showToast('Fetching link preview details...');
		try {
			const res = await fetch(`/api/og-metadata?url=${encodeURIComponent(destinationUrl.trim())}`);
			if (res.ok) {
				const data = await res.json();
				setOgTitle(data.title || '');
				setOgDesc(data.description || '');
				setOgThumbnailUrl(data.image || '');
				showToast('🌐 Link details resolved successfully!');
			}
		} catch {}
	};

	// ── Publish / Schedule Post ──
	const handlePublishPost = async (overrideDate?: string) => {
		if (!connectedAccount) { showToast('Connect a Facebook Page first.'); return; }
		if (!caption.trim()) { showToast('Caption is required.'); return; }

		setIsPublishing(true);
		setUploadProgress(0);
		setPublishedPostUrl(null);

		// Animate upload progress bar for premium experience
		const progressInterval = setInterval(() => {
			setUploadProgress(prev => {
				if (prev >= 90) { clearInterval(progressInterval); return 90; }
				return prev + Math.floor(Math.random() * 15) + 5;
			});
		}, 250);

		try {
			// Gather local files to upload
			let localFilesToUpload: File[] = [];
			if (mediaType === 'REEL' && uploadedVideo) {
				localFilesToUpload = [uploadedVideo.file];
			} else if (mediaType === 'STORY' && uploadedImages.length > 0) {
				localFilesToUpload = [uploadedImages[0].file];
			} else if (mediaType === 'POST') {
				if (uploadMode !== 'ai') {
					localFilesToUpload = uploadedImages.map(img => img.file);
				}
			}

			// Phase 1: Upload local files to server /api/upload
			let uploadedUrls: string[] = [];
			if (localFilesToUpload.length > 0) {
				setUploadProgress(20);
				const formData = new FormData();
				localFilesToUpload.forEach(file => formData.append('files', file));
				const uploadRes = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});
				if (!uploadRes.ok) throw new Error('Failed to upload local media to server.');
				const uploadData = await uploadRes.json();
				uploadedUrls = uploadData.urls || [];
				setUploadProgress(60);
			}

			// Phase 2: Gather payloads depending on format
			const activeOption = overrideDate ? 'custom' : schedOption;
			const fullCaption = caption + (hashtags.length > 0 ? '\n\n' + hashtags.map(t => `#${t}`).join(' ') : '');

			let payload: any = {
				platform: 'facebook',
				caption: fullCaption,
			};

			if (mediaType === 'REEL') {
				const vUrl = uploadedUrls[0] || generatedVideoUrl || manualMediaUrl;
				if (!vUrl) { showToast('Please upload or generate a video first.'); return; }
				payload.videoUrl = vUrl;
				payload.contentFormat = 'reel';
			} else if (mediaType === 'STORY') {
				const img = uploadedUrls[0] || generatedImageUrl || manualMediaUrl;
				if (!img) { showToast('Please upload or generate a story image first.'); return; }
				payload.imageUrl = img;
				payload.contentFormat = 'story';
			} else if (mediaType === 'LINK') {
				if (!destinationUrl.trim()) { showToast('Destination URL is required.'); return; }
				payload.linkUrl = destinationUrl;
				payload.contentFormat = 'link';
			} else {
				// POST (Standard post: supports image, multiple images, text-only)
				payload.contentFormat = 'post';
				if (uploadMode === 'ai' && carouselSlides.length > 0) {
					payload.contentFormat = 'carousel';
					payload.carouselImages = carouselSlides.map(s => s.imageUrl);
				} else if (uploadedUrls.length > 1) {
					payload.contentFormat = 'carousel';
					payload.carouselImages = uploadedUrls;
				} else {
					const img = uploadedUrls[0] || generatedImageUrl || manualMediaUrl;
					if (img) payload.imageUrl = img;
				}
			}

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

			setUploadProgress(80);
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
						format: mediaType === 'REEL' ? 'Reel' : mediaType === 'STORY' ? 'Story' : mediaType === 'LINK' ? 'Link' : 'Post',
						status: 'queued',
						scheduledAt: new Date(payload.customDate || Date.now() + 2 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
					};
					setHistory(prev => [newItem, ...prev]);
				} else {
					setPublishedPostUrl(data.postUrl || null);
					showToast('🎉 Published to Facebook Page successfully!');
					
					if (notifyRef.current && 'Notification' in window && Notification.permission === 'granted') {
						new Notification('Auto Studio: Published to Facebook! 🚀', {
							body: `Your Facebook update has been shared live.`,
						});
					}

					// Reset form
					setCaption(''); setUploadedImages([]); setUploadedVideo(null); setGeneratedImageUrl(null); setGeneratedVideoUrl(null); setManualMediaUrl(''); setCarouselSlides([]); setDestinationUrl(''); setOgTitle(''); setOgDesc(''); setOgThumbnailUrl('');
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
				const fbHistory = (data.posts || []).filter((p: any) => p.platform === 'facebook');
				setHistory(fbHistory.map((p: any) => ({
					id: p._id,
					caption: p.caption,
					format: p.format === 'reel' ? 'Reel' : p.format === 'story' ? 'Story' : p.format === 'link' ? 'Link' : 'Post',
					status: p.status,
					scheduledAt: p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined,
					url: p.postUrl || undefined
				})));
			}
		} catch {}
		setIsRefreshingHistory(false);
	};

	const getFinalMediaPreview = () => {
		if (mediaType === 'REEL') {
			return uploadedVideo?.url || generatedVideoUrl || manualMediaUrl;
		}
		if (mediaType === 'STORY') {
			return uploadedImages[0]?.url || generatedImageUrl || manualMediaUrl;
		}
		if (mediaType === 'LINK') {
			return ogThumbnailUrl;
		}
		// POST
		if (uploadMode === 'ai' && carouselSlides.length > 0) {
			return carouselSlides[activeSlideIdx]?.imageUrl || '';
		}
		if (uploadedImages.length > 1) {
			return uploadedImages[activeSlideIdx]?.url || '';
		}
		return uploadedImages[0]?.url || generatedImageUrl || manualMediaUrl;
	};

	const mediaTypeOptions = [
		{ id: 'POST' as const, label: 'Post', icon: <ImageIcon className="w-4 h-4" />, desc: 'Standard update / multi-image' },
		{ id: 'REEL' as const, label: 'Reel', icon: <Play className="w-4 h-4" />, desc: 'Short video Reel' },
		{ id: 'STORY' as const, label: 'Story', icon: <BookOpen className="w-4 h-4" />, desc: '24-hour photo story' },
		{ id: 'LINK' as const, label: 'Link Card', icon: <FileText className="w-4 h-4" />, desc: 'External clickable card' },
	];

	// Time constraints picker
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

	const handleSaveCustomTime = () => {
		const h = Math.min(23, Math.max(0, parseInt(timeHours || '0')));
		const m = Math.min(59, Math.max(0, parseInt(timeMinutes || '0')));
		const paddedH = String(h).padStart(2, '0');
		const paddedM = String(m).padStart(2, '0');
		setTimeHours(paddedH);
		setTimeMinutes(paddedM);

		const targetDate = new Date(selectedDate);
		targetDate.setHours(h, m, 0, 0);
		setCustomSchedDate(targetDate.toISOString());
		setSchedOption('custom');
		setIsSchedMenuOpen(false);
		showToast(`📅 Scheduled for custom date: ${targetDate.toLocaleString()}`);
	};

	return (
		<div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in pb-16 text-slate-800">
			{notification && <Toast message={notification} onClose={() => setNotification(null)} />}

			{/* Top Panel Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex items-center space-x-3.5">
					<div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center text-[#1877F2]">
						<Facebook className="w-6 h-6 fill-current" />
					</div>
					<div>
						<h1 className="text-2xl font-black text-slate-900 tracking-tight">Facebook Studio</h1>
						<p className="text-xs font-semibold text-slate-500">Design, compose, schedule, and publish Facebook Page updates</p>
					</div>
				</div>
				<div className="flex items-center space-x-3">
					<Link href="/dashboard/insights?platform=facebook" className="inline-flex items-center space-x-1.5 px-4 py-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-sm">
						<BarChart3 className="w-4 h-4 text-slate-500" />
						<span>View Insights</span>
					</Link>
					{connectedAccount ? (
						<div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-800">
							<CheckCircle className="w-4 h-4 text-emerald-600" />
							<span>Connected: {connectedAccount.accountName}</span>
							<button onClick={handleDisconnect} className="ml-2 text-emerald-700 hover:text-emerald-950 underline text-[10px]">Disconnect</button>
						</div>
					) : (
						<button onClick={handleConnect} disabled={isConnecting}
							className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1877F2] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50">
							{isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Facebook className="w-3.5 h-3.5 fill-current" />}
							<span>Connect Facebook Page</span>
						</button>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Column 1: Editor & Inputs */}
				<div className="lg:col-span-7 space-y-6">
					
					{/* ── Personal Profile Warning Banner ── */}
					{connectedAccount && (connectedAccount.accountId?.startsWith('personal:') || connectedAccount.accountName?.endsWith('(Personal)')) && (
						<div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
							<div className="flex items-start gap-3">
								<div className="p-2 bg-amber-100 rounded-xl flex-shrink-0">
									<AlertTriangle className="w-5 h-5 text-amber-600" />
								</div>
								<div className="flex-1 min-w-0">
									<h3 className="font-bold text-amber-900 text-sm mb-1">Facebook Page Required for Publishing</h3>
									<p className="text-amber-800 text-xs leading-relaxed mb-3">
										You&apos;re connected as a <strong>personal Facebook profile</strong>. Meta has permanently removed the ability to post to personal timelines via API. To publish from this studio, you need a <strong>Facebook Page</strong> (Business or Creator).
									</p>
									<div className="flex flex-wrap gap-2">
										<a
											href="https://www.facebook.com/pages/create"
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1877F2] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
										>
											<Facebook className="w-3.5 h-3.5 fill-current" />
											Create a Free Facebook Page
										</a>
										<button
											onClick={handleConnect}
											className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition-all border border-amber-300"
										>
											<RefreshCw className="w-3.5 h-3.5" />
											Reconnect (after creating Page)
										</button>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Content Format selector */}

					<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
						<h2 className="font-extrabold text-slate-900 text-sm">Select Content Format</h2>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
							{mediaTypeOptions.map((opt) => (
								<button key={opt.id} onClick={() => { setMediaType(opt.id); setUploadedImages([]); setUploadedVideo(null); setGeneratedImageUrl(null); setGeneratedVideoUrl(null); setCarouselSlides([]); }}
									className={`p-3.5 border rounded-xl flex flex-col items-center text-center space-y-2 transition-all ${
										mediaType === opt.id 
											? 'border-blue-600 bg-blue-50/50 text-[#1877F2] shadow-sm' 
											: 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500'
									}`}>
									<div className={`p-2 rounded-lg ${mediaType === opt.id ? 'bg-blue-100 text-[#1877F2]' : 'bg-slate-100 text-slate-500'}`}>
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

					{/* Destination Link configuration for LINK Card */}
					{mediaType === 'LINK' && (
						<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
							<h2 className="font-extrabold text-slate-900 text-sm">Destination URL Config</h2>
							<div className="space-y-3">
								<div className="flex gap-2">
									<input type="text" placeholder="https://example.com/some-article-slug" value={destinationUrl} onChange={e => setDestinationUrl(e.target.value)}
										className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
									<button onClick={handleFetchLinkOg} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold">
										Fetch Link Details
									</button>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
									<div className="space-y-1">
										<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">OG Link Title</label>
										<input type="text" placeholder="Card Title" value={ogTitle} onChange={e => setOgTitle(e.target.value)}
											className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
									</div>
									<div className="space-y-1">
										<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">OG Thumbnail URL</label>
										<input type="text" placeholder="https://example.com/cover.png" value={ogThumbnailUrl} onChange={e => setOgThumbnailUrl(e.target.value)}
											className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Media Source Selector (for non-Link posts) */}
					{mediaType !== 'LINK' && (
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
									<div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
										isDragActive ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
									}`}>
										<input {...getInputProps()} />
										<Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
										<p className="text-xs font-bold text-slate-700">Drag & drop your media files here</p>
										<p className="text-[10px] text-slate-400 mt-1">
											{mediaType === 'REEL'
												? 'Supports MP4, MOV, or WEBM Reels (Max 100MB)'
												: mediaType === 'STORY'
												? 'Upload 1 high-resolution story photo'
												: 'Upload standard image files for post/carousel'}
										</p>
									</div>

									{/* Enter Manual URL */}
									<div className="flex space-x-2">
										<input type="text" placeholder="Or enter manual media URL..." value={manualMediaUrl} onChange={(e) => setManualMediaUrl(e.target.value)}
											className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
										{manualMediaUrl && (
											<button onClick={() => setManualMediaUrl('')} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
												<X className="w-3.5 h-3.5" />
											</button>
										)}
									</div>

									{/* Upload List Summary */}
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
										<div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
											<div className="flex items-center space-x-2.5 min-w-0">
												<FileVideo className="w-5 h-5 text-indigo-500 flex-shrink-0" />
												<div className="truncate">
													<p className="text-xs font-bold text-slate-700 truncate">{uploadedVideo.name}</p>
													<p className="text-[10px] text-slate-400 font-semibold">Video file attached</p>
												</div>
											</div>
											<button onClick={() => setUploadedVideo(null)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-4 h-4" /></button>
										</div>
									)}
								</div>
							) : (
								/* AI Studio */
								<div className="space-y-4">
									<div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl border border-slate-800">
										<div className="absolute top-0 right-0 p-4 opacity-10">
											<Sparkles className="w-24 h-24 text-violet-400" />
										</div>

										<div className="space-y-4 relative z-10">
											<div>
												<span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-400 bg-violet-500/20 px-2.5 py-1 rounded-full border border-violet-500/30">AI Generative Engine</span>
												<h3 className="text-sm font-bold text-slate-100 mt-2">Generate media prompt</h3>
											</div>

											<div className="flex gap-2">
												<input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { if (mediaType === 'STORY') handleGenerateImage(); else if (mediaType === 'REEL') handleGenerateVideo(); else handleGenerateImage(); } }}
													placeholder="A hyper-realistic corporate logistics office in high details..."
													className="flex-1 bg-slate-850 border border-slate-750 text-white text-xs rounded-xl px-3.5 py-2.5 focus:border-violet-500 focus:outline-none" />
												
												{mediaType === 'REEL' ? (
													<button onClick={handleGenerateVideo} disabled={isGeneratingVideo || !aiPrompt.trim()} className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1 hover:scale-105 active:scale-95 transition-all">
														{isGeneratingVideo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Sparkles className="w-3.5 h-3.5" /><span>Gen Video</span></>}
													</button>
												) : (
													<button onClick={handleGenerateImage} disabled={isGeneratingImage || !aiPrompt.trim()} className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1 hover:scale-105 active:scale-95 transition-all">
														{isGeneratingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Sparkles className="w-3.5 h-3.5" /><span>Gen Image</span></>}
													</button>
												)}
											</div>
										</div>
									</div>

									{/* AI Previews */}
									{isGeneratingImage && (
										<div className="h-48 border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2 bg-slate-50/50 animate-pulse">
											<div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
											<span className="text-xs font-semibold text-slate-400">Pollinations AI generating image...</span>
										</div>
									)}

									{isGeneratingVideo && (
										<div className="h-48 border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2 bg-slate-50/50 animate-pulse">
											<div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
											<span className="text-xs font-semibold text-slate-400">Fal.ai Minimax generating video (approx. 1-2 mins)...</span>
										</div>
									)}

									{generatedImageUrl && (
										<div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 group max-h-[300px]">
											<img src={generatedImageUrl} alt="Generated UI" className="w-full h-full object-contain" />
											<div className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-md text-[9px] font-bold text-white px-2 py-0.5 rounded flex items-center space-x-1">
												<Sparkles className="w-2.5 h-2.5 text-violet-400" />
												<span>✨ Pollinations AI</span>
											</div>
											<a href={generatedImageUrl} download="ai_image.png" className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-lg text-slate-700 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
												<Download className="w-3.5 h-3.5" />
											</a>
										</div>
									)}

									{generatedVideoUrl && (
										<div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 max-h-[300px]">
											<video src={generatedVideoUrl} controls className="w-full h-full object-contain" />
											<div className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-md text-[9px] font-bold text-white px-2 py-0.5 rounded flex items-center space-x-1">
												<FileVideo className="w-2.5 h-2.5 text-violet-400" />
												<span>🎬 Fal.ai Minimax</span>
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					)}

					{/* Caption & Hashtag Input */}
					<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
						<h2 className="font-extrabold text-slate-900 text-sm">Caption & Metadata</h2>

						{/* AI Booster Prompt Input */}
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

						<textarea placeholder="Write something on this Facebook Page..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={5}
							className="w-full border border-slate-200 rounded-xl p-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
						<p className="text-[10px] font-bold text-slate-400 text-right">{caption.length} / 63,206</p>

						{/* Tags */}
						<div className="space-y-2 pt-2 border-t border-slate-100">
							<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hashtags</label>
							<div className="flex flex-wrap gap-1.5">
								{hashtags.map((tag) => (
									<span key={tag} className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-600 rounded-full transition-colors">
										<span>#{tag}</span>
										<button onClick={() => removeHashtag(tag)} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
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
							<div className="space-y-2.5">
								<div className="flex justify-between items-center text-xs font-bold">
									<span className="text-blue-400">Uploading assets to Facebook...</span>
									<span>{uploadProgress}%</span>
								</div>
								<div className="h-1.5 w-full bg-slate-850 rounded-full overflow-hidden">
									<div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
								</div>
							</div>
						)}

						{publishedPostUrl && (
							<div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
								<div className="space-y-0.5">
									<p className="text-xs font-bold text-emerald-400">Published successfully!</p>
									<p className="text-[10px] text-slate-400 font-semibold">Your post is now live on Meta Facebook.</p>
								</div>
								<a href={publishedPostUrl} target="_blank" rel="noopener noreferrer"
									className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95">
									<ExternalLink className="w-3.5 h-3.5" />
									<span>View Post</span>
								</a>
							</div>
						)}

						{/* Interactive Dropdown for Scheduling */}
						<div className="flex items-center space-x-3 pt-2">
							<div className="relative flex-1" ref={schedMenuRef}>
								<button onClick={() => setIsSchedMenuOpen(prev => !prev)}
									className="w-full bg-slate-850 border border-slate-750 text-slate-200 rounded-xl px-4 py-3 text-xs font-bold flex items-center justify-between hover:bg-slate-800 transition-colors">
									<span className="flex items-center space-x-2">
										<Clock className="w-4 h-4 text-blue-400" />
										<span>Timeframe: {getPublishOptionLabel(schedOption)}</span>
									</span>
									<span className="text-xs text-slate-500 font-black">▼</span>
								</button>

								{/* Dropdown container */}
								{isSchedMenuOpen && (
									<div className="absolute bottom-full mb-2 left-0 w-[300px] bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 text-slate-900 z-50 animate-slide-up">
										{schedMenuSubView === 'options' ? (
											<div className="space-y-1">
												<p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider pb-2 border-b border-slate-100">Scheduling Options</p>
												
												<button onClick={() => { setSchedOption('next_available'); setIsSchedMenuOpen(false); }}
													className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 rounded-lg flex items-center justify-between">
													<span>Next Available Slot</span>
													<span className="text-[10px] text-slate-400 font-medium">Auto-timed</span>
												</button>
												<button onClick={() => { setSchedOption('prioritize'); setIsSchedMenuOpen(false); }}
													className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 rounded-lg flex items-center justify-between">
													<span>Prioritize Posting</span>
													<span className="text-[10px] text-slate-400 font-medium">Earliest queue</span>
												</button>
												<button onClick={() => { setSchedOption('now'); setIsSchedMenuOpen(false); }}
													className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 rounded-lg flex items-center justify-between text-blue-600">
													<span>Publish Now</span>
													<span className="text-[10px] text-blue-400 font-medium">Bypass queue</span>
												</button>
												
												<div className="border-t border-slate-100 my-2 pt-2">
													<button onClick={() => setSchedMenuSubView('calendar')}
														className="w-full px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold text-center">
														Set Date and Time
													</button>
												</div>
											</div>
										) : (
											/* Calendar picker subview */
											<div className="space-y-4">
												<div className="flex items-center justify-between border-b border-slate-100 pb-2">
													<button onClick={() => setSchedMenuSubView('options')} className="text-slate-400 hover:text-slate-600 p-1"><ChevronLeft className="w-4 h-4" /></button>
													<span className="text-xs font-black">{monthNames[calMonth]} {calYear}</span>
													<div className="flex space-x-1">
														<button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronLeft className="w-3.5 h-3.5" /></button>
														<button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronRight className="w-3.5 h-3.5" /></button>
													</div>
												</div>

												{/* Mini Grid Calendar */}
												<div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold">
													{["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => <span key={d} className="text-slate-400 py-1">{d}</span>)}
													{Array.from({ length: (firstDayIndex === 0 ? 6 : firstDayIndex - 1) }).map((_, idx) => <span key={`empty-${idx}`} />)}
													{Array.from({ length: daysInMonth }).map((_, idx) => {
														const dayNum = idx + 1;
														const isSelected = selectedDate.getDate() === dayNum && selectedDate.getMonth() === calMonth && selectedDate.getFullYear() === calYear;
														return (
															<button key={dayNum} onClick={() => handleDateSelect(dayNum)}
																className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center transition-colors font-bold ${
																	isSelected ? 'bg-[#1877F2] text-white shadow-sm' : 'hover:bg-slate-100 text-slate-700'
																}`}>
																{dayNum}
															</button>
														);
													})}
												</div>

												{/* Time select inputs */}
												<div className="border-t border-slate-100 pt-3.5 flex items-center justify-between gap-2">
													<div className="flex items-center space-x-1.5 flex-1 justify-center">
														<input type="text" maxLength={2} value={timeHours}
															onChange={e => setTimeHours(e.target.value)}
															onBlur={() => {
																const val = Math.min(23, Math.max(0, parseInt(timeHours || '0')));
																setTimeHours(String(val).padStart(2, '0'));
															}}
															className="w-12 border border-slate-200 rounded-lg px-2.5 py-1.5 text-center text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500" />
														<span className="font-bold">:</span>
														<input type="text" maxLength={2} value={timeMinutes}
															onChange={e => setTimeMinutes(e.target.value)}
															onBlur={() => {
																const val = Math.min(59, Math.max(0, parseInt(timeMinutes || '0')));
																setTimeMinutes(String(val).padStart(2, '0'));
															}}
															className="w-12 border border-slate-200 rounded-lg px-2.5 py-1.5 text-center text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500" />
														<span className="text-[10px] text-slate-400 font-extrabold tracking-wider pl-1">24H</span>
													</div>

													<button onClick={handleSaveCustomTime}
														className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md">
														Apply
													</button>
												</div>
											</div>
										)}
									</div>
								)}
							</div>

							<button onClick={() => handlePublishPost()} disabled={isPublishing}
								className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 text-xs font-bold flex items-center justify-center space-x-1.5 active:scale-95 transition-all shadow-lg shadow-blue-900/35">
								<Send className="w-3.5 h-3.5" />
								<span>Publish Option</span>
							</button>
						</div>
					</div>
				</div>

				{/* Column 2: Live Facebook Post Mockup Preview */}
				<div className="lg:col-span-5 space-y-6">
					<div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-inner space-y-4">
						<div className="flex items-center justify-between border-b border-slate-200 pb-2">
							<p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Feed Preview Mockup</p>
							<span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
						</div>

						{/* Facebook Post Card Preview */}
						<div className="w-full max-w-[500px] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden font-sans text-slate-900 animate-fade-in transition-all">
							
							{/* Header */}
							<div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white">
								<div className="flex items-center space-x-3">
									<div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1877F2] to-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md ring-2 ring-blue-100 flex-shrink-0">
										{(connectedAccount?.accountName || 'FB').charAt(0).toUpperCase()}
									</div>
									<div>
										<div className="flex items-center space-x-1.5">
											<span className="font-bold text-sm text-slate-900">@{connectedAccount ? connectedAccount.accountName : 'yourhandle'}</span>
											<CheckCircle className="w-4 h-4 fill-[#1877F2] text-white flex-shrink-0" />
										</div>
										<div className="flex items-center space-x-1 text-xs text-slate-400 font-medium">
											<span>Just now</span>
											<span>•</span>
											<span className="text-slate-500">🌐 Public</span>
											<span>•</span>
											<span className="text-[#1877F2] font-bold">Facebook</span>
										</div>
									</div>
								</div>

								<button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
									<span className="text-slate-400 font-black text-sm">•••</span>
								</button>
							</div>

							{/* Caption Text */}
							<div className="px-4 py-3 text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line bg-white">
								{caption || 'No commentary entered yet. Type some text to generate preview...'}
								{hashtags.length > 0 && (
									<p className="text-[#1877F2] font-semibold mt-2">
										{hashtags.map(t => `#${t}`).join(' ')}
									</p>
								)}
							</div>

							{/* Media Display */}
							{mediaType === 'LINK' ? (
								/* LINK Card style */
								<a href={destinationUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full border-y border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 transition-colors cursor-pointer group">
									{getFinalMediaPreview() ? (
										<div className="relative w-full h-48 sm:h-56 bg-slate-900 overflow-hidden">
											<img src={getFinalMediaPreview()} alt="Link Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
										</div>
									) : (
										<div className="h-32 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 border-b border-slate-800 p-5 flex flex-col justify-between text-white relative overflow-hidden">
											<div className="absolute right-3 top-3 text-white/10 font-black text-6xl select-none pointer-events-none">🌐</div>
											<span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-400/30 w-fit">
												LINK PREVIEW
											</span>
											<h3 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug drop-shadow-md">
												{ogTitle || 'Visit Link Destination'}
											</h3>
										</div>
									)}
									<div className="p-3.5 bg-[#F2F4F7] border-t border-slate-200/60 space-y-1">
										<div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate flex items-center space-x-1">
											<span>{destinationUrl ? new URL(destinationUrl.startsWith('http') ? destinationUrl : 'https://' + destinationUrl).hostname.replace('www.', '') : 'DOMAIN.COM'}</span>
											<ExternalLink className="w-3 h-3 text-slate-400" />
										</div>
										<h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-650 transition-colors">
											{ogTitle || 'Learn More Details'}
										</h4>
										{ogDesc && <p className="text-[11px] text-slate-500 line-clamp-1">{ogDesc}</p>}
									</div>
								</a>
							) : getFinalMediaPreview() ? (
								/* Standard POST / REEL / STORY images or videos */
								<div className="w-full bg-slate-100 overflow-hidden border-y border-slate-100 relative">
									{mediaType === 'REEL' ? (
										<video src={getFinalMediaPreview()} controls={false} autoPlay muted loop playsInline className="w-full h-full object-contain max-h-[400px]" />
									) : (
										<img src={getFinalMediaPreview()} alt="Facebook Preview" className="w-full h-auto object-cover max-h-[350px]" />
									)}

									{/* Multi-slide carousel indicators */}
									{(carouselSlides.length > 1 || uploadedImages.length > 1) && (
										<div className="absolute bottom-3 right-3 bg-slate-900/65 text-white px-2 py-0.5 rounded-md text-[9px] font-extrabold">
											{activeSlideIdx + 1} / {uploadMode === 'ai' ? carouselSlides.length : uploadedImages.length}
										</div>
									)}
								</div>
							) : null}

							{/* Carousel Nav buttons */}
							{(mediaType === 'POST' && (uploadMode === 'ai' ? carouselSlides.length > 1 : uploadedImages.length > 1)) && (
								<div className="flex justify-between items-center px-4 py-2 border-b border-slate-100 bg-slate-50/50">
									<span className="text-[10px] text-slate-400 font-bold">Infographic Carousel Pages</span>
									<div className="flex space-x-1">
										<button onClick={() => setActiveSlideIdx(i => Math.max(0, i - 1))} className="p-1 hover:bg-slate-200 rounded text-slate-600"><ChevronLeft className="w-3.5 h-3.5" /></button>
										<button onClick={() => setActiveSlideIdx(i => Math.min((uploadMode === 'ai' ? carouselSlides.length : uploadedImages.length) - 1, i + 1))} className="p-1 hover:bg-slate-200 rounded text-slate-600"><ChevronRight className="w-3.5 h-3.5" /></button>
									</div>
								</div>
							)}

							{/* Facebook Engagement & Reactions Bar */}
							<div className="px-4 py-2.5 flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 bg-white">
								<div className="flex items-center space-x-1.5">
									<div className="flex -space-x-1">
										<span className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[10px] font-black shadow-sm ring-1 ring-white">👍</span>
										<span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black shadow-sm ring-1 ring-white">❤️</span>
									</div>
									<span className="font-semibold text-slate-700">128</span>
								</div>
								<div className="flex items-center space-x-3 font-medium text-slate-500">
									<span>12 comments</span>
									<span>•</span>
									<span>5 shares</span>
								</div>
							</div>

							{/* Interactive Action Buttons */}
							<div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50 py-1">
								<button className="py-2 flex items-center justify-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-all hover:bg-slate-100">
									<ThumbsUp className="w-4 h-4" />
									<span>Like</span>
								</button>
								<button className="py-2 flex items-center justify-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-all hover:bg-slate-100">
									<MessageSquare className="w-4 h-4" />
									<span>Comment</span>
								</button>
								<button className="py-2 flex items-center justify-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-all hover:bg-slate-100">
									<Share2 className="w-4 h-4" />
									<span>Share</span>
								</button>
							</div>

						</div>

						{/* History Panel */}
						<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
							<div className="flex items-center justify-between border-b border-slate-100 pb-3">
								<h3 className="font-extrabold text-slate-900 text-sm">Publish History</h3>
								<button onClick={refreshHistory} disabled={isRefreshingHistory}
									className="text-slate-400 hover:text-slate-600 transition-colors p-1">
									<RefreshCw className={`w-3.5 h-3.5 ${isRefreshingHistory ? 'animate-spin text-blue-650' : ''}`} />
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
									<Facebook className="w-8 h-8 mx-auto mb-2 text-slate-350 fill-current" />
									<p className="text-[11px] font-semibold">No recent updates published.</p>
								</div>
							) : (
								<div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
									{history.map((post) => (
										<div key={post.id} className="p-3 border border-slate-100 hover:border-slate-200 bg-slate-50/50 rounded-xl flex items-start justify-between text-xs transition-all">
											<div className="space-y-1 pr-3 flex-1 min-w-0">
												<p className="text-slate-800 font-bold truncate">{post.caption}</p>
												<div className="flex items-center space-x-2 text-[10px] text-slate-500 font-semibold">
													<span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#1877F2] text-[9px] font-extrabold uppercase">{post.format}</span>
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
