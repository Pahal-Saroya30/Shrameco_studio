'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface SocialInsightsState {
	data: any | null;
	loading: boolean;
	error: string | null;
	refreshing: boolean;
	refetch: () => Promise<void>;
}

// Global in-memory SWR cache for insights across all platforms & date windows
const insightsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60000; // 60s cache TTL

export function useSocialInsights(platform: string, since?: Date, until?: Date): SocialInsightsState {
	const sinceStr = since ? since.toISOString() : '';
	const untilStr = until ? until.toISOString() : '';
	const cacheKey = `${platform}:${sinceStr}:${untilStr}`;

	// Read initial cache state synchronously to prevent mounting flicker
	const cachedEntry = insightsCache.get(cacheKey);
	const initialData = cachedEntry ? cachedEntry.data : null;

	const [data, setData] = useState<any | null>(initialData);
	const [loading, setLoading] = useState<boolean>(!initialData);
	const [error, setError] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState<boolean>(false);

	const isMounted = useRef(true);
	useEffect(() => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, []);

	const fetchData = useCallback(async (isRefresh = false) => {
		const entry = insightsCache.get(cacheKey);
		const isFresh = entry && Date.now() - entry.timestamp < CACHE_TTL_MS;

		if (!isRefresh && isFresh && entry) {
			setData(entry.data);
			setLoading(false);
			return;
		}

		if (isRefresh) {
			setRefreshing(true);
		} else if (!entry) {
			setLoading(true);
		}

		setError(null);

		try {
			const params = new URLSearchParams();
			if (sinceStr) params.set('since', sinceStr);
			if (untilStr) params.set('until', untilStr);

			const basePath =
				platform === 'instagram' ? '/api/social/instagram/insights' :
				platform === 'linkedin' ? '/api/social/linkedin/insights' :
				platform === 'facebook' ? '/api/social/facebook/insights' :
				platform === 'x' ? '/api/social/x/insights' :
				'/api/social/youtube/insights';

			const url = `${basePath}?${params.toString()}`;
			const res = await fetch(url);
			if (!res.ok) {
				const errJson = await res.json();
				throw new Error(errJson.error || 'Failed to fetch platform insights');
			}
			const json = await res.json();

			const resultData = json.insights || json;
			insightsCache.set(cacheKey, { data: resultData, timestamp: Date.now() });

			if (isMounted.current) {
				setData(resultData);
				setError(null);
			}
		} catch (err: any) {
			if (isMounted.current) {
				setError(err.message || 'Error loading analytics');
			}
		} finally {
			if (isMounted.current) {
				setLoading(false);
				setRefreshing(false);
			}
		}
	}, [cacheKey, platform, sinceStr, untilStr]);

	useEffect(() => {
		fetchData(false);
	}, [fetchData]);

	const refetch = useCallback(async () => {
		await fetchData(true);
	}, [fetchData]);

	return {
		data,
		loading,
		error,
		refreshing,
		refetch,
	};
}
