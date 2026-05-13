'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const links = [
  { name: 'Overview', href: '#overview' },
  { name: 'Amenities', href: '#amenities' },
  { name: 'Gallery', href: '#gallery' },
  { name: 'Contact', href: '#contact' },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      
      // Simple section detection
      const sections = ['overview', 'amenities', 'gallery', 'contact'];
      const scrollPosition = window.scrollY + 100;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setCurrentSection(section);
            break;
          }
        }
      }
    };
    
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-4 left-0 right-0 z-50 px-4 md:px-8 transition-all duration-300 ${isScrolled ? 'top-2' : 'top-4'}`}
      >
        <div
          className={`w-full max-w-6xl mx-auto flex items-center justify-between px-8 py-4 rounded-full backdrop-blur-md transition-all duration-300 transform ${
            isScrolled 
              ? 'bg-white/20 border border-green-400/30 shadow-2xl scale-95'
              : 'bg-black/40 border border-green-400/20 shadow-2xl'
          }`}
          style={{
            background: isScrolled 
              ? 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(27,94,32,0.6) 25%, rgba(76,175,80,0.4) 50%, rgba(165,214,167,0.3) 75%, rgba(0,0,0,0.7) 100%)'
              : 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(27,94,32,0.7) 25%, rgba(76,175,80,0.5) 50%, rgba(165,214,167,0.4) 75%, rgba(0,0,0,0.8) 100%)',
            border: isScrolled ? '2px solid rgba(76,175,80,0.4)' : '2px solid rgba(76,175,80,0.3)',
            boxShadow: isScrolled 
              ? '0 20px 40px rgba(0,0,0,0.4), 0 10px 20px rgba(76,175,80,0.2), inset 0 2px 4px rgba(255,255,255,0.1)'
              : '0 25px 50px rgba(0,0,0,0.5), 0 15px 30px rgba(76,175,80,0.3), inset 0 2px 4px rgba(255,255,255,0.1)',
            transform: isScrolled ? 'perspective(1000px) rotateX(2deg) scale(0.95)' : 'perspective(1000px) rotateX(0deg) scale(1)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Logo */}
          <motion.a 
            href="#" 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-xl transform transition-transform duration-300 hover:scale-110 hover:rotate-12"
              style={{
                boxShadow: '0 8px 16px rgba(76,175,80,0.4), 0 4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)',
                transform: 'translateZ(20px)'
              }}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-inner" />
            </div>
            <span className={`text-2xl lg:text-3xl font-light tracking-wide transition-colors duration-300 transform ${
              isScrolled ? 'text-green-300' : 'text-white'
            }`}
            style={{ 
              fontFamily: 'Consolas, Monaco, monospace',
              textShadow: isScrolled 
                ? '0 4px 8px rgba(0,0,0,0.3), 0 2px 4px rgba(76,175,80,0.5)'
                : '0 6px 12px rgba(0,0,0,0.4), 0 3px 6px rgba(76,175,80,0.6)',
              transform: 'translateZ(10px)'
            }}
            >
              Genial
            </span>
          </motion.a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {links.map((link) => {
              const isActive = currentSection === link.href.replace('#', '');
              return (
                <motion.a
                  key={link.name}
                  href={link.href}
                  className={`relative py-2 text-base lg:text-lg font-medium transition-colors duration-300 transform ${
                    isActive
                      ? isScrolled ? 'text-green-300' : 'text-white'
                      : isScrolled ? 'text-green-400 hover:text-green-200' : 'text-white/90 hover:text-white'
                  }`}
                  style={{ 
                    fontFamily: 'Consolas, Monaco, monospace',
                    textShadow: isScrolled
                      ? '0 4px 8px rgba(0,0,0,0.3), 0 2px 4px rgba(76,175,80,0.4)'
                      : '0 6px 12px rgba(0,0,0,0.4), 0 3px 6px rgba(76,175,80,0.5)',
                    transform: 'translateZ(5px)'
                  }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="underline"
                      className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                        isScrolled ? 'bg-green-400' : 'bg-white'
                      }`}
                      style={{
                        boxShadow: '0 0 10px rgba(76,175,80,0.8), 0 0 20px rgba(76,175,80,0.4)',
                        transform: 'translateZ(2px)'
                      }}
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.a>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <motion.button
            className={`lg:hidden p-2 rounded-lg transition-colors duration-300 transform ${
              isScrolled
                ? 'text-green-300 hover:bg-green-800/30'
                : 'text-white hover:bg-white/20'
            }`}
            style={{
              transform: 'translateZ(8px)'
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </motion.button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`lg:hidden fixed top-20 left-4 right-4 z-40 overflow-hidden rounded-3xl backdrop-blur-lg ${
              isScrolled ? 'bg-black/80' : 'bg-black/90'
            }`}
            style={{
              background: isScrolled 
                ? 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(27,94,32,0.7) 25%, rgba(76,175,80,0.5) 50%, rgba(0,0,0,0.8) 100%)'
                : 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(27,94,32,0.8) 25%, rgba(76,175,80,0.6) 50%, rgba(0,0,0,0.9) 100%)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 15px 30px rgba(76,175,80,0.3), inset 0 2px 4px rgba(255,255,255,0.1)',
              transform: 'perspective(1000px) rotateX(-5deg) translateZ(20px)',
              transformStyle: 'preserve-3d',
              border: '2px solid rgba(76,175,80,0.3)'
            }}
          >
            <nav className="px-6 py-4 space-y-2">
              {links.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3 text-xl font-medium transition-colors duration-300 transform ${
                    isScrolled
                      ? 'text-green-300 hover:text-green-200'
                      : 'text-white hover:text-green-100'
                  }`}
                  style={{ 
                    fontFamily: 'Consolas, Monaco, monospace',
                    textShadow: isScrolled
                      ? '0 4px 8px rgba(0,0,0,0.3), 0 2px 4px rgba(76,175,80,0.4)'
                      : '0 6px 12px rgba(0,0,0,0.4), 0 3px 6px rgba(76,175,80,0.5)',
                    transform: 'translateZ(5px)'
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                >
                  {link.name}
                </motion.a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
