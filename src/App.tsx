import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  Music,
  ExternalLink,
  Sparkles,
  Search,
  RotateCcw,
  Volume2,
  Calendar,
  Layers,
  X,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Headphones,
  Share2,
  Copy,
  Check,
  Zap,
  Heart,
  History,
  Flame,
  CloudRain,
  Sliders,
  ArrowRight,
  ArrowDown,
  Compass,
  Sun,
  FolderPlus,
  Disc,
  Bookmark,
  ArrowLeft,
  ChevronRight,
  FolderOpen,
  Plus,
  Trash2,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Twitter,
  Facebook,
  MessageCircle,
  Info
} from "lucide-react";
import SongSearch from "./components/SongSearch";
import EmotionDnaCard from "./components/EmotionDnaCard";
import MoodLoopLogo from "./components/MoodLoopLogo";
import CinematicLoader from "./components/CinematicLoader";
import { SongItem, AnalysisResult, RecommendationItem, MoodAnalysis, Playlist, PlaylistSong, UserFeedback } from "./types";
import { extractAlbumTheme, ThemePalette } from "./utils/theme";
import { AppleMusicLogo, YouTubeLogo, SpotifyLogo } from "./components/BrandLogos";
import CompareSection from "./components/CompareSection";
import FavoritesSection from "./components/FavoritesSection";
import PlaylistsSection from "./components/PlaylistsSection";
import StoryDnaCard from "./components/StoryDnaCard";
import SubscriptionModal from "./components/SubscriptionModal";
import EarlyAccessModal from "./components/EarlyAccessModal";
import { PRICING_CONFIG } from "./pricingConfig";
import { loadSubscriptionState, saveSubscriptionState, recordSearch, checkFeatureAccess } from "./utils/subscriptionManager";
import { Analytics } from "@vercel/analytics/react";
import { ENABLE_PREMIUM } from "./premiumConfig";

// 4 high-fidelity curated tracks for landing page showcase containing preset acoustic Mood DNA
const landingPopularTracks = [
  {
    id: "294748",
    name: "Space Song",
    artist: "Beach House",
    album: "Depression Cherry",
    artworkUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=400",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    releaseYear: "2015",
    moods: { nostalgia: 95, longing: 88, romance: 62, warmth: 45, melancholy: 78, hopefulness: 30, energy: 32 },
    vibeBadge: "Cosmic Melancholy",
    glowColor: "rgba(129,140,248,0.45)" // Indigo glow
  },
  {
    id: "394747",
    name: "Nightcall",
    artist: "Kavinsky",
    album: "Outrun",
    artworkUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    releaseYear: "2013",
    moods: { nostalgia: 85, longing: 72, romance: 42, warmth: 30, melancholy: 28, hopefulness: 55, energy: 78 },
    vibeBadge: "Retro Synthwave",
    glowColor: "rgba(244,63,94,0.45)" // Rose glow
  },
  {
    id: "194749",
    name: "Pink + White",
    artist: "Frank Ocean",
    album: "Blonde",
    artworkUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    releaseYear: "2016",
    moods: { nostalgia: 78, longing: 60, romance: 72, warmth: 85, melancholy: 20, hopefulness: 75, energy: 50 },
    vibeBadge: "Warm Sunset",
    glowColor: "rgba(245,158,11,0.45)" // Amber glow
  },
  {
    id: "494750",
    name: "Let It Happen",
    artist: "Tame Impala",
    album: "Currents",
    artworkUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=400",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    releaseYear: "2015",
    moods: { nostalgia: 62, longing: 65, romance: 32, warmth: 50, melancholy: 40, hopefulness: 68, energy: 85 },
    vibeBadge: "Psychedelic Hypnosis",
    glowColor: "rgba(168,85,247,0.45)" // Purple glow
  }
];

const placeholderSongsData: Record<string, {longing: number, nostalgia: number, warmth: number, hope: number}> = {
  "Kannukulla": { longing: 92, nostalgia: 88, warmth: 74, hope: 41 },
  "Still With You": { longing: 94, nostalgia: 90, warmth: 70, hope: 32 },
  "Maruvaarthai": { longing: 95, nostalgia: 85, warmth: 68, hope: 38 },
  "Nightcall": { longing: 72, nostalgia: 85, warmth: 30, hope: 55 },
  "505": { longing: 86, nostalgia: 94, warmth: 45, hope: 24 },
  "After Dark": { longing: 91, nostalgia: 88, warmth: 38, hope: 48 },
  "The Night We Met": { longing: 96, nostalgia: 93, warmth: 52, hope: 29 }
};

const FLOATING_WALL_SONGS = [
  {
    name: "Space Song",
    artist: "Beach House",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/09/e0/d5/09e0d559-0682-f0f0-5e0c-3cd11e3114fd/beachhouse_depressioncherry_2400_300.jpg/600x600bb.jpg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    moods: { longing: 88, nostalgia: 95, melancholy: 78 },
    color: "from-indigo-500/10 to-purple-500/10",
    vibe: "Cosmic Yearning",
    colSpan: "col-span-1"
  },
  {
    name: "Nightcall",
    artist: "Kavinsky",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c1/2d/fe/c12dfe8f-cdf6-e179-d69a-8ec35f760266/00602537248681.rgb.jpg/600x600bb.jpg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    moods: { energy: 78, nostalgia: 85, nighttime: 92 },
    color: "from-rose-500/10 to-pink-500/10",
    vibe: "Retro Synthwave",
    colSpan: "col-span-1"
  },
  {
    name: "Je te laisserai des mots",
    artist: "Patrick Watson",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/28/49/a5/2849a5c4-57ed-1c12-90f4-1981f7e7e91b/cover.jpg/600x600bb.jpg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    moods: { melancholy: 92, warmth: 70, longing: 85 },
    color: "from-blue-500/10 to-teal-500/10",
    vibe: "Acoustic Drizzle",
    colSpan: "col-span-1 md:col-span-2"
  },
  {
    name: "After Dark",
    artist: "Mr.Kitty",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/ce/5d/c6/ce5dc65e-6dac-bb8a-daaf-72bf77d0ba75/616450974909.png/600x600bb.jpg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    moods: { energy: 72, longing: 94, nighttime: 89 },
    color: "from-purple-500/10 to-indigo-500/10",
    vibe: "Nocturnal Yearning",
    colSpan: "col-span-1"
  },
  {
    name: "Resonance",
    artist: "Home",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/98/75/dd/9875dd83-34f6-40ef-3987-fd13646409be/5034644208930_homeodyssey.jpg/600x600bb.jpg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    moods: { nostalgia: 91, warmth: 84, hope: 68 },
    color: "from-amber-500/10 to-orange-500/10",
    vibe: "Sun-Drenched Tape",
    colSpan: "col-span-1"
  },
  {
    name: "505",
    artist: "Arctic Monkeys",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/82/90/14/829014ad-a301-62ab-bee6-f4cca4457411/mzi.hozudery.jpg/600x600bb.jpg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    moods: { tension: 88, longing: 90, nostalgia: 85 },
    color: "from-red-500/10 to-rose-500/10",
    vibe: "Raw Romantic Ache",
    colSpan: "col-span-1"
  },
  {
    name: "Cherry",
    artist: "Chromatics",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/39/4e/9f/394e9f0e-002f-2a9c-a6f3-8d445fd85cbc/888174054827.jpg/600x600bb.jpg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    moods: { romance: 82, nighttime: 90, nostalgia: 78 },
    color: "from-fuchsia-500/10 to-pink-500/10",
    vibe: "Neon Nostalgia",
    colSpan: "col-span-1"
  },
  {
    name: "The Night We Met",
    artist: "Lord Huron",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/55/41/4a/55414a18-861a-79d1-e575-5bf8cf205dbe/886445056839_Cover.jpg/600x600bb.jpg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    moods: { nostalgia: 96, melancholy: 88, acoustic: 85 },
    color: "from-stone-500/10 to-neutral-500/10",
    vibe: "Campfire Ghost Waltz",
    colSpan: "col-span-1 md:col-span-2"
  }
];

const CLUSTERS = {
  longing: {
    title: "Longing Galaxy",
    desc: "A cluster of songs pulling on the bittersweet thread of distance, unspoken words, and deep desire.",
    color: "rgba(168, 85, 247, 0.5)", // purple-500
    themeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    gravityWell: "Intense Yearning",
    songs: [
      { name: "Kannukulla", artist: "Ghibran", match: 100, x: 50, y: 50, artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/12/7b/78/127b78fe-d51a-c821-1a8f-8af31c972920/cover.jpg/600x600bb.jpg", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a" },
      { name: "Maruvaarthai", artist: "Sid Sriram", match: 95, x: 20, y: 25, artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/64/22/cd/6422cd25-fad4-f063-c03b-b94262b53cfa/cover.jpg/600x600bb.jpg", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a" },
      { name: "Still With You", artist: "Jungkook", match: 94, x: 80, y: 30, artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/61/69/33/616933f6-6d23-321e-f928-1f1c969f130e/195081749037_Cover.jpg/600x600bb.jpg", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a" },
      { name: "Promise", artist: "Jimin", match: 89, x: 15, y: 75, artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/fc/fa/75/fcfa757f-b76b-c42c-f733-3a2c43714bf6/193483453781_Cover.jpg/600x600bb.jpg", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a" },
      { name: "Kadalalle", artist: "Sid Sriram", match: 91, x: 75, y: 70, artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b0/34/9a/b0349aa0-c9e3-d5b0-0c63-f973d5259f58/8903431718556_cover.jpg/600x600bb.jpg", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a" }
    ]
  },
  nostalgia: {
    title: "Nostalgia Galaxy",
    desc: "A cluster of vintage filters, dusty warm tapes, and the beautiful ache of remembered sunsets.",
    color: "rgba(245, 158, 11, 0.5)", // amber-500
    themeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    gravityWell: "Dusty Warm Memories",
    songs: [
      { name: "Space Song", artist: "Beach House", match: 100, x: 50, y: 50, artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/09/e0/d5/09e0d559-0682-f0f0-5e0c-3cd11e3114fd/beachhouse_depressioncherry_2400_300.jpg/600x600bb.jpg", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a" },
      { name: "505", artist: "Arctic Monkeys", match: 95, x: 25, y: 20, artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/82/90/14/829014ad-a301-62ab-bee6-f4cca4457411/mzi.hozudery.jpg/600x600bb.jpg", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a" },
      { name: "Yellow", artist: "Coldplay", match: 90, x: 78, y: 22, artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/93/8c/f5938c49-964c-31d1-4b33-78b634f71fb7/190295978075.jpg/600x600bb.jpg", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a" },
      { name: "The Night We Met", artist: "Lord Huron", match: 92, x: 18, y: 70, artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/55/41/4a/55414a18-861a-79d1-e575-5bf8cf205dbe/886445056839_Cover.jpg/600x600bb.jpg", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a" },
      { name: "Anchor", artist: "Novo Amor", match: 88, x: 72, y: 78, artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/54/4b/e1/544be1ff-5505-56dc-2720-96da95313a8e/cover.jpg/600x600bb.jpg", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a" }
    ]
  },
  latenight: {
    title: "Late Night Galaxy",
    desc: "A cluster of driving rhythms, neon reflections, and quiet streets beneath orange sodium lamps.",
    color: "rgba(6, 182, 212, 0.5)", // cyan-500
    themeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    gravityWell: "Neon Nocturnes",
    songs: [
      { name: "Nightcall", artist: "Kavinsky", match: 100, x: 50, y: 50, artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c1/2d/fe/c12dfe8f-cdf6-e179-d69a-8ec35f760266/00602537248681.rgb.jpg/600x600bb.jpg", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a" },
      { name: "After Dark", artist: "Mr.Kitty", match: 94, x: 22, y: 28, artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/ce/5d/c6/ce5dc65e-6dac-bb8a-daaf-72bf77d0ba75/616450974909.png/600x600bb.jpg", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a" },
      { name: "Resonance", artist: "Home", match: 91, x: 78, y: 28, artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/98/75/dd/9875dd83-34f6-40ef-3987-fd13646409be/5034644208930_homeodyssey.jpg/600x600bb.jpg", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a" },
      { name: "Cherry", artist: "Chromatics", match: 89, x: 18, y: 72, artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/39/4e/9f/394e9f0e-002f-2a9c-a6f3-8d445fd85cbc/888174054827.jpg/600x600bb.jpg", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a" },
      { name: "Under Your Spell", artist: "Desire", match: 87, x: 72, y: 72, artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/79/c6/30/79c630e2-c210-be8f-5760-433cd439af8e/desire_album.jpg/600x600bb.jpg", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a" }
    ]
  }
};

const liveMatchProgression = [
  {
    id: "demo-1",
    name: "Kannukulla",
    artist: "Ghibran",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/12/7b/78/127b78fe-d51a-c821-1a8f-8af31c972920/cover.jpg/600x600bb.jpg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    vibe: "Deep Romantic Melancholy",
    moods: { longing: 92, nostalgia: 88, warmth: 74, hope: 41 }
  },
  {
    id: "demo-2",
    name: "Maruvaarthai",
    artist: "Sid Sriram",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/64/22/cd/6422cd25-fad4-f063-c03b-b94262b53cfa/cover.jpg/600x600bb.jpg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    vibe: "Nocturnal Yearning",
    moods: { longing: 95, nostalgia: 85, warmth: 68, hope: 38 }
  },
  {
    id: "demo-3",
    name: "Undiporaadhey",
    artist: "Sid Sriram",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/66/50/32/665032f8-1261-af69-f9fb-047da403ac4b/cover.jpg/600x600bb.jpg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    vibe: "Soulful Whispering",
    moods: { longing: 88, nostalgia: 82, warmth: 79, hope: 45 }
  },
  {
    id: "demo-4",
    name: "Still With You",
    artist: "Jungkook",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/61/69/33/616933f6-6d23-321e-f928-1f1c969f130e/195081749037_Cover.jpg/600x600bb.jpg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    vibe: "Rainy Lofi Jazz",
    moods: { longing: 94, nostalgia: 90, warmth: 70, hope: 32 }
  },
  {
    id: "demo-5",
    name: "Promise",
    artist: "Jimin",
    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/fc/fa/75/fcfa757f-b76b-c42c-f733-3a2c43714bf6/193483453781_Cover.jpg/600x600bb.jpg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
    vibe: "Delicate Acoustic Hope",
    moods: { longing: 89, nostalgia: 86, warmth: 82, hope: 58 }
  }
];

