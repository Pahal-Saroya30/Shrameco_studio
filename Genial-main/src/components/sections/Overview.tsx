'use client';

import Image from 'next/image';
import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../../lib/utils';

const chapters = [
  {
    src: '/images/sanctuary.jpeg',
    title: 'The Sanctuary',
    tagline: 'Lightness at the canopy line',
    line: 'Main residence framed by teak and borrowed views of Ghats.',
    volume: '01',
  },
  {
    src: '/images/retreat.jpg',
    title: 'The Retreat',
    tagline: 'Stillness carved in cedar',
    line: 'Guest wing with linen-quiet rooms and terraces that inhale fog.',
    volume: '02',
  },
  {
    src: '/images/oasis.jpg',
    title: 'The Oasis',
    tagline: 'Water holding dusk',
    line: 'Court pool mirrored to sky—your private temperate garden.',
    volume: '03',
  },
];

export const Overview = () => {

  return (
    <section id="overview" className="bg-[#F9FBF9] relative overflow-hidden">
      <div className="absolute top-0 left-10 text-[35rem] font-serif italic font-light text-forest/[0.025] select-none pointer-events-none leading-none">
        Genial
      </div>

      <div className="container mx-auto px-6 md:px-16 lg:px-20 relative z-10 max-w-[1600px] py-24 md:py-32">
        {/* ── Grid Layout for Perfect Symmetry ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* ── Text & Metrics Column ─────────────────────────────────────── */}
          <div className="flex flex-col">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
              className="text-forest flex flex-col justify-center"
            >
              <motion.div variants={fadeUp} className="flex items-center gap-5 mb-10">
                <div className="w-16 h-px bg-forest/25" />
                <span className="text-[10px] uppercase tracking-[0.35em] text-forest/45 font-normal">The Vision</span>
              </motion.div>

              <motion.h2
                variants={fadeUp}
                className="text-5xl md:text-6xl font-serif font-light leading-[1.06] tracking-tight mb-10"
              >
                Architecture that <br />
                <span className="italic font-normal text-forest/85">listens to nature.</span>
              </motion.h2>

              <motion.div variants={fadeUp} className="pl-8 border-l border-forest/15 mb-12">
                <p className="text-lg font-light text-forest/65 max-w-lg leading-[1.75]">
                  We don&apos;t just build homes; we craft sanctuaries. By dissolving the boundaries between living space and the ancient greenery of the Western Ghats, we offer an immersive escape where silence is the ultimate luxury.
                </p>
              </motion.div>

              <motion.button
                variants={fadeUp}
                type="button"
                className="group flex items-center gap-5 hover:opacity-80 transition-opacity duration-500 w-fit mb-12"
                onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <div className="w-12 h-12 rounded-full border border-forest/20 flex items-center justify-center group-hover:bg-forest group-hover:text-white transition-all duration-500">
                  <span className="text-xl font-light leading-none mb-1">›</span>
                </div>
                <span className="text-xs uppercase tracking-[0.2em] text-forest/55">Discover our philosophy</span>
              </motion.button>
            </motion.div>

            {/* Estate Metrics */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
              className="pt-8 border-t border-forest/10"
            >
              <div className="flex flex-wrap items-start gap-x-12 gap-y-6">
                {[
                  { label: 'Total Area', value: '6 Acres' },
                  { label: 'Status', value: 'In Progress' },
                  { label: 'Villa Size', value: '1000 Sq.Ft' },
                  { label: 'Green', value: '85% Preserved' },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    variants={fadeUp}
                    className="group flex-row items-start"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                  >
                    <span className="text-[8px] uppercase tracking-[0.4em] text-forest/40 mb-2">
                      {item.label}
                    </span>
                    <p className="text-lg md:text-xl font-serif italic font-light text-forest leading-tight group-hover:text-forest/90 transition-colors duration-300">
                      {item.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Tactile Shuffle Card System ────────────────────────────────── */}
          <div className="flex flex-col items-center">
                        
            {/* Tactile Shuffle Container */}
            <motion.div 
              className="relative w-[400px] h-[520px] cursor-pointer"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              whileHover="hover"
              variants={{
                hidden: { opacity: 0 },
                visible: { 
                  opacity: 1,
                  transition: { delay: 0.3, duration: 0.8 }
                }
              }}
            >
              {chapters.map((chapter, index) => (
                <motion.div
                  key={chapter.title}
                  className="absolute w-full h-full"
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                    rotate: index === 0 ? -6 : index === 1 ? -3 : 0,
                    x: 0,
                    y: 0,
                    zIndex: chapters.length - index
                  }}
                  whileInView={{
                    opacity: 1,
                    scale: 1,
                    transition: {
                      duration: 0.8,
                      ease: [0.22, 1, 0.36, 1],
                      delay: index * 0.1
                    }
                  }}
                  variants={{
                    hidden: {
                      rotate: index === 0 ? -6 : index === 1 ? -3 : 0,
                      x: 0,
                      scale: 1
                    },
                    hover: {
                      rotate: index === 0 ? -15 : index === 1 ? 0 : 15,
                      x: index === 0 ? -100 : index === 1 ? 0 : 100,
                      scale: index === 0 ? 1.05 : index === 1 ? 1.02 : 1.05,
                      transition: { type: 'spring', stiffness: 200, damping: 20 }
                    }
                  }}
                  whileHover={{
                    scale: 1.08,
                    zIndex: 100,
                    transition: { type: 'spring', stiffness: 300, damping: 25 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  style={{ zIndex: chapters.length - index }}
                >
                  {/* Card with sharp 90-degree edges */}
                  <div className="relative w-full h-full overflow-hidden shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:shadow-black/20">
                    {/* High-fidelity architectural render */}
                    <Image
                      src={chapter.src}
                      alt={chapter.title}
                      fill
                      sizes="400px"
                      quality={95}
                      className="object-cover"
                    />
                    {/* Minimal gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    
                    {/* Card content positioned near edges */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] uppercase tracking-[0.4em] text-white/60 bg-black/30 backdrop-blur-sm rounded-sm px-2 py-1">
                          Volume {chapter.volume}
                        </span>
                        <span className="text-[9px] uppercase tracking-[0.3em] text-white/50 bg-black/20 backdrop-blur-sm rounded-sm px-2 py-1">
                          {chapter.title}
                        </span>
                      </div>
                      <h3 className="font-serif italic text-xl text-white/95 leading-tight mb-2">
                        {chapter.tagline}
                      </h3>
                      <p className="text-sm font-light text-white/75 leading-relaxed max-w-xs">
                        {chapter.line}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
