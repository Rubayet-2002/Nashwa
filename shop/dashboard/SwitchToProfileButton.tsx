"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Store } from "@mynaui/icons-react";
import { useToastStore } from "@/zustand/toastStore";
import { useAuthStore } from "@/zustand/authStore";

const SwitchToProfileButton = () => {
  const { user, activeShop, setActiveShop } = useAuthStore();
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [isPending, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const approvedShops = user?.owned_shops?.filter((s: any) => s.status === "approved") || [];

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
          const selectedShop = user?.owned_shops?.find((s: any) => s.shop_uid === shopUid) || null;
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#BA5B55]/10 hover:bg-[#BA5B55]/20 text-[#BA5B55] border border-[#BA5B55]/30 text-sm font-medium rounded transition-colors cursor-pointer outline-none shadow-xs"
      >
        <div className="w-5 h-5 bg-[#BA5B55] text-white text-xs font-bold rounded-full flex justify-center items-center">
          <p className="leading-none mb-0.5">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </p>
        </div>
        <p className="leading-none font-semibold">{activeShop ? activeShop.shop_name : "My Account"}</p>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 w-56 bg-white border border-[#e5e5e5] shadow-lg rounded p-2 flex flex-col gap-1 z-50 animate-fadeIn text-[#333]">
          <div className="text-[10px] font-bold text-[#888] px-2 py-1 uppercase tracking-wider border-b border-[#f0f0f0] mb-1">
            Quick Switch
          </div>
          <button
            onClick={() => {
              if (!activeShop) {
                router.push("/profile");
                setIsOpen(false);
              } else {
                handleSwitch(null);
              }
            }}
            disabled={isPending}
            className={`flex items-center gap-2 px-3 py-2 text-xs rounded transition-colors text-left w-full cursor-pointer ${
              !activeShop ? "bg-[#BA5B55]/10 text-[#BA5B55] font-semibold" : "text-[#333] hover:bg-[#f9f9f9]"
            }`}
          >
            <User size={16} stroke={1.5} />
            <span className="truncate">My Profile (User Mode)</span>
          </button>

          {approvedShops.map((shop: any) => {
            const isCurrentShop = activeShop?.shop_uid === shop.shop_uid;
            return (
               <button
                key={shop.shop_uid}
                onClick={() => {
                  if (isCurrentShop) {
                    router.push("/shop/dashboard");
                    setIsOpen(false);
                  } else {
                    handleSwitch(shop.shop_uid);
                  }
                }}
                disabled={isPending}
                className={`flex items-center gap-2 px-3 py-2 text-xs rounded transition-colors text-left w-full cursor-pointer ${
                  isCurrentShop ? "bg-[#BA5B55]/10 text-[#BA5B55] font-semibold" : "text-[#333] hover:bg-[#f9f9f9]"
                }`}
              >
                <Store size={16} stroke={1.5} />
                <span className="truncate">{shop.shop_name} (Dashboard)</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SwitchToProfileButton;
