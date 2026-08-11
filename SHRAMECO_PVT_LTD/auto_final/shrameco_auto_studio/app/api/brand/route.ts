import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { BrandProfile } from '@/models/BrandProfile';
import { getAuthSession } from '@/lib/auth/jwt';
import { memoryStore } from '@/lib/db/memoryStore';

export const dynamic = 'force-dynamic';

export async function GET() {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		try {
			await dbConnect();
			const profile = await BrandProfile.findOne({ userId: session.userId });
			if (profile) {
				return NextResponse.json({ profile });
			}
		} catch (dbErr) {
			console.warn('MongoDB connection failed; reading brand profile from memory store.');
		}

		const memProfile = memoryStore.getBrandProfile(session.userId);
		return NextResponse.json({ profile: memProfile });
	} catch (error) {
		console.error('Error fetching brand profile:', error);
		return NextResponse.json({ error: 'Failed to fetch brand profile' }, { status: 500 });
	}
}

export async function PUT(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		const {
			companyName,
			industry,
			brandVoice,
			tagline,
			outroLink,
			socialHandle,
			logoPosition,
			contentPillars,
			bannedTopics,
			bannedWords,
			logoUrl,
			colorPalette,
			typography,
		} = body;

		if (!companyName || !industry || !brandVoice) {
			return NextResponse.json(
				{ error: 'Company Name, Industry, and Brand Voice are required.' },
				{ status: 400 }
			);
		}

		try {
			await dbConnect();
			const profile = await BrandProfile.findOneAndUpdate(
				{ userId: session.userId },
				{
					userId: session.userId,
					companyName,
					industry,
					brandVoice,
					tagline: tagline || '',
					outroLink: outroLink || '',
					socialHandle: socialHandle || '',
					logoPosition: logoPosition || 'top-left',
					contentPillars: Array.isArray(contentPillars) ? contentPillars : [],
					bannedTopics: Array.isArray(bannedTopics) ? bannedTopics : [],
					bannedWords: Array.isArray(bannedWords) ? bannedWords : [],
					logoUrl: logoUrl || '',
					colorPalette: Array.isArray(colorPalette) && colorPalette.length > 0 ? colorPalette : ['#0F172A', '#6366F1', '#10B981'],
					typography: typography || { heading: 'Outfit', body: 'Inter' },
				},
				{ new: true, upsert: true, runValidators: true }
			);

			memoryStore.upsertBrandProfile(session.userId, body);
			return NextResponse.json({ message: 'Brand profile updated successfully', profile });
		} catch (dbErr) {
			console.warn('MongoDB connection failed; saving brand profile to memory store.');
			const memProfile = memoryStore.upsertBrandProfile(session.userId, body);
			return NextResponse.json({ message: 'Brand profile updated successfully', profile: memProfile });
		}
	} catch (error) {
		console.error('Error updating brand profile:', error);
		return NextResponse.json({ error: 'Failed to update brand profile' }, { status: 500 });
	}
}
