"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Quote, Sparkles } from "lucide-react";
import { parse, format } from "date-fns";
import { GlassCard } from "./ui/GlassCard";
import { OptimizedImage } from "./ui/OptimizedImage";
import { getMoodInfo } from "@/types";
import type { DailyMemory, MoodEntry, FutureMessage } from "@/types";
import { toSafeDate } from "@/lib/utils";

interface TimelineProps {
  memories: DailyMemory[];
  moods: MoodEntry[];
  userNames: Record<string, string>;
  futureMessages?: FutureMessage[];
}

const formatDayLabel = (dateStr: string) => {
  try {
    const date = parse(dateStr, "yyyy-MM-dd", new Date());
    return format(date, "EEEE, MMMM d, yyyy");
  } catch {
    return dateStr;
  }
};

function MidnightRecapCard({
  dateStr,
  memories,
  moods,
  userNames,
}: {
  dateStr: string;
  memories: DailyMemory[];
  moods: MoodEntry[];
  userNames: Record<string, string>;
}) {
  const formattedDate = formatDayLabel(dateStr);

  // Get the latest mood for each user on this day
  const latestMoods: Record<string, MoodEntry> = {};
  moods.forEach((m) => {
    const current = latestMoods[m.userId];
    if (!current || toSafeDate(m.createdAt)!.getTime() > toSafeDate(current.createdAt)!.getTime()) {
      latestMoods[m.userId] = m;
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-[#1d122b]/90 via-[#0e0717]/95 to-[#160821]/90 p-5 shadow-[0_0_25px_rgba(244,63,94,0.06)] hover:border-rose-400/40 hover:shadow-[0_0_30px_rgba(244,63,94,0.1)] transition duration-500 group"
    >
      {/* Background glow pulse */}
      <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-rose-500/5 blur-[50px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
      <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-purple-500/5 blur-[50px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="text-rose-400"
          >
            <Heart className="h-4 w-4 text-rose-400 animate-pulse" fill="currentColor" />
          </motion.div>
          <span className="text-xs font-bold uppercase tracking-widest text-rose-300/95 flex items-center gap-1">
            Midnight Recap <Sparkles className="h-3 w-3 text-amber-300 animate-pulse" />
          </span>
        </div>
        <span className="text-[10px] font-semibold text-white/40 tracking-wider">{formattedDate}</span>
      </div>

      {/* Image Grid */}
      <div 
        className="grid gap-3 mb-4" 
        style={{ gridTemplateColumns: memories.length === 2 ? "1fr 1fr" : "1fr" }}
      >
        {memories.map((mem) => {
          const name = userNames[mem.userId] || "Partner";
          return (
            <div key={mem.id} className="relative group overflow-hidden rounded-xl bg-black/40 border border-white/5">
              <OptimizedImage
                src={mem.imageUrl}
                alt=""
                widthSize={400}
                className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300">{name}</p>
                {mem.caption && (
                  <p className="text-xs text-white/95 line-clamp-1 mt-0.5 font-medium">{mem.caption}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Moods Section */}
      {Object.keys(latestMoods).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(latestMoods).map(([userId, mEntry]) => {
            const moodInfo = getMoodInfo(mEntry.mood);
            return (
              <div
                key={userId}
                className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/5 px-3 py-1 text-xs text-white/80 shadow-sm"
              >
                <span className="text-sm">{moodInfo.emoji}</span>
                <span className="font-semibold text-rose-200/90">{userNames[userId] || "Partner"}:</span>
                <span className="text-white/60">{moodInfo.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Notes Section */}
      <div className="space-y-2">
        {memories.map((mem) => {
          if (!mem.note) return null;
          const name = userNames[mem.userId] || "Partner";
          return (
            <div
              key={`note-${mem.id}`}
              className="rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 text-left relative overflow-hidden"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Quote className="h-3 w-3 text-rose-300/40" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                  {name}
                </span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed italic">&ldquo;{mem.note}&rdquo;</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function MoodRecapCard({
  dateStr,
  moods,
  userNames,
}: {
  dateStr: string;
  moods: MoodEntry[];
  userNames: Record<string, string>;
}) {
  const formattedDate = formatDayLabel(dateStr);

  const latestMoods: Record<string, MoodEntry> = {};
  moods.forEach((m) => {
    const current = latestMoods[m.userId];
    if (!current || toSafeDate(m.createdAt)!.getTime() > toSafeDate(current.createdAt)!.getTime()) {
      latestMoods[m.userId] = m;
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg hover:border-white/20 transition duration-300"
    >
      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2 text-purple-400">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-300/90">
            Emotional Activity
          </span>
        </div>
        <span className="text-[10px] font-semibold text-white/40 tracking-wider">{formattedDate}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(latestMoods).map(([userId, mEntry]) => {
          const moodInfo = getMoodInfo(mEntry.mood);
          return (
            <div
              key={userId}
              className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/5 px-3 py-1 text-xs text-white/80"
            >
              <span className="text-sm">{moodInfo.emoji}</span>
              <span className="font-semibold text-purple-200/90">{userNames[userId] || "Partner"}:</span>
              <span className="text-white/60">{moodInfo.label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function FutureMessageCard({
  message,
  userNames,
}: {
  message: FutureMessage;
  userNames: Record<string, string>;
}) {
  const senderName = userNames[message.senderId] || "Partner";
  const createdDate = format(toSafeDate(message.createdAt) || new Date(), "MMM d, yyyy");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-[#220d2b]/95 via-[#0e0717]/95 to-[#1a0a29]/95 p-5 shadow-[0_0_20px_rgba(244,63,94,0.1)] hover:border-rose-400/50 hover:shadow-[0_0_30px_rgba(244,63,94,0.18)] transition duration-500 group text-left"
    >
      {/* Soft romantic ambient glow inside the card */}
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-rose-500/5 blur-[45px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
      <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-purple-500/5 blur-[45px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="text-rose-400"
          >
            <Heart className="h-4 w-4 fill-current" />
          </motion.div>
          <span className="text-xs font-bold uppercase tracking-widest text-rose-300">
            A message from your past ❤️
          </span>
        </div>
        <span className="text-[10px] font-semibold text-white/40 tracking-wider">
          From {senderName} &bull; {createdDate}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3">
        {message.imageUrl && (
          <div className="relative overflow-hidden rounded-xl bg-black/40 border border-white/5">
            <OptimizedImage
              src={message.imageUrl}
              alt="Memory Thumbnail"
              widthSize={400}
              className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        )}
        <div className="relative rounded-xl border border-white/5 bg-white/5 px-4 py-3">
          <Quote className="absolute -top-1.5 -left-1.5 h-5 w-5 text-rose-300/10 pointer-events-none" />
          <p className="text-sm text-rose-100/90 leading-relaxed font-serif italic whitespace-pre-wrap">
            &ldquo;{message.message}&rdquo;
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function RelationshipTimeline({ memories, moods, userNames, futureMessages }: TimelineProps) {
  // 1. Group memories by uploadDate (YYYY-MM-DD)
  const memoriesByDate: Record<string, DailyMemory[]> = {};
  memories.forEach((m) => {
    const dStr = m.uploadDate;
    if (!memoriesByDate[dStr]) memoriesByDate[dStr] = [];
    memoriesByDate[dStr].push(m);
  });

  // 2. Group moods by date string (YYYY-MM-DD)
  const moodsByDate: Record<string, MoodEntry[]> = {};
  moods.forEach((m) => {
    const d = toSafeDate(m.createdAt);
    if (!d) return;
    const dStr = format(d, "yyyy-MM-dd");
    if (!moodsByDate[dStr]) moodsByDate[dStr] = [];
    moodsByDate[dStr].push(m);
  });

  // 3. Group unlocked future messages by unlock date string (YYYY-MM-DD)
  const futureMessagesByDate: Record<string, FutureMessage[]> = {};
  const [now] = useState(() => Date.now());
  (futureMessages || []).forEach((m) => {
    const unlockDate = toSafeDate(m.unlockAt);
    if (!unlockDate || unlockDate.getTime() > now) return;
    const dStr = format(unlockDate, "yyyy-MM-dd");
    if (!futureMessagesByDate[dStr]) futureMessagesByDate[dStr] = [];
    futureMessagesByDate[dStr].push(m);
  });

  // 4. Gather and sort all unique dates
  const allDates = Array.from(
    new Set([
      ...Object.keys(memoriesByDate),
      ...Object.keys(moodsByDate),
      ...Object.keys(futureMessagesByDate),
    ])
  ).sort((a, b) => b.localeCompare(a));

  if (allDates.length === 0) {
    return (
      <GlassCard delay={0.3}>
        <h2 className="mb-4 text-lg font-semibold text-white/90">Timeline</h2>
        <p className="py-8 text-center text-sm text-white/40">
          Your story begins here...
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard delay={0.3}>
      <h2 className="mb-6 text-lg font-semibold text-white/90 flex items-center gap-2">
        Relationship Timeline
      </h2>
      <div className="relative space-y-6">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/10" />
        {allDates.slice(0, 15).map((dateStr, i) => {
          const dayMemories = memoriesByDate[dateStr] || [];
          const dayMoods = moodsByDate[dateStr] || [];
          const dayFutureMessages = futureMessagesByDate[dateStr] || [];
          const hasMemories = dayMemories.length > 0;
          const hasFutureMessages = dayFutureMessages.length > 0;

          return (
            <motion.div
              key={dateStr}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative flex gap-4 pl-10"
            >
              {/* Glowing timeline node if there is a unlocked future message on this day */}
              {hasFutureMessages ? (
                <div className="absolute left-1.5 top-1.5 h-4 w-4 rounded-full border-2 border-rose-500 bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)] animate-pulse z-10" />
              ) : (
                <div className="absolute left-2 top-1.5 h-3 w-3 rounded-full border-2 border-rose-400 bg-[#0f0a1a]" />
              )}
              
              <div className="flex-1 space-y-4">
                {dayFutureMessages.map((msg) => (
                  <FutureMessageCard key={msg.id} message={msg} userNames={userNames} />
                ))}

                {hasMemories ? (
                  <MidnightRecapCard
                    dateStr={dateStr}
                    memories={dayMemories}
                    moods={dayMoods}
                    userNames={userNames}
                  />
                ) : (
                  dayMoods.length > 0 && (
                    <MoodRecapCard
                      dateStr={dateStr}
                      moods={dayMoods}
                      userNames={userNames}
                    />
                  )
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}
