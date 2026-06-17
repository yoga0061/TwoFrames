"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Gift } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";

interface AnniversaryCountdownProps {
  startDate: Date;
}

interface AnniversariesState {
  daysToMonth: number;
  monthsCount: number;
  daysToYear: number;
  yearsCount: number;
}

export function AnniversaryCountdown({ startDate }: AnniversaryCountdownProps) {
  const [anniversaries, setAnniversaries] = useState<AnniversariesState | null>(null);

  useEffect(() => {
    const update = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startDay = startDate.getDate();
      
      // Calculate Next Monthiversary
      const nextMonthiversary = new Date(today.getFullYear(), today.getMonth(), startDay);
      if (nextMonthiversary.getTime() <= today.getTime()) {
        nextMonthiversary.setMonth(nextMonthiversary.getMonth() + 1);
      }
      
      // Safety check for months with fewer days (e.g. Feb 30th)
      if (nextMonthiversary.getDate() !== startDay && nextMonthiversary.getDate() < 5) {
        nextMonthiversary.setDate(0); 
      }

      // Calculate Next Yearly Anniversary
      const nextYearly = new Date(today.getFullYear(), startDate.getMonth(), startDate.getDate());
      if (nextYearly.getTime() <= today.getTime()) {
        nextYearly.setFullYear(nextYearly.getFullYear() + 1);
      }

      const msPerDay = 24 * 60 * 60 * 1000;
      const daysToMonth = Math.max(0, Math.ceil((nextMonthiversary.getTime() - today.getTime()) / msPerDay));
      const daysToYear = Math.max(0, Math.ceil((nextYearly.getTime() - today.getTime()) / msPerDay));

      const monthsDiff = (nextMonthiversary.getFullYear() - startDate.getFullYear()) * 12 + (nextMonthiversary.getMonth() - startDate.getMonth());
      const yearsDiff = nextYearly.getFullYear() - startDate.getFullYear();

      setAnniversaries({
        daysToMonth,
        monthsCount: monthsDiff,
        daysToYear,
        yearsCount: yearsDiff,
      });
    };

    update();
    const timer = setInterval(update, 3600000); 
    return () => clearInterval(timer);
  }, [startDate]);

  if (!anniversaries) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Monthiversary Card */}
      <GlassCard className="relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative flex items-center justify-between z-10">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-300/80">
              Next Monthiversary
            </p>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {anniversaries.monthsCount} Months Celebration
            </h3>
            <p className="text-xs text-white/50">
              {anniversaries.daysToMonth === 1
                ? "Tomorrow! ❤️"
                : anniversaries.daysToMonth === 0
                ? "Celebrating Today! 🎉❤️"
                : `in ${anniversaries.daysToMonth} Days`}
            </p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="rounded-full bg-rose-500/10 p-3 border border-rose-500/20 text-rose-400"
          >
            <Heart className="h-5 w-5" fill="currentColor" />
          </motion.div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5 relative z-10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, ((30 - anniversaries.daysToMonth) / 30) * 100))}%` }}
            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500"
          />
        </div>
      </GlassCard>

      {/* Yearly Anniversary Card */}
      <GlassCard className="relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative flex items-center justify-between z-10">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-300/80">
              Yearly Anniversary
            </p>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {anniversaries.yearsCount} Year Anniversary
            </h3>
            <p className="text-xs text-white/50">
              {anniversaries.daysToYear === 1
                ? "Tomorrow! 🎉"
                : anniversaries.daysToYear === 0
                ? "Happy Anniversary! 💑❤️"
                : `in ${anniversaries.daysToYear} Days`}
            </p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="rounded-full bg-purple-500/10 p-3 border border-purple-500/20 text-purple-400"
          >
            <Gift className="h-5 w-5" />
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5 relative z-10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, ((365 - anniversaries.daysToYear) / 365) * 100))}%` }}
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
          />
        </div>
      </GlassCard>
    </div>
  );
}
