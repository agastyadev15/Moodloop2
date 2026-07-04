export interface ThemePalette {
  primary: string;           // E.g., '#818cf8' (indigo-400)
  accent: string;            // E.g., '#ec4899' (pink-500)
  bgGradient: string;        // Tailwind gradient string
  glowColor: string;         // E.g., 'rgba(99, 102, 241, 0.4)'
  badgeClass: string;        // Badge classes
  radialStop1: string;       // Radial ring gradient stops
  radialStop2: string;
}

// Preset dynamic luxurious color themes
export const THEME_PALETTES: ThemePalette[] = [
  {
    primary: "#10b981", // Emerald/Mint
    accent: "#34d399",
    bgGradient: "from-[#061c12] via-[#030906] to-[#010101]",
    glowColor: "rgba(16, 185, 129, 0.4)",
    badgeClass: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/25 shadow-[#10b981]/10",
    radialStop1: "#10b981",
    radialStop2: "#059669"
  },
  {
    primary: "#a855f7", // Purple/Violet
    accent: "#ec4899",
    bgGradient: "from-[#110c1c] via-[#07050d] to-[#030304]",
    glowColor: "rgba(168, 85, 247, 0.45)",
    badgeClass: "bg-purple-500/10 text-purple-300 border-purple-500/25 shadow-purple-500/10",
    radialStop1: "#a855f7",
    radialStop2: "#ec4899"
  },
  {
    primary: "#f43f5e", // Crimson/Rose
    accent: "#f59e0b",
    bgGradient: "from-[#1c080e] via-[#0b0306] to-[#030102]",
    glowColor: "rgba(244, 63, 94, 0.45)",
    badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/25 shadow-rose-500/10",
    radialStop1: "#f43f5e",
    radialStop2: "#fb923c"
  },
  {
    primary: "#3b82f6", // Twilight Sunset Orange & Blue
    accent: "#6366f1",
    bgGradient: "from-[#051124] via-[#020612] to-[#010103]",
    glowColor: "rgba(59, 130, 246, 0.4)",
    badgeClass: "bg-blue-500/10 text-blue-300 border-blue-500/25 shadow-blue-500/10",
    radialStop1: "#3b82f6",
    radialStop2: "#8b5cf6"
  },
  {
    primary: "#14b8a6", // Glacier Cyan / Teal
    accent: "#06b6d4",
    bgGradient: "from-[#041618] via-[#02090b] to-[#010102]",
    glowColor: "rgba(20, 184, 166, 0.4)",
    badgeClass: "bg-teal-500/10 text-teal-300 border-teal-500/25 shadow-teal-500/10",
    radialStop1: "#14b8a6",
    radialStop2: "#06b6d4"
  }
];

/**
 * Extracts a robust luxurious color theme from an album's art/title keywords,
 * fallback hashing is used to guarantee 100% beautiful outputs without pixel-CORS issues.
 */
export function extractAlbumTheme(songName: string = "", artist: string = ""): ThemePalette {
  const combined = `${songName} ${artist}`.toLowerCase();
  
  if (combined.includes("midnight") || combined.includes("synth") || combined.includes("dreaming") || combined.includes("m83")) {
    return THEME_PALETTES[1]; // Twilight purple/violet
  }
  if (combined.includes("ocean") || combined.includes("blue") || combined.includes("rain") || combined.includes("sad")) {
    return THEME_PALETTES[3]; // Twilight deep blue
  }
  if (combined.includes("love") || combined.includes("romance") || combined.includes("rose") || combined.includes("fire")) {
    return THEME_PALETTES[2]; // Deep Rose Crimson
  }
  if (combined.includes("glacier") || combined.includes("chill") || combined.includes("ambient")) {
    return THEME_PALETTES[4]; // Cozy Greenland Cyan/Teal
  }

  // Fallback hash
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % THEME_PALETTES.length;
  return THEME_PALETTES[index];
}
