"use client";

import { useToastStore } from "@/zustand/toastStore";
import { useAuthStore } from "@/zustand/authStore";
import { Hash, Refresh } from "@mynaui/icons-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";

interface OTPFormProps {
  email: string;
  uid: string;
  purpose: string;
}

const OTPForm = ({ email, uid, purpose }: OTPFormProps) => {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const setUser = useAuthStore((s) => s.setUser);

  const handleClientAction = async (prevState: any, formData: FormData) => {
    const otp = formData.get("otp") as string;

    try {
      const response = await fetch("/api/otp-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ email, purpose, otp, uid }),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          redirect: result.redirect,
          message: result.message,
          user: result.user,
          activeShopUid: result.activeShopUid,
          purpose: result.purpose,
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
  const [isResending, startTransition] = useTransition();

  const handleResend = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/resend-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ email, purpose, uid }),
        });

        const result = await response.json();

        if (response.ok) {
          addToast(result.message, "success");
        } else {
          addToast(result.message, "error");
        }
      } catch (error) {
        addToast("Network error! Please try again", "error");
      }
    });
  };

  useEffect(() => {
    if (state?.success) {
      addToast(state.message, "success");

      if (state.purpose === "password-reset") {
        router.replace(state.redirect);
      } else if (state.user) {
        setUser(state.user, state.activeShopUid);
        router.replace(state.redirect);
      }
    } else if (state?.error) {
      addToast(state.error, "error");
    }
  }, [state, addToast, router, setUser]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="purpose" value={purpose} />

      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <Hash color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type="text"
          name="otp"
          placeholder="6-digit code"
          maxLength={6}
          pattern="[0-9]{6}"
          onInput={(e) => {
            if (e.currentTarget.value.length > 6)
              e.currentTarget.value = e.currentTarget.value.slice(0, 6);
          }}
          inputMode="numeric"
          required
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || isResending}
        className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer"
      >
        <p className="leading-none">
          {isPending ? "Verifying..." : "Verify OTP"}
        </p>
      </button>

      <button
        type="button"
        disabled={isPending || isResending}
        onClick={handleResend}
        className="w-full text-sm bg-white hover:text-[#BA5B55] border border-[#787878] hover:border-[#BA5B55] transition-colors flex items-center justify-center gap-2 py-2.5 text-[#23262D] disabled:text-[#787878] disabled:border-transparent cursor-pointer"
      >
        <Refresh size={16} stroke={1.5} />
        <p className="leading-none">
          {isResending ? "Resending..." : "Resend OTP"}
        </p>
      </button>
    </form>
  );
};

export default OTPForm;
