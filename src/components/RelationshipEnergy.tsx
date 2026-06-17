"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Heart } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { subDays, format } from "date-fns";
import type { DailyMemory, MoodEntry } from "@/types";
import { toSafeDate } from "@/lib/utils";

interface RelationshipEnergyProps {
  memories: DailyMemory[];
  moods: MoodEntry[];
  memberIds: string[];
}

export function RelationshipEnergy({ memories, moods, memberIds }: RelationshipEnergyProps) {
  const score = useMemo(() => {
    if (memberIds.length < 2) return 50;

    // 1. Streak Score (Max 30 pts)
    // Calculate streak
    const uploadsByDate: Record<string, Set<string>> = {};
    memories.forEach((m) => {
      if (!uploadsByDate[m.uploadDate]) {
        uploadsByDate[m.uploadDate] = new Set();
      }
      uploadsByDate[m.uploadDate].add(m.userId);
    });

    const isDateComplete = (dateStr: string) => {
      const uploaders = uploadsByDate[dateStr];
      return uploaders && memberIds.every((id) => uploaders.has(id));
    };

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");

    let streak = 0;
    if (isDateComplete(todayStr)) {
      streak = 1;
      let checkDate = subDays(new Date(), 1);
      while (isDateComplete(format(checkDate, "yyyy-MM-dd"))) {
        streak++;
        checkDate = subDays(checkDate, 1);
      }
    } else if (isDateComplete(yesterdayStr)) {
      streak = 1;
      let checkDate = subDays(new Date(), 2);
      while (isDateComplete(format(checkDate, "yyyy-MM-dd"))) {
        streak++;
        checkDate = subDays(checkDate, 1);
      }
    }

    const streakScore = Math.min(streak * 10, 30);

    // 2. Mood Score (Max 30 pts)
    // Count mood logs in last 14 days
    const fourteenDaysAgo = subDays(new Date(), 14);
    const recentMoods = moods.filter((m) => {
      const date = toSafeDate(m.createdAt);
      return date && date > fourteenDaysAgo;
    });
    const moodScore = Math.min(recentMoods.length * 3, 30);

    // 3. Notes Consistency (Max 20 pts)
    // Percentage of last 10 memories that have notes
    const last10 = memories.slice(0, 10);
    const withNotes = last10.filter((m) => m.note && m.note.trim().length > 0).length;
    const notesScore = last10.length > 0 ? (withNotes / last10.length) * 20 : 0;

    // 4. Upload Consistency (Max 20 pts)
    // Days with uploads in last 14 days
    const uniqueUploadDays = new Set(memories.filter((m) => {
      const date = parseUploadDate(m.uploadDate);
      return date > fourteenDaysAgo;
    }).map((m) => m.uploadDate)).size;
    const consistencyScore = Math.min((uniqueUploadDays / 14) * 20, 20);

    // Final Score: Sum all parts, bound between 50 and 100 for encouraging UI
    const total = Math.round(50 + (streakScore + moodScore + notesScore + consistencyScore) / 2);
    return Math.min(100, Math.max(50, total));
  }, [memories, moods, memberIds]);

  // SVG Circular progress params
  const radius = 38;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <GlassCard className="border-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.03)] bg-gradient-to-b from-[#140821]/85 to-[#0b0314]/85 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-full bg-rose-500/10 p-2 text-rose-400">
          <Activity className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-rose-300">Relationship Energy</h3>
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Overall bond activity index</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-4 relative">
        {/* SVG Progress Ring */}
        <div className="relative h-28 w-28 flex items-center justify-center">
          <svg className="h-full w-full -rotate-90">
            {/* Background Track */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              fill="transparent"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={strokeWidth}
            />
            {/* Glowing Gradient Stroke */}
            <motion.circle
              cx="56"
              cy="56"
              r={radius}
              fill="transparent"
              stroke="url(#roseEnergyGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="roseEnergyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>
          </svg>

          {/* Glowing Shadow filter applied in css */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="text-rose-500 mb-0.5 filter drop-shadow-[0_0_6px_rgba(244,63,94,0.4)]"
            >
              <Heart className="h-4.5 w-4.5 fill-current" />
            </motion.div>
            <span className="text-xl font-mono font-extrabold text-white tracking-tighter">
              {score}%
            </span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-white/50 px-4">
          {score >= 90
            ? "Your connection is overflowing with love! Keep it up! ✨"
            : score >= 75
            ? "Wonderful energy! You two are deeply synchronized. ❤️"
            : "A warm connection. Share today's memory to charge up! 🫶"}
        </p>
      </div>
    </GlassCard>
  );
}

// Helpers
function parseUploadDate(dateStr: string): Date {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return new Date();
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}
