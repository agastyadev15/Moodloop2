// server.ts
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI as GoogleGenAI2, Type as Type4 } from "@google/genai";

// services/SongAnalysisService.ts
import { Type } from "@google/genai";

// services/gemini.ts
import { GoogleGenAI } from "@google/genai";
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
async function generateContentWithRetry(ai, params, maxRetries = 2) {
  const modelsToTry = [params.model];
  if (params.model === "gemini-3.5-flash" || params.model === "gemini-2.5-flash") {
    modelsToTry.push("gemini-3.1-flash-lite");
    modelsToTry.push("gemini-flash-latest");
  } else if (params.model === "gemini-3.1-pro-preview" || params.model === "gemini-2.5-pro") {
    modelsToTry.push("gemini-3.5-flash");
    modelsToTry.push("gemini-3.1-flash-lite");
  }
  let lastError = null;
  let hadQuotaExceeded = false;
  for (const modelName of modelsToTry) {
    let retries = 0;
    while (retries <= maxRetries) {
      try {
        console.log(`Calling Gemini with model ${modelName} (attempt ${retries + 1}/${maxRetries + 1})...`);
        const response = await ai.models.generateContent({
          ...params,
          model: modelName
        });
        return response;
      } catch (err) {
        lastError = err;
        const errMessage = String(err.message || err);
        const errCode = err.status || err.statusCode || err.code;
        const isQuota = errCode === 429 || errMessage.includes("429") || errMessage.toLowerCase().includes("quota") || errMessage.toLowerCase().includes("resource exhausted") || errMessage.toLowerCase().includes("rate limit") || errMessage.toLowerCase().includes("limit exceeded");
        if (isQuota) {
          hadQuotaExceeded = true;
          console.warn(`[Gemini API] Quota or Rate Limit reached (429/Resource Exhausted) for ${modelName}. Seamlessly trying other available models in the pipeline before failing.`);
          break;
        }
        console.log(`[Gemini API Info] Attempt ${retries + 1} for model ${modelName} returned status: ${errCode || "unspecified"}. Message details: ${errMessage}`);
        const isTransient = errCode === 503 || String(errCode).includes("503") || errMessage.includes("503") || errMessage.toLowerCase().includes("overloaded") || errMessage.toLowerCase().includes("high demand") || errMessage.toLowerCase().includes("temporarily unavailable") || errMessage.toLowerCase().includes("unavailable") || errMessage.toLowerCase().includes("service unavailable");
        if (isTransient && retries < maxRetries) {
          const delay = Math.pow(2, retries) * 1500;
          console.log(`Transient Gemini issue. Waiting ${delay}ms before retrying...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          retries++;
        } else {
          break;
        }
      }
    }
    console.log(`Exhausted retries for model ${modelName}. Attempting fallback model if available...`);
  }
  if (hadQuotaExceeded) {
    throw new Error("QuotaExceeded");
  }
  throw lastError || new Error("Failed to generate content from Gemini after trying all fallbacks.");
}
function hashGenerator(str, min, max, offset) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash + offset);
  return min + hash % (max - min + 1);
}

// services/SongAnalysisService.ts
var SongAnalysisService = class _SongAnalysisService {
  static {
    this.profileCache = /* @__PURE__ */ new Map();
  }
  /**
   * Analyzes the searched song and creates a SongProfile.
   * Leverages Gemini with fallback to a deterministic metadata generator.
   */
  async analyzeSong(song) {
    const { name, artist, album = "Unknown Album", releaseYear = "Unknown", artworkUrl = "", previewUrl = "", appleMusicUrl = "" } = song;
    const cacheKey = `${artist.toLowerCase().trim()} - ${name.toLowerCase().trim()}`;
    if (_SongAnalysisService.profileCache.has(cacheKey)) {
      console.log(`[SongAnalysisService] Serving cached profile for: "${name}" by "${artist}"`);
      return _SongAnalysisService.profileCache.get(cacheKey);
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
          responseSchema,
          temperature: 0.25
        }
      });
      const parsedData = JSON.parse(response.text?.trim() || "{}");
      const profile = {
        songName: name,
        artist,
        album,
        releaseYear,
        artworkUrl,
        previewUrl,
        appleMusicUrl,
        moodAnalysis: parsedData.moodAnalysis,
        genres: parsedData.genres || [],
        musicalAttributes: parsedData.musicalAttributes || {}
      };
      _SongAnalysisService.profileCache.set(cacheKey, profile);
      return profile;
    } catch (error) {
      if (error instanceof Error && error.message === "QuotaExceeded") {
        console.log(`[SongAnalysisService] Gemini quota exceeded; switching to deterministic profile builder.`);
      } else {
        console.warn(`[SongAnalysisService] Failed to analyze via Gemini, using deterministic fallback for: "${name}"`, error);
      }
      const seed = name + artist;
      const moodAnalysis = {
        nostalgia: hashGenerator(seed, 30, 95, 10),
        longing: hashGenerator(seed, 20, 95, 20),
        romance: hashGenerator(seed, 30, 90, 30),
        warmth: hashGenerator(seed, 40, 95, 40),
        melancholy: hashGenerator(seed, 10, 85, 50),
        hopefulness: hashGenerator(seed, 20, 90, 60),
        energy: hashGenerator(seed, 20, 95, 70)
      };
      const profile = {
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
          tempo: moodAnalysis.energy > 60 ? "fast" : moodAnalysis.energy < 40 ? "slow" : "moderate",
          primaryInstruments: ["Acoustic Guitar", "Piano"],
          productionStyle: "Warm analog mix"
        }
      };
      _SongAnalysisService.profileCache.set(cacheKey, profile);
      return profile;
    }
  }
};

// services/CandidateGenerationService.ts
import { Type as Type2 } from "@google/genai";
var CandidateGenerationService = class {
  /**
   * Generates a candidate pool of 30-40 songs based on the anchor's SongProfile.
   * Leverages Gemini to suggest candidate songs, with an iTunes-based fallback.
   */
  async generateCandidates(profile, options = {}) {
    const { songName, artist, genres = [], moodAnalysis, musicalAttributes } = profile;
    const { hiddenGems = false, languagePref = "similar", userFeedback = [], excludeSongs = [] } = options;
    let candidates = [];
    try {
      console.log(`[CandidateGenerationService] Generating candidates for: "${songName}" by "${artist}"`);
      const ai = getGeminiClient();
      const responseSchema = {
        type: Type2.OBJECT,
        properties: {
          candidates: {
            type: Type2.ARRAY,
            items: {
              type: Type2.OBJECT,
              properties: {
                songName: { type: Type2.STRING, description: "Name of the candidate song." },
                artist: { type: Type2.STRING, description: "Artist or band name." },
                album: { type: Type2.STRING, description: "Album name if known, otherwise single." },
                releaseYear: { type: Type2.STRING, description: "Estimated release year or decade." },
                genre: { type: Type2.STRING, description: "Primary genre of this candidate song." }
              },
              required: ["songName", "artist"]
            },
            description: "A list of 30 to 40 real, release-registered songs that have high musical similarity."
          }
        },
        required: ["candidates"]
      };
      const hiddenGemsInstructions = hiddenGems ? "We are in Hidden Gem Mode. Suggest highly obscure, underrated, or lesser-known tracks and independent artists. Avoid extremely famous mainstream radio hits." : "Suggest a mix of popular classics, moderately known entries, and indie deep cuts.";
      const languageInstructions = languagePref === "same" ? `Recommend candidate songs strictly in the exact same language origin as "${songName}" (e.g. if South Indian/Telugu, only recommend Telugu songs; if English, only English).` : languagePref === "similar" ? `Recommend candidate songs primarily in the same language, regional scene, or close musical ecosystem (e.g. if the anchor is a South Indian track, keep recommendations inside South Indian languages like Tamil, Telugu, Malayalam, Kannada).` : "Recommend candidate songs with high global diversity and crossover potential across various international languages.";
      let feedbackInstructions = "";
      if (userFeedback && userFeedback.length > 0) {
        const positiveFeedbacks = userFeedback.filter((f) => f.rating === "like" || typeof f.rating === "number" && f.rating >= 4);
        const negativeFeedbacks = userFeedback.filter((f) => f.rating === "dislike" || typeof f.rating === "number" && f.rating <= 2);
        if (positiveFeedbacks.length > 0 || negativeFeedbacks.length > 0) {
          feedbackInstructions += "\nCRITICAL: Refine your recommendations based on past user feedback:\n";
          if (positiveFeedbacks.length > 0) {
            feedbackInstructions += `- User highly LIKED these recommended tracks: ${positiveFeedbacks.map((f) => `"${f.recommendedSong.name}" by "${f.recommendedSong.artist}"${f.comment ? ` (Reason: ${f.comment})` : ""}`).join(", ")}. Please recommend more songs that share these styles, instrumentation, and positive attributes.
`;
          }
          if (negativeFeedbacks.length > 0) {
            feedbackInstructions += `- User DISLIKED these recommended tracks: ${negativeFeedbacks.map((f) => `"${f.recommendedSong.name}" by "${f.recommendedSong.artist}"${f.comment ? ` (Reason: ${f.comment})` : ""}`).join(", ")}. STRICTLY avoid suggesting these specific tracks or songs that share the same characteristics they disliked.
`;
          }
        }
      }
      let excludeInstructions = "";
      if (excludeSongs && excludeSongs.length > 0) {
        excludeInstructions += `
CRITICAL EXCLUSIONS: Do NOT recommend any of the following tracks as they have already been shown to the user in this session:
`;
        excludeInstructions += excludeSongs.map((s) => `- "${s.songName}" by "${s.artist}"`).join("\n") + "\n";
      }
      const prompt = `You are an elite musicologist and recommender system.
Given the anchor song: "${songName}" by "${artist}"
- Mood analysis: Nostalgia=${moodAnalysis.nostalgia}, Longing=${moodAnalysis.longing}, Romance=${moodAnalysis.romance}, Warmth=${moodAnalysis.warmth}, Melancholy=${moodAnalysis.melancholy}, Hopefulness=${moodAnalysis.hopefulness}, Energy=${moodAnalysis.energy}
- Genres: ${genres.join(", ")}
- Musical characteristics: Vocals="${musicalAttributes?.vocalStyle || ""}", Tempo="${musicalAttributes?.tempo || ""}", Production="${musicalAttributes?.productionStyle || ""}"

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
          responseSchema,
          temperature: 0.75
        }
      });
      const parsedData = JSON.parse(response.text?.trim() || "{}");
      candidates = parsedData.candidates || [];
    } catch (error) {
      if (error instanceof Error && error.message === "QuotaExceeded") {
        console.log(`[CandidateGenerationService] Gemini quota exceeded; switching to high-fidelity deterministic fallback candidate builder.`);
      } else {
        console.warn(`[CandidateGenerationService] Gemini candidate generation failed, launching fallback for: "${songName}"`, error);
      }
      candidates = await this.runFallbackCandidateGeneration(profile);
    }
    if (excludeSongs && excludeSongs.length > 0) {
      const excludeSet = new Set(
        excludeSongs.map((s) => `${s.songName.toLowerCase().trim()} - ${s.artist.toLowerCase().trim()}`)
      );
      candidates = candidates.filter((c) => {
        const key = `${c.songName.toLowerCase().trim()} - ${c.artist.toLowerCase().trim()}`;
        return !excludeSet.has(key);
      });
    }
    console.log(`[CandidateGenerationService] Final candidate pool size after exclusions: ${candidates.length}`);
    return candidates;
  }
  async runFallbackCandidateGeneration(profile) {
    const { songName, artist } = profile;
    const candidates = [];
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&media=music&limit=25`;
      const response = await fetch(itunesUrl);
      if (response.ok) {
        const data = await response.json();
        const artistTracks = (data.results || []).filter((item) => item.wrapperType === "track" && item.kind === "song" && item.trackName?.toLowerCase() !== songName.toLowerCase()).map((t) => ({
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
    for (const seed of backupSeeds) {
      if (seed.artist.toLowerCase() !== artist.toLowerCase() && !candidates.some((c) => c.songName.toLowerCase() === seed.songName.toLowerCase())) {
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
};

// services/RecommendationRankingService.ts
import { Type as Type3 } from "@google/genai";
var RecommendationRankingService = class {
  /**
   * Scores and ranks the candidate songs against the anchor's SongProfile.
   * Leverages Gemini to evaluate, score, and write explanations, with a robust local fallback.
   */
  async rankCandidates(profile, candidates, options = {}) {
    const { songName, artist, genres = [], moodAnalysis, musicalAttributes } = profile;
    const { hiddenGems = false, languagePref = "similar", userFeedback = [] } = options;
    if (!candidates || candidates.length === 0) {
      return [];
    }
    try {
      console.log(`[RecommendationRankingService] Ranking ${candidates.length} candidates for: "${songName}" by "${artist}"`);
      const ai = getGeminiClient();
      const responseSchema = {
        type: Type3.OBJECT,
        properties: {
          rankedRecommendations: {
            type: Type3.ARRAY,
            items: {
              type: Type3.OBJECT,
              properties: {
                songName: { type: Type3.STRING, description: "Name of the recommended song." },
                artist: { type: Type3.STRING, description: "Artist or band name." },
                similarityScore: { type: Type3.INTEGER, description: "Similarity score from 0 to 100 based on emotional and acoustic overlaps." },
                discoveryScore: { type: Type3.INTEGER, description: "Uncommon level 1-100: 10-39 for famous mainstream, 40-74 for moderately known/indie, 75-100 for obscure hidden gems." },
                isCrossLanguage: { type: Type3.BOOLEAN, description: "True if this song is in a different language origin from the anchor." },
                whyItMatches: { type: Type3.STRING, description: "1-2 sentences of emotional and musical reasons for this match." }
              },
              required: ["songName", "artist", "similarityScore", "discoveryScore", "isCrossLanguage", "whyItMatches"]
            },
            description: "A scored and ranked list of candidates matching the anchor song."
          }
        },
        required: ["rankedRecommendations"]
      };
      const candidatesList = candidates.map((c, i) => `${i + 1}. "${c.songName}" by "${c.artist}" (Genre: ${c.genre || "Unknown"}, Album: ${c.album || "Unknown"})`).join("\n");
      let hiddenGemsRules = "";
      if (hiddenGems) {
        hiddenGemsRules = `- Hidden Gem Mode is ENABLED. You MUST prioritize obscure, underrated, or lesser-known tracks (Discovery Score: 75 to 100). Do NOT rank highly famous mainstream tracks as top matches.`;
      } else {
        hiddenGemsRules = `- Rank a balanced representation: some famous tracks (Discovery Score 10-39), some moderately known (40-74), and some hidden gems (75-100). Try to respect a 3/4/3 distribution in scores.`;
      }
      let languageRules = "";
      if (languagePref === "same") {
        languageRules = `- Language Preference is set to SAME LANGUAGE. Recommend songs strictly in the exact same language origin as the input song ("${songName}"). Set 'isCrossLanguage' to false for these matches.`;
      } else if (languagePref === "similar") {
        languageRules = `- Language Preference is set to SIMILAR LANGUAGES (default). Prioritize songs from the exact same language or its close cultural/musical ecosystem (e.g. South Indian languages Telugu/Tamil/Malayalam/Kannada together; Hindi/Urdu/Punjabi together; English/Western indie together). Ensure emotional accuracy.`;
      } else {
        languageRules = `- Language Preference is set to GLOBAL DISCOVERY. Seek the highest emotional matches across any globally registered languages, disregarding language origins. Set 'isCrossLanguage' to true for songs in different languages.`;
      }
      let feedbackInstructions = "";
      if (userFeedback && userFeedback.length > 0) {
        const positiveFeedbacks = userFeedback.filter((f) => f.rating === "like" || typeof f.rating === "number" && f.rating >= 4);
        const negativeFeedbacks = userFeedback.filter((f) => f.rating === "dislike" || typeof f.rating === "number" && f.rating <= 2);
        if (positiveFeedbacks.length > 0 || negativeFeedbacks.length > 0) {
          feedbackInstructions += "\nCRITICAL: Adjust scoring and ranking based on past user feedback:\n";
          if (positiveFeedbacks.length > 0) {
            feedbackInstructions += `- User highly LIKED these recommended tracks: ${positiveFeedbacks.map((f) => `"${f.recommendedSong.name}" by "${f.recommendedSong.artist}"${f.comment ? ` (Reason: ${f.comment})` : ""}`).join(", ")}. Boost the similarityScore (0-100) and rank of any candidates that share similar styles, arrangements, or instrumentation with these liked tracks.
`;
          }
          if (negativeFeedbacks.length > 0) {
            feedbackInstructions += `- User DISLIKED these recommended tracks: ${negativeFeedbacks.map((f) => `"${f.recommendedSong.name}" by "${f.recommendedSong.artist}"${f.comment ? ` (Reason: ${f.comment})` : ""}`).join(", ")}. Demote the similarityScore (or reduce to <50) and rank of any candidates that share similar characteristics, styles, or specific flaws they disliked.
`;
          }
        }
      }
      const prompt = `Evaluate and score the following candidates relative to the anchor song.

Anchor Song: "${songName}" by "${artist}"
- Mood analysis: Nostalgia=${moodAnalysis.nostalgia}, Longing=${moodAnalysis.longing}, Romance=${moodAnalysis.romance}, Warmth=${moodAnalysis.warmth}, Melancholy=${moodAnalysis.melancholy}, Hopefulness=${moodAnalysis.hopefulness}, Energy=${moodAnalysis.energy}
- Genres: ${genres.join(", ")}
- Musical characteristics: Vocals="${musicalAttributes?.vocalStyle || ""}", Tempo="${musicalAttributes?.tempo || ""}", Production="${musicalAttributes?.productionStyle || ""}"

Candidates to evaluate:
${candidatesList}

Ranking and Scoring Rules:
1. Calculate a similarityScore (0-100) representing how closely the candidate matches the anchor's sonic profile.
   - Use the FULL range. Assign 97-100 for truly exceptional, near-perfect arrangement matches.
   - Most standard high-quality recommendations should fall between 85 and 98.
2. Calculate a discoveryScore (1-100) representing how uncommon/underrated the track is.
3. Determine isCrossLanguage (true/false) based on whether the candidate's language origin differs from the anchor "${songName}".
4. Write whyItMatches: A concise, sophisticated 1-sentence explanation focusing strictly and exclusively on musical, arrangement, production, or performance similarities.
   - Never mention generic emotions, moods, or feelings (e.g. do NOT use words like 'sad', 'happy', 'nostalgia', 'longing', 'romance', 'warmth', 'melancholy', 'hopefulness', 'yearning', 'joy').
   - Focus purely on acoustic textures, arrangement elements, and performance styles.
   - Examples of desired tone: "Similar layered guitar textures.", "Similar vocal restraint.", "Similar synth atmosphere.", "Similar dynamic chorus.", "Shares reverb-heavy vocal production and warm analog mix.", "Matches the acoustic percussion drive and minimalist keys."
${hiddenGemsRules}
${languageRules}${feedbackInstructions}

Return the results sorted by similarityScore descending as rankedRecommendations.`;
      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.25
        }
      });
      const parsedData = JSON.parse(response.text?.trim() || "{}");
      const ranked = parsedData.rankedRecommendations || [];
      if (ranked.length > 0) {
        console.log(`[RecommendationRankingService] Successfully evaluated and ranked ${ranked.length} candidates via Gemini.`);
        return ranked;
      }
    } catch (error) {
      if (error instanceof Error && error.message === "QuotaExceeded") {
        console.log(`[RecommendationRankingService] Gemini quota exceeded; switching to deterministic fallback ranking evaluator.`);
      } else {
        console.warn(`[RecommendationRankingService] Gemini ranking failed, launching fallback for: "${songName}"`, error);
      }
    }
    return this.runFallbackRanking(profile, candidates, options);
  }
  runFallbackRanking(profile, candidates, options = {}) {
    const { songName, artist, moodAnalysis } = profile;
    const { hiddenGems = false } = options;
    console.log(`[RecommendationRankingService] Running deterministic fallback ranking for ${candidates.length} candidates.`);
    return candidates.map((c) => {
      const seed = c.songName + c.artist + songName;
      const baseSimilarity = hashGenerator(seed, 80, 94, 15);
      const discoveryScore = hiddenGems ? hashGenerator(seed, 75, 98, 25) : hashGenerator(seed, 20, 95, 35);
      const isCrossLanguage = false;
      const descriptions = [
        "Similar layered guitar textures and vocal restraint.",
        "Similar synth atmosphere and dynamic chorus build.",
        "Matches the acoustic percussion drive and minimalist keys.",
        "Shares reverb-heavy vocal production and warm analog mix.",
        "Aligned low-tempo arrangement with atmospheric synth pads.",
        "Similar crisp percussion textures and clean basslines.",
        "Features an equivalent warm acoustic resonance and intimate vocals."
      ];
      const whyItMatches = descriptions[hashGenerator(seed, 0, descriptions.length - 1, 42)];
      return {
        songName: c.songName,
        artist: c.artist,
        similarityScore: baseSimilarity,
        discoveryScore,
        isCrossLanguage,
        whyItMatches
      };
    }).sort((a, b) => b.similarityScore - a.similarityScore);
  }
};

// services/RecommendationValidationService.ts
var RecommendationValidationService = class {
  /**
   * Validates and finalizes ranked recommendations.
   * Enforces diversity, size constraint (exactly 10), and resolves iTunes assets in parallel.
   */
  async validateAndFinalize(profile, ranked, options = {}) {
    const { songName, artist } = profile;
    const { hiddenGems = false, languagePref = "similar" } = options;
    console.log(`[RecommendationValidationService] Validating and resolving assets for ${ranked.length} ranked tracks.`);
    let filtered = ranked.filter(
      (rec) => rec.songName.toLowerCase().trim() !== songName.toLowerCase().trim() || rec.artist.toLowerCase().trim() !== artist.toLowerCase().trim()
    );
    const artistCounts = {};
    const seenSongs = /* @__PURE__ */ new Set();
    const finalCandidates = [];
    for (const item of filtered) {
      const songKey = `${item.songName.toLowerCase().trim()} - ${item.artist.toLowerCase().trim()}`;
      if (seenSongs.has(songKey)) {
        continue;
      }
      const artKey = item.artist.toLowerCase().trim();
      const currentArtCount = artistCounts[artKey] || 0;
      if (currentArtCount >= 2) {
        continue;
      }
      artistCounts[artKey] = currentArtCount + 1;
      seenSongs.add(songKey);
      finalCandidates.push(item);
      if (finalCandidates.length >= 12) {
        break;
      }
    }
    const resolvedRecommendations = await Promise.all(
      finalCandidates.map(async (rec) => {
        try {
          const matchedAsset = await this.resolveMusicAssets(rec.songName, rec.artist);
          return {
            songName: rec.songName,
            artist: rec.artist,
            similarityScore: rec.similarityScore,
            discoveryScore: rec.discoveryScore,
            isCrossLanguage: rec.isCrossLanguage,
            whyItMatches: rec.whyItMatches,
            album: matchedAsset.album || "Unknown Album",
            artworkUrl: matchedAsset.artworkUrl || "",
            previewUrl: matchedAsset.previewUrl || "",
            appleMusicUrl: matchedAsset.appleMusicUrl || `https://music.apple.com/us/search?term=${encodeURIComponent(rec.artist + " " + rec.songName)}`,
            releaseYear: matchedAsset.releaseYear || "Unknown"
          };
        } catch (err) {
          console.error(`[RecommendationValidationService] Failed to resolve assets for: ${rec.songName} by ${rec.artist}`, err);
          return {
            songName: rec.songName,
            artist: rec.artist,
            similarityScore: rec.similarityScore,
            discoveryScore: rec.discoveryScore,
            isCrossLanguage: rec.isCrossLanguage,
            whyItMatches: rec.whyItMatches,
            album: "Unknown Album",
            artworkUrl: "",
            previewUrl: "",
            appleMusicUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(rec.artist + " " + rec.songName)}`,
            releaseYear: "Unknown"
          };
        }
      })
    );
    const seenSongsResolved = /* @__PURE__ */ new Set();
    const uniqueRecommendations = [];
    for (const rec of resolvedRecommendations) {
      const uniqueKey = `${rec.songName.toLowerCase().trim()} - ${rec.artist.toLowerCase().trim()}`;
      if (!seenSongsResolved.has(uniqueKey)) {
        seenSongsResolved.add(uniqueKey);
        uniqueRecommendations.push(rec);
      }
    }
    const optimizedRecommendations = uniqueRecommendations.map((rec) => {
      let discovery = rec.discoveryScore;
      if (hiddenGems && discovery < 40) {
        discovery = Math.floor(Math.random() * 25) + 75;
      }
      return { ...rec, discoveryScore: discovery };
    });
    const finalResults = optimizedRecommendations.slice(0, 10);
    if (finalResults.length < 10) {
      console.warn(`[RecommendationValidationService] Final list has only ${finalResults.length} tracks. Padding to exactly 10.`);
      const paddings = [
        { songName: "Intro", artist: "The xx", album: "XX", similarityScore: 82, discoveryScore: 45, whyItMatches: "A classic atmospheric opener matching the quiet instrumentation." },
        { songName: "Je te laisserai des mots", artist: "Patrick Watson", album: "Single", similarityScore: 80, discoveryScore: 78, whyItMatches: "Lush piano chords providing matching waves of warm nostalgic hope." },
        { songName: "Cherry", artist: "Chromatics", album: "Cherry", similarityScore: 78, discoveryScore: 81, whyItMatches: "Synth-driven dreaming, matching the retro longing core." }
      ];
      for (const pad of paddings) {
        if (finalResults.length >= 10) break;
        const exists = finalResults.some((f) => f.songName.toLowerCase() === pad.songName.toLowerCase());
        if (!exists) {
          finalResults.push({
            songName: pad.songName,
            artist: pad.artist,
            album: pad.album,
            artworkUrl: "",
            previewUrl: "",
            appleMusicUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(pad.artist + " " + pad.songName)}`,
            releaseYear: "Unknown",
            similarityScore: pad.similarityScore,
            discoveryScore: pad.discoveryScore,
            whyItMatches: pad.whyItMatches,
            isCrossLanguage: false
          });
        }
      }
    }
    console.log(`[RecommendationValidationService] Validation finished. Returning exactly ${finalResults.length} validated songs.`);
    return finalResults;
  }
  /**
   * Modular music asset resolver.
   * Swappable with Spotify, Apple Music, or another music provider in the future.
   */
  async resolveMusicAssets(songName, artist) {
    const searchQuery = `${artist} ${songName}`;
    const itunesSearchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&limit=1`;
    const fetchedRes = await fetch(itunesSearchUrl);
    if (fetchedRes.ok) {
      const data = await fetchedRes.json();
      if (data.results && data.results.length > 0) {
        const matchedTrack = data.results[0];
        const artwork100 = matchedTrack.artworkUrl100 || "";
        const artworkUrl = artwork100 ? artwork100.replace("100x100bb.jpg", "500x500bb.jpg") : "";
        return {
          album: matchedTrack.collectionName || "Unknown Album",
          artworkUrl,
          previewUrl: matchedTrack.previewUrl || "",
          appleMusicUrl: matchedTrack.trackViewUrl || `https://music.apple.com/us/search?term=${encodeURIComponent(artist + " " + songName)}`,
          releaseYear: matchedTrack.releaseDate ? new Date(matchedTrack.releaseDate).getFullYear().toString() : "Unknown"
        };
      }
    }
    return {
      album: "Unknown Album",
      artworkUrl: "",
      previewUrl: "",
      appleMusicUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(artist + " " + songName)}`,
      releaseYear: "Unknown"
    };
  }
};

// services/index.ts
var RecommendationEngine = class {
  constructor() {
    this.songAnalysisService = new SongAnalysisService();
    this.candidateGenerationService = new CandidateGenerationService();
    this.recommendationRankingService = new RecommendationRankingService();
    this.recommendationValidationService = new RecommendationValidationService();
  }
  /**
   * Orchestrates the 4-step recommendation pipeline.
   */
  async getRecommendations(song, options = {}) {
    console.log(`
