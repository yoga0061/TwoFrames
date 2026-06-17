"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Heart, Flame, Image as ImageIcon, Music } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { Navbar } from "@/components/Navbar";
import { RelationshipCounter } from "@/components/RelationshipCounter";
import { AnniversaryCountdown } from "@/components/AnniversaryCountdown";
import { DailyUploadCard } from "@/components/DailyUploadCard";
import { MoodTracker } from "@/components/MoodTracker";
import { RelationshipTimeline } from "@/components/RelationshipTimeline";
import { MemoryGallery } from "@/components/MemoryGallery";

// New romantic engagement components
import { OnThisDay } from "@/components/OnThisDay";
import { MoodHeatmap } from "@/components/MoodHeatmap";
import { MilestoneCelebration } from "@/components/MilestoneCelebration";
import { RelationshipEnergy } from "@/components/RelationshipEnergy";
import { WelcomeBoom } from "@/components/WelcomeBoom";
import { SoundtrackWidget } from "@/components/SoundtrackWidget";

import { useAuth } from "@/context/AuthContext";
import {
  getPartnerProfile,
  subscribeToMemories,
  subscribeToMoods,
  subscribeToFutureMessages,
  updateUserProfile,
  subscribeToCouple,
  subscribeToPlaylist,
  toggleMemoryReaction,
} from "@/lib/firestore";
import type { Couple, DailyMemory, MoodEntry, UserProfile, FutureMessage, CouplePlaylist } from "@/types";
import { getPreciseRelationshipDuration, calculateStreak } from "@/lib/utils";



