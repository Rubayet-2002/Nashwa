"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/zustand/authStore";
import { useToastStore } from "@/zustand/toastStore";
import { connectSocket } from "@/lib/socket-client";
import { Bookmark, Bell, ChatMessages, UserCircle } from "@mynaui/icons-react";
import { useNotificationStore } from "@/zustand/notificationStore";

export default function NavButton({ serverUser }: { serverUser: any }) {
  const { user, isAuthenticated, setActiveShop } = useAuthStore();
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [isPending, startTransition] = useTransition();

  const currentUser = user || serverUser;
  const isAuth = isAuthenticated || !!serverUser;

  const [dropOpen, setDropOpen] = useState(false);
  const { userUnreadCount, setUserUnreadCount, unreadMessagesCount, setUnreadMessagesCount } = useNotificationStore();
  const [isNewNotif, setIsNewNotif] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const fetchSavedCount = () => {
    if (!isAuth || !currentUser) return;
    fetch(`/api/user/saved-count?t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => setSavedCount(d.count || 0))
      .catch(() => {});
  };

  useEffect(() => {
    if (!isAuth || !currentUser) return;
    fetchSavedCount();
    window.addEventListener("saved-posts:updated", fetchSavedCount);
    return () => {
      window.removeEventListener("saved-posts:updated", fetchSavedCount);
    };
  }, [isAuth, currentUser]);

  useEffect(() => {
    if (!isAuth || !currentUser) return;

    fetch("/api/notifications?unread_only=true", {
      headers: { "X-Requested-With": "XMLHttpRequest" },
    })
      .then((r) => r.json())
      .then((d) => setUserUnreadCount(d.total_unread || 0))
      .catch(() => {});

    fetch("/api/chat?unreadCount=true")
      .then((r) => r.json())
      .then((d) => setUnreadMessagesCount(d.unread_count || 0))
      .catch(() => {});

    const socket = connectSocket();
    socket.emit("identify", { uid: currentUser.uid });
    socket.emit("join:product", { productId: `user-${currentUser.uid}` });
    
    const handleNewNotification = (data: { title: string; unread: number }) => {
      if (data.title && data.title.startsWith("New message from")) {
        fetch("/api/chat?unreadCount=true")
          .then((r) => r.json())
          .then((d) => setUnreadMessagesCount(d.unread_count || 0))
          .catch(() => {});
      } else {
        setUserUnreadCount(data.unread);
        setIsNewNotif(true);
        setTimeout(() => setIsNewNotif(false), 1000);
      }
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [isAuth, currentUser]);

  const approvedShops =
    currentUser?.owned_shops?.filter((s: any) => s.status === "approved") || [];

  const handleSwitch = (shopUid: string | null) => {
    setDropOpen(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/switch-shop", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ activeShopUid: shopUid }),
        });
        const result = await res.json();
        if (res.ok) {
          const sel =
            currentUser?.owned_shops?.find(
              (s: any) => s.shop_uid === shopUid,
            ) || null;
          setActiveShop(sel);
          addToast(result.message, "success");
          router.replace(result.redirect);
        } else {
          addToast(result.message || "Switch failed", "error");
        }
      } catch {
        addToast("Network error", "error");
      }
    });
  };

  const handleGuestClick = (message: string) => {
    addToast(message, "error");
    router.push("/email");
  };

  return (
    <div
      className="flex justify-center items-center gap-10 relative"
      ref={dropRef}
    >
      {/* Saved Posts */}
      {isAuth ? (
        <Link href="/saved-posts">
          <button className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-start justify-center gap-1">
            <div className="flex justify-center items-center gap-1 leading-none">
              <Bookmark stroke={1} size={20} />
              <div>{`(${savedCount})`}</div>
            </div>
            <p className="leading-none">Saved posts</p>
          </button>
        </Link>
      ) : (
        <button
          onClick={() => handleGuestClick("Please log in to view saved posts.")}
          className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-start justify-center gap-1 opacity-70"
        >
          <div className="flex justify-center items-center gap-1 leading-none">
            <Bookmark stroke={1} size={20} />
            <div>{`(${savedCount})`}</div>
          </div>
          <p className="leading-none">Saved posts</p>
        </button>
      )}

      {/* Notifications */}
      {isAuth ? (
        <Link href="/notifications">
          <button
            className={`text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-start justify-center gap-1 ${isNewNotif ? "animate-bounce" : ""}`}
          >
            <div className="flex justify-center items-center gap-1 leading-none">
              <Bell
                stroke={1}
                size={20}
                className={userUnreadCount > 0 ? "text-[#BA5B55]" : ""}
              />
              <div>{`(${userUnreadCount})`}</div>
            </div>
            <p className="leading-none">Notifications</p>
          </button>
        </Link>
      ) : (
        <button
          onClick={() =>
            handleGuestClick("Please log in to view notifications.")
          }
          className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-start justify-center gap-1 opacity-70"
        >
          <div className="flex justify-center items-center gap-1 leading-none">
            <Bell stroke={1} size={20} />
            <div>{"(0)"}</div>
          </div>
          <p className="leading-none">Notifications</p>
        </button>
      )}

      {/* Messages */}
      {isAuth ? (
        <Link href="/chat">
          <button className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-start justify-center gap-1">
            <div className="flex justify-center items-center gap-1 leading-none">
              <ChatMessages
                stroke={1}
                size={20}
                className={unreadMessagesCount > 0 ? "text-[#BA5B55]" : ""}
              />
              <div>{`(${unreadMessagesCount})`}</div>
            </div>
            <p className="leading-none">Messages</p>
          </button>
        </Link>
      ) : (
        <button
          onClick={() => handleGuestClick("Please log in to view messages.")}
          className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-start justify-center gap-1 opacity-70"
        >
          <div className="flex justify-center items-center gap-1 leading-none">
            <ChatMessages stroke={1} size={20} />
            <div>{"(0)"}</div>
          </div>
          <p className="leading-none">Messages</p>
        </button>
      )}

      {/* Profile/My Account */}
      {isAuth && currentUser ? (
        <div className="relative">
          <button
            onClick={() => setDropOpen(!dropOpen)}
            className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-center justify-center gap-1 outline-none"
          >
            {currentUser.profile_photo_url ? (
              <img
                src={currentUser.profile_photo_url}
                alt={currentUser.username}
                className="w-5 h-5 rounded-full object-cover border border-[#e2e2e2]"
              />
            ) : (
              <div className="w-5 h-5 bg-[#ba5b55] leading-none text-white text-xs font-semibold rounded-full flex justify-center items-center">
                {currentUser.username[0].toUpperCase()}
              </div>
            )}
            <p className="leading-none">My Account</p>
          </button>

          {dropOpen && (
            <div className="absolute top-[calc(100%+12px)] right-0 bg-white border border-[#dcdcdc] w-60 z-10 flex flex-col p-2">
              <div className="p-2 border-b border-[#dcdcdc] flex flex-col gap-1 leading-none">
                <p className="text-sm font-medium truncate">
                  {currentUser.username}
                </p>
                <p className="text-[10px] text-[#787878] truncate">
                  {currentUser.email}
                </p>
              </div>

              <div className="flex flex-col py-1 border-b border-[#f0f0f0]">
                <Link
                  href="/profile"
                  onClick={() => setDropOpen(false)}
                  className="px-4 py-2 text-left text-xs font-semibold text-[#ba5b55] hover:bg-[#eef7fd] hover:underline transition-colors"
                >
                  My Profile
                </Link>
                <Link
                  href="/profile?tab=orders"
                  onClick={() => setDropOpen(false)}
                  className="px-4 py-2 text-left text-xs font-semibold text-[#ba5b55] hover:bg-[#eef7fd] hover:underline transition-colors"
                >
                  My Orders
                </Link>

                <Link
                  href="/profile?tab=settings"
                  onClick={() => setDropOpen(false)}
                  className="px-4 py-2 text-left text-xs font-semibold text-[#ba5b55] hover:bg-[#eef7fd] hover:underline transition-colors"
                >
                  Settings
                </Link>
              </div>

              {approvedShops.length > 0 && (
                <div className="flex flex-col">
                  <p className="p-2 text-xs text-[#787878]">
                    Switch to Shop
                  </p>
                  {approvedShops.map((s: any) => (
                    <button
                      key={s.shop_uid}
                      onClick={() => handleSwitch(s.shop_uid)}
                      disabled={isPending}
                      className="w-full p-2 border border-[#dcdcdc] flex items-center gap-2 text-left text-xs font-semibold text-gray-700 hover:bg-[#eef7fd] cursor-pointer hover:text-[#BA5B55] transition-colors disabled:opacity-50"
                    >
                      <div className="w-6 h-6 rounded-full bg-white border border-[#ba5b55] flex items-center justify-center text-[10px] font-bold text-[#BA5B55] overflow-hidden shrink-0">
                        {s.profile_photo_url ? (
                          <img
                            src={s.profile_photo_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          s.shop_name?.[0]?.toUpperCase()
                        )}
                      </div>
                      <span className="truncate">{s.shop_name}</span>
                    </button>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      ) : (
        <Link href="/email">
          <button className="text-[#787878] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-center justify-center gap-1 outline-none">
            <UserCircle stroke={1} size={20} />
            <p className="leading-none">My Account</p>
          </button>
        </Link>
      )}
    </div>
  );
}
