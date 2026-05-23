"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";
import { useAuthStore } from "@/zustand/authStore";
import { updateShopBio, updateShopInfo } from "./actions";
import ImageUpload from "../../(nashwa)/component/ImageUpload";
import AddProductModal from "./AddProductModal";
import AddEventModal from "./AddEventModal";
import ProductCommentThread from "../../(nashwa)/component/ProductCommentThread";
import ProductReactionButton from "../../(nashwa)/component/ProductReactionButton";
import EventCountdown from "../../(nashwa)/component/EventCountdown";
import {
  Mail,
  Pin,
  EditOne,
  Plus,
  Refresh,
  Package,
  Store,
  Dollar,
  PlusCircle,
  Cog,
  ListCheck,
  ChatMessages,
  Send,
  CalendarArrowDown
} from "@mynaui/icons-react";

import { UNIVERSITIES as UNI_LIST } from "@/app/shop/lib/universities";

interface DashboardClientProps {
  shop: {
    shop_uid: string;
    shop_name: string;
    shop_email: string;
    shop_phone: string;
    shop_location: string;
    shop_description: string;
    shop_bio: string | null;
    cover_photo_url?: string | null;
    university_name?: string | null;
    profile_photo_url?: string | null;
  };
  user: {
    uid: string;
    username: string;
  };
  products: Array<{
    product_uid: string;
    title: string;
    description: string | null;
    price: string;
    currency: string;
    image_url: string | null;
  }>;
  recentOrders: Array<{
    order_uid: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    note: string | null;
    total_amount: string;
    currency: string;
    status: string;
    created_at: string;
    product_title: string | null;
  }>;
}

interface ChatThread {
  customer_uid: string;
  customer_name: string;
  customer_avatar: string | null;
  last_message: string;
  last_message_time: string;
}

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

interface CampusEvent {
  event_uid: string;
  shop_uid: string;
  title: string;
  description: string | null;
  image_url: string | null;
  host_name: string;
  venue: string;
  ends_at: string;
}

