"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Home, Images, Settings, Mail } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/vault", label: "Vault", icon: Mail },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0f0a1a]/80 backdrop-blur-xl md:bottom-auto md:top-0 md:border-b md:border-t-0">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="hidden items-center gap-2 md:flex">
          <Heart className="h-5 w-5 text-rose-400" fill="currentColor" />
          <span className="font-semibold text-white/90">TwoFrames</span>
        </Link>

        <div className="flex w-full items-center justify-around md:w-auto md:gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className="relative px-4 py-2">
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-white/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative flex flex-col items-center gap-1 md:flex-row">
                  <Icon
                    className={`h-5 w-5 ${active ? "text-rose-400" : "text-white/50"}`}
                  />
                  <span
                    className={`text-xs md:text-sm ${active ? "text-rose-300" : "text-white/50"}`}
                  >
                    {label}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
