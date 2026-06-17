"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";

interface WelcomeBoomProps {
  onComplete: () => void;
}

export function WelcomeBoom({ onComplete }: WelcomeBoomProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Onboarding sequence timing
  useEffect(() => {
    if (!mounted) return;

    const t1 = setTimeout(() => setStep(2), 1200);   // Step 2: Title Reveal
    const t2 = setTimeout(() => setStep(3), 3200);   // Step 3: Particle Burst & Subtitle Reveal
    const t3 = setTimeout(() => setStep(4), 5200);   // Step 4: Enter Button Fade-in

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [mounted]);

  // Generate deterministic/stable values on mount for particles to avoid random mismatches
  const hearts = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${(i * 7 + 13) % 100}%`,
      delay: `${(i * 0.45) % 4.5}s`,
      duration: `${4 + (i % 3)}s`,
      size: `${12 + (i * 3) % 15}px`,
    }));
  }, [mounted]);

  const sparkles = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${(i * 11 + 7) % 100}%`,
      top: `${(i * 13 + 17) % 80 + 10}%`,
      delay: `${(i * 0.3) % 3}s`,
      size: `${4 + (i % 3)}px`,
    }));
  }, [mounted]);

  const startTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
      }
    };
  }, []);

  const handleStart = () => {
    setExiting(true);
    startTimeoutRef.current = window.setTimeout(onComplete, 1000); // Wait for the fade-out exit animation
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#0a0514]"
        >
          {/* Inject hardware-accelerated CSS animations for buttery 60fps overlays */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes pulseGlow {
              0%, 100% {
                background: radial-gradient(circle at center, rgba(244,63,94,0.16) 0%, rgba(10,5,20,1) 70%);
              }
              50% {
                background: radial-gradient(circle at center, rgba(168,85,247,0.18) 0%, rgba(10,5,20,1) 75%);
              }
            }
            @keyframes floatUp {
              0% {
                transform: translateY(110vh) scale(0) rotate(0deg);
                opacity: 0;
              }
              15% {
                opacity: 0.75;
              }
              85% {
                opacity: 0.75;
              }
              100% {
                transform: translateY(-10vh) scale(1.1) rotate(180deg);
                opacity: 0;
              }
            }
            @keyframes breatheGlow {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.05); }
            }
            .animate-pulseGlow {
              animation: pulseGlow 10s infinite ease-in-out;
            }
            .animate-floatUp {
              animation: floatUp 6s infinite linear;
            }
            .animate-breatheGlow {
              animation: breatheGlow 4s infinite ease-in-out;
            }
          `}} />

          {/* Dynamic relationship breathing background */}
          <div className="absolute inset-0 animate-pulseGlow pointer-events-none" />

          {/* Floating Hearts Layer */}
          {step >= 2 && (
            <div className="absolute inset-0 pointer-events-none">
              {hearts.map((h) => (
                <div
                  key={h.id}
                  style={{
                    position: "absolute",
                    left: h.left,
                    bottom: "-20px",
                    fontSize: h.size,
                    animationDelay: h.delay,
                    animationDuration: h.duration,
                  }}
                  className="animate-floatUp text-rose-500/30 filter blur-[0.5px]"
                >
                  ❤️
                </div>
              ))}
            </div>
          )}

          {/* Sparkles Layer */}
          {step >= 3 && (
            <div className="absolute inset-0 pointer-events-none">
              {sparkles.map((s) => (
                <div
                  key={s.id}
                  style={{
                    position: "absolute",
                    left: s.left,
                    top: s.top,
                    width: s.size,
                    height: s.size,
                    animationDelay: s.delay,
                  }}
                  className="animate-pulse bg-purple-400/30 rounded-full filter blur-[1px]"
                />
              ))}
            </div>
          )}

          {/* Main Onboarding Interactive Frame */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6">
            
            {/* Step 2: Welcome Title */}
            {step >= 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={step >= 3 ? { opacity: 1, scale: 1.05, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="flex flex-col items-center justify-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="mb-4 text-rose-500 filter drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]"
                >
                  <Heart className="h-14 w-14 fill-current" />
                </motion.div>
                
                <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]">
                  Welcome to TwoFrames
                </h1>
              </motion.div>
            )}

            {/* Step 3: Subtitle with Particle Bloom representation */}
            {step >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="mt-4 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-rose-300 animate-pulse" />
                <p className="text-sm md:text-base font-semibold text-rose-300/80 italic">
                  Every day together becomes a memory
                </p>
                <Sparkles className="h-4 w-4 text-rose-300 animate-pulse" />
              </motion.div>
            )}

            {/* Step 4: Luxury CTA Button */}
            {step >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mt-10"
              >
                <button
                  onClick={handleStart}
                  className="relative group rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-rose-500/20 hover:scale-103 active:scale-98 transition duration-300 outline-none"
                >
                  {/* Subtle breathing outer border glow */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 via-purple-500 to-pink-500 rounded-2xl opacity-40 blur-md group-hover:opacity-80 transition duration-500" />
                  
                  <span className="relative flex items-center gap-2">
                    Enter Our Space
                    <Heart className="h-4 w-4 fill-current" />
                  </span>
                </button>
              </motion.div>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
