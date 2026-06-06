"use client";

import React, { useState, useEffect } from "react";
import { Store, Bell, Cog, Package, ShoppingBag, Users } from "@mynaui/icons-react";
import SwitchToProfileButton from "./SwitchToProfileButton";
import { connectSocket } from "@/lib/socket-client";
import { useNotificationStore } from "@/zustand/notificationStore";

interface ShopNavbarProps {
  shopName: string;
  shopUid: string;
}

const ShopNavbar = ({ shopName, shopUid }: ShopNavbarProps) => {
  const { shopUnreadCount, setShopUnreadCount, resetShopNotifications } = useNotificationStore();

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`/api/notifications?unread_only=true&shopUid=${encodeURIComponent(shopUid)}`, {
        headers: { "X-Requested-With": "XMLHttpRequest" }
      });
      const data = await res.json();
      if (res.ok) {
        setShopUnreadCount(data.total_unread || 0);
      }
    } catch (err) {
      console.error("Error fetching shop unread count:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Listen for local tab read triggers
    const handleRead = () => {
      resetShopNotifications();
    };
    window.addEventListener("shop-notifications:read", handleRead);

    // Listen for real-time order/follow notifications
    const socket = connectSocket();
    const handleNewNotif = (notif?: { shopUid?: string }) => {
      if (notif && notif.shopUid && notif.shopUid === shopUid) {
        fetchUnreadCount();
      }
    };
    socket.on("notification:new", handleNewNotif);

    return () => {
      window.removeEventListener("shop-notifications:read", handleRead);
      socket.off("notification:new", handleNewNotif);
    };
  }, [shopUid]);

  const handleBellClick = () => {
    window.dispatchEvent(new Event("shop-notifications:open"));
  };

  const handleCogClick = () => {
    window.dispatchEvent(new Event("shop-settings:open"));
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => window.dispatchEvent(new Event("shop-posts:open"))}
          >
            <div className="w-10 h-10 rounded-lg bg-[#BA5B55]/10 flex items-center justify-center text-[#BA5B55] border border-[#BA5B55]/20">
              <Store size={22} stroke={1.5} />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#1a1a1a] leading-none mb-1">
                {shopName}
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-600 font-medium leading-none">
                  Active Shop Dashboard
                </span>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block" />

          {/* Quick Nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm text-[#787878]">
            <span className="px-3 py-1.5 rounded-md font-medium text-[#BA5B55] bg-[#BA5B55]/10 cursor-default">
              Overview
            </span>
            <button
              onClick={() => window.dispatchEvent(new Event("shop-orders:open"))}
              className="px-3 py-1.5 rounded-md hover:bg-gray-100 hover:text-[#1a1a1a] transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
            >
              <ShoppingBag size={16} stroke={1.5} />
              <span>Orders</span>
            </button>
            <button
              onClick={() => window.dispatchEvent(new Event("shop-posts:open"))}
              className="px-3 py-1.5 rounded-md hover:bg-gray-100 hover:text-[#1a1a1a] transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
            >
              <Package size={16} stroke={1.5} />
              <span>Products</span>
            </button>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
            <button
              onClick={handleBellClick}
              className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#787878] transition-colors cursor-pointer relative"
              title="Notifications"
            >
              <Bell size={20} stroke={1.5} />
              {shopUnreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1.5 bg-[#BA5B55] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white shadow-xs">
                  {shopUnreadCount}
                </span>
              )}
            </button>
            <button
              onClick={handleCogClick}
              className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#787878] transition-colors cursor-pointer"
              title="Settings"
            >
              <Cog size={20} stroke={1.5} />
            </button>
          </div>

          <SwitchToProfileButton />
        </div>
      </div>
    </header>
  );
};

export default ShopNavbar;
