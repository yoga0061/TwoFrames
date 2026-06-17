"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/GlassCard";
import { GuestGuard } from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  return (
    <GuestGuard>
      <SignupForm />
    </GuestGuard>
  );
}

function SignupForm() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [relationshipStartDate, setRelationshipStartDate] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signup(email, password, {
        name,
        gender,
        relationshipStartDate: new Date(relationshipStartDate),
      });
      router.replace("/connect");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Heart className="mx-auto h-8 w-8 text-rose-400" fill="currentColor" />
          <h1 className="mt-4 text-2xl font-bold text-white">Create your space</h1>
          <p className="mt-2 text-sm text-white/40">Start building memories together</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-white/50">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-rose-400/50"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/50">Gender</label>
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-rose-400/50"
              >
                <option value="" className="bg-[#1a1225]">Select gender</option>
                <option value="male" className="bg-[#1a1225]">Male</option>
                <option value="female" className="bg-[#1a1225]">Female</option>
                <option value="other" className="bg-[#1a1225]">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/50">
                Relationship Start Date
              </label>
              <input
                type="date"
                required
                value={relationshipStartDate}
                onChange={(e) => setRelationshipStartDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-rose-400/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/50">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-rose-400/50"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/50">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-rose-400/50"
                placeholder="Min 6 characters"
              />
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" /> : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          Already have an account?{" "}
          <Link href="/login" className="text-rose-400 hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
