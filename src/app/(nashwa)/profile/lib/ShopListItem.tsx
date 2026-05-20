"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Store } from "@mynaui/icons-react";
import { useToastStore } from "@/zustand/toastStore";
import { useAuthStore } from "@/zustand/authStore";

interface ShopListItemProps {
  shop: {
    shop_uid: string;
    shop_name: string;
    status: string;
  };
}

const ShopListItem = ({ shop }: ShopListItemProps) => {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const { user, setActiveShop } = useAuthStore();
  const [isPending, startTransition] = useTransition();

  const handleShopClick = () => {
    if (shop.status === "pending") {
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
          body: JSON.stringify({ activeShopUid: shop.shop_uid }),
        });
        const result = await response.json();

        if (response.ok) {
          addToast(result.message, "success");
          const selectedShop =
            user?.owned_shops.find((s) => s.shop_uid === shop.shop_uid) || null;
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

  if (shop.status === "pending") {
    return (
      <button
        onClick={handleShopClick}
        className="flex gap justify-start items-center w-full px-3 py-2 gap-2 border border-[#bababa] cursor-pointer hover:shadow-sm hover:bg-[#fefcf2] hover:shadow-[#fffbe9] "
      >
        <Store stroke={1} size={25} className="text-[#787878]" />
        <div className="flex flex-col justify-center items-start text-xs gap-1 border-l px-2 border-[#bababa]">
          <p className="leading-none text-sm">
            {shop.shop_name}
          </p>
          <p className="text-amber-600">Pending Approval</p>
        </div>
      </button>
    );
  }
  else if (shop.status === "approved") {
    return (
      <button
        onClick={handleShopClick}
        className="flex gap justify-start items-center w-full px-3 py-2 gap-2 border border-[#bababa] cursor-pointer hover:shadow-sm hover:bg-[#f2fef4] hover:shadow-[#e9ffef] "
      >
        <Store stroke={1} size={25} className="text-[#787878]" />
        <div className="flex flex-col justify-center items-start text-xs gap-1 border-l px-2 border-[#bababa]">
          <p className="leading-none text-sm">
            {shop.shop_name}
          </p>
          <p className="text-emerald-600">Approved</p>
        </div>
      </button>
    );
  }
};

export default ShopListItem;
