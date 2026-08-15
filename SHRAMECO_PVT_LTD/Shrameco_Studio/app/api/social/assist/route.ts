import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { BrandProfile } from '@/models/BrandProfile';
import { getAuthSession } from '@/lib/auth/jwt';
import { memoryStore } from '@/lib/db/memoryStore';
import { callOpenRouter, hasOpenRouterKey } from '@/lib/ai/llm';

export const dynamic = 'force-dynamic';

type AssistAction =
	| 'professional'
	| 'viral'
	| 'founder'
	| 'recruiter'
	| 'student'
	| 'casual'
	| 'technical'
	| 'minimal'
	| 'add-hashtags'
	| 'improve-grammar'
	| 'shorten'
	| 'expand'
	| 'make-engaging'
	| 'generate-hook'
	| 'generate-cta'
	| 'custom';

const PRESET_ACTIONS: Record<string, string> = {
	professional: 'Rewrite this into a polished, executive, professional tone for LinkedIn.',
	viral: 'Rewrite this to maximize reach and shareability: punchy, scroll-stopping, and share-worthy.',
	founder: 'Rewrite this in a bold, authentic founder voice: personal, visionary, slightly informal.',
	recruiter: 'Rewrite this to attract talent: welcoming, opportunity-focused, human.',
	student: 'Rewrite this in a relatable, learner voice: curious, enthusiastic, plain-spoken.',
	casual: 'Rewrite this in a friendly, relaxed, conversational tone.',
	technical: 'Rewrite this with technical depth and precision, developer-focused.',
	minimal: 'Rewrite this minimal and concise, stripped of fluff.',
};

const UTILITY_ACTIONS: Record<string, string> = {
	'add-hashtags': 'Add 3-5 relevant hashtags at the end of the text. Keep the text otherwise identical.',
	'improve-grammar': 'Fix grammar, spelling, and punctuation. Keep the content identical otherwise.',
	shorten: 'Shorten the text to under 280 characters. Keep the core message and hook.',
	expand: 'Expand the text with more detail and value, aiming for 150-250 words.',
	'make-engaging': 'Make the text more engaging by adding a question or an interactive element.',
	'generate-hook': 'Rewrite the opening sentence into a powerful scroll-stopping hook under 12 words.',
	'generate-cta': 'Add a clear call-to-action sentence at the end of the text.',
};

const ALL_ACTIONS: string[] = [...Object.keys(PRESET_ACTIONS), ...Object.keys(UTILITY_ACTIONS), 'custom'];

function buildSystemPrompt(brand: any, objective: string, platform: string): string {
	return `You are a world-class LinkedIn copywriter for ${brand.companyName || 'the brand'} (${brand.industry || 'Tech'}).
BRAND VOICE: ${brand.brandVoice || 'Professional, visionary, authoritative yet approachable.'}
CONTENT PILLARS: ${brand.contentPillars?.join(', ') || 'Innovation, Excellence'}
BANNED TOPICS: ${brand.bannedTopics?.join(', ') || 'None'}
BANNED WORDS: ${brand.bannedWords?.join(', ') || 'None'}
PLATFORM: ${platform}

OBJECTIVE: ${objective}

Return ONLY the rewritten caption text. No preamble, no commentary, no markdown.`;
}

function extractHashtags(topic: string, text: string): string[] {
	const words = (topic || text)
		.replace(/[^\w\s]/g, ' ')
		.split(/\s+/)
		.filter((w) => w.length >= 3)
		.slice(0, 5);
	const tags: string[] = [];
	const seen = new Set<string>();
	for (const w of words) {
		if (tags.length >= 4) break;
		const tag = `#${w.charAt(0).toUpperCase()}${w.slice(1)}`;
		if (!seen.has(tag)) {
			seen.add(tag);
			tags.push(tag);
		}
	}
	return tags;
}

function fallbackAssist(action: AssistAction, text: string, topic: string, instruction: string): string {
	const trimmed = text.trim();
	switch (action) {
		case 'add-hashtags': {
			const tags = extractHashtags(topic, text);
			return tags.length ? `${trimmed}\n\n${tags.join(' ')}` : trimmed;
		}
		case 'improve-grammar':
			return trimmed;
		case 'shorten': {
			if (trimmed.length <= 280) return trimmed;
			return `${trimmed.slice(0, 277).replace(/\s+\S*$/, '')}…`;
		}
		case 'expand':
			return `${trimmed}\n\nHere is what we mean in practice: clear outcomes, measurable progress, and a repeatable process that teams can follow. Let me know your thoughts below.`;
		case 'make-engaging':
			return `${trimmed}\n\nWhat would you add or change? I would love to hear your take in the comments.`;
		case 'generate-hook':
			return `The future of ${topic || 'this'} is being built today — here is what matters.\n\n${trimmed}`;
		case 'generate-cta':
			return `${trimmed}\n\nFollow for more insights like this, and share your thoughts in the comments.`;
		case 'custom':
			return instruction ? `${trimmed}\n\n(${instruction})` : trimmed;
		default:
			// Preset tone actions: deterministic minimal polish when no LLM key.
			return trimmed;
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { action, text, topic, instruction } = await req.json();

		if (typeof action !== 'string' || !ALL_ACTIONS.includes(action)) {
			return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
		}
		if (typeof text !== 'string' || !text.trim()) {
			return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
		}
		if (action === 'custom' && (typeof instruction !== 'string' || !instruction.trim())) {
			return NextResponse.json({ error: 'Custom instruction is required.' }, { status: 400 });
		}

		let brand: any = null;
		try {
			await dbConnect();
			brand = await BrandProfile.findOne({ userId: session.userId });
		} catch (dbErr) {
			console.warn('MongoDB connection failed; loading brand profile from memory store.');
		}
		if (!brand) {
			brand = memoryStore.getBrandProfile(session.userId);
		}

		const objective = action === 'custom' ? instruction : (PRESET_ACTIONS[action] || UTILITY_ACTIONS[action] || '');
		const platform = 'linkedin';

		if (hasOpenRouterKey()) {
			const systemPrompt = buildSystemPrompt(brand, objective, platform);
			const userContent = action === 'custom' ? `Original text:\n"""${text}"""\n\nApply this instruction: ${instruction}` : `Original text:\n"""${text}"""\n\nApply: ${objective}`;
			const result = await callOpenRouter({ systemPrompt, userContent, temperature: 0.7, maxTokens: 800 });
			if (result) {
				return NextResponse.json({ ok: true, text: result, action, provider: 'openrouter' });
			}
		}

		return NextResponse.json({
			ok: true,
			text: fallbackAssist(action as AssistAction, text, topic || '', instruction || ''),
			action,
			provider: 'fallback',
		});
	} catch (error) {
		console.error('Error running AI assist:', error);
		return NextResponse.json({ error: 'Failed to run AI assist.' }, { status: 500 });
	}
}
