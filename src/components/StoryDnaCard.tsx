import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  Download, 
  Share2, 
  Loader2, 
  Info, 
  Palette, 
  Heart,
  Bookmark,
  Compass,
  Layers,
  Award,
  ChevronRight
} from "lucide-react";
import { RecommendationItem, SongItem, MoodAnalysis } from "../types";
import { toBlob } from "html-to-image";
import { motion } from "motion/react";

interface StoryDnaCardProps {
  song: RecommendationItem | SongItem | null;
  onClose: () => void;
  topRecommendation?: RecommendationItem | null;
  moodAnalysis?: MoodAnalysis | null;
}

type ConcreteVibeType = "nightdrive" | "rainy" | "maincharacter" | "anime" | "dreamy" | "retro";
type SelectedVibeType = ConcreteVibeType | "surprise";

interface MoodDnaTrait {
  emoji: string;
  name: string;
  percentage: number;
}

// Helper hash function to ensure deterministic randomness
const getHashValue = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// Vibe classification engine
const detectSongVibe = (
  title: string,
  artist: string,
  moodAnalysis?: MoodAnalysis | null
): { vibe: ConcreteVibeType; label: string } => {
  const text = `${title} ${artist}`.toLowerCase();
  
  if (text.includes("still with you")) {
    return { vibe: "rainy", label: "🌧️ Midnight Rain" };
  }
  if (text.includes("kannukulla")) {
    return { vibe: "dreamy", label: "🔮 Golden Dream" };
  }
  if (text.includes("nightcall")) {
    return { vibe: "nightdrive", label: "🌌 Synthwave Neon" };
  }
  if (text.includes("maruvaarthai")) {
    return { vibe: "dreamy", label: "🔮 Golden Dream" };
  }

  if (moodAnalysis) {
    const { nostalgia = 0, longing = 0, romance = 0, warmth = 0, melancholy = 0, energy = 0 } = moodAnalysis;
    const highest = Math.max(nostalgia, longing, romance, warmth, melancholy, energy);
    
    if (highest > 0) {
      if (melancholy === highest) {
        return { vibe: "rainy", label: "🌧️ Cozy Muted Rainy" };
      }
      if (romance === highest) {
        return { vibe: "dreamy", label: "🔮 Ethereal Pastel Sunset" };
      }
      if (nostalgia === highest) {
        return { vibe: "retro", label: "🎞️ Vintage Archive" };
      }
      if (energy === highest) {
        return { vibe: "maincharacter", label: "✨ Editorial Magazine" };
      }
      if (longing === highest) {
        return { vibe: "dreamy", label: "🔮 Ethereal Pastel Sunset" };
      }
      if (warmth === highest) {
        return { vibe: "retro", label: "🎞️ Cozy Retro Polaroid" };
      }
    }
  }

  // Text filters
  const sadKeywords = ["sad", "cry", "pain", "hurt", "grief", "tear", "alone", "rain", "lost", "empty", "lonely"];
  if (sadKeywords.some(kw => text.includes(kw))) {
    return { vibe: "rainy", label: "🌧️ Rainy Evening Muted" };
  }

  const nostalgicKeywords = ["nostalgia", "remember", "retro", "old", "memories", "photograph", "time", "past", "classic", "polaroid"];
  if (nostalgicKeywords.some(kw => text.includes(kw))) {
    return { vibe: "retro", label: "🎞️ Vintage Polaroid Archive" };
  }

  const romanticKeywords = ["love", "romantic", "kiss", "heart", "together", "babe", "darling", "beautiful", "angel"];
  if (romanticKeywords.some(kw => text.includes(kw))) {
    return { vibe: "dreamy", label: "🔮 Ethereal Pastel Sunset" };
  }

  const driveKeywords = ["drive", "ride", "sunset", "midnight", "neon", "highway", "night"];
  if (driveKeywords.some(kw => text.includes(kw))) {
    return { vibe: "nightdrive", label: "🌌 Midnight Neon Drive" };
  }

  const energeticKeywords = ["energy", "dance", "run", "power", "hype", "fire", "burning", "electric"];
  if (energeticKeywords.some(kw => text.includes(kw))) {
    return { vibe: "maincharacter", label: "✨ Editorial Main Character" };
  }

  const hash = getHashValue(title + artist);
  const vibes: ConcreteVibeType[] = ["nightdrive", "rainy", "maincharacter", "anime", "dreamy", "retro"];
  const labels = [
    "🌌 Midnight Neon Drive",
    "🌧️ Rainy Evening Muted",
    "✨ Editorial Magazine",
    "🌸 Anime Outro Ending",
    "🔮 Ethereal Pastel Sunset",
    "🎞️ Vintage Polaroid Archive"
  ];
  return {
    vibe: vibes[hash % vibes.length],
    label: labels[hash % labels.length]
  };
};

// Extract trait metrics
const getMoodDna = (template: ConcreteVibeType, seed: number, moodAnalysis?: MoodAnalysis | null): MoodDnaTrait[] => {
  const allTraits = [
    { emoji: "🌙", name: "Nostalgic", key: "nostalgia" },
    { emoji: "💭", name: "Longing", key: "longing" },
    { emoji: "✨", name: "Warm", key: "warmth" },
    { emoji: "❤️", name: "Romantic", key: "romance" },
    { emoji: "🌧", name: "Melancholic", key: "melancholy" },
    { emoji: "🚗", name: "Energetic", key: "energy" },
    { emoji: "🌌", name: "Dreamy", key: "hopefulness" }
  ];

  if (moodAnalysis) {
    const scores = allTraits.map(t => {
      let score = 0;
      if (t.key === "hopefulness") {
        score = Math.round((moodAnalysis.hopefulness || 50) * 0.9 + (moodAnalysis.longing || 50) * 0.1);
      } else {
        score = moodAnalysis[t.key as keyof MoodAnalysis] || 45;
      }
      return {
        emoji: t.emoji,
        name: t.name,
        percentage: Math.min(100, Math.max(15, score))
      };
    });

    scores.sort((a, b) => b.percentage - a.percentage);
    return scores.slice(0, 3);
  }

  const relativeScores: Record<ConcreteVibeType, { traitIndex: number; baseWeight: number }[]> = {
    retro: [
      { traitIndex: 0, baseWeight: 95 },
      { traitIndex: 4, baseWeight: 78 },
      { traitIndex: 2, baseWeight: 65 }
    ],
    dreamy: [
      { traitIndex: 6, baseWeight: 90 },
      { traitIndex: 1, baseWeight: 82 },
      { traitIndex: 0, baseWeight: 71 }
    ],
    rainy: [
      { traitIndex: 4, baseWeight: 92 },
      { traitIndex: 1, baseWeight: 84 },
      { traitIndex: 0, baseWeight: 75 }
    ],
    maincharacter: [
      { traitIndex: 5, baseWeight: 96 },
      { traitIndex: 2, baseWeight: 88 },
      { traitIndex: 3, baseWeight: 72 }
    ],
    nightdrive: [
      { traitIndex: 5, baseWeight: 92 },
      { traitIndex: 6, baseWeight: 80 },
      { traitIndex: 0, baseWeight: 68 }
    ],
    anime: [
      { traitIndex: 4, baseWeight: 88 },
      { traitIndex: 1, baseWeight: 76 },
      { traitIndex: 6, baseWeight: 62 }
    ]
  };

  const selectedPairs = relativeScores[template] || relativeScores.retro;
  return selectedPairs.map((pair, idx) => {
    const rawTrait = allTraits[pair.traitIndex];
    const drift = (seed + idx * 7) % 9 - 4;
    return {
      emoji: rawTrait.emoji,
      name: rawTrait.name,
      percentage: Math.min(100, Math.max(20, pair.baseWeight + drift))
    };
  });
};

