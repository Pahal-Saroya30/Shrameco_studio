'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { fadeUp } from '../../lib/utils';

const faqs = [
  { q: "What sustainability measures are in place?", a: "Genial estates are 100% solar-powered, utilize rainwater harvesting, and are built with locally sourced, sustainable materials to ensure a zero-carbon footprint." },
  { q: "Can I customize the floor plan?", a: "Yes, early buyers have the opportunity to work with our lead architects to customize interior layouts and finishes to their exact specifications." },
  { q: "What is the timeline for completion?", a: "Phase 1 is scheduled for completion in Q4 2026. Private viewings of the model villa are currently available." },
  { q: "Is property management provided?", a: "We offer comprehensive, white-glove property management services, ensuring your estate is impeccably maintained year-round." },
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-32 md:py-44 bg-pure">
      <div className="container mx-auto px-6 md:px-16 max-w-3xl">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-20"
        >
          <p className="font-serif italic text-forest/50 text-sm mb-6">Clarity</p>
          <h2 className="text-4xl md:text-5xl font-serif font-light text-forest tracking-tight leading-[1.15]">
            Questions, <span className="italic font-normal">answered with calm.</span>
          </h2>
        </motion.div>

        <div className="space-y-6">
          {faqs.map((faq, idx) => (
            <motion.div 
              key={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="border border-sage/25 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-soft transition-[box-shadow] duration-500"
            >
              <button 
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-8 py-7 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="font-serif text-lg md:text-xl font-normal text-forest/90 pr-6 leading-snug">{faq.q}</span>
                {openIndex === idx ? (
                  <Minus className="text-primary flex-shrink-0" size={20} />
                ) : (
                  <Plus className="text-forest/50 flex-shrink-0" size={20} />
                )}
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="px-8 pb-6 text-forest/70 font-light leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
