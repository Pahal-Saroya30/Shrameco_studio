'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';

const links = [
  { name: 'Overview', href: '#overview' },
  { name: 'Amenities', href: '#amenities' },
  { name: 'Gallery', href: '#gallery' },
  { name: 'Location', href: '#location' },
];

// Section order for progress tracking
const sectionOrder = ['overview', 'amenities', 'gallery', 'faq', 'contact'];

// Get current section based on scroll position
const getCurrentSection = () => {
  const scrollY = window.scrollY;
  const sections = sectionOrder.map(id => document.getElementById(id));
  
  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i];
    if (section) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= scrollY + 100 && rect.bottom >= scrollY + 100) {
        return sectionOrder[i];
      }
    }
  }
  return 'overview';
};

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setCurrentSection(getCurrentSection());
    };
    
    handleScroll(); // Initial check
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 md:px-8"
    >
      <div
        className={`w-full max-w-5xl transition-all duration-500 flex items-center justify-between px-6 md:px-8 py-3.5 rounded-full border backdrop-blur-xl shadow-lg ${
          isScrolled 
            ? 'bg-forest/95 border-forest/20 shadow-xl' 
            : 'bg-forest/80 border-forest/30 shadow-xl'
        }`}
      >
        <a href="#" className="flex flex-col relative">
          {/* Progress Indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3">
            <div className="w-full h-full rounded-full bg-primary/20 animate-pulse" />
          </div>
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`font-serif italic text-2xl md:text-[1.85rem] font-normal tracking-[0.02em] transition-colors duration-500 ${
              currentSection === 'overview' 
                ? 'text-primary' 
                : 'text-white'
            }`}
            Genial
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-12">
          {links.map((link) => {
            const isActive = currentSection === link.href.replace('#', '');
            return (
              <a
                key={link.name}
                href={link.href}
                className={`text-[13px] font-normal tracking-[0.12em] transition-all duration-300 relative group ${
                  'text-white/90 hover:text-white'
                }`}
              >
                {link.name}
                {/* Active Section Indicator */}
                {isActive && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute -bottom-1 left-1/2 h-[2px] bg-primary"
                  />
                )}
                <motion.span 
                  initial={{ width: 0 }}
                  animate={{ width: isActive ? '100%' : '0%' }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute -bottom-1 left-1/2 h-[2px] bg-primary"
                />
              </a>
            );
          })}
        </nav>

        
        {/* Mobile Toggle */}
        <button
          className={`md:hidden p-2 rounded-full transition-colors ${
            isScrolled ? 'text-forest hover:bg-mint/50' : 'text-white hover:bg-white/20'
          }`}
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-forest/20 backdrop-blur-sm md:hidden z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-20 left-4 right-4 p-6 rounded-3xl bg-soft border border-white shadow-2xl backdrop-blur-2xl z-50 overflow-hidden md:hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex justify-between items-center mb-8 relative z-10">
                <span className="font-serif italic text-2xl font-normal tracking-wide text-forest">
                  Genial
                </span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 bg-white rounded-full text-forest hover:bg-mint transition-colors shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-2 relative z-10">
                {links.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xl font-bold text-forest hover:text-primary transition-colors py-3 px-4 rounded-xl hover:bg-white/60 flex items-center justify-between group"
                  >
                    {link.name}
                    <span className="opacity-0 group-hover:opacity-100 transition-all text-primary transform -translate-x-2 group-hover:translate-x-0 duration-300">
                      →
                    </span>
                  </a>
                ))}
                <div className="mt-6 pt-6 border-t border-forest/10">
                  <Button
                    className="w-full rounded-2xl py-6 bg-forest text-white hover:bg-primary transition-colors text-lg font-bold shadow-soft hover:shadow-lg"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      document.getElementById('contact')?.scrollIntoView();
                    }}
                  >
                    Get In Touch
                  </Button>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
};