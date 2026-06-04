"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";
import Logo from "@/app/(nashwa)/navbar/Logo";
import Link from "next/link";
import { Mail } from "@mynaui/icons-react";

interface ForgotPassFormProps {
  email: string;
  uid: string;
}

const ForgotPass = ({ email, uid }: ForgotPassFormProps) => {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);

   const handleForgotPassAction = async (prevState: any) => {
    try {
      const response = await fetch("/api/forgot-pass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          email,
          uid,
          purpose: "password-reset",
        }),
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

  const [state, action, isPending] = useActionState(
    handleForgotPassAction,
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
    <div className="min-w-full flex justify-center">
      <div className="bg-white mt-12 flex flex-col p-6 gap-4 w-full max-w-md border border-gray-100 shadow-sm">
        <Logo />
        <p className="text-sm">
          Please reset your password. You will get an OTP to your email
        </p>

        <div className="flex justify-center items-center leading-none gap-2 w-fit text-sm">
          <Mail
            color="#787878"
            size={20}
            stroke={1.5}
            className="min-w-4.5 mt-0.5"
          />
          <p>{email}</p>

          <Link
            href="/email"
            className="text-[#BA5B55] hover:underline w-fit"
          >
            change
          </Link>
        </div>

        <form action={action}>
          <button
            type="submit"
            disabled={isPending}
            className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer mt-1"
          >
            {isPending ? "Sending OTP..." : "Send password reset OTP"}
          </button>
        </form>

        <div className="flex flex-col leading-none gap-1 w-fit">
          <p className="text-sm">Remember your password?</p>
          <Link
            href="/password"
            className="text-xs text-[#BA5B55] hover:underline"
          >
            Login with password
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPass