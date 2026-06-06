"use client";

import { useActionState, useEffect, useState } from "react";
import { Lock, Mail, Key, Eye, EyeOff } from "@mynaui/icons-react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";

const AdminLoginForm = () => {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [showPassword, setShowPassword] = useState(false);

  const handleClientAction = async (prevState: any, formData: FormData) => {
    const admin_email = (formData.get("admin_email") as string).trim();
    const password = formData.get("password") as string;

    if (!admin_email || !password) {
      return { error: "All fields are required." };
    }

    try {
      const response = await fetch("/admin/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ admin_email, password }),
      });
      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: result.message,
          redirect: result.redirect,
        };
      } else {
        return { error: result.message };
      }
    } catch (error) {
      return { error: "Network error! Please try again." };
    }
  };

  const [state, formAction, isPending] = useActionState(
    handleClientAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      addToast(state.message, "success");
      router.replace(state.redirect);
    } else if (state?.error) {
      addToast(state.error, "error");
    }
  }, [state, addToast, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">

      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <Mail color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type="email"
          name="admin_email"
          placeholder="Admin Email"
          required
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <Lock color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Enter password"
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
        className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer mt-2"
      >
        <p className="leading-none">
          {isPending ? "Authenticating..." : "Admin Login"}
        </p>
      </button>
    </form>
  );
};

export default AdminLoginForm;
