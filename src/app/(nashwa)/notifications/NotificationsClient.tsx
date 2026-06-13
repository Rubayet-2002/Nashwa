"use client";

import { useState, useEffect } from "react";
import { connectSocket } from "@/lib/socket-client";
import { useNotificationStore } from "@/zustand/notificationStore";
import { Bell } from "@mynaui/icons-react";

interface Notification {
  notif_uid: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface Props {
  initialNotifications: Notification[];
  userId: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function NotificationsClient({ initialNotifications, userId }: Props) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [loading, setLoading] = useState(false);
  const resetUserNotifications = useNotificationStore((s) => s.resetUserNotifications);

  useEffect(() => {
    const socket = connectSocket();
    socket.emit("join:user", { userId });

    socket.on("notification:new", (notif: Notification & { shopUid?: string }) => {
      if (notif.shopUid) return;
      setNotifications((prev) => [notif, ...prev]);
    });

    

    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    }).then(() => {
      resetUserNotifications();
    }).catch(() => {});

    return () => { socket.off("notification:new"); };
  }, [userId]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        
        

        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        });
        resetUserNotifications();
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="bg-white border border-[#eadfdb] p-6 rounded-none shadow-none flex flex-col gap-4 text-left">
      <div className="border-b border-[#eadfdb] pb-4 flex justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#1a1a1a]">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-[#BA5B55]/10 text-[#BA5B55] text-[10px] font-semibold rounded-none">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs text-[#787878] mt-0.5 font-light">
            Stay updated on order status, shop approvals, and account updates.
          </p>
        </div>
        <button
          onClick={fetchNotifications}
          disabled={loading}
          className="px-3.5 py-1.5 border border-[#eadfdb] hover:border-[#BA5B55] hover:text-[#BA5B55] transition-all text-[11px] font-semibold rounded-none bg-white cursor-pointer disabled:opacity-50 shrink-0"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-400 font-sans">Loading notifications...</div>
      ) : notifications.length > 0 ? (
        <div className="flex flex-col gap-3 mt-1">
          {notifications.map((notif) => (
            <div
              key={notif.notif_uid}
              className={`p-4 rounded-none border flex gap-3.5 items-start justify-between ${
                notif.is_read
                  ? "border-[#eadfdb]/70 bg-gray-50/30 text-gray-700 font-sans"
                  : "border-[#BA5B55]/20 bg-[#BA5B55]/2 text-[#1a1a1a] font-sans"
              }`}
            >
              <div className="flex gap-3 items-start min-w-0">
                <div className={`p-2 rounded-none shrink-0 ${
                  notif.type === "shop_approved" ? "bg-blue-50 text-blue-600" :
                  notif.type === "order_update" ? "bg-amber-50 text-amber-600" :
                  "bg-[#BA5B55]/10 text-[#BA5B55]"
                }`}>
                  {notif.type === "shop_approved" ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  ) : notif.type === "order_update" ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                  ) : notif.type === "report_action" ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
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
                    {timeAgo(notif.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-[#eadfdb] rounded-none bg-gray-50/20 mt-2">
          <div className="w-12 h-12 bg-[#BA5B55]/10 flex items-center justify-center mx-auto mb-3 rounded-none">
            <Bell stroke={1.5} size={22} className="text-[#BA5B55]" />
          </div>
          <h4 className="text-xs font-bold text-[#1a1a1a]">No notifications yet</h4>
          <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
            Updates about your order activity and community alerts will appear here to keep you informed.
          </p>
        </div>
      )}
    </div>
  );
}
