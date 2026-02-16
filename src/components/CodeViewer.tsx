"use client";

import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FileCode, Folder, ChevronRight, ChevronDown } from "lucide-react";

interface CodeViewerProps {
  files: Record<string, string>;
}

export default function CodeViewer({ files }: CodeViewerProps) {
  const [selectedFile, setSelectedFile] = useState(Object.keys(files)[0]);

  const fileList = Object.keys(files).sort();

  return (
    <div className="flex h-full w-full bg-zinc-950 rounded-xl overflow-hidden border border-white/10">
      {/* File Explorer */}
      <div className="w-64 border-r border-white/10 bg-zinc-900/50 flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <Folder size={16} className="text-zinc-400" />
          <span className="text-sm font-medium text-zinc-200 uppercase tracking-wider">
            Explorer
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {fileList.map((file) => (
            <button
              key={file}
              onClick={() => setSelectedFile(file)}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${
                selectedFile === file
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
              }`}
              type="button"
            >
              <FileCode
                size={14}
                className={
                  selectedFile === file ? "text-blue-400" : "text-zinc-500"
                }
              />
              <span className="text-xs truncate">{file}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor/Viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-3 border-b border-white/10 bg-zinc-900/50 flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-mono">
            {selectedFile}
          </span>
          <button
            onClick={() => navigator.clipboard.writeText(files[selectedFile])}
            className="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all border border-white/5"
            type="button"
          >
            Copy
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-zinc-950">
          <SyntaxHighlighter
            language="typescript"
            style={atomDark}
            customStyle={{
              margin: 0,
              padding: "1.5rem",
              background: "transparent",
              fontSize: "0.8rem",
              lineHeight: "1.5",
            }}
            showLineNumbers
          >
            {files[selectedFile] || ""}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
