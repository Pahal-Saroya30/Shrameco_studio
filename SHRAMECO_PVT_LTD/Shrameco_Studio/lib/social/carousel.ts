export type SlideType = 'TITLE' | 'CONTENT' | 'QUOTE' | 'STATS' | 'TIMELINE' | 'CHECKLIST' | 'IMAGE' | 'CTA';

export const SLIDE_TYPES: SlideType[] = ['TITLE', 'CONTENT', 'QUOTE', 'STATS', 'TIMELINE', 'CHECKLIST', 'IMAGE', 'CTA'];

export const CAROUSEL_LENGTHS = {
	short: 5,
	medium: 8,
	long: 12,
} as const;

export type CarouselLength = keyof typeof CAROUSEL_LENGTHS;

export interface CarouselSlideContent {
	type: SlideType;
	title?: string;
	subtitle?: string;
	points?: string[];
	quote?: string;
	author?: string;
	stats?: { value: string; label: string }[];
	items?: string[];
	imagePrompt?: string;
	cta?: string;
}

export interface CarouselAsset {
	schemaVersion: number;
	slides: CarouselSlideContent[];
	caption: string;
}

export const CAROUSEL_SCHEMA_VERSION = 1;

// --- Validation ------------------------------------------------------------

export function validateCarouselAsset(input: unknown): input is CarouselAsset {
	if (!input || typeof input !== 'object') return false;
	const asset = input as Record<string, unknown>;

	if (asset.schemaVersion !== CAROUSEL_SCHEMA_VERSION) return false;
	if (!Array.isArray(asset.slides) || asset.slides.length === 0) return false;
	if (typeof asset.caption !== 'string' || asset.caption.trim().length === 0) return false;

	return asset.slides.every((slide) => {
		if (!slide || typeof slide !== 'object') return false;
		const s = slide as Record<string, unknown>;
		if (typeof s.type !== 'string' || !SLIDE_TYPES.includes(s.type as SlideType)) return false;
		if (s.title !== undefined && typeof s.title !== 'string') return false;
		if (s.subtitle !== undefined && typeof s.subtitle !== 'string') return false;
		if (s.cta !== undefined && typeof s.cta !== 'string') return false;
		if (s.quote !== undefined && typeof s.quote !== 'string') return false;
		if (s.imagePrompt !== undefined && typeof s.imagePrompt !== 'string') return false;
		if (s.points !== undefined && (!Array.isArray(s.points) || s.points.some((p) => typeof p !== 'string'))) return false;
		if (s.items !== undefined && (!Array.isArray(s.items) || s.items.some((i) => typeof i !== 'string'))) return false;
		if (s.stats !== undefined && !Array.isArray(s.stats)) return false;
		return true;
	});
}

// --- Fallback (typed placeholder, never render broken output) --------------

export function buildFallbackCarousel(topic: string, length: CarouselLength, companyName: string): CarouselAsset {
	const count = CAROUSEL_LENGTHS[length];
	const slides: CarouselSlideContent[] = [
		{ type: 'TITLE', title: topic, subtitle: `A ${count}-slide guide from ${companyName}` },
	];

	for (let i = 1; i < count - 1; i++) {
		slides.push({
			type: i % 3 === 1 ? 'CONTENT' : i % 3 === 2 ? 'CHECKLIST' : 'QUOTE',
			title: i % 3 === 1 ? `Key point ${i}` : `Focus area ${i}`,
			points: i % 3 === 1 ? ['Clear goal', 'Measurable outcome', 'Repeatable process'] : undefined,
			quote: i % 3 === 2 ? `Insight ${i} on "${topic}"` : undefined,
			items: i % 3 === 2 ? ['Plan the work', 'Ship fast', 'Iterate on feedback'] : undefined,
			imagePrompt: `Abstract professional ${topic.toLowerCase()} visual for ${companyName}, slide ${i}, corporate minimal style`,
		});
	}

	slides.push({ type: 'CTA', title: 'Ready to go deeper?', cta: `Follow ${companyName} for more on ${topic}` });

	return {
		schemaVersion: CAROUSEL_SCHEMA_VERSION,
		slides,
		caption: `${topic} — a practical ${count}-slide breakdown. Save this for later and share it with your network. #${topic.replace(/\s+/g, '')}`,
	};
}

