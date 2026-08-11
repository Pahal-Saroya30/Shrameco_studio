'use client';

import React from 'react';
import StudioComposer from '@/components/social/StudioComposer';
import { BrandProvider } from '@/context/BrandContext';

export default function YoutubeStudioPage() {
	return (
		<BrandProvider>
			<StudioComposer lockedPlatform="youtube" />
		</BrandProvider>
	);
}