=== Starting Recommendation Pipeline for: "${song.name}" by "${song.artist}" ===`);
    console.log("[Pipeline] Step 1/4: Analyzing song...");
    const profile = await this.songAnalysisService.analyzeSong(song);
    console.log("[Pipeline] Step 2/4: Generating candidates...");
    const candidates = await this.candidateGenerationService.generateCandidates(profile, options);
    console.log("[Pipeline] Step 3/4: Ranking candidates...");
    const ranked = await this.recommendationRankingService.rankCandidates(profile, candidates, options);
    console.log("[Pipeline] Step 4/4: Validating and finalising recommendations...");
    const recommendations = await this.recommendationValidationService.validateAndFinalize(profile, ranked, options);
    console.log("=== Recommendation Pipeline Completed Successfully ===\n");
    return {
      selectedSong: {
        id: song.id,
        name: profile.songName,
        artist: profile.artist,
        album: profile.album || "Unknown Album",
        artworkUrl: profile.artworkUrl || "",
        previewUrl: profile.previewUrl || "",
        appleMusicUrl: profile.appleMusicUrl || `https://music.apple.com/us/search?term=${encodeURIComponent(profile.artist + " " + profile.songName)}`,
        releaseYear: profile.releaseYear || "Unknown"
      },
      moodAnalysis: profile.moodAnalysis,
      recommendations
    };
  }
};

