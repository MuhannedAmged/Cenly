"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error" | "confirm";
  confirmText?: string;
  cancelText?: string;
}

const Popup: React.FC<PopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "info",
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-10 h-10 text-green-500" />;
      case "warning":
      case "confirm":
        return <AlertCircle className="w-10 h-10 text-yellow-500" />;
      case "error":
        return <AlertCircle className="w-10 h-10 text-red-500" />;
      default:
        return <Info className="w-10 h-10 text-blue-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
          >
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-2xl rounded-full -mr-16 -mt-16" />

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                {getIcon()}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white tracking-tight">
                  {title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full mt-4">
                {type === "confirm" ? (
                  <>
                    <button
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-gray-400 text-sm font-medium hover:bg-white/10 transition-colors"
                    >
                      {cancelText}
                    </button>
                    <button
                      onClick={() => {
                        onConfirm?.();
                        onClose();
                      }}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 ${
                        title.toLowerCase().includes("delete") ||
                        title.toLowerCase().includes("clear")
                          ? "bg-red-600 text-white hover:bg-red-700 shadow-red-600/20"
                          : "bg-white text-black hover:bg-gray-100 shadow-white/20"
                      }`}
                    >
                      {confirmText}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="col-span-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-white/10 active:scale-95"
                  >
                    Got it
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Popup;
