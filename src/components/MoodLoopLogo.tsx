import React from "react";

export default function MoodLoopLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Icon: Infinity Loop + Sound Wave */}
      <div className="relative w-9 h-9 flex-shrink-0 flex items-center justify-center transition-transform duration-300 hover:scale-105">
        <svg
          viewBox="0 0 100 100"
          className="w-9 h-9"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Infinity Loop Path: flowing mathematical model - Soft Lavender */}
          <path
            d="M 32 50 
               C 12 30, 8 70, 32 50 
               C 50 35, 50 35, 68 50 
               C 92 70, 88 30, 68 50 
               C 50 65, 50 65, 32 50 Z"
            stroke="#8B5CF6"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Sound Wave Bars in Charcoal/Black */}
          <line x1="24" y1="42" x2="24" y2="58" stroke="#111111" strokeWidth="5" strokeLinecap="round" />
          <line x1="50" y1="36" x2="50" y2="64" stroke="#111111" strokeWidth="5" strokeLinecap="round" />
          <line x1="76" y1="42" x2="76" y2="58" stroke="#111111" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Brand Name & Tagline */}
      <div className="flex flex-col">
        <span className="text-base font-bold tracking-tight text-[#111111] leading-none font-sans">
          MoodLoop
        </span>
        <span className="text-[9px] text-[#6B6B6B] font-medium tracking-wide mt-0.5">
          Acoustic Resonance Search
        </span>
      </div>
    </div>
  );
}
