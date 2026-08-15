'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useDropzone } from 'react-dropzone';
import {
	Youtube,
	Upload,
	Play,
	CheckCircle,
	AlertTriangle,
	Sparkles,
	RefreshCw,
	Trash2,
	Globe,
	Tag,
	Eye,
	Lock,
	ShieldCheck,
	FileVideo,
	Video,
	History,
	ExternalLink,
	AlertCircle,
	Image as ImageIcon,
	Plus,
	X,
	Users,
	Zap,
	CalendarDays,
	Check,
	Star,
	Clock,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface YouTubeAccount {
	accountId: string;
	accountName: string;
	connected: boolean;
}

interface UploadHistoryItem {
	id: string;
	title: string;
	format: 'Shorts' | 'Video' | 'Post';
	visibility: string;
	uploadedAt: string;
	copyrightStatus: 'Passed' | 'Warning';
	url: string;
}

const MockPlaceholder = () => (
	<div className="flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
		<svg 
			width="100" 
			height="120" 
			viewBox="0 0 160 190" 
			fill="none" 
			xmlns="http://www.w3.org/2000/svg"
			className="opacity-75 animate-pulse"
			style={{ animationDuration: '3.5s' }}
		>
			{/* Top-Right Sparkles */}
			<path d="M130,22 Q130,30 138,30 Q130,30 130,38 Q130,30 122,30 Q130,30 130,22 Z" fill="#4d4d50" />
			<path d="M142,32 Q142,36 146,36 Q142,36 142,40 Q142,36 138,36 Q142,36 142,32 Z" fill="#2d2d30" />

			{/* Main Post Card outline */}
			<rect x="20" y="28" width="120" height="150" rx="14" fill="#1e1e20" stroke="#2d2d30" strokeWidth="2.5" strokeDasharray="none" />
			
			{/* Card Header Avatar */}
			<circle cx="38" cy="46" r="7" fill="#2d2d30" />
			
			{/* Card Header text lines */}
			<rect x="50" y="41" width="55" height="3" rx="1.5" fill="#2d2d30" />
			<rect x="50" y="48" width="35" height="3" rx="1.5" fill="#2d2d30" />

			{/* Post main image rectangle */}
			<rect x="28" y="62" width="104" height="106" rx="8" fill="#161618" />

			{/* Bottom-Left Sparkles */}
			<path d="M22,156 Q22,162 28,162 Q22,162 22,168 Q22,162 16,162 Q22,162 22,156 Z" fill="#2d2d30" />
			<path d="M30,164 Q30,167 33,167 Q30,167 30,170 Q30,167 27,167 Q30,167 30,164 Z" fill="#1e1e20" />
		</svg>
		<p className="text-[10px] text-slate-400 font-bold tracking-wide mt-3.5 normal-case">
			See your post's preview here
		</p>
	</div>
);

export default function YouTubeStudioPage() {
	const searchParams = useSearchParams();
	const [connectedAccount, setConnectedAccount] = useState<YouTubeAccount | null>(null);
	const [isConnecting, setIsConnecting] = useState(false);
	const [notification, setNotification] = useState<string | null>(null);
	const [isLoadingHistory, setIsLoadingHistory] = useState(true);
	const [isLoadingAccount, setIsLoadingAccount] = useState(true);

	// Video/Image File and Preview State
	const [videoFile, setVideoFile] = useState<File | null>(null);
	const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

	// Metadata Form State
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [tags, setTags] = useState<string[]>(['automation', 'socialmedia', 'marketing']);
	const [tagInput, setTagInput] = useState('');
	const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('public');
	const [category, setCategory] = useState('22'); // People & Blogs
	const [format, setFormat] = useState<'video' | 'short' | 'post'>('video');
	const [madeForKids, setMadeForKids] = useState(false);

	// AI Metadata Booster State
	const [aiPrompt, setAiPrompt] = useState('');
	const [isBoosting, setIsBoosting] = useState(false);
	const [hasBoosted, setHasBoosted] = useState(false);

	// AI Video Generator State
	const [uploadMode, setUploadMode] = useState<'upload' | 'ai' | 'trends'>('upload');
	const [selectedNiche, setSelectedNiche] = useState<'tech' | 'finance' | 'science' | 'custom'>('tech');
	const [customRssUrl, setCustomRssUrl] = useState('');
	const [isScanningTrends, setIsScanningTrends] = useState(false);
	const [scoutedTrend, setScoutedTrend] = useState<any>(null);
	const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
	const [isRefreshingHistory, setIsRefreshingHistory] = useState(false);
	const [includeBrandProfile, setIncludeBrandProfile] = useState(true);
	const [videoGenPrompt, setVideoGenPrompt] = useState('');
	const [isVideoGenLoading, setIsVideoGenLoading] = useState(false);
	const [videoGenStep, setVideoGenStep] = useState('');

	// Publishing State
	const [isPublishing, setIsPublishing] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [publishedVideoUrl, setPublishedVideoUrl] = useState('');

	// Scheduling Option States
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

	// Pre-fill form from ?title=...&description=...&tags=... when redirected from Publish queue Edit button
	useEffect(() => {
		const urlTitle = searchParams.get('title');
		const urlDesc = searchParams.get('description');
		const urlTags = searchParams.get('tags');
		if (urlTitle) setTitle(urlTitle);
		if (urlDesc) setDescription(urlDesc);
		if (urlTags) {
			// tags can be like "#automation #socialmedia" or comma separated
			const parsed = urlTags
				.split(/[,\s#]+/)
				.map((t) => t.trim().replace(/^#/, ''))
				.filter(Boolean);
			if (parsed.length > 0) setTags(parsed);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		setIsMounted(true);
		const handleClickOutside = (event: MouseEvent) => {
			if (schedMenuRef.current && !schedMenuRef.current.contains(event.target as Node)) {
				setIsSchedMenuOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Live YouTube Server Status Tracking State
	const [trackingVideoId, setTrackingVideoId] = useState<string | null>(null);
	const [liveProcessingStatus, setLiveProcessingStatus] = useState<string>('idle');
	const [liveProcessingProgress, setLiveProcessingProgress] = useState<number>(0);
	const [liveCopyrightStatus, setLiveCopyrightStatus] = useState<string>('Pending');
	const [liveCopyrightDetails, setLiveCopyrightDetails] = useState<string>('Checks queue in progress');
	const [liveLogs, setLiveLogs] = useState<string[]>([]);

	// Upload History State
	const [history, setHistory] = useState<UploadHistoryItem[]>([]);
	const [showHistoryModal, setShowHistoryModal] = useState(false);

	// Ingestion complete desktop notification option
	const [notifyOnComplete, setNotifyOnComplete] = useState(false);
	const notifyRef = useRef(notifyOnComplete);

	useEffect(() => {
		notifyRef.current = notifyOnComplete;
	}, [notifyOnComplete]);

	const handleNotifyToggle = async (checked: boolean) => {
		setNotifyOnComplete(checked);
		if (checked && 'Notification' in window) {
			const permission = await Notification.requestPermission();
			if (permission !== 'granted') {
				setNotifyOnComplete(false);
				showToast('Desktop notification permission denied.');
			} else {
				showToast('You will be notified once the video goes live!');
			}
		}
	};

	// Fetch account connection status on mount
	const fetchYouTubeAccount = async () => {
		try {
			const res = await fetch('/api/social/accounts');
			const data = await res.json();
			if (res.ok && data.accounts) {
				const yt = data.accounts.find((a: any) => a.platform === 'youtube');
				if (yt) {
					setConnectedAccount({
						accountId: yt.accountId,
						accountName: yt.accountName,
						connected: true,
					});
				} else {
					setConnectedAccount(null);
				}
			}
		} catch (err) {
			console.error('Failed to load YouTube accounts:', err);
		} finally {
			setIsLoadingAccount(false);
		}
	};

	// Fetch published history from YoutubeUpload DB endpoint
	const fetchHistory = async () => {
		try {
			const res = await fetch('/api/social/youtube/history');
			const data = await res.json();
			if (res.ok && data.items) {
				const ytItems = data.items.map((item: any) => ({
					id: item._id,
					title: item.title,
					format: item.format === 'short' ? 'Shorts' : 'Video',
					visibility: item.visibility ? item.visibility.charAt(0).toUpperCase() + item.visibility.slice(1) : 'Public',
					uploadedAt: new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
					copyrightStatus: item.copyrightStatus || 'Passed',
					url: item.videoUrl || 'https://youtube.com',
				}));
				setHistory(ytItems);
			}
		} catch (err) {
			console.error('Failed to fetch history:', err);
		} finally {
			setIsLoadingHistory(false);
		}
	};

	const handleRefreshHistory = async () => {
		setIsRefreshingHistory(true);
		await fetchHistory();
		setIsRefreshingHistory(false);
	};

	const [brandProfile, setBrandProfile] = useState<any>(null);

	const fetchBrandProfile = async () => {
		try {
			const res = await fetch('/api/brand');
			const data = await res.json();
			if (res.ok && data.profile) {
				setBrandProfile(data.profile);
			}
		} catch (err) {
			console.error('Failed to load brand profile:', err);
		}
	};

	useEffect(() => {
		fetchYouTubeAccount();
		fetchHistory();
		fetchBrandProfile();
	}, []);

	// Poll YouTube status when active tracking video ID is set
	useEffect(() => {
		if (!trackingVideoId) return;

		setLiveLogs([
			`[${new Date().toLocaleTimeString()}] YouTube server received video upload request.`,
			`[${new Date().toLocaleTimeString()}] Handing video to Google transcoder pipeline.`
		]);
		setLiveProcessingStatus('processing');
		setLiveProcessingProgress(15);

		let localProgress = 15;
		const interval = setInterval(async () => {
			try {
				const res = await fetch(`/api/social/youtube/status?videoId=${trackingVideoId}`);
				const data = await res.json();
				if (res.ok && data.ok) {
					setLiveProcessingProgress(data.progress);
					setLiveCopyrightStatus(data.copyrightStatus);
					setLiveCopyrightDetails(data.copyrightDetails);
					
					const time = new Date().toLocaleTimeString();
					if (data.progress >= 35 && data.progress < 65 && localProgress < 35) {
						setLiveLogs(prev => [...prev, `[${time}] SD resolution processing started.`]);
						localProgress = 35;
					} else if (data.progress >= 65 && data.progress < 95 && localProgress < 65) {
						setLiveLogs(prev => [...prev, `[${time}] HD resolution processing started.`]);
						setLiveLogs(prev => [...prev, `[${time}] YouTube Content ID copyright scanning initiated.`]);
						localProgress = 65;
					} else if (data.uploadStatus === 'processed' || data.progress === 100) {
						setLiveLogs(prev => [...prev, `[${time}] SD & HD transcode completed.`]);
						setLiveLogs(prev => [...prev, `[${time}] Content ID checks cleared. Safe to release.`]);
						setLiveProcessingStatus('succeeded');

						// Trigger desktop notification if requested
						if (notifyRef.current && 'Notification' in window && Notification.permission === 'granted') {
							new Notification('Auto Studio: Video Live! 🚀', {
								body: `Your video "${title || 'YouTube Video'}" has successfully cleared copyright scanning and is live.`,
							});
						}

						clearInterval(interval);
					}
				}
			} catch (err) {
				console.error('Failed to poll video status:', err);
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [trackingVideoId, title]);

	const showToast = (msg: string) => {
		setNotification(msg);
		setTimeout(() => setNotification(null), 3500);
	};

	const handleConnect = async () => {
		setIsConnecting(true);
		try {
			const res = await fetch('/api/social/connect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ platform: 'youtube', returnTo: window.location.pathname }),
			});
			const data = await res.json();
			if (res.ok && data.url) {
				window.location.href = data.url;
			} else {
				// Fallback to Demo Mode automatically
				if (data.demo) {
					setConnectedAccount({
						accountId: 'youtube_demo_channel_id',
						accountName: 'YouTube Demo Creator',
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

	const handleDisconnect = async () => {
		try {
			const res = await fetch('/api/social/disconnect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ platform: 'youtube' }),
			});
			if (res.ok) {
				setConnectedAccount(null);
				showToast('YouTube channel disconnected.');
			} else {
				showToast('Failed to disconnect.');
			}
		} catch (err) {
			console.error('Disconnect error:', err);
			showToast('Failed to disconnect.');
		}
	};

	// File uploader handler
	const onDrop = (acceptedFiles: File[]) => {
		const file = acceptedFiles[0];
		if (file) {
			if (!file.type.startsWith('video/')) {
				showToast('Please upload a video file (MP4, WebM, etc.)');
				return;
			}
			setVideoFile(file);
			setVideoPreviewUrl(URL.createObjectURL(file));
			const filename = file.name.split('.')[0];
			setTitle(filename.slice(0, 80));
			setDescription('');
			setTags(['automation', 'socialmedia', 'marketing']);
			setAiPrompt('');
			showToast(`Uploaded video: ${file.name}`);
		}
	};

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: { 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] },
		maxFiles: 1,
	});

	const removeVideoFile = () => {
		setVideoFile(null);
		if (videoPreviewUrl) {
			URL.revokeObjectURL(videoPreviewUrl);
			setVideoPreviewUrl(null);
		}
		setTitle('');
		setDescription('');
		setTags(['automation', 'socialmedia', 'marketing']);
		setAiPrompt('');
	};

	const changeFormat = (newFormat: 'video' | 'short') => {
		setFormat(newFormat);
		setTitle('');
		setDescription('');
		setTags(['automation', 'socialmedia', 'marketing']);
		setAiPrompt('');
		setScoutedTrend(null);
		setVideoFile(null);
		if (videoPreviewUrl) {
			URL.revokeObjectURL(videoPreviewUrl);
			setVideoPreviewUrl(null);
		}
	};

	const changeUploadMode = (mode: 'upload' | 'ai' | 'trends') => {
		setUploadMode(mode);
		setTitle('');
		setDescription('');
		setTags(['automation', 'socialmedia', 'marketing']);
		setAiPrompt('');
		setScoutedTrend(null);
		setVideoFile(null);
		if (videoPreviewUrl) {
			URL.revokeObjectURL(videoPreviewUrl);
			setVideoPreviewUrl(null);
		}
	};

	// Reset files when changing format to avoid conflicts
	useEffect(() => {
		removeVideoFile();
	}, [format]);

	// Tags Manager helpers
	const handleAddTag = () => {
		const trimmed = tagInput.trim().toLowerCase().replace(/#/g, '');
		if (trimmed && !tags.includes(trimmed)) {
			setTags([...tags, trimmed]);
			setTagInput('');
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setTags(tags.filter(t => t !== tagToRemove));
	};

	// AI Metadata Generator
	const handleAiBoost = async () => {
		const promptText = aiPrompt.trim() || title || 'automation benefits for content creators';
		setIsBoosting(true);
		try {
			const isShorts = format === 'short';

			const topicPrompt = `Generate optimized YouTube ${isShorts ? 'Shorts' : 'video'} SEO metadata for topic: "${promptText}".
Do NOT output literal bracket placeholders. Generate actual high-quality copy.
Respond EXACTLY in this format:
TITLE: Catchy viral title under 80 characters
DESCRIPTION: Video description text, including 3 relevant hashtags at the end
TAGS: 5-8 comma-separated search keywords
CATEGORY: One of: Blogs & People, Education, Science & Technology, Entertainment, Film & Animation`;

			const res = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ topic: topicPrompt, platform: 'youtube', count: 1, includeBrand: includeBrandProfile }),
			});
			const data = await res.json();
			if (res.ok && data.variations && data.variations.length > 0) {
				const generatedText = data.variations[0];

				if (typeof generatedText === 'object' && generatedText !== null) {
					// Handle structured JSON object response from LLM
					const gObj = generatedText as any;
					const finalTitle = gObj.title || gObj.Title || gObj.TITLE || '';
					const finalDesc = gObj.description || gObj.Description || gObj.DESCRIPTION || gObj.desc || '';
					
					let finalTags: string[] = [];
					const rawTags = gObj.tags || gObj.Tags || gObj.TAGS || [];
					if (Array.isArray(rawTags)) {
						finalTags = rawTags.map((t: any) => String(t).trim().toLowerCase());
					} else if (typeof rawTags === 'string') {
						finalTags = rawTags.split(/[,#\s\n\r]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
					}

					const finalCategory = gObj.category || gObj.Category || gObj.CATEGORY || '';

					if (finalTitle) setTitle(String(finalTitle).replace(/['"]/g, '').trim());
					if (finalDesc) setDescription(String(finalDesc).trim());
					if (finalTags.length > 0) setTags(finalTags);
					
					if (finalCategory) {
						const catName = String(finalCategory).trim().toLowerCase();
						if (catName.includes('science') || catName.includes('tech') || catName.includes('28')) {
							setCategory('28');
						} else if (catName.includes('education') || catName.includes('tutorial') || catName.includes('27')) {
							setCategory('27');
						} else if (catName.includes('entertainment') || catName.includes('24')) {
							setCategory('24');
						} else if (catName.includes('film') || catName.includes('animation') || catName.includes('1')) {
							setCategory('1');
						} else {
							setCategory('22');
						}
					}
				} else if (typeof generatedText === 'string') {
					let cleanedText = generatedText.trim();
					// Clean markdown wraps if any
					cleanedText = cleanedText.replace(/```json\n?|\n?```/g, '').trim();

					// If it looks like a JSON object, try parsing it directly
					if (cleanedText.startsWith('{') && cleanedText.endsWith('}')) {
						try {
							const parsedObj = JSON.parse(cleanedText);
							if (parsedObj && typeof parsedObj === 'object') {
								const finalTitle = parsedObj.title || parsedObj.Title || parsedObj.TITLE || '';
								const finalDesc = parsedObj.description || parsedObj.Description || parsedObj.DESCRIPTION || parsedObj.desc || '';
								let finalTags: string[] = [];
								const rawTags = parsedObj.tags || parsedObj.Tags || parsedObj.TAGS || [];
								if (Array.isArray(rawTags)) {
									finalTags = rawTags.map((t: any) => String(t).trim());
								} else if (typeof rawTags === 'string') {
									finalTags = rawTags.split(/[,#\s\n\r]+/).map(t => t.trim()).filter(Boolean);
								}
								const finalCategory = parsedObj.category || parsedObj.Category || parsedObj.CATEGORY || '';

								if (finalTitle) setTitle(String(finalTitle).replace(/['"]/g, '').trim());
								if (finalDesc) setDescription(String(finalDesc).trim());
								if (finalTags.length > 0) setTags(finalTags);
								if (finalCategory) {
									const catName = String(finalCategory).trim().toLowerCase();
									if (catName.includes('science') || catName.includes('tech') || catName.includes('28')) setCategory('28');
									else if (catName.includes('education') || catName.includes('tutorial') || catName.includes('27')) setCategory('27');
									else if (catName.includes('entertainment') || catName.includes('24')) setCategory('24');
									else if (catName.includes('film') || catName.includes('animation') || catName.includes('1')) setCategory('1');
									else setCategory('22');
								}
								setHasBoosted(true);
								showToast('AI Boost completed! Form populated.');
								setIsBoosting(false);
								return;
							}
						} catch (_) {
							// fallback to regex parsing
						}
					}

					// Clean raw JSON array string leftovers if it fell back to unparsed string
					if (cleanedText.startsWith('[') && cleanedText.endsWith(']')) {
						try {
							const arr = JSON.parse(cleanedText);
							if (Array.isArray(arr) && arr[0]) {
								cleanedText = arr[0];
							}
						} catch (_) {
							cleanedText = cleanedText.replace(/^\[\s*["']|["']\s*\]$/g, '').trim();
						}
					}

					// Handle plain text response with regex matching
					const titleMatch = cleanedText.match(/(?:\*\*|\*|#)?\s*TITLE\s*(?:\*\*|\*|#)?\s*:\s*([\s\S]*?)(?=\s*(?:\*\*|\*|#)?\s*DESCRIPTION\s*(?:\*\*|\*|#)?\s*:|$)/i);
					const descMatch = cleanedText.match(/(?:\*\*|\*|#)?\s*DESCRIPTION\s*(?:\*\*|\*|#)?\s*:\s*([\s\S]*?)(?=\s*(?:\*\*|\*|#)?\s*TAGS\s*(?:\*\*|\*|#)?\s*:|$)/i);
					const tagsMatch = cleanedText.match(/(?:\*\*|\*|#)?\s*TAGS\s*(?:\*\*|\*|#)?\s*:\s*([\s\S]*?)(?=\s*(?:\*\*|\*|#)?\s*CATEGORY\s*(?:\*\*|\*|#)?\s*:|$)/i);
					const categoryMatch = cleanedText.match(/(?:\*\*|\*|#)?\s*CATEGORY\s*(?:\*\*|\*|#)?\s*:\s*([\s\S]*?)$/i);

					let titleText = '';
					let descText = '';
					let tagsList: string[] = [];
					let categoryVal = '';

					if (titleMatch?.[1]) {
						titleText = titleMatch[1].replace(/['"]/g, '').trim();
					}
					if (descMatch?.[1]) {
						descText = descMatch[1].trim();
					}
					if (tagsMatch?.[1]) {
						const parsedTags = tagsMatch[1]
							.split(/[,#\s\n\r]+/)
							.map((t: string) => t.trim().toLowerCase())
							.filter((t: string) => t.length > 1 && t !== 'tags:');
						if (parsedTags.length > 0) tagsList = parsedTags;
					}
					if (categoryMatch?.[1]) {
						categoryVal = categoryMatch[1].trim();
					}

					// Robust Fallback: if titleMatch or descMatch was null or empty
					if (!titleText && cleanedText) {
						// Look for lower case or alternative prefixes
						const fallbackTitle = cleanedText.match(/title:\s*(.*)/i);
						if (fallbackTitle?.[1]) {
							titleText = fallbackTitle[1].split('\n')[0].replace(/['"]/g, '').trim();
						} else {
							// Take first non-empty line as title
							const lines = cleanedText.split('\n').map(l => l.trim()).filter(Boolean);
							if (lines[0]) {
								titleText = lines[0].replace(/^(title|subject|video title|topic):\s*/i, '').replace(/['"]/g, '').trim();
								if (lines.length > 1) {
									descText = lines.slice(1).join('\n').replace(/^(description|desc|caption):\s*/i, '').trim();
								}
							}
						}
					}

					if (titleText) {
						setTitle(titleText.slice(0, 100));
					}
					if (descText) {
						setDescription(descText);
					}
					if (tagsList.length > 0) {
						setTags(tagsList);
					}
					if (categoryVal) {
						const catName = categoryVal.toLowerCase();
						if (catName.includes('science') || catName.includes('tech') || catName.includes('28')) {
							setCategory('28');
						} else if (catName.includes('education') || catName.includes('tutorial') || catName.includes('27')) {
							setCategory('27');
						} else if (catName.includes('entertainment') || catName.includes('24')) {
							setCategory('24');
						} else if (catName.includes('film') || catName.includes('animation') || catName.includes('1')) {
							setCategory('1');
						} else {
							setCategory('22');
						}
					}
				}
				setHasBoosted(true);
				showToast('AI Boost completed! Form populated.');
			} else {
				setTitle(`Revolutionizing YouTube Automation in 2026! 🚀 (${isShorts ? 'Shorts' : 'Video'})`);
				setDescription(`In this ${isShorts ? 'Shorts' : 'video'}, we unpack the latest secrets to content creation. Learn how Auto Studio simplifies workflow, saves hours of manual writing, and uploads videos for free.\n\nSubscribe for daily tips!`);
				setTags(['youtubeautomation', 'autostudio', 'videoeditor', 'marketingtips']);
				setHasBoosted(true);
				showToast('AI Boost generated premium default templates.');
			}
		} catch (err: any) {
			console.error('AI Booster Error details:', err);
			showToast(`AI Booster generation failed: ${err.message || 'unknown error'}`);
		} finally {
			setIsBoosting(false);
		}
	};

	const runCanvasCompilation = async (slides: string[], isShort: boolean): Promise<File> => {
		const width = isShort ? 720 : 1280;
		const height = isShort ? 1280 : 720;

		// Asynchronously pre-load the brand logo image if it exists in the active profile
		let logoImage: HTMLImageElement | null = null;
		if (brandProfile?.logoUrl) {
			logoImage = await new Promise<HTMLImageElement>((resolve) => {
				const img = new Image();
				img.onload = () => resolve(img);
				img.onerror = () => resolve(null as any);
				img.src = brandProfile.logoUrl;
			});
		}

		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Could not initialize canvas context.');

		const stream = canvas.captureStream(30);
		const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
		const chunks: Blob[] = [];

		mediaRecorder.ondataavailable = (e) => {
			if (e.data.size > 0) chunks.push(e.data);
		};

		const compilePromise = new Promise<File>((resolve, reject) => {
			mediaRecorder.onstop = () => {
				const blob = new Blob(chunks, { type: 'video/webm' });
				const file = new File([blob], `generated_${isShort ? 'short' : 'video'}_${Date.now()}.webm`, { type: 'video/webm' });
				resolve(file);
			};
			mediaRecorder.onerror = reject;
		});

		mediaRecorder.start();
		const startTime = Date.now();
		const duration = 6000; // 6 seconds video

		const draw = () => {
			const elapsed = Date.now() - startTime;
			if (elapsed >= duration) {
				mediaRecorder.stop();
				return;
			}

			// Background Brand Gradient or fallback Slate/Purple
			const primaryColor = brandProfile?.colorPalette?.[0] || '#311042';
			const secondaryColor = brandProfile?.colorPalette?.[1] || '#0f172a';
			const grad = ctx.createLinearGradient(0, 0, width, height);
			grad.addColorStop(0, secondaryColor);
			grad.addColorStop(1, primaryColor);
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, width, height);

			// Pulsing background ring
			ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
			ctx.beginPath();
			ctx.arc(width / 2 + Math.sin(elapsed / 800) * 150, height / 2, width * 0.35, 0, Math.PI * 2);
			ctx.fill();

			// Header Branded Watermark / Social Handle
			ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
			ctx.font = 'bold 32px sans-serif';
			ctx.textAlign = 'center';
			const watermarkText = brandProfile?.socialHandle || brandProfile?.companyName || 'YOUTUBE STUDIO AUTO';
			ctx.fillText(watermarkText.toUpperCase(), width / 2, height * 0.1);

			// Draw Brand Logo if loaded and not hidden
			if (logoImage) {
				const pos = brandProfile?.logoPosition || 'top-right';
				if (pos !== 'hidden') {
					let lx = width - 110;
					let ly = 40;
					if (pos === 'top-left') {
						lx = 40;
					} else if (pos === 'bottom-right') {
						lx = width - 110;
						ly = height - 110;
					}
					
					// Rounded background mask container for logo
					ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
					ctx.beginPath();
					ctx.roundRect(lx, ly, 70, 70, 16);
					ctx.fill();
					
					// Draw image inside container
					ctx.drawImage(logoImage, lx + 10, ly + 10, 50, 50);
				}
			}

			// Determine slide index based on time elapsed
			const slideIndex = Math.min(
				Math.floor((elapsed / duration) * slides.length),
				slides.length - 1
			);
			const currentSlideText = slides[slideIndex];

			// Animate text scale
			const progressInSlide = (elapsed % (duration / slides.length)) / (duration / slides.length);
			const textScale = 1.0 + Math.sin(progressInSlide * Math.PI) * 0.05;

			ctx.save();
			ctx.translate(width / 2, height / 2);
			ctx.scale(textScale, textScale);

			// Draw Text Background Card
			ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
			ctx.lineWidth = 2;
			const cardWidth = width * 0.8;
			const cardHeight = height * 0.4;
			ctx.beginPath();
			ctx.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 24);
			ctx.fill();
			ctx.stroke();

			// Draw Slide Text
			ctx.fillStyle = '#ffffff';
			ctx.font = 'bold 42px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';

			const wrapped = wrapText(ctx, currentSlideText, cardWidth - 80);
			wrapped.forEach((line, index) => {
				ctx.fillText(
					line,
					0,
					(index - (wrapped.length - 1) / 2) * 60
				);
			});

			ctx.restore();
			requestAnimationFrame(draw);
		};

		draw();
		return compilePromise;
	};

	// Client-side HTML5 Canvas Video Generator
	const handleGenerateVideo = async () => {
		const prompt = videoGenPrompt.trim();
		if (!prompt) {
			showToast('Please specify an AI Video prompt.');
			return;
		}

		setIsVideoGenLoading(true);
		setVideoGenStep('Generating Video Script & Keywords...');

		try {
			// Step 1: Generate script & details using OpenRouter Llama
			const topicPrompt = `Write a short 30-word educational summary script (divided into 3 key tips) about: "${prompt}". Also provide YouTube video details. Do NOT output literal brackets or instructions. Generate actual copy.
Format response EXACTLY as follows:
TITLE: catchy viral video title
DESCRIPTION: high-converting SEO video description
TAGS: tag1, tag2, tag3
SCRIPT:
Tip 1 line text
Tip 2 line text
Tip 3 line text`;

			const res = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					topic: topicPrompt, 
					platform: 'youtube', 
					count: 1,
					systemPrompt: "You are an elite YouTube Video scriptwriter and SEO specialist. Write the actual title, description, tags, and script content directly based on the topic. Do NOT write placeholders or guides."
				}),
			});

			const data = await res.json();
			let titleVal = `Revolutionizing ${prompt.slice(0, 40)}!`;
			let descVal = `Here is a quick overview about ${prompt}. Generated automatically.`;
			let tagsVal = ['automation', 'saas', 'marketing'];
			let scriptText = `1. Define specifications clearly.\n2. Standardize core modules early.\n3. Run automation checks frequently.`;

			if (res.ok && data.variations && data.variations.length > 0) {
				const generatedText = data.variations[0];

				const titleMatch = generatedText.match(/(?:\*\*|\*|#)?\s*TITLE\s*(?:\*\*|\*|#)?\s*:\s*([\s\S]*?)(?=\s*(?:\*\*|\*|#)?\s*DESCRIPTION\s*(?:\*\*|\*|#)?\s*:|$)/i);
				const descMatch = generatedText.match(/(?:\*\*|\*|#)?\s*DESCRIPTION\s*(?:\*\*|\*|#)?\s*:\s*([\s\S]*?)(?=\s*(?:\*\*|\*|#)?\s*TAGS\s*(?:\*\*|\*|#)?\s*:|$)/i);
				const tagsMatch = generatedText.match(/(?:\*\*|\*|#)?\s*TAGS\s*(?:\*\*|\*|#)?\s*:\s*([\s\S]*?)(?=\s*(?:\*\*|\*|#)?\s*SCRIPT\s*(?:\*\*|\*|#)?\s*:|$)/i);
				const scriptMatch = generatedText.match(/(?:\*\*|\*|#)?\s*SCRIPT\s*(?:\*\*|\*|#)?\s*:\s*([\s\S]*?)$/i);

				if (titleMatch?.[1]) titleVal = titleMatch[1].replace(/['"]/g, '').trim();
				if (descMatch?.[1]) descVal = descMatch[1].trim();
				if (tagsMatch?.[1]) {
					const parsed = tagsMatch[1].split(/[,#\s]+/).map((t: string) => t.trim().toLowerCase()).filter(Boolean);
					if (parsed.length > 0) tagsVal = parsed;
				}
				if (scriptMatch?.[1]) scriptText = scriptMatch[1].trim();
			}

			setTitle(titleVal);
			setDescription(descVal);
			setTags(tagsVal);

			setVideoGenStep('Synthesizing frames & animating typography...');

			const slides = scriptText.split('\n').filter(Boolean);
			if (slides.length === 0) slides.push(scriptText);

			setVideoGenStep('Compiling and rendering final video file...');
			const videoFileResult = await runCanvasCompilation(slides, format === 'short');
			setVideoFile(videoFileResult);
			setVideoPreviewUrl(URL.createObjectURL(videoFileResult));
			showToast('Video generated successfully! Try playing it.');
		} catch (err: any) {
			console.error('Video generation failed:', err);
			showToast(`Failed to generate video: ${err.message || 'unknown error'}`);
		} finally {
			setIsVideoGenLoading(false);
		}
	};

	// Scan RSS trends via OpenRouter
	const handleScanTrends = async () => {
		setIsScanningTrends(true);
		setScoutedTrend(null);
		try {
			const res = await fetch('/api/social/youtube/trends', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					niche: selectedNiche,
					customUrl: customRssUrl,
				}),
			});
			const data = await res.json();
			if (res.ok && data.trend) {
				setScoutedTrend(data.trend);
				showToast('Niche trends scouted successfully!');
			} else {
				showToast(data.error || 'Failed to scout trends.');
			}
		} catch (err: any) {
			console.error('Scouting trends failed:', err);
			showToast('Error connecting to trends API.');
		} finally {
			setIsScanningTrends(false);
		}
	};

	// Apply trend script and auto-compile video
	const handleApplyTrend = async () => {
		if (!scoutedTrend) return;

		setIsGeneratingVideo(true);
		try {
			const rawTitle = scoutedTrend.videoTitle || scoutedTrend.video_title || scoutedTrend.title || scoutedTrend.Title || '';
			const rawDesc = scoutedTrend.videoDescription || scoutedTrend.video_description || scoutedTrend.description || scoutedTrend.Description || '';
			const rawTags = scoutedTrend.tags || scoutedTrend.Tags || scoutedTrend.keywords || [];
			const rawCategory = scoutedTrend.category || scoutedTrend.Category || '';

			if (rawTitle) setTitle(String(rawTitle).replace(/['"]/g, '').trim());
			if (rawDesc) setDescription(String(rawDesc).trim());
			if (Array.isArray(rawTags)) {
				setTags(rawTags.map((t: any) => String(t).trim()));
			} else if (typeof rawTags === 'string') {
				setTags(rawTags.split(/[,#\s\n\r]+/).map(t => t.trim()).filter(Boolean));
			}
			if (rawCategory) setCategory(String(rawCategory).trim());
			setFormat('short'); // Trend videos are always default Shorts (9:16)

			// Compile video
			const videoFileResult = await runCanvasCompilation(scoutedTrend.script, true);
			setVideoFile(videoFileResult);
			setVideoPreviewUrl(URL.createObjectURL(videoFileResult));

			// Swap back to generation view layout so they see the compiled WebM file in player preview
			setUploadMode('ai');
			showToast('Trend loaded and video compiled successfully!');
		} catch (err: any) {
			console.error('Failed to compile trend video:', err);
			showToast(`Failed to compile video: ${err.message || 'unknown error'}`);
		} finally {
			setIsGeneratingVideo(false);
		}
	};

	const wrapText = (context: CanvasRenderingContext2D, text: string, maxWidth: number) => {
		const words = text.split(' ');
		const lines = [];
		let currentLine = '';

		for (let n = 0; n < words.length; n++) {
			const testLine = currentLine + words[n] + ' ';
			const metrics = context.measureText(testLine);
			const testWidth = metrics.width;
			if (testWidth > maxWidth && n > 0) {
				lines.push(currentLine.trim());
				currentLine = words[n] + ' ';
			} else {
				currentLine = testLine;
			}
		}
		lines.push(currentLine.trim());
		return lines;
	};

	const fileToDataUrl = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = err => reject(err);
			reader.readAsDataURL(file);
		});
	};

	// Publish API trigger
	const handlePublishVideo = async (overrideDate?: string) => {
		if (!connectedAccount) {
			showToast('Please connect a YouTube channel to publish.');
			return;
		}
		if (format !== 'post' && !videoFile) {
			showToast('Please select or generate a video first.');
			return;
		}
		if (format !== 'post' && !title.trim()) {
			showToast('Please specify a video Title.');
			return;
		}
		if (format === 'post' && !description.trim()) {
			showToast('Please write the post content.');
			return;
		}

		setIsPublishing(true);
		setUploadProgress(0);

		// Animate upload progress bar for premium user experience
		const progressInterval = setInterval(() => {
			setUploadProgress(prev => {
				if (prev >= 90) {
					clearInterval(progressInterval);
					return 90;
				}
				return prev + Math.floor(Math.random() * 15) + 5;
			});
		}, 300);

		try {
			// Convert file to Base64 to send via API
			const mediaDataUrl = videoFile ? await fileToDataUrl(videoFile) : '';

			// Format description text incorporating tags
			const tagsText = format === 'post' ? '' : tags.map(t => `#${t}`).join(' ');
			let fullCaption = format === 'post' ? description : `${title}\n\n${description}\n\n${tagsText}`;

			// Explicit Shorts optimization: append #Shorts hashtag so YouTube categorizes it as a Short
			if (format === 'short') {
				if (!fullCaption.toLowerCase().includes('#shorts')) {
					fullCaption += '\n\n#Shorts';
				}
			}

			let endpoint = '/api/social/publish';
			let payload: any = {
				platform: 'youtube',
				caption: fullCaption,
				imageUrl: mediaDataUrl,
				visibility,
				categoryId: category,
				madeForKids,
			};

			const activeOption = overrideDate ? 'custom' : schedOption;
			if (activeOption !== 'now') {
				endpoint = '/api/social/schedule';
				payload = {
					platform: 'youtube',
					caption: fullCaption,
					imageUrl: mediaDataUrl || videoPreviewUrl || undefined,
					format: format === 'short' ? 'short' : 'video',
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

			if (res.ok) {
				if (schedOption !== 'now') {
					showToast(data.message || 'Scheduled successfully!');
					setIsPublishing(false);
					return;
				}

				const finalUrl = data.postUrl || `https://youtube.com/watch?v=demo_${Date.now()}`;
				
				if (videoPreviewUrl) {
					sessionStorage.setItem('feed_preview_media', videoPreviewUrl);
				} else {
					sessionStorage.removeItem('feed_preview_media');
				}

				setPublishedVideoUrl(finalUrl);
				setShowSuccessModal(true);

				// Extract videoId and set it to trigger live status tracking
				if (data.videoId) {
					setTrackingVideoId(data.videoId);
				} else {
					const match = finalUrl.match(/[?&]v=([^&#]+)/) || finalUrl.match(/shorts\/([^&#]+)/) || finalUrl.match(/post\/([^&#]+)/);
					if (match?.[1]) {
						setTrackingVideoId(match[1]);
					}
				}

				// Add to history state and persist to database
				const newItem: UploadHistoryItem = {
					id: 'yt-' + Date.now(),
					title: format === 'post' ? 'Community Post' : title,
					format: format === 'short' ? 'Shorts' : format === 'post' ? 'Post' : 'Video',
					visibility: visibility.charAt(0).toUpperCase() + visibility.slice(1),
					uploadedAt: 'Just now',
					copyrightStatus: 'Passed',
					url: finalUrl,
				};
				setHistory(prev => [newItem, ...prev]);

				try {
					await fetch('/api/social/youtube/history', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							title: format === 'post' ? 'Community Post' : title,
							description: description,
							tags: tags,
							visibility: visibility,
							categoryId: category,
							format: format === 'short' ? 'short' : 'video',
							videoUrl: finalUrl,
							videoId: data.videoId || trackingVideoId || '',
							status: 'processing',
							copyrightStatus: 'Pending',
						})
					});
					fetchHistory();
				} catch (historyErr) {
					console.error('Failed to save publish history item:', historyErr);
				}
				showToast(data.message || 'Published successfully!');
			} else {
				showToast(data.error || 'Failed to publish to YouTube.');
			}
		} catch (err: any) {
			console.error('Publishing error:', err);
			clearInterval(progressInterval);
			setUploadProgress(100);

			if (connectedAccount?.accountId && connectedAccount.accountId !== 'youtube_demo_channel_id') {
				// Show real error to the user!
				showToast(`Error publishing: ${err.message || 'Connection aborted or file too large'}`);
				return;
			}

			const fakeUrl = `/feed-preview?platform=youtube&accountName=YOUTUBE%20Demo%20User&caption=${encodeURIComponent(
				format === 'post' ? description : `${title}\n\n${description}`
			)}`;

			if (videoPreviewUrl) {
				sessionStorage.setItem('feed_preview_media', videoPreviewUrl);
			} else {
				sessionStorage.removeItem('feed_preview_media');
			}

			// Generate a fake video ID to trigger the simulated status tracker card!
			const simulatedVideoId = `mock_${Math.random().toString(36).substring(2, 7)}`;
			setTrackingVideoId(simulatedVideoId);

			setPublishedVideoUrl(fakeUrl);
			setShowSuccessModal(true);

			const newItem: UploadHistoryItem = {
				id: 'yt-' + Date.now(),
				title: format === 'post' ? 'Community Post' : title,
				format: format === 'short' ? 'Shorts' : format === 'post' ? 'Post' : 'Video',
				visibility: visibility.charAt(0).toUpperCase() + visibility.slice(1),
				uploadedAt: 'Just now (Demo)',
				copyrightStatus: 'Passed',
				url: fakeUrl,
			};
			setHistory(prev => [newItem, ...prev]);

			try {
				await fetch('/api/social/youtube/history', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						title: format === 'post' ? 'Community Post' : title,
						description: description,
						tags: tags,
						visibility: visibility,
						categoryId: category,
						format: format === 'short' ? 'short' : 'video',
						videoUrl: fakeUrl,
						videoId: simulatedVideoId,
						status: 'succeeded',
						copyrightStatus: 'Passed',
					})
				});
				fetchHistory();
			} catch (historyErr) {
				console.error('Failed to save publish history item:', historyErr);
			}
			showToast('Processed successfully (Demo Mode)!');
		} finally {
			setIsPublishing(false);
		}
	};

	return (
		<>
			<div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24 text-slate-900">
			{/* Toast Notification */}
			{notification && (
				<div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[10000] animate-fade-in-down">
					<div className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-700">
						<CheckCircle className="w-5 h-5 text-emerald-400" />
						<span className="font-semibold text-sm">{notification}</span>
					</div>
				</div>
			)}

			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<div className="flex items-center space-x-3 mb-1">
						<div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
							<Youtube className="w-6 h-6 text-white" />
						</div>
						<h1 className="text-3xl font-extrabold tracking-tight text-slate-900">YouTube Studio</h1>
					</div>
					<p className="text-sm font-medium text-slate-500">
						Generate SEO-optimized Titles/Tags, upload Shorts and videos, and scan files for copyright warnings.
					</p>
				</div>

				{/* Channel Connection Panel */}
				<div className="flex items-center">
					{connectedAccount ? (
						<div className="flex items-center space-x-4 bg-white border border-slate-200 rounded-2xl p-3 px-5 shadow-sm">
							<div className="flex items-center space-x-3">
								<div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
									<Youtube className="w-4.5 h-4.5" />
								</div>
								<div>
									<h4 className="text-sm font-bold text-slate-800">{connectedAccount.accountName}</h4>
									<p className="text-[10px] text-emerald-600 font-bold flex items-center">
										<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
										Channel Connected
									</p>
								</div>
							</div>
							<button
								onClick={handleDisconnect}
								className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors border-l border-slate-100 pl-4 py-1"
							>
								Disconnect
							</button>
						</div>
					) : (
						<button
							onClick={handleConnect}
							disabled={isConnecting}
							className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-md shadow-red-500/10 text-sm disabled:opacity-55 hover:scale-[1.02] active:scale-[0.98] duration-200"
						>
							{isConnecting ? (
								<RefreshCw className="w-4 h-4 animate-spin" />
							) : (
								<Youtube className="w-4 h-4" />
							)}
							<span>Connect YouTube Channel</span>
						</button>
					)}
				</div>
			</div>

			{/* Main Grid Workspace */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

				{/* Left Side: Buffer-Style Composer Panel (Grid Span 7) */}
				<div className="lg:col-span-7 space-y-6">
					<GlassCard className="p-6 border border-slate-200 shadow-sm space-y-6 bg-white">
						{/* Composer Header & Channel Account Tabs */}
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
							<div>
								<h3 className="font-bold text-slate-800 text-base">Create Post</h3>
								<p className="text-xs text-slate-400 mt-0.5 font-medium">Select format and design details for YouTube.</p>
							</div>

							{/* Account Tabs (Buffer style) */}
							<div className="flex items-center space-x-2">
								<div className="text-[10px] text-slate-400 font-bold uppercase mr-1.5 tracking-wider">Publishing to:</div>
								{connectedAccount ? (
									<div 
										className="relative group w-10 h-10 rounded-full border-2 border-red-500 p-0.5 bg-white cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200"
										title={connectedAccount.accountName}
									>
										<div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs border border-slate-200 uppercase overflow-hidden">
											{connectedAccount.accountName.slice(0, 2)}
										</div>
										<div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-red-650 rounded-full flex items-center justify-center border border-white text-white shadow-xs">
											<Youtube className="w-2.5 h-2.5" />
										</div>
									</div>
								) : (
									<div 
										onClick={handleConnect}
										className="w-10 h-10 rounded-full border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer hover:scale-105 active:scale-95 transition-all"
										title="Connect Channel"
									>
										<Plus className="w-4 h-4" />
									</div>
								)}
							</div>
						</div>

						{/* Format & Mode Options Row */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mb-6">
							{/* Format Selection Tab */}
							<div className="space-y-2">
								<label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Select Format</label>
								<div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-fit">
									<button
										onClick={() => setFormat('video')}
										className={`px-4 py-2 text-xs font-bold rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${format === 'video' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
									>
										Video (16:9)
									</button>
									<button
										onClick={() => setFormat('short')}
										className={`px-4 py-2 text-xs font-bold rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${format === 'short' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
									>
										Shorts (9:16)
									</button>
								</div>
							</div>

							{/* Video Media Slot Ingestion Box */}
							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
										Media Source
									</label>
									{videoFile && (
										<button
											onClick={removeVideoFile}
											className="text-red-555 hover:text-red-655 font-bold transition-colors flex items-center space-x-1 hover:scale-105 active:scale-95 duration-200 text-xs"
										>
											<Trash2 className="w-3.5 h-3.5" />
											<span>Remove</span>
										</button>
									)}
								</div>

								{!videoFile ? (
									/* Selector to generate vs upload */
									<div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px] font-bold w-fit space-x-1">
										<button
											onClick={() => changeUploadMode('upload')}
											className={`px-2.5 py-1.5 rounded-lg transition-colors ${uploadMode === 'upload' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
										>
											Direct Upload
										</button>
										<button
											onClick={() => changeUploadMode('ai')}
											className={`px-2.5 py-1.5 rounded-lg transition-colors ${uploadMode === 'ai' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
										>
											Generate with AI
										</button>
										<button
											onClick={() => changeUploadMode('trends')}
											className={`px-2.5 py-1.5 rounded-lg transition-colors ${uploadMode === 'trends' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
										>
											Auto-Pilot Trends
										</button>
									</div>
								) : (
									/* Video Loaded Details Row */
									<div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2 px-3 text-xs font-semibold text-slate-700">
										<div className="flex items-center space-x-2 truncate">
											<Video className="w-4 h-4 text-indigo-500 flex-shrink-0" />
											<span className="truncate max-w-[120px] text-slate-800">{videoFile.name}</span>
										</div>
										<span className="text-[10px] font-bold text-emerald-600">Linked</span>
									</div>
								)}
							</div>
						</div>

						{/* Video Media Dropzone / Prompt Box (Occupies full width below selection row) */}
						{!videoFile && (
							<div className="space-y-3 animate-in fade-in duration-300">
								{uploadMode === 'ai' ? (
									/* AI Prompt Video Generator Box */
									<div className="bg-slate-50 border border-indigo-50 rounded-2xl p-6 space-y-4 shadow-inner text-center">
										<div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-indigo-650 shadow-sm mx-auto">
											<Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
										</div>
										<div>
											<h4 className="text-xs font-bold text-slate-800">Generate a custom kinetic video using AI</h4>
											<p className="text-[11px] text-slate-500 mt-1">Specify a topic and we will compile a video with slides, layouts, and logo branding.</p>
										</div>

										{isVideoGenLoading ? (
											<div className="py-4 space-y-3">
												<RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
												<p className="text-xs font-bold text-indigo-600 animate-pulse">{videoGenStep}</p>
											</div>
										) : (
											<div className="space-y-3 max-w-md mx-auto">
												<input
													type="text"
													placeholder="Prompt script (e.g. 3 coding standards or saas launching tips)"
													value={videoGenPrompt}
													onChange={(e) => setVideoGenPrompt(e.target.value)}
													className="w-full bg-white border border-slate-250 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 focus:border-indigo-500 focus:outline-none text-xs shadow-sm"
												/>
												<Button
													onClick={handleGenerateVideo}
													disabled={!videoGenPrompt.trim()}
													className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold w-full py-3.5 rounded-xl shadow-md text-xs hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
												>
													Generate Video & Script
												</Button>
											</div>
										)}
									</div>
								) : uploadMode === 'trends' ? (
									/* Auto-Pilot Trends Scouting Box */
									<div className="space-y-4">
										<div className="bg-gradient-to-tr from-amber-500/10 to-indigo-500/5 border border-amber-200/50 rounded-2xl p-5 space-y-3 relative overflow-hidden">
											<div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 blur-[50px] pointer-events-none rounded-full"></div>
											
											<h3 className="font-extrabold text-slate-800 text-xs flex items-center space-x-1.5">
												<Zap className="w-4 h-4 text-amber-500 fill-amber-50" />
												<span>Autonomous Niche Trend Scouting</span>
											</h3>
											<p className="text-[10.5px] text-slate-500 leading-relaxed font-medium">
												Scout live RSS feeds in your industry niche. Gemini will select the most viral topic, write an optimized script, compile tags, and prepare your video.
											</p>

											<div className="space-y-3 pt-2">
												<div>
													<label className="block text-[9.5px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Select Niche Category</label>
													<div className="grid grid-cols-4 gap-2">
														{[
															{ id: 'tech', label: '💻 Tech' },
															{ id: 'finance', label: '📈 Markets' },
															{ id: 'science', label: '🚀 Science' },
															{ id: 'custom', label: '🔗 Custom' }
														].map((n) => (
															<button
																key={n.id}
																type="button"
																onClick={() => setSelectedNiche(n.id as any)}
																className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all text-center ${
																	selectedNiche === n.id 
																		? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
																		: 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
																}`}
															>
																{n.label}
															</button>
														))}
													</div>
												</div>

												{selectedNiche === 'custom' && (
													<div className="animate-in slide-in-from-top-1 duration-200">
														<label className="block text-[9.5px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Custom RSS Feed URL</label>
														<input
															type="text"
															placeholder="https://example.com/feed.xml"
															value={customRssUrl}
															onChange={(e) => setCustomRssUrl(e.target.value)}
															className="w-full bg-white border border-slate-250 text-slate-900 placeholder-slate-400 text-xs rounded-xl px-3.5 py-2.5 focus:border-indigo-500 focus:outline-none shadow-xs font-semibold"
														/>
													</div>
												)}

												<Button
													type="button"
													onClick={handleScanTrends}
													disabled={isScanningTrends || (selectedNiche === 'custom' && !customRssUrl.trim())}
													className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
												>
													{isScanningTrends ? (
														<>
															<RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
															<span>Scouting Live Niche Trends...</span>
														</>
													) : (
														<>
															<Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
															<span>Scout & Auto-Pilot Latest Trends</span>
														</>
													)}
												</Button>
											</div>
										</div>

										{/* Trend Scout Results Display */}
										{scoutedTrend && (
											<div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4 animate-in fade-in duration-300">
												<div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100">
													<div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
														<Sparkles className="w-3 h-3 text-amber-500 fill-amber-50" />
													</div>
													<h4 className="font-extrabold text-slate-800 text-[10.5px] uppercase tracking-wider">Hot Trend Identified</h4>
												</div>

												<div className="space-y-3">
													<div>
														<span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Original Headline</span>
														<p className="font-bold text-slate-800 text-[11px] leading-snug">{scoutedTrend.trendTitle}</p>
													</div>

													<div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-2.5">
														<span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider block mb-0.5">Scout Analysis</span>
														<p className="text-[10px] text-slate-600 font-medium leading-relaxed">{scoutedTrend.explanation}</p>
													</div>

													<div className="grid grid-cols-2 gap-4 pt-1">
														<div>
															<span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Proposed SEO Title</span>
															<p className="text-[10px] text-slate-800 font-bold truncate" title={scoutedTrend.videoTitle}>{scoutedTrend.videoTitle}</p>
														</div>
														<div>
															<span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Suggested Category</span>
															<p className="text-[10px] text-slate-850 font-bold">
																{scoutedTrend.category === '28' ? 'Science & Technology' : scoutedTrend.category === '27' ? 'Education' : scoutedTrend.category === '22' ? 'Blogs & People' : 'Entertainment'}
															</p>
														</div>
													</div>

													<div className="pt-2 border-t border-slate-50">
														<span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Generated Short Script</span>
														<div className="space-y-1.5">
															{scoutedTrend.script.map((slideText: string, idx: number) => (
																<div key={idx} className="flex items-start space-x-2 text-[10px] text-slate-600 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
																	<span className="font-extrabold text-indigo-500 text-[9.5px]">SLIDE {idx + 1}:</span>
																	<span className="flex-1 leading-snug">{slideText}</span>
																</div>
															))}
														</div>
													</div>

													<Button
														type="button"
														onClick={handleApplyTrend}
														disabled={isGeneratingVideo}
														className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
													>
														{isGeneratingVideo ? (
															<>
																<RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
																<span>Generating Auto-Pilot Video...</span>
															</>
														) : (
															<>
																<Sparkles className="w-3.5 h-3.5 text-white" />
																<span>Apply & Auto-Generate Video</span>
															</>
														)}
													</Button>
												</div>
											</div>
										)}
									</div>
								) : (
									/* Direct Uploader Dropzone */
									<div
										{...getRootProps()}
										className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${isDragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'}`}
									>
										<input {...getInputProps()} />
										<div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm mb-3 group-hover:scale-105 transition-transform">
											<Upload className="w-5 h-5 text-slate-500" />
										</div>
										<p className="text-xs font-bold text-slate-800 mb-1">
											Drag and drop your video file here
										</p>
										<p className="text-[11px] text-slate-500">
											Supports MP4, WebM, MOV or AVI (Up to 100MB)
										</p>
									</div>
								)}
							</div>
						)}

						{/* Editor: Video Title and AI SEO Booster */}
						<div className="space-y-4 pt-2">
							<div className="bg-slate-50 border border-indigo-100 rounded-2xl p-4 space-y-3 shadow-inner">
								<div className="flex items-center justify-between">
									<label className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider flex items-center space-x-1">
										<Sparkles className="w-3.5 h-3.5 text-indigo-500" />
										<span>AI SEO BOOSTER</span>
									</label>
									<span className="text-[10px] text-slate-400 font-semibold">
										Generates high-SEO Title, Desc & Tags
									</span>
								</div>
								<div className="flex gap-2.5">
									<input
										type="text"
										placeholder="Describe your video topic (e.g. build ecommerce store in Nextjs)"
										value={aiPrompt}
										onChange={(e) => setAiPrompt(e.target.value)}
										className="flex-1 bg-white border border-slate-250 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none text-sm shadow-sm"
									/>
									<Button
										onClick={handleAiBoost}
										disabled={isBoosting}
										className="bg-indigo-600 hover:bg-indigo-705 text-white font-bold px-5 py-2.5 rounded-xl flex items-center space-x-1 text-xs shadow-md shadow-indigo-500/10 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
									>
										{isBoosting ? (
											<RefreshCw className="w-4.5 h-4.5 animate-spin" />
										) : (
											<>
												<Sparkles className="w-4 h-4" />
												<span>{hasBoosted ? 'Re-Gen' : 'Boost'}</span>
											</>
										)}
									</Button>
								</div>

								<div className="flex items-center space-x-2 pt-1">
									<input
										type="checkbox"
										id="includeBrandProfile"
										checked={includeBrandProfile}
										onChange={(e) => setIncludeBrandProfile(e.target.checked)}
										className="w-3.5 h-3.5 rounded text-indigo-650 focus:ring-indigo-500 border-slate-300 cursor-pointer"
									/>
									<label
										htmlFor="includeBrandProfile"
										className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer select-none"
									>
										Apply Brand guidelines (Voice, Slogan, CTA, Handles)
									</label>
								</div>
							</div>

							{/* Title field */}
							<div>
								<div className="flex justify-between mb-1.5">
									<label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Video Title</label>
									<span className="text-xs font-medium text-slate-400">{title.length} / 100</span>
								</div>
								<Input
									value={title}
									onChange={(e) => setTitle(e.target.value.slice(0, 100))}
									placeholder="Add a title that describes your video (use AI booster for SEO)"
									className="bg-white border-slate-200 text-slate-900 text-sm shadow-sm focus:border-indigo-500 rounded-xl px-4 py-3"
								/>
							</div>

							{/* Description field */}
							<div>
								<div className="flex justify-between mb-1.5">
									<label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
										Description / Caption
									</label>
									<span className="text-xs font-medium text-slate-400">{description.length} / 5000</span>
								</div>
								<textarea
									value={description}
									onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
									rows={6}
									placeholder="Tell viewers about your video, insert social links, timelines or site resources..."
									className="w-full bg-white border border-slate-250 text-slate-900 placeholder-slate-455 text-sm rounded-xl px-4 py-3 focus:border-indigo-500 focus:outline-none shadow-sm resize-none"
								/>
							</div>
						</div>

						{/* Settings Drawer Segment (Collapsible / structured layout) */}
						<div className="border-t border-slate-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-4">
								<div>
									<label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Visibility</label>
									<select
										value={visibility}
										onChange={(e) => setVisibility(e.target.value as any)}
										className="w-full bg-white border border-slate-250 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none shadow-sm font-semibold"
									>
										<option value="public">🌐 Public (Instant release)</option>
										<option value="private">🔒 Private (Only you can view)</option>
										<option value="unlisted">🔗 Unlisted (Anyone with link)</option>
									</select>
								</div>
								<div>
									<label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Category</label>
									<select
										value={category}
										onChange={(e) => setCategory(e.target.value)}
										className="w-full bg-white border border-slate-250 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:outline-none shadow-sm font-semibold"
									>
										<option value="22">Blogs & People</option>
										<option value="27">Education & Tutorials</option>
										<option value="28">Science & Technology</option>
										<option value="24">Entertainment</option>
										<option value="1">Film & Animation</option>
									</select>
								</div>
							</div>

							{/* Tags / Keywords Manager */}
							<div>
								<label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tags / Keywords</label>
								<div className="bg-white border border-slate-250 rounded-xl p-3 focus-within:border-indigo-500 transition-colors shadow-sm space-y-3">
									<div className="flex flex-wrap gap-2 max-h-[85px] overflow-y-auto">
										{tags.map(tag => (
											<span
												key={tag}
												className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded-lg border border-slate-200"
											>
												<span>#{tag}</span>
												<button
													onClick={() => handleRemoveTag(tag)}
													className="text-slate-400 hover:text-red-500 transition-colors ml-1 text-xs"
												>
													&times;
												</button>
											</span>
										))}
										{tags.length === 0 && (
											<span className="text-[11px] text-slate-400 font-semibold">No tags added yet. Add keywords below.</span>
										)}
									</div>
									<div className="flex gap-2 pt-1 border-t border-slate-50">
										<input
											type="text"
											placeholder="Add tags (press Enter)"
											value={tagInput}
											onChange={(e) => setTagInput(e.target.value)}
											onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
											className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 text-xs"
										/>
										<button
											onClick={handleAddTag}
											className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
										>
											+ Add
										</button>
									</div>
								</div>
							</div>
						</div>
					</GlassCard>
				</div>

				{/* Right Side: Buffer-Style Live Preview & Publishing (Grid Span 5) */}
				<div className="lg:col-span-5 space-y-6">
					
					{/* Interactive YouTube Preview Device Mock */}
					<GlassCard className="p-5 border border-slate-200 shadow-sm space-y-4 bg-white">
						<div className="flex items-center justify-between pb-2 border-b border-slate-100">
							<h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
								<Eye className="w-4.5 h-4.5 text-slate-500" />
								<span>Post Previews</span>
							</h3>
							<span className="text-[10px] text-slate-400 font-extrabold uppercase px-2 py-0.5 bg-slate-100 rounded-md">YouTube</span>
						</div>

						{/* Mock Device Container */}
						<div className="flex items-center justify-center py-2 bg-slate-50 rounded-2xl border border-slate-150 shadow-inner">
							{format === 'short' ? (
								/* YouTube Shorts Vertical Mock Phone */
								<div className="w-[220px] aspect-[9/16] rounded-[32px] overflow-hidden bg-slate-950 border-[6px] border-slate-900 relative shadow-2xl flex flex-col justify-between select-none">
									{/* Camera notch */}
									<div className="absolute top-1 left-1/2 -translate-x-1/2 w-14 h-4 bg-slate-900 rounded-full z-30"></div>
									
									{/* Player Video / Gradient Area */}
									<div className="absolute inset-0 w-full h-full z-0 flex items-center justify-center">
										{videoPreviewUrl ? (
											<video
												src={videoPreviewUrl}
												controls={false}
												autoPlay
												muted
												loop
												className="w-full h-full object-cover"
											/>
										) : (
											<MockPlaceholder />
										)}
									</div>

									{/* Right side floating interaction buttons */}
									<div className="absolute right-2 bottom-16 flex flex-col items-center space-y-3 z-10">
										{/* Channel Avatar */}
										<div className="w-7 h-7 rounded-full bg-red-650 border border-white flex items-center justify-center text-white text-[9px] font-bold uppercase shadow-sm">
											{connectedAccount ? connectedAccount.accountName.slice(0, 1) : 'Y'}
										</div>
										{/* Thumbs up */}
										<div className="flex flex-col items-center text-center">
											<div className="w-6.5 h-6.5 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white cursor-pointer hover:bg-black/60 transition-colors">
												<span className="text-[9px]">👍</span>
											</div>
											<span className="text-[7px] text-white font-bold mt-0.5 shadow-sm">Like</span>
										</div>
										{/* Thumbs down */}
										<div className="flex flex-col items-center text-center">
											<div className="w-6.5 h-6.5 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white cursor-pointer hover:bg-black/60 transition-colors">
												<span className="text-[9px]">👎</span>
											</div>
											<span className="text-[7px] text-white font-bold mt-0.5 shadow-sm">Dislike</span>
										</div>
										{/* Comments */}
										<div className="flex flex-col items-center text-center">
											<div className="w-6.5 h-6.5 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white cursor-pointer hover:bg-black/60 transition-colors">
												<span className="text-[9px]">💬</span>
											</div>
											<span className="text-[7px] text-white font-bold mt-0.5 shadow-sm">1.2K</span>
										</div>
										{/* Vinyl rotating record */}
										<div className="w-6 h-6 rounded-full bg-slate-850 border border-slate-750 flex items-center justify-center animate-spin" style={{ animationDuration: '4s' }}>
											<div className="w-2 h-2 rounded-full bg-white"></div>
										</div>
									</div>

									{/* Bottom metadata script overlays */}
									<div className="absolute left-2 bottom-2 z-10 text-white space-y-1.5 right-10">
										<div className="flex items-center space-x-1">
											<span className="text-[9px] font-bold truncate">@{connectedAccount ? connectedAccount.accountName.toLowerCase().replace(/\s+/g, '') : 'youtubechannel'}</span>
											<span className="text-[7px] font-extrabold bg-red-650 px-1 py-0.2 rounded-sm">SUBSCRIBE</span>
										</div>
										<p className="text-[8px] line-clamp-2 leading-tight text-white/90 font-medium">
											{description || title || 'Kinetic Shorts content description placeholder...'}
										</p>
										<div className="flex items-center space-x-1 text-[7px] text-white/80 font-bold bg-black/20 backdrop-blur-xs w-fit px-1 py-0.2 rounded-sm">
											<span>🎵 Original Audio - YouTube</span>
										</div>
									</div>
								</div>
							) : (
								/* YouTube Video Horizontal Mock Player */
								<div className="w-[300px] aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-850 relative shadow-2xl flex flex-col justify-end group select-none">
									{/* Player Video / Gradient Area */}
									<div className="absolute inset-0 w-full h-full z-0 flex items-center justify-center">
										{videoPreviewUrl ? (
											<video
												src={videoPreviewUrl}
												controls={false}
												autoPlay
												muted
												loop
												className="w-full h-full object-cover"
											/>
										) : (
											<MockPlaceholder />
										)}
									</div>

									{/* Player Bottom controls overlay */}
									<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 space-y-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
										{/* Progress timeline bar */}
										<div className="h-1 bg-white/20 rounded-full overflow-hidden relative cursor-pointer">
											<div className="absolute left-0 top-0 bottom-0 w-[45%] bg-red-650 rounded-full"></div>
										</div>
										{/* Action buttons list */}
										<div className="flex items-center justify-between text-white text-[9px] font-bold">
											<div className="flex items-center space-x-3">
												<span>▶</span>
												<span>🔇</span>
												<span>0:12 / 1:45</span>
											</div>
											<div className="flex items-center space-x-3">
												<span>CC</span>
												<span>⚙</span>
												<span>[ ]</span>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</GlassCard>

					{/* Compact Publishing Action Card */}
					<div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
						<style>{`
							@keyframes shine {
								100% {
									transform: translateX(100%);
								}
							}
							.animate-shine {
								animation: shine 1.8s infinite;
							}
							@keyframes pulse-glow {
								0%, 100% {
									box-shadow: 0 4px 10px 0 rgba(239, 68, 68, 0.3);
								}
								50% {
									box-shadow: 0 4px 16px 5px rgba(239, 68, 68, 0.45);
								}
							}
							.animate-pulse-glow:not(:disabled) {
								animation: pulse-glow 2s infinite ease-in-out;
							}
						`}</style>

						{isPublishing ? (
							<div className="space-y-2 py-0.5">
								<div className="flex justify-between text-[11px] font-bold text-slate-500">
									<span className="flex items-center space-x-1.5">
										<RefreshCw className="w-3 h-3 text-red-500 animate-spin" />
										<span>Publishing to YouTube...</span>
									</span>
									<span>{uploadProgress}%</span>
								</div>
								<div className="h-1.5 bg-slate-150 rounded-full overflow-hidden">
									<div
										className="h-full bg-gradient-to-r from-red-500 to-rose-500 transition-all rounded-full"
										style={{ width: `${uploadProgress}%` }}
									/>
								</div>
							</div>
						) : connectedAccount ? (
							<div className="flex items-center relative w-full" ref={schedMenuRef}>
								{/* Next Available Button with Tooltip */}
								<div className="relative group/tooltip">
									{/* Tooltip Popup on Hover */}
									<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50">
										When to Post
									</div>

									<button 
										onClick={() => setIsSchedMenuOpen(!isSchedMenuOpen)}
										disabled={isPublishing}
										className="flex items-center space-x-1 px-3 py-3 border border-slate-200 rounded-l-xl bg-white text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs z-10 h-11"
									>
										<CalendarDays className="w-3.5 h-3.5 text-slate-400" />
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
																	if (isNaN(num) || num < 0 || num > 23) setTimeHours('13');
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
															let hr = parseInt(timeHours || '13');
															const mins = parseInt(timeMinutes || '0');
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

								{/* Action trigger button */}
								<Button
									onClick={() => handlePublishVideo()}
									disabled={(format !== 'post' && !videoFile) || isPublishing}
									className="relative flex-1 bg-gradient-to-r from-red-650 to-rose-650 hover:from-red-600 hover:to-rose-600 text-white font-extrabold py-3 rounded-r-xl text-xs flex items-center justify-center space-x-1.5 border-none disabled:opacity-40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 overflow-hidden group animate-pulse-glow -ml-[1px] z-20 h-11"
								>
									<div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shine z-0"></div>
									<Youtube className="w-4.5 h-4.5 text-white z-10" />
									<span className="z-10 uppercase tracking-wider">
										{schedOption === 'now' ? (format === 'short' ? 'Publish Short' : 'Publish Video') : 'Schedule Video'}
									</span>
								</Button>
							</div>
						) : (
							<Button
								disabled
								className="w-full bg-slate-100 text-slate-400 font-extrabold py-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 border-none opacity-50 cursor-not-allowed"
							>
								<Youtube className="w-4 h-4 text-slate-400" />
								<span className="uppercase tracking-wider">Publish Video</span>
							</Button>
						)}
						{!connectedAccount && (
							<p className="text-[9px] text-slate-400 text-center font-bold">Please connect a channel in the top panel to unlock publishing.</p>
						)}
					</div>

					{/* Compact Recent Uploads Card */}
					{connectedAccount && (
						<GlassCard className="p-4 border border-slate-200 shadow-sm space-y-3 bg-white">
							<div className="flex items-center justify-between pb-2 border-b border-slate-100">
								<h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
									<History className="w-4 h-4 text-indigo-500" />
									<span>Recent Uploads</span>
								</h3>
								<div className="flex items-center space-x-2">
									<button
										onClick={handleRefreshHistory}
										disabled={isRefreshingHistory}
										className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
										title="Refresh history"
									>
										<RefreshCw className={`w-3 h-3 ${isRefreshingHistory ? 'animate-spin' : ''}`} />
									</button>
									<span className="text-[10px] text-slate-400 font-bold">{history.length} logged</span>
								</div>
							</div>

							{isLoadingHistory ? (
								<div className="space-y-1">
									{[1, 2, 3].map((n) => (
										<div key={n} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-b-0 px-2 -mx-2 rounded-xl animate-pulse">
											<div className="space-y-1.5 flex-1 pr-3">
												<div className="h-3 bg-slate-200 rounded w-2/3"></div>
												<div className="flex space-x-2">
													<div className="h-2.5 bg-slate-200 rounded w-8"></div>
													<div className="h-2.5 bg-slate-200 rounded w-16"></div>
												</div>
											</div>
											<div className="w-7 h-7 bg-slate-200 rounded-lg"></div>
										</div>
									))}
								</div>
							) : history.length === 0 ? (
								<p className="text-[10px] text-slate-400 font-medium text-center py-2">No uploads found in your history.</p>
							) : (
								<div className="space-y-1">
									{history.slice(0, 3).map((item) => (
										<div key={item.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 px-2 -mx-2 rounded-xl transition-colors">
											<div className="space-y-1 truncate flex-1 pr-3">
												<h4 className="font-bold text-slate-800 text-[11px] truncate block max-w-[200px]">{item.title}</h4>
												<div className="flex items-center space-x-2 text-[9px] font-semibold text-slate-400">
													<span className={`px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider font-extrabold border ${item.format === 'Shorts' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-indigo-50 text-indigo-500 border-indigo-100'}`}>
														{item.format}
													</span>
													<span>{item.uploadedAt}</span>
												</div>
											</div>
											<a
												href={item.url}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center justify-center p-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-500 text-indigo-600 hover:text-indigo-700 shadow-xs hover:scale-105 active:scale-95 transition-all"
												title="Watch Video"
											>
												<ExternalLink className="w-3.5 h-3.5" />
											</a>
										</div>
									))}

									{history.length > 3 && (
										<button
											onClick={() => setShowHistoryModal(true)}
											className="w-full text-center text-[10px] font-bold text-indigo-600 hover:text-indigo-700 py-2 hover:bg-indigo-50/50 rounded-lg transition-colors border border-dashed border-indigo-200 hover:border-indigo-300 mt-2"
										>
											View More History
										</button>
									)}
								</div>
							)}
						</GlassCard>
					)}

					{/* Compact Audience (Kids) Card */}
					{connectedAccount && (
						<GlassCard className="p-4 border border-slate-200 shadow-sm space-y-3 bg-white">
							<div className="flex items-center justify-between pb-2 border-b border-slate-100">
								<h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
									<Users className="w-4 h-4 text-indigo-500" />
									<span>Audience Settings</span>
								</h3>
								<span className="text-[9px] text-slate-400 font-extrabold uppercase px-2 py-0.5 bg-slate-100 rounded-md">YouTube COPPA</span>
							</div>

							<div className="space-y-2.5">
								<p className="text-[10px] text-slate-500 font-medium leading-relaxed">
									Is this video made for kids? Required by YouTube to comply with Child Online Privacy Protection Act.
								</p>
								<div className="grid grid-cols-2 gap-2">
									<button
										type="button"
										onClick={() => setMadeForKids(true)}
										className={`py-2.5 px-1.5 rounded-xl text-[10px] font-extrabold transition-all border ${
											madeForKids 
												? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs' 
												: 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
										}`}
									>
										👶 Yes, Made for Kids
									</button>
									<button
										type="button"
										onClick={() => setMadeForKids(false)}
										className={`py-2.5 px-1.5 rounded-xl text-[10px] font-extrabold transition-all border ${
											!madeForKids 
												? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs' 
												: 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
										}`}
									>
										🧑 No, Adults Only
									</button>
								</div>
							</div>
						</GlassCard>
					)}

				</div>
			</div>
		</div>

		{/* YouTube Upload Success Modal */}
			{showSuccessModal && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
					<div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-200 relative">
						
						{/* Close button at top right corner */}
						<button 
							onClick={() => setShowSuccessModal(false)}
							className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:scale-105 active:scale-95 transition-all z-10 p-1.5 hover:bg-slate-100 rounded-full"
							aria-label="Close modal"
						>
							<X className="w-5 h-5" />
						</button>

						<div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
							
							{/* Left Column: Live YouTube Processing Suite */}
							<div className="p-6 space-y-5 bg-slate-50/50 flex flex-col justify-between">
								<div className="space-y-5">
									<div>
										<div className="flex items-center justify-between">
											<h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
												<RefreshCw className="w-4.5 h-4.5 text-indigo-500 animate-spin" />
												<span>Live Server Processing</span>
											</h3>
											<span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${liveProcessingStatus === 'succeeded' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600 animate-pulse'}`}>
												{liveProcessingStatus === 'succeeded' ? 'Completed' : 'Scanning'}
											</span>
										</div>
										<p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed">
											Google servers are transcoding video resolutions and running Content ID checks.
										</p>
									</div>

									{/* Video Info Row */}
									<div className="bg-white border border-slate-200 rounded-xl p-3 text-[11px] font-semibold text-slate-700 flex justify-between items-center shadow-xs">
										<span className="text-slate-500">YouTube Video ID:</span>
										<span className="font-mono text-slate-800 font-bold">{trackingVideoId || 'Retrieving...'}</span>
									</div>

									{/* Processing Progress */}
									<div className="space-y-2">
										<div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
											<span>RESOLUTION TRANSCODE PROGRESS</span>
											<span>{liveProcessingProgress}%</span>
										</div>
										<div className="h-2 bg-slate-100 rounded-full overflow-hidden">
											<div 
												className={`h-full transition-all duration-500 rounded-full ${liveProcessingStatus === 'succeeded' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
												style={{ width: `${liveProcessingProgress}%` }}
											/>
										</div>
									</div>

									{/* Live status check items */}
									<div className="space-y-2 bg-white border border-slate-200 rounded-2xl p-4 text-[11px] font-semibold text-slate-700 shadow-xs">
										<div className="flex items-center justify-between border-b border-slate-50 pb-2">
											<span>Google Ingestion</span>
											<span className="text-emerald-600 flex items-center">
												<CheckCircle className="w-3 h-3 mr-1" /> Complete
											</span>
										</div>
										<div className="flex items-center justify-between border-b border-slate-50 pb-2">
											<span>Copyright check</span>
											<span className={liveCopyrightStatus === 'Warning' ? 'text-red-500' : liveCopyrightStatus === 'Passed' && liveProcessingStatus === 'succeeded' ? 'text-emerald-600' : 'text-amber-500 animate-pulse'}>
												{liveCopyrightStatus === 'Warning' ? 'Flagged Warning' : liveProcessingStatus === 'succeeded' ? 'Cleared Safe' : 'Scanning...'}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span>Compliance Details</span>
											<span className="text-slate-450 font-medium truncate max-w-[140px] text-right">
												{liveCopyrightDetails}
											</span>
										</div>
									</div>
								</div>

								{/* Notify option toggle card placed in left column bottom */}
								<div className="flex items-center space-x-2.5 bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
									<input
										id="notify-toggle"
										type="checkbox"
										checked={notifyOnComplete}
										onChange={(e) => handleNotifyToggle(e.target.checked)}
										className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:outline-none cursor-pointer"
									/>
									<label htmlFor="notify-toggle" className="text-[10.5px] font-bold text-slate-650 cursor-pointer flex-1">
										Notify me on desktop when video goes live
									</label>
								</div>
							</div>

							{/* Right Column: Modal Actions & Video details */}
							<div className="p-6 space-y-5 flex flex-col justify-between">
								<div className="space-y-4">
									<div className="text-center">
										{liveProcessingStatus === 'succeeded' ? (
											<>
												<div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-2 border border-emerald-100 shadow-xs">
													<CheckCircle className="w-6 h-6" />
												</div>
												<h3 className="text-lg font-extrabold text-slate-900">Successfully Posted!</h3>
												<p className="text-[10px] text-slate-400 mt-0.5">Your video is now live and public on YouTube.</p>
											</>
										) : (
											<>
												<div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-2 border border-indigo-100 shadow-xs animate-pulse">
													<RefreshCw className="w-6 h-6 animate-spin" />
												</div>
												<h3 className="text-lg font-extrabold text-slate-900">Copyright Scanning...</h3>
												<p className="text-[10px] text-slate-400 mt-0.5 font-medium">Checking video assets for copyright and compliance.</p>
											</>
										)}
									</div>

									{/* Video preview horizontal outline */}
									<div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 shadow-xs">
										<div className="bg-slate-950 aspect-video flex items-center justify-center text-slate-455 relative">
											{videoPreviewUrl ? (
												<video
													src={videoPreviewUrl}
													controls
													className="w-full h-full object-contain"
												/>
											) : (
												<div className="flex flex-col items-center">
													<Play className="w-8 h-8 text-slate-500 mb-1" />
													<span className="text-[10px] font-semibold">Video Preview</span>
												</div>
											)}
										</div>
										<div className="p-3.5 space-y-1.5">
											<h4 className="font-bold text-slate-800 text-xs truncate">{title}</h4>
											<p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{description}</p>
										</div>
									</div>
								</div>

								{/* Action buttons (Only the single button view link!) */}
								<div className="pt-2">
									<a
										href={publishedVideoUrl || `https://youtube.com/watch?v=${trackingVideoId}`}
										target="_blank"
										rel="noopener noreferrer"
										onClick={(e) => {
											if (liveProcessingStatus !== 'succeeded') {
												e.preventDefault();
												showToast('Video link is active once transcode completes!');
											}
										}}
										className={`w-full inline-flex items-center justify-center space-x-1.5 font-bold py-3.5 rounded-xl text-xs shadow-xs transition-all duration-200 ${liveProcessingStatus === 'succeeded' ? 'bg-slate-900 hover:bg-slate-800 text-white hover:scale-[1.01] active:scale-[0.99]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
									>
										<span>{liveProcessingStatus === 'succeeded' ? 'View on YouTube Live' : 'Processing Live Link...'}</span>
										<ExternalLink className="w-3.5 h-3.5" />
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* YouTube Full History Modal */}
			{showHistoryModal && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
					<div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl border border-slate-200 relative flex flex-col">
						{/* Close button */}
						<button 
							onClick={() => setShowHistoryModal(false)}
							className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:scale-105 active:scale-95 transition-all z-10 p-1.5 hover:bg-slate-100 rounded-full cursor-pointer"
							aria-label="Close modal"
						>
							<X className="w-5 h-5" />
						</button>

						<div className="p-6 border-b border-slate-100 flex items-center space-x-2">
							<History className="w-5 h-5 text-indigo-500" />
							<h3 className="text-lg font-bold text-slate-800">All YouTube Studio Uploads</h3>
							<span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{history.length} items logged</span>
						</div>

						<div className="p-6 overflow-y-auto flex-1">
							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs font-semibold text-slate-700">
									<thead>
										<tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
											<th className="pb-3 w-[45%]">Post/Video Title</th>
											<th className="pb-3 text-center">Format</th>
											<th className="pb-3 text-center">Visibility</th>
											<th className="pb-3 text-center">Upload Date</th>
											<th className="pb-3 text-center">Copyright</th>
											<th className="pb-3 text-right">Action</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-50">
										{history.map((item) => (
											<tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
												<td className="py-4 pr-4">
													<div className="flex items-center space-x-3">
														<div className="w-12 h-8 bg-slate-100 rounded border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
															{item.format === 'Post' ? (
																<ImageIcon className="w-4 h-4 text-slate-400" />
															) : (
																<Video className="w-4 h-4 text-slate-400" />
															)}
														</div>
														<span className="font-bold text-slate-800 truncate max-w-[280px]">{item.title}</span>
													</div>
												</td>
												<td className="py-4 text-center">
													<span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.format === 'Shorts' ? 'bg-red-50 text-red-600' : item.format === 'Post' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
														{item.format}
													</span>
												</td>
												<td className="py-4 text-center">
													<span className="text-slate-500 flex items-center justify-center">
														{item.visibility === 'Public' ? (
															<Globe className="w-3.5 h-3.5 text-slate-400 mr-1" />
														) : item.visibility === 'Private' ? (
															<Lock className="w-3.5 h-3.5 text-slate-400 mr-1" />
														) : (
															<Eye className="w-3.5 h-3.5 text-slate-400 mr-1" />
														)}
														{item.visibility}
													</span>
												</td>
												<td className="py-4 text-center text-slate-500">{item.uploadedAt}</td>
												<td className="py-4 text-center">
													<span className={`inline-flex items-center space-x-0.5 font-bold ${item.copyrightStatus === 'Passed' ? 'text-emerald-600' : 'text-red-500'}`}>
														{item.copyrightStatus === 'Passed' ? (
															<CheckCircle className="w-3.5 h-3.5 mr-0.5" />
														) : (
															<AlertCircle className="w-3.5 h-3.5 mr-0.5" />
														)}
														{item.copyrightStatus}
													</span>
												</td>
												<td className="py-4 text-right">
													<a
														href={item.url}
														target="_blank"
														rel="noopener noreferrer"
														className="text-indigo-600 hover:text-indigo-700 font-bold inline-flex items-center space-x-0.5 hover:underline"
													>
														<span>View</span>
														<ExternalLink className="w-3 h-3" />
													</a>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
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
									<h2 className="text-2xl font-extrabold text-slate-900 mt-2">Schedule Video</h2>
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
													if (isNaN(num) || num < 0 || num > 23) setTimeHours('13');
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
												onClick={() => {
													let hr = parseInt(timeHours || '13');
													const mins = parseInt(timeMinutes || '0');
													
													const finalDate = new Date(selectedDate.getTime());
																	finalDate.setHours(hr, mins, 0, 0);

													setCustomSchedDate(finalDate.toISOString());
													setSchedOption('custom');
													setIsCalendlyOpen(false);
													handlePublishVideo(finalDate.toISOString());
												}}
												className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-1.5 px-2.5 rounded-lg text-xs transition-colors text-center shadow-xs"
											>
												Publish
											</button>
										</div>
									</div>

									<div className="space-y-2 pr-2">
										{[
											'09:00', '09:30', '10:00', '10:30', 
											'11:00', '11:30', '12:00', '12:30', 
											'13:00', '13:30', '14:00', '14:30', 
											'15:00', '15:30', '16:00', '16:30', 
											'17:00', '17:30', '18:00', '18:30', 
											'19:00'
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
																	let [hStr, mStr] = slot.split(':');
																	let hr = parseInt(hStr);
																	const mins = parseInt(mStr);
																	
																	const finalDate = new Date(selectedDate.getTime());
																	finalDate.setHours(hr, mins, 0, 0);

																	setCustomSchedDate(finalDate.toISOString());
																	setSchedOption('custom');
																	setIsCalendlyOpen(false);
																	handlePublishVideo(finalDate.toISOString());
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
		</>
	);
}
