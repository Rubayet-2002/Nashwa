"use client";

import { logoutUser } from "@/app/(authentication)/lib/logout";
import { useToastStore } from "@/zustand/toastStore";
import { useUserStore } from "@/zustand/userStore";
import { Logout } from "@mynaui/icons-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const LogoutButton = () => {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const [isPending, startTransition] = useTransition();
  const addToast = useToastStore((s) => s.addToast);

  const handleLogout = () => {
    startTransition(async () => {
      const result = await logoutUser();

      if (result.success) {
        addToast(result.message, "success");
        setUser(result.user);
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
      className="flex justify-center items-center border w-fit px-4 py-1 text-sm leading-none gap-2 border-[#ba5b55] bg-[#ba5b55] text-white hover:bg-white hover:text-[#ba5b55] cursor-pointer"
    >
      <Logout size={24} />
      <p>Logout</p>
    </button>
  );
};

export default LogoutButton;
