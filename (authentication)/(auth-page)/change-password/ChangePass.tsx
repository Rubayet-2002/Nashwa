"use client";

import { useToastStore } from "@/zustand/toastStore";
import { useAuthStore } from "@/zustand/authStore";
import { Lock, Eye, EyeOff } from "@mynaui/icons-react";
import { useRouter } from "next/navigation";
import { useState, useActionState, useEffect } from "react";
import { passwordCheck } from "@/app/(authentication)/lib/inputValidation";

interface NewPasswordFormProps {
  email: string;
  uid: string;
}

const ChangePass = ({ email, uid }: NewPasswordFormProps) => {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const clearUser = useAuthStore((s) => s.clearUser);
  const [showPassword, setShowPassword] = useState(false);

  const handleClientAction = async (prevState: any, formData: FormData) => {
    const password = formData.get("new-password") as string;

    const validation = passwordCheck.safeParse({ password });
    if (!validation.success) {
      return { error: validation.error.issues[0].message };
    }

    try {
      const response = await fetch("/api/change-pass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },

        body: JSON.stringify({ email, uid, password }),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: result.message,
          redirect: result.redirect,
        };
      }
      return { error: result.message };
    } catch (error) {
      return { error: "Network error! Please try again" };
    }
  };

  const [state, formAction, isPending] = useActionState(
    handleClientAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      addToast(state.message, "success");
      clearUser();
      router.replace(state.redirect);
    } else if (state?.error) {
      addToast(state.error, "error");
    }
  }, [state, addToast, router, clearUser]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <Lock color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type={showPassword ? "text" : "password"}
          name="new-password"
          placeholder="Enter new password"
          minLength={6}
          required
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="outline-none text-[#787878] hover:text-[#BA5B55] cursor-pointer"
        >
          {showPassword ? (
            <EyeOff size={20} stroke={1.5} />
          ) : (
            <Eye size={20} stroke={1.5} />
          )}
        </button>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer"
      >
        <p className="leading-none">
          {isPending ? "Changing..." : "Change password"}
        </p>
      </button>
    </form>
  );
};

export default ChangePass;
