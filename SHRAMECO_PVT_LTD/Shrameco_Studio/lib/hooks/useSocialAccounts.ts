'use client';

import { useState, useEffect, useCallback } from 'react';

let globalAccountsCache: any[] | null = null;
let lastAccountsFetch = 0;
const ACCOUNTS_CACHE_TTL = 60000; // 60s TTL

export function useSocialAccounts() {
	const [accounts, setAccounts] = useState<any[]>(globalAccountsCache || []);
	const [loading, setLoading] = useState<boolean>(!globalAccountsCache);

	const fetchAccounts = useCallback(async (force = false) => {
		const now = Date.now();
		if (!force && globalAccountsCache && (now - lastAccountsFetch < ACCOUNTS_CACHE_TTL)) {
			setAccounts(globalAccountsCache);
			setLoading(false);
			return;
		}

		try {
			const res = await fetch('/api/social/accounts');
			if (res.ok) {
				const json = await res.json();
				const list = json.accounts || [];
				globalAccountsCache = list;
				lastAccountsFetch = Date.now();
				setAccounts(list);
			}
		} catch (err) {
			console.error('Error fetching social accounts:', err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAccounts(false);
	}, [fetchAccounts]);

	return {
		accounts,
		loading,
		refetchAccounts: () => fetchAccounts(true),
	};
}
