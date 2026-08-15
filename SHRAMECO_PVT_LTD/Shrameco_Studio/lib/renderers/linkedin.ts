// LinkedInRenderer — Content Asset → LinkedIn payload (+ media uploads)
// Per roadmap 2.7: linkedinService.publish is the thin transport; this module
// owns payload assembly (commentary, content[], media references) and uploads.

import { buildDocumentPdf } from '@/lib/social/pdf';

const API_BASE = 'https://api.linkedin.com';

// LinkedIn Documents API limits (LinkedIn docs): max 100 MB and 300 pages.
const MAX_DOCUMENT_BYTES = 100 * 1024 * 1024;
const MAX_DOCUMENT_PAGES = 300;

// LinkedIn Videos API: max 5 GB per video; parts are 4 MB each (4194304 bytes).
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const VIDEO_PART_BYTES = 4194304;

// LinkedIn requires a Linkedin-Version header on Posts-API calls (verify at impl).
export const LINKEDIN_VERSION = '202607';

function postsHeaders(authorization: string, headers?: Record<string, string>): Record<string, string> {
	return {
		Authorization: authorization,
		'Content-Type': 'application/json',
		'X-Restli-Protocol-Version': '2.0.0',
		'LinkedIn-Version': LINKEDIN_VERSION,
		...(headers || {}),
	};
}

// --- Pure payload builders --------------------------------------------------

export function buildCommentary(caption: string, link?: string): string {
	if (!link) return caption;
	return caption.trim().length > 0 ? `${caption}\n\n${link}` : link;
}

// Posts-API document post payload (used by carousel path).
export function buildPostsDocumentPayload(author: string, commentary: string, documentUrn: string, title?: string) {
	return buildPostsTextPayload(author, commentary, buildDocumentContent(documentUrn, title));
}

// Legacy ugcPosts ShareContent body (text / image) — kept behind the
// LINKEDIN_LEGACY_UGC toggle so the new Posts-API path is regression-safe.
export function buildUgqShareContent(commentary: string, media: unknown[], shareMediaCategory: string) {
	return {
		'com.linkedin.ugc.ShareContent': {
			shareCommentary: { text: commentary },
			shareMediaCategory,
			media,
		},
	};
}

// Posts-API text post body.
export function buildPostsTextPayload(author: string, commentary: string, content?: any) {
	const payload: any = {
		author,
		lifecycleState: 'PUBLISHED',
		commentary,
		visibility: 'PUBLIC',
		distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
	};
	if (content && typeof content === 'object' && Object.keys(content).length > 0) {
		payload.content = content;
	}
	return payload;
}

// Posts-API content entries.
export function buildImageContent(imageUrn: string) {
	return { media: { id: imageUrn } };
}

export function getArticleTitleFromLink(link: string): string {
	try {
		const url = new URL(link);
		const lastSegment = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop();
		if (lastSegment) {
			const clean = lastSegment.replace(/[-_]/g, ' ');
			return clean.charAt(0).toUpperCase() + clean.slice(1);
		}
		return url.hostname;
	} catch {
		return 'Shared Link';
	}
}

// ArticleContent per LinkedIn Posts API: source + title required; description and
// thumbnail (ImageUrn) optional. LinkedIn does not scrape the URL, so the caller
// supplies these fields (Fix 52).
export function buildArticleContent(source: string, title?: string, description?: string, thumbnail?: string) {
	const article: Record<string, unknown> = {
		source,
		title: (title?.trim() || getArticleTitleFromLink(source)).slice(0, 400),
	};
	if (description?.trim()) {
		article.description = description.trim().slice(0, 4086);
	}
	if (thumbnail) {
		article.thumbnail = thumbnail;
	}
	return { article };
}

export function buildDocumentContent(documentUrn: string, title?: string) {
	const media: Record<string, unknown> = { id: documentUrn };
	if (title?.trim()) {
		media.title = title.trim().slice(0, 100);
	}
	return { media };
}

