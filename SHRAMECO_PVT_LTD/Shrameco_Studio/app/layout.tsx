import type { Metadata } from 'next';
import { Inter, Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-sans',
	display: 'swap',
});

const outfit = Outfit({
	subsets: ['latin'],
	variable: '--font-display',
	display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
	subsets: ['latin'],
	variable: '--font-plus-jakarta',
	display: 'swap',
});

export const metadata: Metadata = {
	title: 'Brand Content Studio',
	description:
		'Brand-aware social media content studio powered by OpenRouter LLMs and client-side PNG rendering.',
	icons: {
		icon: '/icon.svg',
		shortcut: '/icon.svg',
		apple: '/icon.svg',
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${inter.variable} ${outfit.variable} ${plusJakartaSans.variable}`}>
			<head>
				<link rel="icon" href="/icon.svg" type="image/svg+xml" />
				<link rel="shortcut icon" href="/icon.svg" type="image/svg+xml" />
			</head>
			<body className="bg-[#EFF6F7] text-[#1E293B] antialiased min-h-screen selection:bg-[#3D8090]/20 selection:text-[#2D5F68]">
				{children}
			</body>
		</html>
	);
}