export default function DashboardClient({ shop, user, products = [], recentOrders = [] }: DashboardClientProps) {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const { setActiveShop } = useAuthStore();
  const [isPending, startTransition] = useTransition();

  // Tab State
  const [activeTab, setActiveTab] = useState<"posts" | "events" | "messages" | "settings">("posts");

  // Profile / settings state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(shop.shop_bio || "");

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoEmail, setInfoEmail] = useState(shop.shop_email);
  const [infoPhone, setInfoPhone] = useState(shop.shop_phone);
  const [infoLocation, setInfoLocation] = useState(shop.shop_location);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [showAssignUniversity, setShowAssignUniversity] = useState(false);

  // Feasts & Events state
  const [myEvents, setMyEvents] = useState<CampusEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Chat Messages state
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [activeThreadUid, setActiveThreadUid] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-open assign-university for legacy shops
  useEffect(() => {
    if (!shop.university_name) {
      setShowAssignUniversity(true);
    }
  }, [shop.university_name]);

  // Load events when Event tab is activated
  useEffect(() => {
    if (activeTab !== "events") return;

    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const res = await fetch(`/api/events?shopUid=${encodeURIComponent(shop.shop_uid)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setMyEvents(data.events || []);
        }
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [activeTab, shop.shop_uid]);

  // Load chat threads when Messages tab is activated
  useEffect(() => {
    if (activeTab !== "messages") return;

    const fetchThreads = async () => {
      setLoadingThreads(true);
      try {
        const res = await fetch(`/api/messages?listThreads=true&shopUid=${encodeURIComponent(shop.shop_uid)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setThreads(data.threads || []);
        }
      } catch (err) {
        console.error("Error fetching chat threads:", err);
      } finally {
        setLoadingThreads(false);
      }
    };
    fetchThreads();
  }, [activeTab, shop.shop_uid]);

  // Fetch messages log when a chat thread is selected
  useEffect(() => {
    if (activeTab !== "messages" || !activeThreadUid) return;

    let active = true;
    const fetchChatLog = async () => {
      try {
        const res = await fetch(
          `/api/messages?shopUid=${encodeURIComponent(shop.shop_uid)}&customerUid=${encodeURIComponent(activeThreadUid)}`
        );
        const data = await res.json();
        if (active && res.ok && data.success) {
          setChatMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Error fetching chat log:", err);
      }
    };

    fetchChatLog();
    const interval = setInterval(fetchChatLog, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [activeTab, activeThreadUid, shop.shop_uid]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    if (activeTab === "messages" && activeThreadUid) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab, activeThreadUid]);

  const handleSwitchToCustomer = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/switch-shop", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ activeShopUid: null }),
        });
        const result = await response.json();

        if (response.ok) {
          addToast("Switched to Customer Mode", "success");
          setActiveShop(null);
          router.replace(result.redirect || "/profile");
        } else {
          addToast(result.message || "Failed to switch mode", "error");
        }
      } catch (error) {
        addToast("Network error! Please try again.", "error");
      }
    });
  };

  const handleSaveBio = async () => {
    const res = await updateShopBio(shop.shop_uid, bioText);
    if (res.success) {
      addToast("Bio updated successfully!", "success");
      setIsEditingBio(false);
    } else {
      addToast(res.error || "Failed to update bio", "error");
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateShopInfo(shop.shop_uid, {
      email: infoEmail,
      phone: infoPhone,
      location: infoLocation,
    });
    if (res.success) {
      addToast("Shop information updated successfully!", "success");
      setIsEditingInfo(false);
    } else {
      addToast(res.error || "Failed to update information", "error");
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThreadUid) return;

    setSendingReply(true);
    const originalText = replyText;
    setReplyText("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          shopUid: shop.shop_uid,
          receiverUid: activeThreadUid,
          messageText: originalText,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setChatMessages((prev) => [...prev, data.message]);
        
        // Update threads list locally to show the last reply
        setThreads((prev) =>
          prev.map((t) =>
            t.customer_uid === activeThreadUid
              ? { ...t, last_message: originalText, last_message_time: new Date().toISOString() }
              : t
          )
        );
      } else {
        addToast(data.message || "Failed to send reply", "error");
        setReplyText(originalText);
      }
    } catch (err) {
      addToast("Network error, failed to send reply", "error");
      setReplyText(originalText);
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f6f4f2] text-[#1a1a1a] overflow-hidden">
      
      {/* 1. SIDEBAR DASHBOARD NAVIGATION MENU */}
      <aside className="w-64 bg-white border-r border-[#eadfdb] flex flex-col shrink-0">
        
        {/* Shop Business Branding */}
        <div className="p-6 border-b border-[#f4ecea] flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-2">
            <Store stroke={1.5} size={22} className="text-[#BA5B55]" />
            <span className="font-bold text-base tracking-wider text-[#1a1a1a]">
              NASHWA <span className="font-light text-[#BA5B55]">BIZ</span>
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-light mt-0.5 truncate">{shop.shop_name}</span>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-2xl transition-all text-left cursor-pointer ${
              activeTab === "posts"
                ? "bg-[#BA5B55] text-white shadow-sm"
                : "text-[#4f4f4f] hover:bg-[#BA5B55]/5 hover:text-[#BA5B55]"
            }`}
          >
            <Package size={16} />
            <span>My Posts</span>
          </button>

          <button
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-2xl transition-all text-left cursor-pointer ${
              activeTab === "events"
                ? "bg-[#BA5B55] text-white shadow-sm"
                : "text-[#4f4f4f] hover:bg-[#BA5B55]/5 hover:text-[#BA5B55]"
            }`}
          >
            <CalendarArrowDown size={16} />
            <span>Feast & Event</span>
          </button>

          <button
            onClick={() => setActiveTab("messages")}
            className={`flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-2xl transition-all text-left cursor-pointer ${
              activeTab === "messages"
                ? "bg-[#BA5B55] text-white shadow-sm"
                : "text-[#4f4f4f] hover:bg-[#BA5B55]/5 hover:text-[#BA5B55]"
            }`}
          >
            <ChatMessages size={16} />
            <span>Messages</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-2xl transition-all text-left cursor-pointer ${
              activeTab === "settings"
                ? "bg-[#BA5B55] text-white shadow-sm"
                : "text-[#4f4f4f] hover:bg-[#BA5B55]/5 hover:text-[#BA5B55]"
            }`}
          >
            <Cog size={16} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-[#f4ecea] bg-white shrink-0 flex flex-col gap-2">
          <button
            onClick={handleSwitchToCustomer}
            disabled={isPending}
            className="flex items-center justify-center gap-2 w-full px-3.5 py-2.5 border border-[#eadfdb] hover:border-[#BA5B55] hover:text-[#BA5B55] text-xs font-semibold text-[#4f4f4f] transition-all bg-white rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Refresh size={14} />
            <span>Switch to Customer</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN PANELS CONTAINER */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#f6f4f2]">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-[#eadfdb] flex items-center justify-between px-6 shrink-0 shadow-sm">
          <h2 className="text-base font-bold text-[#1a1a1a] uppercase tracking-wider">
            {activeTab === "posts" && "Shop Posts & Catalog"}
            {activeTab === "events" && "Campus Feasts & Events"}
            {activeTab === "messages" && "Customer Conversations"}
            {activeTab === "settings" && "Business Settings & Profile"}
          </h2>
          <div className="flex items-center gap-3 text-xs text-[#787878] font-light">
            <span>Logged in as <span className="font-semibold text-[#1a1a1a]">{user.username}</span></span>
          </div>
        </header>

        {/* Dynamic Panels */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* TAB 1: MY POSTS */}
          {activeTab === "posts" && (
            <>
              {/* Statistics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                <div className="bg-white border border-[#eadfdb] p-5 rounded-3xl shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-[#BA5B55]/10 rounded-2xl text-[#BA5B55]">
                    <Package size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#787878] font-semibold uppercase tracking-wider">Total Products</p>
                    <h3 className="text-xl font-bold mt-0.5">{products.length}</h3>
                  </div>
                </div>

                <div className="bg-white border border-[#eadfdb] p-5 rounded-3xl shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-[#BA5B55]/10 rounded-2xl text-[#BA5B55]">
                    <ListCheck size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#787878] font-semibold uppercase tracking-wider">Recent Orders</p>
                    <h3 className="text-xl font-bold mt-0.5">{recentOrders.length}</h3>
                  </div>
                </div>

                <div className="bg-white border border-[#eadfdb] p-5 rounded-3xl shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-[#BA5B55]/10 rounded-2xl text-[#BA5B55]">
                    <Dollar size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#787878] font-semibold uppercase tracking-wider">Total Revenue</p>
                    <h3 className="text-xl font-bold mt-0.5">৳0.00</h3>
                  </div>
                </div>
              </div>

              {/* Products Feed */}
              <div className="bg-white border border-[#eadfdb] p-6 rounded-3xl shadow-sm flex flex-col gap-6">
                <div className="flex items-center justify-between gap-3 border-b border-[#f4ecea] pb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#1a1a1a]">Products Feed</h3>
                    <p className="text-xs text-[#787878] mt-0.5">Manage live products and view customer comment sections.</p>
                  </div>
                  <button
                    onClick={() => setIsAddProductOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#eadfdb] hover:border-[#BA5B55] hover:text-[#BA5B55] transition-all text-xs font-semibold bg-white rounded-xl shadow-sm cursor-pointer"
                  >
                    <PlusCircle size={15} className="text-[#BA5B55]" />
                    <span>Add Product</span>
                  </button>
                </div>

                {products.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {products.map((product) => (
                      <div key={product.product_uid} className="rounded-2xl border border-[#eadfdb] bg-[#fdfdfc] p-5 flex flex-col gap-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[#BA5B55] font-semibold">Active listing</p>
                            <h4 className="mt-1 truncate text-lg font-bold text-[#1a1a1a]">{product.title}</h4>
                            <p className="mt-1 text-xs text-[#4f4f4f] leading-relaxed font-light line-clamp-2">{product.description || "No description added."}</p>
                          </div>
                          
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#eadfdb] bg-white relative">
                            {product.image_url ? (
                              <Image src={product.image_url} alt={product.title} fill className="object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-300">
                                <Package size={20} />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#555] font-light">
                          <span className="rounded-xl border border-[#efe4e2] bg-[#fdf8f6] px-3 py-1 text-[#BA5B55] font-semibold">
                            {product.currency} {Number(product.price).toFixed(2)}
                          </span>
                        </div>

                        <div className="mt-2">
                          <ProductReactionButton productUid={product.product_uid} />
                        </div>

                        <div className="mt-2 rounded-2xl border border-[#eadfdb] bg-white p-4">
                          <ProductCommentThread productUid={product.product_uid} mode="owner" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed border-[#eadfdb] rounded-2xl bg-[#fafafa]">
                    <Package stroke={1} size={44} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-[#787878] font-light">No products listed in your catalog yet.</p>
                    <button
                      onClick={() => setIsAddProductOpen(true)}
                      className="text-xs text-[#BA5B55] font-semibold hover:underline mt-1"
                    >
                      Create your first product listing &rarr;
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: FEASTS & EVENTS */}
          {activeTab === "events" && (
            <div className="bg-white border border-[#eadfdb] p-6 rounded-3xl shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between gap-3 border-b border-[#f4ecea] pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#1a1a1a]">Campus Events Management</h3>
                  <p className="text-xs text-[#787878] mt-0.5">Advertise winter feasts, student food stalls, and active carnivals.</p>
                </div>
                <button
                  onClick={() => setIsAddEventOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#eadfdb] hover:border-[#BA5B55] hover:text-[#BA5B55] transition-all text-xs font-semibold bg-white rounded-xl shadow-sm cursor-pointer"
                >
                  <PlusCircle size={15} className="text-[#BA5B55]" />
                  <span>Schedule Event</span>
                </button>
              </div>

              {loadingEvents ? (
                <div className="text-center py-12 text-xs text-[#787878] font-light">Loading events...</div>
              ) : myEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myEvents.map((event) => (
                    <div
                      key={event.event_uid}
                      className="group border border-[#eadfdb] bg-[#fdfdfc] rounded-3xl overflow-hidden shadow-sm flex flex-col"
                    >
                      <div className="relative h-40 w-full bg-[#fcf8f6]">
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#BA5B55]/40 bg-gradient-to-br from-[#fcf7f6] to-[#f4ecea]">
                            <Store size={32} />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-base text-[#1a1a1a] line-clamp-1">{event.title}</h4>
                          <p className="text-xs text-[#787878] mt-1 font-light line-clamp-2">{event.description}</p>
                        </div>

                        <div className="border-t border-[#f4ecea] pt-3 flex flex-col gap-1 text-xs text-[#555] font-light">
                          <div><span className="font-semibold text-[#BA5B55]">Campus:</span> {event.host_name}</div>
                          <div><span className="font-semibold text-[#BA5B55]">Venue:</span> {event.venue}</div>
                        </div>

                        <div className="border-t border-[#fcf8f6] pt-3 flex items-center justify-between mt-1">
                          <EventCountdown endsAt={event.ends_at} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-[#eadfdb] rounded-2xl bg-[#fafafa]">
                  <PlusCircle stroke={1} size={44} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-[#787878] font-light">No campus events listed by your shop.</p>
                  <button
                    onClick={() => setIsAddEventOpen(true)}
                    className="text-xs text-[#BA5B55] font-semibold hover:underline mt-1"
                  >
                    Schedule your first winter carnival event &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOMER MESSAGES (DUAL PANE CHAT WINDOW) */}
          {activeTab === "messages" && (
            <div className="bg-white border border-[#eadfdb] rounded-3xl shadow-sm flex flex-1 overflow-hidden h-[calc(100vh-12rem)]">
              
              {/* Left Pane: Customer Threads list */}
              <div className="w-80 border-r border-[#eadfdb] flex flex-col overflow-hidden shrink-0">
                <div className="p-4 border-b border-[#f4ecea] bg-[#fafafa]">
                  <h3 className="font-bold text-sm text-[#1a1a1a]">Conversations</h3>
                  <p className="text-[11px] text-[#787878] font-light mt-0.5">Direct chat logs from platform customers.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
                  {loadingThreads ? (
                    <div className="text-center py-8 text-xs text-[#787878] font-light">Loading conversations...</div>
                  ) : threads.length > 0 ? (
                    threads.map((thread) => {
                      const isActive = activeThreadUid === thread.customer_uid;
                      return (
                        <button
                          key={thread.customer_uid}
                          onClick={() => {
                            setActiveThreadUid(thread.customer_uid);
                            setChatMessages([]);
                          }}
                          className={`w-full p-3 rounded-2xl border text-left flex gap-3 transition-all cursor-pointer ${
                            isActive
                              ? "bg-[#BA5B55]/10 border-[#BA5B55]/40 text-[#BA5B55]"
                              : "bg-[#fdfdfc] border-[#e8e1df] text-[#1a1a1a] hover:border-[#BA5B55]/40"
                          }`}
                        >
                          <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-gray-100 bg-[#f4ecea] flex items-center justify-center shrink-0">
                            {thread.customer_avatar ? (
                              <img src={thread.customer_avatar} alt={thread.customer_name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="text-xs uppercase font-bold text-[#BA5B55]">{thread.customer_name.slice(0, 2)}</div>
                            )}
                          </div>
                          
                          <div className="min-w-0 flex-1 flex flex-col justify-between">
                            <div className="flex items-center justify-between gap-1.5">
                              <h4 className="font-bold text-xs truncate">{thread.customer_name}</h4>
                              <span className="text-[9px] text-gray-400 font-mono">
                                {new Date(thread.last_message_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-light truncate mt-0.5">{thread.last_message}</p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-xs text-[#787878] font-light">
                      No active customer chat requests yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Pane: Active Chat Conversation Log */}
              <div className="flex-1 flex flex-col bg-[#fdfbf9] overflow-hidden">
                {activeThreadUid ? (
                  <>
                    {/* Chat Box Header */}
                    <div className="px-5 py-3 border-b border-[#eadfdb] bg-white flex items-center gap-3 shadow-sm">
                      <div className="relative h-9 w-9 rounded-xl overflow-hidden border border-gray-100 bg-[#f4ecea] flex items-center justify-center shrink-0">
                        {threads.find(t => t.customer_uid === activeThreadUid)?.customer_avatar ? (
                          <img
                            src={threads.find(t => t.customer_uid === activeThreadUid)?.customer_avatar || ""}
                            alt="avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-xs uppercase font-bold text-[#BA5B55]">
                            {threads.find(t => t.customer_uid === activeThreadUid)?.customer_name.slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#1a1a1a]">
                          {threads.find(t => t.customer_uid === activeThreadUid)?.customer_name}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-light">Connected with shop</p>
                      </div>
                    </div>

                    {/* Messages Scroll Stream */}
                    <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
                      {chatMessages.map((msg) => {
                        const isMe = msg.sender_uid === user.uid;
                        return (
                          <div
                            key={msg.message_uid}
                            className={`flex flex-col max-w-[70%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                          >
                            <div
                              className={`px-3.5 py-2.5 text-xs rounded-2xl shadow-sm leading-relaxed ${
                                isMe
                                  ? "bg-[#BA5B55] text-white rounded-br-none"
                                  : "bg-white border border-[#eadfdb] text-[#1a1a1a] rounded-bl-none"
                              }`}
                            >
                              {msg.message_text}
                            </div>
                            <span className="text-[9px] text-gray-400 mt-1 font-mono px-1">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Reply Form */}
                    <form onSubmit={handleSendReply} className="p-4 border-t border-[#eadfdb] bg-white flex gap-2 shrink-0">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type reply to customer..."
                        disabled={sendingReply}
                        className="flex-1 text-xs border border-[#eadfdb] rounded-2xl px-4 py-2.5 outline-none focus:border-[#BA5B55] transition-all disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={sendingReply || !replyText.trim()}
                        className="p-2.5 bg-[#BA5B55] hover:bg-[#BA5B55]/90 disabled:bg-gray-200 text-white rounded-full transition-colors flex items-center justify-center cursor-pointer shrink-0"
                        title="Send reply"
                      >
                        <Send size={14} />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-[#787878] font-light">
                    <ChatMessages size={36} className="text-[#BA5B55]/20 mb-2" />
                    <p className="font-semibold text-sm">Select a Conversation</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Pick a customer thread from the left menu to read logs and send replies.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === "settings" && (
            <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
              
              {/* Left Column: Image configuration */}
              <div className="w-full lg:w-[26rem] shrink-0 flex flex-col gap-6">
                
                {/* Cover Banner */}
                <div className="bg-white border border-[#eadfdb] rounded-3xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-[#f4ecea]">
                    <h3 className="text-xs font-semibold text-[#BA5B55] uppercase tracking-wider">Cover photo</h3>
                    <p className="text-[11px] text-gray-400 font-light mt-0.5">Banner shown at the top of your shop profile page.</p>
                  </div>
                  
                  <div className="relative h-44 w-full bg-[#f3f4f6] border-b border-[#eadfdb]">
                    {shop.cover_photo_url ? (
                      <Image src={shop.cover_photo_url} alt="Shop Cover" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#fcf7f6] to-[#f4ece9] text-[#BA5B55] text-xs font-semibold uppercase tracking-[0.2em]">
                        No Cover Banner Uploaded
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <ImageUpload
                      label="Replace cover image"
                      folder="nashwa_shop_covers"
                      saveEndpoint="/shop/api/update-cover"
                      extraBody={{ shopUid: shop.shop_uid }}
                      onUploaded={() => router.refresh()}
                    />
                  </div>
                </div>

                {/* Profile avatar */}
                <div className="bg-white border border-[#eadfdb] rounded-3xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-[#f4ecea]">
                    <h3 className="text-xs font-semibold text-[#BA5B55] uppercase tracking-wider">Profile photo</h3>
                    <p className="text-[11px] text-gray-400 font-light mt-0.5">Avatar shown beside your shop title and feed headers.</p>
                  </div>
                  
                  <div className="flex items-center justify-center py-6 bg-[#fdfcfb] border-b border-[#eadfdb]">
                    <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
                      {shop.profile_photo_url ? (
                        <Image src={shop.profile_photo_url} alt="Shop Avatar" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-[#BA5B55] text-xs font-bold uppercase tracking-wider">
                          Shop
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <ImageUpload
                      label="Replace profile image"
                      folder="nashwa_shop_profiles"
                      saveEndpoint="/shop/api/update-profile"
                      extraBody={{ shopUid: shop.shop_uid }}
                      onUploaded={() => router.refresh()}
                    />
                  </div>
                </div>

              </div>

              {/* Right Column: Bio and Contact Info forms */}
              <div className="flex-1 w-full flex flex-col gap-6">
                
                {/* Bio Details */}
                <div className="bg-white border border-[#eadfdb] p-5 rounded-3xl shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-[#f4ecea] pb-2">
                    <span className="text-xs font-semibold text-[#BA5B55] uppercase tracking-wider">Shop Bio</span>
                    {!isEditingBio && (
                      <button
                        onClick={() => setIsEditingBio(true)}
                        className="text-[#787878] hover:text-[#BA5B55] transition-colors cursor-pointer"
                        title="Edit Bio"
                      >
                        <EditOne size={16} />
                      </button>
                    )}
                  </div>

                  {isEditingBio ? (
                    <div className="flex flex-col gap-2.5">
                      <textarea
                        value={bioText}
                        onChange={(e) => setBioText(e.target.value)}
                        placeholder="Tell students and customers about your shop specialties, custom designs, or student deals..."
                        rows={4}
                        className="w-full text-xs p-3 border border-[#eadfdb] rounded-2xl focus:border-[#BA5B55] outline-none resize-none font-light bg-[#fafafa]"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setBioText(shop.shop_bio || "");
                            setIsEditingBio(false);
                          }}
                          className="px-3 py-1.5 text-xs border border-[#eadfdb] rounded-xl hover:bg-gray-50 text-[#787878] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveBio}
                          className="px-4 py-1.5 text-xs bg-[#BA5B55] text-white hover:bg-[#BA5B55]/90 rounded-xl cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : bioText ? (
                    <p className="text-xs text-[#4f4f4f] leading-relaxed font-light">{bioText}</p>
                  ) : (
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="flex items-center justify-center gap-1.5 py-4 border border-dashed border-[#eadfdb] hover:border-[#BA5B55] hover:text-[#BA5B55] text-xs font-semibold text-[#787878] transition-all bg-[#fafafa] rounded-2xl cursor-pointer"
                    >
                      <Plus size={16} />
                      <span>Add Bio</span>
                    </button>
                  )}
                </div>

                {/* About Info & Contact Details */}
                <div className="bg-white border border-[#eadfdb] p-5 rounded-3xl shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-[#f4ecea] pb-2">
                    <span className="text-xs font-semibold text-[#BA5B55] uppercase tracking-wider">About Info & Contact</span>
                    <button
                      onClick={() => setIsEditingInfo(true)}
                      className="text-[#787878] hover:text-[#BA5B55] transition-colors flex items-center gap-1 text-xs cursor-pointer font-semibold"
                    >
                      <EditOne size={14} />
                      <span>Edit Info</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-3.5 text-xs text-[#4f4f4f] font-light">
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-[#BA5B55] shrink-0" />
                      <span className="truncate" title={shop.shop_email}>{shop.shop_email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Store size={16} className="text-[#BA5B55] shrink-0" />
                      <span>{shop.shop_phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Pin size={16} className="text-[#BA5B55] shrink-0" />
                      <span>{shop.shop_location}</span>
                    </div>
                    {shop.university_name && (
                      <div className="flex items-center gap-3 border-t border-[#fcf8f6] pt-3 mt-1">
                        <Cog size={16} className="text-[#BA5B55] shrink-0" />
                        <span className="font-semibold text-[#BA5B55]">{shop.university_name}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </main>

      {/* EDIT INFO MODAL */}
      {isEditingInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#eadfdb] w-full max-w-md p-6 shadow-2xl rounded-3xl flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold">Edit Shop Information</h3>
              <p className="text-xs text-[#787878] font-light mt-0.5">
                Update the public contact details for your business.
              </p>
            </div>

            <form onSubmit={handleSaveInfo} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#787878]">Shop Email</label>
                <input
                  type="email"
                  value={infoEmail}
                  onChange={(e) => setInfoEmail(e.target.value)}
                  required
                  className="w-full text-sm p-2 border border-[#eadfdb] focus:border-[#BA5B55] outline-none font-light rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#787878]">Shop Phone</label>
                <input
                  type="text"
                  value={infoPhone}
                  onChange={(e) => setInfoPhone(e.target.value)}
                  required
                  className="w-full text-sm p-2 border border-[#eadfdb] focus:border-[#BA5B55] outline-none font-light rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#787878]">Location</label>
                <input
                  type="text"
                  value={infoLocation}
                  onChange={(e) => setInfoLocation(e.target.value)}
                  required
                  className="w-full text-sm p-2 border border-[#eadfdb] focus:border-[#BA5B55] outline-none font-light rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setInfoEmail(shop.shop_email);
                    setInfoPhone(shop.shop_phone);
                    setInfoLocation(shop.shop_location);
                    setIsEditingInfo(false);
                  }}
                  className="px-4 py-2 border border-[#eadfdb] hover:bg-gray-50 text-xs font-semibold text-[#787878] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] text-white text-xs font-semibold transition-all rounded-xl cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {isAddProductOpen && (
        <AddProductModal
          shopUid={shop.shop_uid}
          onClose={() => setIsAddProductOpen(false)}
          onCreated={() => router.refresh()}
        />
      )}

      {/* ADD EVENT MODAL */}
      {isAddEventOpen && (
        <AddEventModal
          shopUid={shop.shop_uid}
          onClose={() => setIsAddEventOpen(false)}
          onCreated={() => {
            // Force active events tab to reload
            setActiveTab("events");
          }}
        />
      )}

      {/* Assign University modal for legacy shops */}
      {(!shop.university_name || shop.university_name === null) && showAssignUniversity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAssignUniversity(false)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden border border-[#eadfdb] bg-white shadow-2xl rounded-3xl">
            <div className="border-b border-[#eadfdb] px-6 py-5 bg-[#fdfcfb]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#BA5B55]">University</p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-[#1a1a1a]">Select your university</h3>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto">
              <div className="grid gap-2">
                {UNI_LIST.map((u) => (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/shop/api/set-shop-university', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                          body: JSON.stringify({ shopUid: shop.shop_uid, universityUid: u.uid }),
                        });
                        const j = await res.json();
                        if (res.ok) {
                          addToast('University assigned successfully!', 'success');
                          router.refresh();
                        } else {
                          addToast(j.message || 'Failed to assign university', 'error');
                        }
                      } catch (err) {
                        addToast('Network error', 'error');
                      } finally {
                        setShowAssignUniversity(false);
                      }
                    }}
                    className="w-full text-left px-4 py-2.5 border border-[#eadfdb] hover:border-[#BA5B55] hover:text-[#BA5B55] text-xs font-semibold rounded-xl bg-white shadow-sm transition-all"
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#eadfdb] bg-white px-6 py-4">
              <button type="button" onClick={() => setShowAssignUniversity(false)} className="px-4 py-2 border border-[#eadfdb] hover:bg-gray-50 text-xs font-semibold text-[#787878] rounded-xl cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
