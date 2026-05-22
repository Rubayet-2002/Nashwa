"use client";

import Link from "next/link";
import { Mail } from "@mynaui/icons-react";
import { useToastStore } from "@/zustand/toastStore";
import { emailCheck } from "../lib/inputValidation";
import { useActionState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const EmailForm = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      
      const errorMap: Record<string, string> = {
        invalid_session: "Your session expired. Please try again.",
        csrf: "Security check failed. Please refresh the page.",
        no_code: "Google authentication was cancelled or failed.",
        auth_failed: "Could not verify Google account. Please try again.",
        server_error: "A database error occurred. Please try later.",
      };

      const message = errorMap[error] || "An unexpected error occurred.";
      addToast(message, "error");

      router.replace(pathname);
    }
  }, [searchParams, addToast, router, pathname]);

  const handleClientAction = async (prevState: any, formData: FormData) => {
    const email = (formData.get("email") as string).trim();

    const validation = emailCheck.safeParse({
      email,
    });

    const safeValues = { email };

    if (!validation.success) {
      return {
        error: validation.error.issues[0].message,
        values: safeValues,
      };
    }

    try {
      const response = await fetch("/api/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(validation.data),
      });

      const result = await response.json();
      if (response.ok) {
        return {
          success: true,
          isExist: result.exist,
          message: result.message,
          auth_type: result.auth_type,
          user: result.user,
        };
      } else {
        return {
          error: result.message,
          values: safeValues,
        };
      }
    } catch (error) {
      return {
        error: "Network error! Please try again",
        values: safeValues,
      };
    }
  };

  const [state, formAction, isPending] = useActionState(
    handleClientAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      if (state.isExist) {
        if (state.auth_type === "google") {
          addToast(state.message, "success");
        } else {
          router.push("/account-password");
        }
      } else {
        router.push("/proceed-to-create");
      }
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
          name="email"
          placeholder="Enter email"
          defaultValue={state?.values?.email || ""}
          required
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>

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

      <button
        type="submit"
        disabled={isPending}
        className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer"
      >
        <p className="leading-none">
          {isPending ? "Checking email..." : "Continue"}
        </p>
      </button>
      <div className="text-xs flex justify-center items-center leading-none text-[#787878]">
        OR
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          (window.location.href = "/api/google-auth?from=" + pathname)
        }
        className="w-full text-sm bg-white hover:text-[#BA5B55] border border-[#23262D] hover:border-[#BA5B55] transition-colors flex items-center justify-center gap-2 py-2.5 text-[#23262D] disabled:text-[#787878] disabled:border-transparent cursor-pointer"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#d1d5db] bg-white text-[10px] font-bold text-[#4285F4]">G</span>
        <p className="leading-none">Continue with Google</p>
      </button>
    </form>
  );
};

export default EmailForm;
