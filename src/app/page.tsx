"use client";

import React, { useState, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import InputArea from "@/components/InputArea";
import MessageList from "@/components/MessageList";
import Sidebar from "@/components/Sidebar";
import PricingModal from "@/components/PricingModal";
import { streamResponse } from "@/services/geminiService";
import { Message, Project, UserProfile } from "@/types";
import Popup from "@/components/Popup";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

import { generateProject } from "@/services/geminiService";
import { exportProjectAsZip } from "@/lib/export";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
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

  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (profile) setUser(profile);

        const { data: allProjects } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });
        if (allProjects) setProjects(allProjects);
      } else {
        router.push("/login");
      }
    };
    checkSession();
  }, [router]);

  const handleSend = useCallback(
    async (text: string, images?: string[]) => {
      const image = images?.[0]; // Use first image for AI generation
      if (!text.trim() && !image) return;
      if (!user) return;

      setIsLoading(true);

      try {
        // Plan Enforcement - 5 project limit for Standard
        if (!user.is_pro && projects.length >= 5) {
          showAlert(
            "Plan Limit",
            "Free plan is limited to 5 projects. Please upgrade to Pro for unlimited generation!",
            "warning",
          );
          setIsLoading(false);
          return;
        }

        // Image limit check for Standard (5/day)
        if (images && images.length > 0 && !user.is_pro) {
          const today = new Date().toISOString().split("T")[0];
          const lastReset = user.last_image_reset || today;
          let imageCount = user.daily_image_count || 0;

          // Reset count if new day
          if (lastReset !== today) {
            imageCount = 0;
          }

          const newImageCount = imageCount + images.length;
          if (newImageCount > 5) {
            showAlert(
              "Image Limit Reached",
              "Free plan is limited to 5 images per day. Upgrade to Pro for unlimited images!",
              "warning",
            );
            setIsLoading(false);
            return;
          }

          // Update image count
          await supabase
            .from("profiles")
            .update({
              daily_image_count: newImageCount,
              last_image_reset: today,
            })
            .eq("id", user.id);

          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  daily_image_count: newImageCount,
                  last_image_reset: today,
                }
              : null,
          );
        }

        // Generate project structured data
        const { files, description } = await generateProject(text, image);

        // Create project in Supabase
        const { data: newProject, error } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            title: description || text.slice(0, 30) + "...",
            prompt: text,
            generated_code: files,
          })
          .select()
          .single();

        if (newProject) {
          // Add initial message
          await supabase.from("project_messages").insert([
            { project_id: newProject.id, role: "user", text: text, image },
            {
              project_id: newProject.id,
              role: "model",
              text: "Project generated successfully! I've set up the basic structure for you.",
            },
          ]);

          router.push(`/${newProject.id}`);
        }
      } catch (error) {
        console.error(error);
        showAlert(
          "Error",
          "Failed to generate project. Please try again.",
          "error",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [user, router],
  );

  const handleRenameProject = async (projectId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ title: newTitle })
        .eq("id", projectId);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, title: newTitle } : p)),
      );
    } catch (error) {
      console.error("Rename Error:", error);
      showAlert("Error", "Failed to rename project.", "error");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    showConfirm(
      "Delete Project",
      "Are you sure you want to delete this project? This action cannot be undone.",
      async () => {
        try {
          // Explicitly delete messages first
          const { error: msgError, count: msgCount } = await supabase
            .from("project_messages")
            .delete({ count: "exact" })
            .eq("project_id", projectId);

          console.log("Deleted messages:", msgCount, "Error:", msgError);

          if (msgError) throw msgError;

          const { error: projError, count: projCount } = await supabase
            .from("projects")
            .delete({ count: "exact" })
            .eq("id", projectId);

          console.log("Deleted project:", projCount, "Error:", projError);

          if (projError) throw projError;

          if (projCount === 0) {
            throw new Error(
              "Project not found or could not be deleted (check RLS policies).",
            );
          }

          setProjects((prev) => prev.filter((p) => p.id !== projectId));
        } catch (error) {
          console.error("Delete Error:", error);
          showAlert("Error", "Failed to delete project.", "error");
        }
      },
    );
  };

  const handleDuplicateProject = async (projectId: string) => {
    if (!user) return;

    // Check Plan Limits - 5 project limit for Standard
    if (!user.is_pro && projects.length >= 5) {
      showAlert(
        "Plan Limit",
        "Free plan is limited to 5 projects. Please upgrade to Pro to create more.",
        "warning",
      );
      return;
    }

    try {
      const sourceProject = projects.find((p) => p.id === projectId);
      if (!sourceProject) return;

      const { data: newProject, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          title: `Copy of ${sourceProject.title}`,
          prompt: sourceProject.prompt,
          generated_code: sourceProject.generated_code,
        })
        .select()
        .single();

      if (error) throw error;

      if (newProject) {
        setProjects((prev) => [newProject as Project, ...prev]);
        router.push(`/${newProject.id}`);
      }
    } catch (error) {
      console.error("Duplicate Error:", error);
      showAlert("Error", "Failed to duplicate project.", "error");
    }
  };

  const handleTogglePin = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    try {
      const { error } = await supabase
        .from("projects")
        .update({ is_pinned: !project.is_pinned })
        .eq("id", projectId);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, is_pinned: !p.is_pinned } : p,
        ),
      );
    } catch (error) {
      console.error("Pin Error:", error);
    }
  };

  const handleToggleFavorite = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    try {
      const { error } = await supabase
        .from("projects")
        .update({ is_favorite: !project.is_favorite })
        .eq("id", projectId);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, is_favorite: !p.is_favorite } : p,
        ),
      );
    } catch (error) {
      console.error("Favorite Error:", error);
    }
  };

  const handleExportProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project || !project.generated_code) return;

    try {
      await exportProjectAsZip(project.generated_code, project.title);
    } catch (error) {
      console.error("Export Error:", error);
      showAlert("Error", "Failed to export project ZIP.", "error");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden flex flex-col font-sans text-primary">
      <Header
        onMenuClick={() => setIsSidebarOpen(true)}
        onUpgradeClick={() => setIsPricingOpen(true)}
        isPro={user?.is_pro}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={() => router.push("/")}
        onSelectProject={(id) => router.push(`/${id}`)}
        onNavigate={(view) => {
          if (view === "login") handleLogout();
          else router.push(`/${view}`);
        }}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
        onTogglePin={handleTogglePin}
        onToggleFavorite={handleToggleFavorite}
        onExportProject={handleExportProject}
        projects={projects}
        user={user}
        currentProjectId={null}
      />

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />

      <main className="grow relative flex flex-col items-center justify-center w-full mx-auto z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
          <Hero isVisible={true} />
          <div className="w-full mt-8">
            <InputArea
              onSend={handleSend}
              disabled={isLoading}
              hasStarted={false}
              isPro={user?.is_pro || false}
              dailyImagesRemaining={
                user?.is_pro ? 999 : 5 - (user?.daily_image_count || 0)
              }
              onUpgradeClick={() => setIsPricingOpen(true)}
            />
          </div>
          {isLoading && (
            <div className="mt-8 flex flex-col items-center gap-4 animate-pulse">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-sm text-zinc-400">
                Architecting your project...
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-6 w-full text-center py-2 z-0 pointer-events-none">
        <p className="text-[10px] text-zinc-600">
          Powered by <span className="text-zinc-400 font-medium">Cenly AI</span>
          .
        </p>
      </footer>

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
}
