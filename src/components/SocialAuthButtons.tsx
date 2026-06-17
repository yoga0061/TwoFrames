"use client";

import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/GlassCard";

interface SocialAuthButtonsProps {
  onGoogle: () => Promise<void>;
  onApple: () => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export function SocialAuthButtons({
  onGoogle,
  onApple,
  loading = false,
  disabled = false,
}: SocialAuthButtonsProps) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onGoogle}
        disabled={loading || disabled}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10 disabled:opacity-50"
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <GoogleIcon />
            Continue with Google
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onApple}
        disabled={loading || disabled}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/40 py-3 text-sm font-medium text-white transition hover:bg-black/60 disabled:opacity-50"
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <AppleIcon />
            Continue with Apple
          </>
        )}
      </button>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-transparent px-3 text-white/40">or continue with email</span>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export function LogoutToggle({ onLogout }: { onLogout: () => void | Promise<void> }) {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleToggle = async (checked: boolean) => {
    if (!checked || busy) {
      setEnabled(false);
      return;
    }
    setEnabled(true);
    setBusy(true);
    try {
      await onLogout();
    } catch {
      setEnabled(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
      <div>
        <p className="font-medium text-white/90">Sign Out</p>
        <p className="text-xs text-white/40">Toggle to log out of your account</p>
      </div>
      <ToggleSwitch checked={enabled} disabled={busy} onChange={handleToggle} />
    </div>
  );
}

function ToggleSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition ${
        checked ? "bg-red-500/80" : "bg-white/10"
      } ${disabled ? "opacity-50" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}
