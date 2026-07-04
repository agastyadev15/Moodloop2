import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, Music, X, Play, Pause } from "lucide-react";
import { SongItem } from "../types";

interface SongSearchProps {
  onSelectSong: (song: SongItem) => void;
  isLoading: boolean;
  placeholder?: string;
  onQueryChange?: (query: string) => void;
  onPlayClick?: (track: SongItem) => void;
  activePlayback?: { previewUrl: string } | null;
  isPlaying?: boolean;
}

export default function SongSearch({
  onSelectSong,
  isLoading,
  placeholder,
  onQueryChange,
  onPlayClick,
  activePlayback,
  isPlaying,
}: SongSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SongItem[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate a unique identifier per component instance to avoid duplicate ID collisions in DOM
  const [instanceId] = useState(() => Math.random().toString(36).substring(2, 9));

  // Debounced autocomplete suggestions
  useEffect(() => {
    if (query.trim() === "") {
      setSuggestions([]);
      setIsSearchingSuggestions(false);
      return;
    }

    setIsSearchingSuggestions(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const songs = await res.json();
          setSuggestions(songs);
        }
      } catch (err) {
        console.error("Error fetching autocomplete suggestions:", err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 200); // 200ms snappier debounce

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Click outside detection using standard event listeners supporting both touch and mouse clicks
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSelect = (song: SongItem) => {
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    onSelectSong(song);
  };

  return (
    <div id={`search-component-root-${instanceId}`} className="relative w-full max-w-2xl mx-auto" ref={dropdownRef}>
      <div id={`search-input-wrapper-${instanceId}`} className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#6B6B6B]">
          {isSearchingSuggestions ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#8B5CF6]" />
          ) : (
            <Search className="w-5 h-5 text-[#6B6B6B] transition-colors" />
          )}
        </div>
        
        <input
          id={`song-search-input-${instanceId}`}
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            setShowDropdown(true);
            if (onQueryChange) {
              onQueryChange(val);
            }
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder || "Search any song..."}
          className="w-full pl-12 pr-10 py-4 bg-white border border-[#ECECEC] rounded-full text-[#111111] placeholder-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] text-sm md:text-base transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
        />

        {query && (
          <button
            id={`clear-search-button-${instanceId}`}
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              if (onQueryChange) {
                onQueryChange("");
              }
            }}
            className="absolute inset-y-0 right-4 flex items-center text-[#6B6B6B] hover:text-[#111111] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {showDropdown && (query.trim() !== "" || suggestions.length > 0) && (
        <div
          id={`search-suggestions-dropdown-${instanceId}`}
          className="absolute z-50 w-full mt-2 bg-white border border-[#ECECEC] rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.06)] max-h-[380px] overflow-y-auto"
        >
          {isSearchingSuggestions && suggestions.length === 0 ? (
            <div className="p-6 text-center text-[#6B6B6B] text-sm flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#8B5CF6]" />
              <span className="font-sans">Searching catalog...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-6 text-center text-[#6B6B6B] text-sm font-sans">
              No music tracks found for "{query}"
            </div>
          ) : (
            <div className="divide-y divide-[#ECECEC]">
              <div className="px-4 py-2 text-[9px] uppercase tracking-wider text-[#6B6B6B] font-mono font-bold bg-[#F5F5F3]">
                Matches
              </div>
              {suggestions.map((song) => {
                const isCurrentPlaying = isPlaying && activePlayback?.previewUrl === song.previewUrl && !!song.previewUrl;
                return (
                  <div
                    id={`suggestion-item-${song.id}-${instanceId}`}
                    key={song.id}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#F5F5F3] transition-colors text-left"
                  >
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        // Prevent dropdown blur
                        e.preventDefault();
                      }}
                      onClick={() => handleSelect(song)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer group focus:outline-none"
                    >
                      {song.artworkUrl ? (
                        <img
                          src={song.artworkUrl}
                          alt={song.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-neutral-100 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#F5F5F3] flex items-center justify-center border border-[#ECECEC] flex-shrink-0">
                          <Music className="w-5 h-5 text-[#6B6B6B]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#111111] truncate font-sans group-hover:text-[#8B5CF6] transition-colors">{song.name}</p>
                        <p className="text-xs text-[#6B6B6B] truncate mt-0.5 font-sans">
                          {song.artist} <span className="text-neutral-300 font-bold">•</span> {song.album || "Single"}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {onPlayClick && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayClick(song);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono tracking-wider uppercase flex items-center gap-1 cursor-pointer transition-all border ${
                            isCurrentPlaying
                              ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
                              : "bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200"
                          }`}
                          title={isCurrentPlaying ? "Pause preview" : "Listen to preview"}
                        >
                          {isCurrentPlaying ? (
                            <>
                              <Pause className="w-3 h-3 fill-current" />
                              <span>Playing</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        onClick={() => handleSelect(song)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono tracking-wider uppercase bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/15 hover:bg-[#8B5CF6] hover:text-white cursor-pointer transition-all"
                      >
                        View Analysis
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
