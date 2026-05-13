import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import { Navbar } from '../src/components/layout/Navbar';
import { Footer } from '../src/components/layout/Footer';
import './globals.css';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Genial | Luxury Eco-Villas',
  description:
    'Private eco-villas for discerning residents—spacious, quiet, and rooted in the Western Ghats.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${serif.variable} ${sans.variable}`}>
      <head>
        {/* Preload the Hero Poster for better Largest Contentful Paint (LCP) */}
        <link
          rel="preload"
          as="image"
          href="/images/hero-poster.png"
          fetchPriority="high"
        />
      </head>
      <body className="bg-pure text-forest font-sans antialiased selection:bg-primary/90 selection:text-white">
        <Navbar />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
