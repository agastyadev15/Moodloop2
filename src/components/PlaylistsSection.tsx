import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  Play,
  Pause,
  Music,
  ChevronRight,
  Clock,
  ArrowLeft,
  Sparkles,
  History,
  FolderOpen,
  FolderPlus,
  Check,
  Disc,
  Share2,
  Bookmark,
  ExternalLink,
  Sliders
} from "lucide-react";
import { Playlist, PlaylistSong, SongItem } from "../types";
import { ThemePalette } from "../utils/theme";
import SongSearch from "./SongSearch";
import { SpotifyLogo } from "./BrandLogos";
import { UserSubscriptionState } from "../utils/subscriptionManager";
import { SubscriptionPlan } from "../pricingConfig";

interface PlaylistsSectionProps {
  playlists: Playlist[];
  onCreatePlaylist: (name: string, description: string) => void;
  onSaveMoodMixPlaylist?: (name: string, description: string, songs: any[]) => void;
  onDeletePlaylist: (id: string) => void;
  onRemoveSongFromPlaylist: (playlistId: string, songId: string) => void;
  onAddSongToPlaylist: (playlistId: string, song: any) => void;
  onExploreVibe: (song: any) => void;
  onPlayClick: (track: any) => void;
  activePlayback: { previewUrl: string } | null;
  isPlaying: boolean;
  searchHistory: SongItem[];
  palette: ThemePalette;
  onReturnToStudio: () => void;
  subscriptionState?: UserSubscriptionState;
  onGateFeature?: (capability: keyof SubscriptionPlan["capabilities"], featureName: string) => boolean;
  spotifyConnected?: boolean;
  spotifyUser?: { displayName: string; id: string } | null;
  spotifyConnectionStatus?: string | null;
  onConnectSpotify?: () => void;
  onExportPlaylistToSpotify?: (playlist: Playlist) => Promise<{
    playlistUrl: string;
    playlistName: string;
    totalMatched: number;
    totalRequested: number;
  }>;
}

interface MoodMixTrack {
  id: string;
  songName: string;
  artist: string;
  album: string;
  whyItFits: string;
  discoveryScore: number;
  energyLevel: number;
  language: string;
  artworkUrl: string;
  previewUrl: string;
  appleMusicUrl: string;
  releaseYear: string;
}

interface EmotionalProfile {
  coreEmotion: string;
  relationshipStatus: string;
  emotionalIntensity: string;
  stageOfHealing: string;
  languagePreference: string;
  listeningHistoryContext: string;
  situationalContext: string;
}

interface MoodMixResult {
  playlistName: string;
  playlistDescription: string;
  aestheticCode: string;
  emotionalProfile?: EmotionalProfile;
  tracks: MoodMixTrack[];
  createdAt: number;
}

