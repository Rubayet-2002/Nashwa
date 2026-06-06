"use client";

import { deleteAccount } from "./deleteAccount";
import { useToastStore } from "@/zustand/toastStore";
import { useAuthStore } from "@/zustand/authStore";
import { Trash } from "@mynaui/icons-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const DeleteAccountButton = () => {
  const router = useRouter();
  const clearUser = useAuthStore((s) => s.clearUser);
  const [isPending, startTransition] = useTransition();
  const addToast = useToastStore((s) => s.addToast);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAccount();

      if (result.success) {
        addToast(result.message, "success");
        clearUser();
        router.replace("/");
      } else {
        addToast(result.message, "error");
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
       className=" text-xs hover:underline cursor-pointer flex justify-center items-center gap-0.5 hover:text-[#ba5b55]"
    >
      <Trash stroke={1.5} size={18} className="text-[#ba5b55]" />
      <p>Delete account</p>
    </button>
  );
};

export default DeleteAccountButton;
