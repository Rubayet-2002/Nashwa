"use client";

import { Logout } from "@mynaui/icons-react";
import { logout } from "./logout";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToastStore } from "@/zustand/toastStore";
import { useAuthStore } from "@/zustand/authStore";

const LogoutButton = () => {
  const router = useRouter();
  const clearUser = useAuthStore((s) => s.clearUser);
  const [isPending, startTransition] = useTransition();
  const addToast = useToastStore((s) => s.addToast);

  const handleLogout = () => {
    startTransition(async () => {
      const result = await logout();

      if (result.success) {
        addToast(result.message, "success");
        clearUser();
        router.refresh();
        router.replace("/");
      } else {
        addToast(result.message, "error");
      }
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className=" text-xs hover:underline cursor-pointer flex justify-center items-center gap-0.5 hover:text-[#ba5b55]"
    >
      <Logout stroke={1.5} size={18} className="text-[#ba5b55]" />
      <p className="leading-none">Logout</p>
    </button>
  );
};

export default LogoutButton;
