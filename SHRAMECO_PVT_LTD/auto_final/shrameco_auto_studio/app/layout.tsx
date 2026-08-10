import type { Metadata } from 'next';
import './globals.css';

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
		<html lang="en">
			<head>
				<link rel="icon" href="/icon.svg" type="image/svg+xml" />
				<link rel="shortcut icon" href="/icon.svg" type="image/svg+xml" />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body className="bg-[#EFF6F7] text-[#1E293B] antialiased min-h-screen selection:bg-[#3D8090]/20 selection:text-[#2D5F68]">
				{children}
			</body>
		</html>
	);
}
