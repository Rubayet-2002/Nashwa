"use client";

import { useState, useTransition, useEffect, useRef, ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";
import { useAuthStore } from "@/zustand/authStore";
import { updateShopBio, updateShopInfo } from "./actions";
import ImageUpload from "@/components/ImageUpload";
import ImageCropModal from "@/components/ImageCropModal";
import Lightbox from "@/components/Lightbox";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal";
import AddEventModal from "./AddEventModal";
import ProductCommentThread from "@/app/(nashwa)/home/ProductCommentThread";
import ProductReactionButton from "@/components/ProductReactionButton";
import EventCountdown from "@/components/EventCountdown";
import ChatBubble from "@/app/(nashwa)/chat/ChatBubble";
import JoinUniversityModal from "./JoinUniversityModal";
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
  CalendarArrowDown,
  X,
  Bell,
  Eye,
  Building,
  ChevronsRight
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
    platform_debt?: string | number | null;
    is_blocked?: boolean | null;
    total_revenue?: string | number | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
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
    inside_delivery_charge?: any;
    outside_delivery_charge?: any;
    free_on_campus_delivery?: boolean;
    reaction_count?: number;
    comment_count?: number;
    original_price?: string | number | null;
    discount_percent?: string | number | null;
    category?: string | null;
    product_type?: string;
    variants?: any;
    image_urls?: string[];
  }>;
  recentOrders: Array<{
    order_uid: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    note: string | null;
    delivery_address: string;
    city: string | null;
    postal_code: string | null;
    delivery_type: string;
    payment_method: string;
    subtotal: string;
    delivery_charge: string;
    total_amount: string;
    currency: string;
    status: string;
    created_at: string;
    items: Array<{
      id: number;
      product_uid: string;
      product_title: string;
      variant: string | null;
      unit_price: string;
      quantity: number;
      line_total: string;
    }>;
  }>;
}

interface ChatThread {
  customer_uid: string;
  customer_name: string;
  customer_avatar: string | null;
  last_message: string;
  last_message_time: string;
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
  const [payingDebt, setPayingDebt] = useState(false);

  const handlePayDebt = async () => {
    if (payingDebt) return;
    setPayingDebt(true);
    addToast("Processing payment...", "success");
    try {
      const res = await fetch("/shop/api/pay-debt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ shopUid: shop.shop_uid }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.message || "Payment successful!", "success");
        router.refresh();
      } else {
        addToast(data.error || "Payment failed", "error");
      }
    } catch (err) {
      addToast("Network error", "error");
    } finally {
      setPayingDebt(false);
    }
  };

