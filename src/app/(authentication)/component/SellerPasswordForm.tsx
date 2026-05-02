"use client";

import { Eye, EyeOff, Lock, Mail } from "@mynaui/icons-react";
import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";
import { useUserStore } from "@/zustand/userStore";
import Link from "next/link";

const SellerPasswordForm = ({
  email,
  role,
  needPassword,
}: {
  email: string;
  role: string | null;
  needPassword: boolean;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const setUser = useUserStore((s) => s.setUser);

  const headerText =
    role === "seller"
      ? "Your email is already registered as a seller."
      : "Your email is already registered as a customer.";

  const passwordText =
    role === "seller"
      ? "Please enter your password to access your shop dashboard."
      : needPassword
        ? "To convert your account to a professional account, please enter your password."
        : "To convert your account to a professional account, please click Continue.";

  const handleClientAction = async (prevState: any, formData: FormData) => {
    let body = {};
    if (needPassword) {
      const password = formData.get("password") as string;
      if (!password || password.length < 6)
        return { error: "Password is too short" };
      body = { password };
    }

    try {
      const response = await fetch("/api/seller-check-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (response.ok) {
        return {
          success: true,
          redirect: result.redirect,
          message: result.message,
          user: result.user,
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
      if (state.user) setUser(state.user);
      if (state.redirect) {
        addToast(state.message, "success");
        router.replace(state.redirect);
      } else router.refresh();
    } else if (state?.error) {
      addToast(state.error, "error");
    }
  }, [state, router, addToast, setUser]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-sm"> {headerText}</p>

      <div className="flex justify-center items-center leading-none gap-2 w-fit text-sm">
        <Mail
          color="#787878"
          size={20}
          stroke={1.5}
          className="min-w-4.5 mt-0.5"
        />
        <p>{email}</p>
        <button
          type="button"
          onClick={() =>
            fetch("/api/clear-cookie", { method: "POST" }).then(() =>
              router.refresh(),
            )
          }
          className="text-[#BA5B55] hover:underline w-fit cursor-pointer"
        >
          change
        </button>
      </div>

      <p className="text-sm">{passwordText}</p>

      {needPassword && (
        <>
          <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
            <Lock
              color="#787878"
              size={20}
              stroke={1.5}
              className="min-w-4.5"
            />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter password"
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

          <div className="flex justify-center items-center w-full">
            <Link
              href="/forgot-password"
              className="text-xs text-[#BA5B55] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer"
      >
        <p className="leading-none">{isPending ? "Checking..." : "Continue"}</p>
      </button>
    </form>
  );
};

export default SellerPasswordForm;
