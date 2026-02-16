"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./CodeBlock";
import { Message } from "../types";
import { Sparkles } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNewMessage = messages.length > prevMessagesLength.current;
    prevMessagesLength.current = messages.length;

    if (isNewMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

      if (isNearBottom || (isLoading && isNearBottom)) {
        messagesEndRef.current?.scrollIntoView({
          behavior: "auto",
          block: "end",
        });
      }
    }
  }, [messages, isLoading]);

  return (
    <div
      ref={containerRef}
      className="grow w-full max-w-3xl mx-auto px-4 pb-32 pt-24 overflow-y-auto"
    >
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`mb-8 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "user" ? (
            <div className="flex flex-col items-end gap-2 max-w-[80%]">
              {msg.image && (
                <img
                  src={msg.image}
                  alt="User upload"
                  className="max-w-full h-auto rounded-xl border border-[#333] mb-1 shadow-lg"
                  style={{ maxHeight: "200px" }}
                />
              )}
              {msg.text && (
                <div className="bg-[#1a1a1a] text-white px-5 py-3 rounded-[20px] rounded-br-sm border border-[#2a2a2a] shadow-sm">
                  {msg.text}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full">
              <div className="text-gray-100 text-[15px] leading-7 font-light tracking-wide">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <CodeBlock
                          code={String(children).replace(/\n$/, "")}
                          language={match[1]}
                        />
                      ) : (
                        <code
                          className="bg-[#1a1a1a] px-1.5 py-0.5 rounded text-sm font-mono text-gray-300"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p: ({ children }) => (
                      <p className="mb-4 last:mb-0">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-4 mb-4 space-y-2">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-4 mb-4 space-y-2">
                        {children}
                      </ol>
                    ),
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </motion.div>
      ))}

      {isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex justify-center my-8"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-full shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: "linear", repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-white fill-white/20" />
            </motion.div>
            <span className="text-sm font-medium text-white tracking-wide">
              Generating
            </span>
          </div>
        </motion.div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
