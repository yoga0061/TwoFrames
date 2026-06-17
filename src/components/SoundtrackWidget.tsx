"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Music, Heart, Plus, Trash2, ArrowUp, ArrowDown, Sparkles, AlertCircle, SkipBack, SkipForward, Disc } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { subscribeToPlaylist, addSongToPlaylist, removeSongFromPlaylist, reorderPlaylist } from "@/lib/firestore";
import type { Couple, CouplePlaylist } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface SoundtrackWidgetProps {
  couple: Couple | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SoundtrackWidget({ couple: _couple }: SoundtrackWidgetProps) {
  const { profile, user } = useAuth();
  
  // Real-time playlist state
  const [playlist, setPlaylist] = useState<CouplePlaylist | null>(null);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bgmMode, setBgmMode] = useState("automix");

  // Add song form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Subscribe to the playlist subcollection/document
  useEffect(() => {
    if (!profile?.coupleId) return;
    return subscribeToPlaylist(profile.coupleId, (data) => {
      setPlaylist(data);
    });
  }, [profile?.coupleId]);

  // Synchronize playback state with localStorage
  useEffect(() => {
    const syncState = () => {
      setCurrentPlayingId(localStorage.getItem("twoframes_playlist_playing_id"));
      setIsPlaying(localStorage.getItem("twoframes_bgm_playing") === "true");
      setBgmMode(localStorage.getItem("twoframes_bgm_mode") || "automix");
    };
    syncState();
    window.addEventListener("twoframes_bgm_update", syncState);
    return () => window.removeEventListener("twoframes_bgm_update", syncState);
  }, []);

  const songs = playlist?.songs || [];
  
  // Determine currently active song
  const currentSong = songs.find((s) => s.id === currentPlayingId) || songs[0] || null;
  const isCurrentSoundtrackPlaying = currentSong && bgmMode === "couple" && isPlaying;

  const handleTogglePlayback = () => {
    if (!currentSong) return;

    if (isCurrentSoundtrackPlaying) {
      localStorage.setItem("twoframes_bgm_playing", "false");
    } else {
      localStorage.setItem("twoframes_bgm_mode", "couple");
      localStorage.setItem("twoframes_bgm_enabled", "true");
      localStorage.setItem("twoframes_bgm_playing", "true");
      if (!currentPlayingId) {
        localStorage.setItem("twoframes_playlist_playing_id", currentSong.id);
      }
    }
    window.dispatchEvent(new Event("twoframes_bgm_update"));
  };

  const handlePlaySong = (songId: string) => {
    localStorage.setItem("twoframes_playlist_playing_id", songId);
    localStorage.setItem("twoframes_bgm_mode", "couple");
    localStorage.setItem("twoframes_bgm_enabled", "true");
    localStorage.setItem("twoframes_bgm_playing", "true");
    window.dispatchEvent(new Event("twoframes_bgm_update"));
  };

  const handleNextSong = () => {
    if (songs.length <= 1) return;
    const currentIndex = songs.findIndex((s) => s.id === currentSong?.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    const nextSong = songs[nextIndex];
    if (nextSong) {
      handlePlaySong(nextSong.id);
    }
  };

  const handlePrevSong = () => {
    if (songs.length <= 1) return;
    const currentIndex = songs.findIndex((s) => s.id === currentSong?.id);
    const prevIndex = currentIndex <= 0 ? songs.length - 1 : currentIndex - 1;
    const prevSong = songs[prevIndex];
    if (prevSong) {
      handlePlaySong(prevSong.id);
    }
  };

  const handleRemove = async (songId: string) => {
    if (!profile?.coupleId) return;
    try {
      await removeSongFromPlaylist(profile.coupleId, songId);
      
      // If we deleted the currently active song, skip to another one
      if (currentPlayingId === songId) {
        const remaining = songs.filter((s) => s.id !== songId);
        if (remaining.length > 0) {
          localStorage.setItem("twoframes_playlist_playing_id", remaining[0].id);
        } else {
          localStorage.removeItem("twoframes_playlist_playing_id");
        }
        window.dispatchEvent(new Event("twoframes_bgm_update"));
      }
    } catch (err) {
      console.error("Failed to delete song:", err);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    if (!profile?.coupleId) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= songs.length) return;

    const reordered = [...songs];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    try {
      await reorderPlaylist(profile.coupleId, reordered);
    } catch (err) {
      console.error("Failed to reorder playlist:", err);
    }
  };

  const handleAddSongSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.coupleId || !user) return;
    setError("");

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Please provide a song link.");
      return;
    }

    // URL validation
    try {
      new URL(trimmedUrl);
    } catch {
      setError("Please enter a valid HTTP/HTTPS URL link.");
      return;
    }

    if (songs.length >= 50) {
      setError("Playlist limit of 50 songs reached.");
      return;
    }

    if (songs.some((s) => s.url === trimmedUrl)) {
      setError("This song is already in the playlist.");
      return;
    }

    setIsAdding(true);
    try {
      let platform: "spotify" | "youtube" | "ambience" = "ambience";
      if (trimmedUrl.includes("spotify.com")) {
        platform = "spotify";
      } else if (trimmedUrl.includes("youtube.com") || trimmedUrl.includes("youtu.be")) {
        platform = "youtube";
      }

      const defaultTitle = platform === "spotify" ? "Spotify Track" : platform === "youtube" ? "YouTube Video" : "Ambient Audio";

      await addSongToPlaylist(profile.coupleId, {
        url: trimmedUrl,
        title: title.trim() || defaultTitle,
        platform,
        artist: artist.trim() || "Shared Ambient",
        addedBy: user.uid,
      });

      // Clear Form
      setUrl("");
      setTitle("");
      setArtist("");
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add song to playlist.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <GlassCard className="relative overflow-hidden group">
      {/* Background radial gradient glow */}
      <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-rose-500/10 blur-xl group-hover:bg-rose-500/15 transition duration-500" />
      <div className="absolute -left-12 -bottom-12 h-24 w-24 rounded-full bg-purple-500/10 blur-xl group-hover:bg-purple-500/15 transition duration-500" />

      <div className="relative z-10">
        
        {/* Widget Header */}
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-rose-300 flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 fill-current text-rose-400 animate-pulse" />
            Couple Playlist
          </h3>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-lg p-1 text-white/40 hover:text-white/80 hover:bg-white/5 transition flex items-center gap-1 text-[10px] font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Song
          </button>
        </div>

        {/* Form to Add New Song */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddSongSubmit}
              className="mb-4 overflow-hidden border border-white/10 rounded-xl bg-white/2 p-3 space-y-2.5"
            >
              <div>
                <label className="block text-[10px] text-white/50 mb-0.5">Song Link (Spotify, YouTube, MP3)</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://open.spotify.com/track/..."
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white outline-none focus:border-rose-500/50 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-white/50 mb-0.5">Title (Optional)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Perfect"
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white outline-none focus:border-rose-500/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 mb-0.5">Artist (Optional)</label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Ed Sheeran"
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white outline-none focus:border-rose-500/50 transition"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 px-3 py-1.5 text-[10px] text-white/60 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-1.5 text-[10px] font-bold text-white shadow hover:opacity-90 transition disabled:opacity-40"
                >
                  {isAdding ? "Adding..." : "Add to Queue"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* 1. Controller for Current Active Song */}
        {currentSong ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-inner mb-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-rose-400 mb-0.5 flex items-center gap-1">
                  <Disc className={`h-3 w-3 ${isCurrentSoundtrackPlaying ? "animate-spin" : ""}`} />
                  Currently Playing
                </p>
                <h4 className="text-sm font-bold text-white truncate">{currentSong.title}</h4>
                <p className="text-xs text-white/40 truncate">{currentSong.artist}</p>
              </div>

              {/* Animated Soundwave Dots */}
              <div className="flex items-end gap-[3px] h-3.5 w-5 pointer-events-none select-none">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[3px] rounded-full bg-rose-400/80 shadow-[0_0_4px_rgba(244,63,94,0.4)]"
                    style={{
                      height: "3px",
                      animation: isCurrentSoundtrackPlaying
                        ? `bounceWaveform-${i} 0.8s ease-in-out ${i * 0.1}s infinite`
                        : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Media Controls block */}
            <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-3">
              <div className="flex items-center gap-2">
                {/* Prev Button */}
                <button
                  type="button"
                  onClick={handlePrevSong}
                  disabled={songs.length <= 1}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition disabled:opacity-30"
                >
                  <SkipBack className="h-3.5 w-3.5" />
                </button>

                {/* Play/Pause Button */}
                <button
                  type="button"
                  onClick={handleTogglePlayback}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25 hover:scale-105 active:scale-95 transition"
                >
                  {isCurrentSoundtrackPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  )}
                </button>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={handleNextSong}
                  disabled={songs.length <= 1}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition disabled:opacity-30"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
              </div>

              <span className="text-[10px] text-rose-300/80 font-bold flex items-center gap-1">
                {isCurrentSoundtrackPlaying ? (
                  <>
                    <Sparkles className="h-3 w-3 animate-pulse text-amber-300" />
                    Background playing
                  </>
                ) : (
                  "Offline / ambient mode"
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-white/10 rounded-xl bg-white/2 mb-4 animate-fade-in">
            <Music className="h-5 w-5 text-white/20 mb-2 animate-bounce" />
            <p className="text-xs font-bold text-white/80">Add your first couple song. 🎵</p>
            <p className="mt-1 text-[10px] text-white/40">Create your soundtrack together.</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-3 text-[10px] font-bold text-rose-400 hover:text-rose-300 transition"
            >
              Add a track now &rarr;
            </button>
          </div>
        )}

        {/* 2. Scrollable Queue List */}
        {songs.length > 0 && (
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/30 mb-1">Queue List ({songs.length})</p>
            
            <AnimatePresence initial={false}>
              {songs.map((song, idx) => {
                const isActive = song.id === currentPlayingId;
                const platformLabel = song.platform === "spotify" ? "Spotify" : song.platform === "youtube" ? "YouTube" : "Audio";
                const isFirst = idx === 0;
                const isLast = idx === songs.length - 1;

                return (
                  <motion.div
                    key={song.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`flex items-center justify-between gap-3 p-2 rounded-lg border transition duration-300 ${
                      isActive
                        ? "bg-rose-500/10 border-rose-500/25 shadow-sm"
                        : "bg-white/2 border-white/5 hover:bg-white/5"
                    }`}
                  >
                    {/* Clickable song details area */}
                    <div
                      onClick={() => handlePlaySong(song.id)}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          song.platform === "spotify"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : song.platform === "youtube"
                            ? "bg-red-500/15 text-red-400"
                            : "bg-blue-500/15 text-blue-400"
                        }`}>
                          {platformLabel}
                        </span>
                        {isActive && <div className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />}
                      </div>
                      
                      <h5 className={`text-xs font-semibold mt-1 truncate ${isActive ? "text-rose-200" : "text-white/80"}`}>
                        {song.title}
                      </h5>
                      <p className="text-[10px] text-white/40 truncate">{song.artist}</p>
                    </div>

                    {/* Reorder and Delete Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => handleMove(idx, "up")}
                        disabled={isFirst}
                        title="Move Up"
                        className="rounded p-1 text-white/20 hover:text-white/60 hover:bg-white/5 disabled:opacity-0 transition"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => handleMove(idx, "down")}
                        disabled={isLast}
                        title="Move Down"
                        className="rounded p-1 text-white/20 hover:text-white/60 hover:bg-white/5 disabled:opacity-0 transition"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleRemove(song.id)}
                        title="Remove Song"
                        className="rounded p-1 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>
      
      <style jsx global>{`
        @keyframes bounceWaveform-0 { 0%, 100% { height: 3px; } 50% { height: 9px; } }
        @keyframes bounceWaveform-1 { 0%, 100% { height: 3px; } 50% { height: 13px; } }
        @keyframes bounceWaveform-2 { 0%, 100% { height: 3px; } 50% { height: 10px; } }
        @keyframes bounceWaveform-3 { 0%, 100% { height: 3px; } 50% { height: 6px; } }
      `}</style>
    </GlassCard>
  );
}
