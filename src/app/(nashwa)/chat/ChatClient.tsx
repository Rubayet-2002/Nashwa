"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useToastStore } from "@/zustand/toastStore";
import { connectSocket } from "@/lib/socket-client";
import ChatBubble from "./ChatBubble";
import { useNotificationStore } from "@/zustand/notificationStore";
import { ChevronsRight, Send } from "@mynaui/icons-react";

interface Thread {
  shop_uid: string;
  shop_name: string;
  shop_avatar: string | null;
  last_message: string;
  last_message_time: string;
  isTemp?: boolean;
  unread_count?: number;
}

interface Message {
  message_uid: string;
  sender_uid: string;
  receiver_uid: string;
  shop_uid: string;
  sender_role: string;
  message_text: string;
  message_type: string;
  image_url: string | null;
  form_data: any;
  product_ref_uid: string | null;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

interface ChatClientProps {
  initialShopId: string | null;
  currentUserId: string;
  currentUsername: string;
}

export default function ChatClient({
  initialShopId,
  currentUserId,
  currentUsername,
}: ChatClientProps) {
  const addToast = useToastStore((s) => s.addToast);

  const setUnreadMessagesCount = useNotificationStore((s) => s.setUnreadMessagesCount);

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeShopId, setActiveShopId] = useState<string | null>(initialShopId);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok) {
        const threadShopIds = new Set(threads.map((t) => t.shop_uid));
        const filteredShops = (data.shops || []).filter(
          (s: any) => !threadShopIds.has(s.shop_uid)
        );
        setSearchResults(filteredShops);
      }
    } catch (err) {
      console.error("Search shops error:", err);
    } finally {
      setSearching(false);
    }
  };

  const fetchThreads = async (showLoading = true) => {
    if (showLoading) setLoadingThreads(true);
    try {
      const res = await fetch("/api/chat?listThreads=true");
      const data = await res.json();
      if (res.ok && data.success) {
        let fetchedThreads = data.threads || [];

        

        if (initialShopId && !fetchedThreads.some((t: Thread) => t.shop_uid === initialShopId)) {
          const tempThread: Thread = {
            shop_uid: initialShopId,
            shop_name: "New Chat Session",
            shop_avatar: null,
            last_message: "Start of your conversation",
            last_message_time: new Date().toISOString(),
            isTemp: true,
            unread_count: 0,
          };

          

          fetch(`/api/search?q=${encodeURIComponent(initialShopId)}`)
            .then((r) => r.json())
            .then((sd) => {
              const matchedShop = sd.shops?.find((s: any) => s.shop_uid === initialShopId);
              if (matchedShop) {
                setThreads((prev) =>
                  prev.map((t) =>
                    t.shop_uid === initialShopId
                      ? {
                          ...t,
                          shop_name: matchedShop.shop_name,
                          shop_avatar: matchedShop.profile_photo_url,
                        }
                      : t
                  )
                );
              }
            })
            .catch(() => {});

          fetchedThreads = [tempThread, ...fetchedThreads];
        }

        setThreads(fetchedThreads);
      }
    } catch (err) {
      console.error("Failed to fetch threads:", err);
    } finally {
      if (showLoading) setLoadingThreads(false);
    }
  };

  

  useEffect(() => {
    fetchThreads(true);
  }, [initialShopId]);

  

  useEffect(() => {
    const totalUnread = threads.reduce((sum, t) => sum + (t.unread_count || 0), 0);
    setUnreadMessagesCount(totalUnread);
  }, [threads, setUnreadMessagesCount]);

  

  useEffect(() => {
    const socket = connectSocket();

    const handleNewNotification = (data: any) => {
      if (data && data.title && data.title.startsWith("New message from")) {
        fetchThreads(false);
      }
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, []);

  

  useEffect(() => {
    if (!activeShopId) return;

    let active = true;
    const fetchChatMessages = async () => {
      try {
        const res = await fetch(
          `/api/chat?shopUid=${encodeURIComponent(activeShopId)}&customerUid=${encodeURIComponent(currentUserId)}&isSellerView=false`
        );
        const data = await res.json();
        if (active && res.ok && data.success) {
          setChatMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Failed to load chat log:", err);
      }
    };

    fetchChatMessages();

    

    const socket = connectSocket();
    socket.emit("join:chat", { shopId: activeShopId, userId: currentUserId });

    const handleNewMessage = (message: Message) => {
      if (active) {
        setChatMessages((prev) => {
          if (prev.some((m) => m.message_uid === message.message_uid)) return prev;
          return [...prev, message];
        });

        

        setThreads((prev) =>
          prev.map((t) =>
            t.shop_uid === activeShopId
              ? {
                  ...t,
                  last_message: message.message_text,
                  last_message_time: message.created_at,
                  isTemp: false,
                }
              : t
          )
        );
      }
    };

    socket.on("chat:message", handleNewMessage);

    return () => {
      active = false;
      socket.emit("leave:chat", { shopId: activeShopId, userId: currentUserId });
      socket.off("chat:message", handleNewMessage);
    };
  }, [activeShopId, currentUserId]);

  

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || sendingMessage || !activeShopId) return;

    setSendingMessage(true);
    const text = newMessageText.trim();
    setNewMessageText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          shopUid: activeShopId,
          messageText: text,
          messageType: "text",
          isShopMode: false,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast(data.error || "Failed to send message", "error");
        setNewMessageText(text);
      }
    } catch {
      addToast("Failed to send message due to network error", "error");
      setNewMessageText(text);
    } finally {
      setSendingMessage(false);
    }
  };

  const activeThread = threads.find((t) => t.shop_uid === activeShopId);

  return (
    <div className="w-full h-full flex bg-white overflow-hidden rounded-none">
      {/* Left Pane: Conversations */}
      <aside className="w-80 bg-white border-r border-[#dcdcdc] flex flex-col shrink-0">
        <div className="px-6 py-4 border-b border-[#dcdcdc] bg-gray-50/50 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-sm text-[#1a1a1a]">My Messages</h3>
            <p className="text-[10px] text-[#787878] font-light font-sans">Conversations with student entrepreneurs.</p>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search shops..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-none outline-none focus:border-[#BA5B55] bg-white text-[#1a1a1a]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 custom-scrollbar">
          {loadingThreads ? (
            <div className="text-center py-12 text-xs text-[#787878] font-light">Loading chats...</div>
          ) : (
            <>
              {/* Active Threads (Filtered locally) */}
              {(() => {
                const filteredThreads = threads.filter((t) =>
                  t.shop_name.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredThreads.length === 0 && searchQuery.trim() === "") {
                  return (
                    <div className="text-center py-16 text-xs text-[#787878] font-light font-sans">
                      No messages yet. Chat with shops directly from their product listings!
                    </div>
                  );
                }

                return filteredThreads.map((thread) => {
                  const isActive = activeShopId === thread.shop_uid;
                  const hasUnread = !!(thread.unread_count && thread.unread_count > 0);
                  return (
                    <button
                      key={thread.shop_uid}
                      onClick={() => {
                        if (isActive) {
                          setActiveShopId(null);
                        } else {
                          setActiveShopId(thread.shop_uid);
                          setChatMessages([]);
                          

                          setThreads((prev) =>
                            prev.map((t) =>
                              t.shop_uid === thread.shop_uid
                                ? { ...t, unread_count: 0 }
                                : t
                            )
                          );
                        }
                      }}
                      className={`w-full p-3 text-left flex gap-3 transition-all cursor-pointer border ${
                        isActive
                          ? "border-[#BA5B55] bg-[#BA5B55]/5 text-[#BA5B55]"
                          : "border-transparent border-b-gray-50 bg-white text-[#1a1a1a] hover:bg-gray-50/30"
                      }`}
                    >
                      <div className="relative h-10 w-10 rounded-full overflow-hidden border border-gray-100 bg-[#fdf0ef] flex items-center justify-center shrink-0">
                        {thread.shop_avatar ? (
                          <Image src={thread.shop_avatar} alt={thread.shop_name} fill className="object-cover" />
                        ) : (
                          <div className="text-xs uppercase font-bold text-[#BA5B55]">
                            {thread.shop_name.slice(0, 2)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-1.5 font-sans">
                          <h4 className={`text-xs truncate ${hasUnread ? "font-extrabold text-[#BA5B55]" : "font-bold"}`}>{thread.shop_name}</h4>
                          <span className="text-[9px] text-[#aaa] font-mono shrink-0">
                            {new Date(thread.last_message_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5 min-w-0">
                          <p className={`text-[10px] truncate ${hasUnread ? "font-bold text-gray-800" : "text-gray-500 font-light"}`}>{thread.last_message}</p>
                          {hasUnread && (
                            <span className="bg-[#BA5B55] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-none min-w-4 h-4 flex items-center justify-center shrink-0 animate-pulse">
                              {thread.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                });
              })()}

              {/* Remote Search Results (For new shops not currently in chat list) */}
              {searchQuery.trim() !== "" && (
                <div className="mt-4">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-[#BA5B55] uppercase tracking-wider border-b border-[#f5f5f5] mb-1">
                    Search new shops
                  </div>
                  {searching ? (
                    <div className="text-center py-4 text-xs text-[#787878] font-light">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((shop) => (
                      <button
                        key={shop.shop_uid}
                        onClick={() => {
                          if (!threads.some((t) => t.shop_uid === shop.shop_uid)) {
                            const tempThread: Thread = {
                              shop_uid: shop.shop_uid,
                              shop_name: shop.shop_name,
                              shop_avatar: shop.profile_photo_url,
                              last_message: "Start of your conversation",
                              last_message_time: new Date().toISOString(),
                              isTemp: true,
                            };
                            setThreads((prev) => [tempThread, ...prev]);
                          }
                          setActiveShopId(shop.shop_uid);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="w-full p-2.5 rounded-none border border-transparent text-left flex gap-2 hover:bg-[#BA5B55]/5 hover:border-[#BA5B55]/10 transition-all cursor-pointer"
                      >
                        <div className="relative h-8 w-8 rounded-full overflow-hidden border border-gray-100 bg-[#fdf0ef] flex items-center justify-center shrink-0">
                          {shop.profile_photo_url ? (
                            <img src={shop.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-[10px] uppercase font-bold text-[#BA5B55]">{shop.shop_name.slice(0, 2)}</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                          <h4 className="font-bold text-xs truncate text-[#1a1a1a]">{shop.shop_name}</h4>
                          <span className="text-[9px] text-[#787878] truncate leading-none mt-0.5">{shop.university_name || shop.shop_location}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-[#787878] font-light">No new shops found matching query.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Right Pane: Message Thread */}
      <main className="flex-1 bg-white flex flex-col overflow-hidden">
        {activeShopId && activeThread ? (
          <>
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-white shrink-0">
              <div className="relative h-9 w-9 rounded-full overflow-hidden border border-gray-100 bg-[#fdf0ef] flex items-center justify-center shrink-0">
                {activeThread.shop_avatar ? (
                  <Image src={activeThread.shop_avatar} alt={activeThread.shop_name} fill className="object-cover" />
                ) : (
                  <div className="text-xs uppercase font-bold text-[#BA5B55]">
                    {activeThread.shop_name.slice(0, 2)}
                  </div>
                )}
              </div>
              <div>
                <Link href={`/shop/${activeShopId}`} className="font-bold text-sm text-[#1a1a1a] hover:text-[#BA5B55] hover:underline transition-colors">
                  {activeThread.shop_name}
                </Link>
                <p className="text-[9px] text-gray-400 font-light mt-0.5">Student entrepreneur partner</p>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-white custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="text-center py-20 text-xs text-[#aaa] font-light">
                  No conversation history. Send a message to start chatting!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.sender_role === "customer";
                  return (
                    <div
                      key={msg.message_uid}
                      className={`flex flex-col max-w-[70%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                    >
                      <ChatBubble msg={msg} currentUserId={currentUserId} isSellerView={false} />
                      <span className="text-[8px] text-gray-400 mt-1 font-mono px-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white flex gap-2 shrink-0">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Type your message..."
                disabled={sendingMessage}
                className="flex-1 text-xs border border-gray-200 rounded-none px-4 py-2.5 outline-none focus:border-[#BA5B55] transition-all bg-gray-50/50"
              />
              <button
                type="submit"
                disabled={sendingMessage || !newMessageText.trim()}
                className="w-10 h-10 bg-[#BA5B55] hover:bg-[#a34e48] disabled:opacity-40 text-white rounded-none transition-colors flex items-center justify-center cursor-pointer shrink-0"
                title="Send"
              >
                <ChevronsRight size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-xs text-[#787878] font-light">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#BA5B55" strokeWidth="1" className="opacity-20 mb-3">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="font-semibold text-sm text-[#1a1a1a]">Select a Conversation</p>
            <p className="text-[10px] text-gray-400 mt-1">Pick a chat session from the sidebar threads list to start messaging.</p>
          </div>
        )}
      </main>
    </div>
  );
}