export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user, profile, refreshProfile, registerVerifiedUrls } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [memories, setMemories] = useState<DailyMemory[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [futureMessages, setFutureMessages] = useState<FutureMessage[]>([]);
  const [playlist, setPlaylist] = useState<CouplePlaylist | null>(null);
  const [durationText, setDurationText] = useState("");

  const showOnboarding = profile?.onboarded === false;

  const handleOnboardingComplete = async () => {
    if (!user) return;
    try {
      await updateUserProfile(user.uid, { onboarded: true, coupleId: profile?.coupleId });
      await refreshProfile();
    } catch (err) {
      console.error("Error saving onboarding completion:", err);
    }
  };

  useEffect(() => {
    if (memories.length > 0) {
      registerVerifiedUrls(memories.map((m) => m.imageUrl));
    }
  }, [memories, registerVerifiedUrls]);

  useEffect(() => {
    if (!couple?.relationshipStartDate) return;
    const startDate = couple.relationshipStartDate.toDate();
    
    const updateDuration = () => {
      const dur = getPreciseRelationshipDuration(startDate);
      const parts = [];
      if (dur.years > 0) parts.push(`${dur.years} Year${dur.years > 1 ? "s" : ""}`);
      if (dur.months > 0) parts.push(`${dur.months} Month${dur.months > 1 ? "s" : ""}`);
      parts.push(`${dur.days} Day${dur.days > 1 ? "s" : ""}`);
      setDurationText(parts.join(" • "));
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [couple?.relationshipStartDate]);

  useEffect(() => {
    if (!profile?.coupleId || !user) return;

    getPartnerProfile(profile.coupleId, user.uid).then(setPartner);

    const unsubCouple = subscribeToCouple(profile.coupleId, setCouple);
    const unsubMemories = subscribeToMemories(profile.coupleId, setMemories, 50);
    const unsubMoods = subscribeToMoods(profile.coupleId, setMoods);
    const unsubFuture = subscribeToFutureMessages(profile.coupleId, setFutureMessages);
    const unsubPlaylist = subscribeToPlaylist(profile.coupleId, setPlaylist);

    return () => {
      unsubCouple();
      unsubMemories();
      unsubMoods();
      unsubFuture();
      unsubPlaylist();
    };
  }, [profile?.coupleId, user]);


  const handleToggleReaction = async (memoryId: string, emoji: string) => {
    if (!user) return;
    const memory = memories.find((m) => m.id === memoryId);
    if (!memory) return;

    const existingReactions = memory.reactions || {};
    const currentReaction = existingReactions[user.uid];
    const newReaction = currentReaction === emoji ? null : emoji;

    try {
      await toggleMemoryReaction(memoryId, user.uid, newReaction);
      setMemories((prev) =>
        prev.map((m) => {
          if (m.id === memoryId) {
            const nextReactions = { ...m.reactions };
            if (newReaction) {
              nextReactions[user.uid] = newReaction;
            } else {
              delete nextReactions[user.uid];
            }
            return { ...m, reactions: nextReactions };
          }
          return m;
        })
      );
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
    }
  };

  if (!user || !profile?.coupleId || !couple) {
    return (
      <div className="relative min-h-screen pb-24 md:pb-8 md:pt-20 flex flex-col items-center justify-center bg-[#07030c] text-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
          <p className="text-xs text-white/40 font-semibold tracking-wider uppercase animate-pulse">
            Connecting to your space...
          </p>
        </div>
      </div>
    );
  }

  const userNames: Record<string, string> = {
    [user.uid]: profile.name,
  };
  if (partner) userNames[partner.uid] = partner.name;

  const partnerLatestMood =
    moods.find((m) => m.userId !== user.uid) ?? null;
  const myLatestMood =
    moods.find((m) => m.userId === user.uid) ?? null;

  const startDate = couple.relationshipStartDate.toDate();



  return (
    <div className="relative min-h-screen pb-24 md:pb-8 md:pt-20">
      <Navbar />

      <AnimatePresence>
        {showOnboarding && (
          <WelcomeBoom onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      <div className="relative mx-auto max-w-5xl px-4 py-8">
        {/* Upgraded Dashboard Header Centerpiece */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-gradient-to-r from-[#1b082c]/85 via-[#10051b]/90 to-[#190626]/85 rounded-3xl border border-white/5 p-6 md:p-8 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
        >
          {/* Subtle neon glowing accent in background */}
          <div className="absolute top-0 right-0 h-44 w-44 rounded-full bg-rose-500/5 blur-[40px] pointer-events-none" />
          
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-black text-white md:text-3xl tracking-tight flex items-center gap-2">
                Hello, {profile.name} <span className="animate-pulse">👋</span>
              </h1>
              {partner && (
                <p className="mt-1 text-xs text-white/40 font-bold uppercase tracking-wider">
                  Connected with <span className="text-rose-300/80">{partner.name}</span>
                </p>
              )}
            </div>

            {/* Live together-for timer */}
            <div className="bg-white/2 border border-white/5 rounded-2xl px-5 py-3.5 shadow-inner">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-rose-400 flex items-center gap-1.5">
                <Heart className="h-3 w-3 fill-current text-rose-500 animate-pulse" />
                Together For
              </span>
              <h2 className="text-lg font-black text-white mt-1 select-none tracking-tight font-mono">
                {durationText || "Loading duration..."}
              </h2>
            </div>
          </div>
          
          {/* Stats Grid Column */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            {/* Streak Card */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center min-w-[90px] shadow-sm relative group overflow-hidden">
              <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition duration-300" />
              <Flame className="h-5 w-5 text-orange-400 fill-orange-400/20 mb-1 animate-pulse" />
              <span className="text-sm font-extrabold text-white block">
                {calculateStreak(memories, couple.memberIds).count} Days
              </span>
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider mt-0.5">Streak</span>
            </div>

            {/* Memories Card */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center min-w-[90px] shadow-sm relative group overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition duration-300" />
              <ImageIcon className="h-5 w-5 text-blue-400 mb-1" />
              <span className="text-sm font-extrabold text-white block">
                {memories.length}
              </span>
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider mt-0.5">Memories</span>
            </div>

            {/* Songs Card */}
            <div className="bg-white/3 border border-white/5 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center min-w-[90px] shadow-sm relative group overflow-hidden">
              <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition duration-300" />
              <Music className="h-5 w-5 text-purple-400 mb-1" />
              <span className="text-sm font-extrabold text-white block">
                {playlist?.songs.length || 0}
              </span>
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider mt-0.5">Songs</span>
            </div>
          </div>
        </motion.div>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Main Content Column (7 out of 12 columns) */}
          <div className="lg:col-span-7 space-y-6">
            <DailyUploadCard userId={user.uid} coupleId={profile.coupleId} />
            
            <MoodTracker
              userId={user.uid}
              coupleId={profile.coupleId}
              partnerName={partner?.name || "Partner"}
              myMood={myLatestMood}
              partnerMood={partnerLatestMood}
              memories={memories}
              futureMessages={futureMessages}
              moods={moods}
              relationshipStartDate={startDate}
            />

            
            {/* Recent Memories Section */}
            <div>
              <h2 className="mb-4 text-lg font-bold text-white/90 flex items-center gap-2">
                <span>Recent Memories</span>
              </h2>
              <MemoryGallery
                memories={memories.slice(0, 8)}
                userNames={userNames}
                userId={user.uid}
                onToggleReaction={handleToggleReaction}
              />
            </div>

            {/* Midnight Recap Timeline */}
            <RelationshipTimeline
              memories={memories}
              moods={moods}
              userNames={userNames}
              futureMessages={futureMessages}
            />
          </div>

          {/* Right Sidebar Column (5 out of 12 columns) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Emotional Centerpiece Counter */}
            <RelationshipCounter startDate={startDate} />
            
            {/* Our Soundtrack ❤️ Widget */}
            <SoundtrackWidget couple={couple} />
            
            {/* Relationship Energy Progress Score */}
            <RelationshipEnergy
              memories={memories}
              moods={moods}
              memberIds={couple.memberIds}
            />
            
            {/* Anniversary countdown */}
            <AnniversaryCountdown startDate={startDate} />
            
            {/* On This Day Retrospective Card */}
            <OnThisDay memories={memories} userNames={userNames} />
            
            {/* 14-day Mood Harmony Grid */}
            <MoodHeatmap
              moods={moods}
              memberIds={couple.memberIds}
              userNames={userNames}
            />
            
            {/* Milestone Celebration Tracker */}
            <MilestoneCelebration startDate={startDate} />
          </div>
          
        </div>
      </div>
    </div>
  );
}
