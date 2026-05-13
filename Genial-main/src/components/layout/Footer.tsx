import React from 'react';
import { Instagram, Twitter, Linkedin, ArrowRight } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-forest text-soft py-24 md:py-32 px-6 md:px-12">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-12">
        <div className="col-span-1 md:col-span-2">
          <h2 className="font-serif italic text-3xl md:text-4xl font-normal text-white mb-8 tracking-tight">Genial</h2>
          <p className="text-soft/75 max-w-md mb-10 font-light leading-relaxed text-[15px]">
            Luxury eco-villas combining modern design with sustainable living in beautiful natural settings.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full border border-soft/20 flex items-center justify-center hover:bg-primary hover:border-primary transition-all">
              <Instagram size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-soft/20 flex items-center justify-center hover:bg-primary hover:border-primary transition-all">
              <Twitter size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-soft/20 flex items-center justify-center hover:bg-primary hover:border-primary transition-all">
              <Linkedin size={18} />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-serif italic text-lg text-white/95 mb-8 font-normal">Quick Links</h3>
          <ul className="space-y-4 font-light text-soft/80">
            <li><a href="#overview" className="hover:text-primary transition-colors">Overview</a></li>
            <li><a href="#amenities" className="hover:text-primary transition-colors">Amenities</a></li>
            <li><a href="#gallery" className="hover:text-primary transition-colors">Gallery</a></li>
            <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-serif italic text-lg text-white/95 mb-8 font-normal">Newsletter</h3>
          <p className="text-soft/80 mb-4 font-light text-sm">Subscribe for exclusive updates.</p>
          <div className="flex items-center border-b border-soft/30 pb-2">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="bg-transparent border-none outline-none w-full text-white placeholder:text-soft/50 font-light"
            />
            <button className="text-primary hover:text-white transition-colors">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto mt-20 pt-8 border-t border-soft/10 flex flex-col md:flex-row justify-between items-center text-sm text-soft/50 font-light">
        <p>&copy; {new Date().getFullYear()} Genial Estates. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};
