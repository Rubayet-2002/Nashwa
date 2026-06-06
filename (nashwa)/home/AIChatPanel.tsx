"use client";

import { ChevronsRight, DazeGhost } from "@mynaui/icons-react";
import { useState, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Nashwa AI I can help you find products, shops, events, or answer questions about our platform. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const d = await res.json();
      setMessages([
        ...next,
        {
          role: "assistant",
          content: d.reply || "Sorry, I couldn't process that.",
        },
      ]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        80,
      );
    }
  };

  return (
    <div className="flex flex-col overflow-hidden bg-white h-55">
      {/* Header */}
      <div className="p-3 bg-white flex justify-between items-center border-b border-[#e8e8e8]">
        <div className="flex justify-center items-center gap-2">
          {" "}
          <div className="w-6 h-6 border-2 border-[#787878] rounded-md  flex items-center justify-center">
            <DazeGhost size={18} className="mb-px"/>
          </div>
          <p className="text-xs font-semibold text-[#787878]">Nashwa AI</p>
        </div>
        <div className="text-[9px]  text-green-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-green-300 shrink-0">
          <p>Online</p>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2 min-h-0">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3 py-1.5 text-[11px] leading-relaxed border ${
                m.role === "user"
                  ? "bg-[#BA5B55] border-[#BA5B55] text-white rounded-[12px_12px_3px_12px]"
                  : "bg-gray-50 border-[#e2e2e2] text-[#1a1a1a] rounded-[12px_12px_12px_3px]"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 bg-gray-50 border border-[#e2e2e2] rounded-[12px_12px_12px_3px] flex gap-1 items-center">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  style={{ animationDelay: `${d}ms` }}
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full inline-block animate-bounce"
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Form */}
      <div className="p-2 border-t border-[#e8e8e8] bg-white flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask me anything..."
          className="flex-1 px-3 py-1.5 text-xs border border-[#dcdcdc] outline-none bg-white focus:bg-white focus:border-[#BA5B55] transition-all text-[#1a1a1a]"
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="px-3.5 bg-[#BA5B55] text-white border border-[#BA5B55] rounded-lg cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-[#9e4f4a] hover:border-[#9e4f4a]"
        >
<ChevronsRight  size={16}/>
        </button>
      </div>
    </div>
  );
}