export default function PlaylistsSection({
  playlists,
  onCreatePlaylist,
  onSaveMoodMixPlaylist,
  onDeletePlaylist,
  onRemoveSongFromPlaylist,
  onAddSongToPlaylist,
  onExploreVibe,
  onPlayClick,
  activePlayback,
  isPlaying,
  searchHistory,
  palette,
  onReturnToStudio,
  subscriptionState,
  onGateFeature,
  spotifyConnected = false,
  spotifyUser,
  spotifyConnectionStatus,
  onConnectSpotify,
  onExportPlaylistToSpotify
}: PlaylistsSectionProps) {
  const [activeSection, setActiveSection] = useState<"custom" | "moodmix">("custom");
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isSpotifyExporting, setIsSpotifyExporting] = useState(false);
  const [spotifyExportResult, setSpotifyExportResult] = useState<{
    playlistUrl: string;
    playlistName: string;
    totalMatched: number;
    totalRequested: number;
  } | null>(null);
  const [spotifyExportError, setSpotifyExportError] = useState<string | null>(null);

  // MoodMix Generator states
  const [selectedAesthetic, setSelectedAesthetic] = useState<string>("nightdrive");
  const [feelDescription, setFeelDescription] = useState<string>("");
  const [timeOfDay, setTimeOfDay] = useState<string>("any");
  const [energyLevel, setEnergyLevel] = useState<string>("any");
  const [languagePref, setLanguagePref] = useState<string>("global");
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesisStep, setSynthesisStep] = useState<string>("Initializing emotional models...");
  
  // Synthesized result
  const [moodMixResult, setMoodMixResult] = useState<MoodMixResult | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [copiedTracksText, setCopiedTracksText] = useState<boolean>(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState<boolean>(false);

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId);

  useEffect(() => {
    setSpotifyExportResult(null);
    setSpotifyExportError(null);
  }, [activePlaylistId]);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    onCreatePlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    setNewPlaylistName("");
    setNewPlaylistDesc("");
    setShowCreateModal(false);
    triggerToast("Playlist created successfully!");
  };

  const handleAddFromHistory = (playlistId: string, song: SongItem) => {
    onAddSongToPlaylist(playlistId, song);
    triggerToast(`Added "${song.name}" to playlist`);
  };

  const handleAddFromSearch = (playlistId: string, song: SongItem) => {
    onAddSongToPlaylist(playlistId, song);
    triggerToast(`Added "${song.name}" to playlist`);
  };

  const handleExportActivePlaylist = async () => {
    if (!activePlaylist || !onExportPlaylistToSpotify) return;

    setIsSpotifyExporting(true);
    setSpotifyExportResult(null);
    setSpotifyExportError(null);

    try {
      const result = await onExportPlaylistToSpotify(activePlaylist);
      setSpotifyExportResult(result);
      triggerToast(`Exported "${activePlaylist.name}" to Spotify.`);
    } catch (error: any) {
      console.error("Spotify playlist export error:", error);
      setSpotifyExportError(error.message || "Could not export this playlist to Spotify.");
      triggerToast("Could not export this playlist right now.");
    } finally {
      setIsSpotifyExporting(false);
    }
  };

  const formatTimeAdded = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Just now";
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const aesthetics = [
    { id: "nightdrive", name: "Night Drive", icon: "🌌", desc: "Neon cities & dark synths", color: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30" },
    { id: "rainy", name: "Rainy Day", icon: "🌧️", desc: "Acoustics & windowpanes", color: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30" },
    { id: "maincharacter", name: "Main Character", icon: "👑", desc: "Cinematic life anthems", color: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30" },
    { id: "retro", name: "Retro Tape", icon: "📟", desc: "Vintage tape & warm dust", color: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30" },
    { id: "dreamy", name: "Dreamy Cloud", icon: "☁️", desc: "Lofi dreams & quiet levitation", color: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30" },
    { id: "anime", name: "Anime Romance", icon: "🌸", desc: "Swell Tokyo acoustic pop", color: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30" },
  ];

  useEffect(() => {
    if (!isSynthesizing) return;
    const steps = [
      "Deconstructing emotional parameters...",
      "Mapping atmospheric acoustics & frequencies...",
      "Sifting musical architectures for hidden gems...",
      "Synthesizing deliberate emotional narrative arch...",
      "Injecting regional and multilingual cuts...",
      "Evaluating energy levels & cross-talk balance...",
      "Assembling final high-fidelity sequence..."
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % steps.length;
      setSynthesisStep(steps[index]);
    }, 2800);

    return () => clearInterval(interval);
  }, [isSynthesizing]);

  const handleSynthesizeMoodMix = async () => {
    setIsSynthesizing(true);
    setSynthesisStep("Waking up emotional analyzers...");
    setMoodMixResult(null);

    try {
      const response = await fetch("/api/moodmix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aesthetic: selectedAesthetic,
          description: feelDescription,
          languagePref,
          timeOfDay,
          energyLevel,
          listeningHistory: searchHistory.map(song => `${song.name} by ${song.artist}`).slice(0, 10)
        })
      });

      if (!response.ok) {
        throw new Error("MoodMix generation errored.");
      }

      const result = await response.json();
      setMoodMixResult(result);
      triggerToast(`Successfully synthesized "${result.playlistName}"!`);
    } catch (e) {
      console.error(e);
      triggerToast("Error synthesizing playlist. Restoring localized layout.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSaveMoodMix = () => {
    if (!moodMixResult || !onSaveMoodMixPlaylist) return;
    onSaveMoodMixPlaylist(
      moodMixResult.playlistName,
      moodMixResult.playlistDescription || `A custom AI MoodMix curated in the ${moodMixResult.aestheticCode} style.`,
      moodMixResult.tracks
    );
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 4000);
    triggerToast("Saved MoodMix to your Collections!");
  };

  const triggerCopyTracks = () => {
    if (!moodMixResult) return;
    const listText = moodMixResult.tracks
      .map((t, idx) => `${idx + 1}. ${t.songName} - ${t.artist} (${t.album})`)
      .join("\n");
    
    navigator.clipboard.writeText(listText);
    setCopiedTracksText(true);
    setTimeout(() => setCopiedTracksText(false), 2500);
    triggerToast("Copied tracklist to clipboard!");
  };

  const getAestheticDetails = (code: string) => {
    switch (code) {
      case "nightdrive":
        return { label: "Night Drive", glowColor: "border-[#ECECEC] text-[#111111] bg-white", symbol: "🌌" };
      case "rainy":
        return { label: "Rainy Day", glowColor: "border-[#ECECEC] text-[#111111] bg-white", symbol: "🌧️" };
      case "maincharacter":
        return { label: "Main Character", glowColor: "border-[#ECECEC] text-[#111111] bg-white", symbol: "👑" };
      case "retro":
        return { label: "Retro Tape", glowColor: "border-[#ECECEC] text-[#111111] bg-white", symbol: "📻" };
      case "dreamy":
        return { label: "Dreamy Cloud", glowColor: "border-[#ECECEC] text-[#111111] bg-white", symbol: "☁️" };
      case "anime":
        return { label: "Anime Romance", glowColor: "border-[#ECECEC] text-[#111111] bg-white", symbol: "🌸" };
      default:
        return { label: "MoodMix Vibe", glowColor: "border-[#ECECEC] text-[#111111] bg-white", symbol: "🌀" };
    }
  };

  return (
    <div id="playlists-workspace" className="space-y-6 font-sans text-[#111111] relative text-left">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl border border-[#ECECEC] bg-white text-[#111111] font-mono text-xs font-bold shadow-xl flex items-center gap-2.5"
          >
            <Check className="w-4 h-4 text-[#8B5CF6] shrink-0" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace Headers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECEC] pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111111] flex items-center gap-2.5 font-serif">
            <span>🎶</span> Music Lounge
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5 leading-relaxed font-medium">
            Design personal playlists manually, or activate MoodMix AI to cook up emotionally intelligent, multi-genre loops.
          </p>
        </div>

        {activeSection === "custom" && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4.5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase font-sans bg-[#111111] hover:bg-neutral-800 text-white shadow-sm cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              New Custom Curation
            </button>
            
            {activePlaylistId && (
              <button
                onClick={() => setActivePlaylistId(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold font-mono border border-[#ECECEC] bg-white hover:bg-[#F5F5F3] text-[#6B6B6B] hover:text-[#111111] transition-all flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sets
              </button>
            )}
          </div>
        )}
      </div>

      {/* Segmented Premium Tab Selector */}
      <div className="flex items-center justify-center pt-1 pb-4">
        <div className="bg-[#F5F5F3] border border-[#ECECEC] p-1 rounded-2xl flex items-center gap-1 shadow-sm">
          <button
            onClick={() => {
              setActiveSection("custom");
              setMoodMixResult(null);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === "custom"
                ? "bg-white border border-[#ECECEC] text-[#111111] shadow-xs"
                : "text-[#6B6B6B] hover:text-[#111111]"
            }`}
          >
            <FolderOpen className="w-4 h-4" /> My Curated Sets
          </button>
          <button
            onClick={() => setActiveSection("moodmix")}
            className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === "moodmix"
                ? "bg-white border border-[#ECECEC] text-[#111111] shadow-xs"
                : "text-[#6B6B6B] hover:text-[#111111]"
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" /> MoodMix AI Engine
          </button>
        </div>
      </div>

      {/* RENDER SPACE CHOSEN */}
      <AnimatePresence mode="wait">
        {activeSection === "custom" ? (
          /* SECTION A: STANDARD LOCAL PLAYLISTS CASCADES */
          <motion.div
            key="custom-playlists-zone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {!activePlaylistId ? (
              /* All playlists cards grid */
              <div>
                {playlists.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-[#ECECEC] rounded-3xl flex flex-col items-center justify-center max-w-xl mx-auto space-y-5 shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-[#F5F5F3] flex items-center justify-center border border-[#ECECEC]">
                      <FolderOpen className="w-8 h-8 text-[#6B6B6B]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#111111] font-serif">No playlists yet</h3>
                      <p className="text-xs text-[#6B6B6B] max-w-xs mx-auto mt-1 leading-relaxed font-medium">
                        Start curating by creating your custom playlist, then add recommendations or songs from your search history.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold font-sans tracking-wider bg-[#111111] hover:bg-neutral-800 text-white cursor-pointer transition-colors shadow-sm"
                    >
                      Create Curation Playlist
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {playlists.map((pl) => {
                      const songCount = pl.songs.length;
                      const firstSongsArt = pl.songs.slice(0, 4).map(s => s.artworkUrl).filter(Boolean);

                      return (
                        <motion.div
                          id={`playlist-card-${pl.id}`}
                          key={pl.id}
                          whileHover={{ y: -3 }}
                          className="p-5 rounded-2xl bg-white border border-[#ECECEC] hover:border-zinc-350 transition-all duration-300 flex flex-col justify-between group shadow-sm h-full"
                        >
                          <div className="space-y-4">
                            {/* Collage Grid or Placeholder cover */}
                            <div className="relative aspect-video rounded-xl bg-[#F5F5F3] border border-[#ECECEC] overflow-hidden flex items-center justify-center">
                              {firstSongsArt.length > 0 ? (
                                <div className="grid grid-cols-2 w-full h-full">
                                  {firstSongsArt.length === 1 ? (
                                    <img src={firstSongsArt[0]} className="w-full h-full object-cover col-span-2" referrerPolicy="no-referrer" alt="" />
                                  ) : firstSongsArt.length === 2 ? (
                                    <>
                                      <img src={firstSongsArt[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                                      <img src={firstSongsArt[1]} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                                    </>
                                  ) : (
                                    firstSongsArt.slice(0, 4).map((art, idx) => (
                                      <img key={idx} src={art} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                                    ))
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center text-center p-4">
                                  <Disc className="w-10 h-10 text-neutral-400" />
                                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#6B6B6B] mt-2 font-bold">Empty loops</span>
                                </div>
                              )}

                              {/* Float play loop count detail badge */}
                              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-[#111111]/80 text-[9px] font-mono font-bold uppercase tracking-wider text-white border border-white/10">
                                {songCount} {songCount === 1 ? "track" : "tracks"}
                              </div>
                            </div>

                            {/* Text Details */}
                            <div className="space-y-1.5">
                              <h3 className="text-lg font-bold text-[#111111] group-hover:text-[#8B5CF6] transition-colors truncate">
                                {pl.name}
                              </h3>
                              <p className="text-xs text-[#6B6B6B] line-clamp-2 leading-relaxed min-h-[2rem] font-medium">
                                {pl.description || "No description provided."}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#6B6B6B] font-bold">
                                <Clock className="w-3.5 h-3.5 text-[#8B5CF6]" />
                                <span>Created {new Date(pl.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Bottom action buttons */}
                          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#ECECEC]">
                            <button
                              onClick={() => setActivePlaylistId(pl.id)}
                              className="flex-1 py-1.5 rounded-lg bg-[#F5F5F3] hover:bg-[#ECECEC] text-[#111111] border border-[#ECECEC] font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              View Playlist <ChevronRight className="w-3.5 h-3.5 text-[#6B6B6B]" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this playlist?")) {
                                  onDeletePlaylist(pl.id);
                                  triggerToast("Playlist deleted");
                                }
                              }}
                              className="p-1 px-2.5 rounded-lg border border-[#ECECEC] text-[#6B6B6B] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Playlist"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Specific Playlist details + searching adders */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left side: Playlist metadata + active song list */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="p-6 rounded-2xl bg-white border border-[#ECECEC] space-y-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono tracking-widest text-[#8B5CF6] font-extrabold uppercase bg-[#8B5CF6]/10 px-2 py-0.5 rounded border border-[#8B5CF6]/20 inline-block mb-1">
                          Custom Playlist
                        </span>
                        <h3 className="text-xl font-bold text-[#111111] font-sans leading-tight">{activePlaylist?.name}</h3>
                        <p className="text-xs text-[#6B6B6B] mt-1 font-medium italic leading-relaxed">
                          "{activePlaylist?.description || "Curated playlist created using MoodLoop workspace tools."}"
                        </p>
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            if (confirm("Delete this playlist?")) {
                              onDeletePlaylist(activePlaylist!.id);
                              setActivePlaylistId(null);
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-lg border border-transparent bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-mono font-bold cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Playlist
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center justify-between text-[10px] font-mono text-[#6B6B6B] font-bold pt-1.5 border-t border-[#ECECEC]">
                      <span>✨ {activePlaylist?.songs.length} Tracks in this loop</span>
                      <span>Created {activePlaylist && new Date(activePlaylist.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="rounded-2xl border border-[#ECECEC] bg-[#F5F5F3]/60 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6B6B6B] font-bold">
                          Spotify export
                        </p>
                        <p className="text-xs text-[#6B6B6B] font-medium">
                          {spotifyConnected
                            ? `Connected as ${spotifyUser?.displayName || "your Spotify account"}.`
                            : "Connect your Spotify account to turn this custom playlist into a new Spotify playlist."}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={spotifyConnected ? handleExportActivePlaylist : onConnectSpotify}
                          disabled={isSpotifyExporting || !activePlaylist?.songs.length}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-bold transition-all ${
                            spotifyConnected
                              ? "bg-[#1DB954] hover:bg-[#1aa34a] text-white"
                              : "bg-[#111111] hover:bg-neutral-800 text-white"
                          } ${isSpotifyExporting || !activePlaylist?.songs.length ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <SpotifyLogo size={13} className="shrink-0" />
                          {isSpotifyExporting
                            ? "Exporting..."
                            : spotifyConnected
                              ? "Export to Spotify"
                              : "Connect Spotify"}
                        </button>

                        {spotifyExportResult && (
                          <a
                            href={spotifyExportResult.playlistUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl border border-[#ECECEC] bg-white px-3 py-2 text-[11px] font-bold text-[#111111] hover:bg-[#F5F5F3] transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open in Spotify
                          </a>
                        )}
                      </div>
                    </div>

                    {spotifyConnectionStatus && (
                      <p className="text-sm text-red-600 font-medium">{spotifyConnectionStatus}</p>
                    )}

                    {spotifyExportError && (
                      <p className="text-sm text-red-600 font-medium">{spotifyExportError}</p>
                    )}
                  </div>

                  {/* Tracks Listing */}
                  <div className="space-y-3.5">
                    <h4 className="font-bold text-sm tracking-wider uppercase text-[#6B6B6B] font-mono flex items-center gap-2">
                      <span>💿</span> Compilation Songs
                    </h4>

                    {(!activePlaylist || activePlaylist.songs.length === 0) ? (
                      <div className="p-10 text-center bg-white border border-dashed border-[#ECECEC] rounded-2xl shadow-sm">
                        <span className="text-xs text-[#6B6B6B] block font-medium">No songs added in this playlist yet.</span>
                        <span className="text-[10px] text-[#8B5CF6] font-mono mt-1 block font-bold">Add from your recommendations, search history on the right, or search songs directly below!</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activePlaylist.songs.map((song, idx) => {
                          const isSongPlaying = isPlaying && activePlayback?.previewUrl === song.previewUrl;
                          return (
                            <div
                              id={`playlist-song-${song.id}`}
                              key={song.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#ECECEC] hover:border-zinc-300 transition-all duration-300 group shadow-sm"
                            >
                              <div className="flex items-center gap-3.5 min-w-0 text-left">
                                {/* Artwork */}
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[#ECECEC]">
                                  {song.artworkUrl ? (
                                    <img src={song.artworkUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                                  ) : (
                                    <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                                      <Music className="w-4 h-4 text-neutral-400" />
                                    </div>
                                  )}
                                  <button
                                    onClick={() => onPlayClick(song)}
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  >
                                    {isSongPlaying ? (
                                      <Pause className="w-4 h-4 text-white fill-current" />
                                    ) : (
                                      <Play className="w-4 h-4 text-white fill-current pl-0.5" />
                                    )}
                                  </button>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <span className="text-[8px] font-mono text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded px-1.5 py-0.2 select-none uppercase font-bold">
                                    Track {idx + 1}
                                  </span>
                                  <h5 className="font-bold text-[#111111] text-sm line-clamp-1 mt-0.5 group-hover:text-[#8B5CF6] transition-colors">
                                    {song.name}
                                  </h5>
                                  <p className="text-xs text-[#6B6B6B] mt-0.5 font-medium">
                                    {song.artist} <span className="text-[#ECECEC] font-bold">•</span> <span className="text-[10px] font-mono text-zinc-500">{song.album}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-[#ECECEC] sm:border-t-0">
                                <span className="text-[9px] font-mono text-[#6B6B6B] font-bold shrink-0">
                                  Added {formatTimeAdded(song.addedAt)}
                                </span>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onPlayClick(song)}
                                    className={`p-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer border ${
                                      isSongPlaying
                                        ? "bg-red-500 border-red-500 text-white"
                                        : "bg-white hover:bg-[#F5F5F3] border-[#ECECEC] text-[#111111]"
                                    }`}
                                  >
                                    {isSongPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                  </button>

                                  <button
                                    onClick={() => onExploreVibe(song)}
                                    className="px-2.5 py-1.5 rounded-lg bg-[#F5F5F3] hover:bg-[#ECECEC] border border-[#ECECEC] text-[#111111] font-mono text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    title="Explore dynamic recommendation vibes based on this song"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" /> Resonance
                                  </button>

                                  <button
                                    onClick={() => {
                                      onRemoveSongFromPlaylist(activePlaylist.id, song.id);
                                      triggerToast("Removed song from playlist");
                                    }}
                                    className="p-1.5 rounded-lg border border-transparent hover:border-red-150 bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer transition-colors"
                                    title="Remove track"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Direct Quick Search Adder Section */}
                  <div className="space-y-4 pt-4 border-t border-[#ECECEC]">
                    <div className="flex items-center gap-2">
                      <span className="p-1 px-2 rounded-lg bg-[#F5F5F3] border border-[#ECECEC] text-xs text-[#6B6B6B] font-mono font-bold">🔍</span>
                      <h4 className="font-bold text-sm tracking-wide text-[#111111] uppercase font-sans">
                        Search & Add Direct Any Track
                      </h4>
                    </div>
                    
                    <div className="bg-white p-4 border border-[#ECECEC] rounded-2xl shadow-xs">
                      <SongSearch
                        onSelectSong={(song) => handleAddFromSearch(activePlaylist.id, song)}
                        isLoading={false}
                        placeholder="Search iTunes catalogue and instantly insert this song..."
                        onPlayClick={onPlayClick}
                        activePlayback={activePlayback}
                        isPlaying={isPlaying}
                      />
                      <div className="text-[10px] text-[#6B6B6B] text-center font-mono mt-2.5 tracking-wide font-bold">
                        💡 Directly enter keywords to customize your persistent sound catalogs easily.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Search History Source to easily add */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="p-5 rounded-2xl bg-white border border-[#ECECEC] space-y-4 font-sans shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <History className="w-5 h-5 text-[#8B5CF6] shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm text-[#111111] uppercase tracking-wider font-sans">Search History</h4>
                        <p className="text-[10px] text-[#6B6B6B] font-medium">Recently searched anchor tracks.</p>
                      </div>
                    </div>

                    {searchHistory.length === 0 ? (
                      <div className="p-6 text-center bg-[#F5F5F3] rounded-xl border border-[#ECECEC]">
                        <span className="text-[11px] text-[#6B6B6B] leading-normal block font-medium">
                          History is empty.<br />Searched queries will log here.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                        {searchHistory.map((song) => {
                          const isAlreadyInPlaylist = activePlaylist?.songs.some(
                            (s) => s.id === song.id || (s.name.toLowerCase() === song.name.toLowerCase() && s.artist.toLowerCase() === song.artist.toLowerCase())
                          );

                          return (
                            <div
                              id={`history-add-item-${song.id}`}
                              key={song.id}
                              className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-[#F5F5F3]/50 hover:bg-[#F5F5F3] border border-[#ECECEC] group/history"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {/* Mini Artwork */}
                                <div className="w-8 h-8 rounded overflow-hidden shrink-0 border border-[#ECECEC] bg-white">
                                  {song.artworkUrl ? (
                                    <img src={song.artworkUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                      <Music className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 text-left">
                                  <p className="text-xs font-bold text-[#111111] truncate leading-tight group-hover/history:text-[#8B5CF6] transition-colors">
                                    {song.name}
                                  </p>
                                  <p className="text-[10px] text-[#6B6B6B] truncate mt-0.5 font-medium">
                                    {song.artist}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => handleAddFromHistory(activePlaylist.id, song)}
                                disabled={isAlreadyInPlaylist}
                                className={`p-1 rounded-lg border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                                  isAlreadyInPlaylist
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-600 cursor-not-allowed"
                                    : "border-[#ECECEC] bg-white hover:bg-[#F5F5F3] text-[#111111]"
                                }`}
                                title={isAlreadyInPlaylist ? "Already in this playlist" : "Add to playlist"}
                              >
                                {isAlreadyInPlaylist ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* SECTION B: PREMIUM "MOODMIX" AI SOUNDS DESIGNER CABINET */
          <motion.div
            key="moodmix-zone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Cinematic Setup Box */}
            <div className="bg-white border border-[#ECECEC] rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="space-y-6 max-w-4xl text-left">
                <div>
                  <span className="px-2.5 py-1 rounded bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[9.5px] font-mono font-bold uppercase tracking-widest text-[#8B5CF6]">
                    Premium Feature
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111] mt-2 font-serif">
                    MoodMix AI Soundscapes
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1.5 leading-relaxed font-medium">
                    Select a conceptual vibe backdrop, describe your emotional currents in natural language, and let Gemini synthesize a customized, cohesive 20-track playlist of deep cuts and regional masterpieces mapped to your feeling.
                  </p>
                </div>

                {/* STEP 1: Select Aesthetic Grid */}
                <div className="space-y-3">
                  <label className="text-[10px] font-mono text-[#6B6B6B] uppercase tracking-widest font-bold block">
                    1. Choose an Aesthetic Blueprint
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {aesthetics.map((aes) => {
                      const isSelected = selectedAesthetic === aes.id;
                      return (
                        <button
                          key={aes.id}
                          onClick={() => setSelectedAesthetic(aes.id)}
                          className={`p-4 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between space-y-3 relative group h-28 ${
                            isSelected
                              ? "bg-[#8B5CF6]/5 border-[#8B5CF6] text-[#8B5CF6]"
                              : "bg-white border-[#ECECEC] hover:bg-[#F5F5F3]"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-2xl">{aes.icon}</span>
                            {isSelected && (
                              <span className="p-0.5 rounded-full bg-[#8B5CF6] text-white">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <div>
                            <span className={`text-[12px] font-bold uppercase tracking-widest font-mono block transition-colors group-hover:text-[#8B5CF6] ${isSelected ? "text-[#8B5CF6]" : "text-[#111111]"}`}>
                              {aes.name}
                            </span>
                            <span className="text-[9.5px] text-[#6B6B6B] block truncate font-medium">{aes.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 2: Custom Natural Language Feeling description */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-[#6B6B6B] uppercase tracking-widest font-bold block">
                      2. Describe Your Scenario or Current Emotional Space
                    </label>
                    <button
                      onClick={() => setFeelDescription("watching headlamps flicker through pine trees during an quiet mountain rain, feeling incredibly small but safe")}
                      className="text-[9px] font-mono text-[#8B5CF6] hover:underline uppercase tracking-widest font-bold"
                    >
                      Evoke Example
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={feelDescription}
                    onChange={(e) => setFeelDescription(e.target.value)}
                    placeholder="e.g. A chilly midnight drive through concrete highways, wondering about paths not taken. Looking for nostalgic acoustic chords, slow tempos, maybe some bittersweet Telugu or Japanese lofi indies..."
                    className="w-full bg-[#F5F5F3]/50 text-sm text-[#111111] placeholder-neutral-400 p-4 rounded-2xl border border-[#ECECEC] outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all font-sans resize-none"
                  />
                </div>

                {/* STEP 3: Advanced calibrations panel */}
                <div className="space-y-3.5 pt-1">
                  <label className="text-[10px] font-mono text-[#6B6B6B] uppercase tracking-widest font-bold flex items-center gap-1.5 block">
                    <Sliders className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" /> 3. Advanced Calibration Settings
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Time Context */}
                    <div className="space-y-1.5 text-left">
                      <span className="text-[9px] font-mono text-[#6B6B6B] uppercase tracking-wider block font-bold">🌅 Time of Day Arc</span>
                      <select
                        value={timeOfDay}
                        onChange={(e) => setTimeOfDay(e.target.value)}
                        className="w-full bg-white border border-[#ECECEC] text-xs text-[#111111] px-3.5 py-2.5 rounded-xl outline-none focus:border-[#8B5CF6] cursor-pointer hover:bg-[#F5F5F3] font-sans font-semibold"
                      >
                        <option value="any">🌀 Any (Full Day Continuity)</option>
                        <option value="morning">🌅 Morning Sunrise (Warm Acoustical builds)</option>
                        <option value="sunset">🌆 Golden Sunset (Mellow instrumental glows)</option>
                        <option value="night">🌌 Late Night Drive (Dark synths & reverb)</option>
                        <option value="midnight">🌠 Midnight Solitude (Deep micro-minimalism)</option>
                      </select>
                    </div>

                    {/* Energy calibration */}
                    <div className="space-y-1.5 text-left">
                      <span className="text-[9px] font-mono text-[#6B6B6B] uppercase tracking-wider block font-bold">☕ Energy Calibration</span>
                      <select
                        value={energyLevel}
                        onChange={(e) => setEnergyLevel(e.target.value)}
                        className="w-full bg-white border border-[#ECECEC] text-xs text-[#111111] px-3.5 py-2.5 rounded-xl outline-none focus:border-[#8B5CF6] cursor-pointer hover:bg-[#F5F5F3] font-sans font-semibold"
                      >
                        <option value="any">🌀 Adaptive Energy Curves</option>
                        <option value="chill">😴 Cozy Ambient (Low BPM / Slowcore)</option>
                        <option value="medium">☕ Steady Curation (Mellow grooves & indies)</option>
                        <option value="energetic">⚡ High-Vigor Anthems (Active sweep)</option>
                      </select>
                    </div>

                    {/* Vocal Language preference */}
                    <div className="space-y-1.5 text-left">
                      <span className="text-[9px] font-mono text-[#6B6B6B] uppercase tracking-wider block font-bold">🌐 Vocal & Cultural Framework</span>
                      <select
                        value={languagePref}
                        onChange={(e) => setLanguagePref(e.target.value)}
                        className="w-full bg-white border border-[#ECECEC] text-xs text-[#111111] px-3.5 py-2.5 rounded-xl outline-none focus:border-[#8B5CF6] cursor-pointer hover:bg-[#F5F5F3] font-sans font-semibold"
                      >
                        <option value="global">🎵 Global Multilingual Discovery</option>
                        <option value="similar">✨ Cohesive Style Ecosystem</option>
                        <option value="same">🔒 Same Original Language Only</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Synthesis Buttons */}
                <div className="pt-2">
                  <button
                    onClick={handleSynthesizeMoodMix}
                    disabled={isSynthesizing}
                    className="w-full py-4 rounded-2xl font-sans text-xs font-bold uppercase tracking-wider bg-[#111111] hover:bg-neutral-800 text-white shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSynthesizing ? (
                      <>
                        <Disc className="w-5 h-5 text-white animate-spin shrink-0" />
                        <span>Synthesizing soundscape...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white animate-pulse" />
                        <span>Synthesize Premium MoodMix Playlist</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Poetic Loading Stage Box */}
            <AnimatePresence>
              {isSynthesizing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white border border-[#ECECEC] rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto shadow-sm"
                >
                  <Disc className="w-14 h-14 text-[#8B5CF6] animate-spin shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[#111111] font-bold text-sm tracking-wide">COMPILING AI CURATIONS</p>
                    <p className="text-xs text-[#8B5CF6] font-mono italic animate-pulse">{synthesisStep}</p>
                  </div>
                  <p className="text-[10px] text-[#6B6B6B] font-mono tracking-widest uppercase font-bold">MOODLOOP LABS INTERPRET PROGRAM</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* DYNAMIC PRESENTATION: GENERATED PLAYLIST */}
            <AnimatePresence>
              {moodMixResult && !isSynthesizing && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  className="space-y-6"
                >
                  {moodMixResult.emotionalProfile && (
                    <div id="emotional-profile-analysis" className="bg-[#F5F5F3]/50 border border-[#ECECEC] rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs relative overflow-hidden text-left">
                      <div className="flex items-center justify-between border-b border-[#ECECEC] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-2.5 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[9.5px] font-mono font-bold uppercase tracking-widest text-[#8B5CF6]">
                            Psychological Blueprint
                          </span>
                        </div>
                        <span className="text-[10.5px] text-[#6B6B6B] font-mono font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Emotional Accuracy Calibrated
                        </span>
                      </div>

                      {/* Six-Grid Traits section */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                        <div className="p-3.5 rounded-2xl bg-white border border-[#ECECEC] space-y-1">
                          <span className="text-[9px] font-mono text-[#6B6B6B] uppercase tracking-widest block font-bold">🎭 Core Emotion</span>
                          <span className="text-sm font-bold text-[#8B5CF6] font-sans block capitalize">
                            {moodMixResult.emotionalProfile.coreEmotion}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-[#ECECEC] space-y-1">
                          <span className="text-[9px] font-mono text-[#6B6B6B] uppercase tracking-widest block font-bold">👥 Relationship Status</span>
                          <span className="text-sm font-bold text-[#111111] font-sans block capitalize">
                            {moodMixResult.emotionalProfile.relationshipStatus}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-[#ECECEC] space-y-1">
                          <span className="text-[9px] font-mono text-[#6B6B6B] uppercase tracking-widest block font-bold">⚡ Intensity Level</span>
                          <span className="text-sm font-bold text-[#111111] font-sans block capitalize">
                            {moodMixResult.emotionalProfile.emotionalIntensity}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-[#ECECEC] space-y-1">
                          <span className="text-[9px] font-mono text-[#6B6B6B] uppercase tracking-widest block font-bold">🌱 Stage of Healing</span>
                          <span className="text-sm font-bold text-[#111111] font-sans block capitalize">
                            {moodMixResult.emotionalProfile.stageOfHealing}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-[#ECECEC] space-y-1">
                          <span className="text-[9px] font-mono text-[#6B6B6B] uppercase tracking-widest block font-bold">🌐 Vocal Ecosystem</span>
                          <span className="text-sm font-bold text-[#8B5CF6] font-sans block capitalize">
                            {moodMixResult.emotionalProfile.languagePreference}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-[#ECECEC] space-y-1 col-span-2 md:col-span-1">
                          <span className="text-[9px] font-mono text-[#6B6B6B] uppercase tracking-widest block font-bold">🎧 Taste Sync History</span>
                          <span className="text-[11px] font-semibold text-[#111111] leading-tight block truncate" title={moodMixResult.emotionalProfile.listeningHistoryContext}>
                            {moodMixResult.emotionalProfile.listeningHistoryContext}
                          </span>
                        </div>
                      </div>

                      {/* Sympathetic situational block */}
                      <div className="bg-white p-4 rounded-2xl border border-l-2 border-[#ECECEC] border-l-[#8B5CF6] space-y-1.5 shadow-xs">
                        <span className="text-[9.5px] font-mono font-bold tracking-widest uppercase text-[#6B6B6B] block">
                          💭 Situational Analysis & Guidance
                        </span>
                        <p className="text-xs sm:text-sm text-[#111111] leading-relaxed font-sans italic">
                          &ldquo;{moodMixResult.emotionalProfile.situationalContext}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cinematic Playlist Hero Container */}
                  <div className={`p-6 sm:p-8 rounded-3xl border relative flex flex-col md:flex-row gap-6 md:items-center justify-between ${getAestheticDetails(moodMixResult.aestheticCode).glowColor}`}>
                    <div className="flex items-center gap-5 min-w-0 text-left">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#F5F5F3] border border-[#ECECEC] flex items-center justify-center text-3xl sm:text-4xl shrink-0 shadow-xs select-none">
                        {getAestheticDetails(moodMixResult.aestheticCode).symbol}
                      </div>

                      <div className="min-w-0 space-y-1.5">
                        <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-[#8B5CF6] border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 px-2 py-0.5 rounded">
                          Synthesized in {getAestheticDetails(moodMixResult.aestheticCode).label}
                        </span>
                        <h4 className="text-xl sm:text-2xl font-bold text-[#111111] font-serif leading-tight">
                          {moodMixResult.playlistName}
                        </h4>
                        <p className="text-xs text-[#6B6B6B] max-w-2xl leading-relaxed italic font-medium">
                          &ldquo;{moodMixResult.playlistDescription}&rdquo;
                        </p>
                      </div>
                    </div>

                    {/* ACTIONS FOR THE COMPILATION */}
                    <div className="flex flex-row md:flex-col gap-2.5 shrink-0 self-start md:self-center w-full md:w-auto">
                      <button
                        onClick={handleSaveMoodMix}
                        disabled={showSavedFeedback}
                        className={`flex-1 md:flex-none py-2 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border flex items-center justify-center gap-1.5 transition-all ${
                          showSavedFeedback
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                            : "bg-[#111111] text-white hover:bg-neutral-800 border-transparent shadow-sm"
                        }`}
                      >
                        {showSavedFeedback ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-650" /> Saved!
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-4 h-4 fill-white text-white" /> Save Playlist
                          </>
                        )}
                      </button>

                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                          onClick={() => {
                            if (onGateFeature && !onGateFeature("playlistExport", "Playlist Export to Apple Music")) {
                              return;
                            }
                            setShowExportModal(true);
                          }}
                          className="flex-1 py-1.5 px-3 rounded-lg text-[10.5px] font-mono font-bold bg-[#F5F5F3] hover:bg-[#ECECEC] border border-[#ECECEC] text-[#111111] transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#8B5CF6]" /> Export to Apple Music
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tracks Queue Count details */}
                  <div className="space-y-3.5 text-left">
                    <h4 className="font-bold text-sm tracking-wider uppercase text-[#6B6B6B] font-mono flex items-center gap-2">
                      <span>💎</span> Curated Crossover List (20 tracks)
                    </h4>

                    <div className="space-y-3">
                      {moodMixResult.tracks.map((track, index) => {
                        const isSongPlaying = isPlaying && activePlayback?.previewUrl === track.previewUrl;
                        
                        let rarityClass = "bg-[#8B5CF6]/10 border-[#8B5CF6]/20 text-[#8B5CF6]";
                        let rarityLabel = "Billboard Mainstream";
                        if (track.discoveryScore >= 75) {
                          rarityClass = "bg-amber-50 border-amber-200 text-amber-750 font-black";
                          rarityLabel = "Ultra Hidden Gem 💎";
                        } else if (track.discoveryScore >= 40) {
                          rarityClass = "bg-indigo-50 border-indigo-150 text-indigo-700";
                          rarityLabel = "Indie Cut / Underrated";
                        }

                        return (
                          <div
                            id={`moodmix-track-${track.id || index}`}
                            key={track.id || index}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 rounded-2xl bg-white border border-[#ECECEC] hover:border-zinc-350 transition-all duration-300 group relative overflow-hidden text-left"
                          >
                            <div className="flex items-start sm:items-center gap-4 min-w-0">
                              <span className="text-[#6B6B6B] font-mono text-sm self-center font-bold tracking-tight shrink-0 select-none">
                                {(index + 1).toString().padStart(2, "0")}
                              </span>

                              {/* Album Art preview trigger */}
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[#ECECEC] shadow-sm">
                                {track.artworkUrl ? (
                                  <img src={track.artworkUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                                ) : (
                                  <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                                    <Music className="w-5 h-5 text-neutral-400" />
                                  </div>
                                )}
                                <button
                                  onClick={() => onPlayClick({
                                    id: track.id || String(index),
                                    name: track.songName,
                                    artist: track.artist,
                                    album: track.album,
                                    artworkUrl: track.artworkUrl,
                                    previewUrl: track.previewUrl,
                                    appleMusicUrl: track.appleMusicUrl,
                                    releaseYear: track.releaseYear
                                  })}
                                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                  {isSongPlaying ? (
                                    <Pause className="w-5 h-5 text-white fill-current" />
                                  ) : (
                                    <Play className="w-5 h-5 text-white fill-current pl-0.5" />
                                  )}
                                </button>
                              </div>

                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h5 className="font-bold text-[#111111] text-sm sm:text-base line-clamp-1 leading-tight group-hover:text-[#8B5CF6] transition-colors">
                                    {track.songName}
                                  </h5>
                                  
                                  <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border leading-none ${rarityClass}`}>
                                    {rarityLabel}
                                  </span>
                                  <span className="text-[8px] font-mono text-[#6B6B6B] border border-[#ECECEC] bg-white px-1.5 py-0.5 rounded leading-none font-bold">
                                    Origin: {track.language}
                                  </span>
                                </div>
                                <p className="text-xs text-[#6B6B6B] font-medium">
                                  {track.artist} <span className="text-[#ECECEC] font-bold">•</span> <span className="text-[11px] font-mono text-[#6B6B6B]">{track.album}</span>
                                </p>
                                
                                <p className="text-[11.5px] text-[#6B6B6B] italic leading-relaxed pt-0.5 pl-1.5 border-l border-[#ECECEC] shrink-0 font-medium">
                                  &ldquo;{track.whyItFits}&rdquo;
                                </p>
                              </div>
                            </div>

                            {/* Play trigger + links */}
                            <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-[#ECECEC] sm:border-t-0 shrink-0 self-center">
                              <span className="text-[9.5px] font-mono text-[#6B6B6B] font-bold shrink-0">
                                Release: {track.releaseYear}
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => onPlayClick({
                                    id: track.id || String(index),
                                    name: track.songName,
                                    artist: track.artist,
                                    album: track.album,
                                    artworkUrl: track.artworkUrl,
                                    previewUrl: track.previewUrl,
                                    appleMusicUrl: track.appleMusicUrl,
                                    releaseYear: track.releaseYear
                                  })}
                                  className={`p-2 rounded-xl text-xs font-mono transition-all flex items-center gap-1 cursor-pointer border ${
                                    isSongPlaying
                                      ? "bg-red-500 border-red-500 text-white"
                                      : "bg-white border-[#ECECEC] hover:bg-[#F5F5F3] text-[#111111]"
                                  }`}
                                >
                                  {isSongPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
                                
                                <a
                                  href={track.appleMusicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-xl bg-white border border-[#ECECEC] hover:bg-[#F5F5F3] text-[#6B6B6B] hover:text-[#8B5CF6] transition-colors"
                                  title="Listen on Apple Music"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER MODAL: CREATE MANUAL PLAYLIST */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-xs"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#ECECEC] rounded-2xl max-w-md w-full p-6 relative z-10 shadow-xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-[#ECECEC] pb-3">
                <h3 className="text-lg font-bold text-[#111111] flex items-center gap-2 font-serif">
                  <FolderPlus className="w-5 h-5 text-[#8B5CF6]" /> Create Playlist
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-[#6B6B6B] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#6B6B6B] font-extrabold block">
                    Playlist Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My Late Night Echoes"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full bg-[#F5F5F3] text-sm text-[#111111] placeholder-neutral-400 px-4.5 py-2.5 rounded-xl border border-[#ECECEC] focus:border-[#8B5CF6] outline-none transition-all font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#6B6B6B] font-extrabold block">
                    Description (optional)
                  </label>
                  <textarea
                    placeholder="e.g. Melancholic retro echoes with warm basslines and slow tempos."
                    value={newPlaylistDesc}
                    onChange={(e) => setNewPlaylistDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-[#F5F5F3] text-sm text-[#111111] placeholder-neutral-400 px-4.5 py-2.5 rounded-xl border border-[#ECECEC] focus:border-[#8B5CF6] outline-none transition-all font-sans resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-[#6B6B6B] font-bold border border-[#ECECEC] hover:bg-[#F5F5F3] font-mono text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#111111] hover:bg-neutral-800 text-white font-bold font-mono text-xs cursor-pointer transition-colors shadow-sm"
                  >
                    Confirm & Save Name
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENDER MODAL: PREMIUM SPOTS & APPLE MUSIC EXPORT INTERFACE */}
      <AnimatePresence>
        {showExportModal && moodMixResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExportModal(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-xs"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="bg-white border border-[#ECECEC] rounded-3xl max-w-lg w-full p-6 relative z-10 shadow-xl space-y-5 text-left font-sans text-[#111111]"
            >
              <div className="flex items-center justify-between border-b border-[#ECECEC] pb-3">
                <h3 className="text-lg font-bold text-[#111111] flex items-center gap-2 font-serif">
                  <span className="p-1 px-1.5 rounded-lg bg-rose-50 text-rose-600 font-bold">🍎</span> Export to Apple Music
                </h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-1 text-[#6B6B6B] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  <Plus className="w-5 h-5 rotate-45 text-[#6B6B6B]" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#F5F5F3] border border-[#ECECEC] space-y-2">
                  <p className="text-xs text-[#111111] leading-relaxed font-bold">
                    🚀 Your Premium Apple Music Library is sync-ready.
                  </p>
                  <p className="text-[11px] text-[#6B6B6B] leading-relaxed font-medium">
                    Under browser sandboxing, you can import this complete curated list of 20 tracks instantly. Copy the import-ready tracklist and paste it into converters or share directly!
                  </p>
                </div>

                {/* Copied tracks listing box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#6B6B6B] font-bold">
                    <span>TRACK LIST FORMAT (CSV/TXT)</span>
                    <span>20 songs curated</span>
                  </div>
                  <div className="w-full h-36 bg-[#F5F5F3] overflow-y-auto px-4 py-3 rounded-2xl text-[10.5px] font-mono text-[#111111] border border-[#ECECEC] leading-relaxed relative">
                    {moodMixResult.tracks.map((t, i) => (
                      <div key={i} className="truncate font-semibold">
                        &quot;{t.songName}&quot; by {t.artist}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#8B5CF6]/5 p-3.5 rounded-xl border border-[#8B5CF6]/20 space-y-1">
                  <span className="text-[9.5px] font-mono text-[#8B5CF6] font-extrabold uppercase block">💡 PRO TIP</span>
                  <p className="text-[11px] text-[#6B6B6B] leading-normal font-medium">
                    You can paste this copied list directly into <a href="https://www.tunemymusic.com/" target="_blank" rel="noopener noreferrer" className="text-[#8B5CF6] hover:underline inline-flex items-center gap-0.5 font-bold">TuneMyMusic <ExternalLink className="w-3 h-3 text-[#8B5CF6]" /></a> or similar official APIs to create this playlist on your device in exactly 1 minute.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={triggerCopyTracks}
                    className="flex-1 py-3 rounded-xl bg-[#8B5CF6] hover:bg-indigo-600 text-white font-bold font-mono text-xs cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {copiedTracksText ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied Track List!
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 text-white" /> Copy Track List
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowExportModal(false);
                      triggerToast(`Successfully generated Apple Music setup instructions`);
                    }}
                    className="py-3 px-5 rounded-xl text-[#6B6B6B] font-bold border border-[#ECECEC] hover:bg-[#F5F5F3] font-mono text-xs cursor-pointer transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
