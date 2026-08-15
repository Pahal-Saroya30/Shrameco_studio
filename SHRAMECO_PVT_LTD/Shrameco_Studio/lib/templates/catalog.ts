export interface TemplateVariant {
	id: string;
	name: string;
	description: string;
	iconName: string;
}

export interface TemplateCategory {
	id: 'announcement' | 'quote-card' | 'metric-stat' | 'tip-list' | 'event-countdown' | 'hiring';
	name: string;
	description: string;
	iconName: string;
	variants: TemplateVariant[];
}

export const TEMPLATE_CATALOG: TemplateCategory[] = [
	{
		id: 'announcement',
		name: 'Announcement',
		description: 'Product releases, feature updates, and company news',
		iconName: 'Megaphone',
		variants: [
			{ id: 'glass', name: 'Bold Header', description: 'Large bold headline layout', iconName: 'Sparkles' },
			{ id: 'editorial', name: 'Minimal', description: 'Clean headline with side rule', iconName: 'Layout' },
		],
	},
	{
		id: 'quote-card',
		name: 'Quote Card',
		description: 'Customer reviews, founder quotes, and thought leadership',
		iconName: 'Quote',
		variants: [
			{ id: 'glass', name: 'Classic Quote', description: 'Quotation mark with author name', iconName: 'Sparkles' },
			{ id: 'split', name: 'Color Bar', description: 'Left color bar quote layout', iconName: 'Split' },
			{ id: 'typography', name: 'Bold Text', description: 'All-caps bold quote display', iconName: 'MessageSquareQuote' },
		],
	},
	{
		id: 'metric-stat',
		name: 'Metric Stat',
		description: 'Growth numbers, achievements, and milestone stats',
		iconName: 'TrendingUp',
		variants: [
			{ id: 'saas', name: 'Light Theme', description: 'Clean light card layout', iconName: 'TrendingUp' },
			{ id: 'cyber', name: 'Dark Theme', description: 'High-contrast dark card layout', iconName: 'Zap' },
		],
	},
	{
		id: 'tip-list',
		name: 'Tip List',
		description: 'Actionable takeaways, carousels, and bullet points',
		iconName: 'Lightbulb',
		variants: [
			{ id: 'numbered', name: 'Simple List', description: 'Clean numbered list items', iconName: 'ListOrdered' },
			{ id: 'cyber', name: 'Card Steps', description: 'Numbered step boxes layout', iconName: 'CheckCircle2' },
		],
	},
	{
		id: 'event-countdown',
		name: 'Event Launch',
		description: 'Webinars, live launches, and countdowns',
		iconName: 'Calendar',
		variants: [
			{ id: 'ticket', name: 'Full Pass', description: 'Full event details with action button', iconName: 'Ticket' },
			{ id: 'calendar', name: 'Compact Date', description: 'Highlighted date badge layout', iconName: 'Calendar' },
		],
	},
	{
		id: 'hiring',
		name: "We're Hiring",
		description: 'Open roles, career opportunities, and recruitment',
		iconName: 'Briefcase',
		variants: [
			{ id: 'badge', name: 'Job Badge', description: 'Clean role tags with key perks', iconName: 'Briefcase' },
			{ id: 'split', name: 'Grid Table', description: '4-cell structured job breakdown', iconName: 'Split' },
		],
	},
];
