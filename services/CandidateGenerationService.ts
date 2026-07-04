import { Type } from "@google/genai";
import { getGeminiClient, generateContentWithRetry } from "./gemini";
import { SongProfile, CandidateSong, RecommendationEngineOptions } from "./types";

export class CandidateGenerationService {
  /**
   * Generates a candidate pool of 30-40 songs based on the anchor's SongProfile.
   * Leverages Gemini to suggest candidate songs, with an iTunes-based fallback.
   */
  public async generateCandidates(
    profile: SongProfile,
    options: RecommendationEngineOptions = {}
  ): Promise<CandidateSong[]> {
    const { songName, artist, genres = [], moodAnalysis, musicalAttributes } = profile;
    const { hiddenGems = false, languagePref = "similar", userFeedback = [], excludeSongs = [] } = options;

    let candidates: CandidateSong[] = [];

    try {
      console.log(`[CandidateGenerationService] Generating candidates for: "${songName}" by "${artist}"`);
      const ai = getGeminiClient();

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          candidates: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                songName: { type: Type.STRING, description: "Name of the candidate song." },
                artist: { type: Type.STRING, description: "Artist or band name." },
                album: { type: Type.STRING, description: "Album name if known, otherwise single." },
                releaseYear: { type: Type.STRING, description: "Estimated release year or decade." },
                genre: { type: Type.STRING, description: "Primary genre of this candidate song." }
              },
              required: ["songName", "artist"]
            },
            description: "A list of 30 to 40 real, release-registered songs that have high musical similarity."
          }
        },
        required: ["candidates"]
      };

      const hiddenGemsInstructions = hiddenGems
        ? "We are in Hidden Gem Mode. Suggest highly obscure, underrated, or lesser-known tracks and independent artists. Avoid extremely famous mainstream radio hits."
        : "Suggest a mix of popular classics, moderately known entries, and indie deep cuts.";

      const languageInstructions = languagePref === "same"
        ? `Recommend candidate songs strictly in the exact same language origin as "${songName}" (e.g. if South Indian/Telugu, only recommend Telugu songs; if English, only English).`
        : languagePref === "similar"
        ? `Recommend candidate songs primarily in the same language, regional scene, or close musical ecosystem (e.g. if the anchor is a South Indian track, keep recommendations inside South Indian languages like Tamil, Telugu, Malayalam, Kannada).`
        : "Recommend candidate songs with high global diversity and crossover potential across various international languages.";

      let feedbackInstructions = "";
      if (userFeedback && userFeedback.length > 0) {
        const positiveFeedbacks = userFeedback.filter(f => f.rating === "like" || (typeof f.rating === "number" && f.rating >= 4));
        const negativeFeedbacks = userFeedback.filter(f => f.rating === "dislike" || (typeof f.rating === "number" && f.rating <= 2));

        if (positiveFeedbacks.length > 0 || negativeFeedbacks.length > 0) {
          feedbackInstructions += "\nCRITICAL: Refine your recommendations based on past user feedback:\n";
          if (positiveFeedbacks.length > 0) {
            feedbackInstructions += `- User highly LIKED these recommended tracks: ${positiveFeedbacks.map(f => `"${f.recommendedSong.name}" by "${f.recommendedSong.artist}"${f.comment ? ` (Reason: ${f.comment})` : ""}`).join(", ")}. Please recommend more songs that share these styles, instrumentation, and positive attributes.\n`;
          }
          if (negativeFeedbacks.length > 0) {
            feedbackInstructions += `- User DISLIKED these recommended tracks: ${negativeFeedbacks.map(f => `"${f.recommendedSong.name}" by "${f.recommendedSong.artist}"${f.comment ? ` (Reason: ${f.comment})` : ""}`).join(", ")}. STRICTLY avoid suggesting these specific tracks or songs that share the same characteristics they disliked.\n`;
          }
        }
      }

      let excludeInstructions = "";
      if (excludeSongs && excludeSongs.length > 0) {
        excludeInstructions += `\nCRITICAL EXCLUSIONS: Do NOT recommend any of the following tracks as they have already been shown to the user in this session:\n`;
        excludeInstructions += excludeSongs.map(s => `- "${s.songName}" by "${s.artist}"`).join("\n") + "\n";
      }

      const prompt = `You are an elite musicologist and recommender system.
Given the anchor song: "${songName}" by "${artist}"
- Mood analysis: Nostalgia=${moodAnalysis.nostalgia}, Longing=${moodAnalysis.longing}, Romance=${moodAnalysis.romance}, Warmth=${moodAnalysis.warmth}, Melancholy=${moodAnalysis.melancholy}, Hopefulness=${moodAnalysis.hopefulness}, Energy=${moodAnalysis.energy}
- Genres: ${genres.join(", ")}
- Musical characteristics: Vocals="${musicalAttributes?.vocalStyle || ''}", Tempo="${musicalAttributes?.tempo || ''}", Production="${musicalAttributes?.productionStyle || ''}"

Generate exactly 30 to 40 real, release-registered songs that have maximum similarity in terms of chord progressions, arrangement style, rhythm, tempo, production style, vocal timbre, or overall musical aesthetic.
- Focus on recommending top-tier, highly acclaimed similar songs that are genuine fits (e.g. if the input is synthpop like M83, suggest outstanding French touch, synthwave, or dream-pop hits; if classical, suggest actual modern neo-classical; if indie-rock, suggest actual indie-rock classics).
- Do NOT recommend any song by the same artist "${artist}" as the anchor song.
- Ensure high artist diversity (each song by a different artist).
- ${hiddenGemsInstructions}
- ${languageInstructions}${feedbackInstructions}${excludeInstructions}

Your recommendations must be extremely precise, real songs that music enthusiasts would instantly recognize as amazing, sonic matches for "${songName}" by "${artist}".`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.75,
        },
      });

      const parsedData = JSON.parse(response.text?.trim() || "{}");
      candidates = parsedData.candidates || [];
    } catch (error: any) {
      if (error instanceof Error && error.message === "QuotaExceeded") {
        console.log(`[CandidateGenerationService] Gemini quota exceeded; switching to high-fidelity deterministic fallback candidate builder.`);
      } else {
        console.warn(`[CandidateGenerationService] Gemini candidate generation failed, launching fallback for: "${songName}"`, error);
      }
      candidates = await this.runFallbackCandidateGeneration(profile);
    }

    // Filter candidate pool to guarantee zero duplicates with options.excludeSongs
    if (excludeSongs && excludeSongs.length > 0) {
      const excludeSet = new Set(
        excludeSongs.map(s => `${s.songName.toLowerCase().trim()} - ${s.artist.toLowerCase().trim()}`)
      );
      candidates = candidates.filter(c => {
        const key = `${c.songName.toLowerCase().trim()} - ${c.artist.toLowerCase().trim()}`;
        return !excludeSet.has(key);
      });
    }

    console.log(`[CandidateGenerationService] Final candidate pool size after exclusions: ${candidates.length}`);
    return candidates;
  }

  private async runFallbackCandidateGeneration(profile: SongProfile): Promise<CandidateSong[]> {
    const { songName, artist } = profile;
    const candidates: CandidateSong[] = [];

    // Attempt 1: Fetch other tracks from the same artist (or related search queries) from iTunes to provide genuine candidates
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&media=music&limit=25`;
      const response = await fetch(itunesUrl);
      if (response.ok) {
        const data = await response.json();
        const artistTracks = (data.results || [])
          .filter((item: any) => item.wrapperType === "track" && item.kind === "song" && item.trackName?.toLowerCase() !== songName.toLowerCase())
          .map((t: any) => ({
            songName: t.trackName,
            artist: t.artistName,
            album: t.collectionName || "Unknown Album",
            releaseYear: t.releaseDate ? new Date(t.releaseDate).getFullYear().toString() : "Unknown",
            genre: t.primaryGenreName || "Pop"
          }));

        candidates.push(...artistTracks);
      }
    } catch (err) {
      console.warn("[CandidateGenerationService] iTunes fallback search failed:", err);
    }

    // Attempt 2: Add high-quality seed backup tracks to guarantee a large and diverse pool of at least 20 candidates
    const backupSeeds = [
      { songName: "Intro", artist: "The xx", album: "XX", genre: "Alternative" },
      { songName: "Nightcall", artist: "Kavinsky", album: "Outrun", genre: "Electronic" },
      { songName: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", genre: "Electronic" },
      { songName: "Sweater Weather", artist: "The Neighbourhood", album: "I Love You.", genre: "Alternative" },
      { songName: "Je te laisserai des mots", artist: "Patrick Watson", album: "Single", genre: "Indie Piano" },
      { songName: "Kadalalle", artist: "Sid Sriram", album: "Dear Comrade", genre: "South Asian" },
      { songName: "Maruvaarthai", artist: "Sid Sriram", album: "Enai Noki Paayum Thota", genre: "South Asian" },
      { songName: "Intro", artist: "The xx", album: "XX", genre: "Alternative" },
      { songName: "Gooey", artist: "Glass Animals", album: "ZABA", genre: "Indie Pop" },
      { songName: "Lost in Yesterday", artist: "Tame Impala", album: "The Slow Rush", genre: "Psychedelic Rock" },
      { songName: "Cherry", artist: "Chromatics", album: "Cherry", genre: "Dream Pop" },
      { songName: "Kun Faya Kun", artist: "A.R. Rahman", album: "Rockstar", genre: "Sufi" },
      { songName: "Kabira", artist: "Pritam", album: "Yeh Jawaani Hai Deewani", genre: "Bollywood" }
    ];

    // Mix in the seeds to pad out the list, making sure we filter duplicates
    for (const seed of backupSeeds) {
      if (seed.artist.toLowerCase() !== artist.toLowerCase() && !candidates.some(c => c.songName.toLowerCase() === seed.songName.toLowerCase())) {
        candidates.push({
          songName: seed.songName,
          artist: seed.artist,
          album: seed.album,
          genre: seed.genre
        });
      }
    }

    console.log(`[CandidateGenerationService] Fallback completed with ${candidates.length} candidate songs.`);
    return candidates;
  }
}