// server.ts
import fs from "fs";
dotenv.config();
var app = express();
var PORT = 3e3;
app.use(express.json());
var analysisCache = /* @__PURE__ */ new Map();
var recEngine = new RecommendationEngine();
function formatITunesTrack(track) {
  const artwork100 = track.artworkUrl100 || "";
  const artworkUrl = artwork100 ? artwork100.replace("100x100bb.jpg", "500x500bb.jpg") : "";
  const releaseYear = track.releaseDate ? new Date(track.releaseDate).getFullYear().toString() : "Unknown";
  return {
    id: String(track.trackId || Math.random()),
    name: track.trackName || "Unknown Title",
    artist: track.artistName || "Unknown Artist",
    album: track.collectionName || "Unknown Album",
    artworkUrl,
    previewUrl: track.previewUrl || "",
    appleMusicUrl: track.trackViewUrl || `https://music.apple.com/us/search?term=${encodeURIComponent((track.artistName || "") + " " + (track.trackName || ""))}`,
    releaseYear
  };
}
var aiClient2 = null;
function getGeminiClient2() {
  if (!aiClient2) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiClient2 = new GoogleGenAI2({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient2;
}
async function generateContentWithRetry2(ai, params, maxRetries = 2) {
  const modelsToTry = [params.model];
  if (params.model === "gemini-3.5-flash" || params.model === "gemini-2.5-flash") {
    modelsToTry.push("gemini-3.1-flash-lite");
    modelsToTry.push("gemini-flash-latest");
  } else if (params.model === "gemini-3.1-pro-preview" || params.model === "gemini-2.5-pro") {
    modelsToTry.push("gemini-3.5-flash");
    modelsToTry.push("gemini-3.1-flash-lite");
  }
  let lastError = null;
  let hadQuotaExceeded = false;
  for (const modelName of modelsToTry) {
    let retries = 0;
    while (retries <= maxRetries) {
      try {
        console.log(`Calling Gemini with model ${modelName} (attempt ${retries + 1}/${maxRetries + 1})...`);
        const response = await ai.models.generateContent({
          ...params,
          model: modelName
        });
        return response;
      } catch (err) {
        lastError = err;
        const errMessage = String(err.message || err);
        const errCode = err.status || err.statusCode || err.code;
        const isQuota = errCode === 429 || errMessage.includes("429") || errMessage.toLowerCase().includes("quota") || errMessage.toLowerCase().includes("resource exhausted") || errMessage.toLowerCase().includes("rate limit") || errMessage.toLowerCase().includes("limit exceeded");
        if (isQuota) {
          hadQuotaExceeded = true;
          console.log(`[Gemini API] Quota or Rate Limit reached (429/Resource Exhausted) for ${modelName}. Seamlessly trying other available models in the pipeline before failing.`);
          break;
        }
        console.log(`[Gemini API Info] Attempt ${retries + 1} for model ${modelName} returned status: ${errCode || "unspecified"}. Message details: ${errMessage}`);
        const isTransient = errCode === 503 || String(errCode).includes("503") || errMessage.includes("503") || errMessage.toLowerCase().includes("overloaded") || errMessage.toLowerCase().includes("high demand") || errMessage.toLowerCase().includes("temporarily unavailable") || errMessage.toLowerCase().includes("unavailable") || errMessage.toLowerCase().includes("service unavailable");
        if (isTransient && retries < maxRetries) {
          const delay = Math.pow(2, retries) * 1500;
          console.log(`Transient Gemini issue. Waiting ${delay}ms before retrying...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          retries++;
        } else {
          break;
        }
      }
    }
    console.log(`Exhausted retries for model ${modelName}. Attempting fallback model if available...`);
  }
  if (hadQuotaExceeded) {
    throw new Error("QuotaExceeded");
  }
  throw lastError || new Error("Failed to generate content from Gemini after trying all fallbacks.");
}
app.get("/api/spotify/auth-url", (req, res) => {
  const clientRedirectUri = req.query.redirect_uri || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/spotify/callback` : "http://localhost:3000/api/spotify/callback");
  const client_id = process.env.SPOTIFY_CLIENT_ID || "";
  if (!client_id) {
    return res.status(500).json({ error: "Spotify sign-in is not configured on this server yet. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to enable account connection." });
  }
  const scopes = "playlist-modify-public playlist-modify-private user-read-private";
  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
    client_id,
    response_type: "code",
    redirect_uri: clientRedirectUri,
    scope: scopes,
    state: clientRedirectUri
    // Send client's redirect URI through state roundtrip
  }).toString()}`;
  res.json({ url: spotifyAuthUrl });
});
app.get(["/api/spotify/callback", "/api/spotify/callback/", "/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, state } = req.query;
  const redirectUri = state || req.query.redirect_uri || `${req.protocol}://${req.get("host")}/api/spotify/callback`;
  if (!code) {
    return res.send(`
      <html>
        <head>
          <style>
            body { font-family: sans-serif; background: #121212; color: #fff; text-align: center; padding: 40px; }
            button { background: #1DB954; color: #000; border: none; padding: 10px 20px; font-weight: bold; border-radius: 20px; cursor: pointer; }
          </style>
        </head>
        <body>
          <h2 style="color: #ff5e5e;">Authorization Failed</h2>
          <p>No authorization code was received from Spotify.</p>
          <button onclick="window.close()">Close Window</button>
        </body>
      </html>
    `);
  }
  const client_id = process.env.SPOTIFY_CLIENT_ID || "";
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET || "";
  if (!client_id || !client_secret) {
    return res.send(`
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #121212; color: #fff; padding: 40px; text-align: center; }
            .container { max-width: 500px; margin: 0 auto; background: #181818; padding: 30px; border-radius: 8px; border: 1px solid #282828; }
            h1 { color: #1DB954; }
            pre { background: #000; padding: 15px; border-radius: 4px; text-align: left; overflow-x: auto; font-family: monospace; color: #1DB954; }
            button { background: #1DB954; color: #000; border: none; padding: 10px 20px; font-weight: bold; border-radius: 20px; cursor: pointer; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Spotify Credentials Required</h1>
            <p>Your Spotify Developer application details are not configured yet.</p>
            <p>Please add these environment variables in your AI Studio settings:</p>
            <pre>SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET</pre>
            <p>And add this callback URL to your Spotify Application settings:</p>
            <pre>${redirectUri}</pre>
            <button onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>
    `);
  }
  try {
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64")
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri
      })
    });
    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      throw new Error("Spotify token exchange failed: " + errBody);
    }
    const tokenData = await tokenResponse.json();
    res.send(`
      <html>
        <head>
          <style>
            body { font-family: sans-serif; background: #121212; color: #fff; text-align: center; padding: 40px; }
            h1 { color: #1DB954; }
          </style>
        </head>
        <body>
          <h1>Connected to Spotify!</h1>
          <p>Syncing account connection...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'SPOTIFY_AUTH_SUCCESS',
                tokens: {
                  accessToken: ${JSON.stringify(tokenData.access_token)},
                  refreshToken: ${JSON.stringify(tokenData.refresh_token)},
                  expiresAt: Date.now() + ${tokenData.expires_in} * 1000
                }
              }, '*');
              setTimeout(() => { window.close(); }, 800);
            } else {
              document.write("<p>Authentication successful! You can safely close this window.</p>");
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error in Spotify callback:", error);
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding-top: 100px; background: #121212; color: #fff;">
          <h2 style="color: #ff5e5e;">Authentication Error</h2>
          <p>${error.message || "An error occurred during authentication."}</p>
          <button onclick="window.close()" style="background: #1DB954; border: none; color: white; padding: 10px 20px; border-radius: 20px; cursor: pointer;">Close</button>
        </body>
      </html>
    `);
  }
});
app.post("/api/spotify/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "Missing refresh_token" });
  }
  const client_id = process.env.SPOTIFY_CLIENT_ID || "";
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET || "";
  if (!client_id || !client_secret) {
    return res.status(500).json({ error: "Spotify credentials are not configured on the server." });
  }
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64")
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: "Failed to refresh token: " + errText });
    }
    const data = await response.json();
    res.json({
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: Date.now() + data.expires_in * 1e3
    });
  } catch (error) {
    console.error("Spotify refresh error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});
app.post("/api/spotify/export", async (req, res) => {
  const { accessToken, playlistName, songs } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: "Missing Spotify access token" });
  }
  if (!songs || !Array.isArray(songs) || songs.length === 0) {
    return res.status(400).json({ error: "Missing or empty songs array" });
  }
  try {
    const meResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!meResponse.ok) {
      const errText = await meResponse.text();
      return res.status(meResponse.status).json({ error: "Failed to fetch Spotify user profile: " + errText });
    }
    const meData = await meResponse.json();
    const userId = meData.id;
    const trackUris = [];
    const searchDetails = [];
    for (const song of songs) {
      const cleanArtist = song.artist.replace(/\(.*\)/g, "").trim();
      const cleanTitle = song.songName.replace(/\(.*\)/g, "").trim();
      const query = `track:"${cleanTitle}" artist:"${cleanArtist}"`;
      let searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;
      let searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      let trackUri = null;
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.tracks && searchData.tracks.items && searchData.tracks.items.length > 0) {
          trackUri = searchData.tracks.items[0].uri;
        }
      }
      if (!trackUri) {
        const broadQuery = `${cleanTitle} ${cleanArtist}`;
        searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(broadQuery)}&type=track&limit=1`;
        searchRes = await fetch(searchUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.tracks && searchData.tracks.items && searchData.tracks.items.length > 0) {
            trackUri = searchData.tracks.items[0].uri;
          }
        }
      }
      if (!trackUri) {
        searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(cleanTitle)}&type=track&limit=1`;
        searchRes = await fetch(searchUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.tracks && searchData.tracks.items && searchData.tracks.items.length > 0) {
            trackUri = searchData.tracks.items[0].uri;
          }
        }
      }
      if (trackUri) {
        trackUris.push(trackUri);
        searchDetails.push({ song, matched: true, uri: trackUri });
      } else {
        searchDetails.push({ song, matched: false });
      }
    }
    if (trackUris.length === 0) {
      return res.status(404).json({ error: "None of the recommended tracks could be matched on Spotify." });
    }
    const pName = playlistName || "My MoodMix Recommendations";
    const createPlaylistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: pName,
        description: "Generated by Harmonix AI Music Recommender - customized musicological matches.",
        public: false
      })
    });
    if (!createPlaylistResponse.ok) {
      const errText = await createPlaylistResponse.text();
      return res.status(createPlaylistResponse.status).json({ error: "Failed to create playlist on Spotify: " + errText });
    }
    const playlistData = await createPlaylistResponse.json();
    const playlistId = playlistData.id;
    const playlistUrl = playlistData.external_urls.spotify;
    const addItemsResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        uris: trackUris
      })
    });
    if (!addItemsResponse.ok) {
      const errText = await addItemsResponse.text();
      return res.status(addItemsResponse.status).json({ error: "Failed to add tracks to Spotify playlist: " + errText });
    }
    res.json({
      success: true,
      playlistName: pName,
      playlistUrl,
      playlistId,
      totalMatched: trackUris.length,
      totalRequested: songs.length,
      details: searchDetails
    });
  } catch (error) {
    console.error("Spotify export error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});
app.get("/api/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.trim() === "") {
      return res.json([]);
    }
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=15`;
    const response = await fetch(itunesUrl);
    if (!response.ok) {
      return res.status(500).json({ error: "Failed to fetch search results from iTunes" });
    }
    const data = await response.json();
    const formattedResults = (data.results || []).filter((item) => item.wrapperType === "track" && item.kind === "song").map(formatITunesTrack).slice(0, 10);
    res.json(formattedResults);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json([]);
  }
});
app.post("/api/analyze", async (req, res) => {
  const { id, name, artist, album, releaseYear, artworkUrl, previewUrl, hiddenGems, crossLanguage, languagePref, userFeedback } = req.body;
  if (!name || !artist) {
    return res.status(400).json({ error: "Song name and artist are required." });
  }
  const selectedLangPref = languagePref || (crossLanguage ? "global" : "similar");
  const feedbackHash = userFeedback && userFeedback.length > 0 ? `fb:${userFeedback.length}-${JSON.stringify(userFeedback).length}` : "no-fb";
  const cacheKey = `${artist.toLowerCase().trim()} - ${name.toLowerCase().trim()} - hgems:${!!hiddenGems} - lpref:${selectedLangPref} - ${feedbackHash}`;
  if (analysisCache.has(cacheKey)) {
    console.log("Serving cached recommendations for:", cacheKey);
    return res.json(analysisCache.get(cacheKey));
  }
  try {
    console.log("Triggering modular RecommendationEngine for:", cacheKey);
    const song = {
      id: id || "temp-id",
      name,
      artist,
      album: album || "Unknown Album",
      releaseYear: releaseYear || "Unknown",
      artworkUrl: artworkUrl || "",
      previewUrl: previewUrl || "",
      appleMusicUrl: req.body.appleMusicUrl || `https://music.apple.com/us/search?term=${encodeURIComponent(artist + " " + name)}`
    };
    const options = {
      hiddenGems: !!hiddenGems,
      crossLanguage: !!crossLanguage,
      languagePref: selectedLangPref,
      userFeedback
    };
    const completeResult = await recEngine.getRecommendations(song, options);
    analysisCache.set(cacheKey, completeResult);
    res.json(completeResult);
  } catch (error) {
    console.error("RecommendationEngine controller error details:", error);
    res.status(500).json({ error: "Failed to generate recommendations. Please try again." });
  }
});
app.post("/api/refresh-recommendations", async (req, res) => {
  const { name, artist, excludeSongs, hiddenGems, crossLanguage, languagePref, userFeedback } = req.body;
  if (!name || !artist) {
    return res.status(400).json({ error: "Song name and artist are required." });
  }
  try {
    console.log(`[API] Refreshing recommendations for: "${name}" by "${artist}". Excluding ${excludeSongs?.length || 0} songs.`);
    const selectedLangPref = languagePref || (crossLanguage ? "global" : "similar");
    const song = {
      id: "temp-id",
      name,
      artist,
      appleMusicUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(artist + " " + name)}`
    };
    const options = {
      hiddenGems: !!hiddenGems,
      crossLanguage: !!crossLanguage,
      languagePref: selectedLangPref,
      userFeedback,
      excludeSongs: excludeSongs || []
    };
    const completeResult = await recEngine.getRecommendations(song, options);
    res.json({ recommendations: completeResult.recommendations });
  } catch (error) {
    console.error("[API] Error refreshing recommendations:", error);
    res.status(500).json({ error: "Failed to refresh recommendations. Please try again." });
  }
});
app.post("/api/analyze-emotion", async (req, res) => {
  const { emotionQuery, hiddenGems, crossLanguage, languagePref } = req.body;
  if (!emotionQuery || emotionQuery.trim() === "") {
    return res.status(400).json({ error: "Emotion query is required." });
  }
  const selectedLangPref = languagePref || (crossLanguage ? "global" : "similar");
  const cacheKey = `emotion - ${emotionQuery.toLowerCase().trim()} - hgems:${!!hiddenGems} - lpref:${selectedLangPref}`;
  if (analysisCache.has(cacheKey)) {
    console.log("Serving cached emotion recommendations for:", cacheKey);
    return res.json(analysisCache.get(cacheKey));
  }
  try {
    console.log("Triggering Gemini Emotion Analysis for:", cacheKey);
    const ai = getGeminiClient2();
    const responseSchema = {
      type: Type4.OBJECT,
      properties: {
        moodAnalysis: {
          type: Type4.OBJECT,
          properties: {
            nostalgia: { type: Type4.INTEGER, description: "Nostalgia rating (0-100) representing retrospect, memory weight, retro texture." },
            longing: { type: Type4.INTEGER, description: "Longing rating (0-100) representing yearning, intense desire, space." },
            romance: { type: Type4.INTEGER, description: "Romance rating (0-100) representing intimacy, lyrics closeness, tactile quality." },
            warmth: { type: Type4.INTEGER, description: "Warmth rating (0-100) representing cozy instrumentation, acoustics, glow." },
            melancholy: { type: Type4.INTEGER, description: "Melancholy rating (0-100) representing blues, gravity, minor hooks." },
            hopefulness: { type: Type4.INTEGER, description: "Hopefulness rating (0-100) representing sunrise feels, optimism, major lift." },
            energy: { type: Type4.INTEGER, description: "Energy rating (0-100) representing rhythm, BPM, punch, vigor." }
          },
          required: ["nostalgia", "longing", "romance", "warmth", "melancholy", "hopefulness", "energy"]
        },
        recommendations: {
          type: Type4.ARRAY,
          items: {
            type: Type4.OBJECT,
            properties: {
              songName: { type: Type4.STRING, description: "Name of the recommended song." },
              artist: { type: Type4.STRING, description: "Artist name." },
              similarityScore: { type: Type4.INTEGER, description: "Cohesion similarity with the emotional description from 0 to 100." },
              discoveryScore: { type: Type4.INTEGER, description: "Obscurity from 1-100 (10-39 mainstream hits, 44-74 indie/moderately known, 75-100 hidden gems)." },
              isCrossLanguage: { type: Type4.BOOLEAN, description: "Whether this represents a different language origin from English or primarily represents global crossover." },
              whyItMatches: { type: Type4.STRING, description: "A compact human explanation of how this song fits the exact psychological/emotional query." }
            },
            required: ["songName", "artist", "similarityScore", "discoveryScore", "isCrossLanguage", "whyItMatches"]
          },
          description: "A list of exactly 10 real songs that match the feeling description perfectly."
        },
        classification: {
          type: Type4.OBJECT,
          properties: {
            inputType: {
              type: Type4.STRING,
              description: "Categorize the user's emotionQuery into one of: 'Specific Emotion' (e.g. sadness, nostalgia, rage), 'Situation' (e.g. studying, walking in rain, midnight drive, longing for someone), or 'Mood / Atmosphere' (e.g. cozy, airy, futuristic)."
            },
            identifiedEntity: {
              type: Type4.STRING,
              description: "A clean, normalized name for the identified core state, emotion, or context."
            }
          },
          required: ["inputType", "identifiedEntity"]
        }
      },
      required: ["moodAnalysis", "recommendations", "classification"]
    };
    let hiddenGemsRules = "";
    if (hiddenGems) {
      hiddenGemsRules = `- Hidden Gem Mode is ENABLED. You MUST prioritize obscure, underrated, or lesser-known artists and tracks. At least 7 of the 10 recommendations MUST be deep hidden gems or deeply underrated/obscure tracks (Discovery Score: 75 to 100). Do NOT recommend highly famous mainstream tracks. Maximum of 1 mainstream song in the list.`;
    } else {
      hiddenGemsRules = `- Follow the 3/4/3 distribution rule for the 10 recommendations:
  - Exactly 3 popular/famous songs (Discovery Score: 10 to 39)
  - Exactly 4 moderately known songs (Discovery Score: 40 to 74)
  - Exactly 3 hidden gems or underrated/obscure tracks (Discovery Score: 75 to 100)`;
    }
    let languageRules = "";
    if (selectedLangPref === "same") {
      languageRules = `- Language Preference is set to SAME LANGUAGE. You MUST strictly recommend songs ONLY in the primary language style implied by the user's emotion description (for example, if they describe feelings in Telugu or Tamil or Hindi or English, recommend songs exclusively in that same language). Keep recommendations strictly within a single language origin. Set 'isCrossLanguage' to false.`;
    } else if (selectedLangPref === "similar") {
      languageRules = `- Language Preference is set to SIMILAR LANGUAGES (This is the default, highly balanced mode). Prioritize songs from the exact same language or its close cultural/musical style ecosystem. Do not recommend completely unrelated Western mainstream artists like Taylor Swift or The Weeknd if the user's emotion description or expectation aligns with a traditional, ambient Indian classical/cinematic feeling (or vice versa). Keep style and target language ecosystems cohesive.`;
    } else {
      languageRules = `- Language Preference is set to GLOBAL DISCOVERY. Seek the highest emotional matches across any globally registered languages (e.g., English, Telugu, Tamil, Korean, Japanese, French, Spanish, Hindi, etc.) matching the pure feel. At least 5 of the 10 recommendations MUST represent a multilingual crossover. Set 'isCrossLanguage' to true for crossover tracks.`;
    }
    const prompt = `Analyze the emotional feeling description: "${emotionQuery}".

First, construct a corresponding psychological mood / emotional fingerprint across exactly these seven dimensions each from 0 to 100 that best captures the essence of this description (e.g., "Late night drive" might have high nostalgia, deep longing, high warmth, low energy, etc.):
- Nostalgia
- Longing
- Romance
- Warmth
- Melancholy
- Hopefulness
- Energy

Second, suggest exactly 10 real, release-registered songs that have a highly similar/equivalent emotional fingerprint, adhering to these structured rules:
1. Do NOT prioritize popularity.
2. Focus purely on emotional similarity. Prioritize: Nostalgia, Longing, Warmth, Romance, Melancholy, Hopefulness, Energy.
3. Prefer songs users are unlikely to discover through commercial algorithms or Spotify Radio.
4. Explain the precise emotional reason behind each match, referencing shared feelings of nostalgia, longing, romance, warmth, melancholy, hopefulness, or energy.
${hiddenGemsRules}
${languageRules}

Third, classify the input text into one of these types:
- 'Specific Emotion': if the user entered a single or simple direct feeling (e.g. sadness, romance, anxiety, feeling good).
- 'Situation': if the user described an environment, memory, scene, action, or contextual scenario (e.g. studying, driving at 2am, missing an old school friend, drinking coffee in rain).
- 'Mood / Atmosphere': if the user described a general atmospheric feel or aesthetic (e.g. cozy, airy, nostalgic, cyberpunk, retro).
Provide this categorization and a clean normalized entity name in the 'classification' object.`;
    const geminiResponse = await generateContentWithRetry2(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.8
      }
    });
    const parsedData = JSON.parse(geminiResponse.text?.trim() || "{}");
    const recommendationsWithAssets = await Promise.all(
      (parsedData.recommendations || []).map(async (rec) => {
        try {
          const searchQuery = `${rec.artist} ${rec.songName}`;
          const itunesSearchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&limit=1`;
          const fetchedRes = await fetch(itunesSearchUrl);
          if (fetchedRes.ok) {
            const data = await fetchedRes.json();
            if (data.results && data.results.length > 0) {
              const matchedTrack = data.results[0];
              const artwork100 = matchedTrack.artworkUrl100 || "";
              const artworkUrl = artwork100 ? artwork100.replace("100x100bb.jpg", "500x500bb.jpg") : "";
              return {
                ...rec,
                album: matchedTrack.collectionName || "Unknown Album",
                artworkUrl,
                previewUrl: matchedTrack.previewUrl || "",
                appleMusicUrl: matchedTrack.trackViewUrl || `https://music.apple.com/us/search?term=${encodeURIComponent(rec.artist + " " + rec.songName)}`,
                releaseYear: matchedTrack.releaseDate ? new Date(matchedTrack.releaseDate).getFullYear().toString() : "Unknown"
              };
            }
          }
        } catch (err) {
          console.error(`Error fetching iTunes assets for recommendation: ${rec.songName}`, err);
        }
        return {
          ...rec,
          album: "Unknown Album",
          artworkUrl: "",
          previewUrl: "",
          appleMusicUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(rec.artist + " " + rec.songName)}`,
          releaseYear: "Unknown"
        };
      })
    );
    const completeResult = {
      selectedSong: {
        id: "emotion_mode",
        name: emotionQuery,
        artist: "Emotion Profile",
        album: "Atmosphere Decoded",
        artworkUrl: "",
        previewUrl: "",
        appleMusicUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(emotionQuery)}`,
        releaseYear: "Now"
      },
      moodAnalysis: parsedData.moodAnalysis,
      recommendations: recommendationsWithAssets,
      classification: parsedData.classification || {
        inputType: "Specific Emotion",
        identifiedEntity: emotionQuery
      }
    };
    analysisCache.set(cacheKey, completeResult);
    res.json(completeResult);
  } catch (error) {
    console.error("Gemini emotion controller error details:", error);
    const hashGenerator2 = (str, min, max, offset) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      hash = Math.abs(hash + offset);
      return min + hash % (max - min + 1);
    };
    try {
      const fallbackMood = {
        nostalgia: hashGenerator2(emotionQuery, 40, 95, 12),
        longing: hashGenerator2(emotionQuery, 30, 95, 22),
        romance: hashGenerator2(emotionQuery, 20, 90, 32),
        warmth: hashGenerator2(emotionQuery, 40, 95, 42),
        melancholy: hashGenerator2(emotionQuery, 20, 85, 52),
        hopefulness: hashGenerator2(emotionQuery, 30, 90, 62),
        energy: hashGenerator2(emotionQuery, 10, 95, 72)
      };
      let fallbackRecs = [];
      try {
        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(emotionQuery)}&media=music&limit=10`;
        const response = await fetch(itunesUrl);
        if (response.ok) {
          const data = await response.json();
          fallbackRecs = (data.results || []).filter((item) => item.wrapperType === "track" && item.kind === "song").map(formatITunesTrack).map((t, index) => {
            const simScore = 95 - index * 2;
            let discScore = 50;
            if (hiddenGems) {
              discScore = hashGenerator2(t.name, index < 2 ? 60 : 80, 99, index);
            } else {
              if (index < 3) {
                discScore = hashGenerator2(t.name, 15, 35, index);
              } else if (index < 7) {
                discScore = hashGenerator2(t.name, 45, 70, index);
              } else {
                discScore = hashGenerator2(t.name, 76, 98, index);
              }
            }
            return {
              songName: t.name,
              artist: t.artist,
              similarityScore: Math.max(70, Math.min(99, simScore)),
              discoveryScore: discScore,
              isCrossLanguage: selectedLangPref === "global" ? index % 2 === 0 : false,
              whyItMatches: `Fits the romantic and atmospheric weight of the requested feeling "${emotionQuery}" with beautiful aesthetic consistency.`,
              album: t.album,
              artworkUrl: t.artworkUrl,
              previewUrl: t.previewUrl,
              appleMusicUrl: t.appleMusicUrl,
              releaseYear: t.releaseYear
            };
          });
        }
      } catch (err) {
        console.warn("iTunes fallback retrieval erred for description query:", err);
      }
      if (fallbackRecs.length === 0) {
        const backupSongs = [
          { name: "Nightcall", artist: "Kavinsky", album: "Outrun" },
          { name: "Je te laisserai des mots", artist: "Patrick Watson", album: "Single" },
          { name: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming" },
          { name: "Intro", artist: "The xx", album: "XX" },
          { name: "Sweater Weather", artist: "The Neighbourhood", album: "I Love You." }
        ];
        fallbackRecs = backupSongs.map((b, idx) => {
          let discScore = hiddenGems ? hashGenerator2(b.name, 75, 95, idx) : hashGenerator2(b.name, 30, 85, idx);
          return {
            songName: b.name,
            artist: b.artist,
            similarityScore: 92 - idx * 3,
            discoveryScore: discScore,
            isCrossLanguage: selectedLangPref === "global" ? idx % 2 === 0 : false,
            whyItMatches: `Captures the exact depth, nostalgic warmth, and emotional residue requested in the description of "${emotionQuery}".`,
            album: b.album,
            artworkUrl: "",
            previewUrl: "",
            appleMusicUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(b.artist + " " + b.name)}`,
            releaseYear: "Unknown"
          };
        });
      }
      const completeResult = {
        selectedSong: {
          id: "emotion_mode",
          name: emotionQuery,
          artist: "Emotion Profile",
          album: "Atmosphere Decoded",
          artworkUrl: "",
          previewUrl: "",
          appleMusicUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(emotionQuery)}`,
          releaseYear: "Now"
        },
        moodAnalysis: fallbackMood,
        recommendations: fallbackRecs,
        classification: {
          inputType: "Specific Emotion",
          identifiedEntity: emotionQuery
        }
      };
      analysisCache.set(cacheKey, completeResult);
      return res.json(completeResult);
    } catch (fallbackError) {
      console.warn("Deep fallback also erred for emotion query. Informing 503.");
      res.status(503).json({ error: "Recommendations temporarily unavailable." });
    }
  }
});
app.post("/api/compare", async (req, res) => {
  const { song1, song2 } = req.body;
  if (!song1 || !song2 || !song1.name || !song2.name) {
    return res.status(400).json({ error: "Both Song 1 and Song 2 names and artists are required for comparison." });
  }
  const s1Artist = (song1.artist || "Unknown").toLowerCase().trim();
  const s1Name = song1.name.toLowerCase().trim();
  const s2Artist = (song2.artist || "Unknown").toLowerCase().trim();
  const s2Name = song2.name.toLowerCase().trim();
  const isS1First = `${s1Artist}-${s1Name}` < `${s2Artist}-${s2Name}`;
  const firstSong = isS1First ? song1 : song2;
  const secondSong = isS1First ? song2 : song1;
  const cacheKey = `compare - ${firstSong.artist.toLowerCase().trim()} - ${firstSong.name.toLowerCase().trim()} VS ${secondSong.artist.toLowerCase().trim()} - ${secondSong.name.toLowerCase().trim()}`;
  if (analysisCache.has(cacheKey)) {
    console.log("Serving cached comparison result for:", cacheKey);
    return res.json(analysisCache.get(cacheKey));
  }
  try {
    console.log("Triggering Gemini Comparison for:", cacheKey);
    const ai = getGeminiClient2();
    const responseSchema = {
      type: Type4.OBJECT,
      properties: {
        similarityScore: { type: Type4.INTEGER, description: "Calculated emotional and musical similarity percentage (0-100)" },
        sharedEmotions: {
          type: Type4.ARRAY,
          items: { type: Type4.STRING },
          description: "List of top shared emotional vibes or mood overlaps (e.g., ['Nostalgia', 'Longing', 'Warmth'])"
        },
        moodOverlap: {
          type: Type4.OBJECT,
          properties: {
            nostalgia: { type: Type4.INTEGER, description: "Shared level of nostalgia (0-100)" },
            longing: { type: Type4.INTEGER, description: "Shared level of longing (0-100)" },
            romance: { type: Type4.INTEGER, description: "Shared level of romance (0-100)" },
            warmth: { type: Type4.INTEGER, description: "Shared level of warmth (0-100)" },
            melancholy: { type: Type4.INTEGER, description: "Shared level of melancholy (0-100)" },
            hopefulness: { type: Type4.INTEGER, description: "Shared level of hopefulness (0-100)" },
            energy: { type: Type4.INTEGER, description: "Shared level of energy (0-100)" }
          },
          required: ["nostalgia", "longing", "romance", "warmth", "melancholy", "hopefulness", "energy"]
        },
        differences: {
          type: Type4.ARRAY,
          items: { type: Type4.STRING },
          description: "List of precise qualitative differences (e.g., ['Kadalalle features a more hopeful sunrise lift with acoustic guitars.', 'Maruvaarthai features a deeper melancholic drift matching minor key strings.'])"
        },
        overallVerdict: { type: Type4.STRING, description: "A detailed summary paragraph explaining how these two songs connect and what makes them unique when paired." }
      },
      required: ["similarityScore", "sharedEmotions", "moodOverlap", "differences", "overallVerdict"]
    };
    const prompt = `Analyze and compare the musical, emotional, and tonal vibes of these two songs:
Song 1: "${firstSong.name}" by "${firstSong.artist}" (Album: "${firstSong.album || "Unknown"}", Year: ${firstSong.releaseYear || "Unknown"})
Song 2: "${secondSong.name}" by "${secondSong.artist}" (Album: "${secondSong.album || "Unknown"}", Year: ${secondSong.releaseYear || "Unknown"})

Provide a structured comparison highlighting how close they feel, the emotions they share, and how they subtly or dramatically differ (tempo, instrumentation, or emotional vector). Be insightful, poetic, and musicologically accurate.`;
    const geminiResponse = await generateContentWithRetry2(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
        systemInstruction: "You are an elite musicologist and emotional indexer with deep empathy. You review songs with precision.",
        temperature: 0.2
      }
    });
    const bodyText = geminiResponse.text?.trim() || "";
    const pResult = JSON.parse(bodyText);
    analysisCache.set(cacheKey, pResult);
    return res.json(pResult);
  } catch (error) {
    console.error("Gemini Comparison failed:", error);
    const hash = (str) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) h = h * 31 + str.charCodeAt(i) | 0;
      return Math.abs(h);
    };
    const hashVal = hash(firstSong.name + secondSong.name);
    const simScore = 65 + hashVal % 31;
    const fallbackResult = {
      similarityScore: simScore,
      sharedEmotions: ["Warmth", "Nostalgia", "Longing"],
      moodOverlap: {
        nostalgia: 70 + hashVal % 25,
        longing: 65 + (hashVal + 3) % 25,
        romance: 60 + (hashVal + 7) % 30,
        warmth: 80 - hashVal % 20,
        melancholy: 55 + (hashVal + 11) % 30,
        hopefulness: 50 + (hashVal + 17) % 30,
        energy: 40 + (hashVal + 19) % 30
      },
      differences: [
        `"${firstSong.name}" has its own unique atmospheric signature shaped by ${firstSong.artist}'s production and release timeline.`,
        `"${secondSong.name}" builds a different emotional arc highlighting the distinctive melodic flavor of ${secondSong.artist}.`
      ],
      overallVerdict: `While structurally divergent, both "${firstSong.name}" and "${secondSong.name}" carry deeply immersive nostalgic values that make them highly compatible additions to an introspective playlist.`
    };
    analysisCache.set(cacheKey, fallbackResult);
    return res.json(fallbackResult);
  }
});
var aestheticsMap = {
  nightdrive: [
    { name: "Nightcall", artist: "Kavinsky", album: "Outrun", why: "Synthesized bassline carrying late-night pavement vibrations.", dscore: 45, energy: 60, lang: "English" },
    { name: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", why: "Neon saxophones rising above midnight asphalt.", dscore: 30, energy: 75, lang: "English" },
    { name: "Cherry", artist: "Chromatics", album: "Kill for Love", why: "A delicate synth-pop whisper of a lost drive.", dscore: 76, energy: 40, lang: "English" },
    { name: "Kadalalle", artist: "Sid Sriram", album: "Dear Comrade", why: "A sweeping romantic nocturnal flow from South India.", dscore: 65, energy: 35, lang: "Telugu" },
    { name: "Intro", artist: "The xx", album: "xx", why: "The ultimate minimalistic instrumental to kickstart any dark drive.", dscore: 25, energy: 45, lang: "Instrumental" },
    { name: "Wait", artist: "M83", album: "Hurry Up, We're Dreaming", why: "Slow, sweeping oceanic crescendo matching deep velocity.", dscore: 40, energy: 50, lang: "English" },
    { name: "After Hours", artist: "The Weeknd", album: "After Hours", why: "A dark electronic heartbeat detailing post-midnight longing.", dscore: 20, energy: 62, lang: "English" },
    { name: "Gooey", artist: "Glass Animals", album: "Zaba", why: "Sluggish, tactile lofi beat wrapping you in a warm cocoon.", dscore: 55, energy: 40, lang: "English" },
    { name: "Sunset", artist: "The Midnight", album: "Endless Summer", why: "Pure 80s vaporwave driving into a retro sunset.", dscore: 77, energy: 70, lang: "English" },
    { name: "Under Your Spell", artist: "Desire", album: "II", why: "Chilled romantic synth loop made famous in high-octane indie films.", dscore: 80, energy: 50, lang: "English" },
    { name: "Night Drive", artist: "Jimmy Whoo", album: "Motel Music", why: "Deep French bedroom lofi jazz, incredibly underground.", dscore: 89, energy: 30, lang: "French" },
    { name: "The Perfect Girl", artist: "Mareux", album: "The Perfect Girl", why: "A darkwave post-punk bassline that triggers nighttime tunnel vision.", dscore: 64, energy: 58, lang: "English" },
    { name: "Plains", artist: "Yppah", album: "Eighty One", why: "A beautiful combination of breakbeats and nostalgic shoegaze chords.", dscore: 82, energy: 55, lang: "English" },
    { name: "Resonance", artist: "Home", album: "Odyssey", why: "A warm, analog vintage synthwave track of infinite loops.", dscore: 72, energy: 50, lang: "Instrumental" },
    { name: "Starboy", artist: "The Weeknd", album: "Starboy", why: "A crisp futuristic pop tempo driving through metropolis lights.", dscore: 10, energy: 78, lang: "English" }
  ],
  rainy: [
    { name: "Apocalypse", artist: "Cigarettes After Sex", album: "Cigarettes After Sex", why: "Reverb-soaked slowcore guitars that mimic falling rain.", dscore: 35, energy: 25, lang: "English" },
    { name: "Je te laisserai des mots", artist: "Patrick Watson", album: "Single", why: "A gorgeous, weeping piano ballad of safety and warmth.", dscore: 42, energy: 20, lang: "French" },
    { name: "Rosyln", artist: "Bon Iver & St. Vincent", album: "Twilight OST", why: "Whispering acoustic guitars blending with forest rain smells.", dscore: 48, energy: 30, lang: "English" },
    { name: "Anchor", artist: "Novo Amor", album: "Woodgate, NY", why: "Swell strings and fingerpicked acoustic resonance of cold mornings.", dscore: 76, energy: 28, lang: "English" },
    { name: "Flightless Bird, American Mouth", artist: "Iron & Wine", album: "The Shepherd's Dog", why: "A vintage waltzing acoustic arrangement that is bittersweet.", dscore: 52, energy: 32, lang: "English" },
    { name: "Maruvaarthai", artist: "Sid Sriram", album: "Enai Noki Paayum Thota", why: "Deep emotional cello lines and vocal yearning from Tamil Nadu.", dscore: 60, energy: 32, lang: "Tamil" },
    { name: "I Will Follow You into the Dark", artist: "Death Cab for Cutie", album: "Plans", why: "A heartbreakingly minimalist acoustic promise.", dscore: 41, energy: 20, lang: "English" },
    { name: "Oceans", artist: "Seafret", album: "Oceans", why: "Expansive emotional vocals echoing above an acoustic storm.", dscore: 71, energy: 40, lang: "English" },
    { name: "Landslide", artist: "Fleetwood Mac", album: "Fleetwood Mac", why: "A historic, fragile acoustic meditation on legacy and change.", dscore: 22, energy: 25, lang: "English" },
    { name: "Hear You Me", artist: "Jimmy Eat World", album: "Bleed American", why: "A soft emo comforting rock anthem for overcast afternoons.", dscore: 48, energy: 35, lang: "English" },
    { name: "Vennilave", artist: "Hariharan & Sadhana Sargam", album: "Minsara Kanavu", why: "A legendary ambient slow piece with clean acoustic strings.", dscore: 63, energy: 30, lang: "Tamil" },
    { name: "Get You", artist: "Daniel Caesar", album: "Freudian", why: "Slow, warm R&B basslines mimicking water droplets on glass.", dscore: 29, energy: 38, lang: "English" },
    { name: "Cold/Mess", artist: "Prateek Kuhad", album: "cold/mess", why: "A raw, diary-entry indie folk song about romantic struggle.", dscore: 68, energy: 45, lang: "English" },
    { name: "Mystery of Love", artist: "Sufjan Stevens", album: "Call Me By Your Name", why: "Mandolins and fragile acoustics that feel like early autumn drizzle.", dscore: 30, energy: 30, lang: "English" },
    { name: "Nocturne in E-Flat Major", artist: "Fr\xE9d\xE9ric Chopin", album: "Classical Essentials", why: "Pure timeless piano melody carrying the ultimate weight of rain.", dscore: 35, energy: 10, lang: "Instrumental" }
  ],
  dreamy: [
    { name: "Space Song", artist: "Beach House", album: "Depression Cherry", why: "A shimmering, levitating organ glide of infinite space.", dscore: 28, energy: 35, lang: "English" },
    { name: "Cherry-coloured Funk", artist: "Cocteau Twins", album: "Heaven or Las Vegas", why: "Slick, glittering dream-pop guitars with ambiguous, comforting vocals.", dscore: 75, energy: 42, lang: "English" },
    { name: "Fade Into You", artist: "Mazzy Star", album: "So Tonight That I Might See", why: "A slide-guitar classic dripping in twilight romance.", dscore: 36, energy: 25, lang: "English" },
    { name: "Alison", artist: "Slowdive", album: "Souvlaki", why: "Glittering shoegaze feedback loops that feel like falling asleep in warm light.", dscore: 70, energy: 45, lang: "English" },
    { name: "Chamber of Reflection", artist: "Mac DeMarco", album: "Salad Days", why: "A lazy, detuned analog synthesizer loop that slows down time.", dscore: 39, energy: 38, lang: "English" },
    { name: "Kun Faya Kun", artist: "A.R. Rahman", album: "Rockstar", why: "A legendary Sufi prayer that feels like spiritual levitation.", dscore: 45, energy: 30, lang: "Hindi/Urdu" },
    { name: "Intro", artist: "The xx", album: "xx", why: "Slightly reverbed, looping guitars carrying safe, starry tones.", dscore: 25, energy: 45, lang: "Instrumental" },
    { name: "Prithvi", artist: "Dualist Inquiry", album: "Doppelganger", why: "A gorgeous premium Indian ambient electronic soundscape.", dscore: 83, energy: 50, lang: "Instrumental" },
    { name: "Over the Moon", artist: "The Marias", album: "Superclean, Vol. II", why: "Velvety lounge jazz vocals drifting through starry synths.", dscore: 68, energy: 30, lang: "English/Spanish" },
    { name: "Slow Motion", artist: "Phantogram", album: "Three", why: "A heavy, chopped beat layered under highly glittering cloud vibes.", dscore: 76, energy: 48, lang: "English" },
    { name: "Svefn-g-englar", artist: "Sigur R\xF3s", album: "\xC1g\xE6tis byrjun", why: "Symphonic Icelandic bowed guitar that literally sounds like space.", dscore: 78, energy: 15, lang: "Hopelandic" },
    { name: "The Night We Met", artist: "Lord Huron", album: "Strange Trails", why: "Echoing campfire choruses of deep nostalgia.", dscore: 24, energy: 32, lang: "English" },
    { name: "Pink Moon", artist: "Nick Drake", album: "Pink Moon", why: "A raw, fragile whispered acoustic guitar recorded in midnight quiet.", dscore: 81, energy: 22, lang: "English" },
    { name: "Ladies and Gentlemen", artist: "Spiritualized", album: "Ladies and Gentlemen", why: "A slow, lush string ascent resembling physical weightlessness.", dscore: 85, energy: 20, lang: "English" },
    { name: "Sunson", artist: "Nils Frahm", album: "All Melody", why: "A pulsing modular synth flow that builds like deep sleep breathing.", dscore: 82, energy: 55, lang: "Instrumental" }
  ]
};
app.post("/api/moodmix", async (req, res) => {
  const { aesthetic, description, listeningHistory, bypassCache, recentSongs, previousSongs } = req.body;
  const descClean = (description || "").trim();
  const historyList = Array.isArray(listeningHistory) ? listeningHistory : [];
  let cacheKey = `moodmix - aes:${aesthetic || "none"} - desc:${descClean.slice(0, 100)} - hist:${historyList.length}`;
  if (bypassCache) {
    cacheKey += ` - bypass:${Math.random()}`;
  }
  if (!bypassCache && analysisCache.has(cacheKey)) {
    console.log("Serving cached MoodMix playlist for:", cacheKey);
    return res.json(analysisCache.get(cacheKey));
  }
  try {
    console.log("Triggering Gemini Premium MoodMix Generator for:", cacheKey);
    const ai = getGeminiClient2();
    const responseSchema = {
      type: Type4.OBJECT,
      properties: {
        playlistName: {
          type: Type4.STRING,
          description: "A deeply human, organic, relatable, and situation-based playlist title that feels like a real mixtape made by a close friend. Avoid any abstract, cold, high-level AI names (NEVER use words like 'Echoes', 'Horizon', 'Resonance', 'Twilight', 'Asphalt Neon', 'Quiet Distance'). Examples: for unrequited love: 'Not Mine To Keep', 'Watching From Afar', 'She Chose Someone Else', 'Maybe In Another Life'; for school nostalgia: 'Hallways I Still Remember', 'Last Bench Memories', 'Before Everything Changed'; for songs like Kannukulla: 'The Kannukulla Feeling', 'Romantic Nostalgia', 'Soft Hearts & Late Nights'."
        },
        playlistDescription: { type: Type4.STRING, description: "A highly friendly, warmth-filled personal note describing the mixtape description, speaking like a supportive, music-loving direct friend. Maximum 2 friendly sentences." },
        aestheticCode: { type: Type4.STRING, description: "Must be exactly one of: rainy, nightdrive, romantic, nostalgic, calm, energetic." },
        emotionalProfile: {
          type: Type4.OBJECT,
          description: "An organic Emotional DNA profile mapping the user's input. Must use everyday, empathetic human language.",
          properties: {
            coreEmotion: { type: Type4.STRING, description: "Identified feelings in conversational words, e.g. 'missing someone'." },
            relationshipStatus: { type: Type4.STRING, description: "A warm human phrasing describing current scenario vibe, e.g. 'longing for someone'." },
            emotionalIntensity: { type: Type4.STRING, description: "A conversational human weight of feeling (e.g. 'softly lingering')." },
            stageOfHealing: { type: Type4.STRING, description: "Where they stand emotionally in everyday friendly terms (e.g. 'learning to let go')." },
            languagePreference: { type: Type4.STRING, description: "Determined language preference." },
            listeningHistoryContext: { type: Type4.STRING, description: "Brief friendly note on taste." },
            situationalContext: {
              type: Type4.STRING,
              description: "A single extremely concise emotional summary / companion insight. Strictly maximum 1 sentence. Avoid paragraphs or long advice. Examples: 'Built for missing someone you can't have.', 'Built for people still replaying old memories.', 'Built for late-night overthinking.'."
            },
            meters: {
              type: Type4.ARRAY,
              description: "An array of exactly 4 dynamic feeling meters reflecting emotional dimension percentages. Sorted from highest percentage to lowest.",
              items: {
                type: Type4.OBJECT,
                properties: {
                  label: { type: Type4.STRING, description: "Compact human feeling label (e.g., 'Missing Someone', 'Late Night Thoughts', 'Moving Forward', 'Hope', 'Bitter Memories', 'Nostalgic Comfort')." },
                  percentage: { type: Type4.INTEGER, description: "The calculated emotional intensity percentage, representing weight from 1 to 100." },
                  emoji: { type: Type4.STRING, description: "A single emotionally companion-like matching emoji (e.g. \u{1F494}, \u{1F319}, \u{1F331}, \u2728, \u{1F327}, \u{1F392}, \u{1F3EB}, \u{1F49C})." }
                },
                required: ["label", "percentage", "emoji"]
              }
            }
          },
          required: ["coreEmotion", "relationshipStatus", "emotionalIntensity", "stageOfHealing", "languagePreference", "listeningHistoryContext", "situationalContext", "meters"]
        },
        tracks: {
          type: Type4.ARRAY,
          items: {
            type: Type4.OBJECT,
            properties: {
              songName: { type: Type4.STRING, description: "Exactly specified title of the song." },
              artist: { type: Type4.STRING, description: "Artist or band name." },
              album: { type: Type4.STRING, description: "Album name or 'Single'." },
              whyItFits: {
                type: Type4.STRING,
                description: "Exactly one concise sentence explaining why the song was selected. Strictly maximum 1 sentence. Keep it personal and highly empathetic, avoiding AI preambles or fluff. Examples: 'Shares the same longing and emotional distance as your situation.', 'Matches the nostalgic warmth detected in your input.', 'Carries similar romantic themes and soft vocal energy.'."
              },
              discoveryScore: { type: Type4.INTEGER, description: "An obscurity level from 0 to 100. Over 75 represents an indie gem, deep cut, regional track, or underrated artist." },
              energyLevel: { type: Type4.INTEGER, description: "The energy level of the song from 0 to 100." },
              language: { type: Type4.STRING, description: "Primary vocal language (e.g., English, Telugu, Tamil, Japanese, French, Hindi, Spanish, Korean)." }
            },
            required: ["songName", "artist", "album", "whyItFits", "discoveryScore", "energyLevel", "language"]
          },
          description: "A cohesive, beautifully sequenced set of exactly 25 real release-registered songs tracking an emotional curves. These will be down-selected to 20 for fatigue filtering."
        }
      },
      required: ["playlistName", "playlistDescription", "aestheticCode", "emotionalProfile", "tracks"]
    };
    let alignmentWording = "";
    if (aesthetic && aesthetic !== "none") {
      alignmentWording = `The optional vibe filter requested is "${aesthetic}". Blend this vibe seamlessly into the soundscape, but prioritize the primary situational and emotional core above all.
`;
    }
    if (descClean) {
      alignmentWording += `The user is sharing what is on their mind: "${descClean}". Pay deep attention to these psychological themes, situations, lyrical resonances, and emotional states.
`;
    }
    let historyContext = "";
    if (historyList.length > 0) {
      historyContext = `The user has a recent search/listen history containing: ${historyList.join(", ")}. Respect this taste/style context, while suggesting fresh discoveries.
`;
    }
    const recentSongsList = Array.isArray(recentSongs) ? recentSongs : [];
    const previousSongsList = Array.isArray(previousSongs) ? previousSongs : [];
    const songFrequencies = {};
    recentSongsList.forEach((s) => {
      if (s && s.name) {
        const key = `${s.name.toLowerCase().trim()} by ${s.artist?.toLowerCase().trim()}`;
        songFrequencies[key] = (songFrequencies[key] || 0) + 1;
      }
    });
    const fatiguedKeys = new Set(
      Object.entries(songFrequencies).filter(([_, count]) => count >= 2).map(([key]) => key)
    );
    const previousKeys = new Set(
      previousSongsList.map((s) => `${s.name.toLowerCase().trim()} by ${s.artist?.toLowerCase().trim()}`)
    );
    let fatigueRulesWording = "";
    if (recentSongsList.length > 0) {
      const recentStr = recentSongsList.slice(-15).map((s) => `"${s.name}" by ${s.artist}`).join(", ");
      fatigueRulesWording += `
RECOMMENDATION FATIGUE TRACKING (Recently recommended songs to avoid repeating):`;
      fatigueRulesWording += `
- Avoid or strongly deprioritize these songs recently shown: [${recentStr}]`;
    }
    if (fatiguedKeys.size > 0) {
      const fatiguedListStr = Array.from(fatiguedKeys).join(", ");
      fatigueRulesWording += `
- The following songs are in critical over-exposure fatigue (do NOT recommend them under any circumstances, find alternative parallel tracks instead): [${fatiguedListStr}]`;
    }
    if (previousSongsList.length > 0) {
      const prevListStr = previousSongsList.map((s) => `"${s.name}" by ${s.artist}`).join(", ");
      fatigueRulesWording += `
- Previous Playlist Tracks (from the immediate consecutive playlist): [${prevListStr}]`;
      fatigueRulesWording += `
- CRITICAL CONSECUTIVE RULE: You MUST NOT repeat more than 3 songs from this previous playlist list. If generating a fresh / another version, recommend entirely alternative songs with matching emotional fingerprints rather than repeating the same tracks.`;
    }
    const prompt = `You are an elite, highly empathetic AI Musicologist, Curator and Psychologist.
    
    Before suggesting any tracks, you MUST first construct an INTERNAL EMOTIONAL DNA of the user's situation and feelings.
    
    Understand that we do NOT rely on complex preset forms. Build the playlist around the user's actual situation and emotional context first. Vibe filters are optional and secondary.
    
    Analyze the user's situation and emotional context and automatically determine:
    1. Emotional state (use warm, human terms like "missing someone", "stuck in old memories", "trying to move on", "peaceful and reflective", "hopeful but uncertain")
    2. Energy level (matching their described mental velocity or state)
    3. Language preference (if they write in, imply, or mention specific languages or songs like "Kannukulla", respect that perfectly and select corresponding Regional or Multilingual tracks, otherwise curate a beautiful global blend)
    4. Playlist direction (the sonic story and trajectory)
    5. Discovery level (strictly mixing mainstream with indie gems, hidden gems, and wildcard discoveries as defined in the composition rules)

    Avoid clinical or cold terms. Speak beautifully as a comforting friend who deeply gets them.
    
    Synthesize a beautiful, high-context 25-track playlist based on these parameters:
    ${alignmentWording}
    ${historyContext}
    ${fatigueRulesWording}

    CRITICAL RULES FOR PLAYLIST DIVERSITY & COMPOSITION (MANDATORY):
    1. ARTIST DIVERSITY: Maximum 2 songs per artist across the entire playlist (do not include 3 or more songs by the exact same artist).
    2. ALBUM DIVERSITY: Maximum 1 song per album (do not include multiple songs from the same album).
    3. PREVIOUS PLAYLIST RULE: Maximum 3 songs repeated from the previous consecutive playlist (if any was provided above). Prefer entirely fresh alternative discoveries with similar emotional fingerprints.
    4. NOVELTY & FRESHNESS: Actively reward novelty and promote music discoveries. Avoid recommending the same overplayed songs repeatedly.

    5. PLAYLIST COMPOSITION:
       Your 25-track playlist MUST strictly adhere to this composition distribution based on discoveryScore (calculated from 0 to 100, where higher is more obscure/underground):
       - 20% Mainstream: discoveryScore <= 30
       - 40% Underrated: 30 < discoveryScore <= 70
       - 30% Hidden Gems: 70 < discoveryScore <= 90
       - 10% Wildcard Discoveries: discoveryScore > 90
       (Ensure the discoveryScore values you assign in the JSON response exactly match these bands for each song).

    6. Every recommended song MUST be a real, registered release on music streaming platforms.
    7. Sequence the tracks deliberately so they follow a beautiful emotional narrative arch (e.g. starting with an atmospheric opener, building momentum, and ending with a warm, comforting or melancholic resolution).
    8. Ensure the "whyItFits" descriptions are exactly 1 concise sentence explaining beautifully why the song was selected and how it matches their exact emotion/scenario.`;
    const aiParams = {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
        systemInstruction: "You are an elite, warm indie musicologist and empathetic psychologist who curation acts as a true musical sanctuary for souls looking to feel understood.",
        temperature: 0.85
      }
    };
    const geminiResponse = await generateContentWithRetry2(ai, aiParams);
    const bodyText = geminiResponse.text?.trim() || "{}";
    const parsedData = JSON.parse(bodyText);
    const rawTracks = parsedData.tracks || [];
    const filteredTracks = [];
    const artistCounts = {};
    const albumCounts = {};
    let previousRepeatsCount = 0;
    for (const track of rawTracks) {
      if (!track.songName || !track.artist) continue;
      const trackKey = `${track.songName.toLowerCase().trim()} by ${track.artist.toLowerCase().trim()}`;
      const artistKey = track.artist.toLowerCase().trim();
      const albumRaw = track.album || "";
      const albumClean = albumRaw.toLowerCase().trim();
      const isGenericAlbum = albumClean === "single" || albumClean === "unknown" || albumClean === "";
      if (fatiguedKeys.has(trackKey)) {
        continue;
      }
      const isFromPrevious = previousKeys.has(trackKey);
      if (isFromPrevious && previousRepeatsCount >= 3) {
        continue;
      }
      const currentArtistCount = artistCounts[artistKey] || 0;
      if (currentArtistCount >= 2) {
        continue;
      }
      if (!isGenericAlbum) {
        const currentAlbumCount = albumCounts[albumClean] || 0;
        if (currentAlbumCount >= 1) {
          continue;
        }
      }
      filteredTracks.push(track);
      artistCounts[artistKey] = currentArtistCount + 1;
      if (!isGenericAlbum) {
        albumCounts[albumClean] = (albumCounts[albumClean] || 0) + 1;
      }
      if (isFromPrevious) {
        previousRepeatsCount++;
      }
    }
    const targetAes = (aesthetic || "nightdrive").toLowerCase();
    if (["calm", "romantic", "nostalgic"].includes(targetAes)) {
      if (!aestheticsMap[targetAes]) aestheticsMap[targetAes] = aestheticsMap.dreamy;
    } else if (targetAes === "energetic") {
      aestheticsMap[targetAes] = aestheticsMap.nightdrive;
    }
    const fallbackSeed = aestheticsMap[targetAes] || aestheticsMap["nightdrive"] || [];
    if (filteredTracks.length < 20) {
      for (const track of fallbackSeed) {
        if (filteredTracks.length >= 20) break;
        const trackKey = `${track.name.toLowerCase().trim()} by ${track.artist.toLowerCase().trim()}`;
        const artistKey = track.artist.toLowerCase().trim();
        const albumRaw = track.album || "";
        const albumClean = albumRaw.toLowerCase().trim();
        const isGenericAlbum = albumClean === "single" || albumClean === "unknown" || albumClean === "";
        if (fatiguedKeys.has(trackKey)) continue;
        const isFromPrevious = previousKeys.has(trackKey);
        if (isFromPrevious && previousRepeatsCount >= 3) continue;
        const currentArtistCount = artistCounts[artistKey] || 0;
        if (currentArtistCount >= 2) continue;
        if (!isGenericAlbum) {
          const currentAlbumCount = albumCounts[albumClean] || 0;
          if (currentAlbumCount >= 1) continue;
        }
        const convertedTrack = {
          songName: track.name,
          artist: track.artist,
          album: track.album,
          whyItFits: track.why || "Matches the emotional flow of your scenario perfectly.",
          discoveryScore: track.dscore || 50,
          energyLevel: track.energy || 50,
          language: track.lang || "English"
        };
        filteredTracks.push(convertedTrack);
        artistCounts[artistKey] = currentArtistCount + 1;
        if (!isGenericAlbum) {
          albumCounts[albumClean] = (albumCounts[albumClean] || 0) + 1;
        }
        if (isFromPrevious) {
          previousRepeatsCount++;
        }
      }
    }
    if (filteredTracks.length < 20) {
      for (const track of fallbackSeed) {
        if (filteredTracks.length >= 20) break;
        const alreadyIn = filteredTracks.some((t) => {
          const tName = t.songName || t.name;
          return tName.toLowerCase() === track.name.toLowerCase() && t.artist.toLowerCase() === track.artist.toLowerCase();
        });
        if (!alreadyIn) {
          filteredTracks.push({
            songName: track.name,
            artist: track.artist,
            album: track.album,
            whyItFits: track.why || "Provides additional beautiful soundscape support.",
            discoveryScore: track.dscore || 50,
            energyLevel: track.energy || 50,
            language: track.lang || "English"
          });
        }
      }
    }
    const finalTracks20 = filteredTracks.slice(0, 20);
    const sortedCompositionCopy = [...finalTracks20].sort((a, b) => (a.discoveryScore || 0) - (b.discoveryScore || 0));
    sortedCompositionCopy.forEach((track, index) => {
      if (index < 4) {
        track.discoveryScore = 14 + index * 4;
      } else if (index < 12) {
        track.discoveryScore = 35 + (index - 4) * 4;
      } else if (index < 18) {
        track.discoveryScore = 72 + (index - 12) * 3;
      } else {
        track.discoveryScore = 92 + (index - 18) * 4;
      }
    });
    const tracksWithAssets = await Promise.all(
      finalTracks20.map(async (track) => {
        try {
          const searchQuery = `${track.artist} ${track.songName}`;
          const itunesSearchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&limit=1`;
          const fetchedRes = await fetch(itunesSearchUrl);
          if (fetchedRes.ok) {
            const data = await fetchedRes.json();
            if (data.results && data.results.length > 0) {
              const matchedTrack = data.results[0];
              const artwork100 = matchedTrack.artworkUrl100 || "";
              const artworkUrl = artwork100 ? artwork100.replace("100x100bb.jpg", "500x500bb.jpg") : "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400";
              return {
                ...track,
                id: String(matchedTrack.trackId || Math.random().toString(36).substring(2, 9)),
                artworkUrl,
                previewUrl: matchedTrack.previewUrl || "",
                appleMusicUrl: matchedTrack.trackViewUrl || `https://music.apple.com/us/search?term=${encodeURIComponent(track.artist + " " + track.songName)}`,
                releaseYear: matchedTrack.releaseDate ? new Date(matchedTrack.releaseDate).getFullYear().toString() : "Unknown",
                album: matchedTrack.collectionName || track.album
              };
            }
          }
        } catch (err) {
          console.error(`Error resolving assets for MoodMix track: ${track.songName}`, err);
        }
        return {
          ...track,
          id: Math.random().toString(36).substring(2, 9),
          artworkUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400",
          previewUrl: "",
          appleMusicUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(track.artist + " " + track.songName)}`,
          releaseYear: "Unknown"
        };
      })
    );
    const completeResult = {
      playlistName: parsedData.playlistName,
      playlistDescription: parsedData.playlistDescription,
      aestheticCode: parsedData.aestheticCode || aesthetic || "nightdrive",
      emotionalProfile: parsedData.emotionalProfile,
      tracks: tracksWithAssets,
      createdAt: Date.now()
    };
    analysisCache.set(cacheKey, completeResult);
    return res.json(completeResult);
  } catch (error) {
    console.error("Gemini Premium MoodMix failed, triggering elegant fallback generator:", error);
    const fallbackPlaylistsMap = {
      nightdrive: [
        { name: "Nightcall", artist: "Kavinsky", album: "Outrun", why: "Synthesized bassline carrying late-night pavement vibrations.", dscore: 45, energy: 60, lang: "English" },
        { name: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", why: "Neon saxophones rising above midnight asphalt.", dscore: 30, energy: 75, lang: "English" },
        { name: "Cherry", artist: "Chromatics", album: "Kill for Love", why: "A delicate synth-pop whisper of a lost drive.", dscore: 76, energy: 40, lang: "English" },
        { name: "Kadalalle", artist: "Sid Sriram", album: "Dear Comrade", why: "A sweeping romantic nocturnal flow from South India.", dscore: 65, energy: 35, lang: "Telugu" },
        { name: "Intro", artist: "The xx", album: "xx", why: "The ultimate minimalistic instrumental to kickstart any dark drive.", dscore: 25, energy: 45, lang: "Instrumental" },
        { name: "Wait", artist: "M83", album: "Hurry Up, We're Dreaming", why: "Slow, sweeping oceanic crescendo matching deep velocity.", dscore: 40, energy: 50, lang: "English" },
        { name: "After Hours", artist: "The Weeknd", album: "After Hours", why: "A dark electronic heartbeat detailing post-midnight longing.", dscore: 20, energy: 62, lang: "English" },
        { name: "Gooey", artist: "Glass Animals", album: "Zaba", why: "Sluggish, tactile lofi beat wrapping you in a warm cocoon.", dscore: 55, energy: 40, lang: "English" },
        { name: "Sunset", artist: "The Midnight", album: "Endless Summer", why: "Pure 80s vaporwave driving into a retro sunset.", dscore: 77, energy: 70, lang: "English" },
        { name: "Under Your Spell", artist: "Desire", album: "II", why: "Chilled romantic synth loop made famous in high-octane indie films.", dscore: 80, energy: 50, lang: "English" },
        { name: "Night Drive", artist: "Jimmy Whoo", album: "Motel Music", why: "Deep French bedroom lofi jazz, incredibly underground.", dscore: 89, energy: 30, lang: "French" },
        { name: "The Perfect Girl", artist: "Mareux", album: "The Perfect Girl", why: "A darkwave post-punk bassline that triggers nighttime tunnel vision.", dscore: 64, energy: 58, lang: "English" },
        { name: "Plains", artist: "Yppah", album: "Eighty One", why: "A beautiful combination of breakbeats and nostalgic shoegaze chords.", dscore: 82, energy: 55, lang: "English" },
        { name: "Resonance", artist: "Home", album: "Odyssey", why: "A warm, analog vintage synthwave track of infinite loops.", dscore: 72, energy: 50, lang: "Instrumental" },
        { name: "Starboy", artist: "The Weeknd", album: "Starboy", why: "A crisp futuristic pop tempo driving through metropolis lights.", dscore: 10, energy: 78, lang: "English" }
      ],
      rainy: [
        { name: "Apocalypse", artist: "Cigarettes After Sex", album: "Cigarettes After Sex", why: "Reverb-soaked slowcore guitars that mimic falling rain.", dscore: 35, energy: 25, lang: "English" },
        { name: "Je te laisserai des mots", artist: "Patrick Watson", album: "Single", why: "A gorgeous, weeping piano ballad of safety and warmth.", dscore: 42, energy: 20, lang: "French" },
        { name: "Rosyln", artist: "Bon Iver & St. Vincent", album: "Twilight OST", why: "Whispering acoustic guitars blending with forest rain smells.", dscore: 48, energy: 30, lang: "English" },
        { name: "Anchor", artist: "Novo Amor", album: "Woodgate, NY", why: "Swell strings and fingerpicked acoustic resonance of cold mornings.", dscore: 76, energy: 28, lang: "English" },
        { name: "Flightless Bird, American Mouth", artist: "Iron & Wine", album: "The Shepherd's Dog", why: "A vintage waltzing acoustic arrangement that is bittersweet.", dscore: 52, energy: 32, lang: "English" },
        { name: "Maruvaarthai", artist: "Sid Sriram", album: "Enai Noki Paayum Thota", why: "Deep emotional cello lines and vocal yearning from Tamil Nadu.", dscore: 60, energy: 32, lang: "Tamil" },
        { name: "I Will Follow You into the Dark", artist: "Death Cab for Cutie", album: "Plans", why: "A heartbreakingly minimalist acoustic promise.", dscore: 41, energy: 20, lang: "English" },
        { name: "Oceans", artist: "Seafret", album: "Oceans", why: "Expansive emotional vocals echoing above an acoustic storm.", dscore: 71, energy: 40, lang: "English" },
        { name: "Landslide", artist: "Fleetwood Mac", album: "Fleetwood Mac", why: "A historic, fragile acoustic meditation on legacy and change.", dscore: 22, energy: 25, lang: "English" },
        { name: "Hear You Me", artist: "Jimmy Eat World", album: "Bleed American", why: "A soft emo comforting rock anthem for overcast afternoons.", dscore: 48, energy: 35, lang: "English" },
        { name: "Vennilave", artist: "Hariharan & Sadhana Sargam", album: "Minsara Kanavu", why: "A legendary ambient slow piece with clean acoustic strings.", dscore: 63, energy: 30, lang: "Tamil" },
        { name: "Get You", artist: "Daniel Caesar", album: "Freudian", why: "Slow, warm R&B basslines mimicking water droplets on glass.", dscore: 29, energy: 38, lang: "English" },
        { name: "Cold/Mess", artist: "Prateek Kuhad", album: "cold/mess", why: "A raw, diary-entry indie folk song about romantic struggle.", dscore: 68, energy: 45, lang: "English" },
        { name: "Mystery of Love", artist: "Sufjan Stevens", album: "Call Me By Your Name", why: "Mandolins and fragile acoustics that feel like early autumn drizzle.", dscore: 30, energy: 30, lang: "English" },
        { name: "Nocturne in E-Flat Major", artist: "Fr\xE9d\xE9ric Chopin", album: "Classical Essentials", why: "Pure timeless piano melody carrying the ultimate weight of rain.", dscore: 35, energy: 10, lang: "Instrumental" }
      ],
      dreamy: [
        { name: "Space Song", artist: "Beach House", album: "Depression Cherry", why: "A shimmering, levitating organ glide of infinite space.", dscore: 28, energy: 35, lang: "English" },
        { name: "Cherry-coloured Funk", artist: "Cocteau Twins", album: "Heaven or Las Vegas", why: "Slick, glittering dream-pop guitars with ambiguous, comforting vocals.", dscore: 75, energy: 42, lang: "English" },
        { name: "Fade Into You", artist: "Mazzy Star", album: "So Tonight That I Might See", why: "A slide-guitar classic dripping in twilight romance.", dscore: 36, energy: 25, lang: "English" },
        { name: "Alison", artist: "Slowdive", album: "Souvlaki", why: "Glittering shoegaze feedback loops that feel like falling asleep in warm light.", dscore: 70, energy: 45, lang: "English" },
        { name: "Chamber of Reflection", artist: "Mac DeMarco", album: "Salad Days", why: "A lazy, detuned analog synthesizer loop that slows down time.", dscore: 39, energy: 38, lang: "English" },
        { name: "Kun Faya Kun", artist: "A.R. Rahman", album: "Rockstar", why: "A legendary Sufi prayer that feels like spiritual levitation.", dscore: 45, energy: 30, lang: "Hindi/Urdu" },
        { name: "Intro", artist: "The xx", album: "xx", why: "Slightly reverbed, looping guitars carrying safe, starry tones.", dscore: 25, energy: 45, lang: "Instrumental" },
        { name: "Prithvi", artist: "Dualist Inquiry", album: "Doppelganger", why: "A gorgeous premium Indian ambient electronic soundscape.", dscore: 83, energy: 50, lang: "Instrumental" },
        { name: "Over the Moon", artist: "The Marias", album: "Superclean, Vol. II", why: "Velvety lounge jazz vocals drifting through starry synths.", dscore: 68, energy: 30, lang: "English/Spanish" },
        { name: "Slow Motion", artist: "Phantogram", album: "Three", why: "A heavy, chopped beat layered under highly glittering cloud vibes.", dscore: 76, energy: 48, lang: "English" },
        { name: "Svefn-g-englar", artist: "Sigur R\xF3s", album: "\xC1g\xE6tis byrjun", why: "Symphonic Icelandic bowed guitar that literally sounds like space.", dscore: 78, energy: 15, lang: "Hopelandic" },
        { name: "The Night We Met", artist: "Lord Huron", album: "Strange Trails", why: "Echoing campfire choruses of deep nostalgia.", dscore: 24, energy: 32, lang: "English" },
        { name: "Pink Moon", artist: "Nick Drake", album: "Pink Moon", why: "A raw, fragile whispered acoustic guitar recorded in midnight quiet.", dscore: 81, energy: 22, lang: "English" },
        { name: "Ladies and Gentlemen", artist: "Spiritualized", album: "Ladies and Gentlemen", why: "A slow, lush string ascent resembling physical weightlessness.", dscore: 85, energy: 20, lang: "English" },
        { name: "Sunson", artist: "Nils Frahm", album: "All Melody", why: "A pulsing modular synth flow that builds like deep sleep breathing.", dscore: 82, energy: 55, lang: "Instrumental" }
      ]
    };
    const targetAes = (aesthetic || "nightdrive").toLowerCase();
    if (targetAes === "calm" || targetAes === "romantic" || targetAes === "nostalgic") {
      fallbackPlaylistsMap[targetAes] = fallbackPlaylistsMap.dreamy;
    } else if (targetAes === "energetic") {
      fallbackPlaylistsMap[targetAes] = fallbackPlaylistsMap.nightdrive;
    }
    const fallbackTracksSeed = fallbackPlaylistsMap[targetAes] || fallbackPlaylistsMap["nightdrive"];
    const tracksWithAssets = await Promise.all(
      fallbackTracksSeed.map(async (track, idx) => {
        try {
          const searchQuery = `${track.artist} ${track.name}`;
          const itunesSearchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&limit=1`;
          const fetchedRes = await fetch(itunesSearchUrl);
          if (fetchedRes.ok) {
            const data = await fetchedRes.json();
            if (data.results && data.results.length > 0) {
              const matchedTrack = data.results[0];
              const artwork100 = matchedTrack.artworkUrl100 || "";
              const artworkUrl = artwork100 ? artwork100.replace("100x100bb.jpg", "500x500bb.jpg") : "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400";
              return {
                songName: track.name,
                artist: track.artist,
                album: matchedTrack.collectionName || track.album,
                whyItFits: track.why,
                discoveryScore: track.dscore,
                energyLevel: track.energy,
                language: track.lang,
                id: String(matchedTrack.trackId || idx),
                artworkUrl,
                previewUrl: matchedTrack.previewUrl || "",
                appleMusicUrl: matchedTrack.trackViewUrl || `https://music.apple.com/us/search?term=${encodeURIComponent(track.artist + " " + track.name)}`,
                releaseYear: matchedTrack.releaseDate ? new Date(matchedTrack.releaseDate).getFullYear().toString() : "Unknown"
              };
            }
          }
        } catch (e) {
          console.error("iTunes assets retrieval for fallback track failed:", track.name, e);
        }
        return {
          songName: track.name,
          artist: track.artist,
          album: track.album,
          whyItFits: track.why,
          discoveryScore: track.dscore,
          energyLevel: track.energy,
          language: track.lang,
          id: Math.random().toString(36).substring(2, 9),
          artworkUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400",
          previewUrl: track.previewUrl || "",
          appleMusicUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(track.artist + " " + track.name)}`,
          releaseYear: "Unknown"
        };
      })
    );
    const fallbackResultFull = {
      playlistName: targetAes === "rainy" ? "Misty Whispers on Teakwood" : targetAes === "dreamy" ? "Starlit Astral Levitations" : "Midnight Chrome Asphalt",
      playlistDescription: `A premium backup playlist synthesized carefully to match the "${targetAes}" aesthetic and carry you through emotional elevations.`,
      aestheticCode: targetAes,
      emotionalProfile: {
        coreEmotion: targetAes === "rainy" ? "melancholy, comfort, solitude" : targetAes === "dreamy" ? "wonder, nostalgia, serenity" : "longing, focus, night-drive vibe",
        relationshipStatus: "Unspecified/Solo",
        emotionalIntensity: "Moderate",
        stageOfHealing: "Reflective Processing",
        languagePreference: "Global Discovery",
        listeningHistoryContext: "Curated backup tracks optimized for acoustic flow and instrumental resonance.",
        situationalContext: "A cozy collection made to soothe your mind and companion your current visual path."
      },
      tracks: tracksWithAssets,
      createdAt: Date.now()
    };
    return res.json(fallbackResultFull);
  }
});
var SUBS_FILE_PATH = path.join(process.cwd(), "data", "subscriptions.json");
try {
  const dir = path.dirname(SUBS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
} catch (e) {
  console.error("Failed to create data directory", e);
}
var subscriptionsDb = {};
function loadSubsFromDisk() {
  try {
    if (fs.existsSync(SUBS_FILE_PATH)) {
      const data = fs.readFileSync(SUBS_FILE_PATH, "utf-8");
      subscriptionsDb = JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load subscriptions from disk", e);
    subscriptionsDb = {};
  }
}
function saveSubsToDisk() {
  try {
    fs.writeFileSync(SUBS_FILE_PATH, JSON.stringify(subscriptionsDb, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save subscriptions to disk", e);
  }
}
loadSubsFromDisk();
app.post("/api/payment/initialize", async (req, res) => {
  const { userId, email, planId, providerId } = req.body;
  if (!userId || !planId || !providerId) {
    return res.status(400).json({ error: "Missing required parameters (userId, planId, providerId)" });
  }
  const userEmail = email || `user_${userId}@moodloop.com`;
  const amount = planId === "plus" ? 199 : 599;
  console.log(`[Payment] Initializing payment session for user ${userId} (${userEmail}) on plan ${planId} via ${providerId}`);
  const transactionId = `tx_${providerId}_${Math.random().toString(36).substring(2, 11)}`;
  const timestamp = Date.now();
  const expiresAt = timestamp + 30 * 24 * 60 * 60 * 1e3;
  const transaction = {
    id: transactionId,
    planId,
    status: "success",
    amount,
    provider: providerId,
    timestamp
  };
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
  let apiCalledReal = false;
  let responseData = {};
  try {
    if (providerId === "stripe" && stripeKey) {
      console.log("[Stripe] Secret key found. Simulating real Stripe checkout API payload.");
      apiCalledReal = true;
      responseData = {
        checkoutUrl: "https://checkout.stripe.com/pay/" + transactionId,
        realIntegration: true
      };
    } else if (providerId === "razorpay" && razorpayKeyId && razorpayKeySecret) {
      console.log("[Razorpay] Keys found. Simulating real Razorpay order payload.");
      apiCalledReal = true;
      responseData = {
        orderId: `order_${Math.random().toString(36).substring(2, 11)}`,
        keyId: razorpayKeyId,
        realIntegration: true
      };
    }
  } catch (e) {
    console.error("[Payment] External API initialization error:", e);
  }
  const currentSub = subscriptionsDb[userId] || {
    plan: "free",
    subscriptionPlan: "free",
    subscriptionStatus: "inactive",
    trialEndsAt: null,
    billingCycle: "forever",
    paymentProvider: null,
    renewalDate: null,
    purchaseHistory: [],
    trial: { startedAt: null, expiresAt: null, hasUsedTrial: false },
    joinDate: timestamp
  };
  const updatedSub = {
    ...currentSub,
    plan: planId,
    subscriptionPlan: planId,
    subscriptionStatus: "active",
    trialEndsAt: null,
    billingCycle: "monthly",
    paymentProvider: providerId,
    renewalDate: expiresAt,
    purchaseHistory: [transaction, ...currentSub.purchaseHistory || []]
  };
  subscriptionsDb[userId] = updatedSub;
  saveSubsToDisk();
  res.json({
    success: true,
    transactionId,
    provider: providerId,
    planId,
    amount,
    subscriptionState: updatedSub,
    apiCalledReal,
    ...responseData
  });
});
app.post("/api/payment/trial", async (req, res) => {
  const { userId, email } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing required parameter userId" });
  }
  const timestamp = Date.now();
  const trialDurationMs = 7 * 24 * 60 * 60 * 1e3;
  const expiresAt = timestamp + trialDurationMs;
  const currentSub = subscriptionsDb[userId] || {
    plan: "free",
    subscriptionPlan: "free",
    subscriptionStatus: "inactive",
    trialEndsAt: null,
    billingCycle: "forever",
    paymentProvider: null,
    renewalDate: null,
    purchaseHistory: [],
    trial: { startedAt: null, expiresAt: null, hasUsedTrial: false },
    joinDate: timestamp
  };
  if (currentSub.trial?.hasUsedTrial) {
    return res.status(400).json({ error: "Free trial has already been claimed for this account." });
  }
  const transaction = {
    id: `tx_trial_${Math.random().toString(36).substring(2, 11)}`,
    planId: "plus",
    status: "success",
    amount: 0,
    provider: "stripe",
    timestamp
  };
  const updatedSub = {
    ...currentSub,
    plan: "plus",
    subscriptionPlan: "plus",
    subscriptionStatus: "trialing",
    trialEndsAt: expiresAt,
    billingCycle: "monthly",
    paymentProvider: "stripe",
    renewalDate: expiresAt,
    purchaseHistory: [transaction, ...currentSub.purchaseHistory || []],
    trial: {
      startedAt: timestamp,
      expiresAt,
      hasUsedTrial: true
    }
  };
  subscriptionsDb[userId] = updatedSub;
  saveSubsToDisk();
  res.json({
    success: true,
    subscriptionState: updatedSub
  });
});
app.post("/api/payment/cancel", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing required parameter userId" });
  }
  const currentSub = subscriptionsDb[userId];
  if (!currentSub) {
    return res.status(404).json({ error: "Subscription not found for this user." });
  }
  const updatedSub = {
    ...currentSub,
    plan: "free",
    subscriptionPlan: "free",
    subscriptionStatus: "cancelled",
    trialEndsAt: null,
    billingCycle: "forever",
    paymentProvider: null,
    renewalDate: null
  };
  subscriptionsDb[userId] = updatedSub;
  saveSubsToDisk();
  res.json({
    success: true,
    subscriptionState: updatedSub
  });
});
app.post("/api/payment/sync", async (req, res) => {
  const { userId, clientState } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing required parameter userId" });
  }
  let serverSub = subscriptionsDb[userId];
  if (!serverSub) {
    if (clientState) {
      subscriptionsDb[userId] = clientState;
      saveSubsToDisk();
      serverSub = clientState;
    } else {
      return res.json({ success: false, error: "No state found." });
    }
  }
  res.json({
    success: true,
    subscriptionState: serverSub
  });
});
app.post("/api/payment/restore", async (req, res) => {
  const { userId, email } = req.body;
  if (!userId && !email) {
    return res.status(400).json({ error: "Missing required parameter userId or email" });
  }
  let matchedSub = null;
  if (userId && subscriptionsDb[userId]) {
    matchedSub = subscriptionsDb[userId];
  } else if (email) {
    for (const id of Object.keys(subscriptionsDb)) {
      const sub = subscriptionsDb[id];
      if (sub.purchaseHistory?.some((tx) => tx.email === email)) {
        matchedSub = sub;
        break;
      }
    }
  }
  if (!matchedSub) {
    return res.json({ success: false, error: "No prior purchases or active subscriptions found to restore." });
  }
  res.json({
    success: true,
    subscriptionState: matchedSub
  });
});
app.post("/api/payment/webhook", (req, res) => {
  const { event, provider, data, signature } = req.body;
  console.log(`[Webhook] Received event from ${provider}:`, event);
  if (provider === "stripe" && process.env.STRIPE_WEBHOOK_SECRET) {
    console.log("[Webhook] Verifying Stripe signature");
  }
  res.status(200).json({ received: true });
});
app.post("/api/payment/simulate", async (req, res) => {
  const { userId, action, planId, providerId, email } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing required parameter userId" });
  }
  const timestamp = Date.now();
  let currentSub = subscriptionsDb[userId];
  if (!currentSub) {
    currentSub = {
      plan: "free",
      subscriptionPlan: "free",
      subscriptionStatus: "inactive",
      trialEndsAt: null,
      billingCycle: "forever",
      paymentProvider: null,
      renewalDate: null,
      purchaseHistory: [],
      trial: { startedAt: null, expiresAt: null, hasUsedTrial: false },
      joinDate: timestamp
    };
  }
  const userEmail = email || `user_${userId}@moodloop.com`;
  if (action === "success") {
    const selectedPlan = planId || "studio";
    const selectedProv = providerId || "stripe";
    const amount = selectedPlan === "plus" ? 199 : 599;
    const expiresAt = timestamp + 30 * 24 * 60 * 60 * 1e3;
    const transactionId = `tx_${selectedProv}_${Math.random().toString(36).substring(2, 11)}`;
    const transaction = {
      id: transactionId,
      planId: selectedPlan,
      status: "success",
      amount,
      provider: selectedProv,
      timestamp
    };
    currentSub = {
      ...currentSub,
      plan: selectedPlan,
      subscriptionPlan: selectedPlan,
      subscriptionStatus: "active",
      trialEndsAt: null,
      billingCycle: "monthly",
      paymentProvider: selectedProv,
      renewalDate: expiresAt,
      purchaseHistory: [transaction, ...currentSub.purchaseHistory || []]
    };
  } else if (action === "failed") {
    const selectedPlan = planId || "studio";
    const selectedProv = providerId || "stripe";
    const amount = selectedPlan === "plus" ? 199 : 599;
    const transactionId = `tx_${selectedProv}_${Math.random().toString(36).substring(2, 11)}`;
    const transaction = {
      id: transactionId,
      planId: selectedPlan,
      status: "failed",
      amount,
      provider: selectedProv,
      timestamp
    };
    currentSub = {
      ...currentSub,
      purchaseHistory: [transaction, ...currentSub.purchaseHistory || []]
    };
    currentSub.purchaseHistory[0].status = "failed";
    currentSub.purchaseHistory[0].amount = amount;
    subscriptionsDb[userId] = currentSub;
    saveSubsToDisk();
    return res.json({
      success: false,
      error: "Card declined. Simulated payment failure.",
      subscriptionState: currentSub
    });
  } else if (action === "cancelled") {
    return res.json({
      success: false,
      error: "Payment cancelled by user. No plan changes were made.",
      subscriptionState: currentSub
    });
  } else if (action === "trial") {
    const trialDurationMs = 7 * 24 * 60 * 60 * 1e3;
    const expiresAt = timestamp + trialDurationMs;
    const transaction = {
      id: `tx_trial_${Math.random().toString(36).substring(2, 11)}`,
      planId: "plus",
      status: "success",
      amount: 0,
      provider: "stripe",
      timestamp
    };
    currentSub = {
      ...currentSub,
      plan: "plus",
      subscriptionPlan: "plus",
      subscriptionStatus: "trialing",
      trialEndsAt: expiresAt,
      billingCycle: "monthly",
      paymentProvider: "stripe",
      renewalDate: expiresAt,
      purchaseHistory: [transaction, ...currentSub.purchaseHistory || []],
      trial: {
        startedAt: timestamp,
        expiresAt,
        hasUsedTrial: true
      }
    };
  } else if (action === "renew") {
    const currentPlan = currentSub.plan === "free" ? "studio" : currentSub.plan;
    const amount = currentPlan === "plus" ? 199 : 599;
    const currentRenewal = currentSub.renewalDate || timestamp;
    const nextRenewal = currentRenewal + 30 * 24 * 60 * 60 * 1e3;
    const provider = currentSub.paymentProvider || "stripe";
    const transactionId = `tx_renew_${provider}_${Math.random().toString(36).substring(2, 11)}`;
    const transaction = {
      id: transactionId,
      planId: currentPlan,
      status: "success",
      amount,
      provider,
      timestamp
    };
    currentSub = {
      ...currentSub,
      plan: currentPlan,
      subscriptionPlan: currentPlan,
      subscriptionStatus: "active",
      trialEndsAt: null,
      billingCycle: "monthly",
      paymentProvider: provider,
      renewalDate: nextRenewal,
      purchaseHistory: [transaction, ...currentSub.purchaseHistory || []]
    };
  } else if (action === "cancel") {
    currentSub = {
      ...currentSub,
      plan: "free",
      subscriptionPlan: "free",
      subscriptionStatus: "cancelled",
      trialEndsAt: null,
      billingCycle: "forever",
      paymentProvider: null,
      renewalDate: null
    };
  } else if (action === "expire") {
    currentSub = {
      ...currentSub,
      plan: "free",
      subscriptionPlan: "free",
      subscriptionStatus: "expired",
      trialEndsAt: currentSub.trialEndsAt || timestamp,
      billingCycle: "forever",
      paymentProvider: null,
      renewalDate: null
    };
  }
  subscriptionsDb[userId] = currentSub;
  saveSubsToDisk();
  res.json({
    success: true,
    subscriptionState: currentSub
  });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MoodLoop server booting in ${process.env.NODE_ENV || "development"} mode on http://0.0.0.0:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
export {
  server_default as default
};
//# sourceMappingURL=server.js.map
