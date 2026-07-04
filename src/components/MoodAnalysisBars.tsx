import React from "react";
import { motion } from "motion/react";
import { MoodAnalysis } from "../types";

interface MoodAnalysisBarsProps {
  analysis: MoodAnalysis;
  palette?: any;
}

interface MoodConfig {
  label: string;
  key: keyof MoodAnalysis;
  color: string;
  description: string;
}

const moodConfigs: MoodConfig[] = [
  {
    label: "Nostalgia",
    key: "nostalgia",
    color: "#D97706",
    description: "Dusty warm memories & tape textures.",
  },
  {
    label: "Longing",
    key: "longing",
    color: "#8B5CF6",
    description: "Yearning, distance & unspoken words.",
  },
  {
    label: "Romance",
    key: "romance",
    color: "#EC4899",
    description: "Warm melodies & soft harmonies.",
  },
  {
    label: "Warmth",
    key: "warmth",
    color: "#F97316",
    description: "Comforting chords & sun-drenched brightness.",
  },
  {
    label: "Melancholy",
    key: "melancholy",
    color: "#3B82F6",
    description: "Minor keys & soft acoustic rain.",
  },
  {
    label: "Hopefulness",
    key: "hopefulness",
    color: "#10B981",
    description: "Uplifting resolution & bright skies.",
  },
  {
    label: "Energy",
    key: "energy",
    color: "#EF4444",
    description: "Rhythm, tempo & structural drive.",
  },
];

export default function MoodAnalysisBars({ analysis }: MoodAnalysisBarsProps) {
  return (
    <div id="mood-analysis-container" className="space-y-8 bg-white p-6 md:p-8 rounded-[32px] border border-[#ECECEC]">
      <div className="flex items-baseline justify-between border-b border-[#ECECEC] pb-4">
        <div>
          <h3 id="mood-analysis-title" className="font-serif text-2xl font-normal text-[#111111]">
            Emotional DNA
          </h3>
          <p className="text-xs text-[#6B6B6B] font-sans mt-0.5">Continuous acoustic spectrum analysis</p>
        </div>
        <span className="text-[10px] text-[#6B6B6B] font-mono tracking-widest uppercase">Engine 3.5</span>
      </div>

      <div className="space-y-6">
        {moodConfigs.map((config, index) => {
          const score = analysis[config.key] ?? 50;

          return (
            <motion.div
              id={`mood-meter-${config.key}`}
              key={config.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.04 }}
              className="space-y-2 group"
            >
              {/* Labels & Percentage - Minimalist text style */}
              <div className="flex justify-between items-baseline">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-[#111111] font-sans">
                    {config.label}
                  </span>
                  <span className="text-[10px] text-[#6B6B6B] font-sans font-light opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    — {config.description}
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-[#111111]">
                  {score}%
                </span>
              </div>

              {/* Ultra Thin Horizontal Meter: Apple Health styled */}
              <div className="h-[3px] bg-[#F5F5F3] rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1], delay: index * 0.05 }}
                  className="h-full rounded-full transition-transform"
                  style={{
                    backgroundColor: config.color,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
