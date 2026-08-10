import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		let targetUrl = searchParams.get('url')?.trim();

		if (!targetUrl) {
			return NextResponse.json({ error: 'URL query parameter is required.' }, { status: 400 });
		}

		if (!/^https?:\/\//i.test(targetUrl)) {
			targetUrl = 'https://' + targetUrl;
		}

		let parsedUrl: URL;
		try {
			parsedUrl = new URL(targetUrl);
		} catch (e) {
			return NextResponse.json({ error: 'Invalid URL format.' }, { status: 400 });
		}

		const domain = parsedUrl.hostname.replace(/^www\./i, '');

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 4000);

			const fetchRes = await fetch(parsedUrl.toString(), {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				},
				signal: controller.signal,
			});
			clearTimeout(timeoutId);

			if (fetchRes.ok) {
				const html = await fetchRes.text();

				const getMetaTag = (property: string) => {
					const regex = new RegExp(`<meta\\s+[^>]*?(?:property|name)=["']${property}["']\\s+[^>]*?content=["']([^"']+)["']`, 'i');
					const match = html.match(regex);
					if (match) return match[1];
					const reverseRegex = new RegExp(`<meta\\s+[^>]*?content=["']([^"']+)["']\\s+[^>]*?(?:property|name)=["']${property}["']`, 'i');
					const reverseMatch = html.match(reverseRegex);
					return reverseMatch ? reverseMatch[1] : null;
				};

				const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
				const pageTitle = titleMatch ? titleMatch[1].trim() : null;

				const ogTitle = getMetaTag('og:title') || getMetaTag('twitter:title') || pageTitle || domain;
				let rawOgImage = getMetaTag('og:image') || getMetaTag('og:image:secure_url') || getMetaTag('twitter:image') || getMetaTag('twitter:image:src');

				let finalOgImage: string | null = null;
				if (rawOgImage) {
					try {
						finalOgImage = new URL(rawOgImage, parsedUrl.origin).toString();
					} catch (e) {
						finalOgImage = rawOgImage;
					}
				}

				const ogSiteName = getMetaTag('og:site_name') || domain;

				return NextResponse.json({
					title: ogTitle,
					image: finalOgImage,
					domain: ogSiteName || domain,
					url: parsedUrl.toString(),
				});
			}
		} catch (fetchErr) {
			console.warn('Failed to scrape OG metadata for', targetUrl, fetchErr);
		}

		// Clean Fallback when scraping fails or times out
		return NextResponse.json({
			title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} - Official Website`,
			image: null,
			domain: domain.toUpperCase(),
			url: parsedUrl.toString(),
		});
	} catch (err: any) {
		console.error('OG metadata route error:', err);
		return NextResponse.json({ error: 'Failed to extract Open Graph metadata' }, { status: 500 });
	}
}
