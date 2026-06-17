"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Award, Check, Sparkles } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { differenceInDays } from "date-fns";

interface MilestoneCelebrationProps {
  startDate: Date;
}

interface Milestone {
  days: number;
  label: string;
  emoji: string;
}

const MILESTONES: Milestone[] = [
  { days: 30, label: "First Month of Love", emoji: "❤️" },
  { days: 100, label: "100 Days of Harmony", emoji: "✨" },
  { days: 365, label: "One Year Together", emoji: "💑" },
  { days: 500, label: "500 Days of Joy", emoji: "🫶" },
  { days: 1000, label: "1000 Days of Bliss", emoji: "💖" },
];

export function MilestoneCelebration({ startDate }: MilestoneCelebrationProps) {
  const totalDays = useMemo(() => {
    return Math.max(0, differenceInDays(new Date(), startDate));
  }, [startDate]);

  const milestoneProgress = useMemo(() => {
    // Find next milestone
    const next = MILESTONES.find((m) => m.days > totalDays) || null;
    const completed = MILESTONES.filter((m) => m.days <= totalDays);

    return {
      totalDays,
      completed,
      next,
    };
  }, [totalDays]);

  const { next } = milestoneProgress;

  return (
    <GlassCard className="border-rose-500/15 shadow-[0_0_30px_rgba(244,63,94,0.03)] bg-gradient-to-b from-[#190a22]/85 to-[#0f0417]/85 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-full bg-rose-500/10 p-2 text-rose-400">
          <Award className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-rose-300">Relationship Milestones</h3>
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Celebrating your journey of {totalDays} days together</p>
        </div>
      </div>

      {/* Milestones list */}
      <div className="space-y-3">
        {MILESTONES.map((m) => {
          const isCompleted = totalDays >= m.days;
          const isNext = next && next.days === m.days;

          return (
            <div
              key={m.days}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-500 ${
                isCompleted
                  ? "bg-rose-500/5 border-rose-500/20"
                  : isNext
                  ? "bg-white/5 border-purple-500/30 shadow-[0_0_15px_rgba(167,139,250,0.08)]"
                  : "bg-white/2 border-white/5 opacity-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-500 ${
                    isCompleted
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                      : isNext
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                      : "bg-white/5 text-white/30 border border-white/5"
                  }`}
                >
                  {isCompleted ? (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      <Check className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <span>{m.days}d</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white/80">{m.label}</span>
                    <span className="text-sm">{m.emoji}</span>
                  </div>
                  {isNext && (
                    <span className="text-[10px] font-semibold text-purple-300/80">
                      In {m.days - totalDays} day{m.days - totalDays > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {isCompleted && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-rose-300">
                  <Sparkles className="h-3 w-3 text-yellow-400 fill-yellow-400 animate-pulse" />
                  Unlocked
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
