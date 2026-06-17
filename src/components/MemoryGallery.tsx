"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { formatTimestamp } from "@/lib/utils";
import { OptimizedImage } from "./ui/OptimizedImage";
import type { DailyMemory } from "@/types";

interface MemoryGalleryProps {
  memories: DailyMemory[];
  userNames: Record<string, string>;
  userId: string;
  onToggleReaction?: (memoryId: string, emoji: string) => void;
}

// Memoized Single Memory Card Component
const MemoryCard = React.memo(({
  memory,
  index,
  userNames,
  onSelect
}: {
  memory: DailyMemory;
  index: number;
  userNames: Record<string, string>;
  onSelect: (m: DailyMemory) => void;
}) => {
  const reactionsMap = memory.reactions || {};
  const reactionEmojis = Object.values(reactionsMap);
  
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onSelect(memory)}
      className="group relative aspect-square overflow-hidden rounded-xl privacy-sensitive bg-white/2 border border-white/5"
    >
      <OptimizedImage
        src={memory.imageUrl}
        alt={memory.caption || "Memory"}
        widthSize={400}
        loading="lazy"
        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      />
      
      {/* Reactions count on top-left if any */}
      {reactionEmojis.length > 0 && (
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-0.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-extrabold text-white backdrop-blur-sm border border-white/5">
          <span>{reactionEmojis.slice(0, 3).join("")}</span>
          <span className="ml-0.5">{reactionEmojis.length}</span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition group-hover:opacity-100 text-left">
        <p className="text-xs text-white/80">
          {formatTimestamp(memory.createdAt, "MMM d, yyyy")}
        </p>
        <p className="text-[10px] text-white/50">
          by {userNames[memory.userId] || "Partner"}
        </p>
      </div>
    </motion.button>
  );
});
MemoryCard.displayName = "MemoryCard";

export function MemoryGallery({
  memories,
  userNames,
  userId,
  onToggleReaction,
}: MemoryGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Unified close modal function that logs details as required
  const handleClose = React.useCallback(() => {
    console.log("Modal Close Triggered");
    setSelectedId(null);
  }, []);

  // Escape key close handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center bg-white/2 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
        <p className="text-4xl animate-bounce">❤️</p>
        <p className="mt-4 text-sm font-bold text-white/80">Your journey starts today.</p>
        <p className="mt-1 text-xs text-white/40">Upload your first memory together.</p>
      </div>
    );
  }

  // Find the selected memory from the list
  const selected = memories.find((m) => m.id === selectedId) || null;

  // Derive reaction values from the selected memory object
  const reactionsMap = selected?.reactions || {};
  const myReaction = reactionsMap[userId];
  const reactionsList = ["❤️", "🥺", "😘", "🔥", "😂"];

  // Count reactions for display
  const reactionCounts: Record<string, number> = {};
  Object.values(reactionsMap).forEach((emoji) => {
    reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
  });

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {memories.map((memory, i) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            index={i}
            userNames={userNames}
            onSelect={(m) => setSelectedId(m.id)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.1, bottom: 0.8 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 150) {
                  handleClose();
                }
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[95vh] max-w-2xl overflow-hidden rounded-2xl privacy-sensitive bg-[#150a22] border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] w-full touch-pan-y"
            >
              {/* Close Button: 44px x 44px minimum touch target size. Raised z-index to z-50 to avoid click interception. */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="absolute top-3 right-3 z-50 rounded-full bg-black/50 p-3 text-white hover:bg-black/70 backdrop-blur-sm transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center border border-white/5"
                style={{ pointerEvents: "auto" }}
              >
                <X className="h-5 w-5" />
              </button>

              <OptimizedImage
                src={selected.imageUrl}
                alt={selected.caption || "Memory"}
                widthSize={1200}
                loading="lazy"
                className="max-h-[60vh] w-full object-contain mx-auto"
              />

              <div className="p-5 md:p-6 bg-gradient-to-b from-[#150a22] to-[#0d0517]">
                
                {/* Header row with author info */}
                <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
                  <div>
                    <p className="text-sm font-extrabold text-white/80">
                      {formatTimestamp(selected.createdAt, "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-wider mt-0.5">
                      Captured by {userNames[selected.userId] || "Partner"}
                    </p>
                  </div>
                </div>

                {/* Caption / Note text */}
                {selected.caption && (
                  <p className="mt-4 text-sm font-semibold text-white/95 italic bg-white/2 border border-white/5 rounded-xl px-4 py-3">
                    &ldquo;{selected.caption}&rdquo;
                  </p>
                )}

                {/* Reactions selector */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 pt-3 border-t border-white/5">
                  <span className="text-[10px] uppercase font-black tracking-widest text-white/30">Reactions</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {reactionsList.map((emoji) => {
                      const count = reactionCounts[emoji] || 0;
                      const isActive = myReaction === emoji;
                      return (
                        <button
                          key={emoji}
                          onClick={() => onToggleReaction?.(selected.id, emoji)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-bold border transition cursor-pointer ${
                            isActive
                              ? "bg-rose-500/15 border-rose-500/35 text-rose-300 shadow-md shadow-rose-500/10"
                              : "bg-white/3 border-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-black text-white/70">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
