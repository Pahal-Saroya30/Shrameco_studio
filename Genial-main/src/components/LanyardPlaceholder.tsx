'use client';
import { motion } from 'framer-motion';
import './Lanyard.css';

export default function LanyardPlaceholder() {
  return (
    <div className="lanyard-wrapper">
      <div className="flex flex-col items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-forest to-primary rounded-full mx-auto mb-8 shadow-2xl animate-pulse" />
          <h3 className="text-2xl font-serif italic text-forest mb-4">
            Interactive Lanyard Experience
          </h3>
          <p className="text-forest/60 max-w-md mx-auto">
            A dynamic 3D lanyard visualization will appear here. 
            Download the required assets (card.glb and lanyard.png) from the React Bits repository to enable the full interactive experience.
          </p>
          <div className="mt-8 p-4 bg-soft/50 rounded-lg border border-sage/30">
            <p className="text-sm text-forest/70 font-mono">
              Instructions: Replace LanyardPlaceholder with Lanyard component once assets are added to ./src/components/assets/
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