// Posts-API video post content: content.media carries the video URN + title (Fix 54).
export function buildVideoContent(videoUrn: string, title?: string) {
	const media: Record<string, unknown> = { id: videoUrn };
	if (title?.trim()) {
		media.title = title.trim().slice(0, 100);
	}
	return { media };
}

// --- Media uploads (renderer owns these per roadmap) -------------------------

function imageUrlToBuffer(url: string): Buffer {
	if (url.startsWith('data:')) {
		return base64DataUrlToBuffer(url);
	}
	throw new Error('Image URL must be base64 data URL for LinkedIn upload.');
}

function base64DataUrlToBuffer(dataUrl: string): Buffer {
	const match = dataUrl.match(/^data:[^;]+;base64,(.*)$/);
	if (!match) throw new Error('Invalid base64 data URL format.');
	return Buffer.from(match[1], 'base64');
}

// Legacy /v2/assets image upload → urn:li:digitalmediaAsset:{id}.
export async function uploadLegacyLinkedInImage(accessToken: string, author: string, imageUrl: string): Promise<{ asset: string }> {
	const registerRes = await fetch(`${API_BASE}/v2/assets?action=registerUpload`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
			'X-Restli-Protocol-Version': '2.0.0',
		},
		body: JSON.stringify({
			registerUploadRequest: {
				recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
				owner: author,
				serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
			},
		}),
	});
	if (!registerRes.ok) {
		const body = await registerRes.text();
		throw new Error(`LinkedIn upload registration failed (${registerRes.status}): ${body.slice(0, 300)}`);
	}
	const registerData = await registerRes.json();
	const mechanism = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'];
	const uploadUrl: string = mechanism.uploadUrl;
	const asset: string = registerData.value.asset;

	const buffer = imageUrlToBuffer(imageUrl);
	const uploadRes = await fetch(uploadUrl, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/octet-stream' },
		body: new Uint8Array(buffer),
	});
	if (!uploadRes.ok) {
		throw new Error(`LinkedIn image upload failed (${uploadRes.status}).`);
	}

	return { asset };
}

// New Images API → urn:li:image:{id} with automatic legacy digitalmediaAsset fallback for self-serve client apps.
export async function uploadLinkedInImage(accessToken: string, author: string, imageUrl: string): Promise<{ imageUrn: string }> {
	try {
		const registerRes = await fetch(`${API_BASE}/rest/images?action=initializeUpload`, {
			method: 'POST',
			headers: postsHeaders(`Bearer ${accessToken}`),
			body: JSON.stringify({
				initializeUploadRequest: {
					owner: author,
				},
			}),
		});
		if (registerRes.ok) {
			const registerData = await registerRes.json();
			const uploadUrl: string = registerData.value.uploadUrl;
			const imageUrn: string = registerData.value.image;

			const buffer = imageUrlToBuffer(imageUrl);
			const uploadRes = await fetch(uploadUrl, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/octet-stream' },
				body: new Uint8Array(buffer),
			});
			if (uploadRes.ok) {
				return { imageUrn };
			} else {
				console.warn(`LinkedIn modern image PUT failed (${uploadRes.status}); trying legacy fallback.`);
			}
		} else {
			console.warn(`LinkedIn modern image initialize failed (${registerRes.status}); trying legacy fallback.`);
		}
	} catch (e) {
		console.warn('LinkedIn modern image upload error; trying legacy fallback:', e);
	}

	// Fallback to legacy assets API which does not require partner API approvals
	const legacy = await uploadLegacyLinkedInImage(accessToken, author, imageUrl);
	return { imageUrn: legacy.asset };
}

