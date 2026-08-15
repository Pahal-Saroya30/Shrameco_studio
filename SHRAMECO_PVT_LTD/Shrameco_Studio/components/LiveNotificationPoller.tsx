'use client';

import React, { useState, useEffect } from 'react';
import { Youtube, Linkedin, Twitter, Facebook, Instagram, CheckCircle2, ExternalLink, X } from 'lucide-react';

interface Post {
	_id: string;
	platform: 'instagram' | 'linkedin' | 'x' | 'facebook' | 'youtube';
	caption: string;
	imageUrl?: string;
	format: string;
	status: 'queued' | 'sent' | 'failed' | 'draft';
	scheduledAt: string;
	postUrl?: string;
}

interface NotificationItem {
	id: string;
	title: string;
	message: string;
	platform: string;
	postUrl?: string;
}

export function LiveNotificationPoller() {
	const [activeNotifications, setActiveNotifications] = useState<NotificationItem[]>([]);
	
	useEffect(() => {
		// Initialize notified list in localStorage if not exists
		if (typeof window === 'undefined') return;
		if (!localStorage.getItem('shrameco_notified_post_ids')) {
			localStorage.setItem('shrameco_notified_post_ids', JSON.stringify([]));
		}

		// Keep track of the previous queued status to detect the transition
		let previouslyQueuedIds: string[] = [];

		const checkPublishingStatus = async () => {
			if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
				return;
			}
			try {
				const res = await fetch('/api/social/schedule');
				if (!res.ok) return;
				const data = await res.json();
				const posts: Post[] = data.posts || [];

				const notifiedStr = localStorage.getItem('shrameco_notified_post_ids') || '[]';
				let notifiedIds: string[] = [];
				try {
					notifiedIds = JSON.parse(notifiedStr);
				} catch (_) {
					notifiedIds = [];
				}

				const newNotifiedIds = [...notifiedIds];
				let updated = false;

				posts.forEach((post) => {
					// Check if this post transitioned from queued to sent, or if it is newly sent and not notified
					const wasQueued = previouslyQueuedIds.includes(post._id);
					const isSent = post.status === 'sent';
					const hasNotBeenNotified = !notifiedIds.includes(post._id);
					// If the post is sent and was scheduled within the last 60 seconds, treat it as recent
					const isRecent = (Date.now() - new Date(post.scheduledAt).getTime()) < 60 * 1000;

					if (isSent && (wasQueued || (hasNotBeenNotified && isRecent))) {
						// Extract clean title/caption
						let titleText = 'Video Published!';
						let descText = post.caption;
						const isVideo = post.platform === 'youtube' || post.format === 'video' || post.format === 'short';
						if (isVideo && post.caption.includes('\n\n')) {
							const parts = post.caption.split('\n\n');
							titleText = parts[0] || 'Video Published!';
							descText = parts[1] || '';
						}

						// Add to active notification notifications list
						const notifId = 'notif_' + post._id + '_' + Date.now();
						const newNotif: NotificationItem = {
							id: notifId,
							title: `Published successfully! 🚀`,
							message: titleText,
							platform: post.platform,
							postUrl: post.postUrl || `/feed-preview?platform=${post.platform}&caption=${encodeURIComponent(post.caption.slice(0, 100))}`,
						};

						setActiveNotifications((prev) => [...prev, newNotif]);
						newNotifiedIds.push(post._id);
						updated = true;

						// Dispatch a custom event globally so pages can listen and auto-refresh their data
						if (typeof window !== 'undefined') {
							window.dispatchEvent(new CustomEvent('shrameco_post_published', { detail: { postId: post._id } }));
						}
					}
				});

				// Update previously queued ids state for next check
				previouslyQueuedIds = posts.filter(p => p.status === 'queued').map(p => p._id);

				if (updated) {
					localStorage.setItem('shrameco_notified_post_ids', JSON.stringify(newNotifiedIds));
				}
			} catch (err) {
				console.error('Failed to poll schedule status:', err);
			}
		};

		// Run check immediately
		checkPublishingStatus();

		// Poll every 45 seconds to minimize network request loads
		const interval = setInterval(checkPublishingStatus, 45000);

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				checkPublishingStatus();
			}
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			clearInterval(interval);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, []);

	const removeNotification = (id: string) => {
		setActiveNotifications((prev) => prev.filter((n) => n.id !== id));
	};

	const getPlatformIcon = (platform: string) => {
		switch (platform?.toLowerCase()) {
			case 'youtube':
				return <Youtube className="w-4 h-4 text-red-500" />;
			case 'linkedin':
				return <Linkedin className="w-4 h-4 text-blue-500" />;
			case 'twitter':
			case 'x':
				return <Twitter className="w-4 h-4 text-white" />;
			case 'instagram':
				return <Instagram className="w-4 h-4 text-pink-500" />;
			case 'facebook':
				return <Facebook className="w-4 h-4 text-blue-650" />;
			default:
				return <CheckCircle2 className="w-4 h-4 text-indigo-500" />;
		}
	};

	if (activeNotifications.length === 0) return null;

	return (
		<div className="fixed top-6 right-6 z-[99999] flex flex-col space-y-3 w-80 md:w-[360px] pointer-events-none">
			{activeNotifications.map((notif) => {
				return (
					<NotificationCard
						key={notif.id}
						notification={notif}
						onClose={() => removeNotification(notif.id)}
						platformIcon={getPlatformIcon(notif.platform)}
					/>
				);
			})}
		</div>
	);
}

function NotificationCard({
	notification,
	onClose,
	platformIcon,
}: {
	notification: NotificationItem;
	onClose: () => void;
	platformIcon: React.ReactNode;
}) {
	useEffect(() => {
		const timer = setTimeout(onClose, 8000);
		return () => clearTimeout(timer);
	}, [onClose]);

	const handleCardClick = () => {
		if (notification.postUrl) {
			window.open(notification.postUrl, '_blank', 'noopener,noreferrer');
		}
		onClose();
	};

	return (
		<div 
			onClick={handleCardClick}
			className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-xl border border-slate-800 flex items-start space-x-3 cursor-pointer pointer-events-auto transform transition-all duration-300 translate-x-0 hover:translate-x-[-4px] hover:bg-slate-800/95 shadow-indigo-900/10 group animate-slide-in relative overflow-hidden"
		>
			<div className="w-9 h-9 rounded-xl bg-slate-850 border border-slate-700 flex items-center justify-center flex-shrink-0">
				{platformIcon}
			</div>
			
			<div className="flex-1 min-w-0 pr-2">
				<p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest flex items-center space-x-1">
					<span>{notification.platform}</span>
					<span>•</span>
					<span>Live Now</span>
				</p>
				<h4 className="text-xs font-bold text-white mt-0.5 line-clamp-1 group-hover:text-indigo-200 transition-colors">
					{notification.title}
				</h4>
				<p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">
					{notification.message}
				</p>
				<span className="text-[9.5px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors mt-2 inline-flex items-center space-x-0.5">
					<span>View Live Post</span>
					<ExternalLink className="w-3 h-3" />
				</span>
			</div>

			<button
				onClick={(e) => {
					e.stopPropagation();
					onClose();
				}}
				className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors hover:bg-white/5"
			>
				<X className="w-3.5 h-3.5" />
			</button>
			
			{/* Animated Timer Progress Bar */}
			<div className="absolute bottom-0 left-0 h-0.5 bg-indigo-500 animate-timer-progress"></div>
		</div>
	);
}
