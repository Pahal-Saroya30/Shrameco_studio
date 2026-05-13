'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/Button';
import { fadeUp } from '../../lib/utils';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number is required'),
  message: z.string().min(10, 'Message is too short'),
});

type FormData = z.infer<typeof formSchema>;

export const Contact = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  const onSubmit = async (data: FormData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(data);
    alert("Inquiry sent successfully. A concierge will contact you shortly.");
  };

  return (
    <section id="contact" className="py-32 md:py-44 bg-forest relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-16 lg:px-20 relative z-10 max-w-[1400px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-28 items-center">
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <p className="font-serif italic text-white/55 text-sm mb-6">Concierge</p>
            <h2 className="text-4xl md:text-5xl lg:text-[3.25rem] font-serif font-light text-white mb-8 leading-[1.12] tracking-tight">
              A conversation, <span className="italic font-normal">unhurried.</span>
            </h2>
            <p className="text-soft/75 font-light text-lg mb-14 max-w-md leading-relaxed">
              Enquire privately—we reply with discretion and care.
            </p>
            
            <div className="space-y-10 text-soft">
              <div>
                <p className="text-xs text-soft/45 uppercase tracking-[0.2em] mb-2">Location</p>
                <p className="font-light text-lg text-soft/95">The Green Valley, Eco District</p>
              </div>
              <div>
                <p className="text-xs text-soft/45 uppercase tracking-[0.2em] mb-2">Direct Line</p>
                <p className="font-light text-lg text-soft/95">+1 (800) 123-4567</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="glass-dark p-8 md:p-12 rounded-3xl"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <input 
                    {...register('name')}
                    placeholder="Full Name" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-primary transition-colors"
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <input 
                    {...register('phone')}
                    placeholder="Phone Number" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-primary transition-colors"
                  />
                  {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>}
                </div>
              </div>
              
              <div>
                <input 
                  {...register('email')}
                  placeholder="Email Address" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-primary transition-colors"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <textarea 
                  {...register('message')}
                  placeholder="How can we assist you?" 
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-primary transition-colors resize-none"
                />
                {errors.message && <p className="text-red-400 text-sm mt-1">{errors.message.message}</p>}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Inquiry'}
                </Button>
                <Button type="button" variant="outline" size="lg" className="w-full border-white/20 text-white hover:bg-white/10">
                  WhatsApp
                </Button>
              </div>
            </form>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
