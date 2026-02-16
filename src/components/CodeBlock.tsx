"use client";

import React from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import html from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy } from "lucide-react";

SyntaxHighlighter.registerLanguage("html", html);

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = "html" }) => {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-800 bg-[#0d0d0d] my-4 font-mono text-sm shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-gray-800">
        <span className="text-xs text-gray-400 uppercase font-semibold">
          {language}
        </span>
        <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
          <Copy className="w-3 h-3" />
          Copy code
        </button>
      </div>
      <div className="p-0">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1.5rem",
            background: "transparent",
            fontSize: "13px",
            lineHeight: "1.5",
          }}
          wrapLongLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock;
