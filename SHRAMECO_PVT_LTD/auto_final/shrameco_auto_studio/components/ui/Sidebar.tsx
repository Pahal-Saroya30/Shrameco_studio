'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
	Plus,
	Home,
	PenSquare,
	Settings,
	HelpCircle,
	CalendarDays,
	Users,
	BarChart3,
	Instagram,
	Youtube,
	Facebook,
	MoreHorizontal,
	LogOut,
	ChevronDown,
	Video,
	PanelLeftClose,
	PanelLeftOpen,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface SocialAccountMeta {
	platform: 'linkedin' | 'instagram' | 'x' | 'facebook' | 'youtube';
	accountName: string;
	scopes: string[];
	connected: boolean;
}

export function Sidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [connectedAccounts, setConnectedAccounts] = useState<SocialAccountMeta[]>([]);
	const [openChannels, setOpenChannels] = useState<Record<string, boolean>>({
		facebook: true,
		youtube: true,
		instagram: true,
		linkedin: true,
		x: true,
	});
	const [collapsed, setCollapsed] = useState(false);

	// Persist collapsed state
	useEffect(() => {
		const saved = localStorage.getItem('sidebar-collapsed');
		if (saved === 'true') setCollapsed(true);
	}, []);

	const toggleCollapsed = () => {
		setCollapsed((prev) => {
			localStorage.setItem('sidebar-collapsed', String(!prev));
			return !prev;
		});
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
		fetchConnectedAccounts();
		const interval = setInterval(fetchConnectedAccounts, 10000);
		return () => clearInterval(interval);
	}, []);

	const toggleChannel = (platform: string) => {
		setOpenChannels((prev) => ({
			...prev,
			[platform]: !prev[platform],
		}));
	};

	const handleLogout = async () => {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			router.push('/');
			router.refresh();
		} catch (error) {
			console.error('Logout failed', error);
		}
	};

	const getPlatformBrand = (platform: string) => {
		switch (platform) {
			case 'facebook':
				return { bg: 'bg-gradient-to-tr from-blue-700 to-blue-500', icon: Facebook, color: 'text-blue-600' };
			case 'youtube':
				return { bg: 'bg-gradient-to-tr from-red-600 to-rose-500', icon: Youtube, color: 'text-rose-600' };
			case 'instagram':
				return { bg: 'bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600', icon: Instagram, color: 'text-pink-600' };
			default:
				return { bg: 'bg-gradient-to-tr from-violet-600 to-indigo-600', icon: ShareIconFallback, color: 'text-violet-600' };
		}
	};

	function ShareIconFallback(props: React.ComponentProps<'svg'>) {
		return (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
				<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
				<polyline points="16 6 12 2 8 6" />
				<line x1="12" y1="2" x2="12" y2="15" />
			</svg>
		);
	}

	const activeConnectedAccounts = connectedAccounts.filter((a) => a.connected);
	const connectedCount = activeConnectedAccounts.length;
	const totalCount = 3;

	// ── Collapsed sidebar (icon rail) ──
	if (collapsed) {
		return (
			<aside className="w-[64px] h-screen bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-3 sticky top-0 left-0 z-40 transition-all duration-300">
				{/* Logo */}
				<Link href="/dashboard" className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-violet-50 transition-colors mb-2">
					<BrandLogo size={22} showText={false} />
				</Link>

				{/* Expand button */}
				<button
					onClick={toggleCollapsed}
					className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
					title="Expand sidebar"
				>
					<PanelLeftOpen className="w-4.5 h-4.5" />
				</button>

				<div className="w-6 border-t border-slate-100 my-1" />

				{/* Nav icons */}
				{[
					{ href: '/dashboard', icon: Home, label: 'Home' },
					{ href: '/dashboard/create', icon: PenSquare, label: 'Create' },
				].map((item) => {
					const isActive = pathname === item.href;
					return (
						<Link
							key={item.href}
							href={item.href}
							title={item.label}
							className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
								isActive ? 'bg-violet-50 text-violet-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
							}`}
						>
							<item.icon className="w-4.5 h-4.5" />
						</Link>
					);
				})}

				<div className="w-6 border-t border-slate-100 my-1" />

				{/* Channel icons */}
				{(activeConnectedAccounts.length > 0 ? activeConnectedAccounts : [{ platform: 'facebook' as const, accountName: 'Shui', scopes: [], connected: true }]).map((account) => {
					const brand = getPlatformBrand(account.platform);
					return (
						<Link
							key={account.platform}
							href={`/dashboard/${account.platform}`}
							title={account.accountName}
							className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shadow-xs cursor-pointer"
							style={{ background: undefined }}
						>
							<div className={`w-8 h-8 rounded-full ${brand.bg} flex items-center justify-center text-white text-xs font-black shadow-xs`}>
								{(account.accountName || 'S').charAt(0).toUpperCase()}
							</div>
						</Link>
					);
				})}

				{/* Bottom: user avatar */}
				<div className="mt-auto">
					<div
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs cursor-pointer border border-violet-200"
					>
						S
					</div>
				</div>
			</aside>
		);
	}

	// ── Expanded sidebar ──
	return (
		<aside className="w-[260px] h-screen bg-white border-r border-slate-200 flex flex-col justify-between overflow-y-auto hidden md:flex sticky top-0 left-0 relative z-40 transition-all duration-300">
			<div>
				{/* Header */}
				<div className="px-5 py-5 flex items-center justify-between bg-white">
					<Link href="/dashboard" className="flex items-center space-x-2.5 group">
						<BrandLogo size={24} showText={false} />
						<span className="font-bold text-xl text-slate-900 tracking-tight group-hover:text-violet-600 transition-colors">Studio</span>
					</Link>
					<div className="flex items-center space-x-1">
						<div className="w-7 h-7 rounded-full border border-violet-200 bg-violet-50 flex items-center justify-center text-violet-600 hover:bg-violet-100 cursor-pointer transition-colors shadow-2xs">
							<span className="text-[11px] font-black">1</span>
						</div>
						{/* Collapse toggle */}
						<button
							onClick={toggleCollapsed}
							title="Collapse sidebar"
							className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
						>
							<PanelLeftClose className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Primary Action Button */}
				<div className="px-4 mb-5">
					<Link href="/dashboard/create" className="w-full bg-violet-600 text-white hover:bg-violet-700 transition-all duration-200 py-3 rounded-xl flex items-center justify-center space-x-2 font-bold shadow-md shadow-violet-500/20 text-sm active:scale-[0.98]">
						<Plus className="w-4.5 h-4.5" />
						<span>New Post</span>
					</Link>
				</div>

				{/* Main Nav */}
				<nav className="px-3 space-y-1 mb-6">
					{[
						{ name: 'Home', href: '/dashboard', icon: Home },
						{ name: 'Create', href: '/dashboard/create', icon: PenSquare },
					].map((item) => {
						const isActive = pathname === item.href || (pathname === '/' && item.href === '/dashboard');
						return (
							<Link
								key={item.name}
								href={item.href}
								className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
									isActive
										? 'bg-violet-50/80 text-violet-700 shadow-2xs'
										: 'text-slate-600 hover:bg-slate-50/70 hover:text-slate-900'
								}`}
							>
								<item.icon className={`w-4.5 h-4.5 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
								<span>{item.name}</span>
							</Link>
						);
					})}
				</nav>

				{/* Channels Header Section */}
				<div className="px-5 mb-3 flex items-center justify-between group">
					<span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CHANNELS</span>
					<div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
						<button className="p-1 rounded-md text-slate-400 hover:text-violet-600 hover:bg-violet-50">
							<Settings className="w-3.5 h-3.5" />
						</button>
						<button className="p-1 rounded-md text-slate-400 hover:text-violet-600 hover:bg-violet-50">
							<Plus className="w-3.5 h-3.5" />
						</button>
					</div>
				</div>

				{/* Connected Channels List */}
				<div className="px-3 space-y-3">
					{activeConnectedAccounts.length > 0 ? (
						activeConnectedAccounts.map((account) => {
							const brand = getPlatformBrand(account.platform);
							const PlatformIcon = brand.icon;
							const isOpen = openChannels[account.platform] !== false;

							return (
								<div key={account.platform} className="space-y-1">
									<div
										onClick={() => toggleChannel(account.platform)}
										className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200/90 cursor-pointer hover:border-slate-300 hover:shadow-xs transition-all select-none"
									>
										<div className="flex items-center space-x-2.5 min-w-0">
											<div className={`w-7 h-7 rounded-full ${brand.bg} flex items-center justify-center text-white text-xs font-black shadow-xs`}>
												{(account.accountName || 'S').charAt(0).toUpperCase()}
											</div>
											<span className="text-xs font-bold text-slate-800 truncate">{account.accountName || 'Channel'}</span>
										</div>
										<div className="flex items-center space-x-1.5 flex-shrink-0">
											<PlatformIcon className={`w-3.5 h-3.5 ${brand.color}`} />
											<ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
										</div>
									</div>

									{isOpen && (
										<div className="pl-4 space-y-0.5 border-l border-slate-100 ml-6.5 py-0.5 animate-fade-in">
											<Link
												href={`/dashboard/${account.platform}`}
												className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
													pathname === `/dashboard/${account.platform}`
														? 'bg-violet-50 text-violet-700'
														: 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
												}`}
											>
												<Video className="w-3.5 h-3.5" />
												<span>Studio</span>
											</Link>
											<Link
												href={`/dashboard/${account.platform}/insights`}
												className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
													pathname === `/dashboard/${account.platform}/insights`
														? 'bg-violet-50 text-violet-700'
														: 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
												}`}
											>
												<BarChart3 className="w-3.5 h-3.5" />
												<span>Insights</span>
											</Link>
										</div>
									)}
								</div>
							);
						})
					) : (
						/* Fallback mock channel */
						<div className="space-y-1">
							<div
								onClick={() => toggleChannel('facebook')}
								className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200/90 cursor-pointer hover:border-slate-300 hover:shadow-xs transition-all select-none"
							>
								<div className="flex items-center space-x-2.5 min-w-0">
									<div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white text-xs font-black shadow-xs">
										S
									</div>
									<span className="text-xs font-bold text-slate-800 truncate">Shui</span>
								</div>
								<div className="flex items-center space-x-1.5 flex-shrink-0">
									<Facebook className="w-3.5 h-3.5 text-blue-600" />
									<ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${openChannels['facebook'] ? 'rotate-180' : ''}`} />
								</div>
							</div>

							{openChannels['facebook'] && (
								<div className="pl-4 space-y-0.5 border-l border-slate-100 ml-6.5 py-0.5 animate-fade-in">
									<Link
										href="/dashboard/facebook"
										className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
											pathname === '/dashboard/facebook' ? 'bg-violet-50 text-violet-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
										}`}
									>
										<Video className="w-3.5 h-3.5" />
										<span>Studio</span>
									</Link>
									<Link
										href="/dashboard/facebook/insights"
										className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
											pathname === '/dashboard/facebook/insights' ? 'bg-violet-50 text-violet-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
										}`}
									>
										<BarChart3 className="w-3.5 h-3.5" />
										<span>Insights</span>
									</Link>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Bottom Section */}
			<div className="bg-white">
				{/* Connection Progress Indicator */}
				<div className="px-6 py-4 border-t border-slate-100">
					<div className="flex items-center justify-between mb-2">
						<span className="text-xs font-medium text-slate-500">
							{connectedCount === 0 ? '1' : connectedCount} of {totalCount} connected
						</span>
					</div>
					<div className="flex space-x-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
						<div
							className="h-full bg-violet-500 rounded-full transition-all duration-300"
							style={{ width: `${((connectedCount === 0 ? 1 : connectedCount) / totalCount) * 100}%` }}
						></div>
					</div>
				</div>

				{/* User Profile Box */}
				<div className="p-3 relative">
					{isMenuOpen && (
						<div className="absolute bottom-full left-3 w-[calc(100%-24px)] mb-2 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 overflow-hidden z-50 animate-fade-in">
							<button
								onClick={handleLogout}
								className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
							>
								<LogOut className="w-4 h-4" />
								<span>Log out</span>
							</button>
						</div>
					)}

					<div
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors border border-transparent hover:bg-slate-50 ${isMenuOpen ? 'bg-slate-50 border-slate-200' : ''}`}
					>
						<div className="flex items-center space-x-3">
							<div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs border border-violet-200">
								S
							</div>
							<div className="flex flex-col">
								<span className="text-sm font-bold text-slate-900">Shrameco</span>
								<span className="text-[10px] font-semibold text-slate-400">Free Plan</span>
							</div>
						</div>
						<MoreHorizontal className={`w-4 h-4 transition-colors ${isMenuOpen ? 'text-slate-900' : 'text-slate-400'}`} />
					</div>
				</div>
			</div>
		</aside>
	);
}
