export interface SongItem {
  id: string;
  name: string;
  artist: string;
  album: string;
  artworkUrl: string;
  previewUrl: string;
  appleMusicUrl: string;
  releaseYear: string;
}

export interface MoodAnalysis {
  nostalgia: number;
  longing: number;
  romance: number;
  warmth: number;
  melancholy: number;
  hopefulness: number;
  energy: number;
}

export interface RecommendationItem {
  songName: string;
  artist: string;
  similarityScore: number;
  discoveryScore: number; // Discovery level 1-100 indicating how uncommon the track is
  isCrossLanguage?: boolean;
  whyItMatches: string;
  album: string;
  artworkUrl: string;
  previewUrl: string;
  appleMusicUrl: string;
  releaseYear: string;
  similarityTags?: string[];
  similarityBreakdown?: {
    production: number;
    vocals: number;
    instrumentation: number;
    atmosphere: number;
    fanOverlap: number;
  };
}

export interface EditorialAnalysis {
  situation: string;
  currentFeeling: string;
  lookingFor: string;
  playlistDirection: string;
  aiNote: string;
  sonicProfile?: string[];
}

export interface ClassificationResult {
  inputType: string;
  identifiedEntity: string;
  identifiedArtist?: string;
}

export interface AnalysisResult {
  selectedSong: SongItem;
  moodAnalysis: MoodAnalysis;
  editorialAnalysis?: EditorialAnalysis;
  recommendations: RecommendationItem[];
  classification?: ClassificationResult;
}

export interface PlaylistSong {
  id: string;
  name: string;
  artist: string;
  album: string;
  artworkUrl: string;
  previewUrl: string;
  appleMusicUrl?: string;
  releaseYear?: string;
  addedAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  songs: PlaylistSong[];
}

export interface UserFeedback {
  anchorSong: { name: string; artist: string };
  recommendedSong: { name: string; artist: string };
  rating: "like" | "dislike" | number;
  comment?: string;
  timestamp: number;
}
