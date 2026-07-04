import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Music, Check, Compass, Disc } from "lucide-react";
import { SongItem } from "../types";

// High-fidelity preloaded album art URLs from Apple Music
const FLOATING_ALBUMS = [
  "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/09/e0/d5/09e0d559-0682-f0f0-5e0c-3cd11e3114fd/beachhouse_depressioncherry_2400_300.jpg/600x600bb.jpg", // Beach House
  "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c1/2d/fe/c12dfe8f-cdf6-e179-d69a-8ec35f760266/00602537248681.rgb.jpg/600x600bb.jpg", // Kavinsky
  "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/28/49/a5/2849a5c4-57ed-1c12-90f4-1981f7e7e91b/cover.jpg/600x600bb.jpg", // Patrick Watson
  "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/ce/5d/c6/ce5dc65e-6dac-bb8a-daaf-72bf77d0ba75/616450974909.png/600x600bb.jpg", // Mr.Kitty
  "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/98/75/dd/9875dd83-34f6-40ef-3987-fd13646409be/5034644208930_homeodyssey.jpg/600x600bb.jpg", // Home
  "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/82/90/14/829014ad-a301-62ab-bee6-f4cca4457411/mzi.hozudery.jpg/600x600bb.jpg", // Arctic Monkeys
  "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/39/4e/9f/394e9f0e-002f-2a9c-a6f3-8d445fd85cbc/888174054827.jpg/600x600bb.jpg", // Chromatics
  "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/55/41/4a/55414a18-861a-79d1-e575-5bf8cf205dbe/886445056839_Cover.jpg/600x600bb.jpg" // Lord Huron
];

const LOADING_MESSAGES = [
  "Listening between the lyrics...",
  "Measuring emotional distance...",
  "Ignoring popularity...",
  "Looking for hidden gems...",
  "Comparing emotional fingerprints...",
  "Matching atmosphere...",
  "Looking beyond genres...",
  "Finding songs that stay after midnight..."
];

interface CinematicLoaderProps {
  song: SongItem | null;
  isLoadingData?: boolean;
  onComplete: () => void;
  onCancel?: () => void;
  matchCount?: number;
}

interface MoodTheme {
  name: string;
  gradient: string;
  glowColor: string;
}

const getMoodTheme = (songName: string = "", artistName: string = ""): MoodTheme => {
  const combined = `${songName} ${artistName}`.toLowerCase();
  
  if (combined.includes("still with you") || combined.includes("blue") || combined.includes("rain") || combined.includes("lonely") || combined.includes("melancholy")) {
    return {
      name: "Rainy Blue",
      gradient: "from-[#081528] via-[#020a16] to-[#040810]",
      glowColor: "rgba(59, 130, 246, 0.15)"
    };
  }
  if (combined.includes("nightcall") || combined.includes("neon") || combined.includes("purple") || combined.includes("cyberpunk") || combined.includes("latenight")) {
    return {
      name: "Neon Purple",
      gradient: "from-[#1a0b2e] via-[#0b0518] to-[#03010a]",
      glowColor: "rgba(168, 85, 247, 0.15)"
    };
  }
  if (combined.includes("kannukulla") || combined.includes("sunset") || combined.includes("warm") || combined.includes("romance") || combined.includes("love")) {
    return {
      name: "Warm Sunset",
      gradient: "from-[#2b0f1a] via-[#14050e] to-[#0a0206]",
      glowColor: "rgba(244, 63, 94, 0.15)"
    };
  }
  if (combined.includes("maruvaarthai") || combined.includes("golden") || combined.includes("sun") || combined.includes("morning") || combined.includes("warmth")) {
    return {
      name: "Golden Hour",
      gradient: "from-[#291404] via-[#140801] to-[#0a0400]",
      glowColor: "rgba(245, 158, 11, 0.15)"
    };
  }
  if (combined.includes("505") || combined.includes("grey") || combined.includes("gray") || combined.includes("storm") || combined.includes("clouds")) {
    return {
      name: "Grey Rain",
      gradient: "from-[#1c1d1f] via-[#0f1012] to-[#080809]",
      glowColor: "rgba(107, 114, 128, 0.15)"
    };
  }
  if (combined.includes("after dark") || combined.includes("midnight") || combined.includes("black") || combined.includes("dark")) {
    return {
      name: "Midnight Black",
      gradient: "from-[#050505] via-[#0a0a0c] to-[#010101]",
      glowColor: "rgba(255, 255, 255, 0.05)"
    };
  }
  
  // Default elegant cinematic background
  return {
    name: "Cosmic Slate",
    gradient: "from-[#0a0f1d] via-[#04060d] to-[#020306]",
    glowColor: "rgba(139, 92, 246, 0.15)"
  };
};

