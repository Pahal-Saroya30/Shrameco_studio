'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
	Plus,
	Home,
	PenSquare,
	Settings,
	CalendarDays,
	Youtube,
	MoreHorizontal,
	LogOut,
	PanelLeftClose,
	PanelLeftOpen,
	ChevronDown,
	BarChart3,
	Linkedin,
	Facebook,
	Instagram,
	Twitter,
} from 'lucide-react';
import { BrandLogo } from './ui/BrandLogo';
import { useBrand } from '../context/BrandContext';
import { useSocialAccounts } from '@/lib/hooks/useSocialAccounts';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
	useSidebar,
} from './ui/Sidebar';

export function AppSidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const { state, toggleSidebar } = useSidebar();
	const isCollapsed = state === 'collapsed';

	const brandContext = useBrand();
	const userName = brandContext.userName || 'User';
	const userEmail = brandContext.userEmail || '';
	const companyName = brandContext.companyName || 'My Organization';

	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [expandedChannels, setExpandedChannels] = useState<Record<string, boolean>>({});

	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [editName, setEditName] = useState('');
	const [editEmail, setEditEmail] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const [errorMsg, setErrorMsg] = useState('');
	const [successMsg, setSuccessMsg] = useState('');

	const openProfileModal = () => {
		setEditName(userName);
		setEditEmail(userEmail);
		setErrorMsg('');
		setSuccessMsg('');
		setIsProfileOpen(true);
		setIsMenuOpen(false);
	};

	const handleSaveProfile = async () => {
		setIsSaving(true);
		setErrorMsg('');
		setSuccessMsg('');
		try {
			const res = await fetch('/api/auth/profile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: editName, email: editEmail }),
			});
			const data = await res.json();
			if (!res.ok) {
				setErrorMsg(data.error || 'Failed to save changes.');
			} else {
				setSuccessMsg('Profile updated successfully!');
				await brandContext.refetchBrand();
				setTimeout(() => setIsProfileOpen(false), 1500);
			}
		} catch (err) {
			setErrorMsg('Network error. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const handleForgotPassword = async () => {
		setErrorMsg('');
		setSuccessMsg('');
		try {
			const res = await fetch('/api/auth/forgot-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: editEmail || userEmail }),
			});
			const data = await res.json();
			if (res.ok) {
				setSuccessMsg(data.message || 'Password reset email sent!');
			} else {
				setErrorMsg(data.error || 'Failed to send reset link.');
			}
		} catch (err) {
			setErrorMsg('Network error. Please try again.');
		}
	};

	const { accounts: connectedAccounts } = useSocialAccounts();

	const toggleChannelExpanded = (key: string) => {
		setExpandedChannels((prev) => ({
			...prev,
			[key]: prev[key] === false ? true : false, // toggle, default to true
		}));
	};

	const getInitials = (name: string) => {
		return name
			.split(/\s+/)
			.map((word) => word[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	};

	const renderPlatformLogo = (platform: string) => {
		switch (platform.toLowerCase()) {
			case 'youtube':
				return (
					<svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0 ml-1.5" xmlns="http://www.w3.org/2000/svg">
						<path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837z" fill="#FF0000"/>
						<polygon points="9.545 15.568 15.818 12 9.545 8.432" fill="#FFFFFF"/>
					</svg>
				);
			case 'linkedin':
				return <Linkedin className="w-3.5 h-3.5 text-blue-650 fill-blue-650 flex-shrink-0 ml-1.5" />;
			case 'twitter':
			case 'x':
				return <span className="text-[9px] font-black text-slate-800 border border-slate-800 rounded-sm w-3.5 h-3.5 flex items-center justify-center scale-90 flex-shrink-0 select-none ml-1.5">X</span>;
			case 'facebook':
				return <Facebook className="w-3.5 h-3.5 text-blue-700 fill-blue-700 flex-shrink-0 ml-1.5" />;
			case 'instagram':
				return <Instagram className="w-3.5 h-3.5 text-pink-650 flex-shrink-0 ml-1.5" />;
			default:
				return null;
		}
	};

	const renderPlatformLogoOverlay = (platform: string) => {
		switch (platform.toLowerCase()) {
			case 'youtube':
				return (
					<svg viewBox="0 0 24 24" className="w-2.5 h-2.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
						<path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837z" fill="#FF0000"/>
						<polygon points="9.545 15.568 15.818 12 9.545 8.432" fill="#FFFFFF"/>
					</svg>
				);
			case 'linkedin':
				return <Linkedin className="w-2.5 h-2.5 text-blue-650 fill-blue-650 flex-shrink-0" />;
			case 'twitter':
			case 'x':
				return <span className="text-[7.5px] font-black text-slate-800 border border-slate-800 rounded-sm w-2.5 h-2.5 flex items-center justify-center scale-90 flex-shrink-0 select-none">X</span>;
			case 'facebook':
				return <Facebook className="w-2.5 h-2.5 text-blue-700 fill-blue-700 flex-shrink-0" />;
			case 'instagram':
				return <Instagram className="w-2.5 h-2.5 text-pink-650 flex-shrink-0" />;
			default:
				return null;
		}
	};

	const navItems = [
		{ name: 'Home', href: '/dashboard', icon: Home },
		{ name: 'Create', href: '/dashboard/create', icon: PenSquare },
		{ name: 'Publish', href: '/dashboard/publish', icon: CalendarDays },
	];

	const handleLogout = async () => {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			router.push('/');
			router.refresh();
		} catch (error) {
			console.error('Logout failed', error);
		}
	};

	return (
		<Sidebar>
			{/* Sidebar Header branding */}
			<SidebarHeader>
				{isCollapsed ? (
					<BrandLogo size={24} showText={false} />
				) : (
					<div className="flex items-center space-x-2">
						<BrandLogo size={24} showText={false} />
						<span className="font-semibold text-xl text-slate-900 tracking-tight">Studio</span>
					</div>
				)}
				{!isCollapsed && (
					<div className="w-7 h-7 rounded-full border border-violet-200 bg-violet-50 flex items-center justify-center text-violet-600 hover:bg-violet-100 cursor-pointer transition-colors">
						<span className="text-[10px] font-bold">1</span>
					</div>
				)}
			</SidebarHeader>

			{/* Sidebar main navigation contents */}
			<SidebarContent>
				{/* Primary Create Action */}
				<div className={`mb-6 mt-2 ${isCollapsed ? 'px-2' : 'px-4'}`}>
					{isCollapsed ? (
						<Link
							href="/dashboard/create"
							className="w-10 h-10 bg-violet-600 text-white hover:bg-violet-700 transition-all rounded-xl flex items-center justify-center mx-auto shadow-md shadow-violet-500/20 hover:scale-[1.05] active:scale-[0.95]"
							title="New Post"
						>
							<Plus className="w-5 h-5" />
						</Link>
					) : (
						<Link
							href="/dashboard/create"
							className="w-full bg-violet-600 text-white hover:bg-violet-700 transition-all py-2.5 rounded-xl flex items-center justify-center space-x-2 font-medium shadow-md shadow-violet-500/20 text-sm hover:scale-[1.01] active:scale-[0.99]"
						>
							<Plus className="w-4 h-4" />
							<span>New Post</span>
						</Link>
					)}
				</div>

				{/* Primary Navigation group */}
				<SidebarGroup className="mb-6">
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => {
								const isActive = pathname === item.href || (pathname === '/' && item.href === '/dashboard');
								return (
									<SidebarMenuItem key={item.name}>
										<SidebarMenuButton asChild isActive={isActive} title={isCollapsed ? item.name : undefined}>
											<Link href={item.href}>
												<item.icon className={isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} />
												{!isCollapsed && <span>{item.name}</span>}
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Channels navigation group */}
				<SidebarGroup>
					{!isCollapsed && (
						<div className="px-5 mb-2 flex items-center justify-between group cursor-pointer">
							<span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Channels</span>
							<div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
								<button className="p-1 rounded-md text-slate-400 hover:text-violet-600 hover:bg-violet-50">
									<Settings className="w-3.5 h-3.5" />
								</button>
								<button className="p-1 rounded-md text-slate-400 hover:text-violet-600 hover:bg-violet-50">
									<Plus className="w-3.5 h-3.5" />
								</button>
							</div>
						</div>
					)}

					{connectedAccounts.length === 0 ? (
						!isCollapsed && (
							<div className="px-3 mb-4">
								<Link
									href="/dashboard"
									className="flex items-center justify-center p-3 border border-dashed border-slate-200 rounded-xl text-xs font-semibold text-slate-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50/20 transition-all"
								>
									<span>+ Connect Channel</span>
								</Link>
							</div>
						)
					) : (
						connectedAccounts.map((acc, index) => {
							const isYoutube = acc.platform === 'youtube';
							const isInstagram = acc.platform === 'instagram';
							const isLinkedin = acc.platform === 'linkedin';
							const isFacebook = acc.platform === 'facebook';
							const isX = acc.platform === 'x' || acc.platform === 'twitter';
							const channelLink = 
								isYoutube ? '/dashboard/youtube' : 
								isInstagram ? '/dashboard/instagram' : 
								isLinkedin ? '/dashboard/linkedin' :
								isFacebook ? '/dashboard/facebook' :
								isX ? '/dashboard/x' :
								'/dashboard/publish';
							const linkName = (isYoutube || isInstagram || isLinkedin || isFacebook || isX) ? 'Studio' : 'Publish';
							const LinkIcon = isYoutube ? Youtube : isInstagram ? Instagram : isLinkedin ? Linkedin : isFacebook ? Facebook : isX ? Twitter : CalendarDays;
							const isActive = pathname === channelLink;
							const isChannelExpanded = expandedChannels[`${acc.platform}-${index}`] !== false; // default to true

							const avatarGradient = {
								youtube: 'from-red-600 to-rose-500',
								linkedin: 'from-blue-600 to-indigo-500',
								twitter: 'from-slate-800 to-slate-700',
								instagram: 'from-pink-600 to-purple-500',
								facebook: 'from-blue-700 to-blue-500',
							}[acc.platform as string] || 'from-violet-600 to-fuchsia-500';

							const initials = (acc.accountName || acc.platform || '?')
								.trim()
								.charAt(0)
								.toUpperCase();

							return (
								<div key={`${acc.platform}-${index}`} className="mb-4">
									{!isCollapsed ? (
										<>
											<div
												onClick={() => toggleChannelExpanded(`${acc.platform}-${index}`)}
												className="px-3 mb-2"
											>
												<div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-violet-200 cursor-pointer hover:shadow-xs transition-all active:scale-[0.99]">
													<div className="flex items-center space-x-2.5 min-w-0 flex-1">
														{acc.avatarUrl ? (
															<img
																src={acc.avatarUrl}
																alt={acc.accountName}
																className="w-7 h-7 rounded-md object-cover flex-shrink-0"
															/>
														) : (
															<div className={`w-7 h-7 rounded-md bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white text-xs font-semibold shadow-sm flex-shrink-0`}>
																{initials}
															</div>
														)}
														<span className="text-sm font-semibold text-slate-700 truncate min-w-0 flex-1">
															{acc.accountName || acc.platform}
														</span>
														{renderPlatformLogo(acc.platform)}
													</div>
													<ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-2 transition-transform duration-200 ${isChannelExpanded ? 'rotate-180' : ''}`} />
												</div>
											</div>
											
											{isChannelExpanded && (
												<SidebarGroupContent className="animate-fade-in">
													<SidebarMenu className="pl-5 border-l border-slate-100 ml-5 px-3 space-y-1">
														<SidebarMenuItem>
															<SidebarMenuButton asChild isActive={isActive}>
																<Link href={channelLink}>
																	<div className="flex items-center space-x-3">
																		<LinkIcon className="w-4 h-4" />
																		<span>{linkName}</span>
																	</div>
																</Link>
															</SidebarMenuButton>
														</SidebarMenuItem>

														<SidebarMenuItem>
															<SidebarMenuButton asChild isActive={pathname === `/dashboard/insights`}>
																<Link href={`/dashboard/insights?platform=${acc.platform}`}>
																	<div className="flex items-center space-x-3">
																		<BarChart3 className="w-4 h-4 text-slate-400" />
																		<span>Insights</span>
																	</div>
																</Link>
															</SidebarMenuButton>
														</SidebarMenuItem>
													</SidebarMenu>
												</SidebarGroupContent>
											)}
										</>
									) : (
										<div className="relative group px-2 flex justify-center">
											{/* Channel Avatar Button */}
											<div className="relative hover:scale-105 active:scale-95 transition-all duration-150 block w-8 h-8 mx-auto cursor-pointer">
												{acc.avatarUrl ? (
													<img
														src={acc.avatarUrl}
														alt={acc.accountName}
														className="w-8 h-8 rounded-lg object-cover shadow-xs border border-slate-100"
													/>
												) : (
													<div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr ${avatarGradient} text-white text-xs font-extrabold shadow-sm`}>
														{initials}
													</div>
												)}
												{/* Bottom-right Social Badge Overlay */}
												<div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-xs flex items-center justify-center border border-slate-100 z-10 scale-90">
													{renderPlatformLogoOverlay(acc.platform)}
												</div>
											</div>

											{/* Hover Options Dropdown (Studio / Insights) */}
											<div className="absolute left-full top-1/2 -translate-y-1/2 pl-3 hidden group-hover:block z-[999]">
												<div className="bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-44 animate-fade-in">
													<div className="px-3.5 py-1.5 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
														{acc.accountName || acc.platform}
													</div>
													<Link
														href={channelLink}
														className="w-full flex items-center space-x-2.5 px-3.5 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
													>
														<LinkIcon className="w-3.5 h-3.5 text-slate-400" />
														<span>{linkName}</span>
													</Link>
													<Link
														href={`/dashboard/insights?platform=${acc.platform}`}
														className="w-full flex items-center space-x-2.5 px-3.5 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
													>
														<BarChart3 className="w-3.5 h-3.5 text-slate-400" />
														<span>Insights</span>
													</Link>
												</div>
											</div>
										</div>
									)}
								</div>
							);
						})
					)}
				</SidebarGroup>
			</SidebarContent>

			{/* Sidebar footer user context */}
			<SidebarFooter>
				{!isCollapsed && (
					<div className="px-6 py-4 border-t border-slate-100">
						<div className="flex items-center justify-between mb-2">
							<span className="text-xs font-medium text-slate-500">1 of 3 connected</span>
						</div>
						<div className="flex space-x-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
							<div className="h-full w-1/3 bg-violet-500 rounded-full"></div>
						</div>
					</div>
				)}

				<div className={`relative ${isCollapsed ? 'p-2' : 'p-3'}`}>
					{isMenuOpen && (
						<div
							className={`absolute bg-white border border-slate-205 rounded-xl shadow-lg shadow-slate-200/50 overflow-hidden z-50 animate-fade-in ${
								isCollapsed ? 'left-full ml-3 w-48 bottom-0' : 'left-3 w-[calc(100%-24px)] bottom-full mb-2'
							}`}
						>
							<Link
								href="/onboarding"
								onClick={() => setIsMenuOpen(false)}
								className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100 transition-colors"
							>
								<Settings className="w-4 h-4 text-slate-500" />
								<span>Brand Profile</span>
							</Link>
							<button
								onClick={openProfileModal}
								className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100 transition-colors text-left"
							>
								<Settings className="w-4 h-4 text-slate-500" />
								<span>Profile Settings</span>
							</button>
							<button
								onClick={handleLogout}
								className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
							>
								<LogOut className="w-4 h-4" />
								<span>Log out</span>
							</button>
						</div>
					)}

					{isCollapsed ? (
						<div className="flex flex-col items-center space-y-3">
							<button
								onClick={(e) => {
									e.stopPropagation();
									toggleSidebar();
								}}
								className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all active:scale-95 shadow-xs"
								title="Expand Sidebar"
							>
								<PanelLeftOpen className="w-4 h-4" />
							</button>
							<div
								onClick={() => setIsMenuOpen(!isMenuOpen)}
								className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200 hover:bg-slate-200 cursor-pointer transition-colors"
								title={userName}
							>
								{getInitials(userName)}
							</div>
						</div>
					) : (
						<div
							className={`flex items-center rounded-xl transition-colors border border-transparent hover:bg-slate-50 ${
								isMenuOpen ? 'bg-slate-50' : ''
							} justify-between p-2`}
						>
							<div
								onClick={() => setIsMenuOpen(!isMenuOpen)}
								className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
							>
								<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200 hover:bg-slate-200 transition-colors">
									{getInitials(userName)}
								</div>
								<div className="flex flex-col min-w-0 flex-1">
									<span className="text-sm font-semibold text-slate-900 truncate">{userName}</span>
									<span className="text-[10px] text-slate-500 truncate">{companyName || 'No Brand'} • Free Plan</span>
								</div>
							</div>

							<button
								onClick={(e) => {
									e.stopPropagation();
									toggleSidebar();
								}}
								className="w-7 h-7 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all active:scale-95 ml-2 flex-shrink-0"
								title="Collapse Sidebar"
							>
								<PanelLeftClose className="w-3.5 h-3.5" />
							</button>
						</div>
					)}
				</div>
			</SidebarFooter>

			{/* Profile Settings Modal Overlay */}
			{isProfileOpen && (
				<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[99999] p-4 animate-fade-in">
					<div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
						<h2 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-1">Profile Settings</h2>
						<p className="text-xs text-slate-500 dark:text-zinc-400 mb-5">Update your personal account details.</p>
						
						{errorMsg && (
							<div className="mb-4 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-xl">
								{errorMsg}
							</div>
						)}
						{successMsg && (
							<div className="mb-4 text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl">
								{successMsg}
							</div>
						)}

						<div className="space-y-4">
							<div>
								<label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Full Name</label>
								<input
									type="text"
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									className="w-full bg-slate-50 dark:bg-zinc-955 border border-slate-202 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-violet-500 dark:text-white"
								/>
							</div>
							<div>
								<label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Email Address</label>
								<input
									type="email"
									value={editEmail}
									onChange={(e) => setEditEmail(e.target.value)}
									className="w-full bg-slate-50 dark:bg-zinc-955 border border-slate-202 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-violet-500 dark:text-white"
								/>
							</div>
						</div>

						<div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-zinc-850 pt-4">
							<button
								onClick={handleForgotPassword}
								className="text-xs font-bold text-violet-600 hover:text-violet-750 transition-colors"
							>
								Forgot Password?
							</button>
							<div className="flex items-center space-x-3">
								<button
									onClick={() => setIsProfileOpen(false)}
									className="px-4 py-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-slate-500 dark:text-zinc-400 transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={handleSaveProfile}
									disabled={isSaving}
									className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/10"
								>
									{isSaving ? 'Saving...' : 'Save Changes'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</Sidebar>
	);
}
