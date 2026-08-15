'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
	Twitter,
	Upload,
	CheckCircle,
	AlertTriangle,
	Sparkles,
	RefreshCw,
	ExternalLink,
	BarChart3,
	Image as ImageIcon,
	Video,
	Plus,
	X,
	Check,
	Clock,
	AlertCircle,
	Wand2,
	Play,
	Zap,
	Trash2,
	Eye,
	MessageCircle,
	Heart,
	Repeat,
	Share,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface XAccount {
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

const getPublishOptionLabel = (option: string) => {
	switch (option) {
		case 'prioritize': return 'Prioritize';
		case 'next_available': return 'Next Available';
		case 'now': return 'Publish Now';
		default: return 'Custom';
	}
};

const MockPlaceholder = () => (
	<div className="flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
		<svg 
			width="80" 
			height="100" 
			viewBox="0 0 160 190" 
			fill="none" 
			xmlns="http://www.w3.org/2000/svg"
			className="opacity-60 animate-pulse"
			style={{ animationDuration: '3.5s' }}
		>
			<rect x="20" y="28" width="120" height="150" rx="14" fill="#15181c" stroke="#2f3336" strokeWidth="2.5" />
			<circle cx="38" cy="46" r="7" fill="#2f3336" />
			<rect x="50" y="41" width="55" height="3" rx="1.5" fill="#2f3336" />
			<rect x="50" y="48" width="35" height="3" rx="1.5" fill="#2f3336" />
			<rect x="28" y="62" width="104" height="106" rx="8" fill="#0c0e12" />
		</svg>
		<p className="text-[10px] text-slate-400 font-bold tracking-wide mt-3.5 normal-case">
			Your post preview will appear here
		</p>
	</div>
);

export default function XStudioPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [connectedAccount, setConnectedAccount] = useState<XAccount | null>(null);
	const [isConnecting, setIsConnecting] = useState(false);
	const [notification, setNotification] = useState<string | null>(null);
	const [isLoadingHistory, setIsLoadingHistory] = useState(true);
	const [isLoadingAccount, setIsLoadingAccount] = useState(true);

	// Caption & hashtags (X has a 280 character limit)
	const [caption, setCaption] = useState('');
	const [hashtags, setHashtags] = useState<string[]>(['tech', 'ai', 'startup']);
	const [hashtagInput, setHashtagInput] = useState('');

	// Media Input Mode: 'upload' (Direct computer upload) | 'ai' (AI generated)
	const [uploadMode, setUploadMode] = useState<'upload' | 'ai'>('upload');

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

	// AI Generation states (Image/Video)
	const [aiPrompt, setAiPrompt] = useState('');
	const [isBoosting, setIsBoosting] = useState(false);
	const [isGeneratingImage, setIsGeneratingImage] = useState(false);
	const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
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
		setTimeout(() => setNotification(null), 4000);
	};

	// Dropzone configs
	const onDrop = useCallback((acceptedFiles: File[]) => {
		if (acceptedFiles.length === 0) return;

		const firstFile = acceptedFiles[0];
		if (firstFile.type.startsWith('video/')) {
			const url = URL.createObjectURL(firstFile);
			setUploadedVideo({ file: firstFile, url, name: firstFile.name });
			setUploadedImages([]);
			showToast(`🎬 Attached video: ${firstFile.name}`);
		} else if (firstFile.type.startsWith('image/')) {
			const newImages = acceptedFiles.filter(f => f.type.startsWith('image/')).map(file => ({
				file,
				url: URL.createObjectURL(file),
				name: file.name
			}));
			setUploadedImages(prev => [...prev, ...newImages].slice(0, 4)); // X limits to 4 images
			setUploadedVideo(null);
			showToast(`📸 Attached ${newImages.length} image(s).`);
		}
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
			'video/*': ['.mp4', '.mov']
		},
		multiple: true
	});

	// Check if browser notifications are allowed
	useEffect(() => {
		if (typeof window !== 'undefined' && 'Notification' in window) {
			if (Notification.permission === 'granted') {
				setNotifyOnComplete(true);
			}
		}
	}, []);

	// Handle scheduling options outside clicks
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (schedMenuRef.current && !schedMenuRef.current.contains(event.target as Node)) {
				setIsSchedMenuOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Fetch X account connection status
	const checkAccountStatus = useCallback(async () => {
		try {
			setIsLoadingAccount(true);
			const res = await fetch('/api/social/accounts');
			if (res.ok) {
				const data = await res.json();
				const accounts = data.accounts || [];
				const xChan = accounts.find((c: any) => c.platform === 'x' || c.platform === 'twitter');
				if (xChan) {
					setConnectedAccount({
						accountId: xChan.accountId || xChan.accountName,
						accountName: xChan.accountName,
						connected: true,
					});
				} else {
					setConnectedAccount(null);
				}
			}
		} catch (err) {
			console.error('Error checking X account:', err);
		} finally {
			setIsLoadingAccount(false);
		}
	}, []);

	// Fetch publish history
	const fetchHistory = useCallback(async () => {
		try {
			setIsLoadingHistory(true);
			const res = await fetch('/api/social/schedule?platform=x');
			if (res.ok) {
				const data = await res.json();
				setHistory(data.posts || []);
			}
		} catch (err) {
			console.error('Error fetching X history:', err);
		} finally {
			setIsLoadingHistory(false);
		}
	}, []);

	useEffect(() => {
		checkAccountStatus();
		fetchHistory();
	}, [checkAccountStatus, fetchHistory]);

	// Check if coming back from OAuth flow
	useEffect(() => {
		const connected = searchParams.get('connected');
		if (connected === 'x' || connected === 'twitter') {
			showToast('🎉 Connected X (Twitter) channel successfully!');
			checkAccountStatus();
			const newUrl = window.location.pathname;
			window.history.replaceState({}, '', newUrl);
		}
	}, [searchParams, checkAccountStatus]);

	const refreshHistory = async () => {
		setIsRefreshingHistory(true);
		await fetchHistory();
		setIsRefreshingHistory(false);
		showToast('🔄 Publish history refreshed');
	};

	// Correct POST request to initiate Connection
	const handleConnect = async () => {
		setIsConnecting(true);
		try {
			const res = await fetch('/api/social/connect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ platform: 'x', returnTo: window.location.pathname }),
			});
			const data = await res.json();
			if (res.ok && data.url) {
				window.location.href = data.url;
			} else {
				if (data.demo) {
					setConnectedAccount({
						accountId: 'x_demo_channel_id',
						accountName: 'X Demo Creator',
						connected: true,
					});
					showToast('Connected in Demo Mode! (Client credentials not configured)');
				} else {
					showToast(data.error || 'Failed to start connection.');
				}
			}
		} catch (err) {
			console.error('Connect error:', err);
			showToast('Failed to start connection.');
		} finally {
			setIsConnecting(false);
		}
	};

	// Handle notification prompt
	const toggleNotificationPermission = async () => {
		if (notifyOnComplete) {
			setNotifyOnComplete(false);
			return;
		}
		if ('Notification' in window) {
			const permission = await Notification.requestPermission();
			if (permission === 'granted') {
				setNotifyOnComplete(true);
				showToast('🔔 Desktop notifications enabled for publish events!');
			} else {
				showToast('⚠️ Notification permission was denied.');
			}
		} else {
			showToast('❌ Notifications are not supported by your browser.');
		}
	};

	// AI boosts
	const generateAICaption = async () => {
		try {
			setIsBoosting(true);
			const response = await fetch('/api/ai/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					prompt: caption || 'Write a engaging, highly professional tech startup announcement tweet',
					systemPrompt: `You are a professional social media manager. Write a concise, impactful tweet. Strict limit: 250 characters. Do not use quotes around the output.`,
					includeBrandProfile,
				}),
			});
			if (!response.ok) throw new Error('AI generation failed.');
			const data = await response.json();
			if (data.text) {
				setCaption(data.text.slice(0, 280));
				showToast('✨ AI SEO Boost Applied!');
			}
		} catch (err: any) {
			showToast(`Error: ${err.message}`);
		} finally {
			setIsBoosting(false);
		}
	};

	const generateAIImage = async () => {
		if (!aiPrompt) {
			showToast('Please type a creative prompt first!');
			return;
		}
		try {
			setIsGeneratingImage(true);
			const res = await fetch('/api/ai/generate-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: aiPrompt }),
			});
			if (!res.ok) throw new Error('Image generation failed.');
			const data = await res.json();
			if (data.imageUrl) {
				setGeneratedImageUrl(data.imageUrl);
				setUploadedImages([]);
				setUploadedVideo(null);
				showToast('🎨 AI Art created using Pollinations.ai!');
			}
		} catch (err: any) {
			showToast(`Error: ${err.message}`);
		} finally {
			setIsGeneratingImage(false);
		}
	};

	// Form Submission: Publish standard tweet or queue schedule
	const handlePublish = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!connectedAccount) {
			showToast('Please connect an X channel first.');
			return;
		}
		if (!caption.trim() && uploadedImages.length === 0 && !generatedImageUrl && !uploadedVideo && !manualMediaUrl) {
			showToast('Please write some text or attach a media file first.');
			return;
		}

		try {
			setIsPublishing(true);
			setUploadProgress(10);

			let mediaUrlToUse = manualMediaUrl || generatedImageUrl || '';
			let localFilesToUpload: File[] = [];

			if (uploadedVideo) {
				localFilesToUpload = [uploadedVideo.file];
			} else if (uploadedImages.length > 0) {
				localFilesToUpload = uploadedImages.map(img => img.file);
			}

			// Phase 1: Upload files to /api/upload if local files exist
			if (localFilesToUpload.length > 0) {
				setUploadProgress(25);
				const formData = new FormData();
				localFilesToUpload.forEach(file => formData.append('files', file));
				
				const uploadRes = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});
				if (!uploadRes.ok) throw new Error('Failed to upload local media to server.');
				const uploadData = await uploadRes.json();
				if (uploadData.urls && uploadData.urls.length > 0) {
					mediaUrlToUse = uploadData.urls[0];
				}
				setUploadProgress(60);
			}

			// Phase 2: Post to scheduler
			setUploadProgress(80);
			const scheduledTimeStr = schedOption === 'custom' && customSchedDate ? customSchedDate : undefined;

			const bodyPayload = {
				platform: 'x',
				caption,
				imageUrl: uploadedVideo ? undefined : (mediaUrlToUse || undefined),
				videoUrl: uploadedVideo ? mediaUrlToUse : undefined,
				scheduledAt: scheduledTimeStr,
				publishNow: schedOption === 'now',
				publishOption: schedOption,
			};

			const publishRes = await fetch('/api/social/schedule', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(bodyPayload),
			});

			if (!publishRes.ok) {
				const errorData = await publishRes.json();
				throw new Error(errorData.error || 'Failed to schedule post.');
			}

			setUploadProgress(100);
			const resData = await publishRes.json();

			if (schedOption === 'now') {
				showToast('🎉 Tweet published successfully onto X!');
				if (resData.post?.url) {
					setPublishedPostUrl(resData.post.url);
				}
			} else {
				showToast(`📅 Scheduled successfully for ${getPublishOptionLabel(schedOption)}!`);
			}

			// Reset forms
			setCaption('');
			setUploadedImages([]);
			setUploadedVideo(null);
			setGeneratedImageUrl(null);
			setManualMediaUrl('');
			setAiPrompt('');
			
			// Refresh list
			fetchHistory();

			// Trigger desktop notification
			if (notifyRef.current && 'Notification' in window && Notification.permission === 'granted') {
				new Notification('ShramEco Auto Studio', {
					body: schedOption === 'now' ? 'Your tweet is live on X!' : `Tweet scheduled for ${getPublishOptionLabel(schedOption)}.`,
					icon: '/favicon.ico',
				});
			}

		} catch (err: any) {
			showToast(`Publishing failed: ${err.message}`);
		} finally {
			setIsPublishing(false);
			setTimeout(() => setUploadProgress(0), 1000);
		}
	};

	// Calendly Calendar calculation helpers
	const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
	const getFirstDayOfMonth = (month: number, year: number) => {
		const day = new Date(year, month, 1).getDay();
		return day === 0 ? 6 : day - 1; // start on Monday
	};

	const handlePrevMonth = () => {
		if (calMonth === 0) {
			setCalMonth(11);
			setCalYear(prev => prev - 1);
		} else {
			setCalMonth(prev => prev - 1);
		}
	};

	const handleNextMonth = () => {
		if (calMonth === 11) {
			setCalMonth(0);
			setCalYear(prev => prev + 1);
		} else {
			setCalMonth(prev => prev + 1);
		}
	};

	const handleDateSelect = (day: number) => {
		const targetDate = new Date(calYear, calMonth, day);
		setSelectedDate(targetDate);
		
		const hours = parseInt(timeHours, 10) || 9;
		const mins = parseInt(timeMinutes, 10) || 0;
		targetDate.setHours(hours, mins, 0, 0);

		setCustomSchedDate(targetDate.toISOString());
		setSchedOption('custom');
		setSchedMenuSubView('options');
	};

	const handleTimeBlur = () => {
		let hr = parseInt(timeHours, 10);
		if (isNaN(hr) || hr < 0) hr = 0;
		if (hr > 23) hr = 23;
		const hrStr = hr.toString().padStart(2, '0');
		setTimeHours(hrStr);

		let min = parseInt(timeMinutes, 10);
		if (isNaN(min) || min < 0) min = 0;
		if (min > 59) min = 59;
		const minStr = min.toString().padStart(2, '0');
		setTimeMinutes(minStr);

		const updatedDate = new Date(selectedDate);
		updatedDate.setHours(hr, min, 0, 0);
		setSelectedDate(updatedDate);
		setCustomSchedDate(updatedDate.toISOString());
	};

	const handleHashtagKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			const tag = hashtagInput.trim().replace(/^#/, '');
			if (tag && !hashtags.includes(tag)) {
				setHashtags(prev => [...prev, tag]);
				setCaption(prev => {
					const cleanCap = prev.trim();
					return cleanCap ? `${cleanCap} #${tag}` : `#${tag}`;
				});
			}
			setHashtagInput('');
		}
	};

	const removeHashtag = (tag: string) => {
		setHashtags(prev => prev.filter(t => t !== tag));
		setCaption(prev => prev.replace(new RegExp(`#${tag}\\b`, 'gi'), '').trim());
	};

	// Character counter math
	const charCount = caption.length;
	const isOverLimit = charCount > 280;
	const charPercent = Math.min((charCount / 280) * 100, 100);

	return (
		<div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24 text-slate-900">
			
			{/* Notification Toast */}
			{notification && (
				<div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[10000] animate-fade-in-down">
					<div className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-700">
						<CheckCircle className="w-5 h-5 text-emerald-400" />
						<span className="font-semibold text-sm">{notification}</span>
					</div>
				</div>
			)}

			{/* Page Header Layout matching YouTube */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<div className="flex items-center space-x-3 mb-1">
						<div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-950/20">
							<Twitter className="w-6 h-6 text-white fill-current" />
						</div>
						<div className="flex items-center space-x-2.5">
							<h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">X (Twitter) Studio</h1>
							<span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase shadow-xs flex items-center gap-1.5 select-none">
								<Clock className="w-3.5 h-3.5" />
								Coming Soon
							</span>
						</div>
					</div>
					<p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">
						White-labeled posting & scheduling pipeline (Under Development)
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<Button
						variant="secondary"
						onClick={toggleNotificationPermission}
						icon={<span className="text-xs">{notifyOnComplete ? '🔔' : '🔕'}</span>}
					>
						{notifyOnComplete ? 'Notifications On' : 'Notifications Off'}
					</Button>

					<Link href="/dashboard/insights?platform=x">
						<Button variant="secondary" icon={<BarChart3 className="w-4 h-4" />}>
							Analytics
						</Button>
					</Link>
				</div>
			</div>

			{/* Coming Soon Notice Banner */}
			<div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-start space-x-3 shadow-xs">
				<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
				<div className="text-xs space-y-1">
					<p className="font-extrabold text-sm text-amber-800 dark:text-amber-300">Twitter / X Integration — Coming Soon</p>
					<p className="font-semibold text-amber-700 dark:text-amber-300/80 leading-relaxed">
						X (Twitter) publishing and analytics integration is currently under active development and will be released soon. In the meantime, feel free to use Facebook Studio for live automated publishing, Reels, Stories, and Carousels!
					</p>
				</div>
			</div>

			{/* Connection Banner */}
			{!isLoadingAccount && !connectedAccount && (
				<GlassCard className="p-8 bg-gradient-to-tr from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl overflow-hidden relative">
					<div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
					<div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
						<div className="space-y-2.5 max-w-xl text-center md:text-left">
							<span className="text-[10px] font-black tracking-widest uppercase bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">Connect X Channel</span>
							<h2 className="text-xl font-extrabold tracking-tight">Connect your X (Twitter) Channel to ShramEco Auto Studio</h2>
							<p className="text-slate-300 text-xs font-medium leading-relaxed">
								Link your profile to auto-publish updates, schedule tweets, and boost engagement using AI presets.
							</p>
						</div>

						<Button
							variant="secondary"
							onClick={handleConnect}
							isLoading={isConnecting}
							icon={<Twitter className="w-4 h-4 fill-current text-slate-900" />}
							className="bg-white hover:bg-slate-100 text-slate-950 px-6 py-3 rounded-2xl font-black transition-all"
						>
							Connect X Profile
						</Button>
					</div>
				</GlassCard>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				
				{/* Column Left: Creator Form (Grid Span 7) */}
				<form onSubmit={handlePublish} className="lg:col-span-7 space-y-6">
					<GlassCard className="p-6 space-y-6 bg-white border border-slate-200 shadow-sm">
						
						{/* Channel status banner */}
						<div className="flex items-center justify-between border-b border-slate-100 pb-4">
							<div className="flex items-center space-x-3">
								<div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-black border border-slate-200">
									{connectedAccount ? connectedAccount.accountName.charAt(0).toUpperCase() : '?'}
								</div>
								<div>
									<h4 className="text-xs font-bold text-slate-800">{connectedAccount ? connectedAccount.accountName : 'Disconnected'}</h4>
									<p className="text-[10px] font-semibold text-slate-400">
										{connectedAccount ? `Connected X Profile` : 'Connect your account to start'}
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
								<div className={`w-2 h-2 rounded-full ${connectedAccount ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
								<span className="text-[10px] font-black uppercase text-slate-500">{connectedAccount ? 'Active' : 'Offline'}</span>
							</div>
						</div>

						{/* Caption box */}
						<div className="space-y-2">
							<div className="flex justify-between items-center text-xs font-bold text-slate-500">
								<span>Compose Tweet Text</span>
								<span className={isOverLimit ? 'text-red-500 font-extrabold' : 'text-slate-400'}>
									{charCount} / 280
								</span>
							</div>
							
							<div className="relative">
								<textarea
									value={caption}
									onChange={(e) => setCaption(e.target.value.slice(0, 500))}
									placeholder="What is happening today? Share tech updates, announcements, or AI innovations..."
									className={`w-full min-h-[160px] p-5 border rounded-2xl text-xs font-semibold leading-relaxed focus:outline-none transition-all resize-none ${
										isOverLimit 
											? 'border-red-300 bg-red-50/10 focus:ring-2 focus:ring-red-200 text-slate-900' 
											: 'border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 text-slate-900'
									}`}
								/>
								
								<div className="absolute bottom-3.5 right-3.5">
									<svg className="w-5 h-5 transform -rotate-90">
										<circle cx="10" cy="10" r="8" stroke="#F1F5F9" strokeWidth="2.5" fill="transparent" />
										<circle
											cx="10"
											cy="10"
											r="8"
											stroke={isOverLimit ? '#EF4444' : charCount > 250 ? '#F59E0B' : '#3B82F6'}
											strokeWidth="2.5"
											fill="transparent"
											strokeDasharray={2 * Math.PI * 8}
											strokeDashoffset={2 * Math.PI * 8 * (1 - charPercent / 100)}
											className="transition-all duration-300"
										/>
									</svg>
								</div>
							</div>
						</div>

						{/* Tags Manager */}
						<div>
							<label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tweet Hashtags</label>
							<div className="bg-white border border-slate-200 rounded-xl p-3 focus-within:border-slate-400 transition-colors shadow-sm space-y-3">
								<div className="flex flex-wrap gap-2 max-h-[85px] overflow-y-auto">
									{hashtags.map(tag => (
										<span
											key={tag}
											className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded-lg border border-slate-200"
										>
											<span>#{tag}</span>
											<button
												type="button"
												onClick={() => removeHashtag(tag)}
												className="text-slate-400 hover:text-red-500 transition-colors ml-1 text-xs"
											>
												&times;
											</button>
										</span>
									))}
									{hashtags.length === 0 && (
										<span className="text-[11px] text-slate-400 font-semibold">No tags added yet. Add keywords below.</span>
									)}
								</div>
								<div className="flex gap-2 pt-1 border-t border-slate-50">
									<input
										type="text"
										placeholder="Add tag (press Enter)"
										value={hashtagInput}
										onChange={(e) => setHashtagInput(e.target.value)}
										onKeyDown={handleHashtagKeyDown}
										className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 text-xs"
									/>
								</div>
							</div>
						</div>

						{/* Media attachment block selector */}
						<div className="space-y-4">
							<div className="flex items-center justify-between border-t border-slate-100 pt-5">
								<label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attach Media Assets</label>
								<div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/50">
									<button
										type="button"
										onClick={() => setUploadMode('upload')}
										className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${uploadMode === 'upload' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
									>
										Upload File
									</button>
									<button
										type="button"
										onClick={() => setUploadMode('ai')}
										className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${uploadMode === 'ai' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
									>
										AI Generator
									</button>
								</div>
							</div>

							{uploadMode === 'upload' ? (
								<div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${isDragActive ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-350 bg-slate-50/50'}`}>
									<input {...getInputProps()} />
									<div className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center mx-auto shadow-sm mb-3">
										<Upload className="w-5 h-5 text-slate-500" />
									</div>
									<p className="text-xs font-bold text-slate-700">Drag files here or click to browse</p>
									<p className="text-[10px] font-semibold text-slate-400 mt-1">Supports PNG, JPEG, WEBP or MP4 (Max 4 images or 1 video)</p>
								</div>
							) : (
								<div className="space-y-4 p-5 bg-gradient-to-br from-indigo-50/50 to-purple-50/20 border border-indigo-100 rounded-2xl">
									<div className="flex items-center space-x-2 text-xs font-extrabold text-indigo-850 mb-1">
										<Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
										<span>AI Art Studio (Pollinations)</span>
									</div>
									<div className="flex gap-2.5">
										<input
											type="text"
											value={aiPrompt}
											onChange={(e) => setAiPrompt(e.target.value)}
											placeholder="Describe the image you want: futuristic startup office, neon lights, isometric 3d render..."
											className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none bg-white shadow-inner text-slate-900"
										/>
										<Button
											type="button"
											onClick={generateAIImage}
											isLoading={isGeneratingImage}
											icon={<Wand2 className="w-3.5 h-3.5" />}
											className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
										>
											Art
										</Button>
									</div>
								</div>
							)}

							{/* Preview media thumbnail row */}
							{(uploadedImages.length > 0 || uploadedVideo || generatedImageUrl || manualMediaUrl) && (
								<div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 border border-slate-200/50 rounded-2xl">
									{uploadedImages.map((img, idx) => (
										<div key={idx} className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shadow-inner bg-white">
											<img src={img.url} alt="Attached thumbnail" className="w-full h-full object-cover" />
											<button
												type="button"
												onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
												className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-900/60 hover:bg-red-500 text-white flex items-center justify-center transition-all"
											>
												<X className="w-2.5 h-2.5" />
											</button>
										</div>
									))}
									
									{uploadedVideo && (
										<div className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shadow-inner bg-black flex items-center justify-center">
											<Video className="w-5 h-5 text-white" />
											<button
												type="button"
												onClick={() => setUploadedVideo(null)}
												className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-900/60 hover:bg-red-500 text-white flex items-center justify-center transition-all"
											>
												<X className="w-2.5 h-2.5" />
											</button>
										</div>
									)}

									{generatedImageUrl && (
										<div className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shadow-inner bg-white">
											<img src={generatedImageUrl} alt="AI Generated" className="w-full h-full object-cover" />
											<button
												type="button"
												onClick={() => setGeneratedImageUrl(null)}
												className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-900/60 hover:bg-red-500 text-white flex items-center justify-center transition-all"
											>
												<X className="w-2.5 h-2.5" />
											</button>
										</div>
									)}
								</div>
							)}
						</div>
					</GlassCard>

					{/* AI SEO presets */}
					<div className="bg-slate-50 border border-slate-200 rounded-3xl p-6.5 space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-2 text-xs font-black text-slate-800">
								<Wand2 className="w-4 h-4 text-purple-600 animate-pulse" />
								<span>AI SEO Copywriter Booster</span>
							</div>

							<label className="flex items-center space-x-1.5 cursor-pointer">
								<input
									type="checkbox"
									checked={includeBrandProfile}
									onChange={(e) => setIncludeBrandProfile(e.target.checked)}
									className="rounded text-indigo-650 w-3.5 h-3.5 focus:ring-0"
								/>
								<span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Apply Brand Guidelines</span>
							</label>
						</div>

						<p className="text-[10px] font-semibold text-slate-400 leading-normal">
							Refine your draft instantly! Select "Apply Brand Guidelines" to automatically adhere to your company's tone, formatting, and key terminology rules.
						</p>

						<Button
							type="button"
							onClick={generateAICaption}
							disabled={isBoosting || !caption}
							className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black"
							icon={isBoosting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
						>
							Re-write Draft using AI Copywriter
						</Button>
					</div>

					{/* Scheduling */}
					<GlassCard className="p-6 space-y-5 bg-white border border-slate-200 shadow-sm">
						<div className="flex items-center justify-between border-b border-slate-100 pb-4">
							<div>
								<h3 className="text-xs font-black text-slate-800 uppercase">Scheduling Engine</h3>
								<p className="text-[10px] font-semibold text-slate-400 mt-0.5">Define publish time slots</p>
							</div>

							<div className="relative" ref={schedMenuRef}>
								<button
									type="button"
									onClick={() => {
										setIsSchedMenuOpen(!isSchedMenuOpen);
										setSchedMenuSubView('options');
									}}
									className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all"
								>
									<Clock className="w-3.5 h-3.5 text-slate-500" />
									<span>{getPublishOptionLabel(schedOption)}</span>
								</button>

								{isSchedMenuOpen && (
									<div className="absolute right-0 bottom-full mb-2 w-80 bg-white border border-slate-200/80 rounded-2xl shadow-2xl z-[999] overflow-hidden animate-slide-up backdrop-blur-xl">
										{schedMenuSubView === 'options' ? (
											<div className="p-2 space-y-1">
												<div className="px-3.5 py-2.5 border-b border-slate-50">
													<span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Publish Options</span>
												</div>
												<button
													type="button"
													onClick={() => { setSchedOption('now'); setIsSchedMenuOpen(false); }}
													className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${schedOption === 'now' ? 'bg-indigo-50 text-indigo-650' : 'hover:bg-slate-50 text-slate-700'}`}
												>
													<span>Publish Now</span>
													{schedOption === 'now' && <Check className="w-4 h-4" />}
												</button>
												<button
													type="button"
													onClick={() => { setSchedOption('next_available'); setIsSchedMenuOpen(false); }}
													className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${schedOption === 'next_available' ? 'bg-indigo-50 text-indigo-650' : 'hover:bg-slate-50 text-slate-700'}`}
												>
													<span>Next Available slot</span>
													{schedOption === 'next_available' && <Check className="w-4 h-4" />}
												</button>
												<button
													type="button"
													onClick={() => { setSchedOption('prioritize'); setIsSchedMenuOpen(false); }}
													className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${schedOption === 'prioritize' ? 'bg-indigo-50 text-indigo-650' : 'hover:bg-slate-50 text-slate-700'}`}
												>
													<span>Prioritize queue</span>
													{schedOption === 'prioritize' && <Check className="w-4 h-4" />}
												</button>
												<button
													type="button"
													onClick={() => setSchedMenuSubView('calendar')}
													className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${schedOption === 'custom' ? 'bg-indigo-50 text-indigo-650' : 'hover:bg-slate-50 text-slate-700'}`}
												>
													<div className="flex flex-col">
														<span>Schedule Custom date</span>
														{customSchedDate && (
															<span className="text-[9px] text-slate-400 mt-0.5">
																{new Date(customSchedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {timeHours}:{timeMinutes}
															</span>
														)}
													</div>
													{schedOption === 'custom' && <Check className="w-4 h-4" />}
												</button>
											</div>
										) : (
											<div className="p-4.5 space-y-4">
												{/* Header calendar navigation */}
												<div className="flex items-center justify-between border-b border-slate-50 pb-3">
													<button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
														<ChevronLeft className="w-4 h-4" />
													</button>
													<span className="text-xs font-extrabold">
														{new Date(calYear, calMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
													</span>
													<button type="button" onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
														<ChevronRight className="w-4 h-4" />
													</button>
												</div>

												{/* Grid calendar */}
												<div className="grid grid-cols-7 gap-1 text-center">
													{['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
														<span key={day} className="text-[10px] font-black text-slate-400 py-1 uppercase">{day}</span>
													))}

													{/* Empty days offsets */}
													{Array.from({ length: getFirstDayOfMonth(calMonth, calYear) }).map((_, idx) => {
														return <span key={`empty-${idx}`} />;
													})}

													{/* Actual days */}
													{Array.from({ length: getDaysInMonth(calMonth, calYear) }).map((_, idx) => {
														const dayNum = idx + 1;
														const isToday = new Date().getDate() === dayNum && new Date().getMonth() === calMonth && new Date().getFullYear() === calYear;
														const isSelected = selectedDate && selectedDate.getDate() === dayNum && selectedDate.getMonth() === calMonth && selectedDate.getFullYear() === calYear;
														return (
															<button
																key={`day-${dayNum}`}
																type="button"
																onClick={() => handleDateSelect(dayNum)}
																className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
																	isSelected
																		? 'bg-indigo-650 text-white shadow-md shadow-indigo-100 scale-105'
																		: isToday
																		? 'bg-indigo-50 text-indigo-605 border border-indigo-200'
																		: 'hover:bg-slate-50 text-slate-700'
																}`}
															>
																{dayNum}
															</button>
														);
													})}
												</div>

												{/* Manual Time input */}
												<div className="border-t border-slate-50 pt-3 flex items-center justify-between">
													<span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Time Slot</span>
													<div className="flex items-center space-x-1">
														<input
															type="text"
															maxLength={2}
															value={timeHours}
															onChange={(e) => setTimeHours(e.target.value.replace(/\D/g, ''))}
															onBlur={handleTimeBlur}
															className="w-10 py-1.5 border border-slate-200 rounded-lg text-center text-xs font-bold focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-900"
														/>
														<span className="text-xs font-black text-slate-400">:</span>
														<input
															type="text"
															maxLength={2}
															value={timeMinutes}
															onChange={(e) => setTimeMinutes(e.target.value.replace(/\D/g, ''))}
															onBlur={handleTimeBlur}
															className="w-10 py-1.5 border border-slate-200 rounded-lg text-center text-xs font-bold focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-900"
														/>
													</div>
												</div>
											</div>
										)}
									</div>
								)}
							</div>
						</div>

						{customSchedDate && schedOption === 'custom' && (
							<div className="p-3.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl text-[11px] font-bold flex items-center space-x-2">
								<Clock className="w-4 h-4 flex-shrink-0" />
								<span>Scheduled for {new Date(customSchedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} at {timeHours}:{timeMinutes} (Local Time)</span>
							</div>
						)}

						<Button
							type="submit"
							disabled={isPublishing || !connectedAccount}
							className="w-full bg-slate-900 hover:bg-slate-950 text-white rounded-2xl font-black py-4 shadow-xl"
							isLoading={isPublishing}
						>
							{schedOption === 'now' ? 'Publish Now to X' : 'Queue on X Scheduler'}
						</Button>

						{publishedPostUrl && (
							<a
								href={publishedPostUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="w-full inline-flex items-center justify-center space-x-2 py-3.5 border border-emerald-250 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl text-xs font-bold transition-all animate-pulse"
							>
								<span>🚀 Tweet Published! Click to view live on X</span>
								<ExternalLink className="w-3.5 h-3.5" />
							</a>
						)}
					</GlassCard>
				</form>

				{/* Column Right: Live Mockup Feed & Publish History (Grid Span 5) */}
				<div className="lg:col-span-5 space-y-6">
					
					{/* Live X Mockup Feed */}
					<GlassCard className="p-6 bg-slate-900 text-white border border-slate-800 shadow-xl space-y-5">
						<div className="flex items-center justify-between border-b border-slate-800 pb-4">
							<div className="flex items-center space-x-2">
								<Eye className="w-4.5 h-4.5 text-slate-400" />
								<span className="text-xs font-black uppercase tracking-wider text-slate-400">Live X Post Preview</span>
							</div>
							<div className="flex items-center space-x-1.5">
								<span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
								<span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Feed Mockup</span>
							</div>
						</div>

						{/* Tweet Mockup body */}
						<div className="space-y-4 select-none">
							{caption.trim() || uploadedImages.length > 0 || generatedImageUrl || uploadedVideo || manualMediaUrl ? (
								<div className="flex items-start space-x-3">
									<div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black flex-shrink-0 text-slate-300">
										{connectedAccount ? connectedAccount.accountName.charAt(0).toUpperCase() : 'X'}
									</div>
									
									<div className="flex-1 space-y-1.5">
										<div className="flex items-center space-x-1.5">
											<span className="text-xs font-extrabold hover:underline cursor-pointer">
												{connectedAccount ? connectedAccount.accountName : 'My X Channel'}
											</span>
											<svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-blue-500 fill-current">
												<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
											</svg>
											<span className="text-[11px] font-medium text-slate-500">
												@{connectedAccount ? connectedAccount.accountName.toLowerCase().replace(/\s+/g, '') : 'handle'} · Just now
											</span>
										</div>

										<p className="text-[11px] font-semibold text-slate-200 leading-relaxed whitespace-pre-wrap">
											{caption || 'Tweet caption draft content...'}
										</p>

										{/* Inline media attachment */}
										{(uploadedImages.length > 0 || generatedImageUrl || uploadedVideo || manualMediaUrl) && (
											<div className="mt-3 rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 aspect-video relative flex items-center justify-center group shadow-inner">
												{uploadedVideo ? (
													<video src={uploadedVideo.url} controls className="w-full h-full object-cover" />
												) : (
													<img
														src={generatedImageUrl || (uploadedImages.length > 0 ? uploadedImages[0].url : manualMediaUrl)}
														alt="Attached preview"
														className="w-full h-full object-cover"
													/>
												)}
											</div>
										)}

										{/* Action bar */}
										<div className="flex items-center justify-between text-slate-500 max-w-sm pt-4 text-[10px] font-bold">
											<button type="button" className="flex items-center space-x-1 hover:text-blue-400 transition-colors">
												<MessageCircle className="w-4 h-4" />
												<span>0</span>
											</button>
											<button type="button" className="flex items-center space-x-1 hover:text-emerald-400 transition-colors">
												<Repeat className="w-4 h-4" />
												<span>0</span>
											</button>
											<button type="button" className="flex items-center space-x-1 hover:text-pink-500 transition-colors">
												<Heart className="w-4 h-4" />
												<span>0</span>
											</button>
											<button type="button" className="flex items-center space-x-1 hover:text-blue-400 transition-colors">
												<Share className="w-4 h-4" />
											</button>
										</div>
									</div>
								</div>
							) : (
								<MockPlaceholder />
							)}
						</div>
					</GlassCard>

					{/* Publish History List */}
					<GlassCard className="p-6 bg-white border border-slate-200 shadow-sm space-y-6">
						<div className="flex items-center justify-between border-b border-slate-100 pb-4.5">
							<div>
								<h3 className="text-xs font-black text-slate-800 uppercase">Publish History</h3>
								<p className="text-[10px] font-semibold text-slate-400 mt-0.5">X recent updates</p>
							</div>

							<button
								type="button"
								onClick={refreshHistory}
								disabled={isRefreshingHistory}
								className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl shadow-sm text-slate-500 transition-all transform active:scale-95"
							>
								<RefreshCw className={`w-4 h-4 ${isRefreshingHistory ? 'animate-spin' : ''}`} />
							</button>
						</div>

						{isLoadingHistory ? (
							<div className="space-y-4">
								{[1, 2, 3].map((n) => (
									<div key={n} className="flex items-center space-x-3 animate-pulse">
										<div className="w-8 h-8 rounded-full bg-slate-150" />
										<div className="flex-1 space-y-2">
											<div className="h-3 bg-slate-150 rounded w-3/4" />
											<div className="h-2 bg-slate-150 rounded w-1/2" />
										</div>
									</div>
								))}
							</div>
						) : history.length === 0 ? (
							<div className="text-center py-10 space-y-3.5 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
								<AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
								<div>
									<h4 className="text-xs font-bold text-slate-650">No History Available</h4>
									<p className="text-[10px] text-slate-400 font-semibold mt-0.5">Compose a tweet to see it in your queue list!</p>
								</div>
							</div>
						) : (
							<div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
								{history.map((post) => (
									<div key={post.id} className="flex items-start justify-between p-3.5 hover:bg-slate-50 rounded-2xl border border-slate-100/50 transition-all">
										<div className="space-y-1.5 flex-1 min-w-0 pr-3">
											<span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
												{post.format || 'Standard Tweet'}
											</span>
											<p className="text-[11px] font-bold text-slate-700 truncate">{post.caption}</p>
											
											{post.scheduledAt && (
												<div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-bold">
													<Clock className="w-3.5 h-3.5" />
													<span>Scheduled for {new Date(post.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
												</div>
											)}
										</div>

										<div className="flex flex-col items-end space-y-2.5">
											{post.status === 'live' ? (
												<span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-wider">Live</span>
											) : post.status === 'queued' ? (
												<span className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-wider">Queued</span>
											) : (
												<span className="px-2.5 py-1 bg-red-50 border border-red-100 text-red-700 rounded-full text-[9px] font-black uppercase tracking-wider">Failed</span>
											)}

											{post.url && (
												<a
													href={post.url}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center space-x-1 text-[10px] text-slate-500 hover:text-slate-800 font-bold underline"
												>
													<span>View Tweet</span>
													<ExternalLink className="w-3 h-3" />
												</a>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</GlassCard>
				</div>
			</div>
		</div>
	);
}
