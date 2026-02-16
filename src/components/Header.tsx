"use client";

import React from "react";
import { PanelLeft, Sparkles } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
  onUpgradeClick?: () => void;
  onToggleWorkspace?: () => void;
  isWorkspaceVisible?: boolean;
  isPro?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  onUpgradeClick,
  onToggleWorkspace,
  isWorkspaceVisible,
  isPro,
}) => {
  return (
    <header className="fixed top-0 left-0 w-full px-6 py-2 flex justify-between items-center z-30 pointer-events-none">
      <div className="flex items-center gap-4 pointer-events-auto">
        <button
          onClick={onMenuClick}
          className="text-secondary hover:text-white transition-colors p-2 -ml-2 rounded-lg hover:bg-white/5"
          type="button"
        >
          <PanelLeft className="w-6 h-6" strokeWidth={1.5} />
        </button>

        {onToggleWorkspace && (
          <button
            onClick={onToggleWorkspace}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-medium ${
              isWorkspaceVisible
                ? "bg-white text-black border-white"
                : "bg-black/40 text-gray-400 border-white/10 hover:text-white hover:border-white/20"
            }`}
            type="button"
          >
            <Sparkles
              className={`w-3 h-3 ${isWorkspaceVisible ? "text-black" : "text-white"}`}
            />
            <span>
              {isWorkspaceVisible ? "Hide Workspace" : "Show Workspace"}
            </span>
          </button>
        )}
      </div>

      {!isPro && onUpgradeClick && (
        <button
          onClick={onUpgradeClick}
          className="pointer-events-auto flex items-center gap-2 bg-[#181818] hover:bg-[#222] border border-[#333] hover:border-[#444] text-xs font-medium text-gray-300 px-4 py-2 rounded-full transition-all group"
          type="button"
        >
          <Sparkles className="w-3 h-3 text-white group-hover:scale-110 transition-transform" />
          <span className="text-white">Upgrade</span>
        </button>
      )}
    </header>
  );
};

export default Header;