const songJourneys = [
  {
    title: "Late Night Loneliness",
    description: "Driving down a deserted highway under flickering orange sodium lamps. Reverb synth beats floating through cold air.",
    tracks: [
      { name: "Nightcall", artist: "Kavinsky", description: "Flickering highway neon beats", artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c1/2d/fe/c12dfe8f-cdf6-e179-d69a-8ec35f760266/00602537248681.rgb.jpg/600x600bb.jpg" },
      { name: "After Dark", artist: "Mr.Kitty", description: "Cold gothic synth shadows", artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/ce/5d/c6/ce5dc65e-6dac-bb8a-daaf-72bf77d0ba75/616450974909.png/600x600bb.jpg" },
      { name: "Resonance", artist: "Home", description: "Warm nostalgic tape loops", artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/98/75/dd/9875dd83-34f6-40ef-3987-fd13646409be/5034644208930_homeodyssey.jpg/600x600bb.jpg" },
      { name: "Under Your Spell", artist: "Desire", description: "Haunting synthpop romantic whispers", artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/79/c6/30/79c630e2-c210-be8f-5760-433cd439af8e/desire_album.jpg/600x600bb.jpg" }
    ]
  },
  {
    title: "Rainy Sunday Cafe",
    description: "Steam rising from a warm mug while rainwater streams down double-paned glass. Gentle, bittersweet acoustic resonance.",
    tracks: [
      { name: "Je te laisserai des mots", artist: "Patrick Watson", description: "Whispered, weeping piano keys", artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/28/49/a5/2849a5c4-57ed-1c12-90f4-1981f7e7e91b/cover.jpg/600x600bb.jpg" },
      { name: "Rosyln", artist: "Bon Iver & St. Vincent", description: "Delicate pine-scented acoustics", artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/6b/b4/f3/6bb4f335-7700-3877-e65e-f37a850f5ec2/mzi.ouovshmg.jpg/600x600bb.jpg" },
      { name: "Mystery of Love", artist: "Sufjan Stevens", description: "Mandolins under soft grey drizzle", artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/06/92/3c/06923c8d-1524-b097-1779-b7aebbd6aec2/CMBYN_Mystery_of_Love_Digital_Cover.jpg/600x600bb.jpg" },
      { name: "Anchor", artist: "Novo Amor", description: "Sweeping orchestral cinematic swell", artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/54/4b/e1/544be1ff-5505-56dc-2720-96da95313a8e/cover.jpg/600x600bb.jpg" }
    ]
  },
  {
    title: "Bittersweet Nostalgia",
    description: "Staring at old Polaroid pictures. The intense, beautiful ache of remembering moments that will never happen again.",
    tracks: [
      { name: "505", artist: "Arctic Monkeys", description: "Tense organ building to a crash", artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/82/90/14/829014ad-a301-62ab-bee6-f4cca4457411/mzi.hozudery.jpg/600x600bb.jpg" },
      { name: "Space Song", artist: "Beach House", description: "Floating gravity-free slide guitars", artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/09/e0/d5/09e0d559-0682-f0f0-5e0c-3cd11e3114fd/beachhouse_depressioncherry_2400_300.jpg/600x600bb.jpg" },
      { name: "The Night We Met", artist: "Lord Huron", description: "Echoing campfire ghost waltz", artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/55/41/4a/55414a18-861a-79d1-e575-5bf8cf205dbe/886445056839_Cover.jpg/600x600bb.jpg" },
      { name: "Fade Into You", artist: "Mazzy Star", description: "Smoky acoustic tambourine romance", artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/0f/03/ea/0f03ead1-d1eb-27fd-0734-b257b515692f/13UABIM59278.rgb.jpg/600x600bb.jpg" }
    ]
  }
];

const aesthetics = [
  { id: "rainy", name: "Rainy", icon: "🌧", desc: "Gentle rain & slow acoustics", color: "from-slate-600/20 to-zinc-700/20 border-slate-500/30 text-slate-200 glow-slate" },
  { id: "nightdrive", name: "Night Drive", icon: "🚗", desc: "Neon streets & smooth beats", color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-200 glow-cyan" },
  { id: "romantic", name: "Romantic", icon: "💕", desc: "Warm melodies & soft feelings", color: "from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-250 glow-pink" },
  { id: "nostalgic", name: "Nostalgic", icon: "🌅", desc: "Old memories & warm filters", color: "from-amber-500/20 to-rose-500/20 border-amber-500/30 text-amber-100 glow-amber" },
  { id: "calm", name: "Calm", icon: "😌", desc: "Peaceful spaces & quiet minds", color: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-200 glow-purple" },
  { id: "energetic", name: "Energetic", icon: "🔥", desc: "Electric grooves & bold anthems", color: "from-rose-500/20 to-pink-500/25 border-rose-450/30 text-rose-250 glow-orange" },
];

export interface SongScores {
  nostalgia: number;
  longing: number;
  romance: number;
  warmth: number;
  melancholy: number;
  hopefulness: number;
  energy: number;
}

export const FILTER_BAR_OPTIONS = [
  { id: "All Matched", label: "All Matched", dimension: "none", iconName: "Sliders", activeColor: "bg-indigo-600/20 border-indigo-500/40 text-indigo-300" },
  { id: "High Energy Only", label: "High Energy Only", dimension: "energy", iconName: "Zap", activeColor: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" },
  { id: "Nostalgic Focus", label: "Nostalgic Focus", dimension: "nostalgia", iconName: "History", activeColor: "bg-amber-500/20 border-amber-500/40 text-amber-300" },
  { id: "Deep Romance", label: "Deep Romance", dimension: "romance", iconName: "Heart", activeColor: "bg-pink-500/20 border-pink-500/40 text-pink-300" },
  { id: "Intense Longing", label: "Intense Longing", dimension: "longing", iconName: "Compass", activeColor: "bg-purple-500/20 border-purple-500/40 text-purple-300" },
  { id: "Cozy Warmth", label: "Cozy Warmth", dimension: "warmth", iconName: "Sun", activeColor: "bg-orange-500/20 border-orange-500/40 text-orange-300" },
  { id: "Melancholic Resonance", label: "Melancholic Resonance", dimension: "melancholy", iconName: "CloudRain", activeColor: "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" },
  { id: "Glow Hopefulness", label: "Glow Hopefulness", dimension: "hopefulness", iconName: "Sparkles", activeColor: "bg-rose-500/20 border-rose-500/40 text-rose-300" },
];

export function getSongMoodScores(
  songName: string,
  artist: string,
  anchorMoods: MoodAnalysis | undefined
): SongScores {
  const hashGenerator = (str: string, min: number, max: number, offset: number): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash + offset);
    return min + (hash % (max - min + 1));
  };

  const key = `${songName}-${artist}`;
  
  const getPivotedScore = (anchorVal: number, minBound = 10, maxBound = 100, offset: number): number => {
    const delta = hashGenerator(key, -15, 15, offset);
    return Math.max(minBound, Math.min(maxBound, anchorVal + delta));
  };

  return {
    nostalgia: getPivotedScore(anchorMoods?.nostalgia ?? 50, 10, 100, 10),
    longing: getPivotedScore(anchorMoods?.longing ?? 50, 10, 100, 20),
    romance: getPivotedScore(anchorMoods?.romance ?? 50, 10, 100, 30),
    warmth: getPivotedScore(anchorMoods?.warmth ?? 50, 10, 100, 40),
    melancholy: getPivotedScore(anchorMoods?.melancholy ?? 50, 10, 100, 50),
    hopefulness: getPivotedScore(anchorMoods?.hopefulness ?? 50, 10, 100, 60),
    energy: getPivotedScore(anchorMoods?.energy ?? 50, 10, 100, 70),
  };
}

export const renderFilterIcon = (name: string, className: string = "w-3.5 h-3.5") => {
  switch (name) {
    case "Zap": return <Zap className={className} />;
    case "Heart": return <Heart className={className} />;
    case "History": return <History className={className} />;
    case "Flame": return <Flame className={className} />;
    case "CloudRain": return <CloudRain className={className} />;
    case "Compass": return <Compass className={className} />;
    case "Sun": return <Sun className={className} />;
    case "Sparkles": return <Sparkles className={className} />;
    default: return <Sliders className={className} />;
  }
};

const getTypingScores = (q: string) => {
  if (!q) return { longing: 0, nostalgia: 0, warmth: 0, hope: 0 };
  const codeSum = q.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    longing: 40 + (codeSum % 56),
    nostalgia: 30 + ((codeSum * 3) % 66),
    warmth: 20 + ((codeSum * 7) % 76),
    hope: 10 + ((codeSum * 13) % 86)
  };
};

export const getDynamicEmotionArtwork = (query: string): string => {
  const q = query.toLowerCase().trim();
  
  // 1. Sad / Blue / Lonely / Depressed / Longing / Melancholy / Tear / Cry
  if (
    q.includes("lonely") || 
    q.includes("sad") || 
    q.includes("melancholy") || 
    q.includes("depress") || 
    q.includes("longing") || 
    q.includes("tear") || 
    q.includes("cry") || 
    q.includes("hurt") || 
    q.includes("grief") ||
    q.includes("heartbreak") ||
    q.includes("broken")
  ) {
    return "https://images.unsplash.com/photo-1437419764061-2473afe69fc2?auto=format&fit=crop&q=80&w=600"; // dark blue water droplets
  }

  // 2. Rain / Wet / Drizzle / Storm / Weather / Fog / Mist / Cold / Chill
  if (
    q.includes("rain") || 
    q.includes("wet") || 
    q.includes("drizzle") || 
    q.includes("fog") || 
    q.includes("mist") || 
    q.includes("cold") || 
    q.includes("overcast") ||
    q.includes("gloomy") ||
    q.includes("cloud")
  ) {
    return "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=600"; // rain droplets sliding down glass window
  }

  // 3. Night / Midnight / Late / Neon / Cyberpunk / Cyber / Synth / Highway / Drive / Driving
  if (
    q.includes("night") || 
    q.includes("midnight") || 
    q.includes("neon") || 
    q.includes("cyber") || 
    q.includes("synth") || 
    q.includes("drive") || 
    q.includes("driving") || 
    q.includes("highway") || 
    q.includes("deserted") ||
    q.includes("darkness")
  ) {
    return "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&q=80&w=600"; // neon night street lights
  }

  // 4. Sunset / Sunrise / Sun / Golden / Dawn / Morning / Light / Warmth / Cozy / Comfort
  if (
    q.includes("sunset") || 
    q.includes("sunrise") || 
    q.includes("sun") || 
    q.includes("golden") || 
    q.includes("dawn") || 
    q.includes("morning") || 
    q.includes("light") || 
    q.includes("warm") || 
    q.includes("cozy") || 
    q.includes("comfort") || 
    q.includes("home") ||
    q.includes("wood") ||
    q.includes("cabin")
  ) {
    return "https://images.unsplash.com/photo-1518173946687-a4c8a383392c?auto=format&fit=crop&q=80&w=600"; // gorgeous warm sunset
  }

  // 5. Calm / Quiet / Peace / Peaceful / Serene / Soft / Relax / Relaxation / Rest / Slow / Sleep / Dream
  if (
    q.includes("calm") || 
    q.includes("quiet") || 
    q.includes("peace") || 
    q.includes("serene") || 
    q.includes("soft") || 
    q.includes("relax") || 
    q.includes("rest") || 
    q.includes("slow") || 
    q.includes("sleep") || 
    q.includes("dream") ||
    q.includes("meditat") ||
    q.includes("zen")
  ) {
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600"; // peaceful sunset beach
  }

  // 6. Love / Romantic / Romance / Heart / Sweet / Valentine / Passion
  if (
    q.includes("love") || 
    q.includes("roman") || 
    q.includes("heart") || 
    q.includes("sweet") || 
    q.includes("passion") ||
    q.includes("hug") ||
    q.includes("kiss") ||
    q.includes("together")
  ) {
    return "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600"; // warm sunset silhouette beach walk
  }

  // 7. Angry / Rage / Anger / Tension / Chaos / Intense / Heavy / Loud / Metal / Fire / Smoke / Wild / Crazy
  if (
    q.includes("angry") || 
    q.includes("rage") || 
    q.includes("anger") || 
    q.includes("tension") || 
    q.includes("chaos") || 
    q.includes("intense") || 
    q.includes("heavy") || 
    q.includes("loud") || 
    q.includes("metal") || 
    q.includes("fire") || 
    q.includes("smoke") || 
    q.includes("wild") || 
    q.includes("crazy") ||
    q.includes("storm") ||
    q.includes("lightning") ||
    q.includes("electric")
  ) {
    return "https://images.unsplash.com/photo-1504333631550-b99b3ec347ee?auto=format&fit=crop&q=80&w=600"; // deep dramatic red smoke
  }

  // 8. Energy / Happy / Joy / Excited / Dance / Party / Bright / Glow / Hope / Hopeful / Euphoric / Alive
  if (
    q.includes("energy") || 
    q.includes("happy") || 
    q.includes("joy") || 
    q.includes("excite") || 
    q.includes("dance") || 
    q.includes("party") || 
    q.includes("bright") || 
    q.includes("glow") || 
    q.includes("hope") || 
    q.includes("alive") ||
    q.includes("euphor") ||
    q.includes("high")
  ) {
    return "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600"; // vibrant concert/party lights
  }

  // Fallback to a deterministic image based on hashing the query text
  const hash = q.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbacks = [
    "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=600", // nostalgic tape/sunset
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=600", // studio piano keys
    "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=600", // moody electric guitar
    "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=600", // beautiful clean violet gradient
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600", // yellow retro headphones
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600", // aesthetic neon pink light
  ];
  return fallbacks[hash % fallbacks.length];
};

export default function App() {
  const [view, setView] = useState<"landing" | "app">("landing");
  const [subscriptionState, setSubscriptionState] = useState(() => loadSubscriptionState());
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subModalGateMessage, setSubModalGateMessage] = useState<string | null>(null);
  const [recFrequencies, setRecFrequencies] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("moodloop_rec_frequencies");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const updateSubscriptionState = (newState: typeof subscriptionState) => {
    saveSubscriptionState(newState);
    setSubscriptionState(newState);
  };

  const gatePremiumFeature = (capability: keyof typeof PRICING_CONFIG.free.capabilities, featureName: string): boolean => {
    if (!checkFeatureAccess(subscriptionState, capability)) {
      setSubModalGateMessage(`"${featureName}" is a premium feature! Upgrade to discover without boundaries.`);
      setIsSubModalOpen(true);
      return false;
    }
    return true;
  };

  const [selectedLandingTrack, setSelectedLandingTrack] = useState(landingPopularTracks[0]);
  const [showEarlyAccessBanner, setShowEarlyAccessBanner] = useState(() => {
    try {
      const dismissed = localStorage.getItem("moodloop_early_access_dismissed");
      return dismissed !== "true";
    } catch (e) {
      return true;
    }
  });
  const [isEarlyAccessModalOpen, setIsEarlyAccessModalOpen] = useState(false);

  const handleDismissBanner = () => {
    setShowEarlyAccessBanner(false);
    try {
      localStorage.setItem("moodloop_early_access_dismissed", "true");
    } catch (e) {
      console.warn("localStorage is not available to persist banner dismissal");
    }
  };
  const [selectedSong, setSelectedSong] = useState<SongItem | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [sessionShownSongs, setSessionShownSongs] = useState<Array<{ songName: string; artist: string }>>([]);
  const [isRefreshingRecs, setIsRefreshingRecs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [cinematicLoading, setCinematicLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Redesigned homepage states
  const [heroTypedQuery, setHeroTypedQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [selectedJourneyIndex, setSelectedJourneyIndex] = useState(0);
  const [activeDemoTrack, setActiveDemoTrack] = useState<any>(liveMatchProgression[0]);
  const [activeJourneySong, setActiveJourneySong] = useState<any>(null);
  const [activeGalaxy, setActiveGalaxy] = useState<"longing" | "nostalgia" | "latenight">("longing");

  // New features configuration
  const [activeTab, setActiveTab] = useState<"song" | "emotion" | "playlist">("song");
  const [hiddenGems, setHiddenGems] = useState(false);
  const [crossLanguage, setCrossLanguage] = useState(false);
  const [languagePref, setLanguagePref] = useState<"same" | "similar" | "global">("similar");
  const [emotionQuery, setEmotionQuery] = useState("");

  // Active floating player state
  const [activePlayback, setActivePlayback] = useState<{
    name: string;
    artist: string;
    artworkUrl: string;
    previewUrl: string;
  } | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Fallback modal state when preview is unavailable or fails
  const [fallbackTrack, setFallbackTrack] = useState<{
    name: string;
    artist: string;
    appleMusicUrl: string;
    youtubeUrl: string;
  } | null>(null);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeMoodFilter, setActiveMoodFilter] = useState<string>("All Matched");

  // New features: Favorites & Compare Songs & Story DNA states
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"studio" | "compare" | "favorites" | "playlists">("studio");

  // Studio sub-mode: "analyzer" or "moodmix"
  const [studioMode, setStudioMode] = useState<"analyzer" | "moodmix">("analyzer");

  // Premium MoodMix states (instantiated here so they populate home screen or playlists screen)
  const [selectedAesthetic, setSelectedAesthetic] = useState<string>("none"); // Adaptive default
  const [feelDescription, setFeelDescription] = useState<string>("");
  const [timeOfDay, setTimeOfDay] = useState<string>("any");
  const [energyLevel, setEnergyLevel] = useState<string>("any");
  const [languagePrefMoodMix, setLanguagePrefMoodMix] = useState<string>("global");
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesisStep, setSynthesisStep] = useState<string>("Initializing emotional models...");
  const [moodMixResult, setMoodMixResult] = useState<any | null>(null);
  const [expandedTrackExplanations, setExpandedTrackExplanations] = useState<Record<number, boolean>>({});
  const [showSavedFeedback, setShowSavedFeedback] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem("moodloop_playlists");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [userFeedback, setUserFeedback] = useState<UserFeedback[]>(() => {
    try {
      const saved = localStorage.getItem("moodloop_feedback");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeFeedbackInput, setActiveFeedbackInput] = useState<{
    songName: string;
    artist: string;
    rating: "like" | "dislike";
    comment: string;
  } | null>(null);

  const [searchHistory, setSearchHistory] = useState<SongItem[]>(() => {
    try {
      const saved = localStorage.getItem("moodloop_search_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentlyRecommended, setRecentlyRecommended] = useState<Array<{ name: string; artist: string }>>(() => {
    try {
      const saved = localStorage.getItem("moodmix_recently_recommended");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [songForPlaylistModal, setSongForPlaylistModal] = useState<any | null>(null);

  const [favorites, setFavorites] = useState<RecommendationItem[]>(() => {
    try {
      const saved = localStorage.getItem("moodloop_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [storyDnaSong, setStoryDnaSong] = useState<RecommendationItem | SongItem | null>(null);

  const [spotifyTokens, setSpotifyTokens] = useState<{
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  } | null>(() => {
    try {
      const saved = localStorage.getItem("harmonix_spotify_tokens");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [spotifyUser, setSpotifyUser] = useState<{
    displayName: string;
    id: string;
  } | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    playlistUrl: string;
    playlistName: string;
    totalMatched: number;
    totalRequested: number;
  } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [playlistTitle, setPlaylistTitle] = useState("");

  const handleSpotifyLogout = () => {
    setSpotifyTokens(null);
    setSpotifyUser(null);
    setExportResult(null);
    setExportError(null);
    localStorage.removeItem("harmonix_spotify_tokens");
    triggerToast("Disconnected from Spotify.");
  };

  const getValidSpotifyToken = async () => {
    if (!spotifyTokens) return null;

    if (Date.now() + 30000 > spotifyTokens.expiresAt) {
      try {
        const response = await fetch("/api/spotify/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: spotifyTokens.refreshToken }),
        });

        if (!response.ok) {
          throw new Error("Failed to refresh Spotify token");
        }

        const data = await response.json();
        const updatedTokens = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
        };

        setSpotifyTokens(updatedTokens);
        localStorage.setItem("harmonix_spotify_tokens", JSON.stringify(updatedTokens));
        return data.accessToken;
      } catch (error) {
        console.error("Error refreshing Spotify token:", error);
        handleSpotifyLogout();
        return null;
      }
    }

    return spotifyTokens.accessToken;
  };

  const fetchSpotifyUser = async (token: string) => {
    try {
      const res = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSpotifyUser({
          displayName: data.display_name || data.id,
          id: data.id,
        });
      } else {
        if (res.status === 401) {
          handleSpotifyLogout();
        }
      }
    } catch (err) {
      console.error("Error fetching Spotify user:", err);
    }
  };

  useEffect(() => {
    setSubscriptionState(loadSubscriptionState());
  }, []);

  useEffect(() => {
    if (analysisResult?.recommendations) {
      setRecFrequencies((prev) => {
        const updated = { ...prev };
        analysisResult.recommendations.forEach((rec) => {
          const key = `${rec.artist.toLowerCase().trim()} - ${rec.songName.toLowerCase().trim()}`;
          updated[key] = (updated[key] || 0) + 1;
        });
        try {
          localStorage.setItem("moodloop_rec_frequencies", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }
  }, [analysisResult]);

  useEffect(() => {
    if (spotifyTokens) {
      getValidSpotifyToken().then((validToken) => {
        if (validToken) {
          fetchSpotifyUser(validToken);
        }
      });
    }
  }, [spotifyTokens]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("vercel.app")) {
        return;
      }

      if (event.data?.type === "SPOTIFY_AUTH_SUCCESS" && event.data?.tokens) {
        const tokens = event.data.tokens;
        setSpotifyTokens(tokens);
        localStorage.setItem("harmonix_spotify_tokens", JSON.stringify(tokens));
        triggerToast("Successfully connected to Spotify!");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleConnectSpotify = async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const response = await fetch(`/api/spotify/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch Spotify auth URL");
      }
      const { url } = await response.json();

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authWindow = window.open(
        url,
        "spotify_oauth_popup",
        `width=${width},height=${height},top=${top},left=${left}`
      );

      if (!authWindow) {
        alert("Please allow popups for this site to connect your Spotify account.");
      }
    } catch (error: any) {
      console.error("Spotify auth URL error:", error);
      triggerToast(error.message || "Could not initiate Spotify connection.");
    }
  };

  const handleSpotifyExport = async () => {
    const token = await getValidSpotifyToken();
    if (!token) {
      triggerToast("Please connect to Spotify first.");
      return;
    }

    if (processedRecommendations.length === 0) {
      triggerToast("No recommendations to export.");
      return;
    }

    setIsExporting(true);
    setExportResult(null);
    setExportError(null);

    const defaultName = playlistTitle.trim() || `Harmonix: ${selectedSong?.name || "Vibe"} Recommends`;

    try {
      const response = await fetch("/api/spotify/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: token,
          playlistName: defaultName,
          songs: processedRecommendations.map((r) => ({
            songName: r.songName,
            artist: r.artist,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to export playlist.");
      }

      setExportResult(data);
      triggerToast(`Exported ${data.totalMatched} tracks to Spotify!`);
    } catch (error: any) {
      console.error("Export error:", error);
      setExportError(error.message || "Something went wrong during export.");
      triggerToast("Failed to export to Spotify.");
    } finally {
      setIsExporting(false);
    }
  };

  // Sync playlists with localStorage
  useEffect(() => {
    try {
      localStorage.setItem("moodloop_playlists", JSON.stringify(playlists));
    } catch (err) {
      console.warn("Could not persist playlists to localStorage", err);
    }
  }, [playlists]);

  // Sync searchHistory with localStorage
  useEffect(() => {
    try {
      localStorage.setItem("moodloop_search_history", JSON.stringify(searchHistory));
    } catch (err) {
      console.warn("Could not persist search history", err);
    }
  }, [searchHistory]);

  // Sync favorites with localStorage
  useEffect(() => {
    try {
      localStorage.setItem("moodloop_favorites", JSON.stringify(favorites));
    } catch (err) {
      console.warn("Could not persist favorites to localStorage", err);
    }
  }, [favorites]);

  const handleToggleFavorite = (song: RecommendationItem) => {
    const exists = favorites.some(
      (fav) => fav.songName.toLowerCase().trim() === song.songName.toLowerCase().trim() &&
               fav.artist.toLowerCase().trim() === song.artist.toLowerCase().trim()
    );

    if (exists) {
      setFavorites(prev => prev.filter(
        (fav) => !(fav.songName.toLowerCase().trim() === song.songName.toLowerCase().trim() &&
                   fav.artist.toLowerCase().trim() === song.artist.toLowerCase().trim())
      ));
    } else {
      const limit = PRICING_CONFIG[subscriptionState.plan].limits.maxFavorites;
      if (favorites.length >= limit) {
        setSubModalGateMessage(`Free users can save up to ${limit} favorites. Upgrade to Plus or Studio for unlimited favorites!`);
        setIsSubModalOpen(true);
        return;
      }
      setFavorites(prev => [...prev, song]);
    }
  };

  const isFavorited = (songName: string, artist: string) => {
    return favorites.some(
      (fav) => fav.songName.toLowerCase().trim() === songName.toLowerCase().trim() &&
               fav.artist.toLowerCase().trim() === artist.toLowerCase().trim()
    );
  };

  const handleSaveFeedback = (recommendedSongName: string, recommendedSongArtist: string, rating: "like" | "dislike", comment: string = "") => {
    if (!selectedSong) return;

    const newFeedbackItem: UserFeedback = {
      anchorSong: { name: selectedSong.name, artist: selectedSong.artist },
      recommendedSong: { name: recommendedSongName, artist: recommendedSongArtist },
      rating,
      comment,
      timestamp: Date.now()
    };

    const updatedFeedback = userFeedback.filter(
      item => !(item.anchorSong.name.toLowerCase() === selectedSong.name.toLowerCase() &&
                item.anchorSong.artist.toLowerCase() === selectedSong.artist.toLowerCase() &&
                item.recommendedSong.name.toLowerCase() === recommendedSongName.toLowerCase() &&
                item.recommendedSong.artist.toLowerCase() === recommendedSongArtist.toLowerCase())
    );

    const finalFeedback = [...updatedFeedback, newFeedbackItem];
    setUserFeedback(finalFeedback);
    localStorage.setItem("moodloop_feedback", JSON.stringify(finalFeedback));
    triggerToast("Taste preference saved! Future recommendations will adapt to this feedback.");
    handleSelectSong(selectedSong, false, finalFeedback);
  };

  const handleDeleteFeedback = (recommendedSongName: string, recommendedSongArtist: string) => {
    if (!selectedSong) return;

    const finalFeedback = userFeedback.filter(
      item => !(item.anchorSong.name.toLowerCase() === selectedSong.name.toLowerCase() &&
                item.anchorSong.artist.toLowerCase() === selectedSong.artist.toLowerCase() &&
                item.recommendedSong.name.toLowerCase() === recommendedSongName.toLowerCase() &&
                item.recommendedSong.artist.toLowerCase() === recommendedSongArtist.toLowerCase())
    );

    setUserFeedback(finalFeedback);
    localStorage.setItem("moodloop_feedback", JSON.stringify(finalFeedback));
    triggerToast("Feedback removed.");
    handleSelectSong(selectedSong, false, finalFeedback);
  };



  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3505);
  };

  // Cycling step interval for MoodMix synthesis
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

  const handleSynthesizeMoodMix = async (bypassCache: any = false, customDescription?: string) => {
    const shouldBypass = typeof bypassCache === "boolean" ? bypassCache : false;
    const descriptionToUse = (customDescription || feelDescription || "").trim();
    if (!descriptionToUse) {
      triggerToast("Please describe your scenario or feeling first!");
      return;
    }

    const previousSongs = moodMixResult?.tracks
      ? moodMixResult.tracks.map((t: any) => ({
          name: t.songName || t.name,
          artist: t.artist,
          album: t.album || "Unknown"
        }))
      : [];

    setIsSynthesizing(true);
    setSynthesisStep("Waking up emotional analyzers...");
    setMoodMixResult(null);
    setExpandedTrackExplanations({});

    try {
      const response = await fetch("/api/moodmix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aesthetic: selectedAesthetic === "none" ? undefined : selectedAesthetic,
          description: descriptionToUse,
          bypassCache: shouldBypass,
          listeningHistory: searchHistory.map(song => `${song.name} by ${song.artist}`).slice(0, 10),
          recentSongs: recentlyRecommended,
          previousSongs
        })
      });

      if (!response.ok) {
        throw new Error("MoodMix generation failed.");
      }

      const result = await response.json();
      setMoodMixResult(result);

      if (result.tracks && Array.isArray(result.tracks)) {
        const newlyAdded = result.tracks.map((t: any) => ({
          name: t.songName || t.name,
          artist: t.artist
        }));
        setRecentlyRecommended(prev => {
          const updated = [...prev, ...newlyAdded].slice(-120);
          try {
            localStorage.setItem("moodmix_recently_recommended", JSON.stringify(updated));
          } catch (e) {
            console.error(e);
          }
          return updated;
        });
      }

      triggerToast(`Successfully synthesized "${result.playlistName}"!`);
    } catch (e) {
      console.error(e);
      triggerToast("Error synthesizing playlist. Restoring localized layout.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSaveMoodMix = () => {
    if (!moodMixResult) return;
    const playlistId = Math.random().toString(36).substring(2, 9);
    const formattedSongs: PlaylistSong[] = moodMixResult.tracks.map((s: any, idx: number) => ({
      id: s.id || `moodmix-track-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      name: s.songName || s.name,
      artist: s.artist,
      album: s.album || "Unknown",
      artworkUrl: s.artworkUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400",
      previewUrl: s.previewUrl || "",
      appleMusicUrl: s.appleMusicUrl || "",
      releaseYear: s.releaseYear || "Unknown",
      addedAt: Date.now() + idx * 10
    }));

    const newPl: Playlist = {
      id: playlistId,
      name: moodMixResult.playlistName,
      description: moodMixResult.playlistDescription || `A custom AI MoodMix curated in the ${moodMixResult.aestheticCode} style.`,
      createdAt: Date.now(),
      songs: formattedSongs
    };

    setPlaylists(prev => [newPl, ...prev]);
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 4000);
    triggerToast("Saved MoodMix to your Collections!");
  };

  const getAestheticDetails = (code: string) => {
    switch (code) {
      case "nightdrive":
        return { label: "Night Drive", glowColor: "border-cyan-500/40 text-cyan-400 bg-cyan-950/25 shadow-[0_0_20px_rgba(6,182,212,0.15)]", symbol: "🚗" };
      case "rainy":
        return { label: "Rainy", glowColor: "border-slate-500/40 text-slate-350 bg-slate-900/30 shadow-[0_0_20px_rgba(148,163,184,0.15)]", symbol: "🌧" };
      case "romantic":
        return { label: "Romantic", glowColor: "border-pink-500/40 text-pink-300 bg-pink-950/20 shadow-[0_0_20px_rgba(244,63,94,0.15)]", symbol: "💕" };
      case "nostalgic":
        return { label: "Nostalgic", glowColor: "border-amber-500/40 text-amber-300 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]", symbol: "🌅" };
      case "calm":
        return { label: "Calm", glowColor: "border-purple-500/40 text-purple-300 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]", symbol: "😌" };
      case "energetic":
        return { label: "Energetic", glowColor: "border-red-400/40 text-red-350 bg-red-950/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]", symbol: "🔥" };
      default:
        return { label: "Adaptive AI Vibe", glowColor: "border-purple-500/40 text-purple-300 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]", symbol: "🌀" };
    }
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Extract dynamic theme color tokens based on selected song artwork / info
  const activePalette: ThemePalette = extractAlbumTheme(
    selectedSong?.name || "Midnight City",
    selectedSong?.artist || "M83"
  );

  // Helpers to get fallback similarity tags and breakdowns
  const getSimilarityTagsForSong = React.useCallback((songName: string, artist: string): string[] => {
    const hash = songName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + 
                 artist.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const tagsPool = [
      "✓ Warm analog production", "✓ Reverb-heavy guitars", "✓ Driving analog bassline", "✓ Tape saturation",
      "✓ Delicate piano keys", "✓ Ambient synths", "✓ Double-tracked vocals", "✓ Cinematic strings",
      "✓ Post-punk guitars", "✓ Intimate vocal delivery", "✓ Organic woodwinds", "✓ Acoustic strumming",
      "✓ Cinematic mix", "✓ Staccato strings", "✓ Arpeggiated synths", "✓ Gated reverb drums"
    ];
    const selected: string[] = [];
    for (let i = 0; i < 4; i++) {
      const idx = (hash + i * 7) % tagsPool.length;
      const tag = tagsPool[idx];
      if (!selected.includes(tag)) {
        selected.push(tag);
      }
    }
    return selected;
  }, []);

  const getSimilarityBreakdownForSong = React.useCallback((songName: string, artist: string) => {
    const hash = songName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + 
                 artist.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      production: 3 + (hash % 3), // 3 to 5
      vocals: 3 + ((hash + 2) % 3),
      instrumentation: 3 + ((hash + 4) % 3),
      atmosphere: 3 + ((hash + 6) % 3),
      fanOverlap: 3 + ((hash + 8) % 3)
    };
  }, []);

  // Musicological Scorer calculating weighted similarity score using:
  // 30% Listener overlap, 20% Production style, 15% Vocal texture, 10% Melody, 10% Instrumentation, 5% Arrangement, 5% Language, 5% Lyrical themes.
  const calculateMusicologicalScore = React.useCallback((rec: any, selected: any) => {
    if (!selected) {
      return {
        totalScore: 85,
        breakdown: {
          musicalComposition: 85,
          productionStyle: 85,
          vocalCharacteristics: 85,
          instrumentation: 85,
          listenerOverlap: 85,
          atmosphere: 85,
          lyrics: 85,
          artistSimilarity: 85
        },
        penalties: [] as string[]
      };
    }

    const sName = selected.name || "";
    const sArtist = selected.artist || "";
    const rName = rec.songName || rec.name || "";
    const rArtist = rec.artist || "";

    // Deterministic hashing based on strings for fallback
    const getHash = (str: string, offset: number) => {
      let hash = 0;
      const combined = str + sName + sArtist;
      for (let i = 0; i < combined.length; i++) {
        hash = combined.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash + offset);
    };

    // Base scores (mostly in 80-98 range for good matches)
    let musicalComposition = 80 + (getHash(rName, 1) % 19); 
    let productionStyle = 80 + (getHash(rName, 2) % 19);
    let vocalCharacteristics = 80 + (getHash(rName, 3) % 19);
    let instrumentation = 80 + (getHash(rName, 4) % 19);
    let listenerOverlap = 80 + (getHash(rName, 5) % 19);
    let atmosphere = 80 + (getHash(rName, 6) % 19);
    let lyrics = 80 + (getHash(rName, 7) % 19);
    let artistSimilarity = 80 + (getHash(rName, 8) % 19);

    const penalties: string[] = [];

    // Prioritize Artist Ecosystem (Tamil/South Asian)
    const isSouthAsianEcosystem = (artistName: string) => {
      const eco = [
        "sai abhyankkar", "anirudh ravichander", "sid sriram", "santhosh narayanan", 
        "sean roldan", "a.r. rahman", "pradeep kumar", "govind vasantha", 
        "dhibu ninan thomas", "justin prabhakaran", "abhyankkar"
      ];
      return eco.some(name => artistName.toLowerCase().includes(name));
    };

    const isTamilInput = sName.toLowerCase().includes("kannukulla") || sName.toLowerCase().includes("maruvaarthai") || isSouthAsianEcosystem(sArtist);
    const isTamilRec = isSouthAsianEcosystem(rArtist);

    // 1. If we have real similarityScore from Gemini, use or align it!
    if (rec.similarityScore !== undefined) {
      const score = rec.similarityScore;

      if (rec.similarityBreakdown) {
        const breakdown = rec.similarityBreakdown;
        
        // Map 1-5 scale to percentage (e.g. 5 => 95-100%, 4 => 88-94%, 3 => 80-87%, 2 => 70-79%, 1 => 50-69%)
        const mapComponentScore = (val: number, hashOffset: number) => {
          const base = val === 5 ? 95 : val === 4 ? 88 : val === 3 ? 80 : val === 2 ? 70 : 50;
          const range = val === 5 ? 5 : val === 4 ? 6 : val === 3 ? 7 : val === 2 ? 9 : 19;
          return base + (getHash(rName, hashOffset) % range);
        };

        productionStyle = mapComponentScore(breakdown.production || 4, 2);
        vocalCharacteristics = mapComponentScore(breakdown.vocals || 4, 3);
        instrumentation = mapComponentScore(breakdown.instrumentation || 4, 4);
        atmosphere = mapComponentScore(breakdown.atmosphere || 4, 6);
        listenerOverlap = mapComponentScore(breakdown.fanOverlap || 4, 5);
        musicalComposition = Math.round((productionStyle + vocalCharacteristics + instrumentation) / 3);
        lyrics = 75 + (getHash(rName, 7) % 20);
      } else {
        // Generate a cohesive, non-penalized breakdown centered around the actual similarityScore S
        const getAlignedScore = (offset: number) => {
          const hashVal = getHash(rName, offset) % 11; // 0 to 10
          const delta = hashVal - 5; // -5 to +5
          return Math.max(10, Math.min(100, score + delta));
        };

        productionStyle = getAlignedScore(2);
        vocalCharacteristics = getAlignedScore(3);
        instrumentation = getAlignedScore(4);
        atmosphere = getAlignedScore(6);
        listenerOverlap = getAlignedScore(5);
        musicalComposition = getAlignedScore(1);
        lyrics = getAlignedScore(7);
      }

      if (sArtist.toLowerCase().trim() === rArtist.toLowerCase().trim()) {
        artistSimilarity = Math.max(80, 85 + (getHash(rName, 18) % 15));
      } else {
        artistSimilarity = Math.max(30, Math.min(75, 45 + (getHash(rName, 18) % 25)));
      }

      // Check if there are real musicological penalties rather than random ones!
      if (isTamilInput && !isTamilRec) {
        listenerOverlap = Math.max(50, listenerOverlap - 15);
        penalties.push("Outside preferred artist ecosystem");
      }

      if (rec.isCrossLanguage && !isTamilRec) {
        penalties.push("Cross-language matching");
      }

    } else {
      // Fallback to purely hash-based calculations for offline recommendations or legacy format
      if (sArtist.toLowerCase().trim() === rArtist.toLowerCase().trim()) {
        artistSimilarity = 65 + (getHash(rName, 18) % 15);
      } else {
        artistSimilarity = 40 + (getHash(rName, 18) % 25);
      }

      if (isTamilInput) {
        if (isTamilRec) {
          listenerOverlap = Math.min(100, listenerOverlap + 15);
          productionStyle = Math.min(100, productionStyle + 12);
          musicalComposition = Math.min(100, musicalComposition + 10);
        } else {
          listenerOverlap = Math.max(50, listenerOverlap - 15);
          penalties.push("Outside preferred artist ecosystem");
        }
      }

      const sharesOnlyLanguage = (getHash(rName, 9) % 100) < 15;
      if (sharesOnlyLanguage && sArtist.toLowerCase().trim() !== rArtist.toLowerCase().trim() && !isTamilRec) {
        productionStyle = Math.max(50, productionStyle - 20);
        musicalComposition = Math.max(50, musicalComposition - 18);
        instrumentation = Math.max(50, instrumentation - 18);
        atmosphere = Math.max(50, atmosphere - 15);
        listenerOverlap = Math.max(45, listenerOverlap - 20);
        penalties.push("Only shares language (unrelated production style)");
      }

      // Randomized penalties for fallback tracks to keep UI lively
      if ((getHash(rName, 10) % 100) < 12) {
        listenerOverlap = Math.max(45, listenerOverlap - 18);
        penalties.push("Different audience demographic");
      }
      if ((getHash(rName, 11) % 100) < 12) {
        productionStyle = Math.max(45, productionStyle - 20);
        penalties.push("Different production philosophy");
      }
      if ((getHash(rName, 12) % 100) < 12) {
        vocalCharacteristics = Math.max(45, vocalCharacteristics - 18);
        penalties.push("Different vocal style");
      }
      if ((getHash(rName, 13) % 100) < 10) {
        atmosphere = Math.max(45, atmosphere - 12);
        penalties.push("Era/vibe mismatch");
      }
      if ((getHash(rName, 14) % 100) < 12) {
        musicalComposition = Math.max(45, musicalComposition - 15);
        penalties.push("Different songwriting approach");
      }
    }

    // Derive or use the actual total score
    const computedTotal = Math.round(
      (musicalComposition * 0.30) +
      (productionStyle * 0.25) +
      (vocalCharacteristics * 0.15) +
      (instrumentation * 0.10) +
      (listenerOverlap * 0.10) +
      (atmosphere * 0.05) +
      (lyrics * 0.03) +
      (artistSimilarity * 0.02)
    );

    const totalScore = (rec.similarityScore !== undefined) ? rec.similarityScore : computedTotal;

    return {
      totalScore,
      breakdown: {
        musicalComposition,
        productionStyle,
        vocalCharacteristics,
        instrumentation,
        listenerOverlap,
        atmosphere,
        lyrics,
        artistSimilarity
      },
      penalties
    };
  }, []);

  // Memoized processed recommendations with dynamic mood scoring, fatigue penalties and re-sorting
  const processedRecommendations = React.useMemo(() => {
    if (!analysisResult?.recommendations) return [];

    const itemsWithScores = analysisResult.recommendations.map((rec) => {
      const musicological = calculateMusicologicalScore(rec, selectedSong);
      const scores = getSongMoodScores(rec.songName, rec.artist, analysisResult.moodAnalysis);
      const baseScore = musicological.totalScore;

      const key = `${rec.artist.toLowerCase().trim()} - ${rec.songName.toLowerCase().trim()}`;
      const count = recFrequencies[key] || 0;

      // Dynamic fatigue score (0 to 1 asymptotically)
      const fatigueScore = count > 0 ? 1 - (1 / (1 + count * 0.15)) : 0;

      // Penalty is capped at 10% of the base score, but since base is up to 100, we cap it at 10 points maximum (10% influence)
      const penalty = Math.round(fatigueScore * 10 * 10) / 10; // Round to 1 decimal place
      const adjustedScore = Math.max(1, baseScore - penalty);

      return { 
        ...rec, 
        scores,
        baseSimilarityScore: baseScore,
        similarityScore: Math.round(adjustedScore),
        musicological,
        fatigueScore,
        recommendationCount: count,
        fatiguePenalty: penalty
      };
    });

    // Apply confidence threshold: If weighted similarity score is below 70%, discard it!
    let filtered = itemsWithScores.filter((item) => item.similarityScore >= 70);

    // Dynamic threshold fallback: if fewer than 6 items pass the 70 threshold, relax it to 60.
    if (filtered.length < 6) {
      filtered = itemsWithScores.filter((item) => item.similarityScore >= 60);
    }
    // If still fewer than 4 items pass, do not filter out anything so that we always load recommendations.
    if (filtered.length < 4) {
      filtered = itemsWithScores;
    }

    if (activeMoodFilter !== "All Matched") {
      const currentFilter = FILTER_BAR_OPTIONS.find((f) => f.id === activeMoodFilter);
      if (currentFilter && currentFilter.dimension !== "none") {
        const dim = currentFilter.dimension as keyof SongScores;
        let moodFiltered = filtered.filter((item) => item.scores[dim] >= 45);
        
        // Dynamic threshold fallback for mood: if fewer than 3 items pass 45, relax to 30.
        if (moodFiltered.length < 3) {
          moodFiltered = filtered.filter((item) => item.scores[dim] >= 30);
        }
        // If still empty, fall back to all items so that we never show an empty list.
        if (moodFiltered.length === 0) {
          moodFiltered = filtered;
        }
        
        filtered = moodFiltered;
        // Sort by mood score first, but if nearly identical (within 2 points), prefer less frequently recommended
        filtered.sort((a, b) => {
          if (Math.abs(b.scores[dim] - a.scores[dim]) <= 2) {
            const countA = a.recommendationCount;
            const countB = b.recommendationCount;
            if (countA !== countB) {
              return countA - countB;
            }
          }
          return b.scores[dim] - a.scores[dim];
        });
      }
    } else {
      // Default: sort descending by similarityScore
      filtered.sort((a, b) => {
        // Requirement 7: If two songs have nearly identical match scores (within 1 point), prefer the one shown less frequently.
        if (Math.abs(b.similarityScore - a.similarityScore) <= 1) {
          const countA = a.recommendationCount;
          const countB = b.recommendationCount;
          if (countA !== countB) {
            return countA - countB; // Prefer lower count
          }
        }
        return b.similarityScore - a.similarityScore;
      });
    }

    const maxRecs = PRICING_CONFIG[subscriptionState.plan].limits.maxRecommendations;
    return filtered.slice(0, maxRecs);
  }, [analysisResult, activeMoodFilter, selectedSong, calculateMusicologicalScore, subscriptionState.plan, recFrequencies]);

  // Cluster recommendations into Legendary Matches, Strong Matches, and Hidden Discoveries
  const clusteredRecommendations = React.useMemo(() => {
    const list = processedRecommendations;
    if (list.length === 0) return [];
    
    // Initial partitioning based on adjusted similarityScore
    let legendaryItems = list.filter(item => item.similarityScore >= 88);
    let strongItems = list.filter(item => item.similarityScore >= 82 && item.similarityScore < 88);
    let hiddenItems = list.filter(item => item.similarityScore < 82);

    // Fulfill Requirement 5: Ensure every result contains Legendary, Strong, and Hidden
    if (list.length >= 3) {
      // 1. Ensure Legendary Matches is not empty
      if (legendaryItems.length === 0) {
        // Take the absolute best item from the sorted list
        const item = list[0];
        legendaryItems = [item];
        strongItems = strongItems.filter(i => i !== item);
        hiddenItems = hiddenItems.filter(i => i !== item);
      }

      // 2. Ensure Hidden Discoveries is not empty
      if (hiddenItems.length === 0) {
        // Take the lowest matching item that is not the legendary item
        const available = list.filter(i => !legendaryItems.includes(i));
        const item = available[available.length - 1];
        if (item) {
          hiddenItems = [item];
          strongItems = strongItems.filter(i => i !== item);
        }
      }

      // 3. Ensure Strong Matches is not empty
      if (strongItems.length === 0) {
        // Take an item that is not in legendary or hidden
        const item = list.find(i => !legendaryItems.includes(i) && !hiddenItems.includes(i));
        if (item) {
          strongItems = [item];
          legendaryItems = legendaryItems.filter(i => i !== item);
          hiddenItems = hiddenItems.filter(i => i !== item);
        } else {
          // If all items are in legendary/hidden, we must split one of them
          if (legendaryItems.length > 1) {
            const popped = legendaryItems.pop();
            strongItems = [popped];
          } else if (hiddenItems.length > 1) {
            const shifted = hiddenItems.shift();
            strongItems = [shifted];
          }
        }
      }
    } else {
      // If we have fewer than 3 items, distribute them one per group
      legendaryItems = [];
      strongItems = [];
      hiddenItems = [];
      list.forEach((item, idx) => {
        if (idx === 0) legendaryItems.push(item);
        else if (idx === 1) strongItems.push(item);
        else hiddenItems.push(item);
      });
    }

    return [
      {
        id: "legendary",
        title: "Legendary Matches",
        description: "Objectively elite matches sharing pristine songwriting and production profiles.",
        items: legendaryItems,
        badgeColor: "bg-purple-500/10 text-purple-700 border-purple-500/15"
      },
      {
        id: "strong",
        title: "Strong Matches",
        description: "Highly compatible tracks sharing extremely compatible sonic attributes and acoustic properties.",
        items: strongItems,
        badgeColor: "bg-amber-500/10 text-amber-700 border-amber-500/15"
      },
      {
        id: "hidden",
        title: "Hidden Discoveries",
        description: "Lesser-known gems, different genres, or cross-language discoveries that share beautifully aligned vibes.",
        items: hiddenItems,
        badgeColor: "bg-sky-500/10 text-sky-700 border-sky-500/15"
      }
    ].filter(group => group.items.length > 0);
  }, [processedRecommendations]);

  // Handle initial load - supports deep linking via shared query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const querySong = params.get("song");
    const queryArtist = params.get("artist");

    if (querySong && queryArtist) {
      const sharedSong: SongItem = {
        id: `shared_${Date.now()}`,
        name: decodeURIComponent(querySong),
        artist: decodeURIComponent(queryArtist),
        album: params.get("album") ? decodeURIComponent(params.get("album")!) : "Shared via MoodLoop",
        artworkUrl: params.get("artwork") ? decodeURIComponent(params.get("artwork")!) : "https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&q=80&w=400",
        previewUrl: params.get("preview") ? decodeURIComponent(params.get("preview")!) : "",
        appleMusicUrl: "",
        releaseYear: params.get("year") ? decodeURIComponent(params.get("year")!) : "N/A"
      };
      // Load the shared song and transition directly to the analysis workspace
      handleSelectSong(sharedSong, true);
    } else {
      const defaultSong: SongItem = {
        id: "492023912",
        name: "Midnight City",
        artist: "M83",
        album: "Hurry Up, We're Dreaming",
        artworkUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=500",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
        appleMusicUrl: "https://music.apple.com/us/album/midnight-city/1512401777?i=1512401783",
        releaseYear: "2011"
      };
      handleSelectSong(defaultSong, false, undefined, true);
    }
  }, []);

  // Rotate rotating placeholder examples
  const placeholderExamples = [
    "Kannukulla",
    "Still With You",
    "Maruvaarthai",
    "Nightcall",
    "505",
    "After Dark",
    "The Night We Met"
  ];

  useEffect(() => {
    if (view !== "landing") return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [view]);

  // Set up selected song
  const handleSelectSong = async (
    song: SongItem, 
    shouldTransition: boolean = true, 
    feedbackOverride?: UserFeedback[],
    isBackground: boolean = false
  ) => {
    if (song && song.id !== "emotion_mode" && !isBackground) {
      const check = recordSearch(subscriptionState, "song");
      if (!check.allowed) {
        setSubModalGateMessage("You've reached today's free limit. Upgrade to MoodLoop Plus for unlimited discovery.");
        setIsSubModalOpen(true);
        return;
      }
      updateSubscriptionState(check.newState);
    }

    if (song && song.id !== "emotion_mode") {
      if (checkFeatureAccess(subscriptionState, "searchHistory")) {
        setSearchHistory((prev) => {
          const filtered = prev.filter((s) => s.id !== song.id && s.name.toLowerCase() !== song.name.toLowerCase());
          return [song, ...filtered].slice(0, 20); // Maintain top 20
        });
      } else {
        setSearchHistory([]);
      }
    }
    if (shouldTransition) {
      setView("app");
    }
    setSelectedSong(song);
    
    if (!isBackground) {
      setLoading(true);
      setCinematicLoading(true);
      setAnalysisResult(null);
    }
    
    setErrorMsg(null);
    setActiveMoodFilter("All Matched");
    setIsApiLoading(true);

    // Stop current playbacks when switching songs
    stopAudio();

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...song, hiddenGems, crossLanguage, languagePref, userFeedback: feedbackOverride || userFeedback }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reach Gemini Vibe-Stream backend (Status: ${response.status})`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Target response was not in JSON format.");
      }

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);
      if (result && result.recommendations) {
        setSessionShownSongs(result.recommendations.map(r => ({ songName: r.songName, artist: r.artist })));
      }
    } catch (err: any) {
      console.warn("Song analysis backend error:", err.message || err);
      if (!isBackground) {
        setErrorMsg("Recommendations temporarily unavailable.");
      }
    } finally {
      // CinematicLoader controls loading state completion
      setIsApiLoading(false);
    }
  };

  // Set up selected emotion search
  const handleAnalyzeEmotion = async (query: string, shouldTransition: boolean = true) => {
    if (!query || query.trim() === "") return;
    const check = recordSearch(subscriptionState, "emotion");
    if (!check.allowed) {
      setSubModalGateMessage("You've reached today's free limit. Upgrade to MoodLoop Plus for unlimited discovery.");
      setIsSubModalOpen(true);
      return;
    }
    updateSubscriptionState(check.newState);

    if (shouldTransition) {
      setView("app");
    }
    setActiveWorkspaceTab("studio");
    setStudioMode("analyzer");

    const emotionSong: SongItem = {
      id: "emotion_mode",
      name: query,
      artist: "Emotion Profile",
      album: "Atmosphere Decoded",
      artworkUrl: getDynamicEmotionArtwork(query),
      previewUrl: "",
      appleMusicUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(query)}`,
      releaseYear: "Now",
    };
    setSelectedSong(emotionSong);
    setLoading(true);
    setCinematicLoading(true);
    setAnalysisResult(null);
    setIsApiLoading(true);
    setErrorMsg(null);
    setActiveMoodFilter("All Matched");

    // Stop current playbacks when switching search content
    stopAudio();

    try {
      const response = await fetch("/api/analyze-emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emotionQuery: query, hiddenGems, crossLanguage, languagePref }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reach Gemini Emotion-Stream backend (Status: ${response.status})`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Target response was not in JSON format.");
      }

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);
      if (result && result.recommendations) {
        setSessionShownSongs(result.recommendations.map(r => ({ songName: r.songName, artist: r.artist })));
      }
      if (result.selectedSong) {
        setSelectedSong(result.selectedSong);
      }
    } catch (err: any) {
      console.warn("Emotion analysis backend error:", err.message || err);
      setErrorMsg("Recommendations temporarily unavailable.");
    } finally {
      // CinematicLoader controls loading state completion
      setIsApiLoading(false);
    }
  };

  const handleRefreshRecommendations = async () => {
    if (!selectedSong || !analysisResult || isRefreshingRecs) return;

    setIsRefreshingRecs(true);

    try {
      // 1. Get the top 4 strongest recommendations from the currently displayed list
      const currentList = processedRecommendations;
      const preservedRecs = currentList.slice(0, 4);
      const preservedKeys = new Set(
        preservedRecs.map(r => `${r.songName.toLowerCase().trim()} - ${r.artist.toLowerCase().trim()}`)
      );

      // 2. Prepare the list of all songs ever shown in this session to exclude them
      // Ensure we include both our sessionShownSongs and the currently shown recommendations
      const currentShown = analysisResult.recommendations.map(r => ({
        songName: r.songName,
        artist: r.artist
      }));

      const allExclusionsMap = new Map<string, { songName: string; artist: string }>();
      
      // Seed with sessionShownSongs
      sessionShownSongs.forEach(s => {
        allExclusionsMap.set(`${s.songName.toLowerCase().trim()} - ${s.artist.toLowerCase().trim()}`, s);
      });

      // Add currently shown songs to exclusion map so we don't duplicate them
      currentShown.forEach(s => {
        allExclusionsMap.set(`${s.songName.toLowerCase().trim()} - ${s.artist.toLowerCase().trim()}`, s);
      });

      // But REMOVE the 4 preserved songs from the exclusion map, because we WANT to keep/allow them!
      preservedRecs.forEach(r => {
        allExclusionsMap.delete(`${r.songName.toLowerCase().trim()} - ${r.artist.toLowerCase().trim()}`);
      });

      const excludeSongsList = Array.from(allExclusionsMap.values());

      // 3. Call the refresh endpoint to fetch 6 new recommendations
      const response = await fetch("/api/refresh-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedSong.name,
          artist: selectedSong.artist,
          excludeSongs: excludeSongsList,
          hiddenGems,
          crossLanguage,
          languagePref,
          userFeedback,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh recommendations.");
      }

      const data = await response.json();
      const newRecs = data.recommendations || [];

      // 4. Merge preserved (4) and new recommendations (6) to make 10
      const mergedRecommendations = [...preservedRecs, ...newRecs].slice(0, 10);

      // 5. Update session memory with the newly fetched recommendations
      const newShownSongs = [...sessionShownSongs];
      newRecs.forEach((r: any) => {
        if (!newShownSongs.some(s => s.songName.toLowerCase() === r.songName.toLowerCase() && s.artist.toLowerCase() === r.artist.toLowerCase())) {
          newShownSongs.push({ songName: r.songName, artist: r.artist });
        }
      });
      setSessionShownSongs(newShownSongs);

      // 6. Update the analysisResult state
      setAnalysisResult(prev => {
        if (!prev) return null;
        return {
          ...prev,
          recommendations: mergedRecommendations
        };
      });

    } catch (err) {
      console.error("Error during recommendations refresh:", err);
    } finally {
      setIsRefreshingRecs(false);
    }
  };

  const handleCinematicComplete = () => {
    setCinematicLoading(false);
    setLoading(false);
    if (selectedSong) {
      if (selectedSong.id !== "emotion_mode") {
        playMusicTrackInput(selectedSong);
      } else {
        const firstRec = analysisResult?.recommendations?.[0];
        if (firstRec && firstRec.previewUrl) {
          playMusicTrackInput({
            name: firstRec.songName,
            artist: firstRec.artist,
            artworkUrl: firstRec.artworkUrl,
            previewUrl: firstRec.previewUrl,
          });
        }
      }
    }
  };

  const handleCancelLoading = () => {
    setCinematicLoading(false);
    setLoading(false);
    setView("landing");
    setSelectedSong(null);
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const playMusicTrackInput = (track: { name: string; artist: string; artworkUrl: string; previewUrl: string }) => {
    if (!track.previewUrl) {
      triggerFallback(track);
      return;
    }

    if (activePlayback?.previewUrl === track.previewUrl) {
      if (isPlaying) {
        pauseAudio();
      } else {
        startAudio();
      }
    } else {
      stopAudio();
      setActivePlayback(track);
      
      const audioObj = new Audio(track.previewUrl);
      audioRef.current = audioObj;
      
      audioObj.addEventListener("loadedmetadata", () => {
        setAudioDuration(audioObj.duration || 0);
      });
      audioObj.addEventListener("timeupdate", () => {
        setAudioProgress(audioObj.currentTime || 0);
      });
      audioObj.addEventListener("ended", () => {
        stopAudio();
      });

      // Handle loading/codec/cors/expired link errors dynamically
      audioObj.addEventListener("error", () => {
        console.warn("Audio load failure detected. Launching alternative streamer...");
        triggerFallback(track);
      });

      startAudio(track);
    }
  };

  const triggerFallback = (track: { name: string; artist: string }) => {
    setFallbackTrack({
      name: track.name,
      artist: track.artist,
      appleMusicUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(track.artist + " " + track.name)}`,
      youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(track.artist + " " + track.name + " official audio")}`,
    });
    stopAudio();
  };

  const startAudio = (trackToRetryFallback?: { name: string; artist: string }) => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn("Dynamic playback hook blocked/failed:", e);
        if (trackToRetryFallback) {
          triggerFallback(trackToRetryFallback);
        }
      });
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setActivePlayback(null);
    setAudioProgress(0);
    setAudioDuration(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setAudioProgress(newTime);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };



  const getYouTubeSearchUrl = (songName: string, artist: string) => {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(artist + " " + songName + " official audio")}`;
  };

  const getAppleMusicSearchUrl = (songName: string, artist: string) => {
    return `https://music.apple.com/us/search?term=${encodeURIComponent(artist + " " + songName)}`;
  };

  const getShareLink = () => {
    if (!selectedSong) return window.location.origin + window.location.pathname;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("song", selectedSong.name);
    url.searchParams.set("artist", selectedSong.artist);
    if (selectedSong.album) url.searchParams.set("album", selectedSong.album);
    if (selectedSong.artworkUrl) url.searchParams.set("artwork", selectedSong.artworkUrl);
    if (selectedSong.previewUrl) url.searchParams.set("preview", selectedSong.previewUrl);
    if (selectedSong.releaseYear) url.searchParams.set("year", selectedSong.releaseYear);
    return url.toString();
  };

  // Helper to retrieve values for rendering the Share Card
  const getShareDetails = () => {
    if (!selectedSong || !analysisResult) return null;
    
    // Sort mood spectrum to extract top 2 highest dimensions
    const moods = Object.entries(analysisResult.moodAnalysis).map(([key, val]) => {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      return { label, score: val as number };
    });
    moods.sort((a, b) => b.score - a.score);
    const topMoods = moods.slice(0, 2);

    // Get top matching song
    const topMatch = analysisResult.recommendations?.[0];

    const shareLink = getShareLink();

    // Build raw text copy-paste output
    const rawText = `🎵 ${selectedSong.name} by ${selectedSong.artist}

Mood Analysis Profile:
${topMoods.map(m => `✨ ${m.score}% ${m.label}`).join("\n")}

Top Match Recommendation:
${topMatch ? `👉 ${topMatch.songName} (${topMatch.similarityScore}%)` : "No match found"}

Explore the full analysis & recommendations on MoodLoop:
🔗 ${shareLink}

#MoodLoop #MusicRecommendations`;

    return {
      topMoods,
      topMatch,
      rawText,
      shareLink
    };
  };

  const shareDetails = getShareDetails();

  const handleCopyText = () => {
    if (shareDetails) {
      navigator.clipboard.writeText(shareDetails.rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div 
      id="moodloop-app" 
      className="min-h-screen bg-[#FAFAF8] text-[#111111] flex flex-col font-sans transition-colors duration-500 overflow-x-hidden relative"
    >
      
      {/* EARLY ACCESS BANNER */}
      <AnimatePresence>
        {showEarlyAccessBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full bg-[#FAFAF8] border-b border-[#ECECEC]/30 px-4 pt-3 pb-1 md:px-16 flex justify-center relative z-50 overflow-hidden"
          >
            <div className="w-full max-w-7xl bg-[#FEF3C7] border border-[#FCD34D]/50 rounded-xl md:rounded-full px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 shadow-2xs text-xs text-[#78350F]">
              <div className="flex items-center gap-2.5 min-w-0">
                <Info className="w-4 h-4 shrink-0 text-[#D97706]" />
                <span className="font-sans font-medium leading-relaxed">
                  🚧 <strong className="font-semibold">MoodLoop is currently in Early Access.</strong> We're continuously improving our recommendation engine. Some searches may occasionally return less accurate results while we refine the experience. Thank you for helping us build a better music discovery platform.
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto pl-6 md:pl-0">
                <button
                  type="button"
                  onClick={() => setIsEarlyAccessModalOpen(true)}
                  className="underline hover:text-[#92400E] font-medium font-sans cursor-pointer whitespace-nowrap"
                >
                  Learn More
                </button>
                <button
                  type="button"
                  onClick={handleDismissBanner}
                  className="p-1 rounded-full hover:bg-[#FDE68A] transition-colors cursor-pointer text-[#92400E]"
                  aria-label="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* GENTLE SOPHISTICATED EDITORIAL AMBIENT BACKDROP */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[15%] left-[25%] w-[600px] h-[600px] rounded-full bg-[#8B5CF6]/3 blur-[140px]"></div>
      </div>

      {view === "landing" ? (
        <>
          {/* LANDING PLATFORM HEADER */}
          <header className="sticky top-0 z-40 bg-[#FAFAF8]/80 backdrop-blur-md border-b border-[#ECECEC] py-5 px-6 md:px-16 flex items-center justify-between">
            <div className="cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setView("landing")}>
              <MoodLoopLogo />
            </div>
            
            {/* Ambient System Label */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-mono tracking-widest uppercase font-medium text-[#6B6B6B]">Acoustic Signal Connected</span>
            </div>

            {/* Launch Action */}
            <div className="flex items-center gap-3">
              {ENABLE_PREMIUM && (
                <button
                  onClick={() => setIsSubModalOpen(true)}
                  className="px-4 py-2 border border-[#ECECEC] hover:border-[#111111]/30 text-[10px] font-mono font-bold text-[#6B6B6B] hover:text-[#111111] transition-all rounded-full flex items-center gap-1.5 cursor-pointer uppercase"
                >
                  👑 {subscriptionState.plan === "free" ? "Pricing Plans" : `Plan: ${subscriptionState.plan}`}
                </button>
              )}
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView("app")}
                className="px-5 py-2.5 bg-[#111111] text-white font-medium text-xs rounded-full hover:bg-neutral-800 transition-all flex items-center gap-2 cursor-pointer shadow-sm font-sans"
              >
                Open Studio
              </motion.button>
            </div>
          </header>

          {/* LANDING PAGE BODY */}
          <div className="w-full relative z-10 flex flex-col items-center">
            
            {/* SECTION 1 — IMMERSIVE HERO */}
            <section className="pt-32 pb-24 px-6 text-center max-w-4xl mx-auto flex flex-col items-center relative">
              
              {/* Large Centered Editorial Typography */}
              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl sm:text-8xl md:text-9xl font-normal tracking-tight font-serif text-[#111111] mb-8 leading-[0.9]"
              >
                Find songs that <br />
                <span className="italic font-light text-[#8B5CF6]">feel the same.</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-base sm:text-lg text-[#6B6B6B] max-w-md mx-auto font-light leading-relaxed mb-16 font-sans"
              >
                Not the same genre. Not the same artist. The same feeling.
              </motion.p>

              {/* Large Search Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-2xl relative z-30 text-left"
              >
                <SongSearch
                  onSelectSong={(song) => handleSelectSong(song, true)}
                  onQueryChange={(q) => setHeroTypedQuery(q)}
                  isLoading={loading}
                  placeholder={`Try "${placeholderExamples[placeholderIndex]}"`}
                  onPlayClick={playMusicTrackInput}
                  activePlayback={activePlayback}
                  isPlaying={isPlaying}
                />
              </motion.div>

              {/* LIVE EMOTIONAL DNA DECRYPTION */}
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full max-w-2xl mx-auto mt-12 space-y-4"
                >
                  <div className="flex justify-between font-mono text-[9px] text-[#6B6B6B] uppercase tracking-wider">
                    <span>Acoustic resonance analyzer</span>
                    <span className="text-[#8B5CF6]">
                      {heroTypedQuery ? "Decryption active" : `Previewing ${placeholderExamples[placeholderIndex]}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-left pt-2">
                    {[
                      { label: "Longing", val: heroTypedQuery ? getTypingScores(heroTypedQuery).longing : (placeholderSongsData[placeholderExamples[placeholderIndex]]?.longing ?? 90) },
                      { label: "Nostalgia", val: heroTypedQuery ? getTypingScores(heroTypedQuery).nostalgia : (placeholderSongsData[placeholderExamples[placeholderIndex]]?.nostalgia ?? 85) },
                      { label: "Warmth", val: heroTypedQuery ? getTypingScores(heroTypedQuery).warmth : (placeholderSongsData[placeholderExamples[placeholderIndex]]?.warmth ?? 70) },
                      { label: "Hope", val: heroTypedQuery ? getTypingScores(heroTypedQuery).hope : (placeholderSongsData[placeholderExamples[placeholderIndex]]?.hope ?? 40) }
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-[10px] text-[#6B6B6B] font-sans">
                          <span>{item.label}</span>
                          <span className="font-mono text-[#111111]">{item.val}%</span>
                        </div>
                        <div className="h-[2px] bg-[#ECECEC] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.val}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-[#8B5CF6]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </section>

            {/* ACOUSTIC GALLERY — CURATED DISCOVERIES */}
            <section className="w-full max-w-6xl px-6 py-32 mx-auto border-t border-[#ECECEC]">
              <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-16 gap-4">
                <div className="text-left space-y-2">
                  <span className="font-mono text-[9px] tracking-widest text-[#6B6B6B] uppercase">
                    01 / Curated Resonance
                  </span>
                  <h2 className="text-4xl md:text-5xl font-normal tracking-tight font-serif text-[#111111]">
                    The Resonance Wall
                  </h2>
                </div>
                <p className="text-xs text-[#6B6B6B] font-light max-w-xs text-left font-sans leading-relaxed">
                  Hover over the artwork to sense its acoustic vectors. Tap a card to load the emotional center.
                </p>
              </div>

              {/* Horizontal Scroll Layout */}
              <div className="flex gap-10 overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent snap-x">
                {FLOATING_WALL_SONGS.map((song, idx) => {
                  const isCurrentPlaying = activePlayback?.previewUrl === song.previewUrl && isPlaying;
                  const scoreMatch = song.moods.longing || song.moods.energy || 92;
                  return (
                    <motion.div
                      key={song.name}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.05, duration: 0.5 }}
                      whileHover={{ y: -4 }}
                      onClick={() => {
                        const songItem: SongItem = {
                          id: `custom-wall-${song.name}`,
                          name: song.name,
                          artist: song.artist,
                          album: "Single",
                          artworkUrl: song.artworkUrl,
                          previewUrl: song.previewUrl,
                          appleMusicUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(song.artist + " " + song.name)}`,
                          releaseYear: "2024"
                        };
                        handleSelectSong(songItem, true);
                      }}
                      className="min-w-[280px] md:min-w-[320px] snap-start cursor-pointer group flex flex-col space-y-4"
                    >
                      {/* Large Album Artwork Box */}
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-[#ECECEC] bg-[#F5F5F3]">
                        <img
                          src={song.artworkUrl}
                          alt={song.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                        />
                        {/* Thin active play indicator */}
                        {isCurrentPlaying && (
                          <div className="absolute top-4 right-4 bg-[#111111] text-white p-2 rounded-full shadow-md">
                            <Pause className="w-3.5 h-3.5 fill-current text-white" />
                          </div>
                        )}
                      </div>

                      {/* Minimal metadata: Artwork, Song, Artist, Match */}
                      <div className="text-left space-y-1">
                        <h3 className="text-sm font-medium text-[#111111] truncate">{song.name}</h3>
                        <p className="text-xs text-[#6B6B6B] truncate">{song.artist}</p>
                        <p className="text-[11px] font-mono text-[#8B5CF6] pt-0.5">{scoreMatch}% Emotional Match</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* DISCOVERY PATHWAYS — MOOD CLUSTERS */}
            <section className="w-full max-w-6xl px-6 py-32 mx-auto border-t border-[#ECECEC]">
              <div className="flex flex-col items-start text-left max-w-2xl mb-16 space-y-2">
                <span className="font-mono text-[9px] tracking-widest text-[#6B6B6B] uppercase">
                  02 / Mood Collections
                </span>
                <h2 className="text-4xl md:text-5xl font-normal tracking-tight font-serif text-[#111111]">
                  Resonance Collections
                </h2>
                <p className="text-xs text-[#6B6B6B] leading-relaxed font-light font-sans max-w-lg pt-2">
                  Carefully mapped auditory clusters. Select a collection below to view its emotional nodes.
                </p>
              </div>

              {/* Collections Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {(["longing", "nostalgia", "latenight"] as const).map((clusterKey) => {
                  const cluster = CLUSTERS[clusterKey];
                  return (
                    <div key={clusterKey} className="bg-white p-6 rounded-[28px] border border-[#ECECEC] space-y-6 flex flex-col justify-between">
                      <div className="space-y-3 text-left">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[#8B5CF6] font-bold">
                          {cluster.gravityWell}
                        </span>
                        <h3 className="text-2xl font-normal text-[#111111] font-serif">
                          {cluster.title}
                        </h3>
                        <p className="text-xs text-[#6B6B6B] leading-relaxed font-sans">
                          {cluster.desc}
                        </p>
                      </div>

                      {/* Song nodes minimal listing */}
                      <div className="space-y-3 pt-4 border-t border-[#ECECEC]">
                        {cluster.songs.map((s, sIdx) => (
                          <div 
                            key={s.name}
                            onClick={() => {
                              const songItem: SongItem = {
                                id: `cluster-${clusterKey}-${sIdx}`,
                                name: s.name,
                                artist: s.artist,
                                album: "Collection",
                                artworkUrl: s.artworkUrl,
                                previewUrl: s.previewUrl,
                                appleMusicUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(s.artist + " " + s.name)}`,
                                releaseYear: "2024"
                              };
                              handleSelectSong(songItem, true);
                            }}
                            className="flex items-center justify-between cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0 text-left">
                              <img 
                                src={s.artworkUrl} 
                                alt={s.name} 
                                className="w-8 h-8 rounded-lg object-cover border border-[#ECECEC]"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-[#111111] truncate group-hover:text-[#8B5CF6] transition-colors">{s.name}</p>
                                <p className="text-[10px] text-[#6B6B6B] truncate">{s.artist}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-[#8B5CF6] bg-[#8B5CF6]/5 px-1.5 py-0.5 rounded">
                              {s.match}% Match
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* INTERACTIVE PATHWAYS — DISCOVERY TRAILS */}
            <section className="w-full max-w-6xl px-6 py-32 mx-auto border-t border-[#ECECEC]">
              <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-16 gap-4">
                <div className="text-left space-y-2">
                  <span className="font-mono text-[9px] tracking-widest text-[#6B6B6B] uppercase">
                    03 / Discovery Paths
                  </span>
                  <h2 className="text-4xl md:text-5xl font-normal tracking-tight font-serif text-[#111111]">
                    Discovery Trails
                  </h2>
                </div>
                
                {/* Curated pathway selectors */}
                <div className="flex flex-wrap items-center gap-2 relative z-30 shrink-0">
                  {songJourneys.map((journey, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedJourneyIndex(i);
                        setActiveJourneySong(null);
                      }}
                      className={`px-4 py-2 rounded-full text-[10px] font-mono tracking-widest uppercase font-bold transition-all cursor-pointer ${
                        selectedJourneyIndex === i
                          ? "bg-[#111111] text-white shadow-sm"
                          : "bg-[#F5F5F3] border border-[#ECECEC] text-[#6B6B6B] hover:text-[#111111] hover:bg-[#ECECEC]"
                      }`}
                    >
                      Trail 0{i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left max-w-5xl mx-auto">
                
                {/* Stage detail viewer */}
                <div className="lg:col-span-5">
                  <div className="p-6 rounded-[32px] bg-white border border-[#ECECEC] space-y-6 relative overflow-hidden">
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#8B5CF6] font-bold block">
                        TRAIL CONTEXT
                      </span>
                      <h3 className="text-xl font-normal text-[#111111] font-serif leading-none pt-1">
                        {songJourneys[selectedJourneyIndex].title}
                      </h3>
                      <p className="text-[12px] text-[#6B6B6B] font-light font-sans leading-relaxed pt-2">
                        {songJourneys[selectedJourneyIndex].description}
                      </p>
                    </div>

                    {activeJourneySong ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-2xl bg-[#F5F5F3] border border-[#ECECEC] space-y-4"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={activeJourneySong.artworkUrl}
                            alt={activeJourneySong.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover border border-[#ECECEC] shadow-sm"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[#111111] truncate font-sans">{activeJourneySong.name}</h4>
                            <p className="text-[10px] text-[#6B6B6B] truncate font-sans">{activeJourneySong.artist}</p>
                          </div>
                        </div>

                        <p className="text-[11px] text-[#6B6B6B] leading-relaxed italic">
                          "{activeJourneySong.description}"
                        </p>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              playMusicTrackInput({
                                name: activeJourneySong.name,
                                artist: activeJourneySong.artist,
                                artworkUrl: activeJourneySong.artworkUrl,
                                previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a"
                              });
                            }}
                            className="px-3.5 py-1.5 bg-[#111111] text-white text-[10px] font-bold rounded-full flex items-center gap-1 cursor-pointer hover:bg-neutral-800 transition-colors"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" /> Preview Snippet
                          </button>
                          <button
                            onClick={() => {
                              const songItem: SongItem = {
                                id: `custom-journey-${activeJourneySong.name}`,
                                name: activeJourneySong.name,
                                artist: activeJourneySong.artist,
                                album: "Single",
                                artworkUrl: activeJourneySong.artworkUrl,
                                previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/Music/30/1e/8a/mzm.grpsgwwb.aac.p.m4a",
                                appleMusicUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(activeJourneySong.artist + " " + activeJourneySong.name)}`,
                                releaseYear: "2024"
                              };
                              handleSelectSong(songItem, true);
                            }}
                            className="px-3.5 py-1.5 bg-white border border-[#ECECEC] text-[#111111] text-[10px] font-bold rounded-full flex items-center gap-1 cursor-pointer hover:bg-[#F5F5F3] transition-colors"
                          >
                            Explore Matches
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="p-6 rounded-2xl border border-dashed border-[#ECECEC] text-[#6B6B6B] text-xs text-center font-mono py-12">
                        Click any trail node to unlock emotional transitions
                      </div>
                    )}
                  </div>
                </div>

                {/* Horizontal sequential pathway of circles */}
                <div className="lg:col-span-7 flex flex-col md:flex-row items-center justify-between gap-6 relative">
                  
                  {/* Connect horizontal bar for desktop */}
                  <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-[1px] bg-[#ECECEC] hidden md:block -z-10" />

                  {songJourneys[selectedJourneyIndex].tracks.map((track, idx) => {
                    const isSelected = activeJourneySong?.name === track.name;
                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -2 }}
                        onClick={() => setActiveJourneySong(track)}
                        className={`flex-1 flex flex-col items-center p-5 rounded-2xl border transition-all duration-300 cursor-pointer w-full md:w-auto ${
                          isSelected
                            ? "bg-[#F5F5F3] border-[#8B5CF6]/40 shadow-sm scale-[1.02]"
                            : "bg-white border-[#ECECEC] hover:border-neutral-300"
                        }`}
                      >
                        <span className="text-[9px] font-mono text-[#6B6B6B] mb-3 block">STAGE 0{idx + 1}</span>
                        
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-sm border border-[#ECECEC] mb-4 shrink-0">
                          <img src={track.artworkUrl} alt={track.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 border-2 border-[#8B5CF6] rounded-xl" />
                          )}
                        </div>

                        <h4 className="text-[11px] font-bold text-[#111111] truncate w-full text-center font-sans">{track.name}</h4>
                        <p className="text-[9px] text-[#6B6B6B] mt-0.5 truncate w-full text-center font-sans">{track.artist}</p>
                      </motion.div>
                    );
                  })}
                </div>

              </div>
            </section>



            {/* SECTION 5 — MOODMIX */}
            <section className="w-full max-w-6xl px-6 py-32 mx-auto border-t border-[#ECECEC]">
              <div className="text-left max-w-2xl mb-16 space-y-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#6B6B6B] font-bold block">04 / Contextual Synthesis</span>
                <h2 className="text-4xl md:text-5xl font-normal tracking-tight font-serif text-[#111111]">
                  Situation & Resonance
                </h2>
                <p className="text-xs text-[#6B6B6B] max-w-lg font-light leading-relaxed font-sans pt-2">
                  Describe your exact reality to synthesize a custom emotional soundscape instantly.
                </p>
              </div>

              <div className="relative rounded-[40px] p-8 md:p-16 bg-white border border-[#ECECEC] max-w-4xl mx-auto overflow-hidden">
                <div className="space-y-8 relative z-10">
                  
                  {/* Floating Prompt Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
                    {[
                      { prompt: "Late night drives under streetlamps", desc: "Nocturnal pavement beats with neon window drops." },
                      { prompt: "Classroom sunsets in high school", desc: "Warm nostalgic waves of fading afternoons." },
                      { prompt: "The bittersweet silence of departure", desc: "For the raw, quiet ache of leaving someone behind." },
                      { prompt: "Drifting in mid-autumn drizzle", desc: "Muted rain, soft piano chords, and cold wind." }
                    ].map((item, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ y: -2 }}
                        onClick={() => {
                          setFeelDescription(item.prompt);
                          setView("app");
                          setActiveWorkspaceTab("studio");
                          setStudioMode("moodmix");
                          
                          // Trigger synthesize
                          setTimeout(() => {
                            handleSynthesizeMoodMix(false);
                          }, 100);
                        }}
                        className="p-5 rounded-2xl bg-[#F5F5F3] hover:bg-[#ECECEC] border border-[#ECECEC] text-left transition-all group cursor-pointer"
                      >
                        <span className="text-xs font-mono text-[#8B5CF6] font-bold block mb-1">👉 {item.prompt}</span>
                        <p className="text-[11px] text-[#6B6B6B] transition-colors leading-relaxed font-light font-sans">{item.desc}</p>
                      </motion.button>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-[#ECECEC] max-w-2xl mx-auto">
                    <p className="text-[9px] text-[#6B6B6B] font-mono tracking-widest uppercase font-bold">
                      OR WRITE A CUSTOM SITUATION BELOW
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3 p-2 bg-[#F5F5F3] border border-[#ECECEC] rounded-full max-w-lg mx-auto">
                      <input
                        type="text"
                        placeholder="Describe your current reality..."
                        value={feelDescription}
                        onChange={(e) => setFeelDescription(e.target.value)}
                        className="bg-transparent text-xs text-[#111111] placeholder-[#6B6B6B]/60 pl-4 pr-2 outline-none flex-1 font-sans"
                      />
                      <button
                        onClick={() => {
                          if (!feelDescription.trim()) {
                            triggerToast("Please write down your situation first!");
                            return;
                          }
                          setView("app");
                          setActiveWorkspaceTab("studio");
                          setStudioMode("moodmix");
                          setTimeout(() => {
                            handleSynthesizeMoodMix(false);
                          }, 100);
                        }}
                        className="px-5 py-2 bg-[#111111] text-white font-bold text-[11px] rounded-full hover:bg-neutral-800 transition-all cursor-pointer flex items-center gap-1 font-sans"
                      >
                        Synthesize <Sparkles className="w-3 h-3 text-white fill-current" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* CALL TO ACTION BANNER */}
            <section className="w-full max-w-5xl px-6 pb-32 mx-auto font-sans border-t border-[#ECECEC] pt-32">
              <div className="relative rounded-[32px] p-10 md:p-16 text-center border bg-white border-[#ECECEC]">
                <div className="space-y-6 max-w-2xl mx-auto relative z-10">
                  <h2 className="text-4xl md:text-5xl font-normal text-[#111111] tracking-tight font-serif">
                    Connect with similar feelings.
                  </h2>
                  <p className="text-[#6B6B6B] text-xs sm:text-sm leading-relaxed max-w-lg mx-auto font-light font-sans">
                    Start exploring now to find songs that capture the same feel, emotion, and energy as the music you already love.
                  </p>
                  <div className="pt-4">
                    <button
                      onClick={() => setView("app")}
                      className="px-8 py-4 bg-[#111111] text-white font-bold rounded-full shadow-sm hover:bg-neutral-800 transition-all duration-300 flex items-center justify-center gap-2.5 mx-auto font-bold text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Discover My Vibe
                      <Sparkles className="w-4 h-4 fill-current pl-0.5 text-white animate-pulse" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* PREMIUM LANDING FOOTER */}
            <footer id="landing-footer" className="w-full border-t border-[#ECECEC] bg-[#F5F5F3] py-12 px-6 font-sans">
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="cursor-pointer" onClick={() => setView("landing")}>
                  <MoodLoopLogo />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6 text-[10px] text-[#6B6B6B] font-mono font-bold tracking-widest uppercase">
                  <span>© 2026 MOODLOOP LABS. ALL RIGHTS RESERVED.</span>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setView("app")} className="text-[#8B5CF6] hover:text-[#8B5CF6]/80 tracking-widest cursor-pointer font-bold">LAUNCH STUDIO</button>
                  </div>
                </div>
              </div>
            </footer>

          </div>
        </>
      ) : (
        <>
          {/* LUXURY TRANSPARENT GLASSHEADER */}
          <nav id="navbar-header" className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#ECECEC] py-3 md:py-5 px-4 md:px-10 flex flex-col md:flex-row items-center justify-between gap-3.5 md:gap-5 font-sans">
            <div className="flex items-center justify-between w-full md:w-auto">
              <div className="cursor-pointer" onClick={() => setView("landing")}>
                <MoodLoopLogo />
              </div>
              <button
                onClick={() => setView("landing")}
                className="md:hidden py-1 px-3 rounded-full bg-[#F5F5F3] border border-[#ECECEC] text-[10px] font-mono font-bold text-[#6B6B6B] hover:bg-[#ECECEC] hover:text-[#111111] transition-colors uppercase tracking-widest cursor-pointer"
              >
                ← Home
              </button>
            </div>

            {/* Autocomplete Search input inside navigation */}
            <div className="w-full md:w-[500px] bg-white p-2 rounded-2xl border border-[#ECECEC] relative z-40 shadow-sm">
              <div className="flex items-center justify-between gap-1.5 mb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveTab("song")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      activeTab === "song"
                        ? "bg-[#111111] text-white"
                        : "text-[#6B6B6B] hover:text-[#111111]"
                    }`}
                  >
                    Songs
                  </button>
                  <button
                    onClick={() => setActiveTab("emotion")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      activeTab === "emotion"
                        ? "bg-[#8B5CF6]/10 text-[#8B5CF6]"
                        : "text-[#6B6B6B] hover:text-[#111111]"
                    }`}
                  >
                    Emotions
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!gatePremiumFeature("hiddenGems", "Hidden Gems Mode")) return;
                      setHiddenGems(!hiddenGems);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      hiddenGems ? "bg-amber-500/10 text-amber-600 border border-amber-500/15" : "text-[#6B6B6B] hover:text-[#111111]"
                    }`}
                    title="Toggle Hidden Gems"
                  >
                    💎 HG
                  </button>
                </div>
              </div>

              {activeTab === "song" ? (
                <SongSearch
                  onSelectSong={handleSelectSong}
                  isLoading={loading}
                  onPlayClick={playMusicTrackInput}
                  activePlayback={activePlayback}
                  isPlaying={isPlaying}
                />
              ) : (
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Describe a feeling or mood..."
                    value={emotionQuery}
                    onChange={(e) => setEmotionQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAnalyzeEmotion(emotionQuery, false);
                      }
                    }}
                    className="w-full bg-[#F5F5F3] text-xs text-[#111111] placeholder-[#6B6B6B]/60 pl-3.5 pr-14 py-2 rounded-lg border border-[#ECECEC] focus:border-[#8B5CF6]/40 focus:ring-1 focus:ring-[#8B5CF6]/40 outline-none transition-all font-sans"
                  />
                  <button
                    onClick={() => handleAnalyzeEmotion(emotionQuery, false)}
                    className="absolute right-1 px-2.5 py-1 rounded bg-[#111111] hover:bg-neutral-800 text-white text-[9px] font-bold font-mono transition-all cursor-pointer"
                  >
                    GO
                  </button>
                </div>
              )}

              {/* Compact Inline Language Selector */}
              <div className="mt-2 flex items-center justify-between border-t border-[#ECECEC] pt-2 px-1">
                <span className="text-[8px] font-mono uppercase tracking-wider text-[#6B6B6B] font-bold flex items-center gap-1">
                  <span>🌍</span> Language Preference:
                </span>
                <div className="flex items-center gap-1 bg-[#F5F5F3] p-0.5 rounded-lg border border-[#ECECEC]">
                  {[
                    { id: "same", label: "Same", icon: "🔴", title: "Same Language (100% same origin)" },
                    { id: "similar", label: "Similar", icon: "🟣", title: "Similar Languages Ecosystem (Default)" },
                    { id: "global", label: "Global", icon: "🌍", title: "Global Discovery (Any language matching vibe)" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (opt.id === "global" && !gatePremiumFeature("crossLanguage", "Cross-Language Discovery")) {
                          return;
                        }
                        setLanguagePref(opt.id as any);
                      }}
                      className={`px-2 py-0.5 rounded text-[8.5px] font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                        languagePref === opt.id
                          ? "bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/20"
                          : "text-[#6B6B6B] hover:text-[#111111] border border-transparent"
                      }`}
                      title={opt.title}
                    >
                      <span className="mr-0.5 text-[8px]">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setView("landing")}
                className="py-1 px-3.5 rounded-full bg-white border border-[#ECECEC] text-[10px] font-mono font-bold text-[#6B6B6B] hover:bg-[#F5F5F3] hover:text-[#111111] transition-colors uppercase tracking-widest cursor-pointer"
              >
                ← Back to Home
              </button>
              <div className="py-1 px-3.5 rounded-full bg-[#F5F5F3] border border-[#ECECEC] text-[10px] font-mono font-bold text-[#6B6B6B] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                STATION CONNECTED
              </div>
            </div>
          </nav>

          {/* WORKSPACE CONTENT MAIN with premium generous whitespace and spacing */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-10 relative z-10 pb-36 font-sans">

            {/* Elegant Tab bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-[#ECECEC] pb-4">
              <div className="flex items-center gap-1 bg-[#F5F5F3] p-1 rounded-2xl border border-[#ECECEC] shadow-inner w-full sm:w-auto justify-around sm:justify-start">
                {[
                  { id: "studio", label: "Studio", icon: "🔮" },
                  { id: "compare", label: "Compare", icon: "🎭" },
                  { id: "favorites", label: "Favorites", icon: "❤️", count: favorites.length },
                  { id: "playlists", label: "Playlists", icon: "🎵", count: playlists.length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === "compare" && !gatePremiumFeature("compareSongs", "Compare Songs")) {
                        return;
                      }
                      setActiveWorkspaceTab(tab.id as any);
                    }}
                    className={`px-3 py-2 sm:px-4.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                      activeWorkspaceTab === tab.id
                        ? "bg-[#111111] text-white shadow-sm font-bold"
                        : "text-[#6B6B6B] hover:text-[#111111] hover:bg-white/[0.02] border border-transparent"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-neutral-200 text-[#111111] font-mono font-bold">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3.5">
                {ENABLE_PREMIUM && (
                  <button
                    onClick={() => setIsSubModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-[10px] font-mono font-bold text-white tracking-widest uppercase shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    👑 {subscriptionState.plan === "free" ? "UPGRADE" : subscriptionState.plan.toUpperCase()}
                  </button>
                )}
                <span className="hidden md:inline text-[10px] text-[#6B6B6B] font-mono tracking-widest uppercase">🔮 MOODLOOP LABS</span>
              </div>
            </div>

            {/* TAB CONTENT */}
            {activeWorkspaceTab === "studio" && (
              <div className="space-y-8">
                {/* Unified Studio Sub-Mode Toggle */}
                <div id="studio-mode-selector" className="flex items-center gap-1.5 bg-[#F5F5F3] p-1.5 rounded-2xl border border-[#ECECEC] w-fit shadow-sm relative z-20">
                  <button
                    onClick={() => setStudioMode("analyzer")}
                    className={`px-4 py-2 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                      studioMode === "analyzer"
                        ? "bg-[#111111] text-white shadow-sm font-bold"
                        : "text-[#6B6B6B] hover:text-[#111111] hover:bg-[#ECECEC] border border-transparent"
                    }`}
                  >
                    <span>🔮</span> Vibe Analyzer
                  </button>
                  <button
                    onClick={() => setStudioMode("moodmix")}
                    className={`px-4 py-2 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer relative ${
                      studioMode === "moodmix"
                        ? "bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 font-bold"
                        : "text-[#6B6B6B] hover:text-[#111111] hover:bg-[#ECECEC] border border-transparent"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6] animate-pulse" />
                    {ENABLE_PREMIUM ? "Premium MoodMix AI" : "AI MoodMix"}
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8B5CF6]"></span>
                    </span>
                  </button>
                </div>

                {studioMode === "analyzer" ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* LEFT COLUMN: Large dynamic anchor song & radial mood profile (Col span: 5) */}
                <section id="selection-panel" className="lg:col-span-5 space-y-8 flex flex-col">
          
          {selectedSong && (
            <motion.div 
              id="selected-song-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white border border-[#ECECEC] rounded-[24px] p-6 space-y-6 shadow-sm relative overflow-hidden group"
            >
              <div className="flex flex-col sm:flex-row lg:flex-col gap-6 items-center sm:items-start lg:items-center relative z-10">
                {/* Rounded Album Art */}
                <div 
                  className="relative flex-shrink-0 w-44 h-44 sm:w-48 sm:h-48 lg:w-full lg:aspect-square max-w-[300px] lg:max-w-none overflow-hidden rounded-[24px] shadow-sm border border-[#ECECEC] transition-transform duration-500 hover:scale-[1.02]"
                >
                  <img
                    src={selectedSong.artworkUrl || "https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&q=80&w=400"}
                    alt={selectedSong.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Play preview trigger on hover */}
                  <div className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                      onClick={() => playMusicTrackInput({
                        name: selectedSong.name,
                        artist: selectedSong.artist,
                        artworkUrl: selectedSong.artworkUrl,
                        previewUrl: selectedSong.previewUrl,
                      })}
                      className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-2xl"
                    >
                      {isPlaying && activePlayback?.previewUrl === selectedSong.previewUrl ? (
                        <Pause className="w-6 h-6 fill-current" />
                      ) : (
                        <Play className="w-6 h-6 fill-current pl-1" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Song title with Bold cinematic typography */}
                <div className="text-center sm:text-left lg:text-center space-y-2 flex-1 w-full text-[#111111]">
                  <div 
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-mono tracking-widest uppercase font-bold border border-[#ECECEC] bg-[#F5F5F3] text-[#8B5CF6]"
                  >
                    Active Anchor Track
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#111111] font-sans line-clamp-1 leading-none pt-2">
                    {selectedSong.name}
                  </h1>
                  <p className="text-base text-[#6B6B6B] font-medium">{selectedSong.artist}</p>
                  
                  <div className="flex items-center justify-center sm:justify-start lg:justify-center gap-2.5 text-xs text-[#6B6B6B] font-mono pt-1">
                    <span className="max-w-[150px] truncate block">{selectedSong.album}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#6B6B6B]" />
                      {selectedSong.releaseYear}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action listen controls with elegant dynamic accent styling */}
              <div className="space-y-3 pt-3 relative z-10">
                <motion.button
                  id="play-primary-listen-btn"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => playMusicTrackInput({
                    name: selectedSong.name,
                    artist: selectedSong.artist,
                    artworkUrl: selectedSong.artworkUrl,
                    previewUrl: selectedSong.previewUrl,
                  })}
                  className="w-full py-3.5 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 text-sm text-white bg-[#111111] hover:bg-neutral-800"
                >
                  {isPlaying && activePlayback?.previewUrl === selectedSong.previewUrl ? (
                    <>
                      <Pause className="w-4 h-4 fill-current animate-pulse" /> Pause Preview
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current pl-0.5" /> Listen
                    </>
                  )}
                </motion.button>

                {/* Micro external shortcuts */}
                <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-[#ECECEC] mt-3">
                  <a
                    href={getAppleMusicSearchUrl(selectedSong.name, selectedSong.artist)}
                    target="_blank"
                    rel="no-referrer"
                    className="py-2 px-1 flex items-center justify-center gap-1 text-[8px] sm:text-[9px] bg-[#F5F5F3] hover:bg-[#fc3c44]/15 hover:text-[#fc3c44] border border-[#ECECEC] hover:border-[#fc3c44]/20 rounded-xl font-bold font-mono transition-all duration-300"
                  >
                    <AppleMusicLogo size={12} className="shrink-0" />
                    <span>Apple Music</span>
                  </a>
                  <a
                    href={`https://open.spotify.com/search/${encodeURIComponent(selectedSong.name + " " + selectedSong.artist)}`}
                    target="_blank"
                    rel="no-referrer"
                    className="py-2 px-1 flex items-center justify-center gap-1 text-[8px] sm:text-[9px] bg-[#F5F5F3] hover:bg-[#1DB954]/15 hover:text-[#1DB954] border border-[#ECECEC] hover:border-[#1DB954]/20 rounded-xl font-bold font-mono transition-all duration-300"
                  >
                    <SpotifyLogo size={12} className="shrink-0" />
                    <span>Spotify</span>
                  </a>
                  <a
                    href={getYouTubeSearchUrl(selectedSong.name, selectedSong.artist)}
                    target="_blank"
                    rel="no-referrer"
                    className="py-2 px-1 flex items-center justify-center gap-1 text-[8px] sm:text-[9px] bg-[#F5F5F3] hover:bg-rose-600/15 hover:text-rose-500 border border-[#ECECEC] hover:border-rose-600/20 rounded-xl font-bold font-mono transition-all duration-300"
                  >
                    <YouTubeLogo size={12} className="shrink-0" />
                    <span>YouTube</span>
                  </a>
                </div>

                {/* Social Share Trigger button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShareModalOpen(true)}
                  className="w-full mt-2 py-3 px-4 rounded-xl border border-[#ECECEC] font-bold text-xs bg-[#F5F5F3] hover:bg-[#8B5CF6]/10 hover:text-[#8B5CF6] hover:border-[#8B5CF6]/20 transition-all duration-300 flex items-center justify-center gap-2 font-mono cursor-pointer shadow-sm"
                >
                  <Share2 className="w-4 h-4 text-[#8B5CF6] animate-pulse" />
                  <span>Share Mood Analysis & Recs</span>
                </motion.button>


              </div>
            </motion.div>
          )}

          {/* DYNAMIC RADIAL MOOD PROFILER RINGS */}
          {analysisResult && !loading && (
            <EmotionDnaCard
              analysis={analysisResult.editorialAnalysis || {
                situation: `Connecting with the atmospheric feeling.`,
                currentFeeling: analysisResult.moodAnalysis.melancholy > 55 ? "Melancholy" : (analysisResult.moodAnalysis.romance > 55 ? "Romance" : "Reflection"),
                lookingFor: analysisResult.moodAnalysis.energy > 60 ? "Vigor and high structural drive" : "Comfort and quiet resonance",
                playlistDirection: "A beautifully curated sonic arc",
                aiNote: "These songs match your anchor perfectly. Let them sit with you."
              }}
              songName={selectedSong?.name}
              artist={selectedSong?.artist}
            />
          )}

        </section>

        {/* RIGHT COLUMN: Minimalist Recs List (Col span: 7) */}
        <section id="recommendations-container" className="lg:col-span-7 flex flex-col space-y-6">
          
          <div className="flex items-center justify-between border-b border-[#ECECEC] pb-4">
            <div>
              <h2 className="text-2xl font-normal tracking-tight text-[#111111] flex items-center gap-2.5 font-serif">
                <Sparkles className="w-5.5 h-5.5 text-[#8B5CF6]" />
                Songs That Feel The Same
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-1.5 leading-relaxed">
                Matched continuously with your anchor. Explaining the emotional and musical connection.
              </p>
            </div>

            <div 
              className="text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-[#ECECEC] bg-[#F5F5F3] text-[#8B5CF6]"
            >
              10 HARMONIES
            </div>
          </div>

          {/* Graceful Errors View */}
          {errorMsg && (
            <div id="error-alert-banner" className="p-6 bg-red-950/20 border border-red-500/25 rounded-2xl text-center space-y-3">
              <p id="error-message-text" className="text-sm text-red-200 font-medium">
                {errorMsg}
              </p>
              <button
                onClick={() => selectedSong && handleSelectSong(selectedSong)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 rounded-full text-xs text-indigo-100 font-semibold border border-indigo-500/30 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Retry Handshake
              </button>
            </div>
          )}

          {/* MOOD FILTER BAR */}
          {analysisResult && !loading && !isRefreshingRecs && (
            <div id="mood-filter-bar" className="space-y-2.5 pb-2.5 border-b border-white/5">
              <span className="text-[10px] tracking-wider uppercase font-extrabold block text-zinc-400 font-display">
                Dynamically Re-Sort Matches
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                {FILTER_BAR_OPTIONS.map((f) => {
                  const isActive = activeMoodFilter === f.id;
                  const currentPalette = activePalette;
                  
                  return (
                    <button
                      key={f.id}
                      onClick={() => setActiveMoodFilter(f.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold font-sans border whitespace-nowrap transition-all duration-300 cursor-pointer ${
                        isActive
                          ? "bg-[#111111] text-white border-[#111111] shadow-sm font-bold"
                          : "bg-[#F5F5F3] hover:bg-[#ECECEC] border-[#ECECEC] text-[#6B6B6B]"
                      }`}
                    >
                      {renderFilterIcon(f.iconName, `w-3.5 h-3.5` + (isActive ? " animate-pulse" : ""))}
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SKELETON LOADING MODE */}
          {(loading || isRefreshingRecs) ? (
            <div id="loading-recommendations-list" className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 bg-white border border-[#ECECEC] rounded-[20px] animate-pulse space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#ECECEC] rounded-xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 bg-[#ECECEC] rounded"></div>
                      <div className="h-3 w-1/4 bg-[#ECECEC] rounded"></div>
                    </div>
                  </div>
                  <div className="h-10 bg-[#F5F5F3] rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : (
            /* ACTIVE LIST OF RECOMMENDATIONS */
            <div id="recommendation-list-wrapper" className="space-y-8">
              {/* Taste Tuning Feedback Banner */}
              {(() => {
                const activeFeedbacks = userFeedback.filter(
                  f => selectedSong &&
                       f.anchorSong.name.toLowerCase() === selectedSong.name.toLowerCase() &&
                       f.anchorSong.artist.toLowerCase() === selectedSong.artist.toLowerCase()
                );

                if (activeFeedbacks.length === 0) return null;

                const likesCount = activeFeedbacks.filter(f => f.rating === "like").length;
                const dislikesCount = activeFeedbacks.filter(f => f.rating === "dislike").length;

                return (
                  <div className="bg-[#8B5CF6]/5 border border-[#8B5CF6]/15 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
                    <div className="space-y-1">
                      <h4 className="text-xs md:text-sm font-bold text-[#8B5CF6] flex items-center gap-1.5 font-sans">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#8B5CF6] text-white font-mono text-[10px] font-bold">✓</span>
                        Refining matches with Taste Tuning ({activeFeedbacks.length})
                      </h4>
                      <p className="text-xs text-[#6B6B6B] font-medium leading-relaxed font-sans">
                        Applying {likesCount} positive vibe reinforcement{likesCount !== 1 ? 's' : ''} and {dislikesCount} misalignment boundary condition{dislikesCount !== 1 ? 's' : ''} to customize future recommendations.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const finalFeedback = userFeedback.filter(
                          item => !(selectedSong && 
                                    item.anchorSong.name.toLowerCase() === selectedSong.name.toLowerCase() &&
                                    item.anchorSong.artist.toLowerCase() === selectedSong.artist.toLowerCase())
                        );
                        setUserFeedback(finalFeedback);
                        localStorage.setItem("moodloop_feedback", JSON.stringify(finalFeedback));
                        triggerToast("Feedback cleared. Restoring standard recommendations...");
                        handleSelectSong(selectedSong, false, finalFeedback);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-neutral-700 hover:text-purple-700 hover:bg-purple-50 hover:border-purple-200 border border-[#ECECEC] rounded-xl transition-all cursor-pointer bg-white"
                    >
                      Clear Tuning
                    </button>
                  </div>
                );
              })()}

              {/* Recommendation Diversity Engine Banner */}
              {(() => {
                const trackedCount = Object.keys(recFrequencies).length;
                if (trackedCount === 0) return null;

                return (
                  <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
                    <div className="space-y-1 bg-transparent">
                      <h4 className="text-xs md:text-sm font-bold text-indigo-700 flex items-center gap-1.5 font-sans">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-indigo-600 text-white font-mono text-[10px] font-bold">⇅</span>
                        Recommendation Diversity Engine
                      </h4>
                      <p className="text-xs text-[#6B6B6B] font-medium leading-relaxed font-sans">
                        Frequencies tracked for <strong>{trackedCount}</strong> song{trackedCount !== 1 ? 's' : ''}. Applying dynamic fatigue penalties (capped at 10% maximum ranking influence) to naturally rotate recommendations and reduce listening fatigue.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRecFrequencies({});
                        try {
                          localStorage.removeItem("moodloop_rec_frequencies");
                        } catch (e) {}
                        triggerToast("Recommendation fatigue state reset. Showing standard rankings.");
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-neutral-700 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 border border-[#ECECEC] rounded-xl transition-all cursor-pointer bg-white whitespace-nowrap shrink-0"
                    >
                      Reset Fatigue State
                    </button>
                  </div>
                );
              })()}

              {/* Find More Similar Songs Refresh Button */}
              <div className="flex justify-center md:justify-end pb-4 pt-2">
                <button
                  type="button"
                  id="find-more-similar-songs-btn"
                  disabled={isRefreshingRecs}
                  onClick={handleRefreshRecommendations}
                  className={`w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full text-xs font-bold tracking-wider uppercase transition-all shadow-xs border focus:outline-none ${
                    isRefreshingRecs
                      ? "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed"
                      : "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-[#8B5CF6] hover:shadow-md cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                  }`}
                >
                  {isRefreshingRecs ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin text-neutral-400" />
                      <span className="font-mono text-[10px]">Analyzing DNA Vibe...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
                      <span>Find More Similar Songs</span>
                    </>
                  )}
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMoodFilter}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-8"
                >
                  {clusteredRecommendations.length === 0 ? (
                    <div className="p-8 text-center bg-white border border-[#ECECEC] rounded-[20px] text-zinc-500">
                      <p className="font-semibold text-sm">No recommendations matched your selectivity criteria.</p>
                      <p className="text-xs text-[#6B6B6B] mt-1">Try selecting a different anchor track or widening the filter parameters.</p>
                    </div>
                  ) : (
                    clusteredRecommendations.map((group) => (
                  <div key={group.id} className="space-y-4 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-[#ECECEC]/70 pb-3">
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-[#111111] flex items-center gap-2">
                          <span>{group.title}</span>
                          <span className={`text-[10px] uppercase tracking-wider font-bold font-mono px-2 py-0.5 rounded-full border ${group.badgeColor}`}>
                            {group.items.length} {group.items.length === 1 ? 'Track' : 'Tracks'}
                          </span>
                        </h3>
                        <p className="text-xs text-[#6B6B6B] mt-1 font-medium">{group.description}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <AnimatePresence>
                        {group.items.map((rec, index) => {
                          const isRecPlaying = isPlaying && activePlayback?.previewUrl === rec.previewUrl;

                          return (
                            <motion.div
                              id={`recommendation-card-${group.id}-${index}`}
                              key={`${group.id}-${rec.songName}-${index}`}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: index * 0.05 }}
                              className="bg-white hover:bg-[#F5F5F3]/50 border border-[#ECECEC] rounded-[20px] p-4 md:p-5 transition-all duration-300 group flex flex-col justify-between shadow-sm text-left"
                            >
                              {/* Visual Hierarchy: Artwork -> Song Name -> Artist -> Why it Matches */}
                              <div className="flex flex-col gap-4 w-full">
                                {/* Upper Details Block */}
                                <div className="flex items-start gap-4 w-full">
                                  {/* Album Art (Left Column) */}
                                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-[#ECECEC] shadow-xs transition-all duration-300 group-hover:scale-105">
                                    {rec.artworkUrl ? (
                                      <img
                                        src={rec.artworkUrl}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                        alt={rec.songName}
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-[#F5F5F3] flex items-center justify-center">
                                        <Music className="w-6 h-6 text-[#6B6B6B]" />
                                      </div>
                                    )}

                                    {/* Hover overlay play/pause trigger */}
                                    <button
                                      onClick={() => playMusicTrackInput({
                                        name: rec.songName,
                                        artist: rec.artist,
                                        artworkUrl: rec.artworkUrl,
                                        previewUrl: rec.previewUrl,
                                      })}
                                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                      {isRecPlaying ? (
                                        <Pause className="w-6 h-6 text-white fill-current" />
                                      ) : (
                                        <Play className="w-6 h-6 text-white fill-current" />
                                      )}
                                    </button>
                                  </div>

                                  {/* Song Details Column */}
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <h4 className="font-bold text-[#111111] text-base md:text-xl line-clamp-1 group-hover:text-[#8B5CF6] transition-colors font-sans leading-tight">
                                      {rec.songName}
                                    </h4>
                                    <p className="text-[#6B6B6B] text-xs md:text-sm font-semibold">
                                      {rec.artist}
                                    </p>
                                    
                                    <p className="text-xs md:text-sm text-[#4A4A4A] leading-relaxed font-sans pt-1">
                                      {checkFeatureAccess(subscriptionState, "recommendationExplanations") ? (
                                        rec.whyItMatches || `Shares clean production style and vocal tones with ${selectedSong?.name || "the selected song"}.`
                                      ) : (
                                        <span className="text-zinc-400 italic flex items-center gap-1">
                                          👑 Upgrade to Plus to unlock custom recommendation explanations.
                                        </span>
                                      )}
                                    </p>
                                  </div>

                                  {/* Subtle Match Badge */}
                                  <div className="flex flex-col items-end shrink-0 select-none space-y-1">
                                    <span className="text-xs md:text-sm font-mono font-bold bg-[#F5F5F3] px-2.5 py-1 rounded-lg border border-[#ECECEC] text-[#8B5CF6]">
                                      {rec.similarityScore}% MATCH
                                    </span>
                                    {rec.fatiguePenalty > 0 && (
                                      <span 
                                        className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1 cursor-help"
                                        title={`This song has been recommended ${rec.recommendationCount} times previously. A small ${rec.fatiguePenalty}% ranking penalty is applied to rotate recommendations and ensure variety.`}
                                      >
                                        🔄 Rotated (-{rec.fatiguePenalty}%)
                                      </span>
                                    )}
                                    {rec.discoveryScore >= 75 && (
                                      <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-700 px-1.5 py-0.5 rounded border border-amber-500/15 uppercase">
                                        Gem
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Similarity Tags Row (Point 1: 3-5 compact tags) */}
                                <div className="flex flex-wrap gap-1.5 md:gap-2">
                                  {(rec.similarityTags || getSimilarityTagsForSong(rec.songName, rec.artist)).slice(0, 5).map((tag, tIdx) => (
                                    <span 
                                      key={tIdx} 
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-semibold bg-[#F5F5F3] text-[#4A4A4A] border border-[#ECECEC]"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>

                                {/* Similarity Breakdown Row (Point 6: Progress Blocks) */}
                                {(() => {
                                  const bkd = rec.similarityBreakdown || getSimilarityBreakdownForSong(rec.songName, rec.artist);
                                  return (
                                    <div className="bg-[#F5F5F3]/30 border border-[#ECECEC]/50 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 text-left">
                                      <div>
                                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#6B6B6B] font-bold block mb-1">Production</span>
                                        <div className="flex gap-0.5 text-xs text-[#8B5CF6] font-mono leading-none tracking-tight">
                                          {"█".repeat(bkd.production)}{"░".repeat(5 - bkd.production)}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#6B6B6B] font-bold block mb-1">Vocals</span>
                                        <div className="flex gap-0.5 text-xs text-[#8B5CF6] font-mono leading-none tracking-tight">
                                          {"█".repeat(bkd.vocals)}{"░".repeat(5 - bkd.vocals)}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#6B6B6B] font-bold block mb-1">Instrumentation</span>
                                        <div className="flex gap-0.5 text-xs text-[#8B5CF6] font-mono leading-none tracking-tight">
                                          {"█".repeat(bkd.instrumentation)}{"░".repeat(5 - bkd.instrumentation)}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#6B6B6B] font-bold block mb-1">Atmosphere</span>
                                        <div className="flex gap-0.5 text-xs text-[#8B5CF6] font-mono leading-none tracking-tight">
                                          {"█".repeat(bkd.atmosphere)}{"░".repeat(5 - bkd.atmosphere)}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#6B6B6B] font-bold block mb-1">Fan Overlap</span>
                                        <div className="flex gap-0.5 text-xs text-[#8B5CF6] font-mono leading-none tracking-tight">
                                          {"█".repeat(bkd.fanOverlap)}{"░".repeat(5 - bkd.fanOverlap)}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Action Toolbar Row */}
                                <div className="pt-3 border-t border-[#ECECEC]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                                  {/* Primary Playback buttons */}
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <button
                                      onClick={() => playMusicTrackInput({
                                        name: rec.songName,
                                        artist: rec.artist,
                                        artworkUrl: rec.artworkUrl,
                                        previewUrl: rec.previewUrl,
                                      })}
                                      className={`px-4 py-2 rounded-xl text-xs font-bold font-sans tracking-wide transition-all duration-300 flex items-center justify-center gap-2 flex-1 sm:flex-initial cursor-pointer ${
                                        isRecPlaying
                                          ? "bg-red-500 hover:bg-red-600 text-white shadow-sm"
                                          : "bg-[#111111] hover:bg-neutral-800 text-white"
                                      }`}
                                    >
                                      {isRecPlaying ? (
                                        <>
                                          <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                                        </>
                                      ) : (
                                        <>
                                          <Play className="w-3.5 h-3.5 fill-current pl-0.5" /> Listen
                                        </>
                                      )}
                                    </button>

                                    <button
                                      onClick={() => {
                                        const songToExplore: SongItem = {
                                          id: rec.id || String(Math.random()),
                                          name: rec.songName,
                                          artist: rec.artist,
                                          album: rec.album || "Unknown",
                                          artworkUrl: rec.artworkUrl || "",
                                          previewUrl: rec.previewUrl || "",
                                          appleMusicUrl: rec.appleMusicUrl || "",
                                          releaseYear: rec.releaseYear || "Unknown",
                                        };
                                        handleSelectSong(songToExplore, false);
                                      }}
                                      className="px-4 py-2 rounded-xl text-xs font-bold font-sans tracking-wide bg-[#8B5CF6]/10 hover:bg-[#8B5CF6] text-[#8B5CF6] hover:text-white border border-[#8B5CF6]/15 hover:border-[#8B5CF6] transition-all duration-300 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer"
                                      title="Set this song as active and search matching patterns"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Explore Vibe
                                    </button>
                                  </div>

                                  {/* External Links and Favorites */}
                                  <div className="flex items-center gap-1.5 justify-between sm:justify-end w-full sm:w-auto">
                                    <div className="flex items-center gap-1.5 bg-[#F5F5F3] p-1 rounded-xl border border-[#ECECEC]">
                                      <a
                                        href={getAppleMusicSearchUrl(rec.songName, rec.artist)}
                                        target="_blank"
                                        rel="no-referrer"
                                        className="w-7 h-7 rounded-lg hover:bg-[#fc3c44]/15 hover:text-[#fc3c44] flex items-center justify-center transition-all duration-300 text-[#6B6B6B]"
                                        title="Listen on Apple Music"
                                      >
                                        <AppleMusicLogo size={12} />
                                      </a>
                                      <a
                                        href={`https://open.spotify.com/search/${encodeURIComponent(rec.songName + " " + rec.artist)}`}
                                        target="_blank"
                                        rel="no-referrer"
                                        className="w-7 h-7 rounded-lg hover:bg-[#1DB954]/15 hover:text-[#1DB954] flex items-center justify-center transition-all duration-300 text-[#6B6B6B]"
                                        title="Listen on Spotify"
                                      >
                                        <SpotifyLogo size={12} />
                                      </a>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleToggleFavorite(rec)}
                                      className="p-1.5 w-7 h-7 rounded-xl border border-[#ECECEC] bg-[#F5F5F3] hover:bg-rose-50/50 hover:border-rose-300 text-[#6B6B6B] hover:text-rose-500 flex items-center justify-center transition-all duration-300 cursor-pointer"
                                      title={isFavorited(rec.songName, rec.artist) ? "Remove from Saved Favorites" : "Bookmark into Saved Favorites"}
                                    >
                                      <Heart 
                                        className={`w-3.5 h-3.5 ${
                                          isFavorited(rec.songName, rec.artist) 
                                            ? "text-rose-500 fill-current" 
                                            : "text-[#6B6B6B]"
                                        }`} 
                                      />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setStoryDnaSong(rec)}
                                      className="p-1.5 w-7 h-7 rounded-xl border border-[#ECECEC] bg-[#F5F5F3] hover:bg-[#8B5CF6]/10 hover:border-[#8B5CF6]/30 text-[#6B6B6B] hover:text-[#8B5CF6] flex items-center justify-center transition-all duration-300 cursor-pointer"
                                      title="Share Mood DNA"
                                    >
                                      <Share2 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setSongForPlaylistModal(rec)}
                                      className="p-1.5 w-7 h-7 rounded-xl border border-[#ECECEC] bg-[#F5F5F3] hover:bg-indigo-50/50 hover:border-indigo-300 text-[#6B6B6B] hover:text-indigo-600 flex items-center justify-center transition-all duration-300 cursor-pointer"
                                      title="Add to Custom Playlist"
                                    >
                                      <FolderPlus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Taste Tuning Feedback Mechanism */}
                                {(() => {
                                  const isEditingFeedback = activeFeedbackInput && 
                                    activeFeedbackInput.songName === rec.songName && 
                                    activeFeedbackInput.artist === rec.artist;
                                  
                                  const currentFeedback = userFeedback.find(
                                    f => selectedSong &&
                                         f.anchorSong.name.toLowerCase() === selectedSong.name.toLowerCase() &&
                                         f.anchorSong.artist.toLowerCase() === selectedSong.artist.toLowerCase() &&
                                         f.recommendedSong.name.toLowerCase() === rec.songName.toLowerCase() &&
                                         f.recommendedSong.artist.toLowerCase() === rec.artist.toLowerCase()
                                  );

                                  return (
                                    <div className="mt-3 pt-3 border-t border-[#ECECEC]/40 flex flex-col gap-2.5 w-full">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-mono text-[#6B6B6B] font-bold tracking-wider uppercase">
                                          TUNE VIBE
                                        </span>
                                        
                                        <div className="flex items-center gap-1.5">
                                          {/* Thumbs Up Button */}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (currentFeedback && currentFeedback.rating === "like" && !isEditingFeedback) {
                                                handleDeleteFeedback(rec.songName, rec.artist);
                                              } else {
                                                setActiveFeedbackInput({
                                                  songName: rec.songName,
                                                  artist: rec.artist,
                                                  rating: "like",
                                                  comment: currentFeedback?.rating === "like" ? currentFeedback.comment || "" : ""
                                                });
                                              }
                                            }}
                                            className={`h-7 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
                                              currentFeedback?.rating === "like"
                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-xs"
                                                : "bg-[#F5F5F3] hover:bg-emerald-50/50 hover:text-emerald-600 hover:border-emerald-200 border-[#ECECEC] text-[#6B6B6B]"
                                            }`}
                                            title="This recommendation matches perfectly!"
                                          >
                                            <ThumbsUp className={`w-3.5 h-3.5 ${currentFeedback?.rating === "like" ? "fill-emerald-500/10" : ""}`} />
                                            <span>Match</span>
                                          </button>

                                          {/* Thumbs Down Button */}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (currentFeedback && currentFeedback.rating === "dislike" && !isEditingFeedback) {
                                                handleDeleteFeedback(rec.songName, rec.artist);
                                              } else {
                                                setActiveFeedbackInput({
                                                  songName: rec.songName,
                                                  artist: rec.artist,
                                                  rating: "dislike",
                                                  comment: currentFeedback?.rating === "dislike" ? currentFeedback.comment || "" : ""
                                                });
                                              }
                                            }}
                                            className={`h-7 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
                                              currentFeedback?.rating === "dislike"
                                                ? "bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-xs"
                                                : "bg-[#F5F5F3] hover:bg-rose-50/50 hover:text-rose-600 hover:border-rose-200 border-[#ECECEC] text-[#6B6B6B]"
                                            }`}
                                            title="This recommendation is not quite right."
                                          >
                                            <ThumbsDown className={`w-3.5 h-3.5 ${currentFeedback?.rating === "dislike" ? "fill-rose-500/10" : ""}`} />
                                            <span>Misaligned</span>
                                          </button>
                                        </div>
                                      </div>

                                      {/* Existing feedback review state */}
                                      {currentFeedback && !isEditingFeedback && (
                                        <div className="bg-[#F5F5F3]/50 border border-[#ECECEC]/60 rounded-xl p-2.5 flex flex-col gap-1.5 text-left">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-neutral-500 uppercase font-mono tracking-wider">
                                              Your Taste Tuning
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setActiveFeedbackInput({
                                                  songName: rec.songName,
                                                  artist: rec.artist,
                                                  rating: currentFeedback.rating as "like" | "dislike",
                                                  comment: currentFeedback.comment || ""
                                                });
                                              }}
                                              className="text-[10px] text-[#8B5CF6] hover:underline font-semibold cursor-pointer"
                                            >
                                              Edit Reason
                                            </button>
                                          </div>
                                          {currentFeedback.comment ? (
                                            <p className="text-xs text-neutral-700 italic font-sans">
                                              "{currentFeedback.comment}"
                                            </p>
                                          ) : (
                                            <p className="text-xs text-neutral-400 font-sans">
                                              No matching reason provided. Click Edit to add one!
                                            </p>
                                          )}
                                        </div>
                                      )}

                                      {/* Interactive Expandable Input Form */}
                                      {isEditingFeedback && activeFeedbackInput && (
                                        <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-3 flex flex-col gap-2 text-left">
                                          <label className="text-[11px] font-bold text-neutral-700 font-sans">
                                            {activeFeedbackInput.rating === "like" 
                                              ? "What makes this song a perfect match? (Acoustics, vocals, tempo...)" 
                                              : "Why doesn't this match? What is off about the vibe?"}
                                          </label>
                                          <textarea
                                            rows={2}
                                            value={activeFeedbackInput.comment}
                                            onChange={(e) => setActiveFeedbackInput({
                                              ...activeFeedbackInput,
                                              comment: e.target.value
                                            })}
                                            placeholder={activeFeedbackInput.rating === "like"
                                              ? "e.g., The atmospheric guitars and reverb vocals mirror Beach House perfectly."
                                              : "e.g., Too fast and energetic. Looking for slower dream-pop songs."}
                                            className="w-full text-xs p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#8B5CF6] font-sans bg-white"
                                          />
                                          <div className="flex items-center justify-end gap-2 pt-1">
                                            <button
                                              type="button"
                                              onClick={() => setActiveFeedbackInput(null)}
                                              className="px-2.5 py-1.5 text-[11px] font-bold text-neutral-500 hover:text-neutral-700 transition-colors cursor-pointer"
                                            >
                                              Cancel
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                handleSaveFeedback(
                                                  rec.songName,
                                                  rec.artist,
                                                  activeFeedbackInput.rating,
                                                  activeFeedbackInput.comment
                                                );
                                                setActiveFeedbackInput(null);
                                              }}
                                              className="px-3 py-1.5 text-[11px] font-bold bg-[#8B5CF6] hover:bg-neutral-800 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                                            >
                                              Save Preference
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                ))
              )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

        </section>

                  </div>
                ) : (
                  <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
                    {/* Header Banner */}
                    <div className="p-8 rounded-[24px] bg-white border border-[#ECECEC] relative overflow-hidden space-y-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] shrink-0">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] tracking-widest font-bold font-mono text-[#8B5CF6] uppercase">
                            {ENABLE_PREMIUM ? "Premium Feature Suite" : "AI Studio Suite"}
                          </span>
                          <h2 className="text-2xl font-bold text-[#111111] tracking-tight font-serif mt-0.5">MoodMix Emotional Playlist Generator</h2>
                        </div>
                      </div>

                      <p className="text-[#6B6B6B] text-sm leading-relaxed max-w-2xl font-medium">
                        Describe any memory, scenario, song, relationship context, or mood in natural speech. Our deep empathetic language model will build a personalized 15–30 song playlist based strictly on your emotional intensity.
                      </p>
                    </div>

                    {/* Left & Right layout or a clean simple center column */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Configuration panel (col-span 5) */}
                      <div className="lg:col-span-5 space-y-6">
                        <div className="p-6 bg-white border border-[#ECECEC] rounded-[24px] space-y-6 shadow-sm relative z-10 text-left">
                          {/* SUGGESTION LABELS */}
                          <div className="space-y-3">
                            <label className="text-[10px] font-mono tracking-wider text-[#6B6B6B] uppercase font-bold block">
                              Friendly Spark Examples (Click to Load)
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                "my crush left me for her best friend",
                                "songs like kannukulla",
                                "rainy drive at 2am",
                                "i miss school",
                                "first love nostalgia"
                              ].map((promptText, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setFeelDescription(promptText)}
                                  className="px-3 py-1.5 bg-[#F5F5F3] hover:bg-[#8B5CF6]/10 border border-[#ECECEC] hover:border-[#8B5CF6]/20 text-[10px] text-[#111111] font-semibold rounded-lg transition-all text-left truncate max-w-full cursor-pointer"
                                  title={promptText}
                                >
                                  👉 {promptText}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* TEXT BOX */}
                          <div className="space-y-2.5">
                            <label className="text-[10px] font-mono tracking-wider text-[#6B6B6B] uppercase font-bold block">
                              What's on your mind? Describe your situation
                            </label>
                            <div className="relative">
                              <textarea
                                value={feelDescription}
                                onChange={(e) => setFeelDescription(e.target.value)}
                                placeholder="E.g. A rainy 2am highway drive, wondering about other timelines and missed paths... Or songs like Kannukulla."
                                className="w-full h-36 bg-[#F5F5F3] border border-[#ECECEC] hover:border-zinc-300 focus:border-[#8B5CF6]/40 rounded-2xl p-4 text-xs text-[#111111] placeholder-[#6B6B6B]/60 resize-none outline-none focus:ring-1 focus:ring-[#8B5CF6]/20 transition-all leading-relaxed"
                              />
                              {feelDescription && (
                                <button
                                  onClick={() => setFeelDescription("")}
                                  className="absolute top-3.5 right-3.5 p-1 bg-white hover:bg-zinc-100 rounded-full text-[#6B6B6B] hover:text-[#111111] border border-[#ECECEC] transition-colors cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* OPTIONAL VIBE FILTERS COLLAPSIBLE */}
                          <details className="group border border-[#ECECEC] rounded-2xl bg-[#F5F5F3]/30 transition-all">
                            <summary className="p-3.5 flex items-center justify-between text-xs font-semibold text-[#111111] cursor-pointer list-none select-none">
                              <span className="flex items-center gap-2">
                                <Sliders className="w-3.5 h-3.5 text-[#6B6B6B]" />
                                <span>Optional Vibe Filter</span>
                                {selectedAesthetic !== "none" && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 font-mono">
                                    Active
                                  </span>
                                )}
                              </span>
                              <ChevronRight className="w-4 h-4 text-[#6B6B6B] transform group-open:rotate-90 transition-transform" />
                            </summary>
                            
                            <div className="px-4 pb-4 pt-1.5 border-t border-[#ECECEC] space-y-3.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono text-[#6B6B6B] uppercase">Select a Visual & Sonic Backdrop</span>
                                {selectedAesthetic !== "none" && (
                                  <button
                                    onClick={() => setSelectedAesthetic("none")}
                                    className="text-[9px] text-[#8B5CF6] hover:underline font-mono cursor-pointer"
                                  >
                                    Reset Vibe
                                  </button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                {aesthetics.map((aes) => {
                                  const isSel = selectedAesthetic === aes.id;
                                  return (
                                    <button
                                      key={aes.id}
                                      type="button"
                                      onClick={() => setSelectedAesthetic(isSel ? "none" : aes.id)}
                                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                                        isSel 
                                          ? "bg-[#8B5CF6]/10 border-[#8B5CF6] text-[#8B5CF6] shadow-sm" 
                                          : "bg-white border-[#ECECEC] hover:border-[#8B5CF6]/30 hover:bg-[#F5F5F3] w-full"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span className="text-lg">{aes.icon}</span>
                                        {isSel && (
                                          <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse"></span>
                                        )}
                                      </div>
                                      <div className="mt-3">
                                        <h4 className="text-xs font-bold text-[#111111] leading-none tracking-tight">{aes.name}</h4>
                                        <p className="text-[9px] text-[#6B6B6B] mt-1 leading-tight line-clamp-1 group-hover:text-[#111111]">{aes.desc}</p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </details>

                          {/* SYNTHESIZE BUTTON */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isSynthesizing}
                            onClick={handleSynthesizeMoodMix}
                            className={`w-full py-4 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2.5 cursor-pointer shadow-sm transition-all duration-500 ${
                              isSynthesizing
                                ? "bg-[#F5F5F3] border border-[#ECECEC] text-[#6B6B6B] cursor-not-allowed"
                                : "bg-[#111111] text-white hover:bg-[#111111]/90"
                            }`}
                          >
                            {isSynthesizing ? (
                              <>
                                <RotateCcw className="w-4 h-4 animate-spin text-[#8B5CF6]" />
                                Analyzing emotional intent...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 text-white animate-pulse" />
                                {ENABLE_PREMIUM ? "Synthesize Premium MoodMix" : "Synthesize AI MoodMix"}
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>

                      {/* Display results panel (col-span 7) */}
                      <div className="lg:col-span-7 space-y-6">
                        {isSynthesizing && (
                          <div className="p-8 bg-white border border-[#ECECEC] rounded-[24px] text-center space-y-6 flex flex-col items-center justify-center min-h-[350px] shadow-sm">
                            {/* Poetic loader */}
                            <div className="relative w-16 h-16 flex items-center justify-center">
                              <span className="w-16 h-16 border-2 border-[#8B5CF6]/10 border-t-[#8B5CF6] rounded-full animate-spin"></span>
                              <span className="absolute w-10 h-10 border-2 border-[#8B5CF6]/15 border-b-[#8B5CF6] rounded-full animate-spin" style={{ animationDirection: "reverse" }}></span>
                              <Sparkles className="absolute w-5 h-5 text-[#8B5CF6] animate-pulse" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-base font-bold text-[#111111] font-sans">Forging Emotional Map</h3>
                              <p className="text-xs text-[#6B6B6B] font-mono italic max-w-sm">"{synthesisStep}"</p>
                            </div>
                          </div>
                        )}

                        {!isSynthesizing && !moodMixResult && (
                          <div className="p-8 bg-white border border-dashed border-[#ECECEC] rounded-[24px] text-center space-y-4 flex flex-col items-center justify-center min-h-[350px]">
                            <div className="w-12 h-12 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#6B6B6B]">
                              <Disc className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-sm font-bold text-[#111111] font-sans">Void Waiting for Sparks</h3>
                              <p className="text-xs text-[#6B6B6B] max-w-xs leading-relaxed font-semibold">
                                Tell me your story or vibe on the left. We'll map the detected moods as AI Insights instead of form grids.
                              </p>
                            </div>
                          </div>
                        )}

                        {!isSynthesizing && moodMixResult && (
                          <div className="space-y-6 animate-fade-in text-left">
                            {/* Emotional DNA (Companion Mode) */}
                            <div 
                              className="p-8 md:p-10 bg-white border border-[#ECECEC] rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.01)] relative overflow-hidden text-left space-y-6"
                            >
                              <div className="border-b border-[#F5F5F3] pb-4 flex items-baseline justify-between">
                                <h3 className="font-serif text-xl font-normal text-[#1A1A1A] tracking-tight">
                                  Emotion DNA
                                </h3>
                                <span className="text-[9px] text-[#A3A3A3] font-mono tracking-widest uppercase">
                                  Curated Space
                                </span>
                              </div>

                              <div className="space-y-4">
                                <p className="font-serif text-xl md:text-2xl font-light text-[#222222] leading-relaxed italic pr-4">
                                  "{moodMixResult.emotionalProfile?.situationalContext || moodMixResult.emotionalProfile?.situationalAnalysisAndGuidance || moodMixResult.playlistDescription || "Matches your current sentiment precisely."}"
                                </p>
                              </div>

                              <div className="pt-4 flex items-center gap-2 text-xs text-[#737373] font-sans border-t border-[#F5F5F3]">
                                <span className="h-2 w-2 rounded-full bg-[#D8B4FE]" />
                                <span>Curated with warm musical empathy — no clinical scores.</span>
                              </div>
                            </div>

                            {/* Main Playlist container */}
                            <div className="p-6 bg-white border border-[#ECECEC] rounded-[24px] space-y-6 shadow-sm">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#ECECEC] pb-5">
                                <div className="space-y-1.5 text-left">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">
                                      {getAestheticDetails(moodMixResult.aestheticCode).symbol}
                                    </span>
                                    <span className="text-[10px] font-bold font-mono tracking-wider border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-full px-2.5 py-0.5 uppercase">
                                      {getAestheticDetails(moodMixResult.aestheticCode).label}
                                    </span>
                                  </div>
                                  <h3 className="text-lxs sm:text-base font-bold text-[#111111] font-sans mt-1">
                                    {moodMixResult.playlistName}
                                  </h3>
                                  <p className="text-xs text-[#6B6B6B] leading-relaxed">
                                    {moodMixResult.playlistDescription}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto self-end sm:self-center">
                                  <button
                                    onClick={() => handleSynthesizeMoodMix(true)}
                                    className="p-2 py-1.5 rounded-xl border border-[#ECECEC] bg-[#F5F5F3] hover:bg-[#ECECEC] flex items-center justify-center text-[#111111] transition-all font-bold gap-1.5 text-xs cursor-pointer"
                                    title="Generate another version with fresh recommendations"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 text-[#6B6B6B]" /> Regenerate
                                  </button>
                                  <button
                                    onClick={handleSaveMoodMix}
                                    className="p-2 py-1.5 rounded-xl border border-[#ECECEC] bg-[#F5F5F3] hover:bg-[#ECECEC] flex items-center justify-center text-[#111111] transition-all font-bold gap-1.5 text-xs cursor-pointer"
                                    title="Save to My Playlists"
                                  >
                                    <Bookmark className="w-3.5 h-3.5 text-[#6B6B6B]" /> Save
                                  </button>
                                </div>
                              </div>

                              {/* Tracks rendering in beautiful order */}
                              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                                {moodMixResult.tracks?.map((track: any, idx: number) => {
                                  const isTrPlaying = activePlayback && activePlayback.previewUrl === track.previewUrl && isPlaying;
                                  const isExplained = !!expandedTrackExplanations[idx];
                                  return (
                                    <div key={idx} className="space-y-2">
                                      <div 
                                        className="p-3 bg-[#F5F5F3]/30 hover:bg-[#F5F5F3]/70 border border-[#ECECEC] rounded-xl transition-all flex items-center justify-between gap-4 text-left"
                                      >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 group">
                                            <img 
                                              src={track.artworkUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=150"} 
                                              alt={track.songName || track.name} 
                                              className="w-full h-full object-cover"
                                            />
                                            <button
                                              onClick={() => playMusicTrackInput({
                                                name: track.songName || track.name,
                                                artist: track.artist,
                                                artworkUrl: track.artworkUrl,
                                                previewUrl: track.previewUrl,
                                              })}
                                              className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                            >
                                              {isTrPlaying ? (
                                                <Pause className="w-3.5 h-3.5 text-white" />
                                              ) : (
                                                <Play className="w-3.5 h-3.5 text-white fill-current" />
                                              )}
                                            </button>
                                          </div>

                                          <div className="min-w-0">
                                            <h4 className="text-xs font-bold text-[#111111] truncate max-w-[200px]">
                                              {track.songName || track.name}
                                            </h4>
                                            <p className="text-[10px] text-[#6B6B6B] mt-1 truncate max-w-[170px] flex items-center gap-1">
                                              {track.artist}
                                              {track.discoveryRating && (
                                                <span className="text-[8px] text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/15 px-1 py-0.2 rounded font-mono">
                                                  {track.discoveryRating}
                                                </span>
                                              )}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          <button
                                            onClick={() => {
                                              setExpandedTrackExplanations(prev => ({
                                                ...prev,
                                                [idx]: !prev[idx]
                                              }));
                                            }}
                                            className={`p-1.5 px-3 rounded-lg border text-[10px] font-sans transition-all cursor-pointer select-none leading-none ${isExplained ? "bg-[#8B5CF6]/10 border-[#8B5CF6]/30 text-[#8B5CF6] font-bold" : "bg-white border-[#ECECEC] hover:border-[#8B5CF6]/20 text-[#6B6B6B] hover:text-[#8B5CF6]"}`}
                                            title="Click to discover why this specific song matches your emotion"
                                          >
                                            Why this song?
                                          </button>
                                        </div>
                                      </div>
                                      {isExplained && (
                                        <div className="px-3 py-2.5 bg-[#8B5CF6]/5 hover:bg-[#8B5CF6]/10 border border-[#8B5CF6]/10 rounded-xl text-xs font-medium text-[#6B6B6B] leading-relaxed italic animate-fade-in text-left flex items-start gap-2">
                                          <span className="select-none text-[#8B5CF6]">💡</span>
                                          <span>{track.whyItFits || track.reasonWhySelected || "Perfect harmony with the emotional curve of this scenario."}</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* COMPARISON WORKSPACE TAB */}
            {activeWorkspaceTab === "compare" && (
              <CompareSection
                palette={activePalette}
                onPlayClick={playMusicTrackInput}
                activePlayback={activePlayback}
                isPlaying={isPlaying}
                onReturnToStudio={() => setActiveWorkspaceTab("studio")}
              />
            )}

            {/* FAVORITES SHELF WORKSPACE TAB */}
            {activeWorkspaceTab === "favorites" && (
              <FavoritesSection
                favorites={favorites}
                onRemove={(songName, artist) => {
                  setFavorites(prev => prev.filter(
                    (fav) => !(fav.songName.toLowerCase().trim() === songName.toLowerCase().trim() &&
                               fav.artist.toLowerCase().trim() === artist.toLowerCase().trim())
                  ));
                }}
                onExploreVibe={(song) => {
                  handleSelectSong(song, false);
                  setActiveWorkspaceTab("studio");
                }}
                onPlayClick={playMusicTrackInput}
                activePlayback={activePlayback}
                isPlaying={isPlaying}
                onStoryDnaClick={(song) => setStoryDnaSong(song)}
                palette={activePalette}
                onReturnToStudio={() => setActiveWorkspaceTab("studio")}
              />
            )}

            {/* PLAYLISTS COMPILATION WORKSPACE TAB */}
            {activeWorkspaceTab === "playlists" && (
              <PlaylistsSection
                playlists={playlists}
                onCreatePlaylist={(name, description) => {
                  const limit = PRICING_CONFIG[subscriptionState.plan].limits.maxPlaylists;
                  if (playlists.length >= limit) {
                    setSubModalGateMessage(`Free users can save up to ${limit} playlists. Upgrade to Plus or Studio for unlimited playlists!`);
                    setIsSubModalOpen(true);
                    return;
                  }
                  const newPl: Playlist = {
                    id: Math.random().toString(36).substring(2, 9),
                    name,
                    description,
                    createdAt: Date.now(),
                    songs: []
                  };
                  setPlaylists(prev => [newPl, ...prev]);
                }}
                onSaveMoodMixPlaylist={(name, description, songs) => {
                  const limit = PRICING_CONFIG[subscriptionState.plan].limits.maxPlaylists;
                  if (playlists.length >= limit) {
                    setSubModalGateMessage(`Free users can save up to ${limit} playlists. Upgrade to Plus or Studio for unlimited playlists!`);
                    setIsSubModalOpen(true);
                    return;
                  }
                  const playlistId = Math.random().toString(36).substring(2, 9);
                  const formattedSongs: PlaylistSong[] = songs.map((s, idx) => ({
                    id: s.id || `moodmix-track-${idx}-${Math.random().toString(36).substring(2, 5)}`,
                    name: s.songName || s.name,
                    artist: s.artist,
                    album: s.album || "Unknown",
                    artworkUrl: s.artworkUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400",
                    previewUrl: s.previewUrl || "",
                    appleMusicUrl: s.appleMusicUrl || "",
                    releaseYear: s.releaseYear || "Unknown",
                    addedAt: Date.now() + idx * 10
                  }));
                  const newPl: Playlist = {
                    id: playlistId,
                    name,
                    description,
                    createdAt: Date.now(),
                    songs: formattedSongs
                  };
                  setPlaylists(prev => [newPl, ...prev]);
                }}
                onDeletePlaylist={(id) => {
                  setPlaylists(prev => prev.filter(p => p.id !== id));
                }}
                onRemoveSongFromPlaylist={(playlistId, songId) => {
                  setPlaylists(prev => prev.map(p => {
                    if (p.id === playlistId) {
                      return { ...p, songs: p.songs.filter(s => s.id !== songId) };
                    }
                    return p;
                  }));
                }}
                onAddSongToPlaylist={(playlistId, song) => {
                  setPlaylists(prev => prev.map(p => {
                    if (p.id === playlistId) {
                      const exists = p.songs.some(s => s.id === song.id || (s.name.toLowerCase() === (song.name || song.songName).toLowerCase() && s.artist.toLowerCase() === song.artist.toLowerCase()));
                      if (exists) return p;
                      const artworkUrl = song.artworkUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400";
                      const newSong: PlaylistSong = {
                        id: song.id || Math.random().toString(36).substring(2, 9),
                        name: song.name || song.songName,
                        artist: song.artist,
                        album: song.album || "Unknown",
                        artworkUrl,
                        previewUrl: song.previewUrl || "",
                        appleMusicUrl: song.appleMusicUrl || "",
                        releaseYear: song.releaseYear || "Unknown",
                        addedAt: Date.now()
                      };
                      return { ...p, songs: [...p.songs, newSong] };
                    }
                    return p;
                  }));
                }}
                onExploreVibe={(song) => {
                  const artworkUrl = song.artworkUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400";
                  const songItem: SongItem = {
                    id: song.id,
                    name: song.name,
                    artist: song.artist,
                    album: song.album || "Unknown",
                    artworkUrl,
                    previewUrl: song.previewUrl || "",
                    appleMusicUrl: song.appleMusicUrl || "",
                    releaseYear: song.releaseYear || "Unknown"
                  };
                  handleSelectSong(songItem, false);
                  setActiveWorkspaceTab("studio");
                }}
                onPlayClick={playMusicTrackInput}
                activePlayback={activePlayback}
                isPlaying={isPlaying}
                searchHistory={searchHistory}
                palette={activePalette}
                onReturnToStudio={() => setActiveWorkspaceTab("studio")}
                subscriptionState={subscriptionState}
                onGateFeature={gatePremiumFeature}
              />
            )}

          </main>
    </>
  )}

      {/* COMPACT FLOATING GLASS PLAYER WITH WAVEFORM VISUALIZATION */}
      <AnimatePresence>
        {activePlayback && (
          <motion.div
            id="compact-floating-player"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 150 }}
            className="fixed bottom-6 right-6 z-50 p-5 bg-[#0a0a0f]/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl flex flex-col gap-3.5 max-w-[340px] w-full"
            style={{
              boxShadow: `0 20px 40px -10px ${activePalette.glowColor}`
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-widest text-[#1db954] font-mono font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1db954] animate-pulse"></span>
                ACTIVE AUDIO LOOP
              </span>
              <button
                onClick={stopAudio}
                className="p-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                title="Stop & Close Player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Track metadata details */}
            <div className="flex items-center gap-3">
              <img
                src={activePlayback.artworkUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=120"}
                alt={activePlayback.name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-white/10"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate">{activePlayback.name}</div>
                <div className="text-xs text-neutral-400 truncate mt-0.5">{activePlayback.artist}</div>
              </div>

              {/* Waveform visualizer animation when playing */}
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-5 shrink-0 px-2">
                  <span className="w-[3px] bg-indigo-400 rounded-full animate-bar-1" style={{ height: "100%" }}></span>
                  <span className="w-[3px] bg-rose-400 rounded-full animate-bar-2" style={{ height: "60%" }}></span>
                  <span className="w-[3px] bg-indigo-400 rounded-full animate-bar-3" style={{ height: "80%" }}></span>
                  <span className="w-[3px] bg-[#1db954] rounded-full animate-bar-4" style={{ height: "40%" }}></span>
                </div>
              )}
              
              {/* Floating trigger button */}
              <button
                onClick={() => playMusicTrackInput(activePlayback)}
                className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current pl-0.5" />
                )}
              </button>
            </div>

            {/* Progress Bar slider */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={audioDuration || 30}
                step="0.1"
                value={audioProgress}
                onChange={handleSeek}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>{formatTime(audioProgress)}</span>
                <span>{formatTime(audioDuration || 30)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FALLBACK REDIRECT DIALOG: "Preview unavailable" (Requirement #4) */}
      <AnimatePresence>
        {fallbackTrack && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              id="fallback-redirect-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl text-center relative"
            >
              <button
                onClick={() => setFallbackTrack(null)}
                className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/10 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Preview unavailable</h3>
                <p className="text-xs text-neutral-400">
                  We detected that an official 30s preview snippet is restricted for <span className="text-white font-semibold">"{fallbackTrack.name}"</span>. 
                  Stream or search the full track instantly below:
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <a
                  href={fallbackTrack.appleMusicUrl}
                  target="_blank"
                  rel="no-referrer"
                  className="w-full py-2.5 px-4 bg-[#fc3c44] text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <AppleMusicLogo size={15} /> Open in Apple Music
                </a>
                <a
                  href={fallbackTrack.youtubeUrl}
                  target="_blank"
                  rel="no-referrer"
                  className="w-full py-2.5 px-4 bg-red-600 text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <YouTubeLogo size={15} /> Open in YouTube
                </a>
              </div>

              <button
                onClick={() => setFallbackTrack(null)}
                className="w-full py-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-full text-xs text-neutral-400 hover:text-white transition-colors"
              >
                Back to Loop
              </button>
            </motion.div>
          </div>
        )}

        {/* BEAUTIFUL SHARE CARD POPUP/DIALOG FOR INSTAGRAM STORIES */}
        {shareModalOpen && shareDetails && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              id="share-info-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-950 border border-white/10 p-6 rounded-2xl max-w-sm w-full space-y-5 shadow-2xl relative"
            >
              <button
                onClick={() => setShareModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Your Shareable Loop
                </h3>
                <p className="text-xs text-neutral-400">
                  Perfect format to prompt on Instagram stories, Twitter, or messages!
                </p>
              </div>

              {/* Instagram Card Preview Layout mockup */}
              <div 
                className="p-5 rounded-2xl bg-gradient-to-b from-[#18132e] via-[#090710] to-[#040406] border border-purple-500/20 shadow-inner relative overflow-hidden"
                style={{
                  boxShadow: `0 10px 30px -10px ${activePalette.glowColor}`
                }}
              >
                <div className="absolute right-3 top-3 w-4 h-4 rounded-full bg-purple-500/20 blur-sm pointer-events-none"></div>

                <div className="space-y-4 font-sans select-none text-[#e2e8f0]">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold text-purple-400 tracking-widest font-mono">∞ MOODLOOP</span>
                    <span className="text-[10px] font-bold text-zinc-500">v3.5</span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-[#72c253] font-bold block font-mono">SELECTED VIBE</span>
                    <p className="text-base font-extrabold text-white mt-1">
                      🎵 {selectedSong?.name} <span className="text-purple-300 font-medium">({selectedSong?.artist})</span>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block font-mono">MOOD DNA:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {shareDetails.topMoods.map((m) => (
                        <div key={m.label} className="bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center justify-between">
                          <span className="text-zinc-300">{m.label}</span>
                          <span className="font-bold text-purple-300">{m.score}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {shareDetails.topMatch && (
                    <div className="bg-purple-500/5 border border-purple-500/10 p-3 rounded-xl">
                      <span className="text-[8px] uppercase tracking-widest text-indigo-400 font-black block font-mono">TOP DETECTED MATCH</span>
                      <p className="text-sm font-bold text-white mt-0.5 truncate">
                        {shareDetails.topMatch.songName}
                      </p>
                      <span className="inline-block mt-1 text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400 font-bold">
                        {shareDetails.topMatch.similarityScore}% MATCH
                      </span>
                    </div>
                  )}

                  <div className="text-center text-[9px] text-zinc-500 font-mono italic pt-1 border-t border-white/5">
                    generated by MoodLoop
                  </div>
                </div>
              </div>

              {/* Social sharing targets */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase block font-mono">
                  Share On Social Platforms
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareDetails.rawText)}`}
                    target="_blank"
                    rel="no-referrer"
                    className="py-2.5 px-2 bg-white/5 border border-white/10 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/20 rounded-xl text-[10px] font-bold font-mono transition-all duration-300 flex flex-col items-center justify-center gap-1.5 text-zinc-300 cursor-pointer text-center"
                    title="Share on Twitter"
                  >
                    <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                    <span>Twitter</span>
                  </a>

                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareDetails.shareLink)}`}
                    target="_blank"
                    rel="no-referrer"
                    className="py-2.5 px-2 bg-white/5 border border-white/10 hover:bg-[#1877F2]/10 hover:text-[#1877F2] hover:border-[#1877F2]/20 rounded-xl text-[10px] font-bold font-mono transition-all duration-300 flex flex-col items-center justify-center gap-1.5 text-zinc-300 cursor-pointer text-center"
                    title="Share on Facebook"
                  >
                    <Facebook className="w-4 h-4 text-[#1877F2]" />
                    <span>Facebook</span>
                  </a>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareDetails.rawText)}`}
                    target="_blank"
                    rel="no-referrer"
                    className="py-2.5 px-2 bg-white/5 border border-white/10 hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/20 rounded-xl text-[10px] font-bold font-mono transition-all duration-300 flex flex-col items-center justify-center gap-1.5 text-zinc-300 cursor-pointer text-center"
                    title="Send via Direct Message (WhatsApp)"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleCopyText}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                    copied
                      ? "bg-[#72c253] text-black shadow-lg shadow-emerald-500/25"
                      : "bg-white text-black hover:bg-neutral-200"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 font-extrabold" /> Copied Text! ⚡
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Shareable Text
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareDetails.shareLink);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold font-mono border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                    copiedLink
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                      : "bg-[#111111] text-zinc-300 hover:bg-neutral-900"
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 font-extrabold" /> Link Copied! ⚡
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" /> Copy Direct Share Link
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShareModalOpen(false)}
                  className="w-full py-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Close Modal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Story DNA Modal trigger */}
      <AnimatePresence>
        {storyDnaSong && (
          <StoryDnaCard 
            song={storyDnaSong} 
            onClose={() => setStoryDnaSong(null)} 
            topRecommendation={analysisResult?.recommendations?.[0]}
            moodAnalysis={analysisResult?.moodAnalysis}
          />
        )}
      </AnimatePresence>

      {/* ADD TO PLAYLIST SELECTION MODAL */}
      <AnimatePresence>
        {songForPlaylistModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSongForPlaylistModal(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            ></motion.div>

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-2xl max-w-md w-full p-6 relative z-10 shadow-2xl space-y-4 text-[#e2e8f0]"
            >
              {/* Close Button */}
              <button
                onClick={() => setSongForPlaylistModal(null)}
                className="absolute right-4 top-4 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
                  <span>💿</span> Add to Custom Loop
                </h3>
                <p className="text-xs text-zinc-400">
                  Add <span className="text-purple-300 font-semibold font-sans">"{songForPlaylistModal.songName || songForPlaylistModal.name}"</span> by {songForPlaylistModal.artist} to any playlist.
                </p>
              </div>

              {/* Playlist items */}
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {playlists.length === 0 ? (
                  <div className="p-5 text-center bg-zinc-900/30 rounded-xl border border-white/5">
                    <span className="text-xs text-zinc-500">You don't have any playlists yet. Use the form below to create one!</span>
                  </div>
                ) : (
                  playlists.map((pl) => {
                    const songNameLower = (songForPlaylistModal.songName || songForPlaylistModal.name).toLowerCase();
                    const artistLower = songForPlaylistModal.artist.toLowerCase();
                    const isAlreadyInPlaylist = pl.songs.some(
                      (s) => (s.id === songForPlaylistModal.id) || (s.name.toLowerCase() === songNameLower && s.artist.toLowerCase() === artistLower)
                    );

                    return (
                      <div
                        key={pl.id}
                        className="flex items-center justify-between gap-3 p-3 bg-zinc-900/40 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{pl.name}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">{pl.songs.length} tracks</p>
                        </div>

                        <button
                          onClick={() => {
                            setPlaylists(prev => prev.map(p => {
                              if (p.id === pl.id) {
                                if (isAlreadyInPlaylist) return p;
                                const artworkUrl = songForPlaylistModal.artworkUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400";
                                const newS: PlaylistSong = {
                                  id: songForPlaylistModal.id || Math.random().toString(36).substring(2, 9),
                                  name: songForPlaylistModal.songName || songForPlaylistModal.name,
                                  artist: songForPlaylistModal.artist,
                                  album: songForPlaylistModal.album || "Unknown",
                                  artworkUrl,
                                  previewUrl: songForPlaylistModal.previewUrl || "",
                                  appleMusicUrl: songForPlaylistModal.appleMusicUrl || "",
                                  releaseYear: songForPlaylistModal.releaseYear || "Unknown",
                                  addedAt: Date.now()
                                };
                                return { ...p, songs: [...p.songs, newS] };
                              }
                              return p;
                            }));
                            setSongForPlaylistModal(null);
                          }}
                          disabled={isAlreadyInPlaylist}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isAlreadyInPlaylist
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-not-allowed"
                              : "bg-white text-black hover:bg-neutral-200"
                          }`}
                        >
                          {isAlreadyInPlaylist ? (
                            <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Added</span>
                          ) : (
                            "+ Add"
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Inline Create and Add form */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <h4 className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-400">
                  Or Create a New Folder
                </h4>

                <div className="space-y-2">
                  <input
                    id="modal-playlist-name"
                    type="text"
                    placeholder="Enter playlist name..."
                    className="w-full bg-zinc-900 border border-white/5 text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-purple-500/30 focus:outline-none transition-all font-sans"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const target = e.currentTarget;
                        const val = target.value.trim();
                        if (!val) return;
                        
                        const newId = Math.random().toString(36).substring(2, 9);
                        const artworkUrl = songForPlaylistModal.artworkUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400";
                        const newSong: PlaylistSong = {
                          id: songForPlaylistModal.id || Math.random().toString(36).substring(2, 9),
                          name: songForPlaylistModal.songName || songForPlaylistModal.name,
                          artist: songForPlaylistModal.artist,
                          album: songForPlaylistModal.album || "Unknown",
                          artworkUrl,
                          previewUrl: songForPlaylistModal.previewUrl || "",
                          appleMusicUrl: songForPlaylistModal.appleMusicUrl || "",
                          releaseYear: songForPlaylistModal.releaseYear || "Unknown",
                          addedAt: Date.now()
                        };
                        const newPl: Playlist = {
                          id: newId,
                          name: val,
                          description: "Custom loops curation created on the fly.",
                          createdAt: Date.now(),
                          songs: [newSong]
                        };
                        setPlaylists(prev => [newPl, ...prev]);
                        setSongForPlaylistModal(null);
                      }
                    }}
                  />
                  <div className="text-[9px] font-mono text-zinc-500 text-left leading-normal">
                    💡 Type a playlist name and tap <span className="text-zinc-400 font-bold">"Enter"</span> to save and bundle this song!
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cinematicLoading && (
          <CinematicLoader
            song={selectedSong}
            isLoadingData={isApiLoading}
            matchCount={analysisResult?.recommendations?.length || 27}
            onComplete={handleCinematicComplete}
            onCancel={handleCancelLoading}
          />
        )}
      </AnimatePresence>

      {ENABLE_PREMIUM && (
        <SubscriptionModal
          isOpen={isSubModalOpen}
          onClose={() => {
            setIsSubModalOpen(false);
            setSubModalGateMessage(null);
          }}
          currentState={subscriptionState}
          onUpdateState={updateSubscriptionState}
          triggerToast={triggerToast}
          gateMessage={subModalGateMessage}
        />
      )}

      <EarlyAccessModal
        isOpen={isEarlyAccessModalOpen}
        onClose={() => setIsEarlyAccessModalOpen(false)}
      />

      <Analytics />

    </div>
  );
}
