import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

const NICHE_FEEDS: Record<string, string> = {
	tech: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
	finance: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
	science: 'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
};

function cleanCDATA(str: string): string {
	if (!str) return '';
	return str
		.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
		.replace(/<\/?[^>]+(>|$)/g, '') // strip HTML tags
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/\s+/g, ' ')
		.trim();
}

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		const niche = body?.niche || 'tech';
		const customUrl = body?.customUrl || '';

		let feedUrl = NICHE_FEEDS[niche];
		if (niche === 'custom') {
			if (!customUrl.startsWith('http')) {
				return NextResponse.json({ error: 'Invalid custom RSS URL.' }, { status: 400 });
			}
			feedUrl = customUrl;
		}

		if (!feedUrl) {
			return NextResponse.json({ error: 'Selected feed is invalid or unsupported.' }, { status: 400 });
		}

		// 1. Fetch RSS XML content
		const xmlRes = await fetch(feedUrl, {
			headers: { 'User-Agent': 'Shrameco Auto Studio RSS Fetcher' },
			cache: 'no-store',
		});
		if (!xmlRes.ok) {
			throw new Error(`Failed to fetch RSS feed, status: ${xmlRes.status}`);
		}
		const xmlText = await xmlRes.text();

		// 2. Parse top 10 articles using zero-dependency regex
		const itemRegex = /<item>([\s\S]*?)<\/item>/g;
		const titleRegex = /<title>([\s\S]*?)<\/title>/;
		const descriptionRegex = /<description>([\s\S]*?)<\/description>/;

		const articles: Array<{ title: string; description: string }> = [];
		let match;
		let count = 0;

		while ((match = itemRegex.exec(xmlText)) !== null && count < 10) {
			const itemContent = match[1];
			const titleMatch = itemContent.match(titleRegex);
			const descMatch = itemContent.match(descriptionRegex);

			if (titleMatch) {
				articles.push({
					title: cleanCDATA(titleMatch[1]),
					description: descMatch ? cleanCDATA(descMatch[1]) : '',
				});
				count++;
			}
		}

		if (articles.length === 0) {
			return NextResponse.json({ error: 'No articles found in this RSS feed.' }, { status: 400 });
		}

		// 3. Query OpenRouter to identify and analyze trending content
		const apiKey = process.env.OPENROUTER_API_KEY || '';
		let model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';
		if (!model || model === 'openrouter/free' || model === 'openrouter/auto') {
			model = 'google/gemini-2.5-flash';
		}

		if (!apiKey) {
			return NextResponse.json({ error: 'OpenRouter API Key is not configured.' }, { status: 500 });
		}

		const prompt = `You are an elite YouTube Shorts growth specialist.
Here are the top trending headlines from today's niche feed:
${articles.map((art, idx) => `${idx + 1}. TITLE: ${art.title}\n   SUMMARY: ${art.description}`).join('\n\n')}

Analyze these headlines, select the ONE with the highest viral potential for a YouTube Shorts audience, and write content for it.

You MUST reply ONLY with a valid JSON object matching this exact structure:
{
  "trendTitle": "The original headline title text",
  "explanation": "1-sentence explanation of why this topic is trending and has high viral potential",
  "videoTitle": "An SEO-optimized YouTube video title",
  "videoDescription": "An SEO-optimized description with hashtags",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "28",
  "script": [
    "Slide 1 hook statement (max 10 words)",
    "Slide 2 value point statement (max 10 words)",
    "Slide 3 outro call-to-action (max 10 words)"
  ]
}

Do not include any markdown backticks (\`\`\`) or explanations outside the JSON object. Just return the raw JSON object string.`;

		const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model,
				messages: [{ role: 'user', content: prompt }],
				max_tokens: 1000,
			}),
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`OpenRouter API call failed (${response.status}): ${errText}`);
		}

		const responseData = await response.json();
		const contentText = responseData.choices?.[0]?.message?.content || '';

		let parsedJson: any = null;
		try {
			const firstBrace = contentText.indexOf('{');
			const lastBrace = contentText.lastIndexOf('}');
			if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
				const jsonString = contentText.substring(firstBrace, lastBrace + 1);
				parsedJson = JSON.parse(jsonString);
			} else {
				parsedJson = JSON.parse(contentText.trim());
			}
		} catch (parseErr: any) {
			console.error('Failed to parse OpenRouter response as JSON:', contentText);
			throw new Error(`JSON parsing failed: ${parseErr.message || 'unknown error'}`);
		}

		return NextResponse.json({
			ok: true,
			trend: parsedJson,
		});
	} catch (error: any) {
		console.error('Error in trends api route:', error);
		return NextResponse.json({ error: error.message || 'Failed to fetch trends.' }, { status: 500 });
	}
}
