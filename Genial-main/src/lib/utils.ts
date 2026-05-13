import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Variants } from "framer-motion";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.05,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.04,
    },
  },
};