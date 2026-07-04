import React from "react";
import { motion } from "motion/react";
import { EditorialAnalysis } from "../types";

interface EmotionDnaCardProps {
  analysis?: EditorialAnalysis;
  songName?: string;
  artist?: string;
}

export function getSonicProfile(songName: string, artist: string, currentFeeling?: string): string[] {
  const hash = songName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + 
               artist.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const lowerArtist = artist.toLowerCase();
  if (lowerArtist.includes("sid sriram") || lowerArtist.includes("pradeep") || lowerArtist.includes("ghibran") || lowerArtist.includes("arrijit") || lowerArtist.includes("sriram") || lowerArtist.includes("rahman")) {
    return [
      "• Lush acoustic strings",
      "• Organic woodwind arrangements",
      "• Intimate vocal delivery",
      "• Slow melodic build",
      "• Tactile acoustic percussion",
      "• Reverb-heavy soundstage",
      "• Cinematic stereo mix"
    ];
  } else if (lowerArtist.includes("jungkook") || lowerArtist.includes("jimin") || lowerArtist.includes("bts") || lowerArtist.includes("iu") || lowerArtist.includes("dean") || lowerArtist.includes("heize")) {
    return [
      "• Rainy lofi rhythm structures",
      "• Muted rhodes electric piano",
      "• Intimate, close-mic vocals",
      "• Warm analog bass tones",
      "• Late-night bedroom R&B ambience",
      "• Subtle vinyl crackle textures",
      "• Silky multi-tracked harmonies"
    ];
  } else if (lowerArtist.includes("arctic monkeys") || lowerArtist.includes("strokes") || lowerArtist.includes("interpol") || lowerArtist.includes("national")) {
    return [
      "• Overdriven indie guitar textures",
      "• Driving, tight drum patterns",
      "• Warm analog bassline",
      "• Gritty post-punk atmosphere",
      "• Post-punk guitar leads",
      "• Raw vocal recording style",
      "• Mid-tempo dynamic build"
    ];
  } else if (lowerArtist.includes("kavinsky") || lowerArtist.includes("daft punk") || lowerArtist.includes("justice") || lowerArtist.includes("m83") || lowerArtist.includes("the xx")) {
    return [
      "• Warm analog synthesizer layers",
      "• Pulsing electronic percussion",
      "• Reverb-heavy, spacious atmosphere",
      "• Late-night driving tempo",
      "• Dreamy guitar textures",
      "• Cinematic stereo mix",
      "• Retro-futuristic sound signature"
    ];
  }

  const guitars = ["• Dreamy guitar textures", "• Warm acoustic strumming", "• Echoing electric guitar leads", "• Clean, modulated guitar tones"];
  const synths = ["• Ambient synth layers", "• Warm analog pad swells", "• Shimmering lead synthesizers", "• Retro synthesizer textures"];
  const drums = ["• Minimal percussion", "• Tight electronic drum loops", "• Restrained acoustic rhythms", "• Driving mid-tempo percussion"];
  const vocals = ["• Intimate vocal delivery", "• Whispered vocal styling", "• Airy multi-tracked harmonies", "• Sincere close-mic singing"];
  const ambiance = ["• Late-night ambience", "• Reverb-heavy atmosphere", "• Nocturnal space", "• Cozy intimate bedroom vibe"];
  const production = ["• Warm analog production", "• Cinematic stereo mix", "• Vintage tape saturation", "• Crisp high-fidelity recording"];
  const structure = ["• Slow emotional build", "• Dynamic arrangement shifts", "• Crescendo-focused progression", "• Hypnotic repetitive groove"];

  return [
    hash % 2 === 0 ? guitars[hash % guitars.length] : synths[hash % synths.length],
    production[hash % production.length],
    ambiance[(hash + 1) % ambiance.length],
    drums[(hash + 2) % drums.length],
    vocals[(hash + 3) % vocals.length],
    structure[(hash + 4) % structure.length],
    hash % 3 === 0 ? "• Delicate piano keys" : "• Rich low-end balance"
  ].filter(Boolean);
}

export default function EmotionDnaCard({ analysis, songName, artist }: EmotionDnaCardProps) {
  if (!analysis) return null;

  const resolvedSong = songName || "Active Track";
  const resolvedArtist = artist || "";
  
  // Get either generated or pre-analyzed profile
  const profilePoints = analysis.sonicProfile || getSonicProfile(resolvedSong, resolvedArtist, analysis.currentFeeling);

  return (
    <motion.div
      id="sonic-profile-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white p-6 rounded-[24px] border border-[#ECECEC] space-y-6 w-full shadow-sm"
    >
      {/* Title */}
      <div className="border-b border-[#F5F5F3] pb-4 flex items-baseline justify-between">
        <h3 id="sonic-profile-heading" className="font-sans text-xs font-bold text-[#111111] tracking-widest uppercase">
          SONIC PROFILE
        </h3>
        <span className="text-[9px] text-[#8B5CF6] font-mono tracking-widest uppercase font-bold">
          Acoustic Signature
        </span>
      </div>

      {/* Description / Situation */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B6B6B] font-bold block">
          Arrangement & Production
        </span>
        <p className="text-sm font-sans text-[#111111] leading-relaxed font-semibold">
          {analysis.situation}
        </p>
      </div>

      {/* Sonic Profile Bullet List */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B6B6B] font-bold block">
          Key Sound Signatures
        </span>
        <ul className="grid grid-cols-1 gap-2 pt-1">
          {profilePoints.map((point, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="text-xs text-[#4A4A4A] font-sans flex items-center gap-2 font-medium"
            >
              <span className="text-[#8B5CF6] font-bold">•</span>
              <span>{point.replace(/^[•\s]+/, "")}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Additional Technical Insights */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F5F5F3]">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B6B6B] font-bold block">
            Core Texture
          </span>
          <span className="text-xs font-sans font-bold text-[#8B5CF6] uppercase tracking-wide">
            {analysis.currentFeeling}
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B6B6B] font-bold block">
            Target Signature
          </span>
          <span className="text-xs font-sans text-[#4A4A4A] font-medium leading-normal block">
            {analysis.lookingFor}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