const getSongInterpretation = (title: string, seed: number): string => {
  const patterns = [
    `"${title}" feels like holding onto a memory longer than you should.`,
    `"${title}" feels like seeing someone after you've already lost them.`,
    `"${title}" feels like replaying conversations you wish had ended differently.`,
    `"${title}" feels like walking through a crowded room, searching for a face that isn't there anymore.`,
    `"${title}" feels like an aesthetic, quiet escape where nothing else matters.`,
    `"${title}" feels like finding an old note in a forgotten book, and suddenly remembering everything.`,
    `"${title}" feels like the soft whisper of a summer afternoon that you can never go back to.`,
    `"${title}" feels like a scenic cinematic scene moving in gorgeous slow motion.`,
    `"${title}" feels like writing a draft you know you'll never have the chance to send.`
  ];
  return patterns[seed % patterns.length];
};

const getPoeticCaptionForSelectedStyle = (template: ConcreteVibeType, intensity: "subtle" | "emotional" | "dramatic", index: number): string => {
  const mapThemeToOldKey = (theme: ConcreteVibeType): string => {
    switch (theme) {
      case "retro": return "nostalgia";
      case "dreamy": return "thoughts";
      case "rainy": return "rainy";
      case "maincharacter": return "maincharacter";
      case "nightdrive": return "nightdrive";
      case "anime": return "rainy";
      default: return "rainy";
    }
  };

  const oldKey = mapThemeToOldKey(template);

  const quoteLibrary: Record<string, Record<"subtle" | "emotional" | "dramatic", string[]>> = {
    rainy: {
      subtle: [
        "cold windows, warm tea, and the song we used to love.",
        "just the rain and another thought of you.",
        "sometimes the silence of the rain is too loud.",
        "i still remember how your hand felt in the cold.",
        "pouring outside, and replaying everything we didn't say."
      ],
      emotional: [
        "another rainy evening, another text i shouldn't send.",
        "the rain washed away our footsteps, but not the feeling.",
        "we were a beautiful season that ended too soon.",
        "staring at the water drops, wishing you were still here.",
        "some memories are best listened to in the dark."
      ],
      dramatic: [
        "the storm outside is nothing compared to missing you.",
        "we became strangers who only exist in shared playlists.",
        "replaying the last day we laughed in the rain.",
        "i hope this track reminds you of who we were.",
        "a simple rain track, but it feels like a diary."
      ]
    },
    thoughts: {
      subtle: [
        "staring at the ceiling, wondering if you're awake too.",
        "the quiet hours always bring back the heaviest thoughts.",
        "trying to find your face in a memory that's fading.",
        "some conversations are meant to be finished in dreams.",
        "a heart full of words, but nowhere left to send."
      ],
      emotional: [
        "i don't miss the place, i miss us in it.",
        "replaying the moment you first looked at me that way.",
        "some hands are too hard to let go of.",
        "underneath the quiet, you are still my favorite thought.",
        "i write letters to you and save them in drafts."
      ],
      dramatic: [
        "we are two different stories now, but scored by this.",
        "i still find pieces of you in everything i do.",
        "it ended quickly, but the echo has lasted for years.",
        "are you listening to this too, or did you move on?",
        "the silence after this song is where you still exist."
      ]
    },
    nostalgia: {
      subtle: [
        "golden sun through the window, and a memory of us.",
        "faded Polaroid of a summer we can never have back.",
        "some soundtracks carry the scent of old car rides.",
        "vintage tape hiss, and suddenly I am seventeen again.",
        "rewinding the days when we had nothing to hide."
      ],
      emotional: [
        "i found your old note. i still know every word.",
        "we were so young, and we had no idea.",
        "this track still tastes like warm afternoons with you.",
        "you were the best chapter in a book i closed.",
        "i keep our memories in the back of my mind."
      ],
      dramatic: [
        "i would do it all over again, even the ending.",
        "the polaroid is fading, but you are still so clear.",
        "an old song, but it brings back a brand-new ache.",
        "we built a small universe and left it behind.",
        "back when we thought we had all the time left."
      ]
    },
    maincharacter: {
      subtle: [
        "walking through the city, writing my own quiet ending.",
        "the sun hits different when you finally feel okay.",
        "just me, my headphones, and a brand-new chapter.",
        "taking back the narrative, one quiet step at a time.",
        "i am finally the hero of my own story again."
      ],
      emotional: [
        "that direct window-staring scene when everything finally changes.",
        "you are no longer the score of my everyday life.",
        "stepping out of your shadow and into the gold.",
        "i stopped waiting for a call that was never coming.",
        "the moment you realize you are finally free."
      ],
      dramatic: [
        "cut the cameras, i am finally choosing myself now.",
        "the cinematic scene where the girl finally walks away.",
        "scored by this beat, i am leaving you behind.",
        "this is my credits roll. thanks for the memories.",
        "i am writing a future that doesn't include you."
      ]
    },
    nightdrive: {
      subtle: [
        "empty highways and headlights fading into the dark.",
        "driving just to hear the engine and this track.",
        "the city looks different when nobody is awake.",
        "neon signs reflecting on wet, quiet asphalt.",
        "tunnel lights blurring into a stream of gold."
      ],
      emotional: [
        "driving far enough to outrun the ghost of you.",
        "the passenger seat has never felt so cold.",
        "neon lights, wet streets, and a mind full of memories.",
        "i drive past your street but never slow down.",
        "the city is asleep, but my thoughts are racing."
      ],
      dramatic: [
        "music loud enough to drown out your last words.",
        "one turn away from driving back to your house.",
        "chasing the dark horizon, hoping to forget your face.",
        "we used to drive here. now it's just me.",
        "speeding down the midnight highway, leaving you behind."
      ]
    }
  };

  const templatesDict = quoteLibrary[oldKey] || quoteLibrary.rainy;
  const list = templatesDict[intensity] || templatesDict.emotional;
  return list[index % list.length];
};

