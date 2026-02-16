"use client";

import React, { useEffect, useState } from "react";
import { Settings, ChevronLeft, Trash2, LogOut, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/types";
import Popup from "@/components/Popup";

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState("obsidian");
  const [streamResponses, setStreamResponses] = useState(true);
  const [codeHighlight, setCodeHighlight] = useState(true);
  const [stats, setStats] = useState({
    projects: 0,
    messages: 0,
    accountAge: "N/A",
  });
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error" | "confirm";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (title: string, message: string, type: any = "info") => {
    setPopup({ isOpen: true, title, message, type });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setPopup({ isOpen: true, title, message, type: "confirm", onConfirm });
  };

  useEffect(() => {
    // Load local settings
    const savedTheme = localStorage.getItem("cenly-theme") || "obsidian";
    setTheme(savedTheme);

    const savedStream = localStorage.getItem("cenly-stream") !== "false";
    setStreamResponses(savedStream);

    const savedHighlight = localStorage.getItem("cenly-highlight") !== "false";
    setCodeHighlight(savedHighlight);

    // Get session & stats
    const fetchData = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) setUser(profile);

      // Fetch Projects Count
      const { count: projectCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      // Fetch All Projects to count messages
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

      const joinDate = profile?.created_at
        ? new Date(profile.created_at)
        : null;
      const ageStr = joinDate
        ? `${Math.floor((new Date().getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24))} days`
        : "N/A";

      setStats({
        projects: projectCount || 0,
        messages: messageCount,
        accountAge: ageStr,
      });
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const handleThemeChange = (newTheme: string) => {
    const oldTheme = theme;
    setTheme(newTheme);
    localStorage.setItem("cenly-theme", newTheme);

    document.documentElement.classList.remove(`theme-${oldTheme}`);
    if (newTheme !== "obsidian") {
      document.documentElement.classList.add(`theme-${newTheme}`);
    }
  };

  const handleToggleStream = () => {
    const newVal = !streamResponses;
    setStreamResponses(newVal);
    localStorage.setItem("cenly-stream", String(newVal));
  };

  const handleToggleHighlight = () => {
    const newVal = !codeHighlight;
    setCodeHighlight(newVal);
    localStorage.setItem("cenly-highlight", String(newVal));
  };

  const handleClearHistory = async () => {
    showConfirm(
      "Clear History",
      `Are you sure you want to clear all ${stats.projects} projects and chat history? This cannot be undone.`,
      async () => {
        if (!user) return;
        try {
          // Get all project IDs for this user
          const { data: userProjects } = await supabase
            .from("projects")
            .select("id")
            .eq("user_id", user.id);

          if (userProjects && userProjects.length > 0) {
            const projectIds = userProjects.map((p) => p.id);
            // Delete associated messages first
            const { error: msgError } = await supabase
              .from("project_messages")
              .delete()
              .in("project_id", projectIds);

            if (msgError) throw msgError;
          }

          const { error: projError, count: projCount } = await supabase
            .from("projects")
            .delete({ count: "exact" })
            .eq("user_id", user.id);

          if (projError) throw projError;

          if (projCount === 0 && stats.projects > 0) {
            throw new Error("No projects deleted. Possible RLS issue.");
          }

          setStats({ projects: 0, messages: 0, accountAge: stats.accountAge });
          showAlert(
            "Success",
            "All projects and chat history have been cleared.",
            "success",
          );
        } catch (err) {
          console.error(err);
          showAlert("Error", "Failed to clear history.", "error");
        }
      },
    );
  };

  const handleDeleteAccount = async () => {
    showConfirm(
      "Delete Account",
      "CRITICAL: Are you sure you want to permanently delete your account? This will wipe ALL your projects, messages, and settings.",
      async () => {
        if (!user) return;
        try {
          // Get project IDs
          const { data: userProjects } = await supabase
            .from("projects")
            .select("id")
            .eq("user_id", user.id);

          if (userProjects && userProjects.length > 0) {
            const projectIds = userProjects.map((p) => p.id);
            // Delete messages
            const { error: msgError } = await supabase
              .from("project_messages")
              .delete()
              .in("project_id", projectIds);

            if (msgError) throw msgError;

            // Delete projects
            const { error: projError, count: projCount } = await supabase
              .from("projects")
              .delete({ count: "exact" })
              .eq("user_id", user.id);

            if (projError) throw projError;

            if (projCount === 0) {
              throw new Error("No projects deleted. Possible RLS issue.");
            }
          }

          // Delete profile
          await supabase.from("profiles").delete().eq("id", user.id);
          await supabase.auth.signOut();
          router.push("/login");
        } catch (err) {
          console.error(err);
          showAlert("Error", "Failed to delete account.", "error");
        }
      },
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="grow w-full max-w-4xl mx-auto px-6 py-8 pt-24 overflow-y-auto no-scrollbar min-h-screen bg-background text-foreground transition-all duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-surface-highlight text-gray-400 hover:text-white transition-colors border border-transparent hover:border-border"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-gray-400" />
            Settings
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface hover:bg-red-900/10 text-red-400 text-sm transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="space-y-6">
        {/* Usage Analytics */}
        <section className="bg-surface border border-border rounded-2xl p-6 shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all duration-700" />

          <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-3 relative z-10">
            Usage & Analytics
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 relative z-10">
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/5">
              <p className="text-3xl font-bold text-white">
                {loading ? "..." : stats.projects}
              </p>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">
                Active Projects
              </p>
            </div>
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/5">
              <p className="text-3xl font-bold text-white">
                {loading ? "..." : stats.messages}
              </p>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">
                Total Messages
              </p>
            </div>
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/5 col-span-2 sm:col-span-1">
              <p className="text-2xl font-bold text-white pt-1">
                {loading ? "..." : stats.accountAge}
              </p>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">
                Account Age
              </p>
            </div>
          </div>
        </section>

        {/* Plan & Status */}
        <section className="bg-surface border border-border rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-linear-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-sm font-bold text-white uppercase">
                {user?.email?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  Current Plan: {user?.is_pro ? "PRO" : "Free"}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/profile")}
              className="px-4 py-2 text-xs font-medium bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
            >
              View Profile
            </button>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="bg-surface border border-border rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-medium text-white mb-4">Appearance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              {
                id: "obsidian",
                name: "Obsidian",
                color: "bg-[#050505]",
                desc: "Deep grey darkness",
              },
              {
                id: "midnight",
                name: "Midnight",
                color: "bg-[#020617]",
                desc: "Sleek blue navy",
                accent: "blue",
              },
              {
                id: "deep-space",
                name: "Deep Space",
                color: "bg-black",
                desc: "Pure absolute black",
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`p-4 rounded-xl border transition-all text-left ${theme === t.id ? "bg-white/5 border-white shadow-lg" : "bg-black/20 border-border hover:border-gray-500"}`}
              >
                <div
                  className={`w-full h-10 ${t.color} rounded-lg mb-3 border ${theme === t.id ? "border-white/20" : "border-white/5"}`}
                />
                <p className="text-sm font-bold text-white">{t.name}</p>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">
                  {t.desc}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* AI & Editor preferences */}
        <section className="bg-surface border border-border rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI & Editor
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all">
              <div>
                <p className="text-sm font-medium text-gray-200">
                  Stream Responses
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                  Animate text during generation
                </p>
              </div>
              <button
                onClick={handleToggleStream}
                className={`w-12 h-6 rounded-full transition-all relative ${streamResponses ? "bg-white text-black" : "bg-zinc-800"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full transition-all ${streamResponses ? "right-1 bg-black" : "left-1 bg-zinc-600"}`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all">
              <div>
                <p className="text-sm font-medium text-gray-200">
                  Syntax Highlighting
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                  Colorful code block rendering
                </p>
              </div>
              <button
                onClick={handleToggleHighlight}
                className={`w-12 h-6 rounded-full transition-all relative ${codeHighlight ? "bg-white" : "bg-zinc-800"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full transition-all ${codeHighlight ? "right-1 bg-black" : "left-1 bg-zinc-600"}`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 shadow-xl mb-12">
          <h3 className="text-lg font-medium text-red-400 mb-6 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-red-900/10">
              <div>
                <p className="text-sm font-semibold text-gray-200">
                  Clear All History
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Delete all {stats.projects} projects and associated messages.
                </p>
              </div>
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 text-xs font-bold text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all"
              >
                Clear History
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-red-900/10">
              <div>
                <p className="text-sm font-semibold text-gray-200">
                  Delete Account
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Wipe your profile and all associated data permanently.
                </p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all shadow-lg"
              >
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </div>

      <Popup
        isOpen={popup.isOpen}
        onClose={() => setPopup((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={popup.onConfirm}
        title={popup.title}
        message={popup.message}
        type={popup.type}
      />
    </div>
  );
};

export default SettingsPage;
