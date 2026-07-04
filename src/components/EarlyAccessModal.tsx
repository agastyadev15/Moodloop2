import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, TrendingUp, RotateCcw, ThumbsUp, Info } from "lucide-react";

interface EarlyAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EarlyAccessModal({ isOpen, onClose }: EarlyAccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#111111]/40 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-lg bg-white rounded-2xl border border-[#ECECEC] shadow-xl overflow-hidden z-10 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECECEC]">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-[#8B5CF6]" />
                <h3 className="font-sans font-bold text-base text-[#111111]">
                  MoodLoop Early Access
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer text-neutral-400 hover:text-neutral-600"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <p className="text-sm text-[#6B6B6B] font-sans leading-relaxed">
                Thank you for being part of the MoodLoop journey! We are actively building and tuning the underlying AI acoustic vectors to create a truly personalized music discovery engine.
              </p>

              <div className="space-y-4">
                {/* Point 1: Actively Improved */}
                <div className="flex gap-3.5 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center shrink-0 border border-[#8B5CF6]/15">
                    <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#111111] font-sans">
                      Actively Being Improved
                    </h4>
                    <p className="text-xs text-[#6B6B6B] mt-1 font-sans leading-relaxed">
                      Our musicological database and pipeline are updated continuously. We regularly ship optimizations to improve search reliability.
                    </p>
                  </div>
                </div>

                {/* Point 2: Quality over time */}
                <div className="flex gap-3.5 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center shrink-0 border border-[#8B5CF6]/15">
                    <TrendingUp className="w-4 h-4 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#111111] font-sans">
                      Evolving Discovery Quality
                    </h4>
                    <p className="text-xs text-[#6B6B6B] mt-1 font-sans leading-relaxed">
                      As more tracks are analyzed and integrated, the nuance of mood mapping and genre matches will grow significantly over time.
                    </p>
                  </div>
                </div>

                {/* Point 3: Refresh matches */}
                <div className="flex gap-3.5 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center shrink-0 border border-[#8B5CF6]/15">
                    <RotateCcw className="w-4 h-4 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#111111] font-sans">
                      Refresh Recommendations
                    </h4>
                    <p className="text-xs text-[#6B6B6B] mt-1 font-sans leading-relaxed">
                      Use the <strong>"Find More Similar Songs"</strong> engine tool in the recommendation section to spin and discover additional matches instantly in real-time.
                    </p>
                  </div>
                </div>

                {/* Point 4: Feedback helps */}
                <div className="flex gap-3.5 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center shrink-0 border border-[#8B5CF6]/15">
                    <ThumbsUp className="w-4 h-4 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#111111] font-sans">
                      Your Feedback Shapes the Future
                    </h4>
                    <p className="text-xs text-[#6B6B6B] mt-1 font-sans leading-relaxed">
                      Use the like, dislike, and detailed feedback controls on recommendations to help our neural system adapt to your specific taste.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#FAFAF8] border-t border-[#ECECEC] flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-[#111111] hover:bg-neutral-800 text-white font-medium text-xs rounded-full cursor-pointer transition-all focus:outline-none"
              >
                Understood, Continue
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