// Register a document upload + PUT the PDF bytes → urn:li:document:{id}.
// Shared by the slides→PDF path and the user-uploaded PDF path (Fix 44).
export async function registerAndUploadDocument(accessToken: string, author: string, buffer: Buffer): Promise<{ documentUrn: string }> {
	const registerRes = await fetch(`${API_BASE}/rest/documents?action=initializeUpload`, {
		method: 'POST',
		headers: postsHeaders(`Bearer ${accessToken}`),
		body: JSON.stringify({
			initializeUploadRequest: {
				owner: author,
			},
		}),
	});
	if (!registerRes.ok) {
		const body = await registerRes.text();
		throw new Error(`LinkedIn document registration failed (${registerRes.status}): ${body.slice(0, 300)}`);
	}
	const registerData = await registerRes.json();
	const uploadUrl: string = registerData.value.uploadUrl;
	const documentUrn: string = registerData.value.document;

	// Documents are uploaded with application/pdf (octet-stream works for images,
	// not reliably for documents) — LinkedIn Documents API / Fix 48.
	// NOTE: DO NOT send Authorization or LinkedIn headers here. uploadUrl is a
	// pre-signed S3/Azure URL and will reject the request if those are present.
	const uploadRes = await fetch(uploadUrl, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/pdf',
		},
		body: new Uint8Array(buffer),
	});
	if (!uploadRes.ok) {
		throw new Error(`LinkedIn document upload failed (${uploadRes.status}).`);
	}

	// Documents process asynchronously — wait until the asset is AVAILABLE before
	// creating the post that references it (LinkedIn Documents API / Fix 48).
	await waitForDocumentReady(accessToken, documentUrn);

	return { documentUrn };
}

async function getDocumentStatus(accessToken: string, documentUrn: string): Promise<string> {
	const res = await fetch(`${API_BASE}/rest/documents/${encodeURIComponent(documentUrn)}`, {
		method: 'GET',
		headers: postsHeaders(`Bearer ${accessToken}`),
	});
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`LinkedIn document status check failed (${res.status}): ${body.slice(0, 300)}`);
	}
	const data = await res.json();
	return data?.status || 'UNKNOWN';
}

async function waitForDocumentReady(accessToken: string, documentUrn: string, maxAttempts = 30, delayMs = 2000): Promise<void> {
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		if (attempt > 0) {
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
		const status = await getDocumentStatus(accessToken, documentUrn);
		if (status === 'AVAILABLE') return;
		if (status === 'PROCESSING_FAILED') {
			throw new Error('LinkedIn could not process the uploaded document (PROCESSING_FAILED). Please try again.');
		}
	}
	throw new Error('LinkedIn document took too long to become available. Please try again.');
}

// Build the PDF from slides + register + upload the document → urn:li:document:{id}.
export async function uploadLinkedInDocument(
	accessToken: string,
	author: string,
	slides: { imageUrl?: string }[],
	size: '4/5' | '1/1'
): Promise<{ documentUrn: string; pageCount: number }> {
	if (slides.length === 0) throw new Error('A carousel post needs at least one slide image.');
	const imageSlides = slides.map((s) => ({ imageUrl: s.imageUrl || '' }));

	const { buffer, pageCount } = await buildDocumentPdf({ slides: imageSlides, size: size || '4/5' });
	const { documentUrn } = await registerAndUploadDocument(accessToken, author, buffer);

	return { documentUrn, pageCount };
}

// Upload a user-provided PDF (base64 data URL) → urn:li:document:{id}.
// Page count is read from the PDF itself (Fix 44). The PDF is fully validated
// BEFORE any initializeUpload/registration is attempted (Fix 49).
export async function uploadLinkedInPdfBuffer(
	accessToken: string,
	author: string,
	dataUrl: string
): Promise<{ documentUrn: string; pageCount: number }> {
	const buffer = base64DataUrlToBuffer(dataUrl);

	if (buffer.byteLength > MAX_DOCUMENT_BYTES) {
		throw new Error('PDF document must be under 100 MB (LinkedIn Documents API limit).');
	}

	let pageCount = 0;
	try {
		const { PDFDocument } = await import('pdf-lib');
		const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
		pageCount = doc.getPageCount();
	} catch (err) {
		throw new Error('Could not read the uploaded PDF. Please upload a valid PDF file.');
	}
	if (pageCount === 0) {
		throw new Error('The uploaded PDF appears to be empty.');
	}
	if (pageCount > MAX_DOCUMENT_PAGES) {
		throw new Error(`This PDF has ${pageCount} pages. LinkedIn supports documents up to ${MAX_DOCUMENT_PAGES} pages.`);
	}

	const { documentUrn } = await registerAndUploadDocument(accessToken, author, buffer);

	return { documentUrn, pageCount };
}

