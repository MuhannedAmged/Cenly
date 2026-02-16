"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, X } from "lucide-react";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const starterFeatures = [
  { text: "5 AI-powered conversations", included: true },
  { text: "5 image uploads per day", included: true },
  { text: "Basic chat access", included: true },
  { text: "Standard response speed", included: true },
  { text: "Voice-to-text input", included: false },
  { text: "Project download", included: false },
];

const proFeatures = [
  { text: "Unlimited AI conversations", included: true },
  { text: "Unlimited image uploads", included: true },
  { text: "Priority chat access", included: true },
  { text: "Fast response speed", included: true },
  { text: "Voice-to-text input", included: true },
  { text: "Project download", included: true },
];

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/95 backdrop-blur-xl p-4 sm:p-8 overflow-y-auto"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#252525] transition-all z-50"
          >
            ✕
          </button>

          <div className="w-full max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#333] mb-6">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-gray-300">
                  Upgrade your experience
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-semibold text-white mb-4 tracking-tight">
                Choose the plan that <br />
                fits your needs.
              </h2>
              <p className="text-gray-500 text-lg">
                Unlock the full power of Cenly AI with our pro plans.
              </p>
            </div>

            <div className="grid sm:grid-cols-1 md:grid-cols-2 items-stretch gap-6">
              {/* Free Plan */}
              <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-3xl p-8 flex flex-col hover:border-[#333] transition-colors relative group">
                <div className="mb-6">
                  <h3 className="text-xl font-medium text-white mb-2">
                    Starter
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Perfect for getting started.
                  </p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-semibold text-white">$0</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {starterFeatures.map((feature, index) => (
                    <li
                      key={index}
                      className={`flex items-center gap-3 text-sm ${feature.included ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-600 shrink-0" />
                      )}
                      {feature.text}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="w-full py-3 rounded-xl border border-[#333] text-white font-medium hover:bg-[#1a1a1a] transition-colors"
                >
                  Current Plan
                </button>
              </div>

              {/* Pro Plan (Highlighted) */}
              <div className="bg-[#111] border border-purple-500/30 rounded-3xl p-8 flex flex-col relative shadow-[0_0_50px_rgba(168,85,247,0.1)]">
                <div className="absolute top-0 right-0 bg-linear-to-l from-purple-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                  POPULAR
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-medium text-white mb-2">
                    Professional
                  </h3>
                  <p className="text-gray-500 text-sm">
                    For power users and creators.
                  </p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-semibold text-white">$19</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {proFeatures.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 text-sm text-gray-200"
                    >
                      <Check className="w-4 h-4 text-purple-400 shrink-0" />
                      {feature.text}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="w-full py-3 rounded-xl bg-white text-black font-medium hover:bg-gray-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PricingModal;
