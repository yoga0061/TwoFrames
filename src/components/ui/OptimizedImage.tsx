"use client";

import { useState, useMemo } from "react";
import { getOptimizedCloudinaryUrl } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  widthSize?: number;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  widthSize,
  className = "",
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);

  const optimizedUrl = useMemo(
    () => getOptimizedCloudinaryUrl(src, widthSize),
    [src, widthSize]
  );

  return (
    <div className={`relative overflow-hidden bg-white/5 ${className}`}>
      {/* Soft pulsating shimmer placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-white/10 animate-pulse filter blur-md" />
      )}

      {/* Transparent Protection Layer (Blocks inspector, right-clicks, and dragging) */}
      <div
        className="absolute inset-0 z-10 bg-transparent select-none cursor-default"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={optimizedUrl}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-all duration-700 ease-out select-none pointer-events-none ${
          loaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-98 blur-[2px]"
        }`}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        {...props}
      />
    </div>
  );
}