// Step 1: Analyze emotional fingerprint metadata generator
function computeEmotionalFingerprint(
  title: string, 
  artist: string, 
  vibe: ConcreteVibeType, 
  moodAnalysis: MoodAnalysis | null | undefined, 
  seed: number
) {
  const nostalgiaPct = moodAnalysis ? Math.round(moodAnalysis.nostalgia * 100) : (seed % 31 + 60);
  const romanticPct = moodAnalysis ? Math.round(moodAnalysis.romance * 100) : (seed % 41 + 45);
  const warmthPct = moodAnalysis ? Math.round(moodAnalysis.warmth * 100) : (seed % 35 + 55);
  const longingPct = moodAnalysis ? Math.round(moodAnalysis.longing * 100) : (seed % 29 + 65);
  const melancholyPct = moodAnalysis ? Math.round(moodAnalysis.melancholy * 100) : (seed % 37 + 40);
  const energyPct = moodAnalysis ? Math.round(moodAnalysis.energy * 100) : (seed % 47 + 35);
  const hopefulPct = moodAnalysis ? Math.round(moodAnalysis.hopefulness * 100) : (seed % 31 + 50);

  let atmosphere = "";
  let colorPaletteName = "";
  let cinematicStyle = "";
  let colors = {
    bgFrom: "",
    bgVia: "",
    bgTo: "",
    accent: "",
    accentText: "",
    glow: "",
    textBase: "text-white"
  };
  let fonts = {
    titleFont: "font-sans",
    bodyFont: "font-serif",
    metaFont: "font-mono"
  };
  let bgImageUrl = "";

  const norm = title.toLowerCase();

  switch (vibe) {
    case "nightdrive":
      atmosphere = "Midnight damp highway alleys, neon car dials & speed blurs";
      colorPaletteName = "Cyberpunk Violet, Carbon & Glowing Electric Teal";
      cinematicStyle = "Asymmetrical Widescreen Neon Noir";
      colors = {
        bgFrom: "from-[#08020e]/60",
        bgVia: "via-[#010103]/95",
        bgTo: "to-slate-950",
        accent: "border-cyan-500/30",
        accentText: "text-fuchsia-400 drop-shadow-[0_0_8px_rgba(240,70,160,0.5)]",
        glow: "rgba(168, 85, 247, 0.4)",
        textBase: "text-white"
      };
      fonts = {
        titleFont: "font-sans font-black tracking-tighter uppercase",
        bodyFont: "font-mono tracking-tight",
        metaFont: "font-mono tracking-widest text-[#00f2fe] font-black"
      };
      bgImageUrl = "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=80&w=1080";
      break;

    case "rainy":
      atmosphere = "Windowpane condensation, muted cold gray fog & warm vapor leaks";
      colorPaletteName = "Prussian Indigo, Muted Charcoal & Soft Mist Silver";
      cinematicStyle = "Candid Lo-fi Pinterest Frame";
      colors = {
        bgFrom: "from-slate-900/50",
        bgVia: "via-indigo-950/80",
        bgTo: "to-[#0c1221]",
        accent: "border-slate-800",
        accentText: "text-sky-300",
        glow: "rgba(14, 165, 233, 0.15)",
        textBase: "text-zinc-200"
      };
      fonts = {
        titleFont: "font-mono font-medium tracking-tight",
        bodyFont: "font-sans font-normal text-zinc-300",
        metaFont: "font-mono tracking-widest"
      };
      bgImageUrl = "https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?auto=format&fit=crop&q=80&w=1080";
      break;

    case "maincharacter":
      atmosphere = "Vogue editorial columns, raw architectural shadow structures & sand dunes";
      colorPaletteName = "Linen Cream, Dark Oyster & Soft Warm Brushed Copper";
      cinematicStyle = "Glossy Editorial Magazine Spread";
      colors = {
        bgFrom: "from-[#faf9f5]/55",
        bgVia: "via-[#f3ebd6]",
        bgTo: "to-[#ebdcb9]",
        accent: "border-[#40382f]",
        accentText: "text-[#664d35]",
        glow: "rgba(139, 94, 60, 0.1)",
        textBase: "text-stone-900"
      };
      fonts = {
        titleFont: "font-serif font-black tracking-tight uppercase",
        bodyFont: "font-serif italic font-light",
        metaFont: "font-sans tracking-[0.25em] font-extrabold uppercase text-[9px]"
      };
      bgImageUrl = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1080";
      break;

    case "anime":
      atmosphere = "Lilac celestial dusk clouds, sparkling sakura dust & powerline contours";
      colorPaletteName = "Sakura Petal, Pastel Lilac & Sunset Twilight Indigo";
      cinematicStyle = "Nostalgic Hand-Drawn Ending Sequence";
      colors = {
        bgFrom: "from-[#080516]/40",
        bgVia: "via-[#1b092a]/80",
        bgTo: "to-[#030206]",
        accent: "border-pink-400/30",
        accentText: "text-pink-300",
        glow: "rgba(244, 114, 182, 0.2)",
        textBase: "text-pink-50"
      };
      fonts = {
        titleFont: "font-serif italic tracking-wide text-shadow-md",
        bodyFont: "font-serif italic text-rose-100",
        metaFont: "font-mono text-stone-300 tracking-widest uppercase"
      };
      bgImageUrl = "https://images.unsplash.com/photo-1531315630201-bb15abeb1653?auto=format&fit=crop&q=80&w=1080";
      break;

    case "dreamy":
      atmosphere = "Glassmorphic nebulas, celestial orbital trails & cosmic violet mist";
      colorPaletteName = "Luminous Prism, Lavender Dust & Pale Ether Aqua";
      cinematicStyle = "Nebula Glassmorphism Grid";
      colors = {
        bgFrom: "from-[#050212]/50",
        bgVia: "via-purple-950/85",
        bgTo: "to-[#010103]",
        accent: "border-purple-500/20",
        accentText: "text-violet-300",
        glow: "rgba(167, 139, 250, 0.35)",
        textBase: "text-violet-50"
      };
      fonts = {
        titleFont: "font-sans font-light tracking-wider uppercase",
        bodyFont: "font-serif italic text-purple-200",
        metaFont: "font-mono tracking-[0.3em] uppercase text-violet-400"
      };
      bgImageUrl = "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&q=80&w=1080";
      break;

    case "retro":
    default:
      atmosphere = "Vintage cream textured paper, sunbleached fields & handwritten records";
      colorPaletteName = "Tea-Stained Beige, cedar scrap wood & Faded Sage";
      cinematicStyle = "Analog Polarized Memory Keepsake";
      colors = {
        bgFrom: "from-stone-50/70",
        bgVia: "via-amber-50/95",
        bgTo: "to-[#eddcb9]",
        accent: "border-stone-300",
        accentText: "text-[#5d4037]",
        glow: "rgba(180, 83, 9, 0.1)",
        textBase: "text-stone-900"
      };
      fonts = {
        titleFont: "font-serif font-black italic tracking-tight",
        bodyFont: "font-sans leading-relaxed text-stone-700",
        metaFont: "font-sans font-bold tracking-[0.2em] text-[#8d6e63]"
      };
      bgImageUrl = "https://images.unsplash.com/photo-1501183007986-d0d080b147f9?auto=format&fit=crop&q=80&w=1080";
      break;
  }

  if (norm.includes("still with you")) {
    bgImageUrl = "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&q=80&w=1080";
  } else if (norm.includes("kannukulla")) {
    bgImageUrl = "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1080";
  } else if (norm.includes("nightcall")) {
    bgImageUrl = "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=1080";
  } else if (norm.includes("maruvaarthai")) {
    bgImageUrl = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1080";
  }

  return {
    vibe,
    vibeLabel: vibe.toUpperCase(),
    atmosphere,
    colorPaletteName,
    cinematicStyle,
    colors,
    fonts,
    bgImageUrl,
    nostalgiaPct,
    romanticPct,
    warmthPct,
    longingPct,
    melancholyPct,
    energyPct,
    hopefulPct
  };
}

