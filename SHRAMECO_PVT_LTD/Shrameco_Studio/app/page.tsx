"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Instagram, Twitter, Facebook, Youtube, Linkedin, LayoutDashboard, Github, Twitch, Figma, Slack, Dribbble, Trello, Chrome, Framer, Code2, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col text-[#1A1A1A] font-sans selection:bg-[#C4B5FD]/40 bg-[#FAFAFA] relative overflow-hidden">
      
      {/* Grid Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: 'center center'
        }}
      ></div>

      {/* Navigation */}
      <nav className="relative z-40 bg-[#FAFAFA]/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <LayoutDashboard className="w-6 h-6 text-[#7C3AED]" />
            <span className="font-display font-extrabold text-xl tracking-tight text-[#1A1A1A]">BrandStudio</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-semibold text-gray-500 hover:text-[#1A1A1A] hidden sm:block">
              Log in
            </Link>
            <Link href="/login">
              <Button className="rounded-none bg-[#C4B5FD] hover:bg-[#A78BFA] text-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] h-9 px-5 font-bold text-sm transition-all border-2 border-[#1A1A1A]">
                Get started for free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 pt-20 pb-32">
        
        {/* Floating Icons Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Layer 1: Core Social Media */}
          <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute top-[12%] left-[15%] w-14 h-14 bg-white border-2 border-gray-100 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] rounded-none flex items-center justify-center rotate-[-3deg]">
            <Instagram className="w-7 h-7 text-pink-500" />
          </motion.div>
          <motion.div animate={{ y: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }} className="absolute top-[28%] left-[30%] w-16 h-16 bg-white border-2 border-gray-100 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] rounded-none flex items-center justify-center rotate-[5deg]">
            <span className="text-2xl font-black font-serif text-[#1A1A1A]">X</span>
          </motion.div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.5 }} className="absolute top-[48%] left-[8%] w-16 h-12 bg-white border-2 border-gray-100 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] rounded-none flex items-center justify-center rotate-[-6deg]">
            <Youtube className="w-8 h-8 text-red-500" />
          </motion.div>
          <motion.div animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 2 }} className="absolute bottom-[25%] left-[22%] w-14 h-14 bg-white border-2 border-gray-100 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] rounded-none flex items-center justify-center rotate-[4deg]">
            <Linkedin className="w-7 h-7 text-blue-600" />
          </motion.div>
          <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 1.5 }} className="absolute bottom-[20%] right-[18%] w-16 h-16 bg-white border-2 border-gray-100 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] rounded-none flex items-center justify-center rotate-[-5deg]">
            <Facebook className="w-8 h-8 text-blue-500" />
          </motion.div>
          
          {/* Layer 2: Design & Dev Tools */}
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.8 }} className="absolute top-[25%] right-[15%] w-12 h-12 bg-white border-2 border-gray-100 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] rounded-none flex items-center justify-center rotate-[10deg]">
            <Figma className="w-6 h-6 text-[#F24E1E]" />
          </motion.div>
          <motion.div animate={{ y: [0, -18, 0] }} transition={{ repeat: Infinity, duration: 6.5, ease: "easeInOut", delay: 1.2 }} className="absolute top-[10%] right-[30%] w-14 h-14 bg-white border-2 border-gray-100 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] rounded-none flex items-center justify-center rotate-[-8deg]">
            <Github className="w-7 h-7 text-[#1A1A1A]" />
          </motion.div>
          <motion.div animate={{ y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 5.2, ease: "easeInOut", delay: 2.1 }} className="absolute bottom-[35%] right-[28%] w-12 h-12 bg-white border-2 border-gray-100 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] rounded-none flex items-center justify-center rotate-[6deg]">
            <Slack className="w-6 h-6 text-[#E01E5A]" />
          </motion.div>
          <motion.div animate={{ y: [0, -14, 0] }} transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 1.7 }} className="absolute top-[55%] right-[8%] w-14 h-14 bg-white border-2 border-gray-100 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] rounded-none flex items-center justify-center rotate-[-12deg]">
            <Dribbble className="w-7 h-7 text-[#EA4C89]" />
          </motion.div>
          
          {/* Layer 3: More Tools */}
          <motion.div animate={{ y: [0, 16, 0] }} transition={{ repeat: Infinity, duration: 5.8, ease: "easeInOut", delay: 0.3 }} className="absolute top-[18%] left-[5%] w-10 h-10 bg-white border-2 border-gray-100 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] rounded-none flex items-center justify-center rotate-[15deg]">
            <Twitch className="w-5 h-5 text-[#9146FF]" />
          </motion.div>
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut", delay: 2.8 }} className="absolute bottom-[15%] left-[35%] w-12 h-12 bg-white border-2 border-gray-100 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] rounded-none flex items-center justify-center rotate-[-4deg]">
            <Trello className="w-6 h-6 text-[#0052CC]" />
          </motion.div>
          <motion.div animate={{ y: [0, 22, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1.1 }} className="absolute bottom-[45%] right-[12%] w-12 h-12 bg-white border-2 border-gray-100 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] rounded-none flex items-center justify-center rotate-[8deg]">
            <Chrome className="w-6 h-6 text-[#4285F4]" />
          </motion.div>
          <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 5.3, ease: "easeInOut", delay: 0.7 }} className="absolute top-[40%] left-[22%] w-10 h-10 bg-white border-2 border-gray-100 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] rounded-none flex items-center justify-center rotate-[-15deg]">
            <Framer className="w-5 h-5 text-[#1A1A1A]" />
          </motion.div>
          <motion.div animate={{ y: [0, 18, 0] }} transition={{ repeat: Infinity, duration: 6.1, ease: "easeInOut", delay: 2.4 }} className="absolute bottom-[12%] right-[35%] w-14 h-14 bg-white border-2 border-gray-100 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] rounded-none flex items-center justify-center rotate-[5deg]">
            <Code2 className="w-6 h-6 text-[#7C3AED]" />
          </motion.div>
          <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 4.7, ease: "easeInOut", delay: 1.9 }} className="absolute top-[5%] right-[5%] w-10 h-10 bg-white border-2 border-gray-100 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] rounded-none flex items-center justify-center rotate-[-20deg]">
            <PenTool className="w-5 h-5 text-[#F59E0B]" />
          </motion.div>
        </div>

        {/* Central Content */}
        <div className="max-w-4xl mx-auto px-6 w-full text-center relative z-20 space-y-10 mt-10">
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-[4rem] sm:text-7xl md:text-[5.5rem] font-black text-[#1A1A1A] tracking-tighter leading-[1.05]"
          >
            Your social media <br /> workspace
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="text-xl sm:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            Connected to every platform and tool you use.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="pt-8 max-w-xl mx-auto flex flex-col items-center"
          >
            <Link href="/login" className="inline-block">
              <Button className="rounded-none bg-[#C4B5FD] hover:bg-[#A78BFA] text-[#1A1A1A] h-16 px-10 font-black text-xl border-2 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
                Get started <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
            
            <p className="text-sm text-gray-500 mt-6 font-medium">
              Join our social media workspace
            </p>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
