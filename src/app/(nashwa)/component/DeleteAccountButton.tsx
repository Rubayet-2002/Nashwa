"use client";

import { deleteAccount } from "@/app/(authentication)/lib/deleteAccount";
import { useToastStore } from "@/zustand/toastStore";
import { useUserStore } from "@/zustand/userStore";
import { Trash } from "@mynaui/icons-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const DeleteAccountButton = () => {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const [isPending, startTransition] = useTransition();
  const addToast = useToastStore((s) => s.addToast);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAccount();

      if (result.success) {
        addToast(result.message, "success");
        setUser(null);
        router.push("/");
      } else {
        addToast(result.message, "error");
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="flex justify-center items-center border w-fit px-4 py-1 text-sm leading-none gap-2 border-[#ba5b55] bg-[#ba5b55] text-white hover:bg-white hover:text-[#ba5b55] cursor-pointer"
    >
      <Trash size={24}/>
      <p>Delete account</p>
    </button>
  );
};

export default DeleteAccountButton;
