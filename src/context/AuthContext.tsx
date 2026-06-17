"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { createUserProfile, getUserProfile } from "@/lib/firestore";
import type { UserProfile } from "@/types";
import { usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileError: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  signup: (
    email: string,
    password: string,
    profileData: {
      name: string;
      gender: string;
      relationshipStartDate: Date;
    }
  ) => Promise<void>;
  completeProfile: (profileData: {
    name: string;
    gender: string;
    relationshipStartDate: Date;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  registerVerifiedUrls: (urls: string[]) => void;
  isUrlVerified: (url: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case "auth/popup-closed-by-user":
      return "Sign in was cancelled";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled. Enable it in Firebase Console.";
    default:
      return error instanceof Error ? error.message : "Authentication failed";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const signupInProgress = useRef(false);

  const pathname = usePathname();
  console.log("[AuthContext] Render logs:", {
    loading,
    user: user ? user.uid : null,
    profile: profile ? "Exists" : null,
    pathname,
    profileError,
  });

  const fetchProfile = async (uid: string) => {
    setProfileError(null);
    try {
      const p = await getUserProfile(uid);
      setProfile(p);
      return p;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setProfileError(msg);
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && !signupInProgress.current) {
        await fetchProfile(u.uid);
      } else if (!u) {
        setProfile(null);
      }
      if (!signupInProgress.current) {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(getFirebaseAuth(), provider);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const loginWithApple = async () => {
    try {
      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");
      await signInWithPopup(getFirebaseAuth(), provider);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const signup = async (
    email: string,
    password: string,
    profileData: {
      name: string;
      gender: string;
      relationshipStartDate: Date;
    }
  ) => {
    signupInProgress.current = true;
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      const newProfile = await createUserProfile(cred.user.uid, { ...profileData, email });
      setUser(cred.user);
      setProfile(newProfile);
    } finally {
      signupInProgress.current = false;
      setLoading(false);
    }
  };

  const completeProfile = async (profileData: {
    name: string;
    gender: string;
    relationshipStartDate: Date;
  }) => {
    if (!user) throw new Error("Not authenticated");
    signupInProgress.current = true;
    try {
      const newProfile = await createUserProfile(user.uid, {
        ...profileData,
        email: user.email || "",
      });
      setProfile(newProfile);
    } finally {
      signupInProgress.current = false;
    }
  };

  const logout = async () => {
    await signOut(getFirebaseAuth());
    setProfile(null);
  };

  const verifiedUrlsRef = useRef<Set<string>>(new Set());

  const registerVerifiedUrls = (urls: string[]) => {
    urls.forEach((url) => {
      if (url) verifiedUrlsRef.current.add(url);
    });
  };

  const isUrlVerified = () => {
    return true;
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileError,
        login,
        loginWithGoogle,
        loginWithApple,
        signup,
        completeProfile,
        logout,
        refreshProfile,
        registerVerifiedUrls,
        isUrlVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
