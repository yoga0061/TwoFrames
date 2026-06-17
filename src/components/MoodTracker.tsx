"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./ui/GlassCard";
import { updateMood } from "@/lib/firestore";
import { MOOD_OPTIONS, getMoodInfo, type MoodType, type MoodEntry, type DailyMemory, type FutureMessage } from "@/types";
import { formatCountdown, toSafeMillis } from "@/lib/utils";
import { Sparkles, Flame, Award, TrendingUp, Clock, Heart } from "lucide-react";

interface MoodTrackerProps {
  userId: string;
  coupleId: string;
  partnerName: string;
  myMood: MoodEntry | null;
  partnerMood: MoodEntry | null;
  memories: DailyMemory[];
  futureMessages: FutureMessage[];
  moods: MoodEntry[];
  relationshipStartDate: Date;
}

export function MoodTracker({
  userId,
  coupleId,
  partnerName,
  myMood,
  partnerMood,
  memories,
  futureMessages,
  moods,
  relationshipStartDate,
}: MoodTrackerProps) {
  const [optimisticMood, setOptimisticMood] = useState<MoodType | null>(null);
  const [updating, setUpdating] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [appVisits, setAppVisits] = useState(1);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Increment app visits on mount locally
  useEffect(() => {
    if (typeof window !== "undefined") {
      const visits = Number(localStorage.getItem("twoframes_app_visits") || "0");
      const nextVisits = visits + 1;
      localStorage.setItem("twoframes_app_visits", String(nextVisits));
      setTimeout(() => {
        setAppVisits(nextVisits);
      }, 0);
    }
  }, []);

  const [relationshipDays, setRelationshipDays] = useState(1);

  // Compute relationship days in effect to keep render pure
  useEffect(() => {
    const diff = Math.abs(Date.now() - relationshipStartDate.getTime());
    const days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    setTimeout(() => {
      setRelationshipDays(days);
    }, 0);
  }, [relationshipStartDate]);

  // Compute moodActivityScore
  const moodActivityScore = useMemo(() => {
    return (
      moods.length * 5 +
      memories.length * 15 +
      futureMessages.length * 10 +
      appVisits * 2
    );
  }, [moods.length, memories.length, futureMessages.length, appVisits]);

  // Compute Levels & Cooldown limits
  const levelData = useMemo(() => {
    if (moodActivityScore >= 200 && relationshipDays >= 14) {
      return {
        level: 3,
        name: "Soulmate Mode 💖",
        cooldownMinutes: 10,
        cooldownMs: 10 * 60 * 1000,
        color: "from-pink-500 to-purple-500",
        ringColor: "#d946ef",
        targetText: "Max level unlocked! Complete synergy.",
      };
    } else if (moodActivityScore >= 80 && relationshipDays >= 7) {
      return {
        level: 2,
        name: "Active Couple ✨",
        cooldownMinutes: 20,
        cooldownMs: 20 * 60 * 1000,
        color: "from-emerald-400 to-teal-500",
        ringColor: "#10b981",
        targetText: `${200 - moodActivityScore} pts to Soulmate Mode 💖 (Requires 14d together)`,
      };
    } else {
      return {
        level: 1,
        name: "Casual Couple ❤️",
        cooldownMinutes: 30,
        cooldownMs: 30 * 60 * 1000,
        color: "from-rose-400 to-pink-500",
        ringColor: "#f43f5e",
        targetText: `${80 - moodActivityScore} pts to Active Couple ✨ (Requires 7d together)`,
      };
    }
  }, [moodActivityScore, relationshipDays]);

  const cooldownMs = levelData.cooldownMs;

  // Manage countdown timer
  useEffect(() => {
    let active = true;
    const update = () => {
      if (!active) return;
      if (myMood?.createdAt) {
        const elapsed = Date.now() - toSafeMillis(myMood.createdAt);
        setCountdown(Math.max(0, cooldownMs - elapsed));
      } else {
        setCountdown(0);
      }
    };
    const timer = setTimeout(update, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [myMood, cooldownMs]);

  // Rollback optimistic state once server catches up
  useEffect(() => {
    if (myMood && myMood.createdAt !== null) {
      setTimeout(() => {
        setOptimisticMood(null);
      }, 0);
    }
  }, [myMood]);

  // Countdown clock tick
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleMoodSelect = async (mood: MoodType) => {
    if (updating || countdown > 0) return;

    setUpdating(true);
    setError("");
    setOptimisticMood(mood); // Optimistic UI update

    try {
      await updateMood(userId, coupleId, mood, levelData.cooldownMinutes);
      setCountdown(cooldownMs);
      setShowPicker(false);
      
      // Trigger subtle success notification
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 2000);
    } catch (err) {
      setOptimisticMood(null); // Rollback
      setError(err instanceof Error ? err.message : "Failed to update mood");
    } finally {
      setUpdating(false);
    }
  };

  const canUpdate = countdown <= 0;

  // Resolve current mood display (optimistic vs server)
  const myMoodDisplay = optimisticMood
    ? ({ id: "optimistic", mood: optimisticMood, userId, coupleId, createdAt: null } as unknown as MoodEntry)
    : myMood;

  const myMoodInfo = myMoodDisplay ? getMoodInfo(myMoodDisplay.mood) : null;
  const partnerMoodInfo = partnerMood ? getMoodInfo(partnerMood.mood) : null;

  // Calculate cooldown progress percentage for animated ring (0 to 100)
  const progressPct = useMemo(() => {
    if (countdown <= 0) return 0;
    return (countdown / cooldownMs) * 100;
  }, [countdown, cooldownMs]);

  return (
    <GlassCard delay={0.2} className="relative overflow-hidden border-rose-500/5 bg-gradient-to-b from-[#130722]/80 to-[#0e0717]/80">
      {/* Subtle Success Toast overlay inside card */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-4.5 py-2 text-xs font-extrabold text-white shadow-lg backdrop-blur-sm pointer-events-none"
          >
            <span>😊</span>
            <span>Mood Updated</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dynamic Header Level Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-rose-400" />
            Relationship Mood Center
          </h2>
          <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider block mt-0.5">
            {levelData.targetText}
          </span>
        </div>
        
        {/* Premium Level Badge */}
        <div className={`flex items-center gap-1.5 rounded-xl bg-gradient-to-r ${levelData.color} px-3 py-1.5 text-xs font-bold text-white shadow-md`}>
          {levelData.level === 3 ? (
            <Award className="h-3.5 w-3.5 fill-white/20" />
          ) : levelData.level === 2 ? (
            <Sparkles className="h-3.5 w-3.5 fill-white/20 animate-pulse" />
          ) : (
            <Flame className="h-3.5 w-3.5 fill-white/20" />
          )}
          <span>{levelData.name}</span>
          <span className="bg-black/20 text-[9px] px-1.5 py-0.5 rounded-md ml-1 font-black">
            {moodActivityScore} pts
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 relative">
        {/* User Mood Card with Progress Ring */}
        <div className="relative flex flex-col items-center justify-center p-5 rounded-2xl bg-white/3 border border-white/5 shadow-inner">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">You</p>
          
          <div className="relative h-24 w-24 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="absolute inset-0 h-full w-full transform -rotate-90 pointer-events-none select-none">
              <circle
                cx="48"
                cy="48"
                r="40"
                className="stroke-white/5"
                strokeWidth="5"
                fill="transparent"
              />
              {countdown > 0 && (
                <motion.circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke={levelData.ringColor}
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeLinecap="round"
                  animate={{ strokeDashoffset: (251.2 * progressPct) / 100 }}
                  transition={{ duration: 0.5, ease: "linear" }}
                  style={{
                    filter: `drop-shadow(0 0 4px ${levelData.ringColor}50)`
                  }}
                />
              )}
            </svg>

            {/* Emoji display inside Ring */}
            <div className="relative z-10 flex flex-col items-center justify-center h-16 w-16 rounded-full bg-white/5">
              {myMoodInfo ? (
                <motion.span
                  key={myMoodInfo.value}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="text-4xl select-none"
                >
                  {myMoodInfo.emoji}
                </motion.span>
              ) : (
                <Heart className="h-6 w-6 text-white/20" />
              )}
            </div>
          </div>

          <p className="mt-3 text-xs font-extrabold" style={{ color: myMoodInfo ? myMoodInfo.color : "rgba(255, 255, 255, 0.4)" }}>
            {myMoodInfo ? myMoodInfo.label : "Set Mood"}
          </p>
        </div>

        {/* Partner Mood Card */}
        <div className="relative flex flex-col items-center justify-center p-5 rounded-2xl bg-white/3 border border-white/5 shadow-inner">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">{partnerName}</p>

          <div className="relative h-24 w-24 flex items-center justify-center">
            {/* Simple static ring */}
            <svg className="absolute inset-0 h-full w-full pointer-events-none select-none">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke={partnerMoodInfo ? `${partnerMoodInfo.color}30` : "rgba(255, 255, 255, 0.05)"}
                strokeWidth="3"
                fill="transparent"
              />
            </svg>
            
            <div className="relative z-10 flex flex-col items-center justify-center h-16 w-16 rounded-full bg-white/5">
              {partnerMoodInfo ? (
                <motion.span
                  key={partnerMoodInfo.value}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="text-4xl select-none"
                >
                  {partnerMoodInfo.emoji}
                </motion.span>
              ) : (
                <span className="text-xl animate-pulse text-white/20">💤</span>
              )}
            </div>
          </div>

          <p className="mt-3 text-xs font-extrabold" style={{ color: partnerMoodInfo ? partnerMoodInfo.color : "rgba(255, 255, 255, 0.4)" }}>
            {partnerMoodInfo ? partnerMoodInfo.label : "Waiting..."}
          </p>
        </div>
      </div>

      {/* Button Controls and countdown bar */}
      <div className="mt-6 flex flex-col items-center justify-center">
        {canUpdate ? (
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-full rounded-2xl bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/20 py-3 text-xs font-bold uppercase tracking-wider text-rose-300 transition hover:bg-rose-500/15 active:scale-95 cursor-pointer"
          >
            {showPicker ? "Close Picker" : "Update Your Mood"}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-1.5 text-xs text-white/50 bg-white/2 border border-white/5 rounded-2xl px-5 py-3 w-full">
            <Clock className="h-3.5 w-3.5 text-rose-400" />
            <span>Update again in </span>
            <span className="font-extrabold text-rose-300">{formatCountdown(countdown)}</span>
          </div>
        )}
      </div>

      {/* Mood Picker Slider */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="grid grid-cols-4 gap-2.5 pt-2">
              {MOOD_OPTIONS.map((mood) => (
                <motion.button
                  key={mood.value}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleMoodSelect(mood.value)}
                  disabled={updating}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/2 p-3.5 transition hover:bg-white/5 disabled:opacity-50 cursor-pointer"
                >
                  <span className="text-3xl select-none">{mood.emoji}</span>
                  <span className="text-[10px] text-white/50 font-semibold">{mood.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-3 text-xs font-bold text-red-400 text-center">{error}</p>}
    </GlassCard>
  );
}
