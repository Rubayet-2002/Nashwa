"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Lock, Eye, EyeOff } from "@mynaui/icons-react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/zustand/userStore";
import { useToastStore } from "@/zustand/toastStore";
import { passwordCheck } from "../lib/inputValidation";

interface PasswordFormProps {
  email: string;
}
const PasswordForm = ({ email }: PasswordFormProps) => {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const setUser = useUserStore((s) => s.setUser);

  const [showPassword, setShowPassword] = useState(false);

  const handleClientAction = async (prevState: any, formData: FormData) => {
    const email = (formData.get("email") as string).trim();
    const password = formData.get("password") as string;

    const validation = passwordCheck.safeParse({
      password,
    });

    if (!validation.success) {
      return {
        error: validation.error.issues[0].message,
      };
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ email: email, password: password }),
      });
      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          is_verified: result.is_verified,
          message: result.message,
          user: result.user,
          redirect: result.redirect,
        };
      } else {
        return {
          error: result.message,
        };
      }
    } catch (error) {
      return {
        error: "Network error! Please try again",
      };
    }
  };

  const [state, formAction, isPending] = useActionState(
    handleClientAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      addToast(state.message, "success");
      if (state.is_verified) {
        setUser(state.user);
        router.replace(state.redirect);
      } else {
        router.replace(state.redirect);
      }
    } else if (state?.error) {
      addToast(state.error, "error");
    }
  }, [state, addToast, router, setUser]);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="email" value={email} />

      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <Lock color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
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

      <button
        type="submit"
        disabled={isPending}
        className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer"
      >
        <p className="leading-none">
          {isPending ? "Logging in..." : "Login"}
        </p>
      </button>

      <p className="text-xs text-[#787878] text-center">
        By continuing, you agree to Nashwa's{" "}
        <Link
          href="/terms-conditions"
          className="text-[#BA5B55] hover:underline"
        >
          Terms & Conditions
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="text-[#BA5B55] hover:underline">
          Privacy Policy
        </Link>
      </p>
    </form>
  );
};

export default PasswordForm;
