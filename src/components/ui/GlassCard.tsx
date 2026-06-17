"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function GlassCard({ children, className = "", delay = 0 }: GlassCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Map mouse coordinate relative to card element to rotation angle
  // Tilt up to 12 degrees for visible premium feel
  const rotateX = useTransform(y, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-12, 12]);

  // Smooth out the movement using spring physics
  const springConfig = { damping: 25, stiffness: 220, mass: 0.6 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    
    // Calculate mouse position relative to the element (from -0.5 to 0.5)
    const relativeX = (e.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (e.clientY - rect.top) / rect.height - 0.5;
    
    x.set(relativeX);
    y.set(relativeY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="perspective-[1000px] w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          borderColor: [
            "rgba(255, 255, 255, 0.1)",
            "rgba(244, 63, 94, 0.15)",
            "rgba(255, 255, 255, 0.1)"
          ],
          boxShadow: [
            "0 10px 30px -15px rgba(0, 0, 0, 0.3)",
            "0 15px 30px -10px rgba(244, 63, 94, 0.05)",
            "0 10px 30px -15px rgba(0, 0, 0, 0.3)"
          ]
        }}
        transition={{
          y: { duration: 0.5, delay },
          opacity: { duration: 0.5, delay },
          borderColor: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          boxShadow: { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }}
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`rounded-2xl border bg-white/5 p-6 backdrop-blur-xl transition-colors duration-300 hover:border-white/20 cursor-default ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-20 bg-[#0f0a1a]" />
  );
}

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-5 w-5", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className="flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizes[size]} rounded-full border-2 border-white/20 border-t-rose-400`}
      />
    </div>
  );
}

export function PageLoader({ message = "Loading your memories..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <GradientBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-white/50">{message}</p>
      </motion.div>
    </div>
  );
}
