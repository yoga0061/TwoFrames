"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const Background3DScene = dynamic(() => import("./Background3DScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[#0f0a1a]" />
  ),
});

export function Background3D() {
  const [isLateNight, setIsLateNight] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const hours = new Date().getHours();
      setIsLateNight(hours >= 22 || hours < 6);
    };
    checkTime();
    const interval = setInterval(checkTime, 60000); // Check once a minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none transition-colors duration-1000">
      {/* 3D Canvas Scene */}
      <div className="absolute inset-0 pointer-events-none">
        <Background3DScene isLateNight={isLateNight} />
      </div>

      {/* Cinematic overlay gradient */}
      <div
        className={`pointer-events-none absolute inset-0 transition-all duration-1000 bg-gradient-to-b ${
          isLateNight
            ? "from-[#050208]/40 via-transparent to-[#050208]/80"
            : "from-[#0f0a1a]/30 via-transparent to-[#0f0a1a]/60"
        }`}
      />

      {/* Breathing glowing ambient circles */}
      <motion.div
        animate={{
          opacity: isLateNight ? [0.15, 0.25, 0.15] : [0.4, 0.6, 0.4],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className={`pointer-events-none absolute -top-1/4 left-1/4 h-[500px] w-[500px] rounded-full blur-[110px] transition-colors duration-1000 ${
          isLateNight ? "bg-indigo-500/5" : "bg-rose-500/10"
        }`}
      />
      <motion.div
        animate={{
          opacity: isLateNight ? [0.1, 0.2, 0.1] : [0.3, 0.5, 0.3],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className={`pointer-events-none absolute -bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full blur-[100px] transition-colors duration-1000 ${
          isLateNight ? "bg-blue-500/5" : "bg-purple-500/10"
        }`}
      />
    </div>
  );
}