  // Image Upload / Cropping / Lightbox States
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"cover" | "profile" | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxType, setLightboxType] = useState<"cover" | "profile" | null>(null);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isProfileUploading, setIsProfileUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const handleRemovePhoto = async (type: "cover" | "profile") => {
    if (!confirm(`Are you sure you want to remove the shop's ${type} photo?`)) return;
    setLightboxSrc(null);
    setLightboxType(null);

    const apiPath = type === "profile" ? "/shop/api/update-profile" : "/shop/api/update-cover";
    try {
      const res = await fetch(apiPath, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ shopUid: shop.shop_uid }),
      });
      if (res.ok) {
        addToast(`Shop ${type} photo removed.`, "success");
        router.refresh();
      } else {
        const d = await res.json();
        addToast(d.message || "Failed to remove photo", "error");
      }
    } catch {
      addToast("Network error", "error");
    }
  };

  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handlePhotoSelected = (e: ChangeEvent<HTMLInputElement>, type: "cover" | "profile") => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setCropImageSrc(reader.result as string);
        setCropType(type);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    setCropImageSrc(null);
    const type = cropType;
    setCropType(null);

    const croppedBlob = dataURLtoBlob(croppedDataUrl);

    if (type === "cover") {
      setIsCoverUploading(true);
      try {
        const url = await uploadImageToCloudinary(croppedBlob, "nashwa_shop_covers");
        const res = await fetch("/shop/api/update-cover", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ imageUrl: url, shopUid: shop.shop_uid }),
        });
        if (res.ok) {
          addToast("Cover photo updated successfully!", "success");
          router.refresh();
        } else {
          const d = await res.json();
          addToast(d.message || "Failed to save cover photo", "error");
        }
      } catch (err: any) {
        addToast(err.message || "Failed to upload cover photo", "error");
      } finally {
        setIsCoverUploading(false);
        if (coverInputRef.current) coverInputRef.current.value = "";
      }
    } else if (type === "profile") {
      setIsProfileUploading(true);
      try {
        const url = await uploadImageToCloudinary(croppedBlob, "nashwa_shop_profiles");
        const res = await fetch("/shop/api/update-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ imageUrl: url, shopUid: shop.shop_uid }),
        });
        if (res.ok) {
          addToast("Profile photo updated successfully!", "success");
          router.refresh();
        } else {
          const d = await res.json();
          addToast(d.message || "Failed to save profile photo", "error");
        }
      } catch (err: any) {
        addToast(err.message || "Failed to upload profile photo", "error");
      } finally {
        setIsProfileUploading(false);
        if (profileInputRef.current) profileInputRef.current.value = "";
      }
    }
  };

  // Tab State
  const [activeTab, setActiveTab] = useState<"posts" | "events" | "messages" | "settings" | "orders" | "notifications">("posts");

  const [ordersList, setOrdersList] = useState(recentOrders);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchShopNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await fetch(`/api/notifications?shopUid=${encodeURIComponent(shop.shop_uid)}`);
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Error fetching shop notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markShopNotificationsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ shopUid: shop.shop_uid }),
      });
    } catch (err) {
      console.error("Error marking shop notifications as read:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "notifications") {
      fetchShopNotifications();
      markShopNotificationsRead();
      window.dispatchEvent(new Event("shop-notifications:read"));
    }
  }, [activeTab, shop.shop_uid]);

  useEffect(() => {
    const handleOpenNotifications = () => setActiveTab("notifications");
    const handleOpenSettings = () => setActiveTab("settings");
    const handleOpenOrders = () => setActiveTab("orders");
    const handleOpenPosts = () => setActiveTab("posts");

    window.addEventListener("shop-notifications:open", handleOpenNotifications);
    window.addEventListener("shop-settings:open", handleOpenSettings);
    window.addEventListener("shop-orders:open", handleOpenOrders);
    window.addEventListener("shop-posts:open", handleOpenPosts);

    return () => {
      window.removeEventListener("shop-notifications:open", handleOpenNotifications);
      window.removeEventListener("shop-settings:open", handleOpenSettings);
      window.removeEventListener("shop-orders:open", handleOpenOrders);
      window.removeEventListener("shop-posts:open", handleOpenPosts);
    };
  }, []);

  useEffect(() => {
    setOrdersList(recentOrders);
  }, [recentOrders]);

  const handleUpdateOrderStatus = async (orderUid: string, newStatus: "confirmed" | "completed" | "cancelled") => {
    if (!confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;

    try {
      const res = await fetch(`/api/orders/${orderUid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(`Order status updated to ${newStatus}!`, "success");
        setOrdersList((prev) =>
          prev.map((order) =>
            order.order_uid === orderUid ? { ...order, status: newStatus } : order
          )
        );
        router.refresh();
      } else {
        addToast(data.error || "Failed to update order status", "error");
      }
    } catch {
      addToast("Network error. Failed to update order status.", "error");
    }
  };

  // Profile / settings state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(shop.shop_bio || "");

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoEmail, setInfoEmail] = useState(shop.shop_email);
  const [infoPhone, setInfoPhone] = useState(shop.shop_phone);
  const [infoLocation, setInfoLocation] = useState(shop.shop_location);
  const [infoInstagram, setInfoInstagram] = useState(shop.instagram_url || "");
  const [infoFacebook, setInfoFacebook] = useState(shop.facebook_url || "");

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
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

  // Order Form Creator State
  const [showOrderFormCreator, setShowOrderFormCreator] = useState(false);
  const [selectedProductUid, setSelectedProductUid] = useState("");
  const [orderFormQty, setOrderFormQty] = useState(1);
  const [orderFormPrice, setOrderFormPrice] = useState("");

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

  // Update order form price when a product is selected
  useEffect(() => {
    if (selectedProductUid && products) {
      const selectedProduct = products.find((p) => p.product_uid === selectedProductUid);
      if (selectedProduct) {
        setOrderFormPrice(selectedProduct.price);
      }
    }
  }, [selectedProductUid, products]);

  const fetchThreads = async (showLoading = true) => {
    if (showLoading) setLoadingThreads(true);
    try {
      const res = await fetch(`/api/chat?listThreads=true&shopUid=${encodeURIComponent(shop.shop_uid)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setThreads(data.threads || []);
      }
    } catch (err) {
      console.error("Error fetching chat threads:", err);
    } finally {
      if (showLoading) setLoadingThreads(false);
    }
  };

  // Load chat threads when Messages tab is activated
  useEffect(() => {
    if (activeTab !== "messages") return;
    fetchThreads(true);
  }, [activeTab, shop.shop_uid]);

  // Listen to global socket notifications to re-fetch threads in real-time
  useEffect(() => {
    if (activeTab !== "messages") return;

    const { connectSocket } = require("@/lib/socket-client");
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
  }, [activeTab, shop.shop_uid]);

  // Fetch messages log when a chat thread is selected
  useEffect(() => {
    if (activeTab !== "messages" || !activeThreadUid) return;

    let active = true;
    const fetchChatLog = async () => {
      try {
        const res = await fetch(
          `/api/chat?shopUid=${encodeURIComponent(shop.shop_uid)}&customerUid=${encodeURIComponent(activeThreadUid)}&isSellerView=true`
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

    const { connectSocket } = require("@/lib/socket-client");
    const socket = connectSocket();
    socket.emit("join:chat", { shopId: shop.shop_uid, userId: activeThreadUid });

    const handleNewMessage = (message: Message) => {
      if (active) {
        setChatMessages((prev) => {
          if (prev.some((m) => m.message_uid === message.message_uid)) return prev;
          return [...prev, message];
        });

        setThreads((prev) =>
          prev.map((t) =>
            t.customer_uid === activeThreadUid
              ? { ...t, last_message: message.message_text, last_message_time: message.created_at }
              : t
          )
        );
      }
    };

    socket.on("chat:message", handleNewMessage);

    return () => {
      active = false;
      socket.emit("leave:chat", { shopId: shop.shop_uid, userId: activeThreadUid });
      socket.off("chat:message", handleNewMessage);
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
          addToast(result.redirect || "Failed to switch mode", "error");
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

  const handleDeleteEvent = async (eventUid: string) => {
    if (!confirm("Are you sure you want to delete this campus event?")) return;
    try {
      const res = await fetch(`/api/events?eventUid=${encodeURIComponent(eventUid)}`, {
        method: "DELETE",
        headers: { "X-Requested-With": "XMLHttpRequest" }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast("Event deleted successfully", "success");
        setMyEvents((prev) => prev.filter((e) => e.event_uid !== eventUid));
      } else {
        addToast(data.message || "Failed to delete event", "error");
      }
    } catch (err) {
      addToast("Network error", "error");
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
     e.preventDefault();
     const res = await updateShopInfo(shop.shop_uid, {
       email: infoEmail,
       phone: infoPhone,
       location: infoLocation,
       instagram_url: infoInstagram,
       facebook_url: infoFacebook,
     });
     if (res.success) {
       addToast("Shop information updated successfully!", "success");
       setIsEditingInfo(false);
     } else {
       addToast(res.error || "Failed to update information", "error");
     }
  };

  const handleDeleteProduct = async (productUid: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${productUid}`, {
        method: "DELETE",
        headers: { "X-Requested-With": "XMLHttpRequest" }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast("Product deleted successfully", "success");
        router.refresh();
      } else {
        addToast(data.error || "Failed to delete product", "error");
      }
    } catch {
      addToast("Network error. Failed to delete product.", "error");
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThreadUid) return;

    setSendingReply(true);
    const originalText = replyText;
    setReplyText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          shopUid: shop.shop_uid,
          receiverUid: activeThreadUid,
          messageText: originalText,
          isShopMode: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Relying on Socket.io for adding the message to the chat
        
        // Update threads list locally to show the last reply
        setThreads((prev) =>
          prev.map((t) =>
            t.customer_uid === activeThreadUid
              ? { ...t, last_message: originalText, last_message_time: new Date().toISOString() }
              : t
          )
        );
      } else {
        addToast(data.error || "Failed to send reply", "error");
        setReplyText(originalText);
      }
    } catch (err) {
      addToast("Network error, failed to send reply", "error");
      setReplyText(originalText);
    } finally {
      setSendingReply(false);
    }
  };

  const handleSendOrderForm = async () => {
    if (!selectedProductUid || !activeThreadUid) {
      addToast("Please select a product first", "error");
      return;
    }

    const selectedProduct = products.find((p) => p.product_uid === selectedProductUid);
    if (!selectedProduct) {
      addToast("Product not found", "error");
      return;
    }

    setSendingReply(true);

    const formDataPayload = {
      status: "pending",
      product_uid: selectedProduct.product_uid,
      product_title: selectedProduct.title,
      unit_price: Number(orderFormPrice || selectedProduct.price),
      quantity: Number(orderFormQty || 1),
      inside_delivery_charge: Number(selectedProduct.inside_delivery_charge ?? 0),
      outside_delivery_charge: Number(selectedProduct.outside_delivery_charge ?? 0),
      free_on_campus_delivery: !!selectedProduct.free_on_campus_delivery,
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          shopUid: shop.shop_uid,
          receiverUid: activeThreadUid,
          messageText: "Order Form",
          messageType: "order_form",
          formData: formDataPayload,
          isShopMode: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Relying on Socket.io for adding the message to the chat
        
        // Update threads list locally
        setThreads((prev) =>
          prev.map((t) =>
            t.customer_uid === activeThreadUid
              ? { ...t, last_message: "Sent order form", last_message_time: new Date().toISOString() }
              : t
          )
        );
        setShowOrderFormCreator(false);
        setSelectedProductUid("");
        setOrderFormQty(1);
      } else {
        addToast(data.error || "Failed to send order form", "error");
      }
    } catch (err) {
      addToast("Failed to send order form due to network error", "error");
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <>
    <div className="flex h-full w-full bg-[#fbfbfb] text-[#1a1a1a] overflow-y-auto justify-center px-4 py-6 custom-scrollbar">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Column (Profile info & quick actions) */}
        <div className="lg:col-span-1 flex flex-col gap-5 shrink-0">
          
          {/* Cover & Profile Branding */}
          <div className="bg-white border border-[#e2e2e2] rounded-3xl overflow-hidden shadow-xs relative">
            <div className="relative h-28 w-full bg-[#f3f4f6] group">
              {shop.cover_photo_url ? (
                <>
                  <Image src={shop.cover_photo_url} alt="Cover" fill className="object-cover" />
                  <div
                    onClick={() => {
                      setLightboxSrc(shop.cover_photo_url!);
                      setLightboxType("cover");
                    }}
                    className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-xs font-medium"
                  >
                    <Eye size={20} className="mb-0.5" />
                    View Photo
                  </div>
                </>
              ) : (
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#fcf7f6] to-[#f4ece9] text-[#BA5B55] text-[10px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-[#BA5B55]/5 transition-colors"
                >
                  <PlusCircle size={18} className="mb-1" />
                  Add Cover Photo
                </div>
              )}
              {isCoverUploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-xs">
                  <div className="w-6 h-6 border-2 border-[#BA5B55] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center pb-6 pt-12 relative -mt-12">
              <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-white group">
                {shop.profile_photo_url ? (
                  <>
                    <Image src={shop.profile_photo_url} alt="Profile" fill className="object-cover" />
                    <div
                      onClick={() => {
                        setLightboxSrc(shop.profile_photo_url!);
                        setLightboxType("profile");
                      }}
                      className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-[10px] font-medium"
                    >
                      <Eye size={16} className="mb-0.5" />
                      View Photo
                    </div>
                  </>
                ) : (
                  <div
                    onClick={() => profileInputRef.current?.click()}
                    className="flex h-full w-full items-center justify-center bg-gray-100 text-[#BA5B55] text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-black/5"
                  >
                    <Plus size={14} />
                    Add Photo
                  </div>
                )}
                {isProfileUploading && (
                  <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center backdrop-blur-xs">
                    <div className="w-5 h-5 border-2 border-[#BA5B55] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <h2 className="text-base font-bold text-[#1a1a1a] mt-3 leading-none">{shop.shop_name}</h2>
              <span className="text-[10px] text-[#787878] uppercase tracking-wider font-semibold mt-1.5">Shop Admin</span>
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => handlePhotoSelected(e, "cover")} className="hidden" />
            <input ref={profileInputRef} type="file" accept="image/*" onChange={(e) => handlePhotoSelected(e, "profile")} className="hidden" />
          </div>

          <div className="bg-white border border-[#e2e2e2] rounded-3xl p-4 shadow-xs flex flex-col gap-2">
            <button onClick={() => setIsAddProductOpen(true)} className="flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-2xl transition-all text-left cursor-pointer text-[#4f4f4f] hover:bg-[#BA5B55]/5 hover:text-[#BA5B55]"><PlusCircle size={16} /> Add Post</button>
            <button onClick={() => setIsEditingBio(true)} className="flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-2xl transition-all text-left cursor-pointer text-[#4f4f4f] hover:bg-[#BA5B55]/5 hover:text-[#BA5B55]"><EditOne size={16} /> Add/Edit Bio</button>
            <button onClick={() => setIsEditingInfo(true)} className="flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-2xl transition-all text-left cursor-pointer text-[#4f4f4f] hover:bg-[#BA5B55]/5 hover:text-[#BA5B55]"><Cog size={16} /> Edit Info</button>
            <button onClick={() => setActiveTab("notifications")} className="flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-2xl transition-all text-left cursor-pointer text-[#4f4f4f] hover:bg-[#BA5B55]/5 hover:text-[#BA5B55]"><Bell size={16} /> Notifications</button>
            <button onClick={() => {
                const url = `${window.location.origin}/shop/${shop.shop_uid}`;
                navigator.clipboard.writeText(url).then(() => addToast("Link copied!", "success"));
            }} className="flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-2xl transition-all text-left cursor-pointer text-[#4f4f4f] hover:bg-[#BA5B55]/5 hover:text-[#BA5B55]"><Store size={16} /> Share Shop</button>
          </div>

          <button onClick={handleSwitchToCustomer} disabled={isPending} className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-[#e2e2e2] hover:border-[#BA5B55] hover:text-[#BA5B55] text-xs font-semibold text-[#4f4f4f] transition-all bg-white rounded-2xl shadow-sm cursor-pointer disabled:opacity-50">
            <Refresh size={14} /> Switch to Customer
          </button>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 flex flex-col bg-white border border-[#e2e2e2] rounded-3xl overflow-hidden shadow-xs">
          
          <div className="flex justify-between items-center bg-[#fafafa] border-b border-[#e2e2e2] py-3 px-5 flex-wrap gap-4 shrink-0">
            <div className="flex gap-6 items-center text-xs">
              <button onClick={() => setActiveTab("posts")} className={`pb-1 border-b-2 font-bold cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === "posts" ? "border-[#BA5B55] text-[#BA5B55]" : "border-transparent text-[#787878] hover:text-[#BA5B55]"}`}><Package size={16} /> My Posts</button>
              <button onClick={() => setActiveTab("orders")} className={`pb-1 border-b-2 font-bold cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === "orders" ? "border-[#BA5B55] text-[#BA5B55]" : "border-transparent text-[#787878] hover:text-[#BA5B55]"}`}><ListCheck size={16} /> Orders</button>
              <button onClick={() => setActiveTab("events")} className={`pb-1 border-b-2 font-bold cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === "events" ? "border-[#BA5B55] text-[#BA5B55]" : "border-transparent text-[#787878] hover:text-[#BA5B55]"}`}><CalendarArrowDown size={16} /> Feasts & Events</button>
              <button onClick={() => setActiveTab("messages")} className={`pb-1 border-b-2 font-bold cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === "messages" ? "border-[#BA5B55] text-[#BA5B55]" : "border-transparent text-[#787878] hover:text-[#BA5B55]"}`}><ChatMessages size={16} /> Messages</button>
              <button onClick={() => setActiveTab("settings")} className={`pb-1 border-b-2 font-bold cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === "settings" ? "border-[#BA5B55] text-[#BA5B55]" : "border-transparent text-[#787878] hover:text-[#BA5B55]"}`}><Cog size={16} /> Account Settings</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          
          {shop.is_blocked && (
            <div className="bg-red-50 border border-red-200 p-5 rounded-3xl flex items-center justify-between text-xs text-red-800 gap-4 shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-bold text-red-950">Shop Suspended due to Overdue Debt</p>
                  <p className="mt-0.5 text-red-700 font-light">Your shop listings are hidden from customers. Settle your outstanding platform fee debt of ৳{Number(shop.platform_debt || 0).toFixed(2)} to immediately reactivate your store.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePayDebt}
                disabled={payingDebt}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shrink-0 cursor-pointer shadow-xs text-xs"
              >
                {payingDebt ? "Processing..." : "Pay Now"}
              </button>
            </div>
          )}

          {/* TAB 1: MY POSTS */}
          {activeTab === "posts" && (
            <>
              {/* Statistics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
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
                    <h3 className="text-xl font-bold mt-0.5">৳{Number(shop.total_revenue || 0).toFixed(2)}</h3>
                  </div>
                </div>

                <div className="bg-white border border-[#eadfdb] p-5 rounded-3xl shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                      <Dollar size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#787878] font-semibold uppercase tracking-wider">Platform Debt</p>
                      <h3 className="text-xl font-bold mt-0.5">৳{Number(shop.platform_debt || 0).toFixed(2)}</h3>
                    </div>
                  </div>
                  {Number(shop.platform_debt || 0) > 0 && (
                    <button
                      type="button"
                      onClick={handlePayDebt}
                      disabled={payingDebt}
                      className="px-3 py-1.5 bg-[#BA5B55] hover:bg-[#a34e48] disabled:opacity-50 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
                    >
                      Pay
                    </button>
                  )}
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

                            <h4 className="mt-1 truncate text-lg font-bold text-[#1a1a1a]">{product.title}</h4>
                            <p className="mt-1 text-xs text-[#4f4f4f] leading-relaxed font-light line-clamp-2">{product.description || "No description added."}</p>
                          </div>
                          
                          <div className="flex gap-2 shrink-0 flex-wrap">
                            {product.image_urls && product.image_urls.length > 0 ? (
                              product.image_urls.map((url, idx) => (
                                <div key={idx} className="h-16 w-16 shrink-0 overflow-hidden rounded-none border border-[#eadfdb] bg-white relative">
                                  <Image src={url} alt={`${product.title} - ${idx + 1}`} fill className="object-cover" />
                                </div>
                              ))
                            ) : product.image_url ? (
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-none border border-[#eadfdb] bg-white relative">
                                <Image src={product.image_url} alt={product.title} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-none border border-[#eadfdb] bg-white relative flex items-center justify-center text-gray-300">
                                <Package size={20} />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#555] font-light">
                          <span className="rounded-xl border border-[#efe4e2] bg-[#fdf8f6] px-3 py-1 text-[#BA5B55] font-semibold">
                            {product.currency} {Number(product.price).toFixed(2)}
                          </span>
                          <span className="rounded-xl border border-[#efe4e2] bg-[#fdf8f6] px-3 py-1 text-[#BA5B55] font-semibold">
                            {product.reaction_count ?? 0} {product.reaction_count === 1 ? "like" : "likes"}
                          </span>
                          <span className="rounded-xl border border-[#efe4e2] bg-[#fdf8f6] px-3 py-1 text-[#BA5B55] font-semibold">
                            {product.comment_count ?? 0} {product.comment_count === 1 ? "comment" : "comments"}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-end gap-3 flex-wrap">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingProduct(product)}
                              className="px-3 py-1.5 text-xs font-semibold border border-[#eadfdb] hover:border-[#BA5B55] hover:text-[#BA5B55] rounded-xl transition-all cursor-pointer flex items-center gap-1.5 bg-white"
                            >
                              <EditOne size={14} />
                              <span>Edit Details</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product.product_uid)}
                              className="px-3 py-1.5 text-xs font-semibold border border-red-100 text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 bg-white"
                            >
                              <X size={14} />
                              <span>Delete Post</span>
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 rounded-2xl border border-[#eadfdb] bg-white p-4">
                          <ProductCommentThread
                            productUid={product.product_uid}
                            shopUid={shop.shop_uid}
                            currentUserId={user.uid}
                            currentUserRole="seller"
                          />
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
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(event.event_uid)}
                            className="px-3.5 py-1.5 border border-[#eadfdb] hover:border-red-500 hover:text-red-500 text-xs font-semibold bg-white rounded-xl shadow-sm transition-all cursor-pointer"
                          >
                            Cancel Event
                          </button>
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
            <div className="bg-white flex flex-1 overflow-hidden h-[calc(100vh-12rem)] rounded-none">
              
              {/* Left Pane: Customer Threads list */}
              <div className="w-80 border-r border-gray-100 flex flex-col overflow-hidden shrink-0">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-sm text-[#1a1a1a]">Conversations</h3>
                  <p className="text-[11px] text-[#787878] font-light mt-0.5">Direct chat logs from platform customers.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
                  {loadingThreads ? (
                    <div className="text-center py-8 text-xs text-[#787878] font-light">Loading conversations...</div>
                  ) : threads.length > 0 ? (
                    threads.map((thread) => {
                      const isActive = activeThreadUid === thread.customer_uid;
                      const hasUnread = !!(thread.unread_count && thread.unread_count > 0);
                      return (
                        <button
                          key={thread.customer_uid}
                          onClick={() => {
                            if (isActive) {
                              setActiveThreadUid(null);
                            } else {
                              setActiveThreadUid(thread.customer_uid);
                              setChatMessages([]);
                              // Clear unread count locally when thread is clicked
                              setThreads((prev) =>
                                prev.map((t) =>
                                  t.customer_uid === thread.customer_uid
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
                          <div className="relative h-10 w-10 rounded-full overflow-hidden border border-gray-100 bg-[#f4ecea] flex items-center justify-center shrink-0">
                            {thread.customer_avatar ? (
                              <img src={thread.customer_avatar} alt={thread.customer_name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="text-xs uppercase font-bold text-[#BA5B55]">{thread.customer_name.slice(0, 2)}</div>
                            )}
                          </div>
                          
                          <div className="min-w-0 flex-1 flex flex-col justify-between">
                            <div className="flex items-center justify-between gap-1.5 font-sans">
                              <h4 className={`text-xs truncate ${hasUnread ? "font-extrabold text-[#BA5B55]" : "font-bold"}`}>{thread.customer_name}</h4>
                              <span className="text-[9px] text-gray-400 font-mono">
                                {new Date(thread.last_message_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-0.5 min-w-0">
                              <p className={`text-[11px] truncate ${hasUnread ? "font-bold text-gray-800" : "text-gray-500 font-light"}`}>{thread.last_message}</p>
                              {hasUnread && (
                                <span className="bg-[#BA5B55] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-none min-w-[16px] h-[16px] flex items-center justify-center shrink-0 animate-pulse">
                                  {thread.unread_count}
                                </span>
                              )}
                            </div>
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
              <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {activeThreadUid ? (
                  <>
                    {/* Chat Box Header */}
                    <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0">
                      <div className="relative h-9 w-9 rounded-full overflow-hidden border border-gray-100 bg-[#f4ecea] flex items-center justify-center shrink-0">
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
                        const isMe = msg.sender_role === "seller";
                        return (
                          <div
                            key={msg.message_uid}
                            className={`flex flex-col max-w-[70%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                          >
                            <ChatBubble msg={msg} currentUserId={user.uid} isSellerView={true} />
                            <span className="text-[9px] text-gray-400 mt-1 font-mono px-1">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Reply Form */}
                    <form onSubmit={handleSendReply} className="p-4 border-t border-gray-100 bg-white flex gap-2 shrink-0">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type reply to customer..."
                        disabled={sendingReply}
                        className="flex-1 text-xs border border-gray-200 rounded-none px-4 py-2.5 outline-none focus:border-[#BA5B55] transition-all bg-gray-50/50"
                      />
                      <button
                        type="submit"
                        disabled={sendingReply || !replyText.trim()}
                        className="w-10 h-10 bg-[#BA5B55] hover:bg-[#a34e48] disabled:opacity-40 text-white rounded-none transition-colors flex items-center justify-center cursor-pointer shrink-0"
                        title="Send reply"
                      >
                        <ChevronsRight size={16} />
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

          {/* TAB 5: ORDERS */}
          {activeTab === "orders" && (
            <div className="flex flex-col gap-4">
              <div className="border-b border-[#f4ecea] pb-4">
                <h3 className="text-base font-bold text-[#1a1a1a]">Order Requests</h3>
                <p className="text-xs text-[#787878] mt-0.5">Manage customer purchase orders, delivery statuses, and confirm platform fee parameters.</p>
              </div>

              {ordersList.length > 0 ? (
                <div className="flex flex-col gap-5 mt-2">
                  {ordersList.map((order) => {
                    const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={order.order_uid}
                        className="bg-white border border-[#eadfdb] rounded-3xl overflow-hidden shadow-sm"
                      >
                        {/* Order Header */}
                        <div className="bg-[#fafafa] border-b border-[#eadfdb] px-5 py-4 flex flex-wrap items-center justify-between gap-4 font-sans">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold font-mono">Order ID: {order.order_uid.slice(0, 8)}...</span>
                            <h4 className="text-xs font-bold text-[#1a1a1a] mt-0.5">Customer: <span className="text-[#BA5B55]">{order.customer_name}</span></h4>
                            <p className="text-[10px] text-[#787878] mt-0.5 font-light">{orderDate}</p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                              order.status === "pending" && "bg-amber-50 text-amber-700 border border-amber-200"
                            } ${
                              order.status === "confirmed" && "bg-blue-50 text-blue-700 border border-blue-200"
                            } ${
                              order.status === "completed" && "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            } ${
                              order.status === "cancelled" && "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Order Body */}
                        <div className="p-5 flex flex-col gap-4 text-xs font-sans">
                          {/* Items List */}
                          <div className="divide-y divide-gray-100 border-b border-gray-100 pb-3">
                            {order.items && order.items.map((item) => (
                              <div key={item.id} className="py-2 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="font-bold text-[#1a1a1a] truncate">{item.product_title}</p>
                                  {item.variant && <span className="text-[9px] text-[#787878] font-light mt-0.5">Option: {item.variant}</span>}
                                </div>
                                <div className="shrink-0 text-right">
                                  <span className="text-[#787878]">Qty: {item.quantity}</span>
                                  <span className="font-semibold text-[#1a1a1a] ml-4">৳{Number(item.line_total).toFixed(0)}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Shipping, delivery, totals */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-light">
                            <div className="flex flex-col gap-1.5">
                              <p className="font-semibold text-[#1a1a1a]">Shipping Address &amp; Contact:</p>
                              <p className="text-[#555] leading-relaxed">
                                Phone: {order.customer_phone} <br />
                                Email: {order.customer_email} <br />
                                Address: {order.delivery_address}
                                {order.city ? `, ${order.city}` : ""}
                                {order.postal_code ? ` - ${order.postal_code}` : ""}
                              </p>
                              {order.note && <p className="text-[#787878] italic mt-1">"Note: {order.note}"</p>}
                            </div>

                            <div className="flex flex-col justify-end gap-1.5 md:items-end">
                              <div className="flex justify-between w-full md:max-w-xs text-xs">
                                <span className="text-gray-400">Subtotal</span>
                                <span className="font-medium text-[#1a1a1a]">৳{Number(order.subtotal).toFixed(0)}</span>
                              </div>
                              <div className="flex justify-between w-full md:max-w-xs text-xs">
                                <span className="text-gray-400">Delivery ({order.delivery_type === "on_campus" ? "On Campus" : "Standard"})</span>
                                <span className="font-medium text-[#1a1a1a]">৳{Number(order.delivery_charge).toFixed(0)}</span>
                              </div>
                              <div className="flex justify-between w-full md:max-w-xs border-t border-[#eadfdb] pt-2 text-xs">
                                <span className="font-bold text-[#1a1a1a]">Total Cost</span>
                                <span className="font-bold text-[#BA5B55]">৳{Number(order.total_amount).toFixed(0)}</span>
                              </div>
                              <span className="text-[10px] text-gray-400 mt-1 uppercase font-semibold tracking-wider font-mono">Payment method: {order.payment_method}</span>
                            </div>
                          </div>

                          {/* Order Actions for Shop Owner */}
                          <div className="border-t border-[#f4ecea] pt-4 mt-2 flex justify-between items-center gap-3">
                            <span className="text-[10px] text-[#787878] font-light">
                              Platform fee for this order: <span className="font-bold text-[#BA5B55]">৳{(Number(order.subtotal) * 0.05).toFixed(2)}</span> (5% platform commission charged upon completion)
                            </span>
                            
                            <div className="flex gap-2">
                              {order.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.order_uid, "cancelled")}
                                    className="px-3.5 py-1.5 text-xs font-semibold border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all cursor-pointer"
                                  >
                                    Cancel Order
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.order_uid, "confirmed")}
                                    className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
                                  >
                                    Confirm Order
                                  </button>
                                </>
                              )}

                              {order.status === "confirmed" && (
                                <>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.order_uid, "cancelled")}
                                    className="px-3.5 py-1.5 text-xs font-semibold border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all cursor-pointer"
                                  >
                                    Cancel Order
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.order_uid, "completed")}
                                    className="px-4 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
                                  >
                                    Mark Completed
                                  </button>
                                </>
                              )}

                              {order.status === "completed" && (
                                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                                  Order Fulfilled
                                </span>
                              )}

                              {order.status === "cancelled" && (
                                <span className="text-[11px] font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                                  Cancelled
                                </span>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 border border-dashed border-gray-200 rounded-3xl bg-white mt-2 shadow-xs">
                  <ListCheck stroke={1} size={48} className="mx-auto text-gray-300 mb-3" />
                  <h4 className="text-xs font-bold text-[#1a1a1a]">No order requests yet</h4>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    Once customers purchase your products, their order details and shipping request parameters will appear here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="bg-white border border-[#eadfdb] p-6 rounded-3xl shadow-sm flex flex-col gap-4">
              <div className="border-b border-[#f4ecea] pb-4 flex justify-between items-center gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#1a1a1a]">Shop Notifications</h3>
                  <p className="text-xs text-[#787878] mt-0.5">Stay updated on new followers, order requests, and customer feedback.</p>
                </div>
                <button
                  onClick={fetchShopNotifications}
                  className="px-3.5 py-1.5 border border-[#eadfdb] hover:border-[#BA5B55] hover:text-[#BA5B55] transition-all text-[11px] font-semibold rounded-xl bg-white cursor-pointer"
                >
                  Refresh
                </button>
              </div>

              {loadingNotifications ? (
                <div className="text-center py-12 text-xs text-gray-400">Loading notifications...</div>
              ) : notifications.length > 0 ? (
                <div className="flex flex-col gap-3 mt-1">
                  {notifications.map((notif) => (
                    <div
                      key={notif.notif_uid}
                      className={`p-4 rounded-2xl border flex gap-3.5 items-start justify-between ${
                        notif.is_read
                          ? "border-[#eadfdb]/70 bg-gray-50/30 text-gray-700 font-sans"
                          : "border-[#BA5B55]/20 bg-[#BA5B55]/2 text-[#1a1a1a] shadow-3xs font-sans"
                      }`}
                    >
                      <div className="flex gap-3 items-start min-w-0">
                        <div className={`p-2 rounded-xl shrink-0 ${
                          notif.type === "follow" ? "bg-blue-50 text-blue-600" :
                          notif.type === "order" ? "bg-amber-50 text-amber-600" :
                          "bg-[#BA5B55]/10 text-[#BA5B55]"
                        }`}>
                          {notif.type === "follow" ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          ) : notif.type === "order" ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="9" cy="21" r="1" />
                              <circle cx="20" cy="21" r="1" />
                              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                          ) : (
                            <Bell size={15} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold leading-tight flex items-center gap-2">
                            {notif.title}
                            {!notif.is_read && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[#BA5B55] shrink-0" />
                            )}
                          </h4>
                          <p className="text-[11px] font-light mt-1 text-gray-500 leading-normal">{notif.body}</p>
                          <span className="text-[9px] text-gray-400 font-mono mt-1.5 block">
                            {new Date(notif.created_at).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border border-dashed border-gray-200 rounded-3xl bg-gray-50/20 mt-2">
                  <Bell stroke={1} size={48} className="mx-auto text-gray-300 mb-3" />
                  <h4 className="text-xs font-bold text-[#1a1a1a]">No notifications yet</h4>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    Updates about customer orders and new shop followers will appear here to keep you informed.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === "settings" && (
            <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
              
              {/* Photo section moved to Left Column */}

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
                <div className="bg-white border border-[#eadfdb] rounded-3xl p-6 shadow-sm">
                  <h3 className="text-xs font-semibold text-[#BA5B55] uppercase tracking-wider mb-1">Campus Association</h3>
                  <div className="mt-4 p-4 border border-[#eadfdb] rounded-2xl bg-[#fafafa]">
                    {shop.university_name ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#BA5B55]/10 flex items-center justify-center text-[#BA5B55]">
                          <Building size={20} stroke={1.5} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{shop.university_name}</p>
                          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Verified Campus Community</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <p className="text-xs text-gray-600 font-light">Your shop is not currently associated with a campus. Join a university community to be visible to local students.</p>
                        <button
                          onClick={() => setShowAssignUniversity(true)}
                          className="self-start px-4 py-2 bg-[#BA5B55] hover:bg-[#a34e48] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                        >
                          Join a Campus
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-red-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4 bg-red-50/10">
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
                    {shop.instagram_url && (
                      <div className="flex items-center gap-3">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="#BA5B55" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                        </svg>
                        <a href={shop.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{shop.instagram_url}</a>
                      </div>
                    )}
                    {shop.facebook_url && (
                      <div className="flex items-center gap-3">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="#BA5B55" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                        </svg>
                        <a href={shop.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{shop.facebook_url}</a>
                      </div>
                    )}
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
        </div>
      </div>
    </div>

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

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#787878]">Instagram Link (Optional)</label>
                <input
                  type="text"
                  value={infoInstagram}
                  onChange={(e) => setInfoInstagram(e.target.value)}
                  placeholder="https://instagram.com/username"
                  className="w-full text-sm p-2 border border-[#eadfdb] focus:border-[#BA5B55] outline-none font-light rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#787878]">Facebook Link (Optional)</label>
                <input
                  type="text"
                  value={infoFacebook}
                  onChange={(e) => setInfoFacebook(e.target.value)}
                  placeholder="https://facebook.com/username"
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
                    setInfoInstagram(shop.instagram_url || "");
                    setInfoFacebook(shop.facebook_url || "");
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

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onUpdated={() => router.refresh()}
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

      {/* Interactive Crop Modal */}
      {cropImageSrc && cropType && (
        <ImageCropModal
          src={cropImageSrc}
          circularCrop={cropType === "profile"}
          aspect={cropType === "cover" ? 2.5 : 1}
          title={cropType === "cover" ? "Crop Shop Cover Banner" : "Crop Shop Profile Avatar"}
          onClose={() => {
            setCropImageSrc(null);
            setCropType(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Custom View Photo Modal */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => { setLightboxSrc(null); setLightboxType(null); }} />
          <div className="relative z-10 bg-white border border-[#e2e2e2] shadow-2xl rounded-3xl max-w-lg w-full overflow-hidden flex flex-col items-center">
            
            <div className="w-full px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <span className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
                Full Image View
              </span>
              <button
                onClick={() => { setLightboxSrc(null); setLightboxType(null); }}
                className="text-gray-400 hover:text-[#BA5B55] outline-none"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 w-full flex justify-center items-center bg-[#fafafa]">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-150 shadow-sm bg-white">
                <Image src={lightboxSrc} alt="Shop view" fill className="object-contain" />
              </div>
            </div>

            <div className="w-full border-t border-gray-100 px-5 py-4 flex gap-3 justify-end bg-white">
              <button
                onClick={() => {
                  setLightboxSrc(null);
                  const type = lightboxType;
                  setLightboxType(null);
                  if (type === "profile") profileInputRef.current?.click();
                  if (type === "cover") coverInputRef.current?.click();
                }}
                className="text-xs font-semibold px-4 py-2 border border-[#BA5B55] text-[#BA5B55] hover:bg-[#BA5B55] hover:text-white rounded-xl transition-all shadow-3xs"
              >
                Change Photo
              </button>
              
              <button
                onClick={() => lightboxType && handleRemovePhoto(lightboxType)}
                className="text-xs font-semibold px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-3xs"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join University Modal */}
      {showAssignUniversity && (
        <JoinUniversityModal
          shopUid={shop.shop_uid}
          onClose={() => setShowAssignUniversity(false)}
        />
      )}

    </>
  );
}
