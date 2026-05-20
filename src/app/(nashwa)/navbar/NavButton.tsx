"use client";

import Link from "next/link";
import { useState, useTransition, useRef, useEffect } from "react";
import { useAuthStore } from "@/zustand/authStore";
import {
  Bookmark,
  Bell,
  ChatMessages,
  UserCircle,
  Store,
  User,
} from "@mynaui/icons-react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";

const NavButton = ({ serverUser }: { serverUser: any }) => {
  const { user, isAuthenticated, setActiveShop } = useAuthStore();
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [isPending, startTransition] = useTransition();

  const currentUser = user || serverUser;
  const isAuth = isAuthenticated || !!serverUser;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const approvedShops =
    currentUser?.owned_shops?.filter((s: any) => s.status === "approved") || [];

  const handleSwitch = (shopUid: string | null) => {
    setIsOpen(false);
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
            currentUser?.owned_shops?.find(
              (s: any) => s.shop_uid === shopUid,
            ) || null;
          setActiveShop(selectedShop);
          router.replace(result.redirect);
        } else {
          addToast(result.message || "Switch failed", "error");
        }
      } catch (error) {
        addToast("Network error during switch", "error");
      }
    });
  };

  return (
    <div
      className="flex justify-center items-center gap-10 relative"
      ref={dropdownRef}
    >
      <Link href="/cart">
        <button className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-start justify-center gap-1">
          <div className="flex justify-center items-center gap-1 leading-none">
            <Bookmark stroke={1} size={20} />
            <div>{"(0)"}</div>
          </div>
          <p className="leading-none">Saved posts</p>
        </button>
      </Link>

      <Link href="/notification">
        <button className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-start justify-center gap-1">
          <div className="flex justify-center items-center gap-1 leading-none">
            <Bell stroke={1} size={20} />
            <div>{"(0)"}</div>
          </div>
          <p className="leading-none">Notifications</p>
        </button>
      </Link>

      <Link href="/chat">
        <button className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-start justify-center gap-1">
          <div className="flex justify-center items-center gap-1 leading-none">
            <ChatMessages stroke={1} size={20} />
            <div>{"(0)"}</div>
          </div>
          <p className="leading-none">Messages</p>
        </button>
      </Link>

      {isAuth && currentUser ? (
        approvedShops.length > 0 ? (
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-center justify-center gap-1 outline-none"
            >
              <div className="w-5 h-5 bg-[#888888] text-white text-sm font-medium rounded-full flex justify-center items-center">
                <User stroke={2} size={14} className="mb-px" />
              </div>
              <p className="leading-none">My Account</p>
            </button>

            {isOpen && (
              <div className="absolute right-0 top-12.5 w-70 bg-white border border-[#bababa] px-3 py-6 flex flex-col gap-3">
                <button
                  onClick={() => {
                    router.push("/profile");
                    setIsOpen(false);
                  }}
                  disabled={isPending}
                  className="flex items-center gap-2 px-3 py-3 text-xs text-left w-full cursor-pointer
                 border border-[#bababa] hover:bg-[#eff6ff]"
                >
                  <div className="w-6 h-6 bg-[#888888] text-white text-sm font-medium rounded-full flex justify-center items-center">
                    <User stroke={2} size={16} className="mb-px" />
                  </div>
                  <span>{currentUser.username}</span>
                </button>

                {approvedShops.map((shop: any) => {
                  return (
                    <button
                      key={shop.shop_uid}
                      onClick={() => {
                        handleSwitch(shop.shop_uid);
                      }}
                      disabled={isPending}
                      className="flex items-center gap-2 px-3 py-3 text-xs text-left w-full cursor-pointer
                 border border-[#bababa] hover:bg-[#eff6ff]"
                    >
                      <div className="w-6 h-6 bg-[#888888] text-white text-sm font-medium rounded-full flex justify-center items-center">
                        <Store stroke={1.5} size={16} className="mb-px" />
                      </div>
                      <span>{shop.shop_name} </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <Link href="/profile">
            <button className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-center justify-center gap-1 outline-none">
              <div className="w-5 h-5 bg-[#888888] text-white text-sm font-medium rounded-full flex justify-center items-center">
                <User stroke={2} size={14} className="mb-px" />
              </div>
              <p className="leading-none">My Account</p>
            </button>
          </Link>
        )
      ) : (
        <Link href="/email">
          <button className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-center justify-center gap-1 outline-none">
            <UserCircle stroke={1} size={20} />
            <p className="leading-none">My Account</p>
          </button>
        </Link>
      )}
    </div>
  );
};

export default NavButton;
