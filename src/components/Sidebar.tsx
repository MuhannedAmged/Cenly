"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoIcon } from "./Logo";
import {
  MoreVertical,
  Trash2,
  Pencil,
  Check,
  X,
  Copy,
  Plus,
  User,
  Settings,
  LogOut,
  Pin,
  Star,
  Download,
} from "lucide-react";
import { Project, UserProfile } from "../types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectProject: (projectId: string) => void;
  onNavigate: (view: "profile" | "settings" | "login") => void;
  onRenameProject: (projectId: string, newTitle: string) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onTogglePin: (projectId: string) => void;
  onToggleFavorite: (projectId: string) => void;
  onExportProject: (projectId: string) => void;
  projects: Project[];
  user: UserProfile | null;
  currentProjectId: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onNewChat,
  onSelectProject,
  onNavigate,
  onRenameProject,
  onDeleteProject,
  onDuplicateProject,
  onTogglePin,
  onToggleFavorite,
  onExportProject,
  projects,
  user,
  currentProjectId,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleStartRename = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditTitle(project.title || "Untitled Project");
    setActiveMenuId(null);
  };

  const handleConfirmRename = (e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editingId && editTitle.trim()) {
      onRenameProject(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  // Sort projects: pinned first, then by date
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              onClose();
              setActiveMenuId(null);
              setEditingId(null);
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-[300px] bg-[#050505]/95 backdrop-blur-xl border-r border-[#1a1a1a] z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 flex items-center justify-between border-b border-[#1a1a1a]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-[#1a1a1a]">
                  <LogoIcon className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-white tracking-tight text-sm">
                  Cenly
                </span>
              </div>
              <button
                onClick={onNewChat}
                className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors text-gray-400 hover:text-white"
                title="New Chat"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Action Button */}
            <div className="px-4 mt-4">
              <button
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-[#2a2a2a] bg-[#111] hover:bg-[#161616] text-sm text-gray-300 transition-all flex items-center justify-center gap-2 group"
              >
                <Plus className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                <span>Start New Project</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-2 py-4 mt-2 custom-scrollbar">
              <div className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-3 pl-4">
                Projects
              </div>

              <div className="space-y-1">
                {sortedProjects.length === 0 ? (
                  <p className="text-xs text-gray-700 pl-4 italic">
                    No projects yet.
                  </p>
                ) : (
                  sortedProjects.map((proj) => (
                    <div key={proj.id} className="relative group px-2">
                      {editingId === proj.id ? (
                        <div className="w-full flex items-center gap-1 p-1 bg-[#111] rounded-lg border border-[#333]">
                          <input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleConfirmRename(e as any);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-white px-2 py-1"
                          />
                          <button
                            onClick={handleConfirmRename}
                            className="p-1 hover:bg-green-500/20 text-green-400 rounded transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="p-1 hover:bg-gray-500/20 text-gray-400 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() => {
                              onSelectProject(proj.id);
                              onClose();
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors border relative overflow-hidden group/btn ${currentProjectId === proj.id ? "bg-[#1a1a1a] border-[#333]" : "border-transparent hover:bg-[#111] hover:border-[#1a1a1a]"}`}
                          >
                            <div className="flex items-center gap-2 pr-6 overflow-hidden relative z-10">
                              <p
                                className={`text-sm truncate ${currentProjectId === proj.id ? "text-white" : "text-gray-400 group-hover:text-gray-100"}`}
                              >
                                {proj.title || "Untitled Project"}
                              </p>
                              <div className="flex items-center gap-1 ml-auto shrink-0">
                                {proj.is_pinned && (
                                  <Pin className="w-3 h-3 text-purple-400" />
                                )}
                                {proj.is_favorite && (
                                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                )}
                              </div>
                            </div>
                          </button>

                          {/* Action Trigger */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(
                                  activeMenuId === proj.id ? null : proj.id,
                                );
                              }}
                              className={`p-1.5 rounded-md hover:bg-white/10 transition-all ${activeMenuId === proj.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"} text-gray-500 hover:text-white`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Dropdown Menu */}
                          <AnimatePresence>
                            {activeMenuId === proj.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-80"
                                  onClick={() => setActiveMenuId(null)}
                                />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 mt-2 w-44 bg-[#161616] border border-[#2a2a2a] rounded-xl shadow-2xl z-40 overflow-hidden"
                                >
                                  <button
                                    onClick={(e) => handleStartRename(e, proj)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" /> Rename
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDuplicateProject(proj.id);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 transition-colors"
                                  >
                                    <Copy className="w-3.5 h-3.5" /> Duplicate
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onExportProject(proj.id);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5 transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Export
                                  </button>
                                  <div className="h-px bg-[#2a2a2a] mx-2" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteProject(proj.id);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-400 hover:bg-red-400/10 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer / Account area */}
            <div className="p-4 border-t border-[#1a1a1a] bg-[#050505] relative">
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-4 right-4 mb-2 bg-[#111] border border-[#222] rounded-xl shadow-xl overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        onNavigate("profile");
                        onClose();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#1a1a1a] text-sm text-gray-300 flex items-center gap-3 transition-colors"
                    >
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <button
                      onClick={() => {
                        onNavigate("settings");
                        onClose();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[#1a1a1a] text-sm text-gray-300 flex items-center gap-3 transition-colors"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <div className="h-px bg-[#222] w-full" />
                    <button
                      onClick={() => {
                        onNavigate("login");
                        onClose();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-red-900/10 text-sm text-red-400 flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-3 w-full p-2 rounded-xl transition-colors border ${showUserMenu ? "bg-[#111] border-[#222]" : "hover:bg-[#111] border-transparent hover:border-[#1a1a1a]"}`}
              >
                <div className="w-9 h-9 rounded-full bg-linear-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm text-gray-200 font-medium truncate">
                    {user?.email}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {user?.is_pro ? "PRO Plan" : "Free Plan"}
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
