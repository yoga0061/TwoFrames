"use client";

import { useMemo } from "react";
import { Calendar } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { OptimizedImage } from "./ui/OptimizedImage";
import { format, differenceInMonths, differenceInYears, parseISO } from "date-fns";
import type { DailyMemory } from "@/types";

interface OnThisDayProps {
  memories: DailyMemory[];
  userNames: Record<string, string>;
}

export function OnThisDay({ memories, userNames }: OnThisDayProps) {
  const match = useMemo(() => {
    if (!memories || memories.length === 0) return null;

    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    // Find a memory that matches today's day of the month, but in a past month/year
    const eligible = memories.filter((m) => {
      const date = parseISO(m.uploadDate);
      if (isNaN(date.getTime())) return false;
      
      const mDay = date.getDate();
      const mMonth = date.getMonth();
      const mYear = date.getFullYear();

      // Same day of the month, but not today (different month or year)
      return mDay === todayDay && (mMonth !== todayMonth || mYear !== todayYear);
    });

    if (eligible.length === 0) return null;

    // Pick the most recent one or a random one. Let's pick the one closest to a full year/month
    const selected = eligible[0];
    const date = parseISO(selected.uploadDate);
    const diffYears = differenceInYears(today, date);
    const diffMonths = differenceInMonths(today, date);

    let title = "";
    if (diffYears > 0) {
      title = `${diffYears} Year${diffYears > 1 ? "s" : ""} Ago Today ❤️`;
    } else {
      title = `${diffMonths} Month${diffMonths > 1 ? "s" : ""} Ago Today ❤️`;
    }

    return {
      memory: selected,
      title,
      dateString: format(date, "MMMM d, yyyy"),
    };
  }, [memories]);

  if (!match) return null;

  const { memory, title, dateString } = match;
  const authorName = userNames[memory.userId] || "Partner";

  return (
    <GlassCard className="overflow-hidden border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)] bg-gradient-to-b from-[#1a0f26]/80 to-[#120a1c]/80 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-full bg-rose-500/10 p-2 text-rose-400">
          <Calendar className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-rose-300">{title}</h3>
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">{dateString}</p>
        </div>
      </div>

      <div className="relative group overflow-hidden rounded-xl bg-black/40 p-2 border border-white/5">
        <OptimizedImage
          src={memory.imageUrl}
          alt="On this day memory"
          widthSize={400}
          className="aspect-[4/3] w-full object-cover rounded-lg group-hover:scale-102 transition duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />
      </div>

      {memory.caption && (
        <p className="mt-3 text-sm text-white/80 italic text-center">
          &ldquo;{memory.caption}&rdquo;
        </p>
      )}

      <div className="mt-2 text-right">
        <span className="text-[10px] text-white/30 font-medium">
          Captured by {authorName}
        </span>
      </div>
    </GlassCard>
  );
}
