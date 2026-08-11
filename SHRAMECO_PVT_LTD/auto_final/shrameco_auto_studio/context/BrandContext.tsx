'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface BrandVisualContext {
	companyName: string;
	industry: string;
	brandVoice?: string;
	tagline?: string;
	outroLink?: string;
	socialHandle?: string;
	logoPosition?: string;
	logoUrl: string;
	colorPalette: string[];
	typography: {
		heading: string;
		body: string;
	};
	refetchBrand: () => Promise<void>;
}

const defaultContext: BrandVisualContext = {
	companyName: 'Shrameco',
	industry: 'Technology',
	brandVoice: 'Clear and energetic',
	tagline: 'Build in public, grow in seconds',
	outroLink: '',
	socialHandle: '@shrameco',
	logoPosition: 'top-left',
	logoUrl: '',
	colorPalette: ['#1E293B', '#3B82F6'],
	typography: { heading: 'Outfit (Futuristic Display)', body: 'Inter (High-Density Reading)' },
	refetchBrand: async () => {},
};

const BrandContext = createContext<BrandVisualContext>(defaultContext);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [brandState, setBrandState] = useState<Omit<BrandVisualContext, 'refetchBrand'>>({
		companyName: defaultContext.companyName,
		industry: defaultContext.industry,
		brandVoice: defaultContext.brandVoice,
		tagline: defaultContext.tagline,
		outroLink: defaultContext.outroLink,
		socialHandle: defaultContext.socialHandle,
		logoPosition: defaultContext.logoPosition,
		logoUrl: defaultContext.logoUrl,
		colorPalette: defaultContext.colorPalette,
		typography: defaultContext.typography,
	});

	const fetchBrand = async () => {
		try {
			const res = await fetch('/api/brand');
			const data = await res.json();
			if (res.ok && data.profile) {
				setBrandState({
					companyName: data.profile.companyName || defaultContext.companyName,
					industry: data.profile.industry || defaultContext.industry,
					brandVoice: data.profile.brandVoice || defaultContext.brandVoice,
					tagline: data.profile.tagline || defaultContext.tagline,
					outroLink: data.profile.outroLink || defaultContext.outroLink,
					socialHandle: data.profile.socialHandle || defaultContext.socialHandle,
					logoPosition: data.profile.logoPosition || defaultContext.logoPosition,
					logoUrl: data.profile.logoUrl || defaultContext.logoUrl,
					colorPalette:
						data.profile.colorPalette && data.profile.colorPalette.length > 0
							? data.profile.colorPalette
							: defaultContext.colorPalette,
					typography: data.profile.typography || defaultContext.typography,
				});
			}
		} catch (err) {
			console.error('Error loading brand context:', err);
		}
	};

	useEffect(() => {
		fetchBrand();
	}, []);

	return (
		<BrandContext.Provider value={{ ...brandState, refetchBrand: fetchBrand }}>
			{children}
		</BrandContext.Provider>
	);
};

export const useBrand = () => useContext(BrandContext);
