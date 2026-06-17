"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { getPreciseRelationshipDuration } from "@/lib/utils";

interface RelationshipCounterProps {
  startDate: Date;
}

// Memoized surrounding UI components to prevent unnecessary re-evaluations
const CounterHeader = React.memo(() => (
  <div className="relative flex flex-col items-center justify-center mb-6 z-10">
    <motion.div
      animate={{ scale: [1, 1.25, 1.1, 1.3, 1] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      className="text-rose-400 mb-2 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
    >
      <Heart className="h-7 w-7 text-rose-500" fill="currentColor" />
    </motion.div>
    <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-rose-300/90 flex items-center gap-1">
      Together Forever
    </h2>
  </div>
));
CounterHeader.displayName = "CounterHeader";

export const RelationshipCounter = React.memo(({ startDate }: RelationshipCounterProps) => {
  const yearsRef = useRef<HTMLSpanElement>(null);
  const monthsRef = useRef<HTMLSpanElement>(null);
  const daysRef = useRef<HTMLSpanElement>(null);
  const hoursRef = useRef<HTMLSpanElement>(null);
  const minutesRef = useRef<HTMLSpanElement>(null);
  const secondsRef = useRef<HTMLSpanElement>(null);

  // Parse initial duration during render to avoid layout shifts or blank hydration flashes
  const [initial] = useState(() => getPreciseRelationshipDuration(startDate));

  useEffect(() => {
    const updateTime = () => {
      const dur = getPreciseRelationshipDuration(startDate);
      if (yearsRef.current) yearsRef.current.textContent = String(dur.years);
      if (monthsRef.current) monthsRef.current.textContent = String(dur.months);
      if (daysRef.current) daysRef.current.textContent = String(dur.days);
      
      if (hoursRef.current) {
        hoursRef.current.textContent = dur.hours < 10 ? `0${dur.hours}` : String(dur.hours);
      }
      if (minutesRef.current) {
        minutesRef.current.textContent = dur.minutes < 10 ? `0${dur.minutes}` : String(dur.minutes);
      }
      if (secondsRef.current) {
        secondsRef.current.textContent = dur.seconds < 10 ? `0${dur.seconds}` : String(dur.seconds);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  const formatInitial = (val: number) => (val < 10 ? `0${val}` : String(val));

  return (
    <GlassCard className="relative overflow-hidden border-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.08)] bg-gradient-to-br from-[#1c0f2a]/95 via-[#0e0717]/98 to-[#170a24]/95 p-6 text-center">
      {/* Heartbeat pulse in background */}
      <div className="absolute inset-0 bg-radial-gradient from-rose-500/5 to-transparent opacity-50 pointer-events-none animate-pulse" />

      {/* Header (Memoized, never re-renders) */}
      <CounterHeader />

      <div className="relative space-y-4 z-10">
        {/* Years, Months, Days (Parent cards are static; only text nodes update) */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { ref: yearsRef, label: "Years", initialVal: initial.years },
            { ref: monthsRef, label: "Months", initialVal: initial.months },
            { ref: daysRef, label: "Days", initialVal: initial.days },
          ].map(({ ref, label, initialVal }) => (
            <div key={label} className="text-center relative group">
              <div className="rounded-2xl border border-white/5 bg-white/5 py-4 shadow-inner overflow-hidden relative">
                <div className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:left-full transition-all duration-1000 ease-out" />
                <span
                  ref={ref}
                  className="text-3xl font-extrabold text-white md:text-4xl block font-mono tracking-tight"
                >
                  {initialVal}
                </span>
              </div>
              <p className="mt-2 text-[10px] uppercase font-bold tracking-widest text-white/40">{label}</p>
            </div>
          ))}
        </div>

        {/* Hours, Minutes, Seconds */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { ref: hoursRef, label: "Hours", initialVal: initial.hours },
            { ref: minutesRef, label: "Minutes", initialVal: initial.minutes },
            { ref: secondsRef, label: "Seconds", initialVal: initial.seconds },
          ].map(({ ref, label, initialVal }) => (
            <div key={label} className="text-center relative group">
              <div className="rounded-xl border border-white/5 bg-white/5 py-2.5 shadow-inner overflow-hidden relative">
                <div className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 group-hover:left-full transition-all duration-1000 ease-out" />
                <span
                  ref={ref}
                  className="text-xl font-bold text-rose-300 block font-mono tracking-tight"
                >
                  {formatInitial(initialVal)}
                </span>
              </div>
              <p className="mt-1.5 text-[9px] uppercase font-bold tracking-widest text-white/30">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
});

RelationshipCounter.displayName = "RelationshipCounter";
