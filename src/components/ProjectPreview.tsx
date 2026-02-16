import React from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { createPortal } from "react-dom";
import { RotateCcw, Maximize, Bug, Download, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { exportProjectAsZip } from "../lib/export";

interface ProjectPreviewProps {
  files: Record<string, string>;
  onAutoFix?: (error: string) => void;
  isPro?: boolean;
  onUpgradeClick?: () => void;
}

const ErrorListener = ({
  onToggleError,
}: {
  onToggleError: (error: string | null) => void;
}) => {
  const { listen } = useSandpack();

  React.useEffect(() => {
    const unsub = listen((msg: any) => {
      if (msg.type === "done") {
        onToggleError(null);
      } else if (msg.type === "action" && msg.action === "show-error") {
        onToggleError(msg.title || "Unknown error occurred");
      }
    });
    return () => unsub();
  }, [listen, onToggleError]);

  return null;
};

const ProjectPreview: React.FC<ProjectPreviewProps> = ({
  files,
  onAutoFix,
  isPro = false,
  onUpgradeClick,
}) => {
  const [previewKey, setPreviewKey] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [showDownloadTooltip, setShowDownloadTooltip] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleReload = () => {
    setPreviewKey((prev) => prev + 1);
    setErrorMsg(null);
  };
  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  const handleDownload = async () => {
    if (!isPro) {
      setShowDownloadTooltip(true);
      setTimeout(() => setShowDownloadTooltip(false), 3000);
      return;
    }

    try {
      await exportProjectAsZip(files, "cenly-project");
    } catch (error) {
      console.error("Failed to generate ZIP:", error);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const mainEntry = `
import React from 'react';
import Page from './page';

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Page />
    </div>
  );
}
`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Cenly Preview</title>
  </head>
  <body class="bg-black text-white">
    <div id="root"></div>
  </body>
</html>
`;

  const sandpackFiles = React.useMemo(() => {
    const filesMap: Record<string, any> = {};
    Object.entries(files).forEach(([path, content]) => {
      let cleanPath = path.startsWith("/") ? path.slice(1) : path;
      if (cleanPath.startsWith("src/"))
        cleanPath = cleanPath.replace("src/", "");
      const processedContent = content
        .replace(/from\s+['"]@\/(.*)['"]/g, 'from "/$1"')
        .replace(/import\s+['"]@\/(.*)['"]/g, 'import "/$1"');
      filesMap[`/${cleanPath}`] = processedContent;
    });

    const hasPage = filesMap["/page.tsx"];
    const hasApp = filesMap["/App.tsx"];

    if (hasPage) {
      filesMap["/App.tsx"] = mainEntry;
    } else if (!hasApp) {
      const firstTsx = Object.keys(filesMap).find(
        (k) => k.endsWith(".tsx") && k !== "/App.tsx",
      );
      if (firstTsx) {
        filesMap["/App.tsx"] =
          `import Page from '.${firstTsx.replace(".tsx", "")}'; export default function App() { return <Page />; }`;
      } else {
        // Fallback for empty project to prevent crash
        filesMap["/App.tsx"] = `
export default function App() {
  return (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Project is Empty</h2>
        <p className="text-gray-400">Ask Cenly to generate some code!</p>
      </div>
    </div>
  );
}
`;
      }
    }

    if (!filesMap["/index.tsx"]) {
      filesMap["/index.tsx"] = `
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;
    }

    filesMap["/index.html"] = htmlContent;
    return filesMap;
  }, [files]);

  const customSetup = React.useMemo(
    () => ({
      dependencies: {
        "framer-motion": "latest",
        "lucide-react": "latest",
        clsx: "latest",
        "tailwind-merge": "latest",
      },
    }),
    [],
  );

  const options = React.useMemo(
    () => ({
      externalResources: ["https://cdn.tailwindcss.com"],
      classes: {
        "sp-wrapper": "h-full",
        "sp-layout": "h-full border-none bg-transparent",
        "sp-preview": "h-full bg-transparent shadow-none",
        "sp-preview-container": "h-full",
        "sp-preview-iframe": "h-full",
      },
    }),
    [],
  );

  const renderSandpack = (full: boolean) => (
    <div
      className={`bg-[#050505] overflow-hidden transition-all duration-300 relative flex flex-col ${
        full
          ? "fixed inset-0 w-screen h-screen z-99999 m-0 p-0"
          : "w-full h-full rounded-2xl border border-white/5"
      }`}
      style={
        full
          ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }
          : undefined
      }
    >
      {/* Control Overlay */}
      <div className="absolute top-4 right-4 z-100000 flex items-center gap-2">
        <button
          onClick={handleReload}
          className="p-2 rounded-lg bg-black/60 backdrop-blur-xl border border-white/10 text-gray-300 hover:text-white hover:bg-black/80 transition-all shadow-2xl"
          title="Reload Preview"
          type="button"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          className={`p-2 rounded-lg bg-black/60 backdrop-blur-xl border border-white/10 transition-all shadow-2xl ${
            full
              ? "text-red-400 hover:text-red-300 hover:bg-red-400/10"
              : "text-gray-300 hover:text-white hover:bg-black/80"
          }`}
          title={full ? "Exit Fullscreen" : "Fullscreen Preview"}
          type="button"
        >
          <Maximize className="w-4 h-4" />
        </button>
        <div className="relative">
          <button
            onClick={handleDownload}
            className={`p-2 rounded-lg bg-black/60 backdrop-blur-xl border border-white/10 transition-all shadow-2xl ${
              isPro
                ? "text-gray-300 hover:text-white hover:bg-black/80"
                : "text-gray-600 cursor-not-allowed"
            }`}
            title={isPro ? "Download Project" : "Pro feature"}
            type="button"
          >
            <Download className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {showDownloadTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full right-0 mt-2 px-3 py-2 bg-purple-600 text-white text-xs rounded-lg whitespace-nowrap z-50"
              >
                <button
                  type="button"
                  onClick={onUpgradeClick}
                  className="flex items-center gap-1 hover:underline"
                >
                  <Crown className="w-3 h-3" />
                  Upgrade to Pro to download
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Auto-Fix Overlay */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-1000002"
          >
            <button
              onClick={() => onAutoFix?.(errorMsg)}
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-red-500 text-white font-medium shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:bg-red-600 transition-all scale-100 hover:scale-105 active:scale-95 group"
              type="button"
            >
              <Bug className="w-5 h-5 animate-pulse" />
              <span>Fix with AI</span>
              <div className="w-px h-4 bg-white/20 mx-1" />
              <span className="text-xs opacity-80 font-normal truncate max-w-[200px]">
                {errorMsg}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-full w-full flex flex-col flex-1">
        <SandpackProvider
          key={previewKey}
          template="react-ts"
          files={sandpackFiles}
          theme="dark"
          customSetup={customSetup}
          options={options}
        >
          <ErrorListener onToggleError={setErrorMsg} />
          <SandpackLayout
            style={{
              height: "100%",
              minHeight: "100%",
              flex: 1,
              border: "none",
              background: "transparent",
            }}
          >
            <SandpackPreview
              showNavigator={false}
              showRefreshButton={false}
              showOpenInCodeSandbox={false}
              style={{
                height: "100%",
                minHeight: "100%",
                flex: 1,
                background: "transparent",
              }}
            />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );

  if (isFullscreen && mounted) {
    return createPortal(renderSandpack(true), document.body);
  }

  return renderSandpack(false);
};

export default ProjectPreview;
