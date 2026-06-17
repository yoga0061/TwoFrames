"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Lock, Unlock, Mail, Plus, Image as ImageIcon, Eye, Trash2, Send, Loader2, Quote } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import {
  saveFutureMessage,
  subscribeToFutureMessages,
  markFutureMessageAsOpened,
  getPartnerProfile,
  getFutureMessageSecret,
} from "@/lib/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toSafeDate } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import type { FutureMessage, UserProfile } from "@/types";
import { format } from "date-fns";

// Check if current time is late night (10 PM to 6 AM)
const isLateNight = () => {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 6;
};

// ==========================================
// 1. LIGHTWEIGHT AMBIENT BACKGROUND PARTICLES
// ==========================================
function AmbientParticles() {
  const [lateNight] = useState(() => isLateNight());
  
  // Create a static array of particles to avoid regeneration on render
  const [particles] = useState(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 6 + 4,
      delay: Math.random() * -20,
      // Late night has slower floating speeds (35-50s) than regular (20-30s)
      duration: lateNight ? Math.random() * 15 + 35 : Math.random() * 10 + 20,
      opacity: lateNight ? Math.random() * 0.15 + 0.05 : Math.random() * 0.25 + 0.1,
    }));
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-rose-400/30 blur-[2px]"
          style={{
            left: p.left,
            bottom: "-20px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animation: `floatUp ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: inherit;
          }
          90% {
            opacity: inherit;
          }
          100% {
            transform: translateY(-110vh) scale(1.2) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// ==========================================
// 2. MEMOIZED LOCKED MESSAGE CARD (with local countdown)
// ==========================================
function LockedMessageCard({
  message,
  userNames,
  onReveal,
}: {
  message: FutureMessage;
  userNames: Record<string, string>;
  onReveal: (msg: FutureMessage) => void;
}) {
  const senderName = userNames[message.senderId] || "Partner";
  const targetDate = useMemo(() => toSafeDate(message.unlockAt) || new Date(), [message.unlockAt]);
  const [countdownText, setCountdownText] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const diffMs = targetDate.getTime() - Date.now();
      if (diffMs <= 0) {
        setIsUnlocked(true);
        setCountdownText("Ready to unlock! ❤️");
        return true; // stop timer
      }

      const totalSecs = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSecs / (3600 * 24));
      const hours = Math.floor((totalSecs % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;

      if (days > 0) {
        // Required format: "Unlocks in 12 Days ❤️"
        setCountdownText(`Unlocks in ${days} Day${days > 1 ? "s" : ""} ❤️`);
      } else {
        const pad = (n: number) => String(n).padStart(2, "0");
        setCountdownText(`Unlocks in ${pad(hours)}:${pad(minutes)}:${pad(seconds)} ❤️`);
      }
      return false;
    };

    const isFinished = updateCountdown();
    if (isFinished) return;

    const interval = setInterval(() => {
      const finished = updateCountdown();
      if (finished) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
        isUnlocked
          ? "border-rose-500/40 bg-gradient-to-b from-[#250d26]/80 to-[#100617]/90 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
          : "border-white/5 bg-white/5 backdrop-blur-md"
      }`}
    >
      {/* Glow highlight */}
      {isUnlocked && (
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-purple-500/5 pointer-events-none" />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300/80">
            From {senderName}
          </p>
          
          {/* Locked status text */}
          <div className="mt-2 flex items-center gap-2">
            {isUnlocked ? (
              <Unlock className="h-4.5 w-4.5 text-rose-400 animate-pulse" />
            ) : (
              <Lock className="h-4.5 w-4.5 text-white/30 animate-pulse" />
            )}
            
            {/* Glowing countdown timer */}
            <span
              className={`text-sm font-semibold tracking-tight ${
                isUnlocked
                  ? "text-rose-200 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse"
                  : "text-white/70"
              }`}
            >
              {countdownText}
            </span>
          </div>

          <p className="mt-3 text-xs text-white/40">
            Scheduled unlock: {format(targetDate, "PPpp")}
          </p>
        </div>

        {/* Action Button */}
        {isUnlocked ? (
          <button
            onClick={() => onReveal(message)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:opacity-90 active:scale-98 transition"
          >
            <Eye className="h-3.5 w-3.5" />
            Reveal
          </button>
        ) : (
          <div className="rounded-full bg-white/5 p-2 text-white/20 border border-white/5">
            <Lock className="h-4 w-4" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ==========================================
// 3. CINEMATIC UNLOCK EXPERIENCE OVERLAY
// ==========================================
function CinematicUnlockSequence({
  message,
  userNames,
  onComplete,
  onClose,
}: {
  message: FutureMessage;
  userNames: Record<string, string>;
  onComplete: () => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"dim" | "beating" | "cracking" | "revealed">("dim");
  const { registerVerifiedUrls } = useAuth();
  const [secret, setSecret] = useState<{ message: string; imageUrl: string | null } | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const fetchInProgress = useRef(false);

  const senderName = userNames[message.senderId] || "Partner";
  const createdDate = format(toSafeDate(message.createdAt) || new Date(), "MMMM d, yyyy");

  useEffect(() => {
    if (secret || fetchInProgress.current) return;

    let active = true;
    setLoadingSecret(true);
    setError(null);
    fetchInProgress.current = true;

    // Timeout safety: 8 seconds
    const timeoutId = setTimeout(() => {
      if (active && loadingSecret) {
        setLoadingSecret(false);
        setError("Nostalgic decryption is taking longer than expected. Please check connection and retry.");
        fetchInProgress.current = false;
      }
    }, 8000);

    getFutureMessageSecret(message.id)
      .then((sec) => {
        if (!active) return;
        clearTimeout(timeoutId);
        setSecret(sec);
        setLoadingSecret(false);
        fetchInProgress.current = false;
        if (sec?.imageUrl) {
          registerVerifiedUrls([sec.imageUrl]);
        }
      })
      .catch((err) => {
        if (!active) return;
        clearTimeout(timeoutId);
        console.error("Vault decrypt failed:", err);
        setError("Missing permissions or network error. Please verify you are linked to the couple room.");
        setLoadingSecret(false);
        fetchInProgress.current = false;
      });

    return () => {
      active = false;
      clearTimeout(timeoutId);
      fetchInProgress.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.id, registerVerifiedUrls, retryCount]);

  // Timer sequence
  useEffect(() => {
    // 1. Start dim background immediately, then start heartbeat beating after 800ms
    const t1 = setTimeout(() => setPhase("beating"), 800);
    // 2. Beating starts cracking at 2800ms
    const t2 = setTimeout(() => setPhase("cracking"), 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Reveal when both cracking phase is reached and secret is ready
  useEffect(() => {
    if (phase === "cracking" && secret && !loadingSecret && !error) {
      const t3 = setTimeout(() => {
        setPhase("revealed");
        onComplete(); // Save 'opened = true' in database
      }, 1500); // give it a little time in cracking phase
      return () => clearTimeout(t3);
    }
  }, [phase, secret, loadingSecret, error, onComplete]);

  // Floating love hearts for the unlock sequence (Pure lightweight CSS)
  const [hearts] = useState(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${15 + Math.random() * 70}%`,
      delay: Math.random() * 1.5,
      size: Math.random() * 15 + 10,
    }));
  });

  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/95 px-4 overflow-hidden">
      
      {/* Background radial gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.12)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

      {/* Floating unlock hearts show up in cracked/revealed phase */}
      {(phase === "cracking" || phase === "revealed") && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {hearts.map((h) => (
            <div
              key={h.id}
              className="absolute text-rose-500/40 select-none animate-float-heart"
              style={{
                left: h.left,
                bottom: "-30px",
                fontSize: `${h.size}px`,
                animationDelay: `${h.delay}s`,
                animationDuration: "3s",
                animationFillMode: "both",
              }}
            >
              ❤️
            </div>
          ))}
        </div>
      )}

      {/* Back button */}
      {phase === "revealed" && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white transition"
        >
          Close Vault
        </button>
      )}

      <div className="relative flex flex-col items-center justify-center max-w-lg w-full text-center">
        <AnimatePresence mode="wait">
          
          {/* Phase 1 & 2 & 3: Locked Box cracking sequence */}
          {phase !== "revealed" && (
            <motion.div
              key="lock-sequence"
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center"
            >
              {/* Lock visual container */}
              <div className="relative flex h-32 w-32 items-center justify-center">
                
                {/* Ambient romantic glow ring */}
                <motion.div
                  animate={phase === "beating" ? { scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] } : {}}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-rose-500/20 blur-2xl"
                />

                {/* Beating Padlock Icon */}
                <motion.div
                  animate={
                    phase === "beating"
                      ? { scale: [1, 1.15, 1] }
                      : phase === "cracking"
                      ? { rotate: [-3, 3, -3, 3, 0], scale: [1, 1.05, 1] }
                      : {}
                  }
                  transition={
                    phase === "beating"
                      ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" }
                      : phase === "cracking"
                      ? { repeat: Infinity, duration: 0.15 }
                      : {}
                  }
                  className={`relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl border border-rose-500/30 bg-gradient-to-br from-[#200c28] to-[#0e0717] text-rose-400 shadow-2xl shadow-rose-500/20`}
                >
                  {phase === "cracking" ? (
                    <Unlock className="h-12 w-12 text-rose-400 animate-pulse" />
                  ) : (
                    <Lock className="h-12 w-12 text-rose-300" />
                  )}

                  {/* Gold cracking overlay cracks */}
                  {phase === "cracking" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.3, 0.9, 0.3] }}
                      transition={{ duration: 0.3, repeat: Infinity }}
                      className="absolute inset-0 rounded-3xl border border-yellow-400/80 bg-yellow-400/5 blur-[1px]"
                    />
                  )}
                </motion.div>
              </div>

              {/* Status and Error handling */}
              {error ? (
                <div className="mt-6 max-w-xs text-center space-y-4">
                  <p className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 px-3.5 py-2 rounded-xl">
                    {error}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        if (isDebouncing) return;
                        setIsDebouncing(true);
                        setRetryCount((prev) => prev + 1);
                        setTimeout(() => setIsDebouncing(false), 2000); // 2 second debounce
                      }}
                      disabled={isDebouncing}
                      className="rounded-xl bg-rose-500/20 border border-rose-500/35 hover:bg-rose-500/30 px-4 py-2 text-xs font-bold text-rose-300 transition disabled:opacity-40"
                    >
                      {isDebouncing ? "Waiting..." : "Retry Decryption"}
                    </button>
                    <button
                      onClick={onClose}
                      className="rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white/60 transition"
                    >
                      Close Vault
                    </button>
                  </div>
                </div>
              ) : (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 text-sm font-semibold tracking-wider text-rose-300/85 uppercase animate-pulse"
                >
                  {phase === "dim" && "Decrypting Capsule ❤️"}
                  {phase === "beating" && "Verifying Unlock ✨"}
                  {phase === "cracking" && "Opening Memory 🌙"}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Phase 4: Revealed letter visual with blur-to-focus reveal */}
          {phase === "revealed" && (
            <motion.div
              key="revealed-letter"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-2">
                Unlocked Capsule ❤️
              </p>
              
              {/* Cinematic text reveal header */}
              <h2 className="text-xl font-semibold text-white/60 tracking-tight">
                A message written by <span className="text-white font-bold">{senderName}</span>
              </h2>
              <p className="text-xs text-white/35 mt-1">on {createdDate}</p>

              {/* Glassmorphism letter card */}
              <div className="mt-8 rounded-3xl border border-rose-500/20 bg-gradient-to-b from-[#180a24]/90 to-[#0c0512]/95 p-6 md:p-8 shadow-2xl text-left relative overflow-hidden group privacy-sensitive">
                
                {/* Floating internal subtle glow */}
                <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-rose-500/5 blur-[50px] pointer-events-none" />

                <div className="flex flex-col gap-6">
                  {loadingSecret ? (
                    <div className="flex flex-col items-center py-12 gap-3 text-rose-300">
                      <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
                      <span className="text-xs font-semibold text-white/30 tracking-wider">Decrypting letter contents...</span>
                    </div>
                  ) : (
                    <>
                      {secret?.imageUrl && (
                        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-black/35 shadow-inner max-h-64">
                          <OptimizedImage
                            src={secret.imageUrl}
                            alt="Attached memory"
                            widthSize={600}
                            className="w-full object-cover aspect-video rounded-2xl animate-fade-in"
                          />
                        </div>
                      )}

                      {/* Letter content with blur-to-focus typography */}
                      <motion.div
                        initial={{ filter: "blur(12px)", opacity: 0 }}
                        animate={{ filter: "blur(0px)", opacity: 1 }}
                        transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
                        className="relative px-4 py-2"
                      >
                        {/* Retro romantic quotation marks */}
                        <Quote className="absolute -top-4 -left-2 h-8 w-8 text-rose-400/10 pointer-events-none" />
                        
                        <p className="text-base md:text-lg text-rose-100/90 leading-relaxed font-serif italic whitespace-pre-wrap tracking-wide text-center">
                          &ldquo;{secret?.message}&rdquo;
                        </p>
                      </motion.div>
                    </>
                  )}
                </div>
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                onClick={onClose}
                className="mt-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 px-6 py-3 text-sm font-semibold text-rose-300 transition"
              >
                Back to Vault list
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style jsx global>{`
        @keyframes float-heart {
          0% {
            transform: translateY(0) scale(0.8) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-110vh) scale(1.3) rotate(45deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// ==========================================
// 3.5. LAZY-LOADED OPENED CAPSULE CARD
// ==========================================
function OpenedMessageCard({
  msg,
  userNames,
}: {
  msg: FutureMessage;
  userNames: Record<string, string>;
}) {
  const { registerVerifiedUrls } = useAuth();
  const [secret, setSecret] = useState<{ message: string; imageUrl: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const fetchInProgress = useRef(false);

  useEffect(() => {
    if (secret || fetchInProgress.current) return;

    let active = true;
    setLoading(true);
    setError(null);
    fetchInProgress.current = true;

    const timeoutId = setTimeout(() => {
      if (active && loading) {
        setLoading(false);
        setError("Loading secret timed out. Please check your connection and try again.");
        fetchInProgress.current = false;
      }
    }, 8000);

    getFutureMessageSecret(msg.id)
      .then((sec) => {
        if (!active) return;
        clearTimeout(timeoutId);
        setSecret(sec);
        setLoading(false);
        fetchInProgress.current = false;
        if (sec?.imageUrl) {
          registerVerifiedUrls([sec.imageUrl]);
        }
      })
      .catch((err) => {
        if (!active) return;
        clearTimeout(timeoutId);
        console.error("Opened card load failed:", err);
        setError("Failed to decrypt letter. Check permissions.");
        setLoading(false);
        fetchInProgress.current = false;
      });

    return () => {
      active = false;
      clearTimeout(timeoutId);
      fetchInProgress.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msg.id, registerVerifiedUrls, retryCount]);

  const senderName = userNames[msg.senderId] || "Partner";
  const dateText = format(toSafeDate(msg.unlockAt) || new Date(), "PPP");

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#12091c]/80 p-6 flex justify-center items-center h-44">
        <Loader2 className="h-5 w-5 animate-spin text-rose-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6 flex flex-col justify-center items-center gap-3 min-h-44 text-center">
        <p className="text-xs text-red-400 font-medium">{error}</p>
        <button
          onClick={() => {
            if (isDebouncing) return;
            setIsDebouncing(true);
            setRetryCount((prev) => prev + 1);
            setTimeout(() => setIsDebouncing(false), 2000);
          }}
          disabled={isDebouncing}
          className="rounded-xl bg-red-500/20 border border-red-500/35 hover:bg-red-500/30 px-3.5 py-1.5 text-[10px] font-bold text-red-300 transition disabled:opacity-40"
        >
          {isDebouncing ? "Retrying..." : "Retry Decryption"}
        </button>
      </div>
    );
  }

  if (!secret) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/5 bg-[#12091c]/80 p-5 md:p-6 backdrop-blur-md text-left relative overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.2)] privacy-sensitive"
    >
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-rose-500/5 blur-[45px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />

      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
          From {senderName}
        </span>
        <span className="text-[10px] text-white/40 tracking-wider">
          Opened &bull; {dateText}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {secret.imageUrl && (
          <div className="relative overflow-hidden rounded-xl bg-black/40 border border-white/5 max-h-60">
            <OptimizedImage
              src={secret.imageUrl}
              alt="Attached memory"
              widthSize={600}
              className="w-full object-cover aspect-video rounded-xl transition-transform duration-700 group-hover:scale-103"
            />
          </div>
        )}
        
        {/* Accent typography revealed text */}
        <div className="relative rounded-xl border border-white/5 bg-white/5 px-4 py-3.5">
          <Quote className="absolute -top-1.5 -left-1.5 h-5 w-5 text-rose-300/10 pointer-events-none" />
          <p className="text-sm md:text-base text-rose-100/90 leading-relaxed font-serif italic whitespace-pre-wrap">
            &ldquo;{secret.message}&rdquo;
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// 4. MAIN VAULT DASHBOARD PAGE
// ==========================================
export default function VaultPage() {
  return (
    <AuthGuard>
      <VaultContent />
    </AuthGuard>
  );
}

function VaultSkeleton() {
  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/5 bg-white/5 p-5 animate-pulse h-28 flex flex-col justify-between"
        >
          <div className="w-1/4 h-2.5 bg-white/10 rounded" />
          <div className="w-1/2 h-3.5 bg-white/10 rounded" />
          <div className="w-1/3 h-2 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
}

function VaultContent() {
  const { user, profile } = useAuth();
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<FutureMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"locked" | "opened" | "write">("locked");
  const [activeUnlockMessage, setActiveUnlockMessage] = useState<FutureMessage | null>(null);

  // Write Message state
  const [formText, setFormText] = useState("");
  const [formUnlockDate, setFormUnlockDate] = useState("");
  const [formUnlockTime, setFormUnlockTime] = useState("12:00");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Saving states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch partner profile & subscribe to future messages
  useEffect(() => {
    if (!profile?.coupleId || !user) return;

    getPartnerProfile(profile.coupleId, user.uid).then(setPartner);

    const unsub = subscribeToFutureMessages(profile.coupleId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsub();
  }, [profile?.coupleId, user]);

  const userNames = useMemo(() => {
    const names: Record<string, string> = {};
    if (user && profile) names[user.uid] = profile.name;
    if (partner) names[partner.uid] = partner.name;
    return names;
  }, [user, profile, partner]);

  // Separate locked vs opened messages
  const lockedMessages = useMemo(() => {
    return messages.filter((m) => !m.opened);
  }, [messages]);

  const openedMessages = useMemo(() => {
    return messages.filter((m) => m.opened);
  }, [messages]);

  // Handle image pick
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit future capsule
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.coupleId || !user) return;
    if (!formText.trim()) {
      setErrorMsg("Please type a letter message first.");
      return;
    }
    if (!formUnlockDate) {
      setErrorMsg("Please select an unlock date.");
      return;
    }

    const unlockDateTime = new Date(`${formUnlockDate}T${formUnlockTime}`);
    if (unlockDateTime.getTime() <= Date.now()) {
      setErrorMsg("The unlock date must be in the future!");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      await saveFutureMessage(
        profile.coupleId,
        user.uid,
        formText.trim(),
        imageUrl,
        unlockDateTime
      );

      // Clean form fields
      setFormText("");
      setFormUnlockDate("");
      setFormUnlockTime("12:00");
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab("locked");
      }, 1500);

    } catch (err) {
      console.error("Save message failed:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to store future letter. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Triggered when user opens a lock for the first time
  const handleCompleteUnlock = async () => {
    if (!activeUnlockMessage) return;
    try {
      await markFutureMessageAsOpened(activeUnlockMessage.id);
    } catch (err) {
      console.error("Failed to mark message as opened in DB:", err);
    }
  };

  return (
    <div className="relative min-h-screen pb-24 md:pb-8 md:pt-20 bg-[#07030c] text-white">
      <Navbar />

      {/* Floating Ambient background particles (Time of day adaptive) */}
      <AmbientParticles />

      <div className="relative mx-auto max-w-4xl px-4 py-8 z-10">
        
        {/* Header Title Block */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20"
          >
            <Mail className="h-6 w-6" />
          </motion.div>
          
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Future Messages Vault
          </h1>
          <p className="mt-2 text-sm text-white/50 max-w-md mx-auto">
            Write sweet letters, lock them inside time capsules, and set a date in the future for your partner to crack them open.
          </p>
        </div>

        {/* Dynamic Glassmorphic Navigation Tabs */}
        <div className="flex border border-white/5 bg-[#120a1c]/60 rounded-xl p-1 mb-8 max-w-md mx-auto backdrop-blur-md">
          <button
            onClick={() => setActiveTab("locked")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "locked"
                ? "bg-rose-500/25 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.1)] border border-rose-500/20"
                : "text-white/40 hover:text-white/80"
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            Locked ({lockedMessages.length})
          </button>
          <button
            onClick={() => setActiveTab("opened")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "opened"
                ? "bg-rose-500/25 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.1)] border border-rose-500/20"
                : "text-white/40 hover:text-white/80"
            }`}
          >
            <Unlock className="h-3.5 w-3.5" />
            Opened ({openedMessages.length})
          </button>
          <button
            onClick={() => setActiveTab("write")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "write"
                ? "bg-rose-500/25 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.1)] border border-rose-500/20"
                : "text-white/40 hover:text-white/80"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            Lock Capsule
          </button>
        </div>

        {/* Tab content displays (Lazy rendered as required) */}
        <div>
          <AnimatePresence mode="wait">
            
            {/* TABS 1: Locked Vault */}
            {activeTab === "locked" && (
              <motion.div
                key="locked-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 max-w-xl mx-auto"
              >
                {loading ? (
                  <VaultSkeleton />
                ) : lockedMessages.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-12 text-center backdrop-blur-md animate-fade-in">
                    <Mail className="mx-auto h-8 w-8 text-white/20 mb-3 animate-bounce" />
                    <p className="text-sm font-bold text-white/80">Write your first future letter. 💌</p>
                    <p className="mt-1 text-xs text-white/40">Surprise your partner later.</p>
                    <button
                      onClick={() => setActiveTab("write")}
                      className="mt-4 text-xs font-bold text-rose-400 hover:text-rose-300 transition"
                    >
                      Write your first capsule message &rarr;
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {lockedMessages.map((msg) => (
                      <LockedMessageCard
                        key={msg.id}
                        message={msg}
                        userNames={userNames}
                        onReveal={(m) => setActiveUnlockMessage(m)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* TABS 2: Opened Letters */}
            {activeTab === "opened" && (
              <motion.div
                key="opened-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 max-w-2xl mx-auto"
              >
                {loading ? (
                  <VaultSkeleton />
                ) : openedMessages.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-12 text-center backdrop-blur-md animate-fade-in">
                    <Unlock className="mx-auto h-8 w-8 text-white/20 mb-3" />
                    <p className="text-sm font-bold text-white/80">No unlocked letters found.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {openedMessages.map((msg) => (
                      <OpenedMessageCard
                        key={msg.id}
                        msg={msg}
                        userNames={userNames}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* TABS 3: Lock a Message Form */}
            {activeTab === "write" && (
              <motion.div
                key="write-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-md mx-auto"
              >
                <div className="rounded-2xl border border-white/10 bg-[#12091c]/80 p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
                  
                  {/* Floating heart feedback for instant success */}
                  <AnimatePresence>
                    {saveSuccess && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 0 }}
                        animate={{ opacity: 1, scale: 1.5, y: -30 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/85 z-20 rounded-2xl"
                      >
                        <div className="text-center">
                          <Heart className="h-14 w-14 text-rose-500 fill-current mx-auto animate-bounce" />
                          <p className="text-sm font-bold text-white tracking-wider mt-3">Capsule Locked Successfully! ❤️</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <h3 className="text-lg font-bold text-white mb-1">Create a Time Capsule</h3>
                  <p className="text-xs text-white/40 mb-6">Your partner won&apos;t be able to open this until the scheduled time.</p>

                  <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                        Your Love Message
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Write something emotional, nostalgic, or romantic..."
                        value={formText}
                        onChange={(e) => setFormText(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder-white/20 focus:border-rose-500/50 focus:outline-none focus:ring-0 transition"
                      />
                    </div>

                    {/* Image Attachment */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                        Attach a Photo (Optional)
                      </label>
                      
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border border-dashed border-white/20 hover:border-rose-500/40 hover:bg-rose-500/5 transition text-white/40 hover:text-rose-300"
                        >
                          <ImageIcon className="h-5 w-5 mb-1" />
                          <span className="text-[9px] font-bold">Pick Image</span>
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />

                        {imagePreview && (
                          <div className="relative h-20 w-28 rounded-xl border border-white/10 overflow-hidden group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                              }}
                              className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-red-400 border border-white/5 hover:bg-black transition"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Unlock time settings */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                          Unlock Date
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            min={format(new Date(), "yyyy-MM-dd")}
                            value={formUnlockDate}
                            onChange={(e) => setFormUnlockDate(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-2.5 text-xs text-white focus:border-rose-500/50 focus:outline-none transition [color-scheme:dark]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                          Unlock Time
                        </label>
                        <input
                          type="time"
                          value={formUnlockTime}
                          onChange={(e) => setFormUnlockTime(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-2.5 text-xs text-white focus:border-rose-500/50 focus:outline-none transition [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    {errorMsg && (
                      <p className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 text-center">
                        {errorMsg}
                      </p>
                    )}

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 hover:opacity-90 active:scale-98 disabled:opacity-40 transition"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin" />
                          Locking and Uploading...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Lock Capsule ❤️
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

      {/* Cinematic unlock sequence overlay */}
      <AnimatePresence>
        {activeUnlockMessage && (
          <CinematicUnlockSequence
            message={activeUnlockMessage}
            userNames={userNames}
            onComplete={handleCompleteUnlock}
            onClose={() => {
              setActiveUnlockMessage(null);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
