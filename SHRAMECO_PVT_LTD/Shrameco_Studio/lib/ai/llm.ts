// Shared OpenRouter LLM helper (used by AI generation, carousel, and assist routes)

export interface OpenRouterCallOptions {
	systemPrompt: string;
	userContent: string;
	temperature?: number;
	maxTokens?: number;
	jsonMode?: boolean;
}

export function getOpenRouterConfig() {
	return {
		apiKey: process.env.OPENROUTER_API_KEY || '',
		model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct',
	};
}

export function cleanLlmResponse(content: string): string {
	return content.replace(/```json\n?|\n?```/g, '').trim();
}

export function hasOpenRouterKey(): boolean {
	const { apiKey } = getOpenRouterConfig();
	return Boolean(apiKey) && !apiKey.includes('mock-openrouter-key');
}

// Calls OpenRouter; returns cleaned text or null on failure/no key.
export async function callOpenRouter({
	systemPrompt,
	userContent,
	temperature = 0.7,
	maxTokens = 1000,
	jsonMode = false,
}: OpenRouterCallOptions): Promise<string | null> {
	if (!hasOpenRouterKey()) return null;
	const { apiKey, model } = getOpenRouterConfig();

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 50000);

	try {
		const body: Record<string, unknown> = {
			model,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userContent },
			],
			temperature,
			max_tokens: maxTokens,
		};
		if (jsonMode) body.response_format = { type: 'json_object' };

		const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'HTTP-Referer': 'https://brandcontentstudio.local',
				'X-Title': 'Brand Content Studio',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
			signal: controller.signal,
		});
		clearTimeout(timeout);

		if (!res.ok) {
			console.warn('OpenRouter call failed:', res.status);
			return null;
		}

		const data = await res.json();
		const rawContent = data.choices?.[0]?.message?.content?.trim() || '';
		if (!rawContent) return null;
		return cleanLlmResponse(rawContent);
	} catch (err) {
		clearTimeout(timeout);
		console.warn('OpenRouter fetch failed:', err);
		return null;
	}
}
