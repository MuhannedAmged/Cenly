"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { LogoIcon } from "@/components/Logo";
import { Mail, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 bg-surface/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-border">
            <LogoIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            Create Account
          </h2>
          <p className="text-gray-500 text-sm mt-2">Join AetherAI today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 ml-1">
              Email
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#151515] border border-border text-white text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-white/20 focus:bg-surface-highlight transition-all placeholder-gray-600"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 ml-1">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full bg-[#151515] border border-border text-white text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-white/20 focus:bg-surface-highlight transition-all placeholder-gray-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black font-medium rounded-xl hover:bg-gray-100 transition-colors mt-6 flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-white hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