export default function StoryDnaCard({ song, onClose, topRecommendation, moodAnalysis }: StoryDnaCardProps) {
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<SelectedVibeType>("surprise");
  const [activeVibe, setActiveVibe] = useState<ConcreteVibeType>("retro");
  const [selectedTextStyle, setSelectedTextStyle] = useState<string>("default");
  const [textTransform, setTextTransform] = useState<string>("default");

  const getQuoteClassName = (vibe: string, defaultClasses: string, transform: string) => {
    let styleClass = "";

    // Choose font family
    if (selectedTextStyle === "default") {
      // Return vibe original font styles
      switch (vibe) {
        case "nightdrive": styleClass = "font-sans font-black tracking-tight text-xl sm:text-2xl text-white uppercase leading-snug drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"; break;
        case "rainy": styleClass = "font-serif italic font-light text-xl sm:text-2xl text-zinc-350 leading-relaxed tracking-wide drop-shadow-md"; break;
        case "maincharacter": styleClass = "font-playfair font-semibold italic text-xl sm:text-2xl text-[#f5ebd1] leading-relaxed tracking-tight drop-shadow-md"; break;
        case "anime": styleClass = "font-serif italic text-pink-50 leading-relaxed text-base sm:text-lg"; break;
        case "dreamy": styleClass = "font-serif italic font-light text-xl sm:text-2xl text-violet-50 leading-relaxed tracking-wider drop-shadow-md"; break;
        default: styleClass = "font-serif italic text-stone-850 text-xl sm:text-2xl leading-relaxed tracking-tight"; break; // retro
      }
    } else {
      // Apply user specified font family
      switch (selectedTextStyle) {
        case "serif": styleClass = "font-serif italic font-light text-xl sm:text-2xl leading-relaxed tracking-wide"; break;
        case "sans-bold": styleClass = "font-display font-black tracking-tighter text-[19px] sm:text-[23px] uppercase leading-snug"; break;
        case "mono": styleClass = "font-mono font-medium tracking-tight text-[12.5px] sm:text-[14px] leading-relaxed"; break;
        case "playfair": styleClass = "font-playfair italic font-normal text-xl sm:text-[23px] leading-relaxed"; break;
        case "handwritten": styleClass = "font-handwritten text-3xl sm:text-4xl leading-tight font-medium tracking-wide"; break;
        case "editorial": styleClass = "font-editorial italic font-medium text-xl sm:text-[23px] leading-relaxed"; break;
        case "syne": styleClass = "font-syne font-black text-xl sm:text-[23px] leading-snug uppercase"; break;
        default: styleClass = "font-serif"; break;
      }

      // Keep safety colors / backgrounds per vibe style
      switch (vibe) {
        case "nightdrive": styleClass += " text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"; break;
        case "rainy": styleClass += " text-zinc-350 drop-shadow-md"; break;
        case "maincharacter": styleClass += " text-[#f5ebd1] drop-shadow-md"; break;
        case "anime": styleClass += " text-pink-50"; break;
        case "dreamy": styleClass += " text-violet-50 drop-shadow-md"; break;
        default: styleClass += " text-stone-850"; break; // retro
      }
    }

    // Apply text transforms
    if (transform === "uppercase") {
      styleClass += " uppercase";
    } else if (transform === "lowercase") {
      styleClass += " lowercase";
    } else if (transform === "normal") {
      styleClass += " normal-case";
    }

    return styleClass;
  };

  const [autoMatchedLabel, setAutoMatchedLabel] = useState<string>("");
  const [artworkBase64, setArtworkBase64] = useState<string>("");
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [intensity, setIntensity] = useState<"subtle" | "emotional" | "dramatic">("emotional");
  const [entranceAnimation, setEntranceAnimation] = useState<"fade" | "slideUp" | "scaleIn">("slideUp");
  const hiddenCanvasRef = useRef<HTMLDivElement>(null);

  if (!song) return null;

  const isRec = "songName" in song;
  const originalTitle = isRec ? (song as RecommendationItem).songName : (song as SongItem).name;
  const originalArtist = song.artist;
  const artworkUrl = song.artworkUrl;
  const artworkPlaceholder = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400";
  const finalArtwork = artworkUrl || artworkPlaceholder;

  const seed = getHashValue(originalTitle + originalArtist);

  useEffect(() => {
    if (song) {
      const auto = detectSongVibe(originalTitle, originalArtist, moodAnalysis);
      setAutoMatchedLabel(auto.label);
      if (selectedVibe === "surprise") {
        setActiveVibe(auto.vibe);
      } else {
        setActiveVibe(selectedVibe);
      }
    }
  }, [selectedVibe, song, moodAnalysis, originalTitle, originalArtist]);

  useEffect(() => {
    if (seed !== undefined && activeVibe) {
      setQuoteIndex(seed % 6);
    }
  }, [song, activeVibe, seed]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
      setShareSupported(true);
    }
  }, []);

  useEffect(() => {
    if (finalArtwork) {
      fetch(finalArtwork, { mode: "cors" })
        .then((res) => {
          if (!res.ok) throw new Error("CORS restricted direct art loading");
          return res.blob();
        })
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setArtworkBase64(reader.result as string);
          };
          reader.readAsDataURL(blob);
        })
        .catch((e) => {
          console.warn("Utilizing direct image URL for export source fallback", e);
          setArtworkBase64(finalArtwork);
        });
    }
  }, [finalArtwork]);

  const activeMoodDna = getMoodDna(activeVibe, seed, moodAnalysis);
  const poeticVibeCaption = getPoeticCaptionForSelectedStyle(activeVibe, intensity, quoteIndex);
  const interpretation = getSongInterpretation(originalTitle, seed);

  const handleGenerateNewQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % 6);
  };

  const generatePngBlob = async (): Promise<Blob | null> => {
    if (!hiddenCanvasRef.current) return null;
    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const blob = await toBlob(hiddenCanvasRef.current, {
        cacheBust: true,
        quality: 1,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });
      setIsGenerating(false);
      return blob;
    } catch (e) {
      console.error("Failed compiling story target blob", e);
      setIsGenerating(false);
      return null;
    }
  };

  const handleDownload = async () => {
    const blob = await generatePngBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `moodloop-aesthetic-${activeVibe}-${originalTitle.toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyImage = async () => {
    const blob = await generatePngBlob();
    if (!blob) return;
    try {
      if (typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
      } else {
        handleDownload();
      }
    } catch (err) {
      console.warn("Clipboard restricted", err);
      handleDownload();
    }
  };

  const handleShareStory = async () => {
    try {
      if (shareSupported && typeof navigator !== "undefined" && navigator.share) {
        const blob = await generatePngBlob();
        if (!blob) {
          handleDownload();
          return;
        }
        const file = new File([blob], `moodloop-aesthetic-${originalTitle.replace(/\s+/g, "-")}.png`, { type: "image/png" });
        await navigator.share({
          files: [file],
          title: "My Soundtrack Story Card",
          text: `My design story card for "${originalTitle}" by ${originalArtist}. Created on MoodLoop!`,
        });
      } else {
        handleDownload();
      }
    } catch (e) {
      console.warn("Web Share API fallback executed", e);
      handleDownload();
    }
  };

  // Helper renderer which shapes the actual beautiful boards based on the dynamic variables
  const renderCardBody = (view: "preview" | "exporter") => {
    const isExport = view === "exporter";
    const coverSource = isExport ? (artworkBase64 || finalArtwork) : finalArtwork;
    const fp = computeEmotionalFingerprint(originalTitle, originalArtist, activeVibe, moodAnalysis, seed);

    // Common ambient layer
    const backgroundWrapperClasses = `w-full h-full flex flex-col justify-between relative overflow-hidden select-none bg-black transition-all p-10 sm:p-12 ${isExport ? "scale-100" : "scale-100"}`;

    const backgroundTextureLayer = (
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src={fp.bgImageUrl} 
          className="w-full h-full object-cover opacity-60 filter brightness-[0.45] saturate-[1.3] blur-[22px] scale-110" 
          referrerPolicy="no-referrer"
          alt="" 
        />
        <div className={`absolute inset-0 bg-gradient-to-tr ${fp.colors.bgFrom} ${fp.colors.bgVia} ${fp.colors.bgTo} mix-blend-multiply opacity-80`} />
        
        {/* Cinematic vignette to focus the eyes on the quote */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.15)_20%,rgba(0,0,0,0.85)_100%)] z-[1]" />

        {/* Customized lighting shadows depending on emotion */}
        {activeVibe === "nightdrive" && (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px] opacity-[0.15]" />
            <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[130px] mix-blend-screen" />
            <div className="absolute bottom-[20%] right-[-10%] w-[430px] h-[430px] bg-cyan-400/25 rounded-full blur-[130px] mix-blend-screen" />
          </>
        )}
        {activeVibe === "rainy" && (
          <>
            {/* Subtle physical rain streaks and drops on window */}
            <div className="absolute inset-0 opacity-[0.12] bg-[linear-gradient(105deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.8)_50%,rgba(255,255,255,0)_100%)] bg-[size:100px_350px]" />
            <div className="absolute top-[10%] left-[30%] w-[1.5px] h-[120px] bg-sky-200/20 blur-[0.5px]" />
            <div className="absolute top-[50%] left-[80%] w-[2.5px] h-[160px] bg-sky-200/15 blur-[0.5px]" />
            <div className="absolute bottom-[10%] left-[15%] w-[1px] h-[90px] bg-sky-200/20" />
            <div className="absolute bottom-[40%] right-[25%] w-[1.5px] h-[140px] bg-sky-200/25 blur-[1px]" />
          </>
        )}
        {(activeVibe === "retro" || activeVibe === "maincharacter") && (
          /* Warm Window Light beam casting from side */
          <div 
            className="absolute top-0 right-0 w-[60%] h-[120%] bg-amber-500/[0.08] mix-blend-screen pointer-events-none origin-top-right scale-y-110 rotate-12 filter blur-[24px]" 
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 80%, 40% 100%)" }}
          />
        )}
        {activeVibe === "dreamy" && (
          /* Sunset Haze pastel gradients */
          <>
            <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-violet-500/20 rounded-full blur-[110px] mix-blend-screen" />
            <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-amber-400/10 rounded-full blur-[100px] mix-blend-screen" />
          </>
        )}
        {activeVibe === "anime" && (
          <>
            <div className="absolute inset-0 bg-black/45 mix-blend-color-burn" />
            {/* Drifting petals */}
            <div className="absolute top-[12%] left-[18%] w-2 h-1.5 bg-pink-300 rounded-full opacity-70 animate-pulse" />
            <div className="absolute top-[40%] right-[12%] w-2.5 h-2 bg-rose-300 rounded-full opacity-60" />
            <div className="absolute bottom-[22%] left-[25%] w-2 h-2 bg-pink-200 rounded-full opacity-50" />
          </>
        )}
        {activeVibe === "retro" && (
          <div className="absolute inset-0 opacity-[0.06] bg-amber-950 bg-[radial-gradient(rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:16px_16px]" />
        )}
      </div>
    );

    // ==========================================
    // 1. NIGHT DRIVE (Motion, City Lights, Neon Reflections)
    // ==========================================
    if (activeVibe === "nightdrive") {
      return (
        <div className={`${backgroundWrapperClasses} bg-[#030107]`} style={{ color: "#00f2fe" }}>
          {backgroundTextureLayer}

          {/* 80% Emotion Area */}
          <div className="h-[80%] flex flex-col items-center justify-center relative z-10 text-center px-6">
            {/* Smaller, borderless square artwork with neon glow (reduced prominence by 50%) */}
            <div className="relative mb-6 sm:mb-8">
              <div className="absolute inset-[-10px] bg-gradient-to-r from-fuchsia-500 to-cyan-400 blur-xl opacity-40 scale-105" />
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-white/10 shadow-[0_8px_20px_rgba(0,242,254,0.15)]">
                <img 
                  src={coverSource}
                  className="w-full h-full object-cover filter saturate-[1.2] brightness-95" 
                  referrerPolicy="no-referrer"
                  alt="" 
                />
              </div>
            </div>

            {/* Cinematic neon typographic statement */}
            <div className="max-w-xs space-y-3 sm:space-y-4">
              <span className="text-[8px] uppercase font-mono font-black tracking-[0.4em] text-cyan-400 opacity-90 block">
                MIDNIGHT VELOCITY
              </span>
              <p className={getQuoteClassName("nightdrive", "font-sans font-black tracking-tight text-xl sm:text-2xl text-white uppercase leading-snug drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]", textTransform)}>
                &ldquo;{poeticVibeCaption}&rdquo;
              </p>
            </div>
          </div>

          {/* 20% Song Identity Area */}
          <div className="h-[20%] flex items-end justify-center w-full relative z-10 border-t border-cyan-500/5 pt-4 sm:pt-6 pb-2 mt-auto">
            <div className="flex items-center gap-4 text-left max-w-sm w-full font-mono opacity-80">
              <img 
                src={coverSource}
                className="w-8 h-8 rounded-md object-cover border border-white/20 select-none shrink-0" 
                referrerPolicy="no-referrer"
                alt="" 
              />
              <div className="truncate">
                <h2 className="text-xs font-bold text-white tracking-wider truncate leading-tight uppercase">
                  {originalTitle}
                </h2>
                <p className="text-[8px] tracking-widest text-[#00f2fe] font-bold uppercase truncate mt-0.5">
                  {originalArtist}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ==========================================
    // 3. RAINY EVENING (Loneliness, Rain, Silence, Distance)
    // ==========================================
    if (activeVibe === "rainy") {
      return (
        <div className={`${backgroundWrapperClasses} bg-[#040810]`} style={{ color: "#cbd5e1" }}>
          {backgroundTextureLayer}

          {/* 80% Emotion Area */}
          <div className="h-[80%] flex flex-col items-center justify-center relative z-10 text-center px-8">
            {/* Small isolated lonely square in center (reduced prominence by 50%) */}
            <div className="relative mb-6 sm:mb-8">
              <div className="w-14 h-14 sm:w-16 sm:h-16 overflow-hidden border border-white/5 bg-slate-950/40 shadow-[0_10px_25px_rgba(0,0,0,0.45)]">
                <img 
                  src={coverSource}
                  className="w-full h-full object-cover filter brightness-[0.65] saturate-[0.8] contrast-[1.02]" 
                  referrerPolicy="no-referrer"
                  alt="" 
                />
              </div>
            </div>

            {/* Quiet, empty space quote */}
            <div className="max-w-xs space-y-3 sm:space-y-4">
              <span className="text-[8px] uppercase font-mono font-light tracking-[0.35em] text-zinc-500 block">
                IN ABSOLUTE SILENCE
              </span>
              <p className={getQuoteClassName("rainy", "font-serif italic font-light text-xl sm:text-2xl text-zinc-350 leading-relaxed tracking-wide drop-shadow-md", textTransform)}>
                &ldquo;{poeticVibeCaption}&rdquo;
              </p>
            </div>
          </div>

          {/* 20% Song Identity Area */}
          <div className="h-[20%] flex items-end justify-center w-full relative z-10 border-t border-white/5 pt-4 sm:pt-6 pb-2 mt-auto">
            <div className="flex items-center gap-4 text-left max-w-sm w-full font-mono opacity-80">
              <img 
                src={coverSource}
                className="w-8 h-8 object-cover border border-white/10 select-none shrink-0" 
                referrerPolicy="no-referrer"
                alt="" 
              />
              <div className="truncate">
                <h2 className="text-xs font-semibold text-zinc-300 tracking-wide truncate leading-tight lowercase">
                  {originalTitle.toLowerCase()}
                </h2>
                <p className="text-[8px] tracking-widest text-[#cbd5e1]/50 font-bold uppercase truncate mt-0.5">
                  {originalArtist}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ==========================================
    // 4. MAIN CHARACTER (Golden Awakening / Sunrise)
    // ==========================================
    if (activeVibe === "maincharacter") {
      return (
        <div className={`${backgroundWrapperClasses} bg-[#130b05]`} style={{ color: "#faf9f5" }}>
          {backgroundTextureLayer}

          {/* 80% Emotion Area */}
          <div className="h-[80%] flex flex-col items-center justify-center relative z-10 text-center px-6">
            {/* Elegant, tall double-exposed styled artwork segment (reduced prominence by 50%) */}
            <div className="relative mb-6 sm:mb-8">
              <div className="absolute inset-0 bg-amber-500/10 blur-xl scale-110" />
              <div className="w-[65px] h-[90px] sm:w-[75px] sm:h-[100px] overflow-hidden border border-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.35)]">
                <img 
                  src={coverSource}
                  className="w-full h-full object-cover filter saturate-[1.05]" 
                  referrerPolicy="no-referrer"
                  alt="" 
                />
              </div>
            </div>

            {/* Elegant editorial quote typography */}
            <div className="max-w-xs space-y-3 sm:space-y-4">
              <span className="text-[8px] uppercase font-sans font-black tracking-[0.4em] text-amber-400 opacity-90 block">
                GOLDEN HOUR GLOW
              </span>
              <p className={getQuoteClassName("maincharacter", "font-playfair font-semibold italic text-xl sm:text-2xl text-[#f5ebd1] leading-relaxed tracking-tight drop-shadow-md", textTransform)}>
                &ldquo;{poeticVibeCaption}&rdquo;
              </p>
            </div>
          </div>

          {/* 20% Song Identity Area */}
          <div className="h-[20%] flex items-end justify-center w-full relative z-10 border-t border-[#ebdcb9]/5 pt-4 sm:pt-6 pb-2 mt-auto">
            <div className="flex items-center gap-4 text-left max-w-sm w-full font-serif opacity-85">
              <img 
                src={coverSource}
                className="w-8 h-8 object-cover border border-white/10 select-none shrink-0" 
                referrerPolicy="no-referrer"
                alt="" 
              />
              <div className="truncate">
                <h2 className="text-xs font-extrabold text-white tracking-normal truncate leading-tight uppercase">
                  {originalTitle}
                </h2>
                <p className="text-[8px] font-sans font-extrabold tracking-[0.25em] text-[#ebdcb9] uppercase truncate mt-0.5">
                  {originalArtist}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ==========================================
    // 5. ANIME CREDITS (Nostalgic Sky Outro)
    // ==========================================
    if (activeVibe === "anime") {
      return (
        <div className={`${backgroundWrapperClasses} bg-[#060412]`} style={{ color: "#fae8ff" }}>
          {backgroundTextureLayer}

          {/* 80% Emotion Area */}
          <div className="h-[80%] flex flex-col items-center justify-center relative z-10 text-center px-6">
            {/* Round soft portrait with dream glow (reduced prominence by 50%) */}
            <div className="relative mb-6 sm:mb-8">
              <div className="absolute inset-[-10px] rounded-full bg-pink-400/20 blur-xl animate-pulse-slow" />
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-pink-300">
                <img 
                  src={coverSource}
                  className="w-full h-full object-cover filter saturate-[1.1] contrast-[1.02]" 
                  referrerPolicy="no-referrer"
                  alt="" 
                />
              </div>
            </div>

            {/* Subtitle-like atmospheric quote box */}
            <div className="max-w-sm w-full my-3 sm:my-4 bg-black/45 border border-white/5 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
              <p className={getQuoteClassName("anime", "font-serif italic text-pink-50 leading-relaxed text-base sm:text-lg", textTransform)}>
                &ldquo;{poeticVibeCaption}&rdquo;
              </p>
            </div>
          </div>

          {/* 20% Song Identity Area */}
          <div className="h-[20%] flex items-end justify-center w-full relative z-10 border-t border-white/5 pt-4 sm:pt-6 pb-2 mt-auto">
            <div className="flex items-center gap-4 text-left max-w-sm w-full font-serif opacity-80">
              <img 
                src={coverSource}
                className="w-8 h-8 rounded-full object-cover border border-white/10 select-none shrink-0" 
                referrerPolicy="no-referrer"
                alt="" 
              />
              <div className="truncate">
                <h2 className="text-xs font-light italic text-white tracking-wide truncate leading-tight">
                  {originalTitle.toLowerCase()}
                </h2>
                <p className="text-[8px] font-mono font-bold tracking-[0.25em] text-pink-300/60 uppercase truncate mt-0.5">
                  {originalArtist}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ==========================================
    // 6. ETHEREAL DUSK (Celestial Nebula)
    // ==========================================
    if (activeVibe === "dreamy") {
      return (
        <div className={`${backgroundWrapperClasses} bg-[#04010a]`} style={{ color: "#eae2f8" }}>
          {backgroundTextureLayer}

          {/* 80% Emotion Area */}
          <div className="h-[80%] flex flex-col items-center justify-center relative z-10 text-center px-6">
            {/* Luminous floating celestial orb (reduced prominence by 50%) */}
            <div className="relative mb-6 sm:mb-8">
              <div className="absolute inset-[-12px] rounded-full bg-indigo-500/15 blur-2xl animate-pulse-slow" />
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-indigo-400 p-[2px] bg-black/60 shadow-[0_0_20px_rgba(167,139,250,0.25)]">
                <img 
                  src={coverSource}
                  className="w-full h-full object-cover rounded-full" 
                  referrerPolicy="no-referrer"
                  alt="" 
                />
              </div>
            </div>

            {/* Ethereal poetic quote */}
            <div className="max-w-xs space-y-3 sm:space-y-4">
              <span className="text-[8px] uppercase font-mono font-black tracking-[0.4em] text-purple-400 opacity-90 block animate-pulse">
                ASTRO SPHERE
              </span>
              <p className={getQuoteClassName("dreamy", "font-serif italic font-light text-xl sm:text-2xl text-violet-50 leading-relaxed tracking-wider drop-shadow-md", textTransform)}>
                &ldquo;{poeticVibeCaption}&rdquo;
              </p>
            </div>
          </div>

          {/* 20% Song Identity Area */}
          <div className="h-[20%] flex items-end justify-center w-full relative z-10 border-t border-purple-500/5 pt-4 sm:pt-6 pb-2 mt-auto">
            <div className="flex items-center gap-4 text-left max-w-sm w-full font-sans opacity-80">
              <img 
                src={coverSource}
                className="w-8 h-8 rounded-full object-cover border border-white/10 select-none shrink-0" 
                referrerPolicy="no-referrer"
                alt="" 
              />
              <div className="truncate">
                <h2 className="text-xs font-light text-white tracking-widest uppercase truncate leading-tight">
                  {originalTitle}
                </h2>
                <p className="text-[8px] font-mono font-bold tracking-[0.2em] text-violet-300 uppercase truncate mt-0.5">
                  {originalArtist}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ==========================================
    // 7. VINTAGE POLAROID (Handwritten Memory)
    // ==========================================
    return (
      <div className={`${backgroundWrapperClasses} bg-[#faf5ea]`} style={{ color: "#3e2723" }}>
        {backgroundTextureLayer}

        {/* 80% Emotion Area */}
        <div className="h-[80%] flex flex-col items-center justify-center relative z-10 text-center px-6">
          {/* Flat Polarized memory block floating natively (reduced prominence by 50%) */}
          <div 
            className="bg-[#faf8f4] p-[6px] pb-4 border border-stone-200/60 shadow-[0_8px_20px_rgba(0,0,0,0.06)] relative mb-6 sm:mb-8"
            style={{ transform: "rotate(-1.5deg)" }}
          >
            {/* Tape lookalike overlay */}
            <div className="absolute -top-2 left-1/4 w-8 h-2.5 bg-[#ebdcb9]/40 border border-[#dfcda2]/30 rounded-sm shadow-inner z-20 pointer-events-none transform -rotate-12 select-none" />
            
            <div className="w-[70px] h-[70px] sm:w-[80px] sm:h-[80px] bg-stone-900 border border-stone-150 overflow-hidden">
              <img 
                src={coverSource}
                className="w-full h-full object-cover filter sepia-[20%] contrast-[1.01]" 
                referrerPolicy="no-referrer"
                alt="" 
              />
            </div>
          </div>

          {/* Simple typewriter handwriting text */}
          <div className="max-w-xs space-y-3 sm:space-y-4">
            <span className="text-[8px] uppercase font-mono font-black tracking-[0.3em] text-[#795548]/70 block">
              ANALOG ARCHIVE
            </span>
            <p className={getQuoteClassName("retro", "font-serif italic text-stone-850 text-xl sm:text-2xl leading-relaxed tracking-tight", textTransform)}>
              &ldquo;{poeticVibeCaption}&rdquo;
            </p>
          </div>
        </div>

        {/* 20% Song Identity Area */}
        <div className="h-[20%] flex items-end justify-center w-full relative z-10 border-t border-[#795548]/10 pt-4 sm:pt-6 pb-2 mt-auto">
          <div className="flex items-center gap-4 text-left max-w-sm w-full font-serif opacity-80">
            <img 
              src={coverSource}
              className="w-8 h-8 object-cover border border-[#795548]/20 select-none shrink-0" 
              referrerPolicy="no-referrer"
              alt="" 
              />
            <div className="truncate">
              <h2 className="text-xs font-bold text-stone-900 tracking-wide truncate leading-tight">
                {originalTitle.toLowerCase()}
              </h2>
              <p className="text-[8px] font-mono tracking-widest text-[#795548] font-bold uppercase truncate mt-0.5">
                {originalArtist}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      
      {/* Background decoration flares */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-pink-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-rose-500/5 blur-[180px] pointer-events-none" />
      
      {/* Outer container */}
      <div className="relative w-full max-w-4xl bg-zinc-950/80 border border-white/5 rounded-none sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col min-h-screen sm:min-h-0 z-10">
        
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          id="btn-close-story-modal"
          className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Studio grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 items-center justify-center">
          
          {/* LEFT PORT: Highly scaled premium portrait aspect ratio box */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-4">
            
            <div 
              id="active-story-portrait-preview"
              className="w-[280px] h-[497px] sm:w-[320px] sm:h-[569px] rounded-[32px] border border-white/10 relative overflow-hidden shadow-[0_30px_100px_rgba(244,63,94,0.15)] select-none transition-all duration-300 hover:scale-[1.01]"
              style={{
                fontSize: "8.5px"
              }}
            >
              <motion.div
                key={activeVibe + entranceAnimation}
                variants={{
                  fade: {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    transition: { duration: 0.6, ease: "easeOut" }
                  },
                  slideUp: {
                    initial: { opacity: 0, y: 32 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] }
                  },
                  scaleIn: {
                    initial: { opacity: 0, scale: 0.92 },
                    animate: { opacity: 1, scale: 1 },
                    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] }
                  }
                }}
                className="w-full h-full"
                initial="initial"
                animate="animate"
              >
                {renderCardBody("preview")}
              </motion.div>
            </div>

            <div className="text-[10px] text-zinc-500 font-mono tracking-wider flex items-center gap-1.5 bg-white/5 py-1.5 px-3 rounded-full border border-white/5">
              <Info className="w-3.5 h-3.5 text-zinc-500" />
              HD 1080x1920 Instagram Portrait Aspect
            </div>

          </div>

          {/* RIGHT PORT: Aesthetics & Triggers */}
          <div className="lg:col-span-6 space-y-6">
            
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pink-500/10 text-pink-300 border border-pink-500/15 text-[10px] font-mono font-black uppercase rounded-full tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" /> STORY TELLER STUDIO
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight leading-none font-display">
                Handcrafted Card
              </h2>
              <p className="text-xs text-zinc-450 leading-relaxed max-w-md">
                Generate a dynamic card completely styled by the emotional fingerprint of the track. Fits perfectly into Apple Music, Music Wrapped, and Pinterest aesthetics.
              </p>
            </div>

            {/* Smart vibe indicator with step 1 evaluation detail details */}
            <div className="bg-[#12121a]/85 border border-indigo-500/20 rounded-2xl p-4 space-y-3.5 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                  {isGenerating ? (
                    <Loader2 className="w-4.5 h-4.5 text-indigo-400 animate-spin" />
                  ) : (
                    <Palette className="w-4.5 h-4.5 text-indigo-400" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 font-bold tracking-wider">STEP 1: EMOTIONAL ANALYSIS</span>
                  <p className="text-xs text-zinc-300 font-bold">
                    Vibe Evaluation: <span className="text-indigo-400">{autoMatchedLabel}</span>
                  </p>
                </div>
              </div>

              {/* Step 1 parameters list detail */}
              <div className="border-t border-white/5 pt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[10px] font-mono">
                <div className="flex justify-between border-b border-white/[0.02] pb-1.5 col-span-2">
                  <span className="text-zinc-500">Atmosphere:</span>
                  <span className="text-zinc-300 text-right font-light truncate max-w-[185px]">
                    {computeEmotionalFingerprint(originalTitle, originalArtist, activeVibe, moodAnalysis, seed).atmosphere}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/[0.02] pb-1.5 col-span-2">
                  <span className="text-zinc-500">Color Palette:</span>
                  <span className="text-zinc-300 text-right font-light truncate max-w-[185px]">
                    {computeEmotionalFingerprint(originalTitle, originalArtist, activeVibe, moodAnalysis, seed).colorPaletteName}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/[0.02] pb-1.5 col-span-2">
                  <span className="text-zinc-500">Cinematic Style:</span>
                  <span className="text-zinc-300 text-right font-light truncate max-w-[185px]">
                    {computeEmotionalFingerprint(originalTitle, originalArtist, activeVibe, moodAnalysis, seed).cinematicStyle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nostalgia Level:</span>
                  <span className="text-amber-400 font-bold">
                    {computeEmotionalFingerprint(originalTitle, originalArtist, activeVibe, moodAnalysis, seed).nostalgiaPct}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Romantic Level:</span>
                  <span className="text-rose-400 font-bold">
                    {computeEmotionalFingerprint(originalTitle, originalArtist, activeVibe, moodAnalysis, seed).romanticPct}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Energy Level:</span>
                  <span className="text-cyan-400 font-bold">
                    {computeEmotionalFingerprint(originalTitle, originalArtist, activeVibe, moodAnalysis, seed).energyPct}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Mood intensity:</span>
                  <span className="text-[#a78bfa] font-bold capitalize">
                    {intensity}
                  </span>
                </div>
              </div>
            </div>

            {/* Aesthetic Selector */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">
                STEP 2: Choose Aesthetic Emotion Preset (Overide)
              </label>
              
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { value: "surprise", label: "Automatic Fingerprint", emoji: "🎲" },
                  { value: "nightdrive", label: "Night Drive (Neon)", emoji: "🌌" },
                  { value: "rainy", label: "Rainy Evening (Lofi)", emoji: "🌧️" },
                  { value: "maincharacter", label: "Main Character", emoji: "✨" },
                  { value: "anime", label: "Anime Credits", emoji: "🌸" },
                  { value: "dreamy", label: "Ethereal Dusk", emoji: "🔮" },
                  { value: "retro", label: "Vintage Polaroid", emoji: "🎞️" }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setSelectedVibe(item.value as SelectedVibeType)}
                    className={`p-3 rounded-xl text-[11px] font-bold font-mono tracking-wider uppercase transition-all flex items-center gap-2.5 cursor-pointer border ${
                      selectedVibe === item.value
                        ? "bg-gradient-to-r from-pink-500/15 to-rose-500/15 border-pink-500/50 text-pink-300 font-black shadow-lg shadow-pink-500/5"
                        : "bg-white/5 border-white/5 hover:bg-white/10 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <span className="text-sm">
                      {item.emoji}
                    </span>
                    <span className="truncate">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Entrance Transition Selector */}
            <div className="space-y-2.5 pt-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">
                Entrance Presentation Animation
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "fade", label: "Fade-In", emoji: "💨" },
                  { value: "slideUp", label: "Slide-Up", emoji: "⬆️" },
                  { value: "scaleIn", label: "Scale-In", emoji: "🔍" }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setEntranceAnimation(item.value as "fade" | "slideUp" | "scaleIn")}
                    className={`py-2 px-3 rounded-xl text-[10.5px] font-bold font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      entranceAnimation === item.value
                        ? "bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-pink-500/40 text-pink-300 shadow-sm"
                        : "bg-white/5 border-white/5 hover:bg-white/10 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Story Intensity Selector */}
            <div className="space-y-2.5 pt-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">
                Story Mood intensity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "subtle", label: "Subtle", emoji: "💭" },
                  { value: "emotional", label: "Emotional", emoji: "✨" },
                  { value: "dramatic", label: "Dramatic", emoji: "🎬" }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setIntensity(item.value as "subtle" | "emotional" | "dramatic")}
                    className={`py-2 px-3 rounded-xl text-[10.5px] font-bold font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      intensity === item.value
                        ? "bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-pink-500/40 text-pink-300 shadow-sm"
                        : "bg-white/5 border-white/5 hover:bg-white/10 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Poetic Caption Shuffler */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">
                  Step 3: Handcrafted Editorial lyric Caption
                </label>
                <button
                  onClick={handleGenerateNewQuote}
                  className="text-[9px] text-pink-400 hover:text-pink-300 flex items-center gap-1.5 bg-pink-500/10 hover:bg-pink-500/20 px-2.5 py-1 rounded-full transition-colors font-bold cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Shuffle Caption
                </button>
              </div>
              <div className={`bg-white/[0.02] border border-white/5 rounded-2xl p-4 leading-relaxed relative group ${getQuoteClassName(activeVibe, "italic text-[11.5px] text-zinc-300", textTransform)}`}>
                &ldquo;{poeticVibeCaption}&rdquo;
                <div className="absolute top-2.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] font-mono text-zinc-650 uppercase tracking-wider font-semibold">Pinterest Board quote</span>
                </div>
              </div>
            </div>

            {/* Custom Typography Override Controls */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">
                  Step 4: Customize Poster Quote Typography
                </label>
                {selectedTextStyle !== "default" && (
                  <button 
                    onClick={() => { setSelectedTextStyle("default"); setTextTransform("default"); }}
                    className="text-[9px] text-pink-400 hover:text-pink-300 font-mono font-bold tracking-normal uppercase"
                  >
                    Reset Overrides
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "default", label: "Default Vibe", desc: "Adaptive selection" },
                  { value: "serif", label: "Elegant Serif", desc: "Warm romantic flow" },
                  { value: "sans-bold", label: "Space Grotesk", desc: "Bold cinematic" },
                  { value: "mono", label: "Cyberpunk Mono", desc: "Minimal monospace" },
                  { value: "playfair", label: "Playfair Display", desc: "Classic editorial" },
                  { value: "handwritten", label: "Indie Handwritten", desc: "Personal diary" },
                  { value: "editorial", label: "Display Serif", desc: "Onyx magazine focus" },
                  { value: "syne", label: "Brutalist Syne", desc: "Alternative heavy weight" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setSelectedTextStyle(item.value)}
                    className={`p-2 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-center ${
                      selectedTextStyle === item.value
                        ? "bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-pink-500/40 text-pink-300"
                        : "bg-white/5 border-white/5 hover:bg-white/10 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <span className="text-[11px] font-bold font-mono tracking-wider">{item.label}</span>
                    <span className="text-[8.5px] font-mono text-zinc-500 mt-0.5 truncate max-w-[125px]">{item.desc}</span>
                  </button>
                ))}
              </div>

              {/* Case options */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { value: "default", label: "Vibe Case" },
                  { value: "normal", label: "Normal" },
                  { value: "lowercase", label: "lowercase" },
                  { value: "uppercase", label: "UPPERCASE" }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setTextTransform(item.value)}
                    className={`py-1.5 rounded-lg text-[9px] font-bold font-mono tracking-wider uppercase transition-all text-center cursor-pointer border ${
                      textTransform === item.value
                        ? "bg-pink-500/15 border-pink-500/30 text-pink-300"
                        : "bg-white/[0.03] border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Song cover box */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <img src={finalArtwork} className="w-12 h-12 rounded-xl object-cover shadow-md" referrerPolicy="no-referrer" alt="" />
              <div className="truncate">
                <p className="text-white font-black text-sm truncate leading-snug">{originalTitle}</p>
                <p className="text-[11px] text-zinc-450 font-mono tracking-wide mt-1.5 truncate leading-none">{originalArtist}</p>
              </div>
            </div>

            {/* Instant Actions row */}
            <div className="space-y-2.5 pt-2">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">
                One-Click Export &amp; share
              </label>

              <div className="space-y-2">
                <button
                  onClick={handleShareStory}
                  disabled={isGenerating}
                  className="w-full py-4 rounded-2xl text-xs font-black font-mono uppercase bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:shadow-xl hover:shadow-pink-500/10 text-white flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
                  ) : (
                    <Share2 className="w-4.5 h-4.5 text-white" />
                  )}
                  {shareSupported ? "📸 Share to Stories Instantly" : "📸 Generate and Share Story"}
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="py-3 px-4 rounded-xl text-xs font-bold font-mono uppercase bg-white hover:bg-neutral-200 text-black transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <Download className="w-4 h-4 text-black" />
                    )}
                    Save PNG Photo
                  </button>

                  <button
                    onClick={handleCopyImage}
                    disabled={isGenerating}
                    className={`py-3 px-4 rounded-xl text-xs font-bold font-mono uppercase border transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                      copiedImage 
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-lg" 
                        : "bg-zinc-900 border-white/10 hover:bg-zinc-800 text-zinc-200"
                    }`}
                  >
                    {copiedImage ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-zinc-400" />
                        Copy Image
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-xl text-xs font-black font-mono uppercase bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white transition-all flex items-center justify-center gap-2.5 cursor-pointer mt-1"
                >
                  ← Return to Studio
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================= */}
      {/* 1080x1920 COMPILATION TARGET EXPORTER (HIDDEN LAYER)   */}
      {/* ======================================================= */}
      <div 
        id="pristine-high-res-story-exporter"
        ref={hiddenCanvasRef}
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          width: "1080px",
          height: "1920px",
        }}
        className="overflow-hidden select-none"
      >
        <div className="w-[1080px] h-[1920px] relative bg-black">
          {renderCardBody("exporter")}
        </div>
      </div>

    </div>
  );
}
