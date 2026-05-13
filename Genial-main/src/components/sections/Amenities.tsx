'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { fadeUp } from '../../lib/utils';
import { ArrowRight } from 'lucide-react';

const amenities = [
  { 
    id: '01', 
    title: 'The Infinity Edge', 
    desc: 'A heated outdoor sanctuary overlooking the mist-covered valleys.',
    image: '/images/amenity-pool.png' 
  },
  { 
    id: '02', 
    title: 'Wellness Sanctuary', 
    desc: 'Holistic spa therapies using indigenous natural botanicals.',
    image: '/images/amenity-spa.png' 
  },
  { 
    id: '03', 
    title: 'Private Gastronomy', 
    desc: 'In-villa dining curated by personal chefs under the forest canopy.',
    image: '/images/amenity-chef.png' 
  },
  { 
    id: '04', 
    title: 'Starlight Observatory', 
    desc: 'Uninterrupted views of the cosmos from your private viewing deck.',
    image: '/images/amenity-observatory.png' 
  },
  { 
    id: '05', 
    title: 'Security', 
    desc: '24/7 advanced security system with biometric access and professional monitoring.',
    image: '/images/gallery-2.png' 
  },
  { 
    id: '06', 
    title: 'Clubhouse', 
    desc: 'Exclusive community space with entertainment facilities and social events.',
    image: '/images/clubhouse.png' 
  },
];

export const Amenities = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number>(0);

  return (
    <section id="amenities" className="relative w-full min-h-[90vh] bg-black overflow-hidden flex items-center border-t border-white/5">
      
      {/* Background Images with Crossfade */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={hoveredIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.7, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Image 
              src={amenities[hoveredIndex].image} 
              alt={amenities[hoveredIndex].title}
              fill
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
        {/* Lighter Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/10 z-10 pointer-events-none" />
      </div>

      <div className="container relative z-20 mx-auto px-6 md:px-12 py-24 md:py-32">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">
          
          {/* Sticky Header */}
          <div className="lg:w-1/3 lg:sticky lg:top-32">
             <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-white text-[10px] md:text-xs tracking-[0.4em] font-bold uppercase mb-6 drop-shadow-md"
            >
              Curated Experiences
            </motion.p>
            <motion.h2 
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-5xl md:text-7xl font-serif font-light text-white mb-6 leading-[1.1] drop-shadow-xl"
            >
              Beyond <br /> <span className="italic text-[#8ba888]">expectations.</span>
            </motion.h2>
          </div>

          {/* Hover List */}
          <div className="lg:w-2/3 w-full flex flex-col">
             {amenities.map((item, index) => (
                <div 
                  key={item.id}
                  onMouseEnter={() => setHoveredIndex(index)}
                  className="group relative border-b border-white/10 py-10 md:py-14 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors duration-500"
                >
                  <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-12">
                     <span className="text-white/20 font-light text-xl md:text-2xl transition-colors duration-500 group-hover:text-[#8ba888]">
                       {item.id}
                     </span>
                     <div>
                       <h3 className="text-2xl md:text-4xl font-light text-white/50 group-hover:text-white transition-colors duration-500 mb-4 drop-shadow-md">
                         {item.title}
                       </h3>
                       <p className="text-white/40 text-sm md:text-base max-w-md font-light transition-colors duration-500 group-hover:text-white/90 drop-shadow-md">
                         {item.desc}
                       </p>
                     </div>
                  </div>
                  
                  {/* Arrow Icon */}
                  <div className="hidden md:flex w-16 h-16 rounded-full border border-white/10 items-center justify-center text-white/20 group-hover:text-white group-hover:border-white transition-all duration-500 -rotate-45 group-hover:rotate-0 shrink-0 bg-black/20 backdrop-blur-sm">
                     <ArrowRight strokeWidth={1} size={28} />
                  </div>
                </div>
             ))}
          </div>

        </div>
      </div>
    </section>
  );
};
