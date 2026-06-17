"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Heart, Save, Music, Upload, Link as LinkIcon, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { LogoutToggle } from "@/components/SocialAuthButtons";
import { AuthGuard } from "@/components/AuthGuard";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile, getCouple, updateCoupleSong } from "@/lib/firestore";
import { uploadAudioToCloudinary } from "@/lib/cloudinary";
import type { CoupleSong } from "@/types";
import { SecureCoupleCode } from "@/components/SecureCoupleCode";

function FloatingHearts() {
  const [hearts] = useState(() =>
    Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      size: Math.random() * 20 + 10,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: Math.random() * 2 + 1.5,
      rotate: Math.random() * 60 - 30,
    }))
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          initial={{ y: "110%", x: `${h.left}%`, scale: 0, opacity: 1 }}
          animate={{
            y: "-10%",
            scale: [1, 1.4, 1],
            opacity: [1, 1, 0],
            rotate: h.rotate,
          }}
          transition={{
            duration: h.duration,
            delay: h.delay,
            ease: "easeOut",
          }}
          style={{ position: "absolute", bottom: 0, fontSize: `${h.size}px` }}
          className="text-rose-500"
        >
          ❤️
        </motion.div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}

function SettingsContent() {
  const { profile, logout, refreshProfile } = useAuth();
  const router = useRouter();

  // Form states
  const [name, setName] = useState(profile?.name || "");
  const [startDateStr, setStartDateStr] = useState(() => {
    if (!profile?.relationshipStartDate) return "";
    const d = profile.relationshipStartDate.toDate();
    return d.toISOString().split("T")[0];
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingRelationship, setSavingRelationship] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showHearts, setShowHearts] = useState(false);

  // Soundtrack Form States
  const [songType, setSongType] = useState<"spotify" | "youtube" | "custom">("spotify");
  const [songUrl, setSongUrl] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [customAudioUrl, setCustomAudioUrl] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [savingSong, setSavingSong] = useState(false);

  useEffect(() => {
    if (!profile?.coupleId) return;
    getCouple(profile.coupleId).then((c) => {
      if (c && c.coupleSong) {
        setSongType(c.coupleSong.type);
        if (c.coupleSong.type === "custom") {
          setCustomAudioUrl(c.coupleSong.url);
        } else {
          setSongUrl(c.coupleSong.url);
        }
        setSongTitle(c.coupleSong.title || "");
        setSongArtist(c.coupleSong.artist || "");
      }
    });
  }, [profile?.coupleId]);

  const handleSaveSoundtrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.coupleId) return;

    setSavingSong(true);
    setToast(null);

    try {
      let finalUrl = songUrl;
      let finalTitle = songTitle.trim();
      let finalArtist = songArtist.trim();

      if (songType === "custom") {
        if (audioFile) {
          finalUrl = await uploadAudioToCloudinary(audioFile);
          finalTitle = finalTitle || audioFile.name.split(".")[0];
          finalArtist = finalArtist || "Uploaded Memory";
        } else {
          finalUrl = customAudioUrl;
        }

        if (!finalUrl) {
          setToast({ type: "error", message: "Please pick an audio file to upload." });
          setSavingSong(false);
          return;
        }
      } else {
        if (!finalUrl.trim()) {
          setToast({ type: "error", message: "Soundtrack link cannot be empty." });
          setSavingSong(false);
          return;
        }

        // Simple link validation
        if (songType === "spotify" && !finalUrl.includes("spotify.com")) {
          setToast({ type: "error", message: "Please enter a valid Spotify link." });
          setSavingSong(false);
          return;
        }
        if (songType === "youtube" && !finalUrl.includes("youtube.com") && !finalUrl.includes("youtu.be")) {
          setToast({ type: "error", message: "Please enter a valid YouTube/YouTube Music video link." });
          setSavingSong(false);
          return;
        }

        finalTitle = finalTitle || (songType === "spotify" ? "Spotify Track" : "YouTube Video");
        finalArtist = finalArtist || "Couple Favorite";
      }

      const songData: CoupleSong = {
        type: songType,
        url: finalUrl,
        title: finalTitle,
        artist: finalArtist,
      };

      await updateCoupleSong(profile.coupleId, songData);
      setCustomAudioUrl(finalUrl);
      setAudioFile(null);
      setToast({ type: "success", message: "Couple soundtrack updated successfully! 🎵" });
      setShowHearts(true);
      setTimeout(() => setShowHearts(false), 2000);
    } catch (err) {
      console.error("Save soundtrack failed:", err);
      setToast({ type: "error", message: "Failed to update soundtrack settings." });
    } finally {
      setSavingSong(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };


  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!name.trim()) {
      setToast({ type: "error", message: "User name cannot be empty." });
      return;
    }
    setSavingProfile(true);
    setToast(null);
    try {
      await updateUserProfile(profile.uid, { name: name.trim() });
      await refreshProfile();
      setToast({ type: "success", message: "Profile updated successfully! ❤️" });
      setShowHearts(true);
      setTimeout(() => setShowHearts(false), 2000);
    } catch {
      setToast({ type: "error", message: "Failed to save profile details." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const date = new Date(startDateStr);
    if (isNaN(date.getTime())) {
      setToast({ type: "error", message: "Please enter a valid start date." });
      return;
    }
    if (date.getTime() > Date.now()) {
      setToast({ type: "error", message: "Relationship start date cannot be in the future." });
      return;
    }
    setSavingRelationship(true);
    setToast(null);
    try {
      await updateUserProfile(profile.uid, {
        relationshipStartDate: date,
        coupleId: profile.coupleId,
      });
      await refreshProfile();
      setToast({ type: "success", message: "Relationship start date updated successfully! 💑" });
      setShowHearts(true);
      setTimeout(() => setShowHearts(false), 2000);
    } catch {
      setToast({ type: "error", message: "Failed to update relationship start date." });
    } finally {
      setSavingRelationship(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="relative min-h-screen pb-24 md:pb-8 md:pt-20">
      <Navbar />

      {/* Floating Hearts Celebration Layer */}
      {showHearts && <FloatingHearts />}

      <div className="relative z-10 mx-auto max-w-md px-4 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="mb-6 text-2xl font-bold text-white tracking-tight">Settings</h1>

          {/* Toast Notification */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-4 rounded-xl px-4 py-3 text-sm text-center font-medium border shadow-md ${
                  toast.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                {toast.message}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {/* Profile Settings */}
            <GlassCard>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-rose-300">
                Profile Settings
              </h2>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs text-white/50">Display Name</label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-rose-400/50 transition duration-300"
                        placeholder="Your display name"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingProfile || name.trim() === profile.name}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-rose-500/25 hover:opacity-90 disabled:opacity-30 transition"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {savingProfile ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </form>
            </GlassCard>

            {/* Relationship Settings */}
            <GlassCard>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-purple-300">
                Relationship Settings
              </h2>
              <form onSubmit={handleSaveRelationship} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs text-white/50">Anniversary Date</label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Heart className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <input
                        type="date"
                        required
                        value={startDateStr}
                        onChange={(e) => setStartDateStr(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-rose-400/50 transition duration-300"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingRelationship}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-500/25 hover:opacity-90 disabled:opacity-30 transition"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {savingRelationship ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </form>
            </GlassCard>

            {/* Couple Soundtrack Settings */}
            <GlassCard>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-pink-300 flex items-center gap-1.5">
                <Music className="h-4 w-4" />
                Couple Soundtrack
              </h2>
              <form onSubmit={handleSaveSoundtrack} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs text-white/50">Soundtrack Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "spotify", label: "Spotify ❤️" },
                      { value: "youtube", label: "YouTube ✨" },
                      { value: "custom", label: "Custom Audio 🌙" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSongType(opt.value as "spotify" | "youtube" | "custom")}
                        className={`rounded-xl py-2 text-xs font-semibold border transition duration-300 ${
                          songType === opt.value
                            ? "bg-rose-500/20 border-rose-400/50 text-rose-300 shadow-md"
                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {songType !== "custom" ? (
                  <div>
                    <label className="mb-1.5 block text-xs text-white/50">
                      {songType === "spotify" ? "Spotify Track or Playlist Link" : "YouTube Video or Playlist Link"}
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <input
                        type="url"
                        value={songUrl}
                        onChange={(e) => setSongUrl(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-rose-400/50 transition duration-300"
                        placeholder={
                          songType === "spotify"
                            ? "https://open.spotify.com/track/..."
                            : "https://www.youtube.com/watch?v=..."
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1.5 block text-xs text-white/50">Upload Audio File (Max 10MB)</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="audio/*"
                        id="soundtrack-audio-upload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              setToast({ type: "error", message: "Audio file must be less than 10MB." });
                              return;
                            }
                            setAudioFile(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="soundtrack-audio-upload"
                        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-center cursor-pointer hover:bg-white/10 transition"
                      >
                        <Upload className="h-5 w-5 text-white/40" />
                        <span className="text-xs text-white/60">
                          {audioFile ? audioFile.name : customAudioUrl ? "Change uploaded audio" : "Choose audio file"}
                        </span>
                        {audioFile && (
                          <span className="text-[10px] text-rose-300 font-medium">
                            {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        )}
                      </label>
                      {customAudioUrl && !audioFile && (
                        <div className="mt-2 text-[10px] text-white/40 text-center truncate">
                          Currently active: {customAudioUrl}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs text-white/50">Song Title (Optional)</label>
                    <input
                      type="text"
                      value={songTitle}
                      onChange={(e) => setSongTitle(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-rose-400/50 transition duration-300"
                      placeholder="e.g. Perfect"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-white/50">Artist Name (Optional)</label>
                    <input
                      type="text"
                      value={songArtist}
                      onChange={(e) => setSongArtist(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-rose-400/50 transition duration-300"
                      placeholder="e.g. Ed Sheeran"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingSong}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-pink-500/25 hover:opacity-90 disabled:opacity-30 transition w-full justify-center"
                  >
                    {savingSong ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving Soundtrack...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save Soundtrack Settings
                      </>
                    )}
                  </button>
                </div>
              </form>
            </GlassCard>

            {/* Couple Room Details */}
            <SecureCoupleCode code={profile.coupleCode} />

            <LogoutToggle onLogout={handleLogout} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
