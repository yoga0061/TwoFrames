"use client";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { calculateStreak } from "@/lib/utils";
import type { DailyMemory } from "@/types";

interface DailyLoveStreakProps {
  memories: DailyMemory[];
  memberIds: string[];
}

export function DailyLoveStreak({ memories, memberIds }: DailyLoveStreakProps) {
  const { count, todayComplete, hasStreak } = calculateStreak(memories, memberIds);

  if (!memberIds || memberIds.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md border transition duration-500 ${
        hasStreak
          ? "bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.15)]"
          : "bg-white/5 border-white/10 text-white/40"
      }`}
    >
      <motion.div
        animate={
          hasStreak
            ? {
                scale: [1, 1.2, 1],
                filter: [
                  "drop-shadow(0 0 2px rgba(249,115,22,0.4))",
                  "drop-shadow(0 0 6px rgba(249,115,22,0.8))",
                  "drop-shadow(0 0 2px rgba(249,115,22,0.4))",
                ],
              }
            : {}
        }
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        <Flame className={`h-4 w-4 ${hasStreak ? "text-orange-500 fill-orange-500" : ""}`} />
      </motion.div>
      <span>
        {hasStreak ? `${count} Day Streak` : "No Active Streak"}
      </span>
      {hasStreak && !todayComplete && (
        <span className="text-[10px] text-orange-300/80 animate-pulse ml-1">
          (Upload today to keep it alive!)
        </span>
      )}
    </motion.div>
  );
}
