"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";

type FollowShopButtonProps = {
  shopUid: string;
  initialIsFollowing: boolean;
  canFollow: boolean;
  variant?: "ghost" | "solid";
  className?: string;
};

export default function FollowShopButton({
  shopUid,
  initialIsFollowing,
  canFollow,
  variant = "ghost",
  className = "",
}: FollowShopButtonProps) {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  const baseClass =
    variant === "solid"
      ? "px-4 py-2 border border-[#BA5B55] bg-[#BA5B55] text-white hover:bg-white hover:text-[#BA5B55]"
      : "px-3 py-1.5 border border-[#eaeaea] text-[#787878] hover:border-[#BA5B55] hover:text-[#BA5B55]";

  const handleClick = () => {
    if (!canFollow) {
      addToast("Please log in to follow shops.", "error");
      router.push("/email");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/shop-follow/toggle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ shopUid }),
        });

        const result = await response.json();

        if (!response.ok) {
          addToast(result.message || "Failed to update follow status.", "error");
          return;
        }

        setIsFollowing(result.isFollowing);
        addToast(result.message || "Follow status updated.", "success");
      } catch (error) {
        addToast("Network error. Please try again.", "error");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-70 ${baseClass} ${className}`}
    >
      {isPending ? "Updating..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
