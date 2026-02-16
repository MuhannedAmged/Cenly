"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MessageList from "@/components/MessageList";
import InputArea from "@/components/InputArea";
import PricingModal from "@/components/PricingModal";
import CodeViewer from "@/components/CodeViewer";
import ProjectPreview from "@/components/ProjectPreview";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PanelLeft, ChevronLeft } from "lucide-react";
import { streamResponse, updateProject } from "@/services/geminiService";
import { Message, Project, UserProfile } from "@/types";
import Popup from "@/components/Popup";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";
import { exportProjectAsZip } from "@/lib/export";

export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"code" | "preview">("preview");
  const [isWorkspaceVisible, setIsWorkspaceVisible] = useState(false);
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

  // Load Initial Data
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const userId = session.user.id;

      // Load User
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (profile) setUser(profile);

      // Load Projects for Sidebar
      const { data: allProjects } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (allProjects) setProjects(allProjects);

      // Load Current Project
      const { data: currProject } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
      if (currProject) {
        setProject(currProject);
        // Load Messages from project_messages
        const { data: msgs } = await supabase
          .from("project_messages")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: true });
        if (msgs) {
          setMessages(
            msgs.map((m: any) => ({
              id: m.id,
              role: m.role,
              text: m.text,
              image: m.image,
            })),
          );
        }
      } else {
        router.push("/");
      }
    };

    init();
  }, [id, router]);

  const handleSend = useCallback(
    async (text: string, images?: string[]) => {
      const image = images?.[0]; // Use first image for AI generation
      if (!text.trim() && !image) return;
      if (!user || !project) return;

      setIsLoading(true);

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

      // 1. Optimistic User Update
      const userMsgId = uuidv4();
      const newUserMsg: Message = { id: userMsgId, role: "user", text, image };
      setMessages((prev) => [...prev, newUserMsg]);

      await supabase.from("project_messages").insert({
        project_id: project.id,
        role: "user",
        text: text,
        image: image,
      });

      // 2. AI Update Response
      try {
        const { files, description } = await updateProject(
          text,
          project.generated_code || {},
          messages.map((m) => ({ role: m.role, text: m.text })),
          image,
        );

        // Update Project in DB
        const { error: updateError } = await supabase
          .from("projects")
          .update({
            generated_code: files,
          })
          .eq("id", project.id);

        if (!updateError) {
          setProject((prev) =>
            prev ? { ...prev, generated_code: files } : null,
          );

          const aiMsgId = uuidv4();
          const aiMsgText = `Project updated: ${description || "Applied changes based on your request."}`;

          setMessages((prev) => [
            ...prev,
            { id: aiMsgId, role: "model", text: aiMsgText },
          ]);

          await supabase.from("project_messages").insert({
            project_id: project.id,
            role: "model",
            text: aiMsgText,
          });
        }
      } catch (error) {
        console.error(error);
        showAlert(
          "Error",
          "Failed to update project. The AI might be busy.",
          "error",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [project, user],
  );

  const handleSelectProject = (projectId: string) => {
    router.push(`/${projectId}`);
    setIsSidebarOpen(false);
  };

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
      if (project?.id === projectId) {
        setProject((prev) => (prev ? { ...prev, title: newTitle } : null));
      }
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
          // Explicitly delete messages first to avoid FK constraint issues
          const { error: msgError } = await supabase
            .from("project_messages")
            .delete()
            .eq("project_id", projectId);

          if (msgError) throw msgError;

          const { error: projError, count: projCount } = await supabase
            .from("projects")
            .delete({ count: "exact" })
            .eq("id", projectId);

          if (projError) throw projError;

          if (projCount === 0) {
            throw new Error(
              "Project not found or could not be deleted (check RLS policies).",
            );
          }

          setProjects((prev) => prev.filter((p) => p.id !== projectId));
          if (project?.id === projectId) {
            router.push("/");
          }
        } catch (error) {
          console.error("Delete Error:", error);
          showAlert("Error", "Failed to delete project.", "error");
        }
      },
    );
  };

  const handleDuplicateProject = async (projectId: string) => {
    if (!user) return;

    // Check Plan Limits
    if (!user.is_pro && projects.length >= 3) {
      showAlert(
        "Plan Limit",
        "Free plan is limited to 3 projects. Please upgrade to Pro to create more.",
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
    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject) return;

    try {
      const { error } = await supabase
        .from("projects")
        .update({ is_pinned: !targetProject.is_pinned })
        .eq("id", projectId);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, is_pinned: !p.is_pinned } : p,
        ),
      );
      if (project?.id === projectId) {
        setProject((prev) =>
          prev ? { ...prev, is_pinned: !prev.is_pinned } : null,
        );
      }
    } catch (error) {
      console.error("Pin Error:", error);
    }
  };

  const handleToggleFavorite = async (projectId: string) => {
    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject) return;

    try {
      const { error } = await supabase
        .from("projects")
        .update({ is_favorite: !targetProject.is_favorite })
        .eq("id", projectId);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, is_favorite: !p.is_favorite } : p,
        ),
      );
      if (project?.id === projectId) {
        setProject((prev) =>
          prev ? { ...prev, is_favorite: !prev.is_favorite } : null,
        );
      }
    } catch (error) {
      console.error("Favorite Error:", error);
    }
  };

  const handleExportProject = async (projectId: string) => {
    const targetProject = projects.find((p) => p.id === projectId);
    const currentCode =
      projectId === project?.id
        ? project.generated_code
        : targetProject?.generated_code;

    if (!currentCode) return;

    const title =
      (projectId === project?.id ? project.title : targetProject?.title) ||
      "project";

    try {
      await exportProjectAsZip(currentCode, title);
    } catch (error) {
      console.error("Export Error:", error);
      showAlert("Error", "Failed to export project ZIP.", "error");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!project) return null;

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden flex flex-col font-sans text-primary">
      <Header
        onMenuClick={() => setIsSidebarOpen(true)}
        onUpgradeClick={() => setIsPricingOpen(true)}
        onToggleWorkspace={() => setIsWorkspaceVisible(!isWorkspaceVisible)}
        isWorkspaceVisible={isWorkspaceVisible}
        isPro={user?.is_pro}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={() => router.push("/")}
        onSelectProject={handleSelectProject}
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
        currentProjectId={project.id}
      />

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden pt-20">
        {/* Left Panel: AI Chat */}
        <div
          className={`h-full border-r border-white/5 flex flex-col relative bg-zinc-900/20 backdrop-blur-sm transition-all duration-500 ease-in-out ${
            isWorkspaceVisible ? "w-full lg:w-2/5" : "w-full"
          }`}
        >
          <div className="flex-1 overflow-y-auto">
            <MessageList messages={messages} isLoading={isLoading} />
          </div>

          <div className="p-4 bg-linear-to-t from-background via-background/80 to-transparent">
            <InputArea
              onSend={handleSend}
              disabled={isLoading}
              hasStarted={true}
              isPro={user?.is_pro || false}
              dailyImagesRemaining={
                user?.is_pro ? 999 : 5 - (user?.daily_image_count || 0)
              }
              onUpgradeClick={() => setIsPricingOpen(true)}
            />
          </div>
        </div>

        {/* Right Panel: Workspace */}
        <div
          className={`h-full flex flex-col overflow-hidden bg-background absolute lg:static inset-0 lg:inset-auto z-40 lg:z-auto transition-all duration-500 ease-in-out border-l border-white/5 ${
            isWorkspaceVisible
              ? "lg:flex-1 w-full lg:w-auto opacity-100 pointer-events-auto translate-x-0"
              : "w-0 opacity-0 pointer-events-none translate-x-full"
          }`}
        >
          {/* Workspace Controls */}
          <div className="flex items-center justify-between gap-4 p-4 border-b border-white/5 bg-black/40 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("preview")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  viewMode === "preview"
                    ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
                type="button"
              >
                View Project
              </button>
              <button
                onClick={() => setViewMode("code")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  viewMode === "code"
                    ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
                type="button"
              >
                View Code
              </button>
            </div>

            <button
              onClick={() => setIsWorkspaceVisible(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              title="Hide Workspace"
              type="button"
            >
              <ChevronLeft className="w-5 h-5 rotate-180 lg:rotate-0" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden p-2 lg:p-4 bg-[#0a0a0a]/50">
            {isWorkspaceVisible &&
              (viewMode === "code" ? (
                <CodeViewer
                  files={
                    project.generated_code || {
                      "page.tsx": "// Generating your project...",
                    }
                  }
                />
              ) : (
                <ErrorBoundary>
                  <ProjectPreview
                    files={project.generated_code || {}}
                    onAutoFix={(error) => {
                      handleSend(
                        `I'm getting this error in the preview: ${error}. Please fix it.`,
                      );
                    }}
                    isPro={user?.is_pro || false}
                    onUpgradeClick={() => setIsPricingOpen(true)}
                  />
                </ErrorBoundary>
              ))}
          </div>
        </div>
      </main>

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
