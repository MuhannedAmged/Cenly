"use client";

import React, { useEffect, useState } from "react";
import { User, ChevronLeft, Mail, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/types";

import PricingModal from "@/components/PricingModal";

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    projects: 0,
    messages: 0,
    joinDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      // Load Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) setUser(profile);

      // Load Stats
      const { count: projectCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      const { data: userProjects } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", session.user.id);

      let messageCount = 0;
      if (userProjects && userProjects.length > 0) {
        const projectIds = userProjects.map((p) => p.id);
        const { count: msgCount } = await supabase
          .from("project_messages")
          .select("*", { count: "exact", head: true })
          .in("project_id", projectIds);
        messageCount = msgCount || 0;
      }

      setStats({
        projects: projectCount || 0,
        messages: messageCount,
        joinDate: profile?.created_at
          ? new Date(profile.created_at).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
          : "N/A",
      });
      setLoading(false);
    };
    fetchData();
  }, [router]);

  return (
    <div className="grow w-full max-w-4xl mx-auto px-6 py-8 pt-24 overflow-y-auto no-scrollbar min-h-screen bg-background text-foreground transition-all duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-surface-highlight text-gray-400 hover:text-white transition-colors border border-transparent hover:border-border"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-gray-400" />
          Profile
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-all duration-700" />

            <div className="w-24 h-24 rounded-full bg-linear-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-3xl font-bold text-white shadow-2xl relative z-10 border-2 border-white/5">
              {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex-1 text-center sm:text-left space-y-4 w-full relative z-10">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center justify-center sm:justify-start gap-2">
                  User
                  {user?.is_pro && (
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  )}
                </h2>
                <p className="text-gray-500 text-sm flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                  <Mail className="w-3 h-3" />{" "}
                  {user?.email || "user@example.com"}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/40 backdrop-blur-md rounded-xl p-3 text-center border border-white/5 hover:border-white/10 transition-all">
                  <p className="text-xl font-bold text-white">
                    {loading ? "..." : stats.projects}
                  </p>
                  <p className="text-[9px] uppercase text-gray-500 font-bold tracking-widest mt-0.5">
                    Projects
                  </p>
                </div>
                <div className="bg-black/40 backdrop-blur-md rounded-xl p-3 text-center border border-white/5 hover:border-white/10 transition-all">
                  <p className="text-xl font-bold text-white">
                    {loading ? "..." : stats.messages}
                  </p>
                  <p className="text-[9px] uppercase text-gray-500 font-bold tracking-widest mt-0.5">
                    Messages
                  </p>
                </div>
                <div className="bg-black/40 backdrop-blur-md rounded-xl p-3 text-center border border-white/5 hover:border-white/10 transition-all text-nowrap">
                  <p className="text-[12px] font-bold text-white pt-2">
                    {loading ? "..." : stats.joinDate}
                  </p>
                  <p className="text-[9px] uppercase text-gray-500 font-bold tracking-widest mt-1">
                    Joined
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl relative">
            <h3 className="text-lg font-medium text-white mb-6">
              Account Details
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                  Account ID
                </span>
                <span className="text-sm text-gray-300 font-mono">
                  {user?.id?.slice(0, 8)}...
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                  Authentication
                </span>
                <span className="text-sm text-gray-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Verified Email
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                  Member Since
                </span>
                <span className="text-sm text-gray-300">
                  {stats.joinDate || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Card */}
        <div className="bg-[#111] border border-purple-500/20 rounded-2xl p-6 relative shadow-[0_0_40px_rgba(168,85,247,0.05)] h-fit overflow-hidden group">
          <div className="absolute top-0 right-0 bg-linear-to-l from-purple-600 to-indigo-600 text-white text-[9px] font-black px-4 py-1.5 rounded-bl-2xl rounded-tr-xl tracking-tighter uppercase z-10">
            {user?.is_pro ? "PRO ACTIVE" : "FREE PLAN"}
          </div>

          {/* Background Glow */}
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/10 blur-[60px] rounded-full group-hover:bg-purple-600/20 transition-all duration-700" />

          <div className="mb-8 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20 group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {user?.is_pro ? "Pro Power" : "Upgrade to Pro"}
            </h3>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              {user?.is_pro
                ? "You have full access to all elite features and voice capabilities."
                : "Unlock unlimited power, faster generations, and voice capabilities."}
            </p>
          </div>

          <ul className="space-y-4 mb-8 relative z-10">
            {[
              "Unlimited Projects",
              "Voice-to-Text Input",
              "Full Project Download",
              "Priority Processing",
              "Multi-Image Support (5)",
            ].map((feature, i) => (
              <li
                key={i}
                className="flex items-center gap-3 text-sm text-gray-300"
              >
                <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-400 text-[10px]">✓</span>
                </div>
                {feature}
              </li>
            ))}
          </ul>

          {!user?.is_pro && (
            <button
              onClick={() => setIsPricingOpen(true)}
              className="w-full py-3.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all active:scale-[0.98] shadow-lg hover:shadow-white/10 relative z-10"
            >
              View Premium Plans
            </button>
          )}
        </div>
      </div>

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />
    </div>
  );
};

export default ProfilePage;
