import React from "react";
import { Heart, Play, Pause, Trash2, Share2, Compass } from "lucide-react";
import { RecommendationItem, SongItem } from "../types";
import { ThemePalette } from "../utils/theme";
import { extractAlbumTheme } from "../utils/theme";

interface FavoritesSectionProps {
  favorites: RecommendationItem[];
  onRemove: (songName: string, artist: string) => void;
  onExploreVibe: (song: SongItem) => void;
  onPlayClick: (track: { name: string; artist: string; artworkUrl: string; previewUrl: string }) => void;
  activePlayback: { previewUrl: string } | null;
  isPlaying: boolean;
  onStoryDnaClick: (song: RecommendationItem) => void;
  palette: ThemePalette;
  onReturnToStudio?: () => void;
}

export default function FavoritesSection({
  favorites,
  onRemove,
  onExploreVibe,
  onPlayClick,
  activePlayback,
  isPlaying,
  onStoryDnaClick,
  palette,
  onReturnToStudio
}: FavoritesSectionProps) {
  
  if (favorites.length === 0) {
    return (
      <div 
        id="favorites-empty-panel" 
        className="w-full max-w-2xl mx-auto py-16 px-6 text-center bg-white border border-[#ECECEC] rounded-3xl space-y-6 flex flex-col items-center justify-center relative overflow-hidden shadow-sm"
      >
        <div className="w-16 h-16 rounded-full bg-[#F5F5F3] border border-[#ECECEC] flex items-center justify-center relative z-10">
          <Heart className="w-7 h-7 text-[#6B6B6B]" />
        </div>

        <div className="space-y-2 max-w-md relative z-10">
          <h3 className="text-xl font-bold text-[#111111] font-serif">No Saved Harmonies Yet</h3>
          <p className="text-xs text-[#6B6B6B] leading-relaxed font-medium">
            When exploring song recommendations under "Studio" mode, hover over any card or click the heart icon. Your favorite tracks will gather here instantly so you never lose them.
          </p>
        </div>

        {onReturnToStudio && (
          <button
            onClick={onReturnToStudio}
            className="px-5 py-2.5 bg-[#111111] hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer relative z-10 shadow-sm"
          >
            ← Back to Studio Explorer
          </button>
        )}
      </div>
    );
  }

  const handlePlaySong = (song: RecommendationItem) => {
    onPlayClick({
      name: song.songName,
      artist: song.artist,
      artworkUrl: song.artworkUrl,
      previewUrl: song.previewUrl
    });
  };

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto text-left font-sans" id="favorites-grid-panel">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#ECECEC] pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111111] flex items-center gap-2.5 font-serif">
            <Heart className="w-5.5 h-5.5 text-rose-500 fill-current" />
            My Favorited Harmonies
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">
            Browse through your saved tracks, view their similarity indexes, analyze their specific Mood DNA, or initiate a new discovery search.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5">
          {onReturnToStudio && (
            <button
              onClick={onReturnToStudio}
              className="px-4 py-2 bg-[#F5F5F3] hover:bg-[#ECECEC] text-[#111111] border border-[#ECECEC] rounded-xl text-xs font-bold font-mono transition-all cursor-pointer"
            >
              ← BACK TO STUDIO
            </button>
          )}
          <div className="text-[10px] font-mono font-bold px-3 py-1 bg-rose-50 text-rose-600 rounded-full border border-rose-100">
            {favorites.length} SAVED
          </div>
        </div>
      </div>

      {/* ITEMS CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="favorites-shelf-list">
        {favorites.map((song, index) => {
          const recPalette = extractAlbumTheme(song.songName, song.artist);
          const isCurrentPlaying = isPlaying && activePlayback?.previewUrl === song.previewUrl;

          return (
            <div
              key={`${song.songName}-${index}`}
              className="bg-white border border-[#ECECEC] hover:border-zinc-300 rounded-[24px] p-5 flex flex-col justify-between shadow-sm hover:shadow-md group transition-all duration-300 relative overflow-hidden text-left"
            >
              <div className="flex gap-4 items-start justify-between relative z-10">
                <div className="flex items-center gap-4 min-w-0">
                  {/* ARTWORK COVER PORT */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-sm border border-[#ECECEC] flex-shrink-0 group-hover:scale-[1.02] transition-transform duration-300">
                    <img
                      src={song.artworkUrl || "https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&q=80&w=150"}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      alt={song.songName}
                    />
                    <button
                      onClick={() => handlePlaySong(song)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {isCurrentPlaying ? (
                        <Pause className="w-5 h-5 text-white fill-current" />
                      ) : (
                        <Play className="w-5 h-5 text-white fill-current pl-0.5" />
                      )}
                    </button>
                  </div>

                  {/* DETAILS HEADERS */}
                  <div className="min-w-0">
                    <span className="text-[9px] tracking-wider font-mono font-bold text-[#6B6B6B] block uppercase">
                      Album: {song.album || "Single"} • {song.releaseYear || "Unknown"}
                    </span>
                    <h3 className="font-bold text-[#111111] text-base mt-0.5 truncate group-hover:text-[#8B5CF6] transition-colors">
                      {song.songName}
                    </h3>
                    <p className="text-[#6B6B6B] text-xs truncate mt-0.5 font-medium">{song.artist}</p>
                  </div>
                </div>

                {/* MATCH PERCENTAGE PILL */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <div 
                    className="px-2.5 py-1 rounded-lg border text-center font-mono flex flex-col items-center min-w-[50px] bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20"
                  >
                    <span className="text-sm font-bold tracking-tight leading-none">{song.similarityScore}%</span>
                    <span className="text-[6.5px] font-bold tracking-widest uppercase mt-0.5">MATCH</span>
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="pt-4 border-t border-[#ECECEC] mt-5 flex items-center justify-between relative z-10">
                {/* Explore & Story triggers */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const songItem: SongItem = {
                        id: `bookmark_${song.songName}_${song.artist}`,
                        name: song.songName,
                        artist: song.artist,
                        album: song.album || "Single",
                        artworkUrl: song.artworkUrl,
                        previewUrl: song.previewUrl,
                        appleMusicUrl: song.appleMusicUrl || "",
                        releaseYear: song.releaseYear || "Unknown"
                      };
                      onExploreVibe(songItem);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#F5F5F3] hover:bg-[#ECECEC] border border-[#ECECEC] text-[10px] tracking-wider uppercase font-bold text-[#111111] flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Launch similar song explorer inside Studio"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#8B5CF6]" /> Explore Vibe
                  </button>

                  <button
                    onClick={() => onStoryDnaClick(song)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#F5F5F3] hover:bg-[#ECECEC] border border-[#ECECEC] text-[10px] tracking-wider uppercase font-bold text-[#111111] flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Generate high-vibe Mood DNA card for story sharing"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#8B5CF6]" /> Story DNA
                  </button>
                </div>

                {/* Trash/Remove */}
                <button
                  onClick={() => onRemove(song.songName, song.artist)}
                  className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer"
                  title="Remove from favorites"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
