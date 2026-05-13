'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, animate } from 'framer-motion';
import { staggerContainer, fadeUp } from '../../lib/utils';
import Image from 'next/image';

const stats = [
  { value: '10', label: 'Exclusive Estates', desc: 'A rare and intimate community nestled in nature.', image: '/images/stat-estate.png' },
  { value: '24/7', label: 'Personal Concierge', desc: 'Uncompromised, bespoke service at any hour.', image: '/images/stat-concierge.png' },
  { value: '1.5', label: 'Acre Sanctuaries', desc: 'Expansive, uninterrupted private outdoor spaces.', image: '/images/stat-sanctuary.png' },
  { value: '100%', label: 'Net Zero Energy', desc: 'Fully sustainable, elegantly solar-powered living.', image: '/images/stat-energy.png' },
];

const AnimatedNumber = ({ value }: { value: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const match = value.match(/([\d.]+)(.*)/);
  const targetNumber = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : '';
  const isFloat = value.includes('.');

  const motionValue = useMotionValue(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, targetNumber, {
        duration: 2,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [isInView, targetNumber, motionValue]);

  useEffect(() => {
    const unsubscribe = motionValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = isFloat 
          ? latest.toFixed(1) + suffix 
          : Math.floor(latest) + suffix;
      }
    });
    return () => unsubscribe();
  }, [motionValue, suffix, isFloat]);

  return <span ref={ref}>0{suffix}</span>;
};

const StatCard = ({ stat }: { stat: (typeof stats)[0] }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      variants={fadeUp}
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden group border border-white/5 bg-forest p-10 md:p-14 cursor-default transition-all duration-700 hover:border-white/20 flex flex-col justify-between"
      style={{ minHeight: '400px' }}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={stat.image} 
          alt={stat.label} 
          fill 
          className="object-cover opacity-30 group-hover:opacity-60 group-hover:scale-[1.03] transition-all duration-[1100ms] ease-out" 
        />
        {/* Dark Vignette Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 group-hover:from-black/80 transition-colors duration-700" />
      </div>

      {/* Dynamic Mouse Spotlight */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10 mix-blend-screen"
        style={{
          background: `radial-gradient(circle 250px at ${mousePosition.x}px ${mousePosition.y}px, rgba(165, 214, 167, 0.25), transparent 80%)`
        }}
      />

      <div className="relative z-20">
        <h3 className="text-7xl md:text-8xl font-light font-serif italic text-white mb-6 group-hover:translate-x-0.5 transition-transform duration-[900ms] ease-out drop-shadow-2xl">
          <AnimatedNumber value={stat.value} />
        </h3>
      </div>

      <div className="relative z-20 mt-auto">
        <p className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-white/70 mb-3 group-hover:text-white transition-colors duration-500 drop-shadow-md">
          {stat.label}
        </p>
        <p className="text-white/50 text-sm font-light leading-relaxed max-w-[200px] group-hover:text-white/90 transition-colors duration-500 drop-shadow-md">
          {stat.desc}
        </p>
      </div>
    </motion.div>
  );
};

export const Stats = () => {
  return (
    <section className="py-0 bg-forest relative border-t border-white/5">
      <div className="w-full">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10"
        >
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
