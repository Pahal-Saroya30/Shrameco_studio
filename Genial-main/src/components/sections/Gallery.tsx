'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../../lib/utils';

const images = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&q=80&w=800",
];

export const Gallery = () => {
  return (
    <section id="gallery" className="py-32 md:py-40 bg-forest text-white overflow-hidden">
      <div className="container mx-auto px-6 md:px-16 lg:px-20 mb-20 max-w-[1400px]">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10"
        >
          <div className="max-w-xl">
            <p className="font-serif italic text-white/60 text-sm md:text-base mb-5">Residences</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light tracking-tight leading-[1.1] mb-6">
              Stillness in <span className="italic font-normal">every frame.</span>
            </h2>
            <p className="text-soft/65 font-light text-base md:text-lg leading-relaxed max-w-md">
              A quiet tour of form, light, and land—nothing louder than the view.
            </p>
          </div>
        </motion.div>
      </div>

      <div className="flex gap-8 md:gap-10 px-6 md:px-16 lg:px-20 overflow-x-auto pb-16 snap-x snap-mandatory hide-scrollbar">
        {images.map((src, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="min-w-[82vw] md:min-w-[38vw] aspect-[4/3] rounded-2xl overflow-hidden snap-center relative group cursor-pointer"
          >
            <div className="absolute inset-0 bg-black/15 group-hover:bg-transparent transition-colors duration-[800ms] z-10" />
            <img 
              src={src} 
              alt={`Gallery ${idx + 1}`} 
              className="w-full h-full object-cover transform group-hover:scale-[1.02] transition-transform duration-[900ms] ease-out"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
};
