'use client';

import { useEffect } from 'react';
import ScrollExpandMedia from '../blocks/scroll-expansion-hero';

const HeroContent = () => (
  <div className='max-w-4xl mx-auto text-center'>
    <h2 className='text-3xl md:text-4xl font-semibold mb-6 text-stone-900 tracking-tight'>
      Where Luxury Meets Nature
    </h2>
    <p className='text-lg md:text-xl mb-8 text-stone-600 leading-relaxed max-w-2xl mx-auto'>
      Genial Residences offers an unparalleled living experience — where
      architectural brilliance, curated amenities, and breathtaking landscapes
      converge into a single, harmonious sanctuary.
    </p>
    <p className='text-base text-stone-500 leading-relaxed max-w-xl mx-auto'>
      Each villa is a masterclass in refined living, designed to deliver
      serenity, privacy, and effortless elegance in every detail.
    </p>
  </div>
);

export const Hero = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section>
      <ScrollExpandMedia
        mediaType='video'
        mediaSrc='/videos/genial-hero.mp4'
        posterSrc='/images/hero-poster.png'
        bgGradient='linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 25%, #ffffff 50%, #f5f5dc 75%, #fffde7 100%)'
        title='Harmony in every Horizon'
        scrollToExpand='Scroll to explore'
        textBlend
      >
        <HeroContent />
      </ScrollExpandMedia>
    </section>
  );
};
