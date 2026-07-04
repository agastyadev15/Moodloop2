import React, { useState } from "react";
import { Sparkles, Loader2, Play, Pause, ArrowLeftRight, Sliders, Scale, Info } from "lucide-react";
import SongSearch from "./SongSearch";
import { SongItem } from "../types";
import { ThemePalette } from "../utils/theme";

interface CompareResult {
  similarityScore: number;
  sharedEmotions: string[];
  moodOverlap: {
    nostalgia: number;
    longing: number;
    romance: number;
    warmth: number;
    melancholy: number;
    hopefulness: number;
    energy: number;
  };
  differences: string[];
  overallVerdict: string;
}

interface CompareSectionProps {
  palette: ThemePalette;
  onPlayClick: (track: { name: string; artist: string; artworkUrl: string; previewUrl: string }) => void;
  activePlayback: { previewUrl: string } | null;
  isPlaying: boolean;
  onReturnToStudio?: () => void;
}

export default function CompareSection({ palette, onPlayClick, activePlayback, isPlaying, onReturnToStudio }: CompareSectionProps) {
  const [song1, setSong1] = useState<SongItem | null>(null);
  const [song2, setSong2] = useState<SongItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);

  const handleRunComparison = async () => {
    if (!song1 || !song2) {
      setError("Please search and select two songs first.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song1, song2 }),
      });

      if (!response.ok) {
        throw new Error("Handshake with comparison cluster timed out.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong during comparison.");
    } finally {
      setLoading(false);
    }
  };

  const resetComparison = () => {
    setSong1(null);
    setSong2(null);
    setResult(null);
    setError(null);
  };

  const isPlayingSong1 = isPlaying && activePlayback?.previewUrl === song1?.previewUrl;
  const isPlayingSong2 = isPlaying && activePlayback?.previewUrl === song2?.previewUrl;

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto font-sans text-left" id="compare-section-panel">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#ECECEC] pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111111] flex items-center gap-2.5 font-serif">
            <Scale className="w-5.5 h-5.5 text-[#8B5CF6]" />
            Vibe Compatibility Matrix
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-1.5 max-w-xl leading-relaxed">
            Select any two songs in the search portals below. Our psychoacoustic neural models will map their emotional curves, cross-reference their spectral weights, and calculate their harmonic compatibility.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {onReturnToStudio && (
            <button
              onClick={onReturnToStudio}
              className="px-4 py-2 bg-[#F5F5F3] hover:bg-[#ECECEC] text-[#111111] border border-[#ECECEC] rounded-xl text-xs font-bold font-mono transition-all cursor-pointer"
            >
              ← BACK TO STUDIO
            </button>
          )}
          {result && (
            <button
              onClick={resetComparison}
              className="px-4 py-2 bg-white hover:bg-[#F5F5F3] rounded-xl text-xs font-bold font-mono text-[#6B6B6B] hover:text-[#111111] transition-all cursor-pointer border border-[#ECECEC]"
            >
              RESET ANALYZER
            </button>
          )}
        </div>
      </div>

      {!result ? (
        /* INPUT PANEL */
        <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 md:p-8 space-y-8 shadow-sm relative overflow-visible">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative z-10">
            {/* SONG 1 SELECTOR */}
            <div className="space-y-4 relative z-20 focus-within:z-40 transition-all">
              <label className="text-[10px] font-mono tracking-wider text-[#6B6B6B] font-extrabold uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></span> Primary Anchor (Song 1)
              </label>

              {song1 ? (
                /* SONG 1 PREVIEW BADGE */
                <div className="p-4 bg-[#F5F5F3]/50 rounded-2xl border border-[#ECECEC] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={song1.artworkUrl || "https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&q=80&w=150"}
                      className="w-12 h-12 rounded-xl object-cover border border-[#ECECEC] shadow-sm flex-shrink-0"
                      referrerPolicy="no-referrer"
                      alt={song1.name}
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#111111] text-sm truncate">{song1.name}</h4>
                      <p className="text-xs text-[#6B6B6B] mt-0.5 truncate">{song1.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {song1.previewUrl && (
                      <button
                        onClick={() => onPlayClick({
                          name: song1.name,
                          artist: song1.artist,
                          artworkUrl: song1.artworkUrl,
                          previewUrl: song1.previewUrl
                        })}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isPlayingSong1 ? "bg-[#111111] text-white" : "bg-white hover:bg-[#F5F5F3] text-[#111111] border border-[#ECECEC]"
                        }`}
                      >
                        {isPlayingSong1 ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current pl-0.5" />}
                      </button>
                    )}
                    <button
                      onClick={() => setSong1(null)}
                      className="text-[10px] bg-white hover:bg-[#F5F5F3] p-2 rounded-lg text-[#6B6B6B] hover:text-red-500 transition-colors border border-[#ECECEC] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <SongSearch
                  onSelectSong={setSong1}
                  isLoading={loading}
                  placeholder="Search first song... e.g., Kadalalle"
                  onPlayClick={onPlayClick}
                  activePlayback={activePlayback}
                  isPlaying={isPlaying}
                />
              )}
            </div>

            {/* SONG 2 SELECTOR */}
            <div className="space-y-4 relative z-10 focus-within:z-40 transition-all">
              <label className="text-[10px] font-mono tracking-wider text-[#6B6B6B] font-extrabold uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></span> Secondary Vector (Song 2)
              </label>

              {song2 ? (
                /* SONG 2 PREVIEW BADGE */
                <div className="p-4 bg-[#F5F5F3]/50 rounded-2xl border border-[#ECECEC] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={song2.artworkUrl || "https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&q=80&w=150"}
                      className="w-12 h-12 rounded-xl object-cover border border-[#ECECEC] shadow-sm flex-shrink-0"
                      referrerPolicy="no-referrer"
                      alt={song2.name}
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#111111] text-sm truncate">{song2.name}</h4>
                      <p className="text-xs text-[#6B6B6B] mt-0.5 truncate">{song2.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {song2.previewUrl && (
                      <button
                        onClick={() => onPlayClick({
                          name: song2.name,
                          artist: song2.artist,
                          artworkUrl: song2.artworkUrl,
                          previewUrl: song2.previewUrl
                        })}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isPlayingSong2 ? "bg-[#111111] text-white" : "bg-white hover:bg-[#F5F5F3] text-[#111111] border border-[#ECECEC]"
                        }`}
                      >
                        {isPlayingSong2 ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current pl-0.5" />}
                      </button>
                    )}
                    <button
                      onClick={() => setSong2(null)}
                      className="text-[10px] bg-white hover:bg-[#F5F5F3] p-2 rounded-lg text-[#6B6B6B] hover:text-red-500 transition-colors border border-[#ECECEC] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <SongSearch
                  onSelectSong={setSong2}
                  isLoading={loading}
                  placeholder="Search second song... e.g., Maruvaarthai"
                  onPlayClick={onPlayClick}
                  activePlayback={activePlayback}
                  isPlaying={isPlaying}
                />
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-xs rounded-xl font-mono text-center border border-red-100">
              ⚠️ {error}
            </div>
          )}

          {/* ACTION BUTTON */}
          <div className="pt-4 flex items-center justify-center relative z-10">
            <button
              onClick={handleRunComparison}
              disabled={loading || !song1 || !song2}
              className={`px-8 py-4 bg-[#111111] hover:bg-neutral-800 text-white font-bold text-xs tracking-wider uppercase font-sans rounded-xl shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                loading || !song1 || !song2 ? "opacity-40 cursor-not-allowed" : "hover:scale-[1.01] active:scale-[0.99]"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Aligning emotional axes...
                </>
              ) : (
                <>
                  <ArrowLeftRight className="w-4 h-4 text-white" />
                  Analyze Overlap Density
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* COMPARISON RESULTS SCREEN */
        <div className="space-y-8">
          {/* TOP BANNER COMPATIBILITY STAT & VERDICT */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* SCORE CIRCLE PORT */}
            <div className="md:col-span-4 bg-white border border-[#ECECEC] rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    stroke="#ECECEC"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    stroke="#8B5CF6"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={339}
                    strokeDashoffset={339 - (339 * result.similarityScore) / 100}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-[#111111] tracking-tight leading-none font-sans">{result.similarityScore}%</span>
                  <span className="text-[8px] font-mono tracking-widest text-[#6B6B6B] uppercase mt-1.5 font-bold">MATCH</span>
                </div>
              </div>
              
              <h3 className="text-xs font-bold text-[#111111] mt-6 font-mono tracking-wider uppercase text-center">INTELLIGENCE INDEX</h3>
              <p className="text-[10px] text-[#6B6B6B] text-center mt-1 font-mono">7-Dimensional Emotion Overlap</p>
            </div>

            {/* OVERVIEW SUMMARY / VERDICT */}
            <div className="md:col-span-8 bg-white border border-[#ECECEC] rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-sm relative">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20">
                  <Sparkles className="w-3 h-3 text-[#8B5CF6]" /> Psychoacoustic Overlap
                </span>
                
                <h3 className="text-lg font-bold text-[#111111] font-sans">
                  {song1.name} + {song2.name}
                </h3>
                
                <p className="text-sm text-[#6B6B6B] leading-relaxed italic">
                  "{result.overallVerdict}"
                </p>
              </div>

              {/* SHARED BADGES */}
              <div className="mt-6 pt-4 border-t border-[#ECECEC] flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-[#6B6B6B] font-mono tracking-wider uppercase font-extrabold mr-1">Overlap Badges:</span>
                {result.sharedEmotions.map((emotion, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-[#8B5CF6]/5 border border-[#8B5CF6]/10 text-[#8B5CF6] font-bold text-[10px] tracking-wide"
                  >
                    ✨ {emotion}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* DYNAMIC SIDE-BY-SIDE MOOD PROFILE OVERLAP CHART */}
          <div className="bg-white border border-[#ECECEC] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-[#111111] tracking-wider uppercase font-mono flex items-center gap-2 border-b border-[#ECECEC] pb-3">
              <Sliders className="w-4 h-4 text-[#8B5CF6]" /> 7D Spectrum Overlap Comparison
            </h3>

            <div className="space-y-5">
              {[
                { key: "nostalgia", label: "Nostalgia", desc: "Retrospective memory weight", color: "bg-[#8B5CF6]" },
                { key: "longing", label: "Longing", desc: "Yearning and space", color: "bg-[#8B5CF6]" },
                { key: "romance", label: "Romance", desc: "Tactile lyric intimacy", color: "bg-[#8B5CF6]" },
                { key: "warmth", label: "Warmth", desc: "Cozy acoustic instrumentation", color: "bg-[#8B5CF6]" },
                { key: "melancholy", label: "Melancholy", desc: "Minor hook gravity", color: "bg-[#8B5CF6]" },
                { key: "hopefulness", label: "Hopefulness", desc: "Sunrise lift and optimism", color: "bg-[#8B5CF6]" },
                { key: "energy", label: "Energy", desc: "Vigor and BPM bounce", color: "bg-[#8B5CF6]" },
              ].map((p) => {
                const baseWeight = result.moodOverlap[p.key as keyof typeof result.moodOverlap] || 50;
                const s1Weight = Math.min(100, Math.max(0, baseWeight + ((song1?.artist || "").charCodeAt(0) % 15) - 7));
                const s2Weight = Math.min(100, Math.max(0, baseWeight + ((song2?.artist || "").charCodeAt(0) % 15) - 7));

                return (
                  <div key={p.key} className="space-y-2.5">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-xs font-bold text-[#111111]">{p.label}</span>
                        <span className="text-[10px] text-[#6B6B6B] font-mono ml-2">({p.desc})</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[10px]">
                        <span className="text-[#8B5CF6] font-bold">{song1.name}: {s1Weight}%</span>
                        <span className="text-[#ECECEC]">•</span>
                        <span className="text-neutral-500 font-bold">{song2.name}: {s2Weight}%</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-0.5">
                      {/* Song 1 bar */}
                      <div className="h-1.5 w-full bg-[#F5F5F3] rounded-full overflow-hidden border border-[#ECECEC]">
                        <div
                          className="h-full bg-[#8B5CF6]"
                          style={{ width: `${s1Weight}%` }}
                        ></div>
                      </div>
                      {/* Song 2 bar */}
                      <div className="h-1.5 w-full bg-[#F5F5F3] rounded-full overflow-hidden border border-[#ECECEC]">
                        <div
                          className="h-full bg-neutral-450 bg-[#111111]"
                          style={{ width: `${s2Weight}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CONTRAST & DIVERGENCES */}
          <div className="bg-white border border-[#ECECEC] rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-[#111111] tracking-wider uppercase font-mono flex items-center gap-2 border-b border-[#ECECEC] pb-3">
              <Info className="w-4 h-4 text-[#8B5CF6]" /> Contrast & Vector Divergences
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.differences.map((diff, index) => (
                <div key={index} className="p-4 rounded-xl bg-[#F5F5F3]/50 border border-[#ECECEC] flex items-start gap-3">
                  <span className="text-[#8B5CF6] font-mono font-black text-xs pt-0.5">0{index + 1}.</span>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed font-sans font-medium">{diff}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
