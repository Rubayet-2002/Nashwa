"use client";

import { useState, useEffect, useRef } from "react";
import { ChatMessages, X, Send, Store } from "@mynaui/icons-react";
import { useToastStore } from "@/zustand/toastStore";
import Image from "next/image";

interface Message {
  message_uid: string;
  sender_uid: string;
  receiver_uid: string;
  shop_uid: string;
  message_text: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

interface ContactSellerWidgetProps {
  shopUid: string;
  shopName: string;
  shopOwnerUid: string;
  shopAvatar: string | null;
  currentUser: { uid: string; username: string } | null;
}

export default function ContactSellerWidget({
  shopUid,
  shopName,
  shopOwnerUid,
  shopAvatar,
  currentUser,
}: ContactSellerWidgetProps) {
  const addToast = useToastStore((s) => s.addToast);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch message history when chat is opened
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    let active = true;
    const fetchChatHistory = async () => {
      try {
        const res = await fetch(`/api/messages?shopUid=${encodeURIComponent(shopUid)}`);
        const data = await res.json();
        if (active && res.ok && data.success) {
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Error loading chat:", err);
      }
    };

    fetchChatHistory();
    // Poll every 5 seconds for simple live chat updates
    const interval = setInterval(fetchChatHistory, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isOpen, shopUid, currentUser]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleOpenChat = () => {
    if (!currentUser) {
      addToast("Please log in to contact the seller.", "error");
      return;
    }
    if (currentUser.uid === shopOwnerUid) {
      addToast("This is your shop! Customers can message you here.", "error");
      return;
    }
    setIsOpen(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    setLoading(true);
    const originalText = inputText;
    setInputText("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          shopUid,
          receiverUid: shopOwnerUid,
          messageText: originalText,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        addToast(data.message || "Failed to send message", "error");
        setInputText(originalText);
      }
    } catch (err) {
      addToast("Failed to send message due to network error", "error");
      setInputText(originalText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Contact Seller Button */}
      <button
        onClick={handleOpenChat}
        type="button"
        className="px-4 py-2 bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] text-white transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
      >
        <ChatMessages size={14} />
        <span>Contact Seller</span>
      </button>

      {/* Slide-out Chat Drawer Popup */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[450px] bg-white border border-[#eadfdb] shadow-2xl flex flex-col rounded-3xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header Row */}
          <div className="bg-[#BA5B55] text-white px-4 py-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative h-8 w-8 rounded-xl overflow-hidden border border-white/20 bg-white/10 flex justify-center items-center shrink-0">
                {shopAvatar ? (
                  <Image src={shopAvatar} alt={shopName} fill className="object-cover" />
                ) : (
                  <Store size={14} className="text-white" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-sm truncate">{shopName}</h4>
                <p className="text-[10px] text-white/80 font-light truncate">Direct messaging</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer"
              title="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto bg-[#fdfbf9] flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-[#787878] font-light">
                <ChatMessages size={24} className="text-[#BA5B55]/30 mb-1.5" />
                <p>Start chatting with <span className="font-semibold">{shopName}</span>!</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Send a message to ask about products, deals, or delivery.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_uid === currentUser?.uid;
                return (
                  <div
                    key={msg.message_uid}
                    className={`flex flex-col max-w-[80%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                  >
                    <div
                      className={`px-3 py-2 text-xs rounded-2xl shadow-sm ${
                        isMe
                          ? "bg-[#BA5B55] text-white rounded-br-none"
                          : "bg-white border border-[#e8e1df] text-[#1a1a1a] rounded-bl-none"
                      }`}
                    >
                      {msg.message_text}
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 font-light font-mono px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-[#eadfdb] bg-white flex gap-2 items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 text-xs border border-[#e8e1df] rounded-2xl px-3.5 py-2 outline-none focus:border-[#BA5B55] transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-2 bg-[#BA5B55] hover:bg-[#BA5B55]/90 disabled:bg-gray-200 text-white rounded-full transition-colors flex items-center justify-center cursor-pointer shrink-0"
              title="Send message"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
