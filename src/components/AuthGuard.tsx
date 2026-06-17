"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PageLoader } from "@/components/ui/GlassCard";

function redirectAuthenticated(
  user: ReturnType<typeof useAuth>["user"],
  profile: ReturnType<typeof useAuth>["profile"],
  router: ReturnType<typeof useRouter>
) {
  if (!user) return;
  if (!profile) {
    router.replace("/complete-profile");
  } else if (profile.coupleId) {
    router.replace("/dashboard");
  } else {
    router.replace("/connect");
  }
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileError } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const authLoading = loading;

  console.log("AUTH GUARD RENDERED", {
    authLoading,
    user: user ? user.uid : null,
    profile: profile ? "Exists" : null,
    loading,
    pathname,
    profileError,
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!profile) {
      router.replace("/complete-profile");
      return;
    }
    if (!profile.coupleId) {
      router.replace("/connect");
    }
  }, [user, profile, loading, router]);

  if (loading || !user || !profile?.coupleId) {
    return <PageLoader />;
  }

  return <>{children}</>;
}

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileError } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const authLoading = loading;

  console.log("GUEST GUARD RENDERED", {
    authLoading,
    user: user ? user.uid : null,
    profile: profile ? "Exists" : null,
    loading,
    pathname,
    profileError,
  });

  useEffect(() => {
    if (loading || !user) return;
    redirectAuthenticated(user, profile, router);
  }, [user, profile, loading, router]);

  if (loading || user) {
    return <PageLoader />;
  }

  return <>{children}</>;
}

export function ConnectGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, refreshProfile, logout, profileError } = useAuth();
  const router = useRouter();
  const [retries, setRetries] = useState(0);
  const pathname = usePathname();
  const authLoading = loading;

  console.log("CONNECT GUARD RENDERED", {
    authLoading,
    user: user ? user.uid : null,
    profile: profile ? "Exists" : null,
    loading,
    pathname,
    profileError,
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!profile) {
      router.replace("/complete-profile");
      return;
    }
    if (profile.coupleId) {
      router.replace("/dashboard");
      return;
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (!loading && user && !profile && retries < 3) {
      refreshProfile().then(() => setRetries((r) => r + 1));
    }
  }, [loading, user, profile, refreshProfile, retries]);

  if (loading || !user || profile?.coupleId) {
    return <PageLoader />;
  }

  if (!profile) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl">
          <p className="text-lg font-medium text-white">Profile not found</p>
          <p className="mt-2 text-sm text-white/50">
            Complete your profile to continue.
          </p>
          <button
            onClick={() => router.replace("/complete-profile")}
            className="mt-4 w-full rounded-xl bg-rose-500/80 py-2.5 text-sm text-white hover:bg-rose-500"
          >
            Complete Profile
          </button>
          <button
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="mt-2 w-full rounded-xl py-2.5 text-sm text-rose-400 hover:text-rose-300"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function CompleteProfileGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, profileError } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const authLoading = loading;

  console.log("COMPLETE PROFILE GUARD RENDERED", {
    authLoading,
    user: user ? user.uid : null,
    profile: profile ? "Exists" : null,
    loading,
    pathname,
    profileError,
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (profile?.coupleId) {
      router.replace("/dashboard");
      return;
    }
    if (profile && !profile.coupleId) {
      router.replace("/connect");
    }
  }, [user, profile, loading, router]);

  if (loading || !user || profile) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
