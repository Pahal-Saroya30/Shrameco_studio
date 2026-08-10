import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { prompt, style } = await req.json();
		if (!prompt || !prompt.trim()) {
			return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
		}

		const formattedPrompt = style ? `${style} style: ${prompt}` : prompt;

		// 1. OpenAI DALL-E 3 (If OPENAI_API_KEY is configured)
		const openAiApiKey = process.env.OPENAI_API_KEY;
		if (openAiApiKey && !openAiApiKey.includes('mock')) {
			try {
				const openAiRes = await fetch('https://api.openai.com/v1/images/generations', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${openAiApiKey}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						model: 'dall-e-3',
						prompt: formattedPrompt.slice(0, 1000),
						n: 1,
						size: '1024x1024',
					}),
				});

				if (openAiRes.ok) {
					const data = await openAiRes.json();
					const url = data.data?.[0]?.url;
					if (url) {
						return NextResponse.json({
							imageUrl: url,
							provider: 'OpenAI (DALL-E 3)',
						});
					}
				}
			} catch (openAiErr) {
				console.warn('OpenAI DALL-E 3 failed; falling back to Pollinations.', openAiErr);
			}
		}

		// 2. Cloudflare Workers AI (If CLOUDFLARE_API_TOKEN is configured)
		const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
		const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;

		if (cfAccountId && cfApiToken) {
			try {
				const model = '@cf/bytedance/stable-diffusion-xl-lightning';
				const cfRes = await fetch(
					`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${model}`,
					{
						method: 'POST',
						headers: {
							Authorization: `Bearer ${cfApiToken}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ prompt: formattedPrompt }),
					}
				);

				if (cfRes.ok) {
					const arrayBuffer = await cfRes.arrayBuffer();
					const base64 = Buffer.from(arrayBuffer).toString('base64');
					const contentType = cfRes.headers.get('content-type') || 'image/png';
					return NextResponse.json({
						imageUrl: `data:${contentType};base64,${base64}`,
						provider: 'Cloudflare (SDXL-Lightning)',
					});
				}
			} catch (cfErr) {
				console.warn('Cloudflare Workers AI failed; falling back to Pollinations.', cfErr);
			}
		}

		// 3. Pollinations AI (Default Free Generator - Dynamic seed for different images per prompt)
		const dynamicSeed = Math.floor(Math.random() * 1000000);
		try {
			const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(formattedPrompt.slice(0, 500))}?width=1080&height=1080&nologo=true&seed=${dynamicSeed}`;
			const pollinationsRes = await fetch(pollinationsUrl);
			if (pollinationsRes.ok && pollinationsRes.headers.get('content-type')?.startsWith('image')) {
				const arrayBuffer = await pollinationsRes.arrayBuffer();
				const base64 = Buffer.from(arrayBuffer).toString('base64');
				const contentType = pollinationsRes.headers.get('content-type') || 'image/jpeg';
				return NextResponse.json({
					imageUrl: `data:${contentType};base64,${base64}`,
					provider: 'Pollinations AI (Free)',
				});
			}
		} catch (pollErr) {
			console.warn('Pollinations image generation failed; falling back to demo mode.', pollErr);
		}

		// 4. Demo Mode Fallback (If network or API fails)
		return NextResponse.json({
			imageUrl: `https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=1080&auto=format&fit=crop`,
			provider: 'Demo Mode (Fallback Image)',
			isDemo: true,
		});
	} catch (error) {
		console.error('Image generation error:', error);
		return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
	}
}
