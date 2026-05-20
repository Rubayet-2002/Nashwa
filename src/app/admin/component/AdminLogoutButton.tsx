"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Logout } from "@mynaui/icons-react";
import { useToastStore } from "@/zustand/toastStore";

const AdminLogoutButton = () => {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/admin/api/logout", {
          method: "POST",
          headers: { "X-Requested-With": "XMLHttpRequest" },
        });
        const result = await response.json();

        if (response.ok) {
          addToast(result.message, "success");
          router.replace(result.redirect);
        } else {
          addToast(result.message || "Logout failed", "error");
        }
      } catch (error) {
        addToast("Network error during logout", "error");
      }
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 bg-[#BA5B55] hover:bg-[#a04e49] text-white text-sm font-medium rounded transition-colors cursor-pointer disabled:opacity-70"
    >
      <Logout size={18} stroke={1.5} />
      <p className="leading-none">{isPending ? "Logging out..." : "Logout"}</p>
    </button>
  );
};

export default AdminLogoutButton;
