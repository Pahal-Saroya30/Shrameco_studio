// Cross-tab media storage using browser IndexedDB

export async function storeMediaBlob(key: string, blob: Blob | File): Promise<void> {
	if (typeof window === 'undefined' || !window.indexedDB) return;

	return new Promise((resolve, reject) => {
		const request = indexedDB.open('BrandStudioMediaDB', 1);
		request.onupgradeneeded = (e: any) => {
			const db = e.target.result;
			if (!db.objectStoreNames.contains('media')) {
				db.createObjectStore('media');
			}
		};
		request.onsuccess = (e: any) => {
			const db = e.target.result;
			const tx = db.transaction('media', 'readwrite');
			const store = tx.objectStore('media');
			store.put(blob, key);
			tx.oncomplete = () => resolve();
			tx.onerror = (err: any) => reject(err);
		};
		request.onerror = (err: any) => reject(err);
	});
}

export async function getMediaBlob(key: string): Promise<Blob | null> {
	if (typeof window === 'undefined' || !window.indexedDB) return null;

	return new Promise((resolve) => {
		const request = indexedDB.open('BrandStudioMediaDB', 1);
		request.onupgradeneeded = (e: any) => {
			const db = e.target.result;
			if (!db.objectStoreNames.contains('media')) {
				db.createObjectStore('media');
			}
		};
		request.onsuccess = (e: any) => {
			const db = e.target.result;
			const tx = db.transaction('media', 'readonly');
			const store = tx.objectStore('media');
			const getReq = store.get(key);
			getReq.onsuccess = () => {
				resolve(getReq.result || null);
			};
			getReq.onerror = () => resolve(null);
		};
		request.onerror = () => resolve(null);
	});
}
