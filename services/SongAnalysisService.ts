import { Type } from "@google/genai";
import { getGeminiClient, generateContentWithRetry, hashGenerator } from "./gemini";
import { SongProfile } from "./types";

export class SongAnalysisService {
  private static profileCache = new Map<string, SongProfile>();

  /**
   * Analyzes the searched song and creates a SongProfile.
   * Leverages Gemini with fallback to a deterministic metadata generator.
   */
  public async analyzeSong(song: {
    id: string;
    name: string;
    artist: string;
    album?: string;
    releaseYear?: string;
    artworkUrl?: string;
    previewUrl?: string;
    appleMusicUrl?: string;
  }): Promise<SongProfile> {
    const { name, artist, album = "Unknown Album", releaseYear = "Unknown", artworkUrl = "", previewUrl = "", appleMusicUrl = "" } = song;
    const cacheKey = `${artist.toLowerCase().trim()} - ${name.toLowerCase().trim()}`;

    if (SongAnalysisService.profileCache.has(cacheKey)) {
      console.log(`[SongAnalysisService] Serving cached profile for: "${name}" by "${artist}"`);
      return SongAnalysisService.profileCache.get(cacheKey)!;
    }

    try {
      console.log(`[SongAnalysisService] Starting analysis for: "${name}" by "${artist}"`);
      const ai = getGeminiClient();

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          moodAnalysis: {
            type: Type.OBJECT,
            properties: {
              nostalgia: { type: Type.INTEGER, description: "Nostalgia score from 0 to 100 based on the selected song's era, legacy, and retro instrumentation." },
              longing: { type: Type.INTEGER, description: "Longing score from 0 to 100 representing intense yearning, searching, or desire." },
              romance: { type: Type.INTEGER, description: "Romance score from 0 to 100 representing romantic, sensual, or close melodic intimacy." },
              warmth: { type: Type.INTEGER, description: "Warmth score from 0 to 100 representing comforting cozy acoustics or soft textures." },
              melancholy: { type: Type.INTEGER, description: "Melancholy score from 0 to 100 representing sad, minor key gravity, or weight." },
              hopefulness: { type: Type.INTEGER, description: "Hopefulness score from 0 to 100 representing optimism or glowing uplifts." },
              energy: { type: Type.INTEGER, description: "Energy score from 0 to 100 representing tempo, rhythm, and active drive." }
            },
            required: ["nostalgia", "longing", "romance", "warmth", "melancholy", "hopefulness", "energy"]
          },
          genres: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Primary genres associated with the track."
          },
          musicalAttributes: {
            type: Type.OBJECT,
            properties: {
              vocalStyle: { type: Type.STRING, description: "Description of the vocals (e.g., 'breathy', 'soulful', 'reverb-heavy', 'clean male')." },
              tempo: { type: Type.STRING, description: "Tempo category: 'slow', 'moderate', or 'fast'." },
              primaryInstruments: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of dominant instruments." },
              productionStyle: { type: Type.STRING, description: "Production characteristics (e.g., 'lo-fi', 'lush orchestral', 'minimalist acoustic', 'gated reverb')." }
            },
            required: ["vocalStyle", "tempo", "primaryInstruments", "productionStyle"]
          }
        },
        required: ["moodAnalysis", "genres", "musicalAttributes"]
      };

      const prompt = `Analyze the song "${name}" by "${artist}" (Album: "${album}", Year: ${releaseYear}).
Rate its musical mood / emotional fingerprint across exactly these seven dimensions each from 0 to 100:
- Nostalgia
- Longing
- Romance
- Warmth
- Melancholy
- Hopefulness
- Energy

Also identify its primary genres and key musical attributes (vocalStyle, tempo, primaryInstruments, productionStyle).`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.25,
        },
      });

      const parsedData = JSON.parse(response.text?.trim() || "{}");

      const profile: SongProfile = {
        songName: name,
        artist,
        album,
        releaseYear,
        artworkUrl,
        previewUrl,
        appleMusicUrl,
        moodAnalysis: parsedData.moodAnalysis,
        genres: parsedData.genres || [],
        musicalAttributes: parsedData.musicalAttributes || {},
      };

      SongAnalysisService.profileCache.set(cacheKey, profile);
      return profile;
    } catch (error: any) {
      if (error instanceof Error && error.message === "QuotaExceeded") {
        console.log(`[SongAnalysisService] Gemini quota exceeded; switching to deterministic profile builder.`);
      } else {
        console.warn(`[SongAnalysisService] Failed to analyze via Gemini, using deterministic fallback for: "${name}"`, error);
      }

      // Deterministic fallback using hash codes to create a plausible profile
      const seed = name + artist;
      const moodAnalysis = {
        nostalgia: hashGenerator(seed, 30, 95, 10),
        longing: hashGenerator(seed, 20, 95, 20),
        romance: hashGenerator(seed, 30, 90, 30),
        warmth: hashGenerator(seed, 40, 95, 40),
        melancholy: hashGenerator(seed, 10, 85, 50),
        hopefulness: hashGenerator(seed, 20, 90, 60),
        energy: hashGenerator(seed, 20, 95, 70),
      };

      const profile: SongProfile = {
        songName: name,
        artist,
        album,
        releaseYear,
        artworkUrl,
        previewUrl,
        appleMusicUrl,
        moodAnalysis,
        genres: ["Acoustic", "Indie", "Soundtrack"],
        musicalAttributes: {
          vocalStyle: "Intimate and expressive",
          tempo: moodAnalysis.energy > 60 ? "fast" : (moodAnalysis.energy < 40 ? "slow" : "moderate"),
          primaryInstruments: ["Acoustic Guitar", "Piano"],
          productionStyle: "Warm analog mix"
        }
      };

      SongAnalysisService.profileCache.set(cacheKey, profile);
      return profile;
    }
  }
}
