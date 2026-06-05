"use client";

import { useState, useRef, useTransition, ChangeEvent, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";
import { useAuthStore } from "@/zustand/authStore";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import ImageCropModal from "@/components/ImageCropModal";
import { deleteAccount } from "./deleteAccount/deleteAccount";
import {
  Mail,
  Telephone,
  CalendarArrowDown,
  Pencil,
  Plus,
  Store,
  Trash,
  Users,
  Package,
  Cog,
  PlusCircle,
  Eye,
  X,
  UserCircle
} from "@mynaui/icons-react";


interface OrderItem {
  id: number;
  order_uid: string;
  product_uid: string;
  product_title: string;
  variant: string | null;
  unit_price: string;
  quantity: number;
  line_total: string;
}

interface Order {
  order_uid: string;
  shop_uid: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  city: string | null;
  postal_code: string | null;
  note: string | null;
  delivery_type: string;
  payment_method: string;
  subtotal: string;
  delivery_charge: string;
  total_amount: string;
  status: string;
  created_at: string;
  shop_name: string;
  shop_photo: string | null;
  items: OrderItem[];
}

interface SessionLog {
  session_id: string;
  device_type: string | null;
  device_ip: string | null;
  browser_name: string | null;
  os_name: string | null;
  created_at: string;
  expires_at: string;
}

interface UserProfile {
  uid: string;
  username: string;
  email: string;
  phone: string | null;
  role: string;
  profile_photo_url: string | null;
  cover_photo_url: string | null;
  joinedAt: string;
  sessionId: string;
}

interface ProfileClientProps {
  initialUser: UserProfile;
  initialShops: Array<{ shop_uid: string; shop_name: string; status: string; profile_photo_url: string | null }>;

  orders: Order[];
  sessions: SessionLog[];
  hasPasswordInitially: boolean;
  initialReviews?: Array<{ product_uid: string; rating: number; review_text: string | null }>;
}

export default function ProfileClient({
  initialUser,
  initialShops,

  orders = [],
  sessions = [],
  hasPasswordInitially,
  initialReviews = [],
}: ProfileClientProps) {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  
  // Zustand Auth Store
  const clearUser = useAuthStore((s) => s.clearUser);
  const storeUser = useAuthStore((s) => s.user);
  const setActiveShop = useAuthStore((s) => s.setActiveShop);

  const [isPending, startTransition] = useTransition();

  const [user, setUser] = useState<UserProfile>(initialUser);
  const [hasPassword, setHasPassword] = useState(hasPasswordInitially);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"orders" | "reviews" | "settings">(
    (searchParams.get("tab") as "orders" | "reviews" | "settings") || "orders"
  );

  const [reviewsList, setReviewsList] = useState(initialReviews);
  const [reviewForms, setReviewForms] = useState<Record<string, { rating: number; text: string; submitting?: boolean }>>({});

  useEffect(() => {
    const tab = searchParams.get("tab") as "orders" | "reviews" | "settings";
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  // Editable Account Info States
  const [usernameInput, setUsernameInput] = useState(user.username);
  const [emailInput, setEmailInput] = useState(user.email);
  const [phoneInput, setPhoneInput] = useState(user.phone || "");
  const [updatingInfo, setUpdatingInfo] = useState(false);
  const [formErrors, setFormErrors] = useState<{ username?: string; email?: string; phone?: string }>({});

  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Active Sessions State
  const [activeSessions, setActiveSessions] = useState<SessionLog[]>(sessions);

  // Image Upload / Modal States
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"avatar" | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxType, setLightboxType] = useState<"avatar" | null>(null);
  
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Helper: dataURL to Blob
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

  // Trigger file select
  const handlePhotoSelected = (e: ChangeEvent<HTMLInputElement>, type: "avatar") => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setCropSrc(reader.result as string);
        setCropType(type);
      });
      reader.readAsDataURL(file);
    }
  };

  // Complete cropping and upload
  const handleCropComplete = async (croppedDataUrl: string) => {
    setCropSrc(null);
    const type = cropType;
    setCropType(null);

    const croppedBlob = dataURLtoBlob(croppedDataUrl);

    if (type === "avatar") {
      setIsAvatarUploading(true);
      try {
        const url = await uploadImageToCloudinary(croppedBlob, "nashwa_user_profiles");
        const res = await fetch("/api/user/update-avatar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ imageUrl: url }),
        });
        if (res.ok) {
          addToast("Profile photo updated!", "success");
          setUser((prev) => ({ ...prev, profile_photo_url: url }));
          router.refresh();
        } else {
          const d = await res.json();
          addToast(d.message || "Failed to save profile photo", "error");
        }
      } catch (err: any) {
        addToast(err.message || "Failed to upload profile photo", "error");
      } finally {
        setIsAvatarUploading(false);
        if (avatarInputRef.current) avatarInputRef.current.value = "";
      }
    }
  };

  // Remove photo helper
  const handleRemovePhoto = async (type: "avatar") => {
    if (!confirm(`Are you sure you want to remove your ${type} photo?`)) return;
    setLightboxSrc(null);
    setLightboxType(null);

    const apiPath = "/api/user/update-avatar";
    try {
      const res = await fetch(apiPath, {
        method: "DELETE",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (res.ok) {
        addToast(`${type === "avatar" ? "Profile" : "Cover"} photo removed.`, "success");
        setUser((prev) => ({
          ...prev,
          [type === "avatar" ? "profile_photo_url" : ""]: null,
        }));
        router.refresh();
      } else {
        const d = await res.json();
        addToast(d.message || "Failed to remove photo", "error");
      }
    } catch {
      addToast("Network error", "error");
    }
  };

  // Save Account Information Updates
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updatingInfo) return;
    // Client-side validation
    const errors: { username?: string; email?: string; phone?: string } = {};
    if (!usernameInput.trim() || usernameInput.length < 2) errors.username = "Enter a valid name (min 2 chars).";
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(emailInput)) errors.email = "Enter a valid email address.";
    const phoneRe = /^\+?\d{7,15}$/;
    if (phoneInput && !phoneRe.test(phoneInput)) errors.phone = "Enter phone in international format, e.g. +8801XXXXXXXXX";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setUpdatingInfo(true);

    try {
      const res = await fetch("/api/user/update-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          username: usernameInput,
          email: emailInput,
          phone: phoneInput,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.message, "success");
        setUser((prev) => ({
          ...prev,
          username: usernameInput,
          email: emailInput,
          phone: phoneInput || null,
        }));
        router.refresh();
      } else {
        addToast(data.message || "Failed to update profile", "error");
      }
    } catch (err) {
      addToast("Network error", "error");
    } finally {
      setUpdatingInfo(false);
    }
  };

  // Save Password Updates
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast("New passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 6) {
      addToast("Password must be at least 6 characters long.", "error");
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch("/api/user/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.message, "success");
        setHasPassword(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        addToast(data.message || "Failed to update password", "error");
      }
    } catch {
      addToast("Network error", "error");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Revoke active sessions
  const handleRevokeSession = async (sessionId: string | null, allOther = false) => {
    if (allOther && !confirm("Are you sure you want to log out of all other devices?")) return;
    if (!allOther && sessionId === user.sessionId && !confirm("This is your current session. Revoking it will log you out immediately. Proceed?")) return;

    try {
      const res = await fetch("/api/user/revoke-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ sessionId, allOther }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.message, "success");
        if (allOther) {
          setActiveSessions((prev) => prev.filter((s) => s.session_id === user.sessionId));
        } else {
          setActiveSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
          if (sessionId === user.sessionId) {
            clearUser();
            router.replace("/");
          }
        }
      } else {
        addToast(data.message || "Failed to revoke session", "error");
      }
    } catch {
      addToast("Network error", "error");
    }
  };

  // Account deletion
  const handleDeleteAccount = () => {
    if (!confirm("CRITICAL WARNING: This will permanently delete your account and all owned shops. This action CANNOT be undone. Are you absolutely sure?")) return;
    startTransition(async () => {
      const result = await deleteAccount();
      if (result.success) {
        addToast(result.message, "success");
        clearUser();
        router.replace("/");
      } else {
        addToast(result.message, "error");
      }
    });
  };

  const handleSwitchToShop = (shopUid: string, shopStatus: string) => {
    if (shopStatus === "pending") {
      addToast("Your shop is currently pending admin approval.", "error");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/switch-shop", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ activeShopUid: shopUid }),
        });
        const result = await response.json();

        if (response.ok) {
          addToast(result.message, "success");
          const selectedShop =
            storeUser?.owned_shops?.find((s) => s.shop_uid === shopUid) || null;
          setActiveShop(selectedShop);
          router.push(result.redirect);
        } else {
          addToast(result.message || "Failed to switch shop", "error");
        }
      } catch (error) {
        addToast("Network error! Please try again.", "error");
      }
    });
  };

  const handleSubmitReview = async (productUid: string) => {
    const form = reviewForms[productUid];
    if (!form || !form.rating) {
      addToast("Please select a rating.", "error");
      return;
    }

    setReviewForms((prev) => ({
      ...prev,
      [productUid]: { ...prev[productUid], submitting: true },
    }));

    try {
      const res = await fetch(`/api/products/${productUid}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          rating: form.rating,
          reviewText: form.text,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast("Review submitted successfully!", "success");
        setReviewsList((prev) => [
          ...prev,
          { product_uid: productUid, rating: form.rating, review_text: form.text },
        ]);
        router.refresh();
      } else {
        addToast(data.error || "Failed to submit review.", "error");
      }
    } catch {
      addToast("Network error. Failed to submit review.", "error");
    } finally {
      setReviewForms((prev) => ({
        ...prev,
        [productUid]: { ...prev[productUid], submitting: false },
      }));
    }
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    clearUser();
    window.location.href = "/api/clear-cookie";
  };

  return (
    <div className="flex w-full gap-6 h-full overflow-hidden flex-col md:flex-row">
      
      {/* Hidden inputs */}
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoSelected(e, "avatar")} />

      {/* Left section: Profile branding */}
      <aside aria-label="Profile sidebar" className="w-full md:w-96 shrink-0 flex flex-col justify-start overflow-y-auto custom-scrollbar gap-5">
        
        {/* Cover Photo & Avatar Header Container */}
        <div className="bg-white border border-[#e2e2e2] rounded-3xl overflow-hidden shadow-xs relative">
          


          {/* Avatar Profile Photo */}
          <div className="flex flex-col items-center pb-6 pt-6 relative">
            <div className="relative w-24 h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex justify-center items-center shrink-0 group">
              {user.profile_photo_url ? (
                <>
                  <img
                    src={user.profile_photo_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  <div
                    onClick={() => {
                      setLightboxSrc(user.profile_photo_url!);
                      setLightboxType("avatar");
                    }}
                    className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-[10px] font-medium"
                  >
                    <Eye size={16} className="mb-0.5" />
                    View Photo
                  </div>
                </>
              ) : (
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-full h-full bg-gray-100 flex flex-col justify-center items-center text-[#ba5b55] cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <UserCircle size={40} stroke={1.5} />
                  <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Add Photo</span>
                </div>
              )}

              {isAvatarUploading && (
                <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center backdrop-blur-xs">
                  <div className="w-5 h-5 border-2 border-[#BA5B55] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <h2 className="text-base font-bold text-[#1a1a1a] mt-3 leading-none">{user.username}</h2>
            <span className="text-[10px] text-[#787878] uppercase tracking-wider font-semibold mt-1.5">{user.role}</span>

            {/* Profile Statistics Counts */}
            <div className="flex justify-center items-center gap-6 mt-5 border-t border-[#f2f2f2] w-full pt-4 px-4">


              <button
                onClick={() => setActiveTab("orders")}
                className="flex flex-col items-center text-center hover:text-[#BA5B55] transition-colors"
              >
                <span className="text-sm font-bold text-[#1a1a1a] leading-none">{orders.length}</span>
                <span className="text-[10px] text-[#787878] mt-1 font-light flex items-center gap-1 justify-center">
                  <Package size={12} className="text-[#BA5B55]" />
                  Orders
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* User Info card */}
        <div className="bg-white border border-[#e2e2e2] rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
          <div className="w-full flex justify-between items-center text-xs leading-none mb-1 text-[#787878]">
            <p className="text-[#BA5B55] font-bold uppercase tracking-wider">My details</p>
            <button
              onClick={() => setActiveTab("settings")}
              className="flex justify-center items-center gap-1 hover:text-[#BA5B55] hover:underline cursor-pointer text-[10px] font-semibold"
            >
              <Pencil stroke={1.5} size={12} />
              <p>Edit Info</p>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[#555] text-xs font-light">
            <Mail stroke={1.5} size={15} className="text-[#BA5B55]" />
            <p className="leading-none truncate" title={user.email}>
              <span className="sr-only">Email:</span>
              {user.email}
            </p>
          </div>

          <div className="flex items-center gap-3 text-[#555] text-xs font-light">
            <Telephone stroke={1.5} size={15} className="text-[#BA5B55]" />
            <p className="leading-none">{user.phone || "No phone added"}</p>
          </div>

          <div className="flex items-center gap-3 border-t border-[#f4f4f4] pt-3 text-[#555] text-xs font-light">
            <CalendarArrowDown stroke={1.5} size={15} className="text-[#BA5B55]" />
            <p className="leading-none">Joined {user.joinedAt}</p>
          </div>
        </div>

        {/* Entrepreneurship/My Shops section */}
        <div className="bg-white border border-[#e2e2e2] rounded-3xl p-5 shadow-xs flex flex-col gap-4">
          <div className="w-full flex justify-between items-center text-xs leading-none text-[#787878]">
            <p className="text-[#BA5B55] font-bold uppercase tracking-wider">My Shops</p>
            {initialShops.length === 1 && (
              <Link
                href="/shop/create-shop"
                className="flex justify-center items-center gap-1 text-[#BA5B55] hover:underline text-[10px] font-semibold leading-none"
              >
                <Plus stroke={1.5} size={12} />
                <p>Create another</p>
              </Link>
            )}
          </div>

          {initialShops.length > 0 ? (
            <div className="flex flex-col gap-3">
              {initialShops.map((shop) => (
                <div
                  key={shop.shop_uid}
                  className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-[#fcfdfd] shadow-sm hover:border-[#BA5B55]/20 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#fafafa] border border-gray-200 flex items-center justify-center shrink-0">
                      {shop.profile_photo_url ? (
                        <Image src={shop.profile_photo_url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="text-[10px] font-bold text-[#BA5B55] uppercase">{shop.shop_name.slice(0, 1)}</div>
                      )}
                    </div>
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <p className="text-xs font-bold text-[#1a1a1a] truncate leading-none">{shop.shop_name}</p>
                      <span className="text-[9px] uppercase tracking-wider text-[#BA5B55] font-semibold leading-none mt-0.5">{shop.status}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSwitchToShop(shop.shop_uid, shop.status)}
                    className="text-[10px] font-bold text-white bg-[#BA5B55] hover:bg-[#9e4f4a] px-3 py-1.5 rounded-xl transition-colors shrink-0 cursor-pointer"
                  >
                    Shop
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center text-center gap-3">
              <div className="flex gap-2 justify-center items-center">
                <Store stroke={1.5} size={18} className="text-[#BA5B55]" />
                <p className="text-start leading-tight text-xs font-bold">
                  Start your entrepreneurship stall on <span className="text-[#BA5B55]">Nashwa</span>
                </p>
              </div>
              <p className="text-[11px] text-[#787878] text-start leading-relaxed font-light">
                Launch a campus storefront to publish products and start earning revenue directly from peers.
              </p>
              <Link
                href="/shop/create-shop"
                className="w-full text-xs bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-all flex items-center justify-center gap-1.5 py-2 text-white font-bold rounded-2xl cursor-pointer"
              >
                <Plus stroke={1.5} size={14} />
                <p>Register a shop</p>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Right section: Active tab content */}
      <main className="flex-1 flex flex-col bg-white border border-[#e2e2e2] rounded-3xl overflow-hidden shadow-xs" aria-live="polite">
        
        {/* Navigation tabs header */}
        <div className="flex justify-between items-center bg-[#fafafa] border-b border-[#e2e2e2] py-3 px-5 flex-wrap gap-4 shrink-0">
          <div className="flex gap-6 items-center text-xs" role="tablist" aria-label="Profile sections">

            <button
              role="tab"
              aria-selected={activeTab === "orders"}
              onClick={() => setActiveTab("orders")}
              className={`pb-1 border-b-2 font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === "orders"
                  ? "border-[#BA5B55] text-[#BA5B55]"
                  : "border-transparent text-[#787878] hover:text-[#BA5B55]"
              }`}
            >
              <Package size={16} />
              <span>My Orders</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "reviews"}
              onClick={() => setActiveTab("reviews")}
              className={`pb-1 border-b-2 font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === "reviews"
                  ? "border-[#BA5B55] text-[#BA5B55]"
                  : "border-transparent text-[#787878] hover:text-[#BA5B55]"
              }`}
            >
              <Eye size={16} />
              <span>My Reviews</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
              className={`pb-1 border-b-2 font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === "settings"
                  ? "border-[#BA5B55] text-[#BA5B55]"
                  : "border-transparent text-[#787878] hover:text-[#BA5B55]"
              }`}
            >
              <Cog size={16} />
              <span>Account & Settings</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="text-xs font-semibold px-4 py-2 border border-gray-200 rounded-xl hover:border-red-500 hover:text-red-500 hover:bg-red-50/10 transition-colors cursor-pointer"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          


          {/* TAB 2: MY ORDERS LIST */}
          {activeTab === "orders" && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-base font-bold text-[#1a1a1a]">Order History</h3>
                <p className="text-xs text-[#787878] font-light mt-0.5">Track shipping statuses and verification tags for purchases.</p>
              </div>

              {orders.length > 0 ? (
                <div className="flex flex-col gap-5 mt-2">
                  {orders.map((order) => {
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
                        className="border border-[#e2e2e2] rounded-3xl overflow-hidden bg-[#fafafa]/20 shadow-xs"
                      >
                        {/* Order Header */}
                        <div className="bg-[#fafafa] border-b border-[#e2e2e2] px-5 py-4 flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold font-mono">ID: {order.order_uid.slice(0, 8)}...</span>
                            <h4 className="text-xs font-bold text-[#1a1a1a] mt-0.5">Purchased from <span className="text-[#BA5B55]">{order.shop_name}</span></h4>
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

                        {/* Order Details Body */}
                        <div className="p-5 flex flex-col gap-4">
                          {/* Items Grid */}
                          <div className="divide-y divide-gray-100">
                             {order.items.map((item) => {
                               const existingReview = reviewsList.find((r) => r.product_uid === item.product_uid);
                               const isCompleted = order.status === "completed";

                               return (
                                 <div key={item.id} className="py-3 flex flex-col gap-2 border-b border-gray-100 last:border-0">
                                   <div className="flex items-center justify-between text-xs gap-4">
                                     <div className="min-w-0">
                                       <p className="font-bold text-[#1a1a1a] truncate">{item.product_title}</p>
                                       {item.variant && <span className="text-[9px] text-[#787878] font-light mt-0.5">Option: {item.variant}</span>}
                                     </div>
                                     <div className="shrink-0 text-right">
                                       <span className="text-[#787878]">Qty: {item.quantity}</span>
                                       <span className="font-semibold text-[#1a1a1a] ml-4">৳{Number(item.line_total).toFixed(0)}</span>
                                     </div>
                                   </div>

                                   {isCompleted && (
                                     <div className="bg-[#fafafa] border border-gray-200 rounded-2xl p-3 mt-1.5 flex flex-col gap-3">
                                       {existingReview ? (
                                         <div className="flex flex-col gap-1">
                                           <div className="flex items-center justify-between">
                                             <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Your Review</span>
                                             <div className="flex gap-0.5 text-amber-400">
                                               {Array.from({ length: 5 }).map((_, sIdx) => (
                                                 <svg
                                                   key={sIdx}
                                                   width="12"
                                                   height="12"
                                                   viewBox="0 0 24 24"
                                                   fill={sIdx < existingReview.rating ? "currentColor" : "none"}
                                                   stroke="currentColor"
                                                   strokeWidth="2"
                                                 >
                                                   <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                 </svg>
                                               ))}
                                             </div>
                                           </div>
                                           {existingReview.review_text && (
                                             <p className="text-[11px] text-[#555] font-light italic">"{existingReview.review_text}"</p>
                                           )}
                                         </div>
                                       ) : (
                                         <div className="flex flex-col gap-2.5">
                                           <div className="flex flex-wrap items-center justify-between gap-2">
                                             <span className="text-[10px] font-bold text-[#BA5B55] uppercase tracking-wider">Rate &amp; Review this product</span>
                                             <div className="flex gap-1">
                                               {Array.from({ length: 5 }).map((_, sIdx) => {
                                                 const starVal = sIdx + 1;
                                                 const formRating = reviewForms[item.product_uid]?.rating || 0;
                                                 return (
                                                   <button
                                                     key={sIdx}
                                                     type="button"
                                                     onClick={() => setReviewForms((prev) => ({
                                                       ...prev,
                                                       [item.product_uid]: { ...(prev[item.product_uid] || { text: "" }), rating: starVal }
                                                     }))}
                                                     className="text-gray-300 hover:text-amber-400 transition-colors"
                                                   >
                                                     <svg
                                                       width="16"
                                                       height="16"
                                                       viewBox="0 0 24 24"
                                                       fill={starVal <= formRating ? "#fbbf24" : "none"}
                                                       stroke={starVal <= formRating ? "#fbbf24" : "currentColor"}
                                                       strokeWidth="2"
                                                     >
                                                       <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                     </svg>
                                                   </button>
                                                 );
                                               })}
                                             </div>
                                           </div>

                                           <div className="flex gap-2 items-end">
                                             <textarea
                                               placeholder="Write your review here..."
                                               value={reviewForms[item.product_uid]?.text || ""}
                                               onChange={(e) => setReviewForms((prev) => ({
                                                 ...prev,
                                                 [item.product_uid]: { ...(prev[item.product_uid] || { rating: 0 }), text: e.target.value }
                                               }))}
                                               rows={2}
                                               className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#BA5B55] bg-white text-[#1a1a1a] resize-none"
                                             />
                                             <button
                                               type="button"
                                               disabled={reviewForms[item.product_uid]?.submitting}
                                               onClick={() => handleSubmitReview(item.product_uid)}
                                               className="px-3.5 py-2 bg-[#BA5B55] hover:bg-[#9e4f4a] text-white text-[11px] font-bold rounded-xl transition-all shadow-3xs disabled:opacity-50"
                                             >
                                               {reviewForms[item.product_uid]?.submitting ? "..." : "Submit"}
                                             </button>
                                           </div>
                                         </div>
                                       )}
                                     </div>
                                   )}
                                 </div>
                               );
                             })}
                           </div>

                          {/* Address, Note & Totals */}
                          <div className="border-t border-[#f4f4f4] pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-light">
                            <div className="flex flex-col gap-1.5">
                              <p className="font-semibold text-[#1a1a1a]">Shipping Parameters:</p>
                              <p className="text-[#555] leading-relaxed">
                                {order.customer_name} ({order.customer_phone})<br />
                                {order.delivery_address}
                                {order.city ? `, ${order.city}` : ""}
                                {order.postal_code ? ` - ${order.postal_code}` : ""}
                              </p>
                              {order.note && <p className="text-[#787878] italic mt-1 font-light font-sans">"Note: {order.note}"</p>}
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
                              <div className="flex justify-between w-full md:max-w-xs border-t border-[#f4f4f4] pt-2 text-xs">
                                <span className="font-bold text-[#1a1a1a]">Total Cost</span>
                                <span className="font-bold text-[#BA5B55]">৳{Number(order.total_amount).toFixed(0)}</span>
                              </div>
                              <span className="text-[10px] text-gray-400 mt-1 uppercase font-semibold tracking-wider font-mono">Payment method: {order.payment_method}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 border border-dashed border-gray-200 rounded-3xl bg-gray-50/20 mt-2">
                  <Package stroke={1} size={48} className="mx-auto text-gray-300 mb-3" />
                  <h4 className="text-xs font-bold text-[#1a1a1a]">No purchase requests yet</h4>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    Your orders list is currently empty. Buy products from student merchants and follow up statuses right here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB: REVIEWS */}
          {activeTab === "reviews" && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-base font-bold text-[#1a1a1a]">My Reviews</h3>
                <p className="text-xs text-[#787878] font-light mt-0.5">View all the product reviews you've written.</p>
              </div>
              <div className="text-center py-20 border border-dashed border-gray-200 rounded-3xl bg-gray-50/20 mt-2">
                <Eye stroke={1} size={48} className="mx-auto text-gray-300 mb-3" />
                <h4 className="text-xs font-bold text-[#1a1a1a]">No reviews yet</h4>
                <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Purchase items and share your thoughts to help others discover great products!
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT & SETTINGS */}
          {activeTab === "settings" && (
            <div className="flex flex-col gap-8 w-full max-w-2xl">
              
              {/* Account Information Form */}
              <div className="border border-[#e2e2e2] rounded-3xl p-5 bg-[#fafafa]/20 shadow-xs flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[#1a1a1a]">Change Account Information</h4>
                  <p className="text-[11px] text-[#787878] font-light mt-0.5">Edit username, email, and phone number parameters. Both email and phone must be unique.</p>
                </div>

                <form onSubmit={handleSaveInfo} className="flex flex-col gap-4 text-xs" aria-label="Change account information">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-[#787878]">Username</label>
                    <input
                      type="text"
                      required
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      aria-label="Username"
                      placeholder="Your display name"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#BA5B55] focus:ring-2 focus:ring-[#BA5B55]/20 bg-white text-[#1a1a1a]"
                    />
                    {formErrors.username && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.username}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-[#787878]">Email address</label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      aria-label="Email address"
                      placeholder="you@example.com"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#BA5B55] focus:ring-2 focus:ring-[#BA5B55]/20 bg-white text-[#1a1a1a]"
                    />
                    {formErrors.email && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-[#787878]">Phone number</label>
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="e.g. +8801234567890"
                      aria-label="Phone number"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#BA5B55] focus:ring-2 focus:ring-[#BA5B55]/20 bg-white text-[#1a1a1a]"
                    />
                    {formErrors.phone && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  <div className="flex justify-end mt-1">
                    <button
                      type="submit"
                      disabled={updatingInfo}
                      className="text-xs font-bold px-4 py-2 bg-[#BA5B55] text-white hover:bg-[#9e4f4a] transition-colors rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {updatingInfo ? "Saving..." : "Save details"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password Manager Form */}
              <div className="border border-[#e2e2e2] rounded-3xl p-5 bg-[#fafafa]/20 shadow-xs flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[#1a1a1a]">
                    {hasPassword ? "Change Password" : "Create Password"}
                  </h4>
                  <p className="text-[11px] text-[#787878] font-light mt-0.5">
                    {hasPassword
                      ? "Verify your current credentials and update your account password."
                      : "Create a password for your account (minimum 6 characters) to enable local login."}
                  </p>
                </div>

                <form onSubmit={handleSavePassword} className="flex flex-col gap-4 text-xs">
                  {hasPassword && (
                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-[#787878]">Current Password</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#BA5B55] bg-white text-[#1a1a1a]"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-[#787878]">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#BA5B55] bg-white text-[#1a1a1a]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-[#787878]">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#BA5B55] bg-white text-[#1a1a1a]"
                    />
                  </div>

                  <div className="flex justify-end mt-1">
                    <button
                      type="submit"
                      disabled={updatingPassword}
                      className="text-xs font-bold px-4 py-2 bg-[#BA5B55] text-white hover:bg-[#9e4f4a] transition-colors rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {updatingPassword ? "Updating..." : hasPassword ? "Change Password" : "Add Password"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Session History */}
              <div className="border border-[#e2e2e2] rounded-3xl p-5 bg-[#fafafa]/20 shadow-xs flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#1a1a1a]">Session History</h4>
                    <p className="text-[11px] text-[#787878] font-light mt-0.5">Logs of active browser sessions logged into your account. Terminate other logins instantly.</p>
                  </div>
                  {activeSessions.filter(s => s.session_id !== user.sessionId).length > 0 && (
                    <button
                      onClick={() => handleRevokeSession(null, true)}
                      className="text-[10px] font-bold text-[#BA5B55] hover:underline cursor-pointer border border-[#BA5B55]/20 bg-[#BA5B55]/5 px-2.5 py-1 rounded-lg"
                    >
                      Log out other devices
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-3 mt-1 text-xs">
                  {activeSessions.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {activeSessions.map((session) => {
                        const isCurrent = session.session_id === user.sessionId;
                        const loginDate = new Date(session.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <div
                            key={session.session_id}
                            className={`flex justify-between items-center p-3 rounded-2xl border ${
                              isCurrent ? "border-[#BA5B55]/30 bg-[#BA5B55]/5" : "border-gray-100 bg-[#fdfdfd]"
                            }`}
                          >
                            <div className="min-w-0 flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#1a1a1a]">
                                  {session.browser_name || "Unknown Browser"} on {session.os_name || "Unknown OS"}
                                </span>
                                {isCurrent && (
                                  <span className="bg-[#BA5B55] text-white text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                                    Current Session
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 font-light mt-0.5">
                                IP: {session.device_ip || "Unknown IP"} · Device: {session.device_type || "Desktop"} · Login: {loginDate}
                              </p>
                            </div>

                            <button
                              onClick={() => handleRevokeSession(session.session_id)}
                              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                isCurrent
                                  ? "border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                                  : "border-gray-200 text-[#555] hover:border-red-500 hover:text-red-500 hover:bg-red-50/10"
                              }`}
                            >
                              Log out
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400 font-light">No sessions returned.</div>
                  )}
                </div>
              </div>

              {/* Danger Zone: Account Deletion */}
              <div className="border border-red-200 rounded-3xl p-5 bg-red-50/10 shadow-xs flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-bold text-red-950">Danger Zone</h4>
                  <p className="text-[11px] text-red-700 font-light mt-0.5">Permanently remove your account and erase all entrepreneur stores, catalogs, and listings from Nashwa.</p>
                </div>

                <div className="flex justify-start">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isPending}
                    className="flex justify-center items-center gap-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Trash stroke={2} size={15} />
                    <span>{isPending ? "Deleting account..." : "Delete Account"}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Large View Photo Modal */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => { setLightboxSrc(null); setLightboxType(null); }} />
          <div className="relative z-10 bg-white border border-[#e2e2e2] shadow-2xl rounded-3xl max-w-lg w-full overflow-hidden flex flex-col items-center">
            
            {/* Modal Header */}
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

            {/* Photo Rendering */}
            <div className="p-6 w-full flex justify-center items-center bg-[#fafafa]">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-150 shadow-sm bg-white">
                <Image src={lightboxSrc} alt="Full view" fill className="object-contain" />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="w-full border-t border-gray-100 px-5 py-4 flex gap-3 justify-end bg-white">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="mt-4 px-4 py-1.5 border border-[#ba5b55] text-[#ba5b55] text-xs font-semibold rounded-full hover:bg-[#ba5b55] hover:text-white transition-colors cursor-pointer"
                >
                  {user.profile_photo_url ? "Change Avatar" : "Upload Avatar"}
                </button>
                {user.profile_photo_url && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto("avatar")}
                    className="mt-4 px-4 py-1.5 border border-red-200 text-red-600 text-xs font-semibold rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      {cropSrc && cropType && (
        <ImageCropModal
          src={cropSrc}
          circularCrop={cropType === "avatar"}
          aspect={1}
          title={"Crop Profile Avatar"}
          onClose={() => {
            setCropSrc(null);
            setCropType(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}

    </div>
  );
}
