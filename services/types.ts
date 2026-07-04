export interface SongProfile {
  songName: string;
  artist: string;
  album: string;
  releaseYear: string;
  artworkUrl?: string;
  previewUrl?: string;
  appleMusicUrl?: string;
  moodAnalysis: {
    nostalgia: number;
    longing: number;
    romance: number;
    warmth: number;
    melancholy: number;
    hopefulness: number;
    energy: number;
  };
  genres?: string[];
  musicalAttributes?: {
    vocalStyle?: string;
    tempo?: string;
    primaryInstruments?: string[];
    productionStyle?: string;
  };
}

export interface CandidateSong {
  songName: string;
  artist: string;
  album?: string;
  releaseYear?: string;
  genre?: string;
}

export interface RankedRecommendation {
  songName: string;
  artist: string;
  similarityScore: number;
  discoveryScore: number;
  isCrossLanguage: boolean;
  whyItMatches: string;
}

export interface UserFeedback {
  anchorSong: { name: string; artist: string };
  recommendedSong: { name: string; artist: string };
  rating: "like" | "dislike" | number;
  comment?: string;
  timestamp: number;
}

export interface RecommendationEngineOptions {
  hiddenGems?: boolean;
  crossLanguage?: boolean;
  languagePref?: string;
  userFeedback?: UserFeedback[];
  excludeSongs?: { songName: string; artist: string }[];
}
