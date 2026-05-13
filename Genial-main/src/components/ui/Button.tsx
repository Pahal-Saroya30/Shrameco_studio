'use client';

import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-primary text-white hover:bg-forest shadow-soft hover:shadow-lg",
      secondary: "bg-forest text-white hover:bg-forest/90",
      outline: "border-2 border-forest text-forest hover:bg-forest hover:text-white",
      ghost: "text-forest hover:bg-soft",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-12 px-8 text-base",
      lg: "h-14 px-10 text-lg",
    };

    return (
      <motion.button
        whileHover={{ scale: 1.008 }}
        whileTap={{ scale: 0.995 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
