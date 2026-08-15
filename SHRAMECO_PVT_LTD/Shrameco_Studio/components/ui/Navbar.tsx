'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Sliders, LogOut, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { BrandLogo } from './BrandLogo';

export const Navbar: React.FC = () => {
	const router = useRouter();
	const pathname = usePathname();

	const handleLogout = async () => {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			router.push('/login');
			router.refresh();
		} catch (err) {
			console.error('Logout error:', err);
		}
	};

	return (
		<header className="sticky top-0 z-50 w-full bg-white/85 backdrop-blur-2xl border-b border-[#B8D4D8]/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
			<div className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
				<div className="flex items-center space-x-5">
					<Link href="/dashboard" className="group flex items-center space-x-3">
						<BrandLogo size={34} showText={true} />
					</Link>

					<div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-[#3D8090]/10 border border-[#3D8090]/25 text-[#3D8090] text-xs font-bold tracking-wide">
						<span className="w-2 h-2 rounded-full bg-[#3D8090] animate-pulse shadow-sm shadow-[#3D8090]" />
						<span>Studio Active</span>
					</div>
				</div>

				<nav className="flex items-center space-x-2">
					<Link href="/dashboard">
						<Button
							variant={pathname === '/dashboard' ? 'primary' : 'ghost'}
							className="text-xs sm:text-sm py-2 px-4 font-bold"
							icon={<LayoutDashboard className="w-4 h-4" />}
						>
							Studio Dashboard
						</Button>
					</Link>

					<Link href="/onboarding">
						<Button
							variant={pathname === '/onboarding' ? 'primary' : 'ghost'}
							className="text-xs sm:text-sm py-2 px-4 font-bold"
							icon={<Sliders className="w-4 h-4" />}
						>
							Brand Setup
						</Button>
					</Link>

					<div className="h-5 w-px bg-[#B8D4D8]/60 mx-1" />

					<Button
						variant="ghost"
						onClick={handleLogout}
						className="text-[#6B7F8A] hover:text-rose-600 text-xs sm:text-sm py-2 px-3"
						icon={<LogOut className="w-4 h-4" />}
						aria-label="Log out of account"
					>
						Logout
					</Button>
				</nav>
			</div>
		</header>
	);
};
