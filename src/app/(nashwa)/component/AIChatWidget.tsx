"use client";

import { useState } from "react";

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg = { role: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`/api/ai-chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setMessages((m) => [...m, { role: "assistant", text: data.message || "AI error" }]);
        setLoading(false);
        return;
      }

      // append an empty assistant message, then stream into it
      setMessages((m) => [...m, { role: "assistant", text: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: rDone } = await reader.read();
        done = rDone;
        if (value) {
          const chunk = decoder.decode(value);
          setMessages((current) => {
            const last = current[current.length - 1];
            const updated = [...current.slice(0, -1), { ...last, text: last.text + chunk }];
            return updated;
          });
        }
      }
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: "Network error" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        aria-label="Open chat"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#BA5B55] text-white shadow-lg"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed left-0 top-0 z-50 flex h-full w-full items-end justify-end bg-black/30">
          <div className="m-4 w-full max-w-md rounded bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Nashwa AI Assistant</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => { setMessages([]); setOpen(false); }} className="text-xs text-[#666]">Close</button>
              </div>
            </div>

            <div className="mt-3 max-h-[50vh] space-y-2 overflow-auto">
              {messages.length === 0 && <p className="text-sm text-[#666]">Ask me about shops, products, or campus trends.</p>}
              {messages.map((m, i) => (
                <div key={i} className={`rounded px-3 py-2 ${m.role === "user" ? "bg-[#f3f3f3] text-right" : "bg-[#eef6ff]"}`}>
                  <div className="text-xs text-[#444]">{m.text}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
                placeholder="Ask where to find a shop, or what's the most followed shop..."
                className="min-w-0 flex-1 rounded border px-3 py-2 text-sm outline-none"
              />
              <button onClick={send} disabled={loading} className="rounded bg-[#BA5B55] px-3 py-2 text-xs text-white">
                {loading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