// --- Native video upload (Videos API) — Fix 54 ---------------------------------
// Flow (per LinkedIn Videos API docs):
//   1. POST /rest/videos?action=initializeUpload  → uploadInstructions + video URN + uploadToken
//   2. PUT each 4 MB part to its pre-signed uploadUrl (no auth headers)
//   3. POST /rest/videos?action=finalizeUpload  → uploadedPartIds from part ETags
// The resulting urn:li:video:{id} is used as content.media.id by publishVideo.

export async function uploadLinkedInVideo(
	accessToken: string,
	author: string,
	dataUrl: string,
	videoType?: string
): Promise<{ videoUrn: string }> {
	if (!/^data:video\/[a-zA-Z0-9.+-]+;base64,(.*)$/.test(dataUrl)) {
		throw new Error('Invalid video data URL format.');
	}
	const buffer = base64DataUrlToBuffer(dataUrl);

	if (buffer.byteLength === 0) {
		throw new Error('The uploaded video appears to be empty.');
	}
	if (buffer.byteLength > MAX_VIDEO_BYTES) {
		throw new Error('Video must be under 200 MB.');
	}

	// 1. Initialize the upload session.
	const registerRes = await fetch(`${API_BASE}/rest/videos?action=initializeUpload`, {
		method: 'POST',
		headers: postsHeaders(`Bearer ${accessToken}`),
		body: JSON.stringify({
			initializeUploadRequest: {
				owner: author,
				fileSizeBytes: buffer.byteLength,
				uploadCaptions: false,
				uploadThumbnail: false,
			},
		}),
	});
	if (!registerRes.ok) {
		const body = await registerRes.text();
		throw new Error(`LinkedIn video registration failed (${registerRes.status}): ${body.slice(0, 300)}`);
	}
	const registerData = await registerRes.json();
	const uploadInstructions: Array<{ uploadUrl: string; firstByte: number; lastByte: number }> =
		registerData?.value?.uploadInstructions || [];
	const videoUrn: string = registerData?.value?.video;
	const uploadToken: string = registerData?.value?.uploadToken || '';

	if (!videoUrn || uploadInstructions.length === 0) {
		throw new Error('LinkedIn did not return video upload instructions.');
	}

	// 2. Upload each part to its pre-signed URL. The URLs are pre-signed, so no
	// Authorization/LinkedIn headers may be sent (same rule as document uploads).
	const uploadedPartIds: string[] = [];
	for (const instruction of uploadInstructions) {
		const chunk = buffer.subarray(instruction.firstByte, Math.min(instruction.lastByte + 1, buffer.byteLength));
		const partRes = await fetch(instruction.uploadUrl, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/octet-stream' },
			body: new Uint8Array(chunk),
		});
		if (!partRes.ok) {
			throw new Error(`LinkedIn video part upload failed (${partRes.status}).`);
		}
		const etag = (partRes.headers.get('etag') || '').replace(/^"|"$/g, '');
		if (!etag) {
			throw new Error('LinkedIn did not return an ETag for a video part.');
		}
		uploadedPartIds.push(etag.trim());
	}

	// 3. Finalize the upload session.
	const finalizeRes = await fetch(`${API_BASE}/rest/videos?action=finalizeUpload`, {
		method: 'POST',
		headers: postsHeaders(`Bearer ${accessToken}`),
		body: JSON.stringify({
			finalizeUploadRequest: {
				video: videoUrn,
				uploadToken,
				uploadedPartIds,
			},
		}),
	});
	if (!finalizeRes.ok) {
		const body = await finalizeRes.text();
		throw new Error(`LinkedIn video finalize failed (${finalizeRes.status}): ${body.slice(0, 300)}`);
	}

	return { videoUrn };
}
