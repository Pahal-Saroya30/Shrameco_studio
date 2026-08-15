'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
	Instagram,
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
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface InstagramAccount {
	accountId: string;
	accountName: string;
	connected: boolean;
}

interface PublishHistoryItem {
	id: string;
	caption: string;
	format: 'Post' | 'Reel' | 'Story';
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

export default function InstagramStudioPage() {
	const [connectedAccount, setConnectedAccount] = useState<InstagramAccount | null>(null);
	const [isConnecting, setIsConnecting] = useState(false);
	const [notification, setNotification] = useState<string | null>(null);
	const [isLoadingHistory, setIsLoadingHistory] = useState(true);
	const [isLoadingAccount, setIsLoadingAccount] = useState(true);

	// Media format (POST = image/carousel, REEL = video, STORY = image or video)
	const [mediaType, setMediaType] = useState<'POST' | 'REEL' | 'STORY'>('POST');

	// Media Input Modes: 'upload' (Direct computer upload) | 'ai' (AI generated)
	const [uploadMode, setUploadMode] = useState<'upload' | 'ai'>('upload');

	// Caption & hashtags
	const [caption, setCaption] = useState('');
	const [hashtags, setHashtags] = useState<string[]>(['branding', 'socialmedia', 'contentcreator']);
	const [hashtagInput, setHashtagInput] = useState('');

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
	const [manualMediaUrl, setManualMediaUrl] = useState('');

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
					const ig = (data.accounts || []).find((a: any) => a.platform === 'instagram' && a.connected);
					if (ig) setConnectedAccount({ accountId: ig.accountId, accountName: ig.accountName, connected: true });
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
					const igHistory = (data.posts || []).filter((p: any) => p.platform === 'instagram');
					setHistory(igHistory.map((p: any) => ({
						id: p._id,
						caption: p.caption,
						format: p.format === 'reel' ? 'Reel' : p.format === 'story' ? 'Story' : 'Post',
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
				showToast('You will be notified once the Instagram post goes live!');
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
				body: JSON.stringify({ platform: 'instagram', returnTo: '/dashboard/instagram' }),
			});
			const data = await res.json();
			if (data.url) {
				const popup = window.open(data.url, 'instagram_oauth', 'width=600,height=700,left=200,top=100,resizable=yes,scrollbars=yes');
				if (!popup) { window.location.href = data.url; return; }
				const handler = (event: MessageEvent) => {
					if (event.data?.type === 'oauth-complete') { window.removeEventListener('message', handler); popup?.close(); window.location.reload(); }
				};
				window.addEventListener('message', handler);
			} else if (data.demo) {
				setConnectedAccount({ accountId: 'demo_ig', accountName: 'Instagram Demo', connected: true });
				showToast('Connected in Demo Mode!');
			} else {
				showToast(data.error || 'Failed to start connection.');
			}
		} catch { showToast('Failed to start connection.'); }
		finally { setIsConnecting(false); }
	};

	const handleDisconnect = async () => {
		try {
			await fetch('/api/social/disconnect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: 'instagram' }) });
			setConnectedAccount(null);
			showToast('Instagram account disconnected.');
		} catch { showToast('Failed to disconnect.'); }
	};

	// ── Drag & Drop File Upload Uploader (Using react-dropzone) ──
	const onDropMedia = useCallback((acceptedFiles: File[]) => {
		if (mediaType === 'REEL') {
			const file = acceptedFiles.find(f => f.type.startsWith('video/'));
			if (!file) { showToast('Please select a video file (MP4, MOV, WebM).'); return; }
			const reader = new FileReader();
			reader.onload = () => {
				setUploadedVideo({ url: reader.result as string, name: file.name });
				showToast(`🎬 Linked video: ${file.name}`);
			};
			reader.readAsDataURL(file);
		} else if (mediaType === 'STORY') {
			const file = acceptedFiles[0];
			if (!file) return;
			const isVideo = file.type.startsWith('video/');
			const reader = new FileReader();
			reader.onload = () => {
				if (isVideo) {
					setUploadedVideo({ url: reader.result as string, name: file.name });
					setUploadedImages([]);
					showToast(`🎬 Linked story video: ${file.name}`);
				} else {
					setUploadedImages([{ url: reader.result as string, name: file.name }]);
					setUploadedVideo(null);
					showToast(`🖼 Linked story image: ${file.name}`);
				}
			};
			reader.readAsDataURL(file);
		} else {
			// POST (Images only)
			const imgs = acceptedFiles.filter(f => f.type.startsWith('image/'));
			if (imgs.length === 0) { showToast('Please upload image files only.'); return; }
			imgs.forEach(file => {
				const reader = new FileReader();
				reader.onload = () => {
					setUploadedImages(prev => [...prev, { url: reader.result as string, name: file.name }]);
				};
				reader.readAsDataURL(file);
			});
			showToast(`🖼 Linked ${imgs.length} image(s).`);
		}
	}, [mediaType]);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: onDropMedia,
		accept: mediaType === 'REEL' 
			? { 'video/*': ['.mp4', '.mov', '.webm', '.mkv'] } 
			: mediaType === 'STORY' 
			? { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'video/*': ['.mp4', '.mov', '.webm'] }
			: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }
	});

	const removeUploadedImage = (idx: number) => setUploadedImages(prev => prev.filter((_, i) => i !== idx));
	const removeUploadedVideo = () => setUploadedVideo(null);

	// ── AI Caption ──
	const handleAiCaption = async () => {
		if (!aiPrompt.trim()) { showToast('Enter a topic/prompt first.'); return; }
		setIsBoosting(true);
		try {
			const res = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ topic: aiPrompt, platform: 'instagram', count: 1, includeBrand: includeBrandProfile }),
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

	// ── AI Image (Pollinations) ──
	const handleGenerateImage = async () => {
		if (!aiPrompt.trim()) { showToast('Enter a topic/prompt first.'); return; }
		setIsGeneratingImage(true);
		setGeneratedImageUrl(null);
		try {
			const res = await fetch('/api/generate-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: aiPrompt, width: 1080, height: mediaType === 'STORY' ? 1920 : 1350 }),
			});
			const data = await res.json();
			if (data.imageUrl) { setGeneratedImageUrl(data.imageUrl); showToast('✨ Image generated!'); }
			else showToast(data.error || 'Image generation failed.');
		} catch { showToast('Image generation failed.'); }
		finally { setIsGeneratingImage(false); }
	};

	// ── AI Reel (Fal.ai) ──
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

	// ── Hashtag helpers ──
	const addHashtag = () => {
		const trimmed = hashtagInput.replace(/^#/, '').trim();
		if (trimmed && !hashtags.includes(trimmed)) setHashtags(prev => [...prev, trimmed]);
		setHashtagInput('');
	};
	const removeHashtag = (tag: string) => setHashtags(prev => prev.filter(t => t !== tag));

	// ── Determine final media URL to publish ──
	const getFinalMediaUrl = () => {
		if (mediaType === 'REEL') {
			return uploadedVideo?.url || generatedVideoUrl || manualMediaUrl;
		}
		if (mediaType === 'STORY') {
			return uploadedVideo?.url || uploadedImages[0]?.url || generatedImageUrl || manualMediaUrl;
		}
		// POST
		if (uploadedImages.length > 0) return uploadedImages[0].url;
		return generatedImageUrl || manualMediaUrl;
	};

	// ── Publish / Schedule Post ──
	const handlePublishPost = async (overrideDate?: string) => {
		if (!connectedAccount) { showToast('Connect an Instagram account first.'); return; }
		if (!caption.trim()) { showToast('Caption is required.'); return; }
		const mediaUrl = getFinalMediaUrl();
		if (!mediaUrl) { showToast(`Please upload or generate a${mediaType === 'REEL' ? ' video' : ' media file'} first.`); return; }

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
			const fullCaption = caption + (hashtags.length > 0 ? '\n\n' + hashtags.map(t => `#${t}`).join(' ') : '');
			const activeOption = overrideDate ? 'custom' : schedOption;

			let endpoint = '/api/social/publish';
			let payload: any = {
				platform: 'instagram',
				caption: fullCaption,
				imageUrl: mediaUrl,
				mediaType,
			};

			if (activeOption !== 'now') {
				endpoint = '/api/social/schedule';
				payload = {
					platform: 'instagram',
					caption: fullCaption,
					imageUrl: mediaUrl,
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
					// Add to history list as queued
					const newItem: PublishHistoryItem = {
						id: data.post?._id || 'sched-' + Date.now(),
						caption: fullCaption,
						format: mediaType === 'REEL' ? 'Reel' : mediaType === 'STORY' ? 'Story' : 'Post',
						status: 'queued',
						scheduledAt: new Date(payload.customDate || Date.now() + 2 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
					};
					setHistory(prev => [newItem, ...prev]);
				} else {
					setPublishedPostUrl(data.postUrl || null);
					showToast('🎉 Published to Instagram successfully!');
					
					// Trigger desktop notification if requested
					if (notifyRef.current && 'Notification' in window && Notification.permission === 'granted') {
						new Notification('Auto Studio: Published to Instagram! 🚀', {
							body: `Your Instagram ${mediaType.toLowerCase()} has been uploaded and is live.`,
						});
					}

					// Reset
					setCaption(''); setUploadedImages([]); setUploadedVideo(null); setGeneratedImageUrl(null); setGeneratedVideoUrl(null); setManualMediaUrl('');
				}
			} else {
				showToast(data.error || 'Action failed.');
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
				const igHistory = (data.posts || []).filter((p: any) => p.platform === 'instagram');
				setHistory(igHistory.map((p: any) => ({
					id: p._id,
					caption: p.caption,
					format: p.format === 'reel' ? 'Reel' : p.format === 'story' ? 'Story' : 'Post',
					status: p.status,
					scheduledAt: p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined,
					url: p.postUrl || undefined
				})));
			}
		} catch {}
		setIsRefreshingHistory(false);
	};

	const mediaTypeOptions = [
		{ id: 'POST' as const, label: 'Post', icon: <ImageIcon className="w-4 h-4" />, desc: 'Photo or carousel' },
		{ id: 'REEL' as const, label: 'Reel', icon: <Video className="w-4 h-4" />, desc: 'Short-form video' },
		{ id: 'STORY' as const, label: 'Story', icon: <BookOpen className="w-4 h-4" />, desc: '24-hour content' },
	];

	const hasMedia = !!getFinalMediaUrl();

	return (
		<div className="p-6 max-w-7xl mx-auto animate-fade-in pb-24 text-slate-900">
			{notification && <Toast message={notification} onClose={() => setNotification(null)} />}

			{/* Style injections */}
			<style>{`
				@keyframes shine { 100% { transform: translateX(100%); } }
				.animate-shine { animation: shine 1.8s infinite; }
				@keyframes pulse-glow {
					0%, 100% { box-shadow: 0 4px 10px 0 rgba(225, 48, 108, 0.3); }
					50% { box-shadow: 0 4px 16px 5px rgba(225, 48, 108, 0.45); }
				}
				.animate-pulse-glow:not(:disabled) { animation: pulse-glow 2s infinite ease-in-out; }
			`}</style>

			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
				<div className="flex items-center space-x-3">
					<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 flex items-center justify-center shadow-lg shadow-pink-500/25 animate-fade-in">
						<Instagram className="w-6 h-6 text-white" />
					</div>
					<div>
						<h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Instagram Studio</h1>
						<p className="text-sm text-slate-500 font-medium">Create, generate, publish and schedule posts, reels & stories.</p>
					</div>
				</div>
				<Link href="/dashboard/insights?platform=instagram" className="inline-flex items-center space-x-2 px-4 py-2 border border-slate-200 bg-white text-sm font-bold text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
					<BarChart3 className="w-4 h-4 text-pink-600" /><span>Instagram Insights</span>
				</Link>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				
				{/* ── LEFT COLUMN (Composer - Span 7) ── */}
				<div className="lg:col-span-7 space-y-6">
					
					{/* Account connection */}
					<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<h2 className="text-sm font-bold text-slate-700 flex items-center space-x-2"><Instagram className="w-4 h-4 text-pink-600" /><span>Instagram Account</span></h2>
							
							{connectedAccount ? (
								<div className="flex items-center space-x-4 bg-slate-50 border border-slate-200 rounded-xl p-2.5 px-4">
									<div className="flex items-center space-x-2.5">
										<div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-xs uppercase">
											{connectedAccount.accountName.slice(0, 2)}
										</div>
										<div>
											<h4 className="text-xs font-bold text-slate-800">@{connectedAccount.accountName}</h4>
											<p className="text-[9px] text-emerald-600 font-extrabold flex items-center">
												<span className="w-1 h-1 rounded-full bg-emerald-500 mr-1 animate-pulse" />Connected
											</p>
										</div>
									</div>
									<button onClick={handleDisconnect} className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors border-l border-slate-200 pl-3">Disconnect</button>
								</div>
							) : (
								<button onClick={handleConnect} disabled={isConnecting} className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-orange-500 text-white rounded-xl font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md shadow-pink-500/10">
									{isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Instagram className="w-3.5 h-3.5" />}
									<span>Connect Instagram Account</span>
								</button>
							)}
						</div>
					</div>

					{/* Content Type */}
					<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
						<h2 className="text-sm font-bold text-slate-700">Select Format</h2>
						<div className="grid grid-cols-3 gap-3">
							{mediaTypeOptions.map(opt => (
								<button key={opt.id} onClick={() => { setMediaType(opt.id); setGeneratedImageUrl(null); setGeneratedVideoUrl(null); setUploadedImages([]); setUploadedVideo(null); }}
									className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center ${
										mediaType === opt.id ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-200 bg-white text-slate-600 hover:border-pink-300 hover:bg-pink-50/30'
									}`}>
									<span className={`mb-1 ${mediaType === opt.id ? 'text-pink-600' : 'text-slate-400'}`}>{opt.icon}</span>
									<span className="text-xs font-bold">{opt.label}</span>
									<span className="text-[9px] text-slate-400 mt-0.5 leading-none">{opt.desc}</span>
								</button>
							))}
						</div>
					</div>

					{/* Media Source & Ingestion zone */}
					<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-sm font-bold text-slate-700 flex items-center space-x-2">
								{mediaType === 'REEL' ? <Video className="w-4 h-4 text-amber-500" /> : <ImageIcon className="w-4 h-4 text-pink-600" />}
								<span>Media Asset</span>
							</h2>
							
							{/* Toggle between Local Upload vs AI generation */}
							<div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
								<button onClick={() => setUploadMode('upload')} className={`px-2.5 py-1.5 rounded-md transition-all ${uploadMode === 'upload' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Direct Upload</button>
								<button onClick={() => setUploadMode('ai')} className={`px-2.5 py-1.5 rounded-md transition-all ${uploadMode === 'ai' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Generate with AI</button>
							</div>
						</div>

						{uploadMode === 'upload' ? (
							/* ── DIRECT FILE UPLOADER ── */
							<div className="space-y-4">
								<div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${isDragActive ? 'border-pink-500 bg-pink-50/50' : 'border-slate-300 hover:border-pink-400 bg-slate-50/50'}`}>
									<input {...getInputProps()} />
									<Upload className="w-7 h-7 mx-auto text-slate-400 mb-2" />
									<p className="text-xs font-bold text-slate-700 mb-0.5">Drag and drop file here</p>
									<p className="text-[10px] text-slate-400 font-medium">
										{mediaType === 'REEL' ? 'Reels must be video (.mp4, .mov)' : mediaType === 'STORY' ? 'Stories can be image or video' : 'Posts must be images (.jpg, .png)'}
									</p>
								</div>

								{/* Uploaded Video Status */}
								{uploadedVideo && (
									<div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2.5 px-3 text-xs font-semibold text-slate-700 animate-fade-in">
										<div className="flex items-center space-x-2 truncate">
											<FileVideo className="w-4 h-4 text-violet-500 flex-shrink-0" />
											<span className="truncate max-w-[150px] font-bold text-slate-800">{uploadedVideo.name}</span>
										</div>
										<button onClick={removeUploadedVideo} className="text-red-500 hover:text-red-700 font-bold">Remove</button>
									</div>
								)}

								{/* Uploaded Images Carousel List */}
								{uploadedImages.length > 0 && (
									<div className="space-y-2 animate-fade-in">
										<div className="flex items-center justify-between">
											<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5"><Layers className="w-3.5 h-3.5 text-pink-600" /><span>{uploadedImages.length} image(s) linked {mediaType === 'POST' && uploadedImages.length > 1 ? '(carousel)' : ''}</span></span>
											<button onClick={() => setUploadedImages([])} className="text-[10px] text-red-500 font-bold hover:underline">Clear all</button>
										</div>
										<div className="grid grid-cols-4 gap-2">
											{uploadedImages.map((img, i) => (
												<div key={i} className="relative group rounded-xl overflow-hidden border aspect-square">
													<img src={img.url} alt={img.name} className="w-full h-full object-cover" />
													<button onClick={() => removeUploadedImage(i)} className="absolute top-1 right-1 bg-white/90 p-1 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3 text-red-500" /></button>
													{i === 0 && <span className="absolute bottom-1 left-1 bg-pink-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded">Cover</span>}
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						) : (
							/* ── AI GENERATION PIPELINE ── */
							<div className="space-y-4">
								<div className="flex space-x-2">
									<input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
										placeholder="Describe your asset prompt details..."
										className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-pink-400 placeholder-slate-400" />
									
									{mediaType === 'REEL' ? (
										<button onClick={handleGenerateVideo} disabled={isGeneratingVideo || !aiPrompt.trim()} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-xl px-4 py-2.5 hover:opacity-90 transition-all disabled:opacity-50 flex items-center space-x-1.5 whitespace-nowrap">
											{isGeneratingVideo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
											<span>Generate Reel</span>
										</button>
									) : (
										<button onClick={handleGenerateImage} disabled={isGeneratingImage || !aiPrompt.trim()} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold rounded-xl px-4 py-2.5 hover:opacity-90 transition-all disabled:opacity-50 flex items-center space-x-1.5 whitespace-nowrap">
											{isGeneratingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
											<span>Generate Image</span>
										</button>
									)}
								</div>

								{/* Rendering Loading Previews */}
								{isGeneratingImage && (
									<div className="rounded-xl bg-pink-50 border border-pink-100 flex flex-col items-center justify-center h-32 animate-pulse">
										<Wand2 className="w-6 h-6 text-pink-400 animate-spin mb-1" />
										<p className="text-xs font-bold text-pink-600">Generating with Pollinations AI...</p>
									</div>
								)}

								{isGeneratingVideo && (
									<div className="rounded-xl bg-amber-50 border border-amber-100 flex flex-col items-center justify-center h-32 animate-pulse">
										<Video className="w-6 h-6 text-amber-400 animate-bounce mb-1" />
										<p className="text-xs font-bold text-amber-600">Generating with Fal.ai Minimax...</p>
										<p className="text-[10px] text-amber-500">Usually takes 1-3 minutes</p>
									</div>
								)}

								{generatedImageUrl && !isGeneratingImage && mediaType !== 'REEL' && (
									<div className="rounded-xl overflow-hidden border border-slate-200 relative group animate-fade-in">
										<img src={generatedImageUrl} alt="AI Generated" className="w-full max-h-60 object-cover" />
										<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
											<a href={generatedImageUrl} download="ai-generated.png" className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 shadow hover:text-black flex"><Download className="w-3.5 h-3.5" /></a>
										</div>
										<span className="absolute bottom-2 left-2 bg-white/90 text-[9px] font-black text-pink-700 border border-pink-100 px-2 py-0.5 rounded">✨ Pollinations AI</span>
									</div>
								)}

								{generatedVideoUrl && !isGeneratingVideo && mediaType === 'REEL' && (
									<div className="rounded-xl overflow-hidden border border-slate-200 relative animate-fade-in">
										<video src={generatedVideoUrl} controls className="w-full max-h-60 object-cover" />
										<span className="absolute bottom-2 left-2 bg-white/90 text-[9px] font-black text-amber-700 border border-amber-100 px-2 py-0.5 rounded">🎬 Fal.ai Minimax</span>
									</div>
								)}
							</div>
						)}

						{/* Manual link input */}
						<div>
							<label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Or paste media link URL</label>
							<input type="url" value={manualMediaUrl} onChange={e => setManualMediaUrl(e.target.value)}
								placeholder="https://cdn.example.com/asset.jpg"
								className="w-full bg-slate-50 border border-slate-250 text-xs rounded-xl px-3 py-2 focus:border-pink-400 focus:outline-none" />
						</div>
					</div>

					{/* Caption & AI SEO Booster with Brand Profile selector */}
					<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
						<h2 className="text-sm font-bold text-slate-700">Caption & Metadata</h2>
						
						{/* AI Booster Prompt Input */}
						<div className="bg-slate-50 border border-violet-100 rounded-xl p-3.5 space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-xs font-bold text-violet-700 flex items-center space-x-1"><Sparkles className="w-3.5 h-3.5" /><span>AI SEO Copywriter</span></span>
								<span className="text-[10px] text-slate-400 font-semibold">Uses OpenRouter API</span>
							</div>

							<div className="flex gap-2">
								<input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiCaption()}
									placeholder="Describe your post topic (e.g. flipkart big billion days)..."
									className="flex-1 bg-white border border-slate-250 text-xs rounded-xl px-3 py-2.5 focus:border-violet-500 focus:outline-none" />
								<button onClick={handleAiCaption} disabled={isBoosting || !aiPrompt.trim()} className="bg-violet-600 hover:bg-violet-755 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1 hover:scale-105 active:scale-95 transition-all">
									{isBoosting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Sparkles className="w-3.5 h-3.5" /><span>Boost Caption</span></>}
								</button>
							</div>

							{/* Include Brand Profile Toggle (Matches YouTube style) */}
							<div className="flex items-center space-x-2 pt-1">
								<input type="checkbox" id="includeBrandProfile" checked={includeBrandProfile} onChange={e => setIncludeBrandProfile(e.target.checked)}
									className="w-3.5 h-3.5 rounded text-pink-600 focus:ring-pink-500 border-slate-350 cursor-pointer" />
								<label htmlFor="includeBrandProfile" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer select-none">
									Apply Brand guidelines (Voice, Taglines, CTAs, handles)
								</label>
							</div>
						</div>

						{/* Textarea Caption input */}
						<textarea value={caption} onChange={e => setCaption(e.target.value)} rows={5}
							placeholder="Write details or copy generated caption text here..."
							className="w-full bg-slate-50 border border-slate-250 text-xs rounded-xl px-3.5 py-2.5 focus:border-pink-400 focus:outline-none resize-none" maxLength={2200} />

						{/* Hashtags container */}
						<div>
							<label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Hashtags / Chips</label>
							<div className="flex space-x-2 mb-2">
								<input type="text" value={hashtagInput} onChange={e => setHashtagInput(e.target.value)}
									onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHashtag(); } }}
									placeholder="Add hashtag (press Enter)"
									className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-400" />
								<button onClick={addHashtag} className="px-3.5 py-2 bg-slate-100 border border-slate-250 rounded-xl text-slate-650 hover:bg-slate-200 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
							</div>
							<div className="flex flex-wrap gap-1.5">
								{hashtags.map(tag => (
									<span key={tag} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-pink-50 border border-pink-200 text-pink-700 text-[10px] font-black rounded-lg">
										<span>#{tag}</span>
										<button onClick={() => removeHashtag(tag)} className="text-pink-400 hover:text-pink-600 transition-colors">&times;</button>
									</span>
								))}
							</div>
						</div>
					</div>

				</div>

				{/* ── RIGHT COLUMN (Mockups & Actions - Span 5) ── */}
				<div className="lg:col-span-5 space-y-6">

					{/* Live device preview mockup */}
					<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
						<div className="flex items-center justify-between pb-2 border-b border-slate-100">
							<h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5"><Eye className="w-4 h-4 text-slate-500" /><span>Post Preview Mockup</span></h3>
							<span className="text-[9px] text-slate-400 font-extrabold uppercase px-2 py-0.5 bg-slate-100 rounded border">Instagram</span>
						</div>

						<div className="flex items-center justify-center py-4 bg-slate-50 border rounded-2xl shadow-inner select-none">
							{mediaType === 'REEL' ? (
								/* Reels Vertical Screen Mockup */
								<div className="w-[200px] aspect-[9/16] rounded-[28px] overflow-hidden bg-slate-950 border-[5px] border-slate-900 relative shadow-2xl flex flex-col justify-between">
									{/* Camera Notch */}
									<div className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-slate-900 rounded-full z-30" />
									
									{/* Video preview or gradient placeholder */}
									<div className="absolute inset-0 w-full h-full z-0">
										{getFinalMediaUrl() ? (
											<video src={getFinalMediaUrl()!} controls={false} autoPlay muted loop className="w-full h-full object-cover" />
										) : (
											<div className="w-full h-full bg-gradient-to-br from-neutral-900 to-slate-950 flex flex-col items-center justify-center text-center p-4">
												<Video className="w-8 h-8 text-neutral-700 animate-pulse mb-1" />
												<span className="text-[8px] text-neutral-500">Video source empty</span>
											</div>
										)}
									</div>

									{/* Right widgets */}
									<div className="absolute right-2 bottom-12 flex flex-col items-center space-y-2.5 z-10 text-white">
										<div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 border border-white flex items-center justify-center font-bold text-[8px] uppercase">
											{connectedAccount ? connectedAccount.accountName.slice(0, 1) : 'I'}
										</div>
										<span className="text-[8px] shadow">❤️</span>
										<span className="text-[8px] shadow">💬</span>
										<span className="text-[8px] shadow">✈️</span>
									</div>

									{/* Bottom metadata */}
									<div className="absolute left-2 bottom-2 right-8 z-10 text-white space-y-1">
										<p className="text-[9px] font-black truncate">@{connectedAccount ? connectedAccount.accountName : 'yourhandle'}</p>
										<p className="text-[8px] leading-tight text-white/95 line-clamp-2">{caption || 'Describe your Reel...'}</p>
									</div>
								</div>
							) : (
								/* Post/Story Feed Square Mockup */
								<div className="w-[240px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-md">
									{/* Mock user header */}
									<div className="flex items-center space-x-2 p-2 border-b border-slate-100">
										<div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-[9px] font-bold text-white uppercase">
											{connectedAccount ? connectedAccount.accountName.slice(0, 2) : 'IG'}
										</div>
										<div>
											<p className="text-[10px] font-black text-slate-800 leading-none">@{connectedAccount ? connectedAccount.accountName : 'username'}</p>
											<p className="text-[8px] text-slate-400 leading-none mt-0.5">India</p>
										</div>
									</div>

									{/* Feed Media */}
									<div className="aspect-square bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
										{getFinalMediaUrl() ? (
											mediaType === 'STORY' && getFinalMediaUrl()?.includes('video') ? (
												<video src={getFinalMediaUrl()!} controls={false} autoPlay muted loop className="w-full h-full object-cover" />
											) : (
												<img src={getFinalMediaUrl()!} alt="Mock" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
											)
										) : (
											<ImageIcon className="w-8 h-8 text-slate-300" />
										)}
									</div>

									{/* Instagram icons */}
									<div className="p-2 flex justify-between text-xs border-b border-slate-50 text-slate-700">
										<div className="flex space-x-2"><span>❤️</span><span>💬</span><span>✈️</span></div>
										<span>Bookmark</span>
									</div>

									{/* Caption description */}
									<div className="p-2.5 space-y-1">
										<p className="text-[9px] text-slate-700 leading-relaxed line-clamp-3">
											<span className="font-extrabold">@{connectedAccount ? connectedAccount.accountName : 'yourhandle'}</span>{' '}
											{caption || 'Add your caption details...'}
										</p>
										{hashtags.length > 0 && (
											<p className="text-[8.5px] text-sky-600 truncate font-semibold">{hashtags.map(t => `#${t}`).join(' ')}</p>
										)}
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Publishing Actions & scheduling options (Matches YouTube page) */}
					<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
						<h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Release Settings</h3>

						{/* Notification Toggle (Notify on Complete) */}
						<div className="flex items-center justify-between pb-3 border-b border-slate-100">
							<div>
								<h4 className="text-xs font-bold text-slate-800">Notification Alerts</h4>
								<p className="text-[9px] text-slate-400 font-semibold mt-0.5">Desktop notification when publication completes.</p>
							</div>
							<input type="checkbox" checked={notifyOnComplete} onChange={e => handleNotifyToggle(e.target.checked)}
								className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 border-slate-300 cursor-pointer" />
						</div>

						{/* Scheduling Selector Dropdown */}
						{isPublishing ? (
							<div className="space-y-2 py-0.5">
								<div className="flex justify-between text-[11px] font-bold text-slate-500">
									<span className="flex items-center space-x-1.5"><RefreshCw className="w-3 h-3 text-pink-600 animate-spin" /><span>Uploading to Instagram...</span></span>
									<span>{uploadProgress}%</span>
								</div>
								<div className="h-1.5 bg-slate-150 rounded-full overflow-hidden">
									<div className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 transition-all rounded-full" style={{ width: `${uploadProgress}%` }} />
								</div>
							</div>
						) : connectedAccount ? (
							<div className="flex items-center relative w-full" ref={schedMenuRef}>

								{/* When to Post Button with Tooltip */}
								<div className="relative group/tooltip">
									{/* Tooltip */}
									<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50">
										When to Post
									</div>
									<button
										onClick={() => setIsSchedMenuOpen(!isSchedMenuOpen)}
										disabled={isPublishing}
										className="flex items-center space-x-1 px-3 py-3 border border-slate-200 rounded-l-xl bg-white text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs z-10 h-11"
									>
										<Clock className="w-3.5 h-3.5 text-slate-400" />
										<span>{
											schedOption === 'next_available' ? 'Next Available'
											: schedOption === 'prioritize' ? 'Prioritize'
											: schedOption === 'now' ? 'Now'
											: 'Set Date & Time'
										}</span>
									</button>
								</div>

								{/* Dropdown Options Popup */}
								{isSchedMenuOpen && (
									<div className="absolute bottom-full left-0 mb-3 w-80 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-4 z-[99] text-xs text-slate-100 animate-scale-in">
										{schedMenuSubView === 'options' ? (
											<div className="space-y-2">
												{/* Next Available */}
												<button
													onClick={() => { setSchedOption('next_available'); setIsSchedMenuOpen(false); }}
													className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left border ${schedOption === 'next_available' ? 'bg-pink-950/40 text-pink-100 border-pink-700/40' : 'hover:bg-neutral-800 border-transparent'}`}
												>
													<div className="flex items-start space-x-3">
														{schedOption === 'next_available' ? <Check className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" /> : <div className="w-4 h-4 flex-shrink-0" />}
														<div>
															<p className="font-extrabold text-sm text-slate-100">Next Available</p>
															<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Use the next available posting slot in your queue.</p>
														</div>
													</div>
													<div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 ml-1">
														<Star className="w-3 h-3 text-amber-500 fill-amber-400" />
													</div>
												</button>

												{/* Prioritize */}
												<button
													onClick={() => { setSchedOption('prioritize'); setIsSchedMenuOpen(false); }}
													className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left border ${schedOption === 'prioritize' ? 'bg-pink-950/40 text-pink-100 border-pink-700/40' : 'hover:bg-neutral-800 border-transparent'}`}
												>
													<div className="flex items-start space-x-3">
														{schedOption === 'prioritize' ? <Check className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" /> : <div className="w-4 h-4 flex-shrink-0" />}
														<div>
															<p className="font-extrabold text-sm text-slate-100">Prioritize</p>
															<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Bump your post to the top of the queue.</p>
														</div>
													</div>
												</button>

												{/* Now */}
												<button
													onClick={() => { setSchedOption('now'); setIsSchedMenuOpen(false); }}
													className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left border ${schedOption === 'now' ? 'bg-pink-950/40 text-pink-100 border-pink-700/40' : 'hover:bg-neutral-800 border-transparent'}`}
												>
													<div className="flex items-start space-x-3">
														{schedOption === 'now' ? <Check className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" /> : <div className="w-4 h-4 flex-shrink-0" />}
														<div>
															<p className="font-extrabold text-sm text-slate-100">Now</p>
															<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Publish your post right away.</p>
														</div>
													</div>
												</button>

												{/* Set Date and Time */}
												<button
													onClick={() => setSchedMenuSubView('calendar')}
													className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left border ${schedOption === 'custom' ? 'bg-pink-950/40 text-pink-100 border-pink-700/40' : 'hover:bg-neutral-800 border-transparent'}`}
												>
													<div className="flex items-start space-x-3">
														{schedOption === 'custom' ? <Check className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" /> : <div className="w-4 h-4 flex-shrink-0" />}
														<div>
															<p className="font-extrabold text-sm text-slate-100">Set Date and Time</p>
															<p className="text-[11px] text-slate-400 font-semibold mt-0.5">Choose a specific time to post, or use our recommendation.</p>
														</div>
													</div>
												</button>

												{/* Customize button */}
												<button className="w-full mt-3 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-sm">
													<span>Customize for each network</span>
													<span>→</span>
												</button>
											</div>
										) : (
											<div>
												{/* Calendar Month Header */}
												<div className="flex items-center justify-between pb-3 border-b border-neutral-800">
													<span className="font-extrabold text-sm text-slate-100">
														{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][calMonth]} {calYear}
													</span>
													<div className="flex items-center space-x-2">
														<button
															onClick={(e) => { e.stopPropagation(); if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
															className="p-1 hover:bg-neutral-800 rounded text-slate-400 hover:text-white"
														>
															<ChevronLeft className="w-4 h-4" />
														</button>
														<button
															onClick={(e) => { e.stopPropagation(); if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
															className="p-1 hover:bg-neutral-800 rounded text-slate-400 hover:text-white"
														>
															<ChevronRight className="w-4 h-4" />
														</button>
													</div>
												</div>

												{/* Days Grid */}
												<div className="grid grid-cols-7 gap-y-2 gap-x-1 justify-items-center font-bold mt-4 text-[10px]">
													{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
														<span key={`hdr-${idx}`} className="text-slate-500 font-extrabold pb-2">{d}</span>
													))}

													{/* Leading Days (prev month) */}
													{Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => {
														const prevMonthDays = new Date(calYear, calMonth, 0).getDate();
														const day = prevMonthDays - new Date(calYear, calMonth, 1).getDay() + 1 + i;
														return <span key={`prev-${i}`} className="h-8 w-8 flex items-center justify-center text-neutral-700 select-none cursor-not-allowed text-[10px]">{day}</span>;
													})}

													{/* Current Month Days */}
													{Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
														const day = i + 1;
														const todayObj = new Date();
														const isToday = todayObj.getDate() === day && todayObj.getMonth() === calMonth && todayObj.getFullYear() === calYear;
														const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === calMonth && selectedDate.getFullYear() === calYear;
														return (
															<button
																key={`day-${day}`}
																onClick={(e) => { e.stopPropagation(); setSelectedDate(new Date(calYear, calMonth, day)); }}
																className={`h-8 w-8 flex items-center justify-center rounded-full text-center font-black focus:outline-none transition-all text-[10px] ${
																	isSelected
																		? 'bg-pink-600 text-white border border-pink-400'
																		: isToday
																		? 'bg-pink-500 text-white font-black'
																		: 'text-slate-200 hover:bg-neutral-800'
																}`}
															>
																{day}
															</button>
														);
													})}

													{/* Trailing Days */}
													{Array.from({ length: 42 - (new Date(calYear, calMonth, 1).getDay() + new Date(calYear, calMonth + 1, 0).getDate()) }).map((_, i) => (
														<span key={`next-${i}`} className="h-8 w-8 flex items-center justify-center text-neutral-700 select-none cursor-not-allowed text-[10px]">{i + 1}</span>
													))}
												</div>

												{/* Time Input Section */}
												<div className="border-t border-neutral-800 mt-4 pt-4">
													<p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Time</p>
													<div className="flex items-center justify-between border border-pink-500 bg-pink-950/20 text-pink-400 px-3 py-2.5 rounded-xl text-xs font-semibold w-full mt-2 focus-within:ring-1 focus-within:ring-pink-500">
														<div className="flex items-center space-x-1.5">
															<Clock className="w-4 h-4 text-pink-500 mr-1.5 flex-shrink-0" />
															<input
																type="text"
																pattern="[0-9]*"
																inputMode="numeric"
																maxLength={2}
																value={timeHours}
																onChange={(e) => setTimeHours(e.target.value.replace(/[^0-9]/g, ''))}
																onBlur={() => { let num = parseInt(timeHours); if (isNaN(num) || num < 0 || num > 23) setTimeHours('13'); else setTimeHours(num.toString().padStart(2, '0')); }}
																className="bg-neutral-800/80 border border-pink-500/25 text-pink-400 rounded-lg px-2 py-1 w-11 text-center focus:outline-none focus:border-pink-500 text-xs font-bold"
															/>
															<span className="text-pink-500/60 font-bold">:</span>
															<input
																type="text"
																pattern="[0-9]*"
																inputMode="numeric"
																maxLength={2}
																value={timeMinutes}
																onChange={(e) => setTimeMinutes(e.target.value.replace(/[^0-9]/g, ''))}
																onBlur={() => { let num = parseInt(timeMinutes); if (isNaN(num) || num < 0 || num > 59) setTimeMinutes('00'); else setTimeMinutes(num.toString().padStart(2, '0')); }}
																className="bg-neutral-800/80 border border-pink-500/25 text-pink-400 rounded-lg px-2 py-1 w-11 text-center focus:outline-none focus:border-pink-500 text-xs font-bold"
															/>
														</div>
														<span className="text-[10px] uppercase font-black text-pink-500/80 tracking-wider">Asia/Kolkata</span>
													</div>
												</div>

												{/* Calendar Footer Buttons */}
												<div className="border-t border-neutral-800 mt-4 pt-3 flex items-center justify-between">
													<button
														onClick={(e) => { e.stopPropagation(); setSchedMenuSubView('options'); }}
														className="flex items-center space-x-1 px-1 py-1 hover:text-white text-slate-400 transition-colors font-extrabold text-[11px]"
													>
														<span>←</span>
														<span>More Posting Actions</span>
													</button>
													<button
														onClick={(e) => {
															e.stopPropagation();
															const finalDate = new Date(selectedDate.getTime());
															let hr = parseInt(timeHours || '13');
															const mins = parseInt(timeMinutes || '0');
															finalDate.setHours(hr, mins, 0, 0);
															setCustomSchedDate(finalDate.toISOString());
															setSchedOption('custom');
															setIsSchedMenuOpen(false);
														}}
														className="flex items-center space-x-1 px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white font-extrabold rounded-lg transition-colors text-[11px]"
													>
														<span>✓</span>
														<span>Done</span>
													</button>
												</div>
											</div>
										)}
									</div>
								)}

								{/* Action trigger button */}
								<button onClick={() => handlePublishPost()} disabled={!hasMedia || isPublishing}
									className="relative flex-1 bg-gradient-to-r from-pink-600 via-rose-600 to-orange-500 text-white font-extrabold py-3 rounded-r-xl text-xs flex items-center justify-center space-x-1.5 border-none disabled:opacity-40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 overflow-hidden group animate-pulse-glow -ml-[1px] h-11">
									<div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shine z-0" />
									<Instagram className="w-4.5 h-4.5 text-white z-10" />
									<span className="z-10 uppercase tracking-wider">{schedOption === 'now' ? `Publish ${mediaType}` : 'Schedule Post'}</span>
								</button>
							</div>
						) : (
							<button disabled className="w-full bg-slate-100 text-slate-400 font-extrabold py-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 border-none opacity-50 cursor-not-allowed">
								<Instagram className="w-4 h-4 text-slate-400" />
								<span className="uppercase tracking-wider">Publish Post</span>
							</button>
						)}
					</div>

					{/* Recent Uploads (Queue / History) */}
					{connectedAccount && (
						<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
							<div className="flex items-center justify-between pb-2 border-b border-slate-100">
								<h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
									<Clock className="w-4 h-4 text-indigo-500" />
									<span>Recent Queue & History</span>
								</h3>
								<div className="flex items-center space-x-2">
									<button onClick={refreshHistory} disabled={isRefreshingHistory} className="p-1 rounded-md text-slate-400 hover:text-indigo-650 hover:bg-slate-50 transition-colors">
										<RefreshCw className={`w-3 h-3 ${isRefreshingHistory ? 'animate-spin' : ''}`} />
									</button>
									<span className="text-[10px] text-slate-400 font-bold">{history.length} logged</span>
								</div>
							</div>

							{isLoadingHistory ? (
								<div className="space-y-2">
									{[1, 2, 3].map((n) => (
										<div key={n} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0 px-2 -mx-2 rounded-xl animate-pulse">
											<div className="space-y-1.5 flex-1 pr-3">
												<div className="h-3 bg-slate-200 rounded w-2/3"></div>
												<div className="flex space-x-2">
													<div className="h-2.5 bg-slate-200 rounded w-8"></div>
													<div className="h-2.5 bg-slate-200 rounded w-16"></div>
												</div>
											</div>
											<div className="w-12 h-4.5 bg-slate-200 rounded"></div>
										</div>
									))}
								</div>
							) : history.length === 0 ? (
								<p className="text-[10px] text-slate-400 font-medium text-center py-2">No posts logged in schedule queue.</p>
							) : (
								<div className="space-y-2">
									{history.slice(0, 3).map((item) => (
										<div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 px-2 -mx-2 rounded-xl transition-colors">
											<div className="space-y-0.5 truncate flex-1 pr-3">
												<h4 className="font-bold text-slate-800 text-[10.5px] truncate block max-w-[180px]">{item.caption}</h4>
												<div className="flex items-center space-x-2 text-[9px] font-semibold text-slate-400">
													<span className={`px-1 rounded text-[7px] uppercase tracking-wider font-extrabold border ${item.format === 'Reel' ? 'bg-amber-50 text-amber-600 border-amber-100' : item.format === 'Story' ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-indigo-50 text-indigo-500 border-indigo-100'}`}>
														{item.format}
													</span>
													<span>{item.scheduledAt || 'Sent'}</span>
												</div>
											</div>
											
											{item.status === 'sent' && item.url ? (
												<a
													href={item.url}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center justify-center p-1.5 rounded-lg bg-white border border-slate-200 hover:border-pink-500 text-pink-650 hover:text-pink-700 shadow-xs hover:scale-105 active:scale-95 transition-all mr-2"
													title="View Post"
												>
													<ExternalLink className="w-3.5 h-3.5" />
												</a>
											) : null}

											<span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : item.status === 'queued' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-650'}`}>
												{item.status}
											</span>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
