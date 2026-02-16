"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Plus, ArrowUp, Mic, Crown, X } from "lucide-react";

interface InputAreaProps {
  onSend: (message: string, images?: string[]) => void;
  disabled: boolean;
  hasStarted: boolean;
  isPro?: boolean;
  dailyImagesRemaining?: number;
  onUpgradeClick?: () => void;
}

const MAX_IMAGES = 5;

const suggestions = [
  { icon: "🎨", text: "Any advice for me?" },
  { icon: "🎬", text: "Some youtube video idea" },
  { icon: "🧠", text: "Life lessons from kratos" },
];

const InputArea: React.FC<InputAreaProps> = ({
  onSend,
  disabled,
  hasStarted,
  isPro = false,
  dailyImagesRemaining = 5,
  onUpgradeClick,
}) => {
  const [input, setInput] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showVoiceTooltip, setShowVoiceTooltip] = useState(false);
  const [showImageTooltip, setShowImageTooltip] = useState(false);
  const [showMaxTooltip, setShowMaxTooltip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || selectedImages.length > 0) && !disabled) {
      onSend(input, selectedImages.length > 0 ? selectedImages : undefined);
      setInput("");
      setSelectedImages([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - selectedImages.length;
    if (remainingSlots <= 0) {
      setShowMaxTooltip(true);
      setTimeout(() => setShowMaxTooltip(false), 3000);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImages((prev) => {
          if (prev.length >= MAX_IMAGES) return prev;
          return [...prev, reader.result as string];
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageButtonClick = () => {
    if (!isPro && dailyImagesRemaining <= 0) {
      setShowImageTooltip(true);
      setTimeout(() => setShowImageTooltip(false), 3000);
      return;
    }
    if (selectedImages.length >= MAX_IMAGES) {
      setShowMaxTooltip(true);
      setTimeout(() => setShowMaxTooltip(false), 3000);
      return;
    }
    fileInputRef.current?.click();
  };

  const toggleListening = () => {
    // Pro feature check
    if (!isPro) {
      setShowVoiceTooltip(true);
      setTimeout(() => setShowVoiceTooltip(false), 3000);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser doesn't support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? " " : "") + transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  useEffect(() => {
    if (!hasStarted) {
      inputRef.current?.focus();
    }
  }, [hasStarted]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return (
    <div
      className={`w-10/12 max-w-2xl mx-auto transition-all duration-700 ${hasStarted ? "fixed bottom-8 left-1/2 -translate-x-1/2 z-40" : "relative z-10"}`}
    >
      <motion.div
        layout
        className="relative bg-[#0f0f0f] border border-[#1f1f1f] rounded-3xl shadow-2xl overflow-hidden group focus-within:border-[#333] transition-colors duration-300"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a1a1a] bg-[#111]">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 font-medium">
            {isPro ? (
              <>
                <Crown className="w-3 h-3 text-purple-400" />
                <span className="text-purple-400">Pro Plan Active</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3" />
                <span>Unlock more features with the Pro plan.</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 font-medium">
            {!isPro && (
              <span className="text-gray-600 mr-2">
                {dailyImagesRemaining} images left today
              </span>
            )}
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
            <span>Active</span>
          </div>
        </div>

        <AnimatePresence>
          {selectedImages.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pt-4"
            >
              <div className="flex flex-wrap gap-2">
                {selectedImages.map((img, index) => (
                  <div key={index} className="relative inline-block">
                    <img
                      src={img}
                      alt={`Preview ${index + 1}`}
                      className="h-16 w-auto rounded-lg border border-[#333]"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {selectedImages.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={handleImageButtonClick}
                    className="h-16 w-16 rounded-lg border border-dashed border-[#333] flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-600 mt-2">
                {selectedImages.length}/{MAX_IMAGES} images
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className=" flex items-center gap-3 px-4 py-3 sm:py-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            multiple
            className="hidden"
          />
          <div className="relative">
            <button
              type="button"
              onClick={handleImageButtonClick}
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                (!isPro && dailyImagesRemaining <= 0) ||
                selectedImages.length >= MAX_IMAGES
                  ? "bg-[#1a1a1a] text-gray-600 cursor-not-allowed"
                  : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#252525]"
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showImageTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-purple-600 text-white text-xs rounded-lg whitespace-nowrap z-50"
                >
                  <button
                    type="button"
                    onClick={onUpgradeClick}
                    className="flex items-center gap-1 hover:underline"
                  >
                    <Crown className="w-3 h-3" />
                    Upgrade to Pro for unlimited images
                  </button>
                </motion.div>
              )}
              {showMaxTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-yellow-600 text-white text-xs rounded-lg whitespace-nowrap z-50"
                >
                  Maximum {MAX_IMAGES} images per message
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Ask anything ..."}
            disabled={disabled}
            className="grow bg-transparent border-none outline-none text-white placeholder-gray-600 text-sm sm:text-base h-10"
          />

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={toggleListening}
                className={`w-8 h-8 flex items-center justify-center transition-colors ${
                  !isPro
                    ? "text-gray-600 cursor-not-allowed"
                    : isListening
                      ? "text-red-500 animate-pulse"
                      : "text-gray-500 hover:text-white"
                }`}
              >
                {isListening ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <div className="flex items-center gap-[2px]">
                    <div className="w-[2px] h-2 bg-current rounded-full"></div>
                    <div className="w-[2px] h-4 bg-current rounded-full"></div>
                    <div className="w-[2px] h-3 bg-current rounded-full"></div>
                    <div className="w-[2px] h-2 bg-current rounded-full"></div>
                  </div>
                )}
              </button>
              <AnimatePresence>
                {showVoiceTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-purple-600 text-white text-xs rounded-lg whitespace-nowrap z-50"
                  >
                    <button
                      type="button"
                      onClick={onUpgradeClick}
                      className="flex items-center gap-1 hover:underline"
                    >
                      <Crown className="w-3 h-3" />
                      Upgrade to Pro for voice input
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={
                (!input.trim() && selectedImages.length === 0) || disabled
              }
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                (input.trim() || selectedImages.length > 0) && !disabled
                  ? "bg-white text-black hover:scale-105"
                  : "bg-[#1a1a1a] text-gray-600 cursor-not-allowed"
              }`}
            >
              <ArrowUp className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {!hasStarted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
            className="flex flex-wrap items-center justify-center gap-3 mt-6"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSend(suggestion.text)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl text-xs sm:text-sm text-gray-400 hover:text-white hover:border-[#333] hover:bg-[#151515] transition-all"
              >
                <span>{suggestion.icon}</span>
                <span>{suggestion.text}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InputArea;
