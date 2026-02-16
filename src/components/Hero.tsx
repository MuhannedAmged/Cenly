"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoIcon } from "./Logo";

interface HeroProps {
  isVisible: boolean;
}

const Hero: React.FC<HeroProps> = ({ isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className=" inset-0 flex flex-col items-center justify-center z-0 pointer-events-none"
        >
          <div className="mb-8 relative">
            {/* Glow behind logo */}
            <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full scale-150"></div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <LogoIcon className="w-20 h-20 text-white" />
            </motion.div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl md:text-5xl font-medium text-center text-transparent bg-clip-text bg-linear-to-b from-white to-white/60 mb-3 tracking-tight"
          >
            Good to See You!
            <br />
            How Can I be an Assistance?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 text-sm sm:text-base"
          >
            I'm available 24/7 for you, ask me anything.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Hero;
