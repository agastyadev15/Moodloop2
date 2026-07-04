import { SongAnalysisService } from "./SongAnalysisService";
import { CandidateGenerationService } from "./CandidateGenerationService";
import { RecommendationRankingService } from "./RecommendationRankingService";
import { RecommendationValidationService } from "./RecommendationValidationService";
import { SongProfile, RecommendationEngineOptions } from "./types";
import { AnalysisResult } from "../src/types";

export class RecommendationEngine {
  private songAnalysisService = new SongAnalysisService();
  private candidateGenerationService = new CandidateGenerationService();
  private recommendationRankingService = new RecommendationRankingService();
  private recommendationValidationService = new RecommendationValidationService();

  /**
   * Orchestrates the 4-step recommendation pipeline.
   */
  public async getRecommendations(
    song: {
      id: string;
      name: string;
      artist: string;
      album?: string;
      releaseYear?: string;
      artworkUrl?: string;
      previewUrl?: string;
      appleMusicUrl?: string;
    },
    options: RecommendationEngineOptions = {}
  ): Promise<AnalysisResult> {
    console.log(`\n=== Starting Recommendation Pipeline for: "${song.name}" by "${song.artist}" ===`);

    // Step 1: Analyze the searched song and create a SongProfile
    console.log("[Pipeline] Step 1/4: Analyzing song...");
    const profile = await this.songAnalysisService.analyzeSong(song);

    // Step 2: Generate a candidate pool
    console.log("[Pipeline] Step 2/4: Generating candidates...");
    const candidates = await this.candidateGenerationService.generateCandidates(profile, options);

    // Step 3: Rank the candidates
    console.log("[Pipeline] Step 3/4: Ranking candidates...");
    const ranked = await this.recommendationRankingService.rankCandidates(profile, candidates, options);

    // Step 4: Validate and finalize recommendations (with assets resolution)
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
        releaseYear: profile.releaseYear || "Unknown",
      },
      moodAnalysis: profile.moodAnalysis,
      recommendations,
    };
  }
}

export {
  SongAnalysisService,
  CandidateGenerationService,
  RecommendationRankingService,
  RecommendationValidationService
};
