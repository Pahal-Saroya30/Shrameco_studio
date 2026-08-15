'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface BrandVisualContext {
	companyName: string;
	industry: string;
	logoUrl: string;
	colorPalette: string[];
	typography: {
		heading: string;
		body: string;
	};
	userName: string;
	userEmail: string;
	refetchBrand: () => Promise<void>;
}

const defaultContext: BrandVisualContext = {
	companyName: 'Acme Studio',
	industry: 'Technology',
	logoUrl: '',
	colorPalette: ['#1C2427', '#3D8090', '#B8D4D8', '#6B7F8A', '#2D5F68'],
	typography: { heading: 'Outfit', body: 'Inter' },
	userName: 'User',
	userEmail: '',
	refetchBrand: async () => {},
};

const BrandContext = createContext<BrandVisualContext>(defaultContext);

// Global in-memory cache to prevent duplicate initial fetches across component mounts
let cachedBrandData: any = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60000; // 60s cache TTL

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [brandState, setBrandState] = useState<Omit<BrandVisualContext, 'refetchBrand'>>({
		companyName: defaultContext.companyName,
		industry: defaultContext.industry,
		logoUrl: defaultContext.logoUrl,
		colorPalette: defaultContext.colorPalette,
		typography: defaultContext.typography,
		userName: defaultContext.userName,
		userEmail: defaultContext.userEmail,
	});

	const fetchBrandAndUser = async (force = false) => {
		const now = Date.now();
		if (!force && cachedBrandData && (now - lastFetchTime < CACHE_TTL_MS)) {
			setBrandState(cachedBrandData);
			return;
		}

		try {
			const [brandRes, meRes] = await Promise.all([
				fetch('/api/brand'),
				fetch('/api/auth/me'),
			]);

			const brandData = brandRes.ok ? await brandRes.json() : null;
			const meData = meRes.ok ? await meRes.json() : null;

			const newState = {
				companyName: brandData?.profile?.companyName || meData?.companyName || defaultContext.companyName,
				industry: brandData?.profile?.industry || defaultContext.industry,
				logoUrl: brandData?.profile?.logoUrl || defaultContext.logoUrl,
				colorPalette:
					brandData?.profile?.colorPalette && brandData.profile.colorPalette.length > 0
						? brandData.profile.colorPalette
						: defaultContext.colorPalette,
				typography: brandData?.profile?.typography || defaultContext.typography,
				userName: meData?.name || defaultContext.userName,
				userEmail: meData?.email || defaultContext.userEmail,
			};

			cachedBrandData = newState;
			lastFetchTime = Date.now();
			setBrandState(newState);
		} catch (err) {
			console.error('Error loading brand/user context:', err);
		}
	};

	useEffect(() => {
		fetchBrandAndUser();
	}, []);

	return (
		<BrandContext.Provider value={{ ...brandState, refetchBrand: () => fetchBrandAndUser(true) }}>
			{children}
		</BrandContext.Provider>
	);
};

export const useBrand = () => useContext(BrandContext);

