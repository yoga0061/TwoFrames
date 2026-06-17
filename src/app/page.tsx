"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Camera, Sparkles, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

const features = [
  {
    icon: Camera,
    title: "One Memory Daily",
    desc: "Capture a single precious moment each day, building your story one frame at a time.",
  },
  {
    icon: Sparkles,
    title: "Mood Tracking",
    desc: "Share how you feel every 5 hours. Stay emotionally connected, even apart.",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    desc: "Your memories are visible only to your partner. A space that's truly yours.",
  },
];

export default function LandingPage() {
  const { user, profile, loading, profileError } = useAuth();
  const pathname = usePathname();
  const authLoading = loading;

  console.log("LANDING PAGE RENDERED", {
    authLoading,
    user: user ? user.uid : null,
    profile: profile ? "Exists" : null,
    loading,
    pathname,
    profileError,
  });
  return (
    <div className="relative min-h-screen overflow-hidden">

      <div className="relative mx-auto max-w-5xl px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20"
          >
            <Heart className="h-8 w-8 text-rose-400" fill="currentColor" />
          </motion.div>

          <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
            TwoFrames
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white/50">
            A private space where couples share one picture per day and track
            their emotions together.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-8 py-3.5 font-medium text-white shadow-lg shadow-rose-500/25 transition hover:opacity-90"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 font-medium text-white/80 backdrop-blur-sm transition hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </motion.div>

        <div className="mt-24 grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="mb-4 inline-flex rounded-xl bg-rose-500/10 p-3">
                <Icon className="h-5 w-5 text-rose-400" />
              </div>
              <h3 className="font-semibold text-white/90">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/40">{desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-20 text-center text-xs text-white/20"
        >
          Built with love. One frame at a time.
        </motion.p>
      </div>
    </div>
  );
}
