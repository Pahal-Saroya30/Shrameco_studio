import React from 'react';
import { Sidebar } from '@/components/ui/Sidebar';
import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth/jwt';
import { dbConnect } from '@/lib/db/mongoose';
import { BrandProfile } from '@/models/BrandProfile';
import { memoryStore } from '@/lib/db/memoryStore';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const session = await getAuthSession();
	if (!session) {
		redirect('/login');
	}

	let hasProfile = false;
	try {
		await dbConnect();
		const profile = await BrandProfile.findOne({ userId: session.userId });
		if (profile) {
			hasProfile = true;
		}
	} catch (dbErr) {
		// Fallback to memory store if DB fails
		const memProfile = memoryStore.getBrandProfile(session.userId);
		if (memProfile) {
			hasProfile = true;
		}
	}

	if (!hasProfile) {
		redirect('/onboarding');
	}

	return (
		<div className="min-h-screen bg-[#F9FAFB] flex flex-row font-sans text-slate-900">
			<Sidebar />
			<main className="flex-1 max-w-full overflow-x-hidden overflow-y-auto">
				{children}
			</main>
		</div>
	);
}