export default function CinematicLoader({ song, isLoadingData = false, onComplete, onCancel, matchCount = 27 }: CinematicLoaderProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [msgIndex, setMsgIndex] = useState<number>(0);
  const [usedMsgIndices, setUsedMsgIndices] = useState<number[]>([]);
  const [showBackButton, setShowBackButton] = useState<boolean>(false);
  const [minIntroElapsed, setMinIntroElapsed] = useState<boolean>(false);
  const theme = getMoodTheme(song?.name || "", song?.artist || "");

  // Timer to display a Back to Home option if taking too long
  useEffect(() => {
    const cancelTimer = setTimeout(() => {
      setShowBackButton(true);
    }, 4500);
    return () => clearTimeout(cancelTimer);
  }, []);

  // Sequence Timer Control for Intro Steps
  useEffect(() => {
    // 1. Expand screen initially, then trigger Reading state
    const t1 = setTimeout(() => setCurrentStep(2), 600);
    // 2. Begin rotation of intelligent loading messages & Transition background
    const t2 = setTimeout(() => setCurrentStep(3), 1200);
    // 3. Assemble floating blurred album covers
    const t3 = setTimeout(() => setCurrentStep(4), 2200);
    // 4. Set minIntroElapsed to true when we've had enough time to show the intro animations
    const t4 = setTimeout(() => {
      setMinIntroElapsed(true);
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // Dynamically transition to Step 5 (Results screen) when loading is complete AND intro is done
  useEffect(() => {
    if (minIntroElapsed && !isLoadingData && currentStep === 4) {
      setCurrentStep(5);
    }
  }, [minIntroElapsed, isLoadingData, currentStep]);

  // Handle dynamic completion and transition out after Step 5 is reached
  useEffect(() => {
    if (currentStep === 5) {
      const tComp = setTimeout(() => {
        onComplete();
      }, 1800);
      return () => clearTimeout(tComp);
    }
  }, [currentStep, onComplete]);

  // Handle Intelligent Rotating Message Sequence (Never repeat)
  useEffect(() => {
    if (currentStep >= 2 && currentStep < 5) {
      // Pick first message
      const availableIndices = LOADING_MESSAGES.map((_, i) => i).filter(i => !usedMsgIndices.includes(i));
      if (availableIndices.length > 0) {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        setMsgIndex(randomIndex);
        setUsedMsgIndices(prev => [...prev, randomIndex]);
      } else {
        // Reset if all used
        setUsedMsgIndices([]);
      }

      // Rotate every 1000ms
      const interval = setInterval(() => {
        setUsedMsgIndices(prev => {
          const updatedAvailable = LOADING_MESSAGES.map((_, i) => i).filter(idx => !prev.includes(idx));
          if (updatedAvailable.length > 0) {
            const nextIdx = updatedAvailable[Math.floor(Math.random() * updatedAvailable.length)];
            setMsgIndex(nextIdx);
            return [...prev, nextIdx];
          } else {
            const resetAvailable = LOADING_MESSAGES.map((_, i) => i);
            const nextIdx = resetAvailable[Math.floor(Math.random() * resetAvailable.length)];
            setMsgIndex(nextIdx);
            return [nextIdx];
          }
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentStep]);

  // Generate randomized positions for Floating blurred album covers assembling
  const floatingPositions = [
    { x: -160, y: -180, delay: 0, img: FLOATING_ALBUMS[0], scale: 0.85, rotation: -6 },
    { x: 180, y: -140, delay: 0.2, img: FLOATING_ALBUMS[1], scale: 0.9, rotation: 8 },
    { x: -200, y: 120, delay: 0.4, img: FLOATING_ALBUMS[2], scale: 0.75, rotation: -12 },
    { x: 190, y: 160, delay: 0.6, img: FLOATING_ALBUMS[3], scale: 0.8, rotation: 10 },
    { x: -240, y: -30, delay: 0.8, img: FLOATING_ALBUMS[4], scale: 0.7, rotation: 4 },
    { x: 230, y: 10, delay: 1.0, img: FLOATING_ALBUMS[5], scale: 0.75, rotation: -8 }
  ];

  return (
    <div
      id="cinematic-loader-container"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b ${theme.gradient} text-white font-sans transition-all duration-1000 ease-out overflow-hidden`}
    >
      {/* Back to Home Button (appears if taking more than 3s) */}
      <AnimatePresence>
        {showBackButton && onCancel && (
          <motion.button
            key="back-to-home-btn"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={onCancel}
            className="absolute top-6 left-6 z-50 flex items-center gap-2 px-5 py-2.5 text-[11px] font-mono uppercase tracking-wider text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-300 backdrop-blur-md cursor-pointer shadow-lg"
          >
            ← Back to Home
          </motion.button>
        )}
      </AnimatePresence>

      {/* Background radial soft aura */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-[2000ms] opacity-60"
        style={{
          background: `radial-gradient(circle at center, ${theme.glowColor} 0%, rgba(0,0,0,0) 70%)`
        }}
      />

      {/* Floating subtle geometric particles in background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* STAGE 1 - 4: INNER CENTRAL CONTENT ARCHITECTURE */}
      <div className="relative w-full max-w-lg px-6 flex flex-col items-center justify-center text-center z-10 min-h-[350px]">
        
        <AnimatePresence mode="wait">
          {currentStep < 5 ? (
            <motion.div
              key="loader-main-sequence"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center w-full"
            >
              {/* Anchor Song Card Glow and Centerpiece */}
              <div className="relative mb-10 group">
                <motion.div
                  className="absolute inset-0 rounded-2xl blur-3xl opacity-75 transition-all duration-1000"
                  style={{
                    backgroundColor: theme.glowColor === "rgba(255, 255, 255, 0.05)" ? "rgba(139, 92, 246, 0.1)" : theme.glowColor,
                    transform: "scale(1.2)"
                  }}
                  animate={{
                    scale: [1.1, 1.25, 1.1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 80, delay: 0.2 }}
                  className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 flex-shrink-0"
                >
                  {song?.artworkUrl ? (
                    <img 
                      src={song.artworkUrl} 
                      alt={song.name} 
                      className="w-full h-full object-cover select-none"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#8B5CF6]/30 to-[#3B82F6]/30">
                      <Music className="w-10 h-10 text-white/50" />
                    </div>
                  )}
                  {/* Glowing dynamic sweep overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </motion.div>

                {/* Micro compass indicator revolving around center */}
                <div className="absolute -top-2 -right-2 bg-black/60 backdrop-blur-md rounded-full p-1.5 border border-white/10 shadow-md">
                  <Compass className="w-4 h-4 text-purple-400 animate-[spin_6s_linear_infinite]" />
                </div>
              </div>

              {/* Title Header with elegant serif typography */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl sm:text-2xl font-normal font-serif tracking-tight text-white mb-2"
              >
                Reading emotional fingerprint...
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.6 }}
                className="text-xs text-white/60 font-mono tracking-widest uppercase mb-8"
              >
                {song?.name || "Target Signal"} — {song?.artist || "Atmosphere"}
              </motion.p>

              {/* STAGE 2: Animated Emotional DNA Wave Equalizer */}
              <div id="emotional-dna-wave" className="flex items-center justify-center gap-1.5 h-10 mb-8 w-48">
                {[...Array(14)].map((_, i) => {
                  // Generate custom heights and staggered timings
                  const baseHeights = [12, 28, 16, 36, 24, 40, 32, 20, 36, 14, 28, 18, 22, 10];
                  const colors = [
                    "bg-blue-400/80", "bg-indigo-400/80", "bg-purple-400/80", "bg-pink-400/80", "bg-rose-400/80",
                    "bg-fuchsia-400/80", "bg-violet-400/80", "bg-indigo-400/80", "bg-blue-400/80", "bg-teal-400/80",
                    "bg-emerald-400/80", "bg-amber-400/80", "bg-orange-400/80", "bg-red-400/80"
                  ];
                  return (
                    <motion.div
                      key={i}
                      className={`w-1 rounded-full ${colors[i % colors.length]}`}
                      initial={{ height: 4 }}
                      animate={{
                        height: [baseHeights[i] * 0.4, baseHeights[i], baseHeights[i] * 0.4]
                      }}
                      transition={{
                        duration: 1 + Math.random() * 0.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.05
                      }}
                    />
                  );
                })}
              </div>

              {/* STAGE 3: Rotating Intelligent Messages */}
              <div className="h-6 overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={msgIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="text-sm font-light text-zinc-300 italic tracking-wide font-sans"
                  >
                    {LOADING_MESSAGES[msgIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            // STAGE 6: "We found 27 emotional matches."
            <motion.div
              key="loader-completion-screen"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center"
            >
              {/* Success Sparkle Seal */}
              <motion.div
                initial={{ scale: 0.4, rotate: -30, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-8 shadow-xl"
              >
                <Check className="w-8 h-8 text-emerald-400" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-3xl sm:text-4xl font-normal font-serif text-white tracking-tight leading-tight mb-4"
              >
                We found {matchCount} emotional matches.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-xs text-zinc-400 font-mono tracking-widest uppercase"
              >
                Resonance mapping complete • Streaming applet
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* STAGE 5: Floating Blurred Album Covers Assembling */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <AnimatePresence>
          {currentStep >= 3 && currentStep < 5 && (
            <div className="absolute inset-0 flex items-center justify-center">
              {floatingPositions.map((pos, idx) => (
                <motion.div
                  key={idx}
                  custom={idx}
                  initial={{
                    opacity: 0,
                    x: pos.x * 1.8,
                    y: pos.y * 1.8,
                    scale: pos.scale * 0.7,
                    rotate: pos.rotation * 1.5,
                    filter: "blur(20px)"
                  }}
                  animate={{
                    opacity: 0.45,
                    x: pos.x,
                    y: pos.y,
                    scale: pos.scale,
                    rotate: pos.rotation,
                    filter: "blur(4px)" // beautiful soft blurred cover look
                  }}
                  exit={{
                    opacity: 0,
                    scale: pos.scale * 1.1,
                    filter: "blur(15px)",
                    transition: { duration: 0.5 }
                  }}
                  transition={{
                    duration: 2.2,
                    ease: [0.16, 1, 0.3, 1], // premium Apple-like inertia
                    delay: pos.delay
                  }}
                  className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-zinc-950"
                >
                  <img
                    src={pos.img}
                    alt="floating album"
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle glass reflection overlay */}
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Modern subtle footer branding */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 font-mono text-[9px] tracking-widest text-zinc-500 uppercase">
        <Disc className="w-3.5 h-3.5 text-zinc-600 animate-spin" style={{ animationDuration: '4s' }} />
        <span>MoodLoop Resonance AI</span>
      </div>
    </div>
  );
}
