"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Clock, Check, RotateCw, VideoOff, X, Heart } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { LoadingSpinner } from "./ui/GlassCard";
import { OptimizedImage } from "./ui/OptimizedImage";
import { uploadDailyMemory, getTodayMemory } from "@/lib/firestore";
import { formatCountdown, HOURS_24_MS, toSafeMillis } from "@/lib/utils";
import type { DailyMemory } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface DailyUploadCardProps {
  userId: string;
  coupleId: string;
}

export function DailyUploadCard({ userId, coupleId }: DailyUploadCardProps) {
  const { registerVerifiedUrls } = useAuth();
  const [todayMemory, setTodayMemory] = useState<DailyMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [caption, setCaption] = useState("");
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  
  interface Particle {
    id: number;
    xStart: string;
    scale: number;
    duration: number;
  }

  const [particlesConfig] = useState<Particle[]>(() => {
    return Array.from({ length: 10 }).map((_, i) => ({
      id: i,
      xStart: `${Math.random() * 100}%`,
      scale: Math.random() * 0.5 + 0.5,
      duration: Math.random() * 2 + 1.5,
    }));
  });
  
  // Camera specific states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (mode = facingMode) => {
    setCameraError("");
    setError("");
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 960 }, // 4:3 aspect ratio is ideal
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Could not access camera. Please make sure camera permissions are enabled.");
    }
  };

  useEffect(() => {
    getTodayMemory(userId, coupleId).then((m) => {
      setTodayMemory(m);
      setLoading(false);
      if (m?.imageUrl) {
        registerVerifiedUrls([m.imageUrl]);
      }
      if (m) {
        const elapsed = Date.now() - toSafeMillis(m.createdAt);
        setCountdown(Math.max(0, HOURS_24_MS - elapsed));
      }
    });

    // Detect camera devices
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          const videoDevices = devices.filter((d) => d.kind === "videoinput");
          setHasMultipleCameras(videoDevices.length > 1);
        })
        .catch((err) => {
          console.warn("Could not enumerate camera devices:", err);
        });
    }

    return () => {
      stopCamera();
    };
  }, [userId, coupleId, registerVerifiedUrls]);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleStartCamera = () => {
    setCameraActive(true);
    setError("");
    setCameraError("");
    // Start camera stream after state update ensures video element is rendered
    setTimeout(() => startCamera(facingMode), 50);
  };

  const handleCancelCamera = () => {
    setCameraActive(false);
    setCameraError("");
    stopCamera();
  };

  const handleSwitchCamera = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;

    const canvas = document.createElement("canvas");
    
    // Scale down image dimensions if they exceed 1200px
    const maxDimension = 1200;
    let width = video.videoWidth || 640;
    let height = video.videoHeight || 480;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror horizontal display if front-facing camera is used
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Failed to capture image.");
          return;
        }
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
        setCameraActive(false);
        stopCamera();
      },
      "image/jpeg",
      0.75 // 0.75 quality provides excellent compression and retains great visual fidelity
    );
  };

  const handleRetake = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setSelectedFile(null);
    setCameraActive(true);
    setTimeout(() => startCamera(facingMode), 50);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const memory = await uploadDailyMemory(userId, coupleId, selectedFile, caption, note, controller.signal);
      
      // Trigger romantic success transition
      setShowSuccessOverlay(true);
      setTimeout(() => {
        setTodayMemory(memory);
        registerVerifiedUrls([memory.imageUrl]);
        setPreview(null);
        setSelectedFile(null);
        setCaption("");
        setNote("");
        setCountdown(HOURS_24_MS);
      }, 500);

      setTimeout(() => {
        setShowSuccessOverlay(false);
      }, 2000);

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("Upload cancelled.");
        return;
      }
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <GlassCard>
        <LoadingSpinner />
      </GlassCard>
    );
  }

  const canUpload = !todayMemory && countdown <= 0;

  return (
    <GlassCard delay={0.1} className="relative overflow-hidden">
      {/* Upload Anticipation & Success Overlays */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0f0a1a]/90 backdrop-blur-md z-40 flex flex-col items-center justify-center rounded-2xl"
          >
            {/* Ambient breathing glow background */}
            <div className="absolute inset-0 bg-radial-gradient from-rose-500/10 to-transparent pointer-events-none animate-pulse" />
            
            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {particlesConfig.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ y: "110%", x: p.xStart, scale: p.scale, opacity: 0.8 }}
                  animate={{
                    y: "-10%",
                    opacity: [0.8, 0.6, 0],
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                  className="absolute text-rose-400 text-xs"
                >
                  ✨
                </motion.div>
              ))}
            </div>
            
            {/* Heartbeat pulse in the center */}
            <motion.div
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
              className="text-rose-500 filter drop-shadow-[0_0_12px_rgba(244,63,94,0.6)] mb-4"
            >
              <Heart className="h-12 w-12 fill-current" />
            </motion.div>
            
            <p className="text-sm font-semibold text-rose-300 animate-pulse tracking-wide">
              Sharing your memory...
            </p>
            <div className="mt-2 text-[10px] text-white/40 uppercase tracking-widest font-bold">
              Creating forever
            </div>
            
            <button
              type="button"
              onClick={handleCancelUpload}
              className="mt-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white px-4 py-2 text-xs text-white/70 font-semibold transition"
            >
              Cancel Share
            </button>
          </motion.div>
        )}

        {showSuccessOverlay && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 rounded-full bg-rose-500/90 px-4.5 py-2 text-xs font-extrabold text-white shadow-lg backdrop-blur-sm pointer-events-none"
          >
            <span>❤️</span>
            <span>Memory Saved</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/90">Today&apos;s Memory</h2>
        {todayMemory ? (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300 animate-pulse">
            <Check className="h-3.5 w-3.5" />
            Uploaded
          </span>
        ) : countdown > 0 ? (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-300">
            <Clock className="h-3.5 w-3.5" />
            {formatCountdown(countdown)}
          </span>
        ) : null}
      </div>

      <AnimatePresence mode="wait">
        {todayMemory ? (
          <motion.div
            key="uploaded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-xl privacy-sensitive"
          >
            <OptimizedImage
              src={todayMemory.imageUrl}
              alt="Today's memory"
              widthSize={800}
              className="aspect-[4/3] w-full object-cover rounded-xl"
            />
            {todayMemory.caption && (
              <p className="mt-3 text-sm text-white/60 italic">&ldquo;{todayMemory.caption}&rdquo;</p>
            )}
          </motion.div>
        ) : canUpload ? (
          <motion.div key="camera-interface" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {cameraActive ? (
              <div className="space-y-4">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
                  {cameraError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                      <VideoOff className="mb-3 h-10 w-10 text-rose-400" />
                      <p className="text-sm font-medium">{cameraError}</p>
                      <button
                        onClick={() => startCamera(facingMode)}
                        className="mt-4 rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold hover:bg-rose-600 transition"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`h-full w-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
                      />
                      <div className="absolute top-3 right-3 flex gap-2">
                        {hasMultipleCameras && (
                          <button
                            onClick={handleSwitchCamera}
                            title="Switch Camera"
                            className="rounded-full bg-black/60 p-2 text-white backdrop-blur-md hover:bg-black/80 transition"
                          >
                            <RotateCw className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={handleCancelCamera}
                          title="Close Camera"
                          className="rounded-full bg-black/60 p-2 text-white backdrop-blur-md hover:bg-black/80 transition"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {!cameraError && (
                  <div className="flex items-center justify-center gap-4 py-2">
                    <button
                      onClick={handleCancelCamera}
                      className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCapture}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 border-4 border-white/20 text-white shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 transition"
                    >
                      <Camera className="h-6 w-6" />
                    </button>
                    <div className="w-[84px]" /> {/* Spacer to balance cancel button */}
                  </div>
                )}
              </div>
            ) : preview ? (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Preview" className="aspect-[4/3] w-full object-cover rounded-xl" />
                  <button
                    onClick={handleRetake}
                    className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-md hover:bg-black/80 transition"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    Retake
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Add a caption (optional)..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-rose-400/50"
                />
                <input
                  type="text"
                  placeholder="Daily Note (optional, max 150 chars)..."
                  value={note}
                  maxLength={150}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-rose-400/50"
                />
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 py-3.5 font-medium text-white shadow-lg shadow-rose-500/25 transition hover:opacity-90 disabled:opacity-50"
                >
                  {uploading ? <LoadingSpinner size="sm" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Sharing Memory..." : "Share Memory"}
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartCamera}
                className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-white/10 py-12 transition hover:border-rose-400/30 hover:bg-white/5 group"
              >
                <div className="rounded-full bg-rose-500/20 p-4 group-hover:scale-110 transition duration-300">
                  <Camera className="h-8 w-8 text-rose-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-white/80">Capture today&apos;s moment</p>
                  <p className="mt-1 text-xs text-white/40">Camera capture only • One memory per day</p>
                </div>
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-8 text-center"
          >
            <Clock className="mb-3 h-10 w-10 text-white/20" />
            <p className="text-sm text-white/50">Next upload available in</p>
            <p className="mt-1 text-xl font-semibold text-rose-300">
              {formatCountdown(countdown)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </GlassCard>
  );
}
