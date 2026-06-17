"use client";

import { useMemo } from "react";
import { Smile } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { format, subDays, isSameDay } from "date-fns";
import { getMoodInfo, type MoodEntry } from "@/types";
import { toSafeDate } from "@/lib/utils";

interface MoodHeatmapProps {
  moods: MoodEntry[];
  memberIds: string[];
  userNames: Record<string, string>;
}

export function MoodHeatmap({ moods, memberIds, userNames }: MoodHeatmapProps) {
  const last14Days = useMemo(() => {
    return Array.from({ length: 14 })
      .map((_, i) => subDays(new Date(), i))
      .reverse();
  }, []);

  const members = useMemo(() => {
    if (memberIds.length < 2) return [];
    return [
      { id: memberIds[0], name: userNames[memberIds[0]] || "Him" },
      { id: memberIds[1], name: userNames[memberIds[1]] || "Her" },
    ];
  }, [memberIds, userNames]);

  const gridData = useMemo(() => {
    return last14Days.map((date) => {
      // Find moods for each member on this specific calendar day
      const dailyMoods = members.map((member) => {
        const memberMoods = moods
          .filter((m) => m.userId === member.id)
          .filter((m) => {
            const mDate = toSafeDate(m.createdAt);
            return mDate && isSameDay(mDate, date);
          });
        // Sort by createdAt desc to get the latest mood of that day
        return memberMoods[0] || null;
      });

      return {
        date,
        dayStr: format(date, "d"),
        weekday: format(date, "EEE"),
        user1Mood: dailyMoods[0],
        user2Mood: dailyMoods[1],
      };
    });
  }, [last14Days, moods, members]);

  if (members.length < 2) return null;

  return (
    <GlassCard className="border-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.03)] bg-gradient-to-b from-[#11071d]/85 to-[#0b0314]/85 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-full bg-purple-500/10 p-2 text-purple-400">
          <Smile className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-purple-300">Mood Harmony Grid</h3>
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Your shared 14-day emotional gradient timeline</p>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-7 gap-2">
        {gridData.map((item, index) => {
          const u1MoodInfo = item.user1Mood ? getMoodInfo(item.user1Mood.mood) : null;
          const u2MoodInfo = item.user2Mood ? getMoodInfo(item.user2Mood.mood) : null;

          return (
            <div
              key={index}
              className="flex flex-col items-center p-2 rounded-xl border border-white/5 bg-white/2 relative group"
            >
              <span className="text-[9px] font-bold text-white/30 uppercase">{item.weekday}</span>
              <span className="text-xs font-semibold text-white/60 my-1">{item.dayStr}</span>
              
              <div className="flex gap-1 mt-1 justify-center w-full">
                {/* User 1 Dot */}
                <div
                  className="h-2.5 w-2.5 rounded-full border border-white/10 transition-all duration-300"
                  style={{
                    backgroundColor: u1MoodInfo?.color || "rgba(255,255,255,0.05)",
                    boxShadow: u1MoodInfo?.color ? `0 0 8px ${u1MoodInfo.color}` : "none",
                  }}
                  title={`${members[0].name}: ${u1MoodInfo?.label || "No mood logged"}`}
                />
                {/* User 2 Dot */}
                <div
                  className="h-2.5 w-2.5 rounded-full border border-white/10 transition-all duration-300"
                  style={{
                    backgroundColor: u2MoodInfo?.color || "rgba(255,255,255,0.05)",
                    boxShadow: u2MoodInfo?.color ? `0 0 8px ${u2MoodInfo.color}` : "none",
                  }}
                  title={`${members[1].name}: ${u2MoodInfo?.label || "No mood logged"}`}
                />
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 bg-black/95 border border-white/15 px-2 py-1 rounded text-[9px] text-white/90 whitespace-nowrap shadow-lg">
                <p className="font-semibold text-rose-300/95 mb-0.5">{format(item.date, "MMMM d")}</p>
                <p>{members[0].name}: {u1MoodInfo?.emoji} {u1MoodInfo?.label || "none"}</p>
                <p>{members[1].name}: {u2MoodInfo?.emoji} {u2MoodInfo?.label || "none"}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 justify-center border-t border-white/5 pt-3">
        {members.map((m, idx) => (
          <div key={m.id} className="flex items-center gap-1.5 text-[10px] text-white/50 font-medium">
            <div
              className={`h-1.5 w-1.5 rounded-full ${
                idx === 0 ? "bg-rose-400" : "bg-purple-400"
              }`}
            />
            {m.name}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
