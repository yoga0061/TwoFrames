"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Copy, Check, Lock } from "lucide-react";

interface SecureCoupleCodeProps {
  code: string;
}

export function SecureCoupleCode({ code }: SecureCoupleCodeProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (revealed) {
      const timer = setTimeout(() => {
        setRevealed(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [revealed]);

  const handleCopy = async () => {
    // Copy raw code for easier pasting
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanCode = code.toUpperCase().trim();
  const firstPart = cleanCode.slice(0, Math.floor(cleanCode.length / 2));
  const lastPart = cleanCode.slice(Math.floor(cleanCode.length / 2));
  const maskedFirst = "•".repeat(firstPart.length);

  const formattedMasked = `TF-${maskedFirst}-${lastPart}`;
  const formattedFull = `TF-${firstPart}-${lastPart}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#150e26]/60 p-5 backdrop-blur-xl shadow-2xl privacy-sensitive">
      {/* Subtle Security Glow/Animation */}
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 text-rose-300">
          <Lock className="h-4 w-4" />
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-lg border border-rose-400/30"
          />
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Your Space Code</p>
          <p className="text-[10px] text-white/30">Share this code with your partner to connect</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/5 rounded-xl px-4 py-3 backdrop-blur-md">
        <div className="font-mono text-lg font-bold tracking-wider text-rose-300 select-none">
          <AnimatePresence mode="wait">
            <motion.span
              key={revealed ? "revealed" : "masked"}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.15 }}
            >
              {revealed ? formattedFull : formattedMasked}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg px-2.5 py-1.5 transition duration-300"
          >
            {revealed ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Hide</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>Reveal</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs font-semibold text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg p-1.5 transition duration-300"
            title="Copy Code"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
