import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { BrandProfile } from '@/models/BrandProfile';
import { getAuthSession } from '@/lib/auth/jwt';
import { memoryStore } from '@/lib/db/memoryStore';

export const dynamic = 'force-dynamic';

function generateDomainSpecificTakeaways(topic: string, companyName: string, toneString: string, goalCTA: string, dynamicHashtags: string[], formatLabel: string): string[] {
	const t = topic.toLowerCase();

	if (t.includes('llm') || t.includes('machine learning') || t.includes('ai') || t.includes('artificial intelligence') || t.includes('deep learning') || t.includes('neural') || t.includes('model')) {
		return [
			`🚀 ${topic}\n\nLarge Language Models and Machine Learning are transforming how modern software and intelligent workflows are built. At ${companyName}, we leverage state-of-the-art AI architecture.\n\n3 key AI takeaways:\n1. Foundation Models: Retrieval-Augmented Generation (RAG) & fine-tuning maximize domain accuracy.\n2. Data Engineering: Curated, high-integrity training datasets outperform raw model parameter scaling.\n3. Responsible Deployment: Implement strict guardrails, latency benchmarks, and continuous evaluation.\n\n${goalCTA}\n\n${dynamicHashtags.join(' ')}`,
			`✨ Deep Dive into ${topic} with ${companyName}\n\n${toneString}From transformer neural networks to real-time vector database embeddings, mastering ${topic.toLowerCase()} requires balancing algorithmic precision with scalable compute infrastructure.\n\nHow is your team deploying LLM & ML models into production? Drop your thoughts below! 👇\n\n${dynamicHashtags.join(' ')}`,
			`🌟 ${topic} | ${companyName} ${formatLabel}\n\nUnlocking practical applications of ${topic.toLowerCase()}. Focus areas: latency reduction, prompt orchestration, and continuous model performance evaluation.\n\n${goalCTA}\n\n${dynamicHashtags.join(' ')}`,
		];
	}

	if (t.includes('trek') || t.includes('hike') || t.includes('mountain') || t.includes('nature') || t.includes('adventure') || t.includes('monsoon') || t.includes('trail')) {
		return [
			`🏔️ ${topic}\n\nEmbrace wild wilderness trails and breathtaking mountain summits with ${companyName}! 🥾\n\n3 essential trekking tips:\n1. Waterproof & Thermal Layering: Invest in high-durability shell jackets and breathable base layers.\n2. Elevation Hydration & Pacing: Maintain steady trekking cadence and hydrate continuously on steep ascents.\n3. Leave No Trace: Respect trail ecology and preserve wilderness paths for future adventurers.\n\n${goalCTA}\n\n${dynamicHashtags.join(' ')}`,
			`✨ Conquering ${topic} with ${companyName}\n\n${toneString}Nothing rivals the exhilarating feeling of reaching a mist-covered ridge after a challenging monsoon climb. Gear up and explore nature's finest trails.\n\nWhat is your favorite trekking destination? Share your top trail experience below! 👇\n\n${dynamicHashtags.join(' ')}`,
			`🌟 Wilderness Expedition: ${topic} | ${companyName} ${formatLabel}\n\nEssential trail preparation, safety protocols, and summit packing lists for ${topic.toLowerCase()}.\n\n${goalCTA}\n\n${dynamicHashtags.join(' ')}`,
		];
	}

	if (t.includes('marketing') || t.includes('seo') || t.includes('sales') || t.includes('growth') || t.includes('brand') || t.includes('content')) {
		return [
			`📈 ${topic}\n\nUnlocking sustainable growth and high-converting marketing strategies at ${companyName}.\n\n3 key growth pillars:\n1. Persona Segmentation: Focus messaging directly on high-intent customer pain points.\n2. Value Storytelling: Demonstrate tangible outcomes and ROI rather than abstract features.\n3. Funnel Optimization: Test headline hooks, CTA placements, and landing page friction.\n\n${goalCTA}\n\n${dynamicHashtags.join(' ')}`,
			`✨ Mastering ${topic} with ${companyName}\n\n${toneString}Scaling organic customer acquisition requires combining compelling creative narrative with rigorous performance data analytics.\n\nWhich channel is driving your highest conversion rate right now? Share in the comments! 👇\n\n${dynamicHashtags.join(' ')}`,
			`🌟 Growth Strategy: ${topic} | ${companyName} ${formatLabel}\n\nActionable distribution frameworks and strategic playbooks centered on ${topic.toLowerCase()}.\n\n${goalCTA}\n\n${dynamicHashtags.join(' ')}`,
		];
	}

	// Dynamic fallback for any topic
	return [
		`📌 ${topic}\n\nAt ${companyName}, we are diving deep into ${topic.toLowerCase()} to deliver actionable insights.\n\n3 key takeaways:\n1. Fundamentals First: Build a strong foundation around core principles of ${topic.toLowerCase()}.\n2. Process Standardization: Create repeatable workflows and iterate based on real feedback.\n3. Measured Execution: Focus on high-value outcomes and track key progress metrics.\n\n${goalCTA}\n\n${dynamicHashtags.join(' ')}`,
		`✨ Insights on ${topic} with ${companyName}\n\n${toneString}Successfully navigating ${topic.toLowerCase()} requires strategic alignment, clarity, and continuous execution.\n\nWhat is your primary focus regarding ${topic.toLowerCase()} right now? Let us know below! 👇\n\n${dynamicHashtags.join(' ')}`,
		`🌟 ${topic} Spotlight | ${companyName} ${formatLabel}\n\nExploring ${topic.toLowerCase()} and sharing key takeaways with our community. Stay tuned for more updates!\n\n${goalCTA}\n\n${dynamicHashtags.join(' ')}`,
	];
}

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { topic, platform, format, tone, goal, count, currentCaption, refineAction, customInstruction } = await req.json();

		if (!topic || !platform || typeof topic !== 'string' || typeof platform !== 'string') {
			return NextResponse.json({ error: 'Topic and platform are required.' }, { status: 400 });
		}

		const isReelFormat = format === 'reel' || (platform === 'facebook' && format === 'reel');
		const isTextFormat = format === 'text' || (platform === 'facebook' && format === 'text');
		const countNum = count ? parseInt(count, 10) : 3;

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

		const companyName = brand?.companyName || 'aravalli travels';
		const industry = brand?.industry || 'Travel & Hospitality';
		const brandVoice = tone || brand?.brandVoice || 'Inspirational, authentic, premium, adventurous.';
		const goalText = goal || 'Awareness';

		const cleanTopic = topic
			.replace(/^A ([\w\s\/]+) (script\/caption|caption|post) about:\s*/i, '')
			.replace(/^A \w+ script\/caption about:\s*/i, '')
			.replace(/^A \w+ caption about:\s*/i, '')
			.trim();

		// Generate topic-specific hashtags from topic words
		const topicWords = cleanTopic.split(/\s+/).map((w: string) => w.replace(/[^a-zA-Z0-9]/g, '')).filter((w: string) => w.length > 3);
		const dynamicHashtags = [
			`#${companyName.replace(/\s+/g, '')}`,
			...topicWords.slice(0, 3).map((w: string) => `#${w.charAt(0).toUpperCase() + w.slice(1)}`),
			'#BrandGrowth',
		];

		const contentPillars = brand?.contentPillars?.join(', ') || 'Innovation, Excellence';

		const platformGuidelines: Record<string, string> = {
			instagram: `Vibrant, engaging, visual-first creative tone. Start with a bold statement. Include line breaks and hashtags.`,
			linkedin: `Executive, thought-leadership tone. Begin with a strong hook. Structure with bullet points.`,
			x: `Direct, punchy, high-impact tone under 280 characters.`,
			facebook: `Conversational yet professional tone. Engage with storytelling and a clear call-to-action.`,
		};
		const currentGuideline = platformGuidelines[platform.toLowerCase()] || 'Professional, concise and engaging.';

		const formatModifiers: Record<string, string> = {
			text: `FORMAT INSTRUCTION (Text Post):\n- Write a detailed, substantial caption with room for depth, complete thoughts, and narrative context.`,
			photo: `FORMAT INSTRUCTION (Photo Post):\n- Keep the caption concise and punchy.\n- Complement the visual imagery—do NOT describe what's in the image.`,
			reel: `FORMAT INSTRUCTION (Reel / Short Video):\n- Craft a punchy, hook-first caption with high, casual, fast-scroll energy.\n- Focus on stopping the scroll in the first 3 seconds.`,
			link: `FORMAT INSTRUCTION (Link Post):\n- Tease the valuable insights inside the destination link.\n- Build curiosity to encourage clicks without giving everything away in the caption.`,
			carousel: `FORMAT INSTRUCTION (Carousel Post):\n- Invite the reader to swipe through the carousel slides (e.g. "Swipe through to see...", "Slide 3 is key...").\n- Reference multiple steps or multi-card insights.`,
			video: `FORMAT INSTRUCTION (Standard Video Post):\n- Write a substantial, timeline-appropriate caption for Facebook Video feed.\n- Provide strong context for the video with an engaging conversational flow.`,
		};

		const formatKey = format?.toLowerCase() || 'text';
		let activeFormatModifier = formatModifiers[formatKey] || formatModifiers.text;

		if (refineAction && currentCaption) {
			const voiceMap: Record<string, string> = {
				voice_professional: 'Rewrite this caption in an authoritative, clear, and highly professional voice.',
				voice_casual: 'Rewrite this caption in a warm, friendly, approachable, and conversational tone.',
				voice_founder: 'Rewrite this caption from the visionary perspective of a founder sharing authentic lessons and strategic intent.',
				voice_viral: 'Rewrite this caption to maximize social shareability, high emotional resonance, and viral engagement.',
				voice_minimal: 'Rewrite this caption to be extremely crisp, minimal, punchy, and direct without fluff.',
				shorten: 'Shorten this caption so it is significantly more concise and punchy while retaining key points.',
				expand: 'Expand this caption into a fuller, more detailed post with deeper narrative, storytelling, and actionable insights.',
				make_engaging: 'Rewrite this caption to boost community engagement with interactive questions and dynamic formatting.',
				generate_hook: 'Rewrite the first line into a compelling, scroll-stopping hook that instantly grabs attention.',
				generate_cta: 'Append a powerful, persuasive call-to-action line at the bottom driving clear community engagement.',
				custom: customInstruction ? `Apply this custom refinement instruction: "${customInstruction}"` : 'Refine and polish this caption.',
			};
			const instructionStr = voiceMap[refineAction] || voiceMap.custom;
			activeFormatModifier = `ACTION INSTRUCTION:\n${instructionStr}\n\nDraft Caption to refine:\n"${currentCaption}"`;
		}

		const openRouterApiKey = process.env.OPENROUTER_API_KEY;
		// Default to working OpenRouter free model (meta-llama/llama-3.1-8b-instruct:free)
		const openRouterModel = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct';

		// 1. Try Live LLM Generation first if OPENROUTER_API_KEY is configured
		if (openRouterApiKey && !openRouterApiKey.includes('mock-openrouter-key')) {
			const baseSystemPrompt = `You are a world-class social media copywriter creating high-converting content for ${companyName} (${industry}).

YOUR MISSION: Write ${countNum} scroll-stopping, high-converting ${platform.toUpperCase()} captions about "${cleanTopic}".

CORE COPYWRITING RULES:
1. SCROLL-STOPPING HOOK: Start with a bold, specific, curiosity-inducing first sentence. Never start with generic intros like "Are you looking for...", "Welcome to...", or "In today's world...".
2. DEEP TOPIC SUBSTANCE: Include concrete facts, real-world scenario details, or actionable insights specific to "${cleanTopic}". Avoid generic marketing jargon.
3. AUTHENTIC BRAND VOICE: Write in a ${brandVoice} voice. Tone: ${tone || 'Professional & Engaging'}. Goal: ${goalText}.
4. NATURAL HUMAN MARKETER PHRASING: Write concise, crisp sentences. Use active voice and natural phrasing. Avoid robotic filler words (unlock, elevate, game-changer, seamless, delve, dive deep, leverage, empower, tapestry, testament to).
5. TAILORED FOR ${platform.toUpperCase()} ${(format || 'post').toUpperCase()}: Format the copy cleanly for Facebook engagement with proper line breaks and strategic emojis.

VARIATION STRUCTURES (Generate exactly ${countNum} distinct variations):
- Variation 1 (Narrative / Bold Hook): Start with a compelling real-world scenario, counter-intuitive insight, or strong story hook.
- Variation 2 (Actionable Listicle / Insights): Use numbered points (1., 2., 3.) with tangible, high-value advice.
- Variation 3 (Question / Community CTA): Open with a thought-provoking question, share a sharp perspective, and end with a clear conversation starter.`;

			const systemPrompt = `${baseSystemPrompt}\n\n${activeFormatModifier}\n\nReturn ONLY a valid JSON array of ${countNum} strings, formatted exactly like this: ["Variation 1...", "Variation 2...", "Variation 3..."] without markdown codeblocks or intro text.`;

			const candidateModels = Array.from(new Set([
				'meta-llama/llama-3.1-8b-instruct',
				'openrouter/free',
				'meta-llama/llama-3.3-70b-instruct',
				'qwen/qwen-2.5-72b-instruct',
				'google/gemma-2-9b-it',
				openRouterModel,
			]));

			for (const modelToTry of candidateModels) {
				try {
					const controller = new AbortController();
					const timeoutId = setTimeout(() => controller.abort(), 6000);

					const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${openRouterApiKey}`,
							'HTTP-Referer': 'https://brandcontentstudio.local',
							'X-Title': 'Brand Content Studio',
							'Content-Type': 'application/json',
						},
						signal: controller.signal,
						body: JSON.stringify({
							model: modelToTry,
							messages: [
								{ role: 'system', content: systemPrompt },
								{ role: 'user', content: `Topic: ${cleanTopic}` },
							],
							temperature: 0.7,
							max_tokens: 1000,
						}),
					});
					clearTimeout(timeoutId);

					if (openRouterRes.ok) {
						const data = await openRouterRes.json();
						let rawContent = data.choices?.[0]?.message?.content?.trim() || '';
						
						// Strip reasoning/thinking tags that some models output
						rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

						// Extract JSON array from square brackets with robust multiline string handling
						let parsed: string[] = [];
						const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
						if (jsonMatch) {
							const targetStr = jsonMatch[0];
							try {
								parsed = JSON.parse(targetStr);
							} catch (e1) {
								try {
									// Escape raw unescaped line breaks inside double-quoted JSON strings
									const sanitized = targetStr.replace(/"((?:[^"\\]|\\.)*)"/g, (_: string, p1: string) => {
										const cleaned = p1.replace(/\n/g, '\\n').replace(/\r/g, '').replace(/\t/g, '\\t');
										return `"${cleaned}"`;
									});
									parsed = JSON.parse(sanitized);
								} catch (e2) {
									// Regex fallback for double-quoted string array elements
									const stringMatches = Array.from(targetStr.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g));
									if (stringMatches.length >= 2) {
										parsed = stringMatches
											.map((m: any) => String(m[1] || '').replace(/\\n/g, '\n').replace(/\\"/g, '"').trim())
											.filter((s: string) => s.length > 15);
									}
								}
							}
						}

						// Fallback plain text splitting if JSON parsing didn't produce an array
						if (!Array.isArray(parsed) || parsed.length === 0) {
							const textBlocks = rawContent
								.split(/(?:Variation \d+|Option \d+|\d+\.\s*Option|\n\n---\n\n)/i)
								.map((s: string) => s.replace(/^(?:\d+[\.\)]|Variation \d+:?|Option \d+:?)\s*/i, '').trim())
								.filter((s: string) => s.length > 25);
							if (textBlocks.length > 0) {
								parsed = textBlocks;
							}
						}

						// Filter out prompt leakage text
						const isSystemLeakage = (str: string) =>
							/JSON array|banned phrases|no markdown|Format output|STRICT CLICHÉ|VARIATION STRUCTURES/i.test(str);

						if (Array.isArray(parsed) && parsed.length > 0) {
							const validVars = parsed.filter(
								(v) => typeof v === 'string' && v.trim().length > 15 && !isSystemLeakage(v)
							);
							if (validVars.length > 0) {
								while (validVars.length < countNum) {
									validVars.push(`${validVars[0]}\n\n👉 Learn more with ${companyName}!`);
								}
								const llmVars = validVars.slice(0, countNum);
								const modelDisplayName = modelToTry.split('/')[1] || modelToTry;
								return NextResponse.json({
									generationMode: 'llm',
									modelName: modelDisplayName,
									textData: { caption: llmVars[0], hashtags: dynamicHashtags },
									variations: llmVars,
									generatedText: llmVars[0],
								});
							}
						}
					} else {
						const errText = await openRouterRes.text();
						console.warn(`OpenRouter model ${modelToTry} returned ${openRouterRes.status}:`, errText.slice(0, 150));
					}
				} catch (err) {
					console.warn(`Fetch error for ${modelToTry}:`, err);
				}
			}
		}

		// 2. Smart Domain & Topic Copy Engine (Offline / Fallback)
		const toneString = tone && tone !== 'Auto' ? `[${tone} Tone] ` : '';
		const goalCTA = goal === 'Drive traffic' 
			? `👉 Visit our website link to learn more!` 
			: goal === 'Get follows' 
			? `🔔 Follow ${companyName} for more exclusive updates!` 
			: goal === 'Promote an offer' 
			? `🎉 Special offer on ${cleanTopic}! Contact ${companyName} today to claim.` 
			: `What are your thoughts on this? Drop a comment below! 👇`;

		const formatLabel = format === 'video' ? 'Video' : format === 'reel' ? 'Reel' : format === 'photo' ? 'Photo Post' : format === 'carousel' ? 'Carousel' : 'Post';

		const generatedVars = generateDomainSpecificTakeaways(cleanTopic, companyName, toneString, goalCTA, dynamicHashtags, formatLabel);

		if (isTextFormat) {
			return NextResponse.json({
				generationMode: 'offline_fallback',
				modelName: 'Offline Demo Generator',
				textData: { caption: generatedVars[0], hashtags: dynamicHashtags },
				variations: generatedVars,
				generatedText: generatedVars[0],
			});
		}

		if (isReelFormat) {
			return NextResponse.json({
				generationMode: 'offline_fallback',
				modelName: 'Offline Demo Generator',
				reelData: {
					hook: `${cleanTopic} with ${companyName} ⚡`,
					caption: generatedVars[0],
					hashtags: dynamicHashtags,
					onScreenText: [
						`${cleanTopic} - ${companyName}`,
						`3 key insights you need to know today`,
						`Comment below or visit our site to learn more!`,
					],
				},
				variations: generatedVars,
				generatedText: generatedVars[0],
			});
		}

		return NextResponse.json({
			generationMode: 'offline_fallback',
			modelName: 'Offline Demo Generator',
			variations: generatedVars,
			generatedText: generatedVars[0],
		});
	} catch (error) {
		console.error('Error generating content:', error);
		return NextResponse.json({ error: 'Failed to generate content.' }, { status: 500 });
	}
}