// --- LLM generation ----------------------------------------------------------

import { callOpenRouter } from '@/lib/ai/llm';

interface CarouselBrandContext {
	companyName: string;
	industry: string;
	brandVoice: string;
	contentPillars: string;
	bannedTopics: string;
	bannedWords: string;
	colorPalette: string[];
}

const SYSTEM_PROMPT = (brand: CarouselBrandContext, count: number) => `You are a world-class LinkedIn carousel copywriter for ${brand.companyName} (${brand.industry}).
BRAND VOICE: ${brand.brandVoice}
CONTENT PILLARS: ${brand.contentPillars}
BANNED TOPICS: ${brand.bannedTopics}
BANNED WORDS: ${brand.bannedWords}

Create a LinkedIn carousel document deck with EXACTLY ${count} slides about the user's topic.

Valid slide types: TITLE, CONTENT, QUOTE, STATS, TIMELINE, CHECKLIST, IMAGE, CTA.
- TITLE: { type, title, subtitle }
- CONTENT: { type, title, points: [string] }
- QUOTE: { type, quote, author }
- STATS: { type, title, stats: [{ value, label }] }
- CHECKLIST: { type, title, items: [string] }
- TIMELINE: { type, title, items: [string] }
- IMAGE: { type, title, subtitle }
- CTA: { type, title, cta }

Include ONE TITLE slide first and ONE CTA slide last. Give every slide an imagePrompt (concise English description for generating a professional abstract background image, consistent visual style across all slides).

Return ONLY strict JSON (no markdown, no commentary):
{
  "schemaVersion": 1,
  "slides": [ ... ],
  "caption": "One overall caption for the document post, under 200 characters, starting with a scroll-stopping hook."
}`;

export async function generateAICarousel(
	topic: string,
	length: CarouselLength,
	brand: CarouselBrandContext
): Promise<CarouselAsset> {
	const count = CAROUSEL_LENGTHS[length];

	// Two attempts: validate -> regenerate once, then typed fallback.
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const rawContent = await callOpenRouter({
				systemPrompt: SYSTEM_PROMPT(brand, count),
				userContent: `Topic: ${topic}`,
				temperature: 0.7,
				maxTokens: 3000,
				jsonMode: true,
			});
			if (rawContent) {
				const parsed = JSON.parse(rawContent);
				if (validateCarouselAsset(parsed)) {
					const asset = parsed as CarouselAsset;
					// Enforce the exact slide count from the length preset.
					const resized = resizeSlides(asset, count, topic, brand.companyName);
					if (resized) return resized;
				}
			}
		} catch (llmErr) {
			console.warn(`AI carousel generation attempt ${attempt + 1} failed:`, llmErr);
		}
	}

	return buildFallbackCarousel(topic, length, brand.companyName);
}

function resizeSlides(asset: CarouselAsset, count: number, topic: string, companyName: string): CarouselAsset | null {
	let slides = asset.slides;
	if (slides.length > count) {
		slides = slides.slice(0, count);
		// Ensure a CTA still closes the deck.
		if (slides[slides.length - 1].type !== 'CTA') {
			slides = [...slides.slice(0, -1), slides[slides.length - 1], { type: 'CTA', title: 'Ready to go deeper?', cta: `Follow ${companyName} for more on ${topic}` }];
			slides = slides.slice(0, count);
		}
	} else if (slides.length < count) {
		const filler: CarouselSlideContent = {
			type: 'CONTENT',
			title: `Point ${slides.length + 1}`,
			points: ['Clarify the outcome', 'Plan the sequence', 'Execute and measure'],
			imagePrompt: `Abstract professional ${topic.toLowerCase()} visual for ${companyName}, corporate minimal style`,
		};
		slides = [...slides];
		while (slides.length < count) slides.splice(slides.length - 1, 0, { ...filler, title: `Point ${slides.length}` });
	}
	return validateCarouselAsset({ ...asset, slides }) ? { ...asset, slides } : null;
}
