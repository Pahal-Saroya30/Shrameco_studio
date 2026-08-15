import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { BrandProfile } from '@/models/BrandProfile';
import { getAuthSession } from '@/lib/auth/jwt';
import { memoryStore } from '@/lib/db/memoryStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { topic, platform, count, includeBrand, systemPrompt: customSystemPrompt } = await req.json();

		if (!topic || !platform || typeof topic !== 'string' || typeof platform !== 'string') {
			return NextResponse.json({ error: 'Topic and platform are required.' }, { status: 400 });
		}

		const countNum = count ? parseInt(count, 10) : 1;

		let brand: any = null;

		if (includeBrand !== false) {
			try {
				await dbConnect();
				brand = await BrandProfile.findOne({ userId: session.userId });
			} catch (dbErr) {
				console.warn('MongoDB connection failed; loading brand profile from memory store.');
			}

			if (!brand) {
				brand = memoryStore.getBrandProfile(session.userId);
			}
		}

		const companyName = brand?.companyName || 'Our Brand';
		const industry = brand?.industry || 'Tech';
		const brandVoice = brand?.brandVoice || 'Professional, visionary, authoritative yet approachable.';
		const contentPillars = brand?.contentPillars?.join(', ') || 'Innovation, Excellence';
		const bannedTopics = brand?.bannedTopics?.join(', ') || 'None';
		const bannedWords = brand?.bannedWords?.join(', ') || 'None';
		const slogan = brand?.slogan || '';
		const cta = brand?.cta || '';
		const socialHandle = brand?.socialHandle || '';

		const platformGuidelines = {
			instagram: `Vibrant, engaging, visual-first creative tone. Start with a bold, emotive statement. Use generous line breaks. Include 3-5 high-value hashtags. Keep under 150 words. ${
				slogan ? `Naturally integrate the brand slogan "${slogan}" in the text.` : ''
			} ${
				cta ? `At the end, append a Call to Action: "${cta}".` : ''
			}`,
			linkedin: `Executive, authoritative, thought-leadership tone. Begin with a strong scroll-stopping hook (under 12 words). Structure with clean short paragraphs and indented bullet points. Keep under 250 words. ${
				slogan ? `Weave the brand tagline "${slogan}" inside.` : ''
			} ${
				cta ? `End with a Call to Action link: "${cta}".` : ''
			}`,
			x: `Direct, punchy, high-impact developer and tech-focused tone. Maximum 280 characters. No fluff. ${
				cta ? `Include link: "${cta}".` : ''
			} ${
				socialHandle ? `Tag ${socialHandle}.` : ''
			}`,
			youtube: `High-conversion YouTube SEO metadata tone. Start with a catchy, attention-grabbing video TITLE (under 80 chars) starting with "TITLE: ". Then write a detailed description starting with "DESCRIPTION: " outlining the content and value points in a clean, highly engaging paragraph format, followed by 3 high-value hashtags at the end. Do NOT add any timestamps, timelines, list indicators, or dummy placeholders. ${
				slogan ? `Naturally integrate the brand slogan "${slogan}" inside the copy.` : ''
			} ${
				cta ? `At the end of the description, append a clear Call to Action using the link: "${cta}".` : ''
			} ${
				socialHandle ? `Include the brand social handle "${socialHandle}" in the description or as a hashtag.` : ''
			} Finally, write a list of search tags starting with "TAGS: " separated by commas.`,
		}[platform.toLowerCase() as 'instagram' | 'linkedin' | 'x' | 'youtube'] || 'Professional, concise and engaging.';

		let openRouterApiKey = process.env.OPENROUTER_API_KEY;
		if (openRouterApiKey && openRouterApiKey.includes('mock-openrouter-key')) {
			openRouterApiKey = '';
		}

		let openRouterModel = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

		if (openRouterModel === 'openrouter/free' || openRouterModel === 'openrouter/auto') {
			openRouterModel = 'google/gemini-2.5-flash';
		}

		if (openRouterApiKey && !openRouterApiKey.includes('mock-openrouter-key')) {
			try {
				const isPlainOutput = platform.toLowerCase() === 'youtube' || countNum === 1;
				const systemPrompt = customSystemPrompt || `You are a world-class executive copywriter for ${companyName} (${industry}).
BRAND VOICE: ${brandVoice}
CONTENT PILLARS: ${contentPillars}
BANNED TOPICS: ${bannedTopics}
BANNED WORDS: ${bannedWords}
${slogan ? `BRAND SLOGAN: ${slogan}` : ''}
${cta ? `BRAND CTA LINK: ${cta}` : ''}
${socialHandle ? `SOCIAL HANDLE: ${socialHandle}` : ''}
PLATFORM: ${platform.toUpperCase()}
GUIDELINES: ${platformGuidelines}

Generate ${countNum} distinct, compelling post variations.${
					isPlainOutput 
						? ' Respond in plain text format directly. Do not wrap in a JSON array or code block.' 
						: ' Format output strictly as JSON array of strings: ["Variation 1...", "Variation 2...", "Variation 3..."] without markdown ticks.'
				}`;

				const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${openRouterApiKey}`,
						'HTTP-Referer': 'https://brandcontentstudio.local',
						'X-Title': 'Brand Content Studio',
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						model: openRouterModel,
						messages: [
							{ role: 'system', content: systemPrompt },
							{ role: 'user', content: `Topic: ${topic}` },
						],
						temperature: 0.7,
						max_tokens: 1000,
					}),
				});

				if (openRouterRes.ok) {
					const data = await openRouterRes.json();
					const rawContent = data.choices?.[0]?.message?.content?.trim() || '';
					try {
						const cleaned = rawContent.replace(/```json\n?|\n?```/g, '').trim();
						const parsed = JSON.parse(cleaned);
						if (Array.isArray(parsed) && parsed.length >= countNum) {
							return NextResponse.json({ variations: parsed.slice(0, countNum), generatedText: parsed[0] });
						}
					} catch (e) {
						if (rawContent) {
							if (platform.toLowerCase() === 'youtube' || countNum === 1) {
								return NextResponse.json({ variations: [rawContent], generatedText: rawContent });
							}
							const splits = rawContent.split(/\n\s*\n/).filter(Boolean);
							if (splits.length >= countNum) {
								return NextResponse.json({ variations: splits.slice(0, countNum), generatedText: splits[0] });
							}
						}
					}
				}
			} catch (llmErr) {
				console.warn('OpenRouter fetch failed:', llmErr);
			}
		}

		// Fallback variations generator
		if (platform.toLowerCase() === 'youtube') {
			// Extract a clean topic from the prompt to avoid matching raw commands
			const cleanTopic = topic.match(/"([^"]+)"/)?.[1] || topic.slice(0, 50);
			const rawContent = `TITLE: Live YouTube SEO Title for: ${cleanTopic} 🚀\nDESCRIPTION: Explore high-conversion content details and execution strategies about ${cleanTopic} inside this video.\nTAGS: youtube, ${cleanTopic.toLowerCase().replace(/\s+/g, '')}, marketing, design`;
			return NextResponse.json({ variations: [rawContent], generatedText: rawContent });
		}

		const variations = [
			`At ${companyName}, we believe great products are born from ruthless prioritization and deep empathy for users.\n\nKey takeaways from our ${topic} strategy:\n1. Execution speed beats perfection.\n2. Standardize core architecture early.\n3. Keep user feedback in the loop.`,
			`We are officially announcing our latest roadmap update around ${topic}. 🚀\n\nOur team is working to standardize database adapters, add validation middleware, and streamline integrations. Stay tuned!`,
			`3 tips to accelerate your ${topic} workflow:\n• Define concrete specs before writing code.\n• Run localized automation test scripts before merging.\n• Build custom mocks for third-party APIs.`,
		];

		return NextResponse.json({ variations: variations.slice(0, countNum), generatedText: variations[0] });
	} catch (error) {
		console.error('Error generating content:', error);
		return NextResponse.json({ error: 'Failed to generate content.' }, { status: 500 });
	}
}
